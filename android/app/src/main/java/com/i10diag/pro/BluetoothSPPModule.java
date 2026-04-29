package com.i10diag.pro;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.io.InputStream;
import java.io.OutputStream;
import java.util.Set;
import java.util.UUID;

public class BluetoothSPPModule extends ReactContextBaseJavaModule {

    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private BluetoothSocket socket;
    private InputStream inputStream;
    private OutputStream outputStream;
    private boolean connected = false;

    public BluetoothSPPModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "BluetoothSPPModule";
    }

    @ReactMethod
    public void getPairedDevices(Promise promise) {
        try {
            BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
            if (adapter == null) {
                promise.reject("ERROR", "Bluetooth non supporté");
                return;
            }

            Set<BluetoothDevice> devices = adapter.getBondedDevices();
            WritableArray array = Arguments.createArray();

            for (BluetoothDevice device : devices) {
                WritableMap map = Arguments.createMap();
                map.putString("name", device.getName() != null ? device.getName() : "Inconnu");
                map.putString("address", device.getAddress());
                array.pushMap(map);
            }

            promise.resolve(array);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void connect(String address, Promise promise) {
        new Thread(() -> {
            try {
                BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
                if (adapter == null) {
                    promise.reject("ERROR", "Bluetooth non supporté");
                    return;
                }

                BluetoothDevice device = adapter.getRemoteDevice(address);
                
                // Fermer toute connexion existante
                if (socket != null) {
                    try { socket.close(); } catch (Exception e) {}
                }

                // Créer socket SPP (comme H-RESET PRO)
                socket = device.createRfcommSocketToServiceRecord(SPP_UUID);
                
                // Annuler la découverte pour accélérer
                adapter.cancelDiscovery();
                
                // Connexion
                socket.connect();
                
                inputStream = socket.getInputStream();
                outputStream = socket.getOutputStream();
                connected = true;

                // Initialiser ELM327
                initELM327();

                promise.resolve(true);
            } catch (Exception e) {
                connected = false;
                promise.reject("ERROR", "Échec connexion: " + e.getMessage());
            }
        }).start();
    }

    private void initELM327() throws Exception {
        String[] commands = {"ATZ\r", "ATE0\r", "ATL0\r", "ATH1\r", "ATS0\r", "ATSP0\r"};
        for (String cmd : commands) {
            sendRaw(cmd);
            Thread.sleep(80);
        }
    }

    @ReactMethod
    public void sendCommand(String command, Promise promise) {
        new Thread(() -> {
            try {
                String response = sendRaw(command);
                promise.resolve(response);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        }).start();
    }

    private String sendRaw(String command) throws Exception {
        if (!connected || outputStream == null || inputStream == null) {
            throw new Exception("Non connecté");
        }

        // Envoyer
        outputStream.write(command.getBytes());
        outputStream.flush();
        Thread.sleep(150);

        // Lire réponse
        StringBuilder response = new StringBuilder();
        long startTime = System.currentTimeMillis();

        while (System.currentTimeMillis() - startTime < 3000) {
            if (inputStream.available() > 0) {
                int b = inputStream.read();
                response.append((char) b);
                if (response.toString().contains(">")) {
                    break;
                }
            }
            Thread.sleep(50);
        }

        return response.toString()
            .replace("\r", "")
            .replace(">", "")
            .replace(command.trim(), "")
            .trim();
    }

    @ReactMethod
    public void disconnect(Promise promise) {
        try {
            connected = false;
            if (inputStream != null) {
                inputStream.close();
                inputStream = null;
            }
            if (outputStream != null) {
                outputStream.close();
                outputStream = null;
            }
            if (socket != null) {
                socket.close();
                socket = null;
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isConnected(Promise promise) {
        promise.resolve(connected);
    }
}
