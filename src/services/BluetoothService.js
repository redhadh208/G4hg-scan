/**
 * BluetoothService.js — react-native-ble-manager v11.5.2
 *
 * POURQUOI CE CHANGEMENT ?
 * react-native-bluetooth-classic n'a aucune version stable sur npm.
 * Toutes les versions tentées (1.60.0-rc0, 1.70.0-rc2, 2.1.1) échouent.
 * react-native-ble-manager est stable, maintenu, compatible Expo SDK 50.
 */

import { NativeEventEmitter, NativeModules, Platform, PermissionsAndroid } from 'react-native';
import BleManager from 'react-native-ble-manager';

const BleManagerModule = NativeModules.BleManager;
const bleEmitter = new NativeEventEmitter(BleManagerModule);

const SPP_UUID = '00001101-0000-1000-8000-00805F9B34FB';

class BluetoothService {
  constructor() {
    this.deviceId    = null;
    this.connected   = false;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return true;
    await BleManager.start({ showAlert: false });
    this.initialized = true;
    return true;
  }

  async checkPermissions() {
    if (Platform.OS !== 'android') return true;
    try {
      const r = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return Object.values(r).every(s => s === PermissionsAndroid.RESULTS.GRANTED);
    } catch (e) { return false; }
  }

  async scanDevices(sec = 6) {
    await this.initialize();
    await this.checkPermissions();
    return new Promise((resolve) => {
      const found = [], seen = new Set();
      const onStop = bleEmitter.addListener('BleManagerStopScan', () => {
        onStop.remove(); onDisc.remove(); resolve(found);
      });
      const onDisc = bleEmitter.addListener('BleManagerDiscoverPeripheral', (d) => {
        if (seen.has(d.id)) return;
        seen.add(d.id);
        const n = (d.name || '').toUpperCase();
        if (n.includes('ELM') || n.includes('OBD') || n.includes('VGATE') ||
            n.includes('VEEPEAK') || n.includes('OBDII') || n.includes('OBDLINK')) {
          found.push({ address: d.id, name: d.name || 'ELM327', rssi: d.rssi });
        }
      });
      BleManager.scan([], sec, true).catch(() => resolve(found));
    });
  }

  async connect(address) {
    await this.initialize();
    await BleManager.connect(address);
    await BleManager.retrieveServices(address);
    this.deviceId  = address;
    this.connected = true;
    await this._initELM();
    return true;
  }

  async _initELM() {
    for (const cmd of ['ATZ','ATE0','ATL0','ATH0','ATS0','ATSP0','ATAT1','ATST32']) {
      await this._write(cmd + '\r');
      await this._sleep(100);
    }
  }

  async _write(data) {
    const bytes = Array.from(data).map(c => c.charCodeAt(0));
    try {
      await BleManager.writeWithoutResponse(this.deviceId, SPP_UUID, SPP_UUID, bytes);
    } catch {
      await BleManager.write(this.deviceId, SPP_UUID, SPP_UUID, bytes).catch(() => {});
    }
  }

  async send(cmd) {
    if (!this.connected || !this.deviceId) throw new Error('Non connecté');
    await this._write(cmd + '\r');
    return new Promise((resolve) => {
      let buf = '';
      const timer = setTimeout(() => { sub.remove(); resolve(buf.replace(/>/g,'').trim()); }, 600);
      const sub = bleEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', ({ value }) => {
        buf += String.fromCharCode(...value);
        if (buf.includes('>')) { clearTimeout(timer); sub.remove(); resolve(buf.replace(/>/g,'').replace(cmd,'').trim()); }
      });
      BleManager.startNotification(this.deviceId, SPP_UUID, SPP_UUID).catch(() => {
        clearTimeout(timer); sub.remove(); resolve('');
      });
    });
  }

  async readPID(pid) {
    const raw = await this.send(pid);
    if (!raw || raw.includes('NO DATA') || raw.includes('?')) return null;
    try {
      const clean = raw.replace(/\s/g,'').toUpperCase();
      if (!clean.startsWith('41')) return null;
      const bytes = [];
      const hex = clean.substring(4);
      for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.substr(i,2),16));
      return this._calc(pid, bytes);
    } catch { return null; }
  }

  _calc(pid, B) {
    switch(pid) {
      case '010C': return ((B[0]*256)+B[1])/4;
      case '0105': return B[0]-40;
      case '010F': return B[0]-40;
      case '010B': return B[0];
      case '0111': return (B[0]*100)/255;
      case '0114': return B[0]/200;
      case '0115': return B[0]/200;
      case '0142': return ((B[0]*256)+B[1])/1000;
      case '0107': return (B[0]-128)*(100/128);
      case '0106': return (B[0]-128)*(100/128);
      case '0104': return (B[0]*100)/255;
      case '010D': return B[0];
      case '010E': return (B[0]/2)-64;
      case '0110': return ((B[0]*256)+B[1])/100;
      case '010A': return B[0]*3;
      default:     return null;
    }
  }

  async readAllPIDs() {
    const pids = [
      {k:'rpm',p:'010C'},{k:'ect',p:'0105'},{k:'iat',p:'010F'},
      {k:'map',p:'010B'},{k:'tps',p:'0111'},{k:'o2',p:'0114'},
      {k:'o2b',p:'0115'},{k:'batt',p:'0142'},{k:'ltft',p:'0107'},
      {k:'stft',p:'0106'},{k:'load',p:'0104'},{k:'speed',p:'010D'},
      {k:'timing',p:'010E'},{k:'maf',p:'0110'},{k:'fuelPressure',p:'010A'},
    ];
    const out = {};
    for (const {k,p} of pids) { out[k] = await this.readPID(p); await this._sleep(50); }
    return out;
  }

  async readInjectorTimes() {
    return { inj1: null, inj2: null, inj3: null, inj4: null };
  }

  async readDTC() {
    const raw = await this.send('03');
    if (!raw || raw.includes('NO DATA')) return [];
    const map = {'0':'P0','1':'P1','2':'P2','3':'P3','4':'C0','5':'C1','6':'C2','7':'C3','8':'B0','9':'B1','A':'B2','B':'B3','C':'U0','D':'U1','E':'U2','F':'U3'};
    return (raw.replace(/\s/g,'').match(/.{4}/g)||[])
      .filter(p => p !== '0000')
      .map(p => (map[p[0].toUpperCase()]||'P') + p.substring(1));
  }

  async clearDTC() { return await this.send('04'); }

  async readVIN() {
    const raw = await this.send('0902');
    if (!raw) return null;
    let vin = '';
    const clean = raw.replace(/\s/g,'');
    for (let i=6; i<clean.length; i+=2) { const b=parseInt(clean.substr(i,2),16); if(b>0) vin+=String.fromCharCode(b); }
    return vin || null;
  }

  async disconnect() {
    if (this.deviceId) {
      try { await BleManager.disconnect(this.deviceId); } catch {}
      this.deviceId = null; this.connected = false;
    }
  }

  isConnected() { return this.connected && !!this.deviceId; }
  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}

export default new BluetoothService();
