import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Switch } from 'react-native';
import { useApp } from '../context/AppContext';
import BluetoothService from '../services/BluetoothService';
import OBDService from '../services/OBDService';

const C = { bg:'#050810',surface:'#0a0e18',panel:'#0f1520',border:'#1a2535',accent:'#00c8ff',accent2:'#ff6020',green:'#00ff88',yellow:'#ffc800',red:'#ff2050',text:'#b8d0e8',muted:'#3d5570' };

export default function ConnectionScreen() {
  const { state, actions } = useApp();
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(null);
  const [devices, setDevices] = useState([]);
  const [manual, setManual] = useState('');
  const [manualPort, setManualPort] = useState('35000');
  const [connectionMode, setConnectionMode] = useState('bluetooth'); // 'bluetooth' | 'wifi'
  const [wifiHost, setWifiHost] = useState('192.168.0.10');
  const [wifiPort, setWifiPort] = useState('35000');

  const scan = async () => {
    setScanning(true); setDevices([]);
    try {
      await BluetoothService.initialize(connectionMode);
      const found = await BluetoothService.scanDevices();
      setDevices(found);
      if (!found.length) {
        Alert.alert(
          'Aucun appareil',
          connectionMode === 'bluetooth' 
            ? 'Vérifiez:\n• ELM327 branché\n• Contact ON\n• Bluetooth activé\n• Appareil appairé dans Paramètres Android\n\nOu essayez le mode WiFi.'
            : 'Vérifiez:\n• ELM327 WiFi branché\n• Connecté au WiFi "ELM327"\n• IP: 192.168.0.10'
        );
      }
    } catch(e) { Alert.alert('Erreur', e.message); }
    setScanning(false);
  };

  const connectTo = async (device) => {
    setConnecting(device.address);
    try {
      await OBDService.connect(device.address, { type: device.type, port: device.port });
      actions.setConnection(true, device);
      Alert.alert('✅ Connecté', `${device.name || 'ELM327'} — Lecture en cours`);
    } catch(e) { 
      Alert.alert('❌ Échec', e.message + '\n\nFermez les autres apps OBD2 (Torque, Car Scanner...)\nVérifiez la connexion WiFi si mode WiFi.'); 
    }
    setConnecting(null);
  };

  const disconnect = async () => {
    Alert.alert('Déconnecter ?','',[{text:'Annuler',style:'cancel'},{text:'Oui',style:'destructive',onPress:async()=>{
      await OBDService.disconnect();
      actions.setConnection(false, null);
    }}]);
  };

  const toggleMode = (mode) => {
    setConnectionMode(mode);
    BluetoothService.setConnectionMode(mode);
    setDevices([]);
  };

  return (
    <ScrollView style={{flex:1,backgroundColor:C.bg}}>
      {/* Mode Selector */}
      <View style={cn.modeSelector}>
        <TouchableOpacity 
          style={[cn.modeBtn, connectionMode==='bluetooth' && cn.modeBtnActive]}
          onPress={() => toggleMode('bluetooth')}
        >
          <Text style={[cn.modeBtnText, connectionMode==='bluetooth' && cn.modeBtnTextActive]}>🔵 Bluetooth</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[cn.modeBtn, connectionMode==='wifi' && cn.modeBtnActive]}
          onPress={() => toggleMode('wifi')}
        >
          <Text style={[cn.modeBtnText, connectionMode==='wifi' && cn.modeBtnTextActive]}>📶 WiFi</Text>
        </TouchableOpacity>
      </View>

      {/* Statut */}
      <View style={cn.statusCard}>
        <View style={[cn.dot,{backgroundColor:state.isConnected?C.green:C.muted}]}/>
        <View style={{flex:1}}>
          <Text style={cn.statusTxt}>{state.isConnected?'Connecté':'Déconnecté'}</Text>
          {state.isConnected&&state.connectedDevice&&(
            <Text style={cn.deviceTxt}>{state.connectedDevice.name||'ELM327'} · {state.connectedDevice.address}</Text>
          )}
          {state.ecuInfo?.vin&&<Text style={cn.deviceTxt}>VIN: {state.ecuInfo.vin}</Text>}
        </View>
        {state.isConnected&&(
          <TouchableOpacity style={cn.discBtn} onPress={disconnect}>
            <Text style={{color:C.red,fontSize:12,fontWeight:'700'}}>DÉCONNECTER</Text>
          </TouchableOpacity>
        )}
      </View>

      {!state.isConnected&&(
        <View style={{margin:12,marginTop:0}}>
          {/* WiFi Config */}
          {connectionMode === 'wifi' && (
            <View style={cn.wifiConfig}>
              <Text style={{color:C.muted,fontSize:12,marginBottom:8}}>Configuration WiFi ELM327 :</Text>
              <View style={{flexDirection:'row',gap:8,marginBottom:8}}>
                <TextInput style={[cn.input,{flex:2}]} placeholder="IP (ex: 192.168.0.10)" placeholderTextColor={C.muted} value={wifiHost} onChangeText={setWifiHost}/>
                <TextInput style={[cn.input,{flex:1}]} placeholder="Port" placeholderTextColor={C.muted} value={wifiPort} onChangeText={setWifiPort} keyboardType="numeric"/>
              </View>
              <TouchableOpacity style={cn.scanBtn} onPress={() => connectTo({address:wifiHost,name:'ELM327 WiFi',type:'wifi',port:parseInt(wifiPort)})} disabled={!!connecting}>
                {connecting?<ActivityIndicator color={C.accent}/>:<Text style={cn.scanTxt}>CONNECTER VIA WiFi</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Bluetooth Scan */}
          {connectionMode === 'bluetooth' && (
            <>
              <TouchableOpacity style={cn.scanBtn} onPress={scan} disabled={scanning}>
                {scanning?<ActivityIndicator color={C.accent}/>:<Text style={cn.scanTxt}>🔍 RECHERCHER ELM327 BLUETOOTH</Text>}
              </TouchableOpacity>

              {devices.map(d=>(
                <TouchableOpacity key={d.address} style={cn.device} onPress={()=>connectTo(d)} disabled={!!connecting}>
                  <View style={{flex:1}}>
                    <Text style={cn.dName}>{d.name||'Appareil inconnu'}</Text>
                    <Text style={cn.dAddr}>{d.address}</Text>
                  </View>
                  {connecting===d.address?<ActivityIndicator color={C.accent} size="small"/>:<Text style={{color:C.accent,fontSize:20}}>→</Text>}
                </TouchableOpacity>
              ))}

              <View style={cn.manualSection}>
                <Text style={{color:C.muted,fontSize:12,marginBottom:8}}>Ou entrer l'adresse MAC manuellement :</Text>
                <TextInput style={cn.manualInput} placeholder="00:0D:18:AA:BB:CC" placeholderTextColor={C.muted} value={manual} onChangeText={setManual} autoCapitalize="characters"/>
                <TouchableOpacity style={[cn.scanBtn,{marginTop:8}]} onPress={()=>connectTo({address:manual,name:'ELM327 Manuel',type:'bluetooth'})} disabled={!manual||!!connecting}>
                  <Text style={cn.scanTxt}>{connecting?'Connexion...':'CONNECTER MANUELLEMENT'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

      {/* Guide */}
      <View style={cn.guide}>
        <Text style={cn.guideTitle}>📘 Guide de connexion</Text>
        {connectionMode === 'bluetooth' ? (
          <Text style={cn.guideTxt}>
            {'1. Brancher ELM327 sur prise OBD2\n   (sous le tableau de bord, côté conducteur)\n\n2. Contact voiture en position ON\n\n3. Activer Bluetooth Android\n\n4. Appairer l\'ELM327 dans Paramètres Bluetooth\n   (PIN: 1234 ou 0000)\n\n5. Revenir ici → Rechercher → Sélectionner'}
          </Text>
        ) : (
          <Text style={cn.guideTxt}>
            {'1. Brancher ELM327 WiFi sur prise OBD2\n\n2. Contact voiture en position ON\n\n3. Connecter le téléphone au WiFi "ELM327" ou "WiFi_OBD"\n   (mot de passe: 12345678 ou 00000000)\n\n4. Configurer l\'IP (192.168.0.10 par défaut)\n\n5. Cliquer "CONNECTER VIA WiFi"'}
          </Text>
        )}
        <View style={cn.tip}>
          <Text style={{color:C.yellow,fontSize:12,lineHeight:18}}>
            ⚠️ Fermer Torque ou toute autre app OBD2 avant de connecter. Une seule app peut utiliser la connexion à la fois.{'\n'}
            💡 Le mode WiFi est plus stable que le Bluetooth Classique.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const cn = StyleSheet.create({
  modeSelector: {
    flexDirection:'row', margin:12, marginBottom:0, gap:8,
  },
  modeBtn: {
    flex:1, padding:12, borderRadius:10, borderWidth:1, borderColor:C.border,
    backgroundColor:C.panel, alignItems:'center',
  },
  modeBtnActive: {
    borderColor:C.accent, backgroundColor:C.accent+'15',
  },
  modeBtnText: {
    color:C.muted, fontSize:13, fontWeight:'600',
  },
  modeBtnTextActive: {
    color:C.accent,
  },
  wifiConfig: {
    backgroundColor:C.panel, borderRadius:10, padding:14, marginBottom:12,
    borderWidth:1, borderColor:C.border,
  },
  input: {
    backgroundColor:C.surface, borderWidth:1, borderColor:C.border,
    borderRadius:8, padding:10, color:C.text, fontSize:13, fontFamily:'monospace',
  },
  statusCard:{flexDirection:'row',alignItems:'center',margin:12,padding:14,backgroundColor:C.panel,borderRadius:10,borderWidth:1,borderColor:C.border,gap:10},
  dot:{width:10,height:10,borderRadius:5},
  statusTxt:{color:C.text,fontSize:15,fontWeight:'600',fontFamily:'monospace'},
  deviceTxt:{color:C.muted,fontSize:11,fontFamily:'monospace',marginTop:3},
  discBtn:{borderWidth:1,borderColor:C.red+'50',borderRadius:6,paddingHorizontal:10,paddingVertical:5},
  scanBtn:{backgroundColor:C.accent+'15',borderWidth:1,borderColor:C.accent,borderRadius:10,padding:15,alignItems:'center',marginBottom:12},
  scanTxt:{color:C.accent,fontWeight:'700',fontSize:13,letterSpacing:1},
  device:{flexDirection:'row',alignItems:'center',backgroundColor:C.surface,padding:14,borderRadius:8,borderWidth:1,borderColor:C.border,marginBottom:8},
  dName:{color:C.text,fontSize:14,fontWeight:'500',marginBottom:2},
  dAddr:{color:C.muted,fontSize:11,fontFamily:'monospace'},
  manualSection:{marginTop:16,paddingTop:14,borderTopWidth:1,borderTopColor:C.border},
  manualInput:{backgroundColor:C.surface,borderWidth:1,borderColor:C.border,borderRadius:8,padding:12,color:C.text,fontSize:14,fontFamily:'monospace'},
  guide:{backgroundColor:C.panel,margin:12,padding:16,borderRadius:10,borderWidth:1,borderColor:C.border,marginBottom:24},
  guideTitle:{color:C.accent,fontSize:13,fontWeight:'700',fontFamily:'monospace',marginBottom:12},
  guideTxt:{color:C.text,fontSize:13,lineHeight:22},
  tip:{backgroundColor:C.yellow+'10',borderWidth:1,borderColor:C.yellow+'40',borderRadius:8,padding:12,marginTop:12},
});