import { Platform, PermissionsAndroid, NativeModules } from 'react-native';

const { BluetoothSPPModule } = NativeModules;

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
    return Object.values(granted).every(s => s === PermissionsAndroid.RESULTS.GRANTED);
  }

  async scanDevices() {
    if (!BluetoothSPPModule) {
      console.log('BluetoothSPPModule non disponible');
      return [];
    }
    try {
      const devices = await BluetoothSPPModule.getPairedDevices();
      return devices
        .filter(d => {
          const name = (d.name || '').toUpperCase();
          return name.includes('OBD') || name.includes('ELM') || 
                 name.includes('VGATE') || name.includes('CLKDEVICES') ||
                 name.includes('ANDROID') || name.includes('VEEPEAK');
        })
        .map(d => ({ ...d, id: d.address }));
    } catch (e) {
      console.log('Scan error:', e.message);
      return [];
    }
  }

  async connect(address) {
    if (!BluetoothSPPModule) throw new Error('Module SPP non disponible');
    await BluetoothSPPModule.connect(address);
    this.connected = true;
    return true;
  }

  async sendCommand(cmd) {
    if (!this.connected) throw new Error('Non connecté');
    return await BluetoothSPPModule.sendCommand(cmd);
  }

  async disconnect() {
    if (BluetoothSPPModule) await BluetoothSPPModule.disconnect();
    this.connected = false;
  }

  isConnected() { return this.connected; }
  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}

export default new BluetoothService();
