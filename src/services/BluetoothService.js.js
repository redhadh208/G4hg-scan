import { Platform, NativeModules, NativeEventEmitter, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { BluetoothNativeModule, UsbSerialModule } = NativeModules;

class BluetoothService {
  constructor() {
    this.connected = false;
    this.connectionType = null; // 'bluetooth_spp' | 'bluetooth_ble' | 'wifi' | 'usb'
    this.socket = null;
    this.eventEmitter = null;
    this.listeners = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.connectionTimeout = 5000;
    this.elmuuid = '00001101-0000-1000-8000-00805F9B34FB';
  }

  // ===== INITIALISATION =====
  async initialize(type = 'bluetooth_spp') {
    this.connectionType = type;
    
    switch (type) {
      case 'bluetooth_spp':
        return await this._initBluetoothSPP();
      case 'bluetooth_ble':
        return await this._initBluetoothBLE();
      case 'wifi':
        return await this._initWiFi();
      case 'usb':
        return await this._initUSB();
      default:
        return false;
    }
  }

  // ===== BLUETOOTH CLASSIQUE SPP (Votre ELM327 actuel) =====
  async _initBluetoothSPP() {
    if (Platform.OS !== 'android') {
      throw new Error('Bluetooth SPP uniquement sur Android');
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

  // ===== BLUETOOTH BLE (Adaptateurs modernes) =====
  async _initBluetoothBLE() {
    // Utilise react-native-ble-manager ou react-native-ble-plx
    try {
      const BleManager = require('react-native-ble-manager').default;
      await BleManager.start({ showAlert: false });
      return true;
    } catch (e) {
      throw new Error('BLE non disponible: ' + e.message);
    }
  }

  // ===== WiFi OBD2 (ELM327 WiFi) =====
  async _initWiFi() {
    // Connexion TCP directe
    return true;
  }

  // ===== USB OTG =====
  async _initUSB() {
    if (Platform.OS !== 'android') {
      throw new Error('USB OTG uniquement sur Android');
    }
    try {
      if (UsbSerialModule) {
        return await UsbSerialModule.initialize();
      }
      throw new Error('Module USB non disponible');
    } catch (e) {
      throw new Error('USB non disponible: ' + e.message);
    }
  }

  // ===== SCAN DES APPAREILS =====
  async scanDevices() {
    switch (this.connectionType) {
      case 'bluetooth_spp':
        return await this._scanBluetoothSPP();
      case 'bluetooth_ble':
        return await this._scanBluetoothBLE();
      case 'wifi':
        return await this._scanWiFiDevices();
      case 'usb':
        return await this._scanUSBDevices();
      default:
        return [];
    }
  }

  async _scanBluetoothSPP() {
    if (Platform.OS === 'android' && BluetoothNativeModule) {
      try {
        const devices = await BluetoothNativeModule.getPairedDevices();
        return devices
          .filter(d => {
            const name = (d.name || '').toUpperCase();
            return name.includes('OBD') || name.includes('ELM') || 
                   name.includes('VGATE') || name.includes('VEEPEAK') ||
                   name.includes('CLKDEVICES') || name.includes('ANDROID') ||
                   name.includes('CARISTA') || name.includes('OBDLINK');
          })
          .map(d => ({
            id: d.address,
            name: d.name || 'ELM327',
            address: d.address,
            type: 'bluetooth_spp',
          }));
      } catch (e) {
        console.error('Scan SPP error:', e);
        return [];
      }
    }
    return [];
  }

  async _scanBluetoothBLE() {
    try {
      const BleManager = require('react-native-ble-manager').default;
      const devices = await BleManager.scan([], 5, true);
      return devices
        .filter(d => {
          const name = (d.name || d.advertising?.localName || '').toUpperCase();
          return name.includes('OBD') || name.includes('ELM') || 
                 name.includes('BLE') || name.includes('VEEPEAK');
        })
        .map(d => ({
          id: d.id,
          name: d.name || d.advertising?.localName || 'ELM327 BLE',
          address: d.id,
          type: 'bluetooth_ble',
        }));
    } catch (e) {
      console.error('Scan BLE error:', e);
      return [];
    }
  }

  async _scanWiFiDevices() {
    return [
      {
        id: 'wifi_default',
        name: 'ELM327 WiFi (192.168.0.10)',
        address: '192.168.0.10',
        port: 35000,
        type: 'wifi',
      },
      {
        id: 'wifi_custom',
        name: 'ELM327 WiFi (Personnalisé)',
        address: '192.168.0.74',
        port: 35000,
        type: 'wifi',
      },
    ];
  }

  async _scanUSBDevices() {
    if (UsbSerialModule) {
      try {
        return await UsbSerialModule.listDevices();
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  // ===== CONNEXION =====
  async connect(target, options = {}) {
    try {
      switch (this.connectionType) {
        case 'bluetooth_spp':
          await this._connectSPP(target);
          break;
        case 'bluetooth_ble':
          await this._connectBLE(target);
          break;
        case 'wifi':
          await this._connectWiFi(target, options.port || 35000);
          break;
        case 'usb':
          await this._connectUSB(target);
          break;
        default:
          throw new Error('Type de connexion non supporté');
      }

      this.connected = true;
      this.reconnectAttempts = 0;
      await this._initELM327();
      return true;
    } catch (e) {
      this.connected = false;
      
      // Reconnexion automatique
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
        await this._sleep(1000);
        return await this.connect(target, options);
      }
      
      throw e;
    }
  }

  async _connectSPP(target) {
    if (BluetoothNativeModule) {
      return await BluetoothNativeModule.connect(target);
    }
    throw new Error('Module SPP non disponible');
  }

  async _connectBLE(deviceId) {
    const BleManager = require('react-native-ble-manager').default;
    await BleManager.connect(deviceId);
    await BleManager.retrieveServices(deviceId);
    return true;
  }

  async _connectWiFi(host, port) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout connexion WiFi: ${host}:${port}`));
      }, this.connectionTimeout);

      try {
        const net = require('react-native-tcp-socket');
        const client = net.createConnection({ host, port }, () => {
          clearTimeout(timeout);
          this.socket = client;
          
          let buffer = '';
          client.on('data', (data) => {
            buffer += data.toString();
          });

          resolve(true);
        });

        client.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      } catch (e) {
        clearTimeout(timeout);
        reject(e);
      }
    });
  }

  async _connectUSB(device) {
    if (UsbSerialModule) {
      return await UsbSerialModule.connect(device);
    }
    throw new Error('Module USB non disponible');
  }

  // ===== INITIALISATION ELM327 =====
  async _initELM327() {
    const commands = [
      'ATZ',    // Reset
      'ATE0',   // Echo off
      'ATL0',   // Line feed off
      'ATH1',   // Headers on
      'ATS0',   // Spaces off
      'ATSP0',  // Auto protocol
      'ATAT1',  // Adaptive timing
      'ATST32', // Timeout 32ms
    ];

    for (const cmd of commands) {
      try {
        await this.sendCommand(cmd);
        await this._sleep(60);
      } catch (e) {
        console.warn(`Commande AT échouée: ${cmd}`, e.message);
      }
    }
  }

  // ===== ENVOI DE COMMANDE =====
  async sendCommand(cmd) {
    if (!this.connected) throw new Error('Non connecté');

    switch (this.connectionType) {
      case 'bluetooth_spp':
        if (BluetoothNativeModule) {
          return await BluetoothNativeModule.sendCommand(cmd);
        }
        break;
      case 'wifi':
        if (this.socket) {
          return await this._sendWiFi(cmd);
        }
        break;
      default:
        throw new Error('Méthode non supportée');
    }
    
    return null;
  }

  async _sendWiFi(cmd) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => resolve(''), 3000);
      let response = '';

      const dataHandler = (data) => {
        response += data.toString();
        if (response.includes('>')) {
          clearTimeout(timeout);
          this.socket.removeListener('data', dataHandler);
          resolve(response.replace(/\r/g, '').replace(/>/g, '').trim());
        }
      };

      this.socket.on('data', dataHandler);
      this.socket.write(cmd + '\r');
    });
  }

  // ===== DÉCONNEXION =====
  async disconnect() {
    this.connected = false;
    
    switch (this.connectionType) {
      case 'bluetooth_spp':
        if (BluetoothNativeModule) {
          await BluetoothNativeModule.disconnect();
        }
        break;
      case 'wifi':
        if (this.socket) {
          this.socket.destroy();
          this.socket = null;
        }
        break;
    }
  }

  // ===== CONFIGURATION =====
  setConnectionType(type) {
    this.connectionType = type;
  }

  getConnectionType() {
    return this.connectionType;
  }

  setElmUUID(uuid) {
    this.elmuuid = uuid;
  }

  getElmUUID() {
    return this.elmuuid;
  }

  setMaxReconnectAttempts(attempts) {
    this.maxReconnectAttempts = attempts;
  }

  setConnectionTimeout(ms) {
    this.connectionTimeout = ms;
  }

  isConnected() {
    return this.connected;
  }

  // ===== SAUVEGARDE DES PARAMÈTRES =====
  async saveConnectionSettings() {
    const settings = {
      connectionType: this.connectionType,
      elmuuid: this.elmuuid,
      maxReconnectAttempts: this.maxReconnectAttempts,
      connectionTimeout: this.connectionTimeout,
    };

    await AsyncStorage.setItem('@i10_connection_settings', JSON.stringify(settings));
  }

  async loadConnectionSettings() {
    try {
      const saved = await AsyncStorage.getItem('@i10_connection_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.connectionType = settings.connectionType || 'bluetooth_spp';
        this.elmuuid = settings.elmuuid || '00001101-0000-1000-8000-00805F9B34FB';
        this.maxReconnectAttempts = settings.maxReconnectAttempts || 3;
        this.connectionTimeout = settings.connectionTimeout || 5000;
      }
    } catch (e) {
      console.warn('Erreur chargement paramètres:', e.message);
    }
  }

  _sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}

export default new BluetoothService();
