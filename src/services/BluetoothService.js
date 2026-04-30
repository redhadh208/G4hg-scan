import { Platform, PermissionsAndroid, NativeModules } from 'react-native';

class BluetoothService {
  constructor() {
    this.connected = false;
  }

  async initialize() {
    if (Platform.OS !== 'android') throw new Error('Android uniquement');
    
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);

    const allGranted = Object.values(granted).every(
      status => status === PermissionsAndroid.RESULTS.GRANTED
    );

    if (!allGranted) throw new Error('Permissions Bluetooth refusées');
    return true;
  }

  async scanDevices() {
    return new Promise((resolve) => {
      try {
        const { BluetoothSPPModule } = NativeModules;
        
        if (!BluetoothSPPModule) {
          console.log('BluetoothSPPModule non trouvé dans NativeModules');
          resolve([]);
          return;
        }

        BluetoothSPPModule.getPairedDevices()
          .then(devices => {
            const filtered = devices
              .filter(d => {
                const name = (d.name || '').toUpperCase();
                return name.includes('OBD') || name.includes('ELM') || 
                       name.includes('VGATE') || name.includes('CLKDEVICES') ||
                       name.includes('ANDROID') || name.includes('VEEPEAK') ||
                       name.includes('CARISTA') || name.includes('OBDLINK');
              })
              .map(d => ({ ...d, id: d.address }));
            resolve(filtered);
          })
          .catch(e => {
            console.log('getPairedDevices error:', e.message);
            resolve([]);
          });
      } catch (e) {
        console.log('scanDevices exception:', e.message);
        resolve([]);
      }
    });
  }

  async connect(address) {
    return new Promise((resolve, reject) => {
      try {
        const { BluetoothSPPModule } = NativeModules;
        
        if (!BluetoothSPPModule) {
          reject(new Error('Module SPP non disponible. Vérifiez que les fichiers Java sont bien dans android/app/src/main/java/com/i10diag/pro/'));
          return;
        }

        BluetoothSPPModule.connect(address)
          .then(() => {
            this.connected = true;
            resolve(true);
          })
          .catch(e => {
            this.connected = false;
            reject(new Error('Échec connexion SPP: ' + e.message));
          });
      } catch (e) {
        this.connected = false;
        reject(e);
      }
    });
  }

  async sendCommand(cmd) {
    return new Promise((resolve, reject) => {
      const { BluetoothSPPModule } = NativeModules;
      if (!BluetoothSPPModule) {
        reject(new Error('Module SPP non disponible'));
        return;
      }
      BluetoothSPPModule.sendCommand(cmd)
        .then(resolve)
        .catch(reject);
    });
  }

  async disconnect() {
    const { BluetoothSPPModule } = NativeModules;
    if (BluetoothSPPModule) {
      try {
        await BluetoothSPPModule.disconnect();
      } catch (e) {}
    }
    this.connected = false;
  }

  isConnected() { return this.connected; }
}

export default new BluetoothService();
