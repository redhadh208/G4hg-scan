import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BluetoothService from '../services/BluetoothService';

const C = {
  bg:'#050810', surface:'#0a0e18', panel:'#0f1520', border:'#1a2535',
  accent:'#00c8ff', accent2:'#ff6020', green:'#00ff88', yellow:'#ffc800',
  red:'#ff2050', text:'#b8d0e8', muted:'#3d5570',
};

const CONNECTION_TYPES = [
  { id: 'bluetooth_spp', label: '🔵 Bluetooth Classique (SPP)', desc: 'Compatible avec la plupart des ELM327 standards' },
  { id: 'bluetooth_ble', label: '🔷 Bluetooth BLE (4.0+)', desc: 'Nécessite un adaptateur BLE compatible' },
  { id: 'wifi', label: '📶 WiFi OBD2', desc: 'Pour adaptateurs ELM327 WiFi (port 35000)' },
  { id: 'usb', label: '🔌 USB OTG', desc: 'Connexion directe par câble USB' },
];

export default function ConnectionSettingsScreen() {
  const [connectionType, setConnectionType] = useState('bluetooth_spp');
  const [elmuuid, setElmuuid] = useState('00001101-0000-1000-8000-00805F9B34FB');
  const [maxReconnect, setMaxReconnect] = useState('3');
  const [timeout, setTimeout] = useState('5000');
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    await BluetoothService.loadConnectionSettings();
    setConnectionType(BluetoothService.getConnectionType());
    setElmuuid(BluetoothService.getElmUUID());
  };

  const saveSettings = async () => {
    BluetoothService.setConnectionType(connectionType);
    BluetoothService.setElmUUID(elmuuid);
    BluetoothService.setMaxReconnectAttempts(parseInt(maxReconnect));
    BluetoothService.setConnectionTimeout(parseInt(timeout));
    
    await BluetoothService.saveConnectionSettings();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ScrollView style={s.container}>
      {/* Titre */}
      <Text style={s.sectionTitle}>🔌 MODE DE CONNEXION</Text>
      
      {/* Sélection du mode */}
      <View style={s.card}>
        {CONNECTION_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[s.optionRow, connectionType === type.id && s.optionRowActive]}
            onPress={() => setConnectionType(type.id)}
          >
            <View style={s.optionInfo}>
              <Text style={[s.optionLabel, connectionType === type.id && s.optionLabelActive]}>
                {type.label}
              </Text>
              <Text style={s.optionDesc}>{type.desc}</Text>
            </View>
            <View style={[s.radio, connectionType === type.id && s.radioActive]}>
              {connectionType === type.id && <View style={s.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Paramètres avancés */}
      <Text style={s.sectionTitle}>⚙️ PARAMÈTRES AVANCÉS</Text>
      
      <View style={s.card}>
        {/* UUID SPP */}
        <Text style={s.inputLabel}>UUID SPP (Bluetooth Classique)</Text>
        <TextInput
          style={s.input}
          value={elmuuid}
          onChangeText={setElmuuid}
          placeholder="00001101-0000-1000-8000-00805F9B34FB"
          placeholderTextColor={C.muted}
          autoCapitalize="characters"
        />
        <Text style={s.inputHint}>
          UUID standard pour connexion série Bluetooth. Ne modifiez que si nécessaire.
        </Text>

        {/* Tentatives de reconnexion */}
        <Text style={[s.inputLabel, { marginTop: 16 }]}>Tentatives de reconnexion max</Text>
        <TextInput
          style={s.input}
          value={maxReconnect}
          onChangeText={setMaxReconnect}
          keyboardType="numeric"
          placeholder="3"
          placeholderTextColor={C.muted}
        />

        {/* Timeout connexion */}
        <Text style={[s.inputLabel, { marginTop: 16 }]}>Timeout connexion (ms)</Text>
        <TextInput
          style={s.input}
          value={timeout}
          onChangeText={setTimeout}
          keyboardType="numeric"
          placeholder="5000"
          placeholderTextColor={C.muted}
        />

        {/* Auto-reconnexion */}
        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchLabel}>Reconnexion automatique</Text>
            <Text style={s.switchDesc}>Tente de se reconnecter en cas de perte</Text>
          </View>
          <Switch
            value={autoReconnect}
            onValueChange={setAutoReconnect}
            trackColor={{ false: C.border, true: C.accent }}
            thumbColor={autoReconnect ? C.green : C.muted}
          />
        </View>

        {/* Mode debug */}
        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchLabel}>Mode debug</Text>
            <Text style={s.switchDesc}>Affiche les commandes AT brutes</Text>
          </View>
          <Switch
            value={debugMode}
            onValueChange={setDebugMode}
            trackColor={{ false: C.border, true: C.accent2 }}
            thumbColor={debugMode ? C.accent2 : C.muted}
          />
        </View>
      </View>

      {/* Bouton sauvegarder */}
      <TouchableOpacity
        style={[s.saveButton, saved && s.saveButtonSuccess]}
        onPress={saveSettings}
      >
        <Text style={s.saveButtonText}>
          {saved ? '✅ Paramètres sauvegardés !' : '💾 Sauvegarder les paramètres'}
        </Text>
      </TouchableOpacity>

      {/* Guide */}
      <View style={s.guideCard}>
        <Text style={s.guideTitle}>📘 Guide de connexion</Text>
        <Text style={s.guideText}>
          {'Bluetooth Classique (SPP) :\n' +
           '• Adaptateurs standards (bleu, noir)\n' +
           '• Appairage dans Paramètres Android requis\n' +
           '• PIN: 1234 ou 0000\n\n' +
           'Bluetooth BLE :\n' +
           '• Adaptateurs modernes (orange, Veepeak)\n' +
           '• Pas d\'appairage préalable nécessaire\n' +
           '• Consomme moins de batterie\n\n' +
           'WiFi OBD2 :\n' +
           '• Connectez-vous au WiFi "ELM327"\n' +
           '• IP: 192.168.0.10, Port: 35000\n' +
           '• Mot de passe: 12345678\n\n' +
           'USB OTG :\n' +
           '• Nécessite câble OTG compatible\n' +
           '• Connexion directe, pas de latence'}
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  sectionTitle: {
    color: C.accent,
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    padding: 16,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: C.panel,
    marginHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  optionRowActive: {
    backgroundColor: C.accent + '15',
    borderWidth: 1,
    borderColor: C.accent + '40',
  },
  optionInfo: { flex: 1, marginRight: 12 },
  optionLabel: { color: C.text, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  optionLabelActive: { color: C.accent },
  optionDesc: { color: C.muted, fontSize: 11 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: { borderColor: C.accent },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.accent,
  },
  inputLabel: { color: C.text, fontSize: 12, fontWeight: '500', marginBottom: 6 },
  input: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 12,
    color: C.text,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  inputHint: { color: C.muted, fontSize: 10, marginTop: 4 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  switchLabel: { color: C.text, fontSize: 13, fontWeight: '500' },
  switchDesc: { color: C.muted, fontSize: 11, marginTop: 2 },
  saveButton: {
    margin: 12,
    backgroundColor: C.accent + '20',
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonSuccess: {
    backgroundColor: C.green + '20',
    borderColor: C.green,
  },
  saveButtonText: {
    color: C.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  guideCard: {
    backgroundColor: C.panel,
    marginHorizontal: 12,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  guideTitle: {
    color: C.accent,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  guideText: {
    color: C.text,
    fontSize: 12,
    lineHeight: 20,
  },
});
