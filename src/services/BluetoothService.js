import { Platform, PermissionsAndroid, NativeModules } from 'react-native';
const { BluetoothSPPModule } = NativeModules;

class BluetoothService {
  constructor() { this.connected = false; }

  async initialize() {
    if (Platform.OS !== 'android') throw new Error('Android only');
    const g = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    return Object.values(g).every(s => s === PermissionsAndroid.RESULTS.GRANTED);
  }

  async scanDevices() {
    if (!BluetoothSPPModule) return [];
    try {
      const devices = await BluetoothSPPModule.getPairedDevices();
      return devices
        .filter(d => (d.name||'').toUpperCase().includes('OBD') || (d.name||'').toUpperCase().includes('ELM') || (d.name||'').toUpperCase().includes('CLKDEVICES'))
        .map(d => ({ ...d, id: d.address }));
    } catch (e) { return []; }
  }

  async connect(address) {
    await BluetoothSPPModule.connect(address);
    this.connected = true;
  }

  async sendCommand(cmd) {
    return await BluetoothSPPModule.sendCommand(cmd);
  }

  async disconnect() {
    if (BluetoothSPPModule) await BluetoothSPPModule.disconnect();
    this.connected = false;
  }

  isConnected() { return this.connected; }
}

export default new BluetoothService();
