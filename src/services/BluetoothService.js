import { Platform, PermissionsAndroid, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { BluetoothNativeModule } = NativeModules;

class BluetoothService {
  constructor() {
    this.connected = false;
    this.connectionMethod = null; // 'native', 'ble-manager', 'ble-plx', 'bluetooth-classic'
    this.device = null;
    this.socket = null;
  }

  // ===== INITIALISATION =====
  async initialize() {
    if (Platform.OS !== 'android') {
      throw new Error('Android uniquement');
    }

    const permissions = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);

    const allGranted = Object.values(permissions).every(
      status => status === PermissionsAndroid.RESULTS.GRANTED
    );

    if (!allGranted) {
      throw new Error('Permissions Bluetooth refusées');
    }

    return true;
  }

  // ===== SCAN - Essaie TOUTES les méthodes =====
  async scanDevices() {
    const allDevices = [];

    // Méthode 1 : Module natif Android (BluetoothManager)
    try {
      const nativeDevices = await this._scanNative();
      allDevices.push(...nativeDevices);
    } catch (e) {
      console.log('Scan natif échoué:', e.message);
    }

    // Méthode 2 : react-native-bluetooth-classic
    try {
      const classicDevices = await this._scanClassic();
      allDevices.push(...classicDevices);
    } catch (e) {
      console.log('Scan Bluetooth Classique échoué:', e.message);
    }

    // Méthode 3 : react-native-ble-manager
    try {
      const bleDevices = await this._scanBLEManager();
      allDevices.push(...bleDevices);
    } catch (e) {
      console.log('Scan BLE Manager échoué:', e.message);
    }

    // Méthode 4 : react-native-ble-plx
    try {
      const blePlxDevices = await this._scanBLEPlx();
      allDevices.push(...blePlxDevices);
    } catch (e) {
      console.log('Scan BLE Plx échoué:', e.message);
    }

    // Filtrer ELM327 et dédoublonner
    const seen = new Set();
    return allDevices
      .filter(d => {
        const name = (d.name || '').toUpperCase();
        return name.includes('OBD') || name.includes('ELM') || 
               name.includes('VGATE') || name.includes('VEEPEAK') ||
               name.includes('CLKDEVICES') || name.includes('ANDROID') ||
               name.includes('CARISTA') || name.includes('OBDLINK');
      })
      .filter(d => {
        if (seen.has(d.address)) return false;
        seen.add(d.address);
        return true;
      });
  }

  // Méthode 1 : Bluetooth Android natif via NativeModules
  async _scanNative() {
    return new Promise((resolve, reject) => {
      try {
        const BluetoothAdapter = require('react-native').NativeModules.BluetoothAdapter;
        if (!BluetoothAdapter) {
          resolve([]);
          return;
        }
        
        // Utiliser l'API Android native pour lister les appareils appairés
        const { BluetoothModule } = NativeModules;
        if (BluetoothModule) {
          BluetoothModule.getBondedDevices((devices) => {
            resolve(devices || []);
          });
        } else {
          resolve([]);
        }
      } catch (e) {
        resolve([]);
      }
    });
  }

  // Méthode 2 : react-native-bluetooth-classic
  async _scanClassic() {
    try {
      const RNBluetoothClassic = require('react-native-bluetooth-classic');
      const paired = await RNBluetoothClassic.getBondedDevices();
      return paired.map(d => ({
        id: d.address,
        name: d.name || 'ELM327',
        address: d.address,
        method: 'bluetooth-classic',
      }));
    } catch (e) {
      return [];
    }
  }

  // Méthode 3 : react-native-ble-manager
  async _scanBLEManager() {
    try {
      const BleManager = require('react-native-ble-manager').default;
      await BleManager.start({ showAlert: false });
      const devices = await BleManager.scan([], 5, true);
      return devices.map(d => ({
        id: d.id,
        name: d.name || d.advertising?.localName || 'ELM327',
        address: d.id,
        method: 'ble-manager',
      }));
    } catch (e) {
      return [];
    }
  }

  // Méthode 4 : react-native-ble-plx
  async _scanBLEPlx() {
    try {
      const { BleManager } = require('react-native-ble-plx');
      const manager = new BleManager();
      
      return new Promise((resolve) => {
        const devices = [];
        
        manager.startDeviceScan(null, null, (error, device) => {
          if (error) {
            resolve(devices);
            return;
          }
          if (device && device.name) {
            devices.push({
              id: device.id,
              name: device.name,
              address: device.id,
              method: 'ble-plx',
            });
          }
        });

        setTimeout(() => {
          manager.stopDeviceScan();
          resolve(devices);
        }, 5000);
      });
    } catch (e) {
      return [];
    }
  }

  // ===== CONNEXION - Essaie TOUTES les méthodes =====
  async connect(address, options = {}) {
    const errors = [];

    // Méthode 1 : Module natif
    try {
      await this._connectNative(address);
      this.connected = true;
      this.connectionMethod = 'native';
      return true;
    } catch (e) {
      errors.push({ method: 'native', error: e.message });
    }

    // Méthode 2 : Bluetooth Classique
    try {
      await this._connectClassic(address);
      this.connected = true;
      this.connectionMethod = 'bluetooth-classic';
      return true;
    } catch (e) {
      errors.push({ method: 'bluetooth-classic', error: e.message });
    }

    // Méthode 3 : BLE Manager
    try {
      await this._connectBLEManager(address);
      this.connected = true;
      this.connectionMethod = 'ble-manager';
      return true;
    } catch (e) {
      errors.push({ method: 'ble-manager', error: e.message });
    }

    // Méthode 4 : BLE Plx
    try {
      await this._connectBLEPlx(address);
      this.connected = true;
      this.connectionMethod = 'ble-plx';
      return true;
    } catch (e) {
      errors.push({ method: 'ble-plx', error: e.message });
    }

    // Toutes les méthodes ont échoué
    throw new Error(
      'Aucune méthode de connexion n\'a fonctionné.\n\n' +
      errors.map(e => `• ${e.method}: ${e.error}`).join('\n')
    );
  }

  async _connectNative(address) {
    return new Promise((resolve, reject) => {
      try {
        const { BluetoothModule } = NativeModules;
        if (!BluetoothModule) {
          reject(new Error('Module natif non disponible'));
          return;
        }
        BluetoothModule.connect(address, (success) => {
          if (success) resolve(true);
          else reject(new Error('Échec connexion native'));
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async _connectClassic(address) {
    const RNBluetoothClassic = require('react-native-bluetooth-classic');
    this.device = await RNBluetoothClassic.connectToDevice(address, {
      delimiter: '\r',
      charset: 'ASCII',
    });
    return true;
  }

  async _connectBLEManager(deviceId) {
    const BleManager = require('react-native-ble-manager').default;
    await BleManager.connect(deviceId);
    await BleManager.retrieveServices(deviceId);
    return true;
  }

  async _connectBLEPlx(deviceId) {
    const { BleManager } = require('react-native-ble-plx');
    const manager = new BleManager();
    const device = await manager.connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();
    return true;
  }

  // ===== ENVOI DE COMMANDE =====
  async sendCommand(cmd) {
    if (!this.connected) throw new Error('Non connecté');

    switch (this.connectionMethod) {
      case 'native':
        return await this._sendNative(cmd);
      case 'bluetooth-classic':
        return await this._sendClassic(cmd);
      default:
        throw new Error('Méthode non supportée pour l\'envoi');
    }
  }

  async _sendNative(cmd) {
    return new Promise((resolve, reject) => {
      const { BluetoothModule } = NativeModules;
      if (!BluetoothModule) {
        reject(new Error('Module natif non disponible'));
        return;
      }
      BluetoothModule.sendCommand(cmd, (response) => {
        resolve(response);
      });
    });
  }

  async _sendClassic(cmd) {
    await this.device.write(cmd + '\r');
    await this._sleep(150);
    let data = '';
    let tries = 0;
    while (tries < 6) {
      const avail = await this.device.available();
      if (avail > 0) {
        data += await this.device.read();
        if (data.includes('>')) break;
      }
      await this._sleep(60);
      tries++;
    }
    return data.replace(/\r/g, '').replace(/>/g, '').replace(cmd, '').trim();
  }

  // ===== LECTURE PID =====
  async readPID(pidCmd) {
    const raw = await this.sendCommand(pidCmd);
    if (!raw || raw.includes('NO DATA') || raw.includes('?')) return null;
    try {
      const clean = raw.replace(/\s/g, '').toUpperCase();
      if (!clean.startsWith('41')) return null;
      const hex = clean.substring(4);
      const bytes = [];
      for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
      }
      return this._calc(pidCmd, bytes);
    } catch (e) {
      return null;
    }
  }

  _calc(pid, B) {
    switch (pid) {
      case '010C': return ((B[0] * 256) + B[1]) / 4;
      case '0105': return B[0] - 40;
      case '010F': return B[0] - 40;
      case '010B': return B[0];
      case '0111': return (B[0] * 100) / 255;
      case '0114': return B[0] / 200;
      case '0115': return B[0] / 200;
      case '0142': return ((B[0] * 256) + B[1]) / 1000;
      case '0107': return (B[0] - 128) * (100 / 128);
      case '0106': return (B[0] - 128) * (100 / 128);
      case '0104': return (B[0] * 100) / 255;
      case '010D': return B[0];
      case '010E': return (B[0] / 2) - 64;
      case '0110': return ((B[0] * 256) + B[1]) / 100;
      case '010A': return B[0] * 3;
      default: return null;
    }
  }

  async readAllPIDs() {
    const pids = [
      { k: 'rpm', p: '010C' }, { k: 'ect', p: '0105' }, { k: 'iat', p: '010F' },
      { k: 'map', p: '010B' }, { k: 'tps', p: '0111' }, { k: 'o2', p: '0114' },
      { k: 'o2b', p: '0115' }, { k: 'batt', p: '0142' }, { k: 'ltft', p: '0107' },
      { k: 'stft', p: '0106' }, { k: 'load', p: '0104' }, { k: 'speed', p: '010D' },
      { k: 'timing', p: '010E' }, { k: 'maf', p: '0110' }, { k: 'fuelPressure', p: '010A' },
    ];
    const out = {};
    for (const { k, p } of pids) {
      out[k] = await this.readPID(p);
      await this._sleep(40);
    }
    return out;
  }

  async readDTC() {
    const raw = await this.sendCommand('03');
    if (!raw || raw.includes('NO DATA')) return [];
    const codes = [];
    const parts = raw.replace(/\s/g, '').match(/.{4}/g) || [];
    for (const p of parts) {
      if (p === '0000') continue;
      const map = { '0': 'P0', '1': 'P1', '2': 'P2', '3': 'P3', '4': 'C0', '5': 'C1', '6': 'C2', '7': 'C3', '8': 'B0', '9': 'B1', 'A': 'B2', 'B': 'B3', 'C': 'U0', 'D': 'U1', 'E': 'U2', 'F': 'U3' };
      codes.push((map[p[0].toUpperCase()] || 'P') + p.substring(1));
    }
    return codes;
  }

  async clearDTC() { return await this.sendCommand('04'); }
  async readVIN() { return null; }

  async disconnect() {
    this.connected = false;
    this.device = null;
  }

  isConnected() { return this.connected; }
  getConnectionMethod() { return this.connectionMethod; }

  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}

export default new BluetoothService();
