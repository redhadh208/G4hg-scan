import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
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
  const [conMethod, setConMethod] = useState('');

  const scan = async () => {
    setScanning(true); 
    setDevices([]);
    setConMethod('');
    
    try {
      await BluetoothService.initialize();
      const found = await BluetoothService.scanDevices();
      setDevices(found);
      
      if (!found.length) {
        Alert.alert(
          'Aucun ELM327 trouvé',
          'Vérifiez:\n• ELM327 branché sur prise OBD2\n• Contact voiture ON\n• Bluetooth activé\n• ELM327 appairé dans Paramètres Android (PIN: 1234)\n\nSi le problème persiste:\n• Redémarrez le téléphone\n• Essayez un autre adaptateur'
        );
      } else {
        Alert.alert(`${found.length} appareil(s) trouvé(s)`, 'Sélectionnez votre ELM327 dans la liste.');
      }
    } catch(e) { 
      Alert.alert('Erreur de scan', e.message + '\n\nVérifiez les permissions Bluetooth dans les paramètres Android.');
    }
    
    setScanning(false);
  };

  const connectTo = async (device) => {
    setConnecting(device.address);
    
    try {
      await OBDService.connect(device.address);
      const method = BluetoothService.getConnectionMethod();
      setConMethod(method);
      actions.setConnection(true, device);
      Alert.alert('✅ Connecté !', `Méthode: ${method || 'auto'}\nAppareil: ${device.name || 'ELM327'}\n\nLes données arrivent dans le Tableau.`);
    } catch(e) { 
      Alert.alert(
        '❌ Échec de connexion',
        e.message + '\n\nSolutions:\n• Vérifiez que l\'ELM327 est bien appairé\n• Fermez les autres apps OBD2 (Torque)\n• Redémarrez l\'ELM327 (débranchez/rebranchez)\n• Redémarrez le téléphone'
      ); 
    }
    
    setConnecting(null);
  };

  const disconnect = async () => {
    Alert.alert('Déconnecter ?','',[
      {text:'Annuler',style:'cancel'},
      {text:'Oui',style:'destructive',onPress:async()=>{
        await OBDService.disconnect();
        actions.setConnection(false, null);
        setConMethod('');
      }}
    ]);
  };

  return (
    <ScrollView style={{flex:1,backgroundColor:C.bg}}>
      {/* Statut */}
      <View style={cn.statusCard}>
        <View style={[cn.dot,{backgroundColor:state.isConnected?C.green:C.muted}]}/>
        <View style={{flex:1}}>
          <Text style={cn.statusTxt}>{state.isConnected ? '✅ Connecté' : '🔴 Déconnecté'}</Text>
          {state.isConnected && (
            <>
              <Text style={cn.deviceTxt}>{state.connectedDevice?.name||'ELM327'} · {state.connectedDevice?.address}</Text>
              <Text style={cn.methodTxt}>Méthode: {conMethod || 'inconnue'}</Text>
            </>
          )}
        </View>
        {state.isConnected && (
          <TouchableOpacity style={cn.discBtn} onPress={disconnect}>
            <Text style={{color:C.red,fontSize:12,fontWeight:'700'}}>DÉCONNECTER</Text>
          </TouchableOpacity>
        )}
      </View>

      {!state.isConnected && (
        <View style={{margin:12,marginTop:0}}>
          <TouchableOpacity style={cn.scanBtn} onPress={scan} disabled={scanning}>
            {scanning ? (
              <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                <ActivityIndicator color={C.accent}/>
                <Text style={cn.scanTxt}>Recherche en cours... (4 méthodes)</Text>
              </View>
            ) : (
              <Text style={cn.scanTxt}>🔍 RECHERCHER ELM327 (Auto-détection)</Text>
            )}
          </TouchableOpacity>

          <Text style={cn.scanHint}>L'application essaie automatiquement toutes les méthodes de connexion disponibles.</Text>

          {devices.map(d => (
            <TouchableOpacity key={d.address} style={cn.device} onPress={()=>connectTo(d)} disabled={!!connecting}>
              <View style={{flex:1}}>
                <Text style={cn.dName}>{d.name||'Appareil inconnu'}</Text>
                <Text style={cn.dAddr}>{d.address} · {d.method||'auto'}</Text>
              </View>
              {connecting===d.address ? <ActivityIndicator color={C.accent} size="small"/> : <Text style={{color:C.accent,fontSize:20}}>→</Text>}
            </TouchableOpacity>
          ))}

          <View style={cn.manualSection}>
            <Text style={{color:C.muted,fontSize:12,marginBottom:8}}>Ou entrer l'adresse MAC :</Text>
            <TextInput style={cn.manualInput} placeholder="00:1D:A5:08:88:CF" placeholderTextColor={C.muted} value={manual} onChangeText={setManual} autoCapitalize="characters"/>
            <TouchableOpacity style={[cn.scanBtn,{marginTop:8}]} onPress={()=>connectTo({address:manual,name:'ELM327 Manuel',method:'manual'})} disabled={!manual||!!connecting}>
              <Text style={cn.scanTxt}>CONNECTER MANUELLEMENT</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={cn.guide}>
        <Text style={cn.guideTitle}>📘 Guide de connexion</Text>
        <Text style={cn.guideTxt}>
          {'1. Branchez l\'ELM327 sur la prise OBD2\n   (sous le tableau de bord)\n\n2. Contact ON (pas besoin de démarrer)\n\n3. Activez Bluetooth sur le téléphone\n\n4. Appairez l\'ELM327 dans Paramètres Android\n   (PIN: 1234 ou 0000)\n\n5. Revenez ici → RECHERCHER'}
        </Text>
        <View style={cn.tip}>
          <Text style={{color:C.yellow,fontSize:12,lineHeight:18}}>
            ⚠️ L'app essaie 4 méthodes de connexion :{'\n'}
            • Bluetooth natif Android{'\n'}
            • Bluetooth Classique (SPP){'\n'}
            • Bluetooth BLE Manager{'\n'}
            • Bluetooth BLE Plx{'\n\n'}
            Si la connexion échoue, essayez un adaptateur BLE (Veepeak, OBDLink) ou WiFi.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const cn = StyleSheet.create({
  statusCard:{flexDirection:'row',alignItems:'center',margin:12,padding:14,backgroundColor:C.panel,borderRadius:10,borderWidth:1,borderColor:C.border,gap:10},
  dot:{width:10,height:10,borderRadius:5},
  statusTxt:{color:C.text,fontSize:15,fontWeight:'600',fontFamily:'monospace'},
  deviceTxt:{color:C.muted,fontSize:11,fontFamily:'monospace',marginTop:3},
  methodTxt:{color:C.accent,fontSize:10,fontFamily:'monospace',marginTop:2},
  discBtn:{borderWidth:1,borderColor:C.red+'50',borderRadius:6,paddingHorizontal:10,paddingVertical:5},
  scanBtn:{backgroundColor:C.accent+'15',borderWidth:1,borderColor:C.accent,borderRadius:10,padding:15,alignItems:'center',marginBottom:8},
  scanTxt:{color:C.accent,fontWeight:'700',fontSize:13,letterSpacing:1},
  scanHint:{color:C.muted,fontSize:10,textAlign:'center',marginBottom:12,fontStyle:'italic'},
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
