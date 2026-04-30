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
                promise.reject("ERR", "Bluetooth non supporté sur cet appareil");
                return;
            }

            Set<BluetoothDevice> devices = adapter.getBondedDevices();
            WritableArray array = Arguments.createArray();

            for (BluetoothDevice d : devices) {
                WritableMap map = Arguments.createMap();
                map.putString("name", d.getName() != null ? d.getName() : "Inconnu");
                map.putString("address", d.getAddress());
                array.pushMap(map);
            }

            promise.resolve(array);
        } catch (Exception e) {
            promise.reject("ERR", e.getMessage());
        }
    }

    @ReactMethod
    public void connect(String address, Promise promise) {
        new Thread(() -> {
            try {
                BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
                if (adapter == null) {
                    promise.reject("ERR", "Bluetooth non supporté");
                    return;
                }

                BluetoothDevice device = adapter.getRemoteDevice(address);

                // Fermer toute connexion existante
                if (socket != null) {
                    try { socket.close(); } catch (Exception e) {}
                }

                // Créer socket SPP (Bluetooth Classique)
                socket = device.createRfcommSocketToServiceRecord(SPP_UUID);
                adapter.cancelDiscovery();
                socket.connect();

                inputStream = socket.getInputStream();
                outputStream = socket.getOutputStream();
                connected = true;

                // Initialiser ELM327
                String[] cmds = {"ATZ\r", "ATE0\r", "ATL0\r", "ATH1\r", "ATS0\r", "ATSP0\r"};
                for (String c : cmds) {
                    outputStream.write(c.getBytes());
                    Thread.sleep(80);
                }

                promise.resolve(true);
            } catch (Exception e) {
                connected = false;
                promise.reject("ERR", "Échec connexion: " + e.getMessage());
            }
        }).start();
    }

    @ReactMethod
    public void sendCommand(String cmd, Promise promise) {
        new Thread(() -> {
            try {
                if (!connected || outputStream == null || inputStream == null) {
                    promise.reject("ERR", "Non connecté");
                    return;
                }

                outputStream.write(cmd.getBytes());
                Thread.sleep(150);

                StringBuilder resp = new StringBuilder();
                long t = System.currentTimeMillis();

                while (System.currentTimeMillis() - t < 3000) {
                    if (inputStream.available() > 0) {
                        resp.append((char) inputStream.read());
                        if (resp.toString().contains(">")) break;
                    }
                    Thread.sleep(50);
                }

                String result = resp.toString()
                    .replace("\r", "")
                    .replace(">", "")
                    .trim();

                promise.resolve(result);
            } catch (Exception e) {
                promise.reject("ERR", e.getMessage());
            }
        }).start();
    }

    @ReactMethod
    public void disconnect(Promise promise) {
        try {
            connected = false;
            if (inputStream != null) inputStream.close();
            if (outputStream != null) outputStream.close();
            if (socket != null) socket.close();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERR", e.getMessage());
        }
    }

    @ReactMethod
    public void isConnected(Promise promise) {
        promise.resolve(connected);
    }
}
