import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useApp } from '../context/AppContext';
import OBDService from '../services/OBDService';
import { INJECTOR_SPECS, FUEL_REGULATOR, RESET_PROCEDURES } from '../utils/sensorReference';

const C = { bg:'#050810',surface:'#0a0e18',panel:'#0f1520',border:'#1a2535',accent:'#00c8ff',accent2:'#ff6020',green:'#00ff88',yellow:'#ffc800',red:'#ff2050',text:'#b8d0e8',muted:'#3d5570' };

const Btn = ({label, color, onPress, disabled, small}) => (
  <TouchableOpacity style={[st.btn, {borderColor:color, opacity:disabled?0.4:1}, small&&{paddingVertical:7,paddingHorizontal:10}]} onPress={onPress} disabled={disabled}>
    <Text style={[st.btnTxt, {color}, small&&{fontSize:11}]}>{label}</Text>
  </TouchableOpacity>
);

export default function CorrectionScreen() {
  const { state, actions } = useApp();
  const [loading, setLoading] = useState(false);
  const [injOffsets, setInjOffsets] = useState({inj1:0, inj2:0, inj3:0, inj4:0});
  const [fuelTarget, setFuelTarget] = useState('350');
  const [rpmTarget, setRpmTarget] = useState('750');
  const d = state.liveData;
  const connected = state.isConnected;

  const requireConn = () => { if (!connected) { Alert.alert('Non connecté', "Connectez l'ELM327 d'abord."); return false; } return true; };

  const resetAllInjectors = async () => {
    if (!requireConn()) return;
    Alert.alert('🔄 Reset tous les injecteurs','Remettre les 4 corrections IQA à 0 (valeur constructeur) ?',
      [{text:'Annuler',style:'cancel'},{text:'Reset usine',style:'destructive',onPress:async()=>{
        setLoading(true);
        setInjOffsets({inj1:0,inj2:0,inj3:0,inj4:0});
        actions.setCoding({inj1Offset:0,inj2Offset:0,inj3Offset:0,inj4Offset:0});
        setLoading(false);
        Alert.alert('✅ Reset effectué','Corrections IQA = 0 (valeur constructeur)\n\nEffectuez un cycle de conduite pour vérifier.');
      }}]
    );
  };

  const resetFuelAdaptations = async () => {
    if (!requireConn()) return;
    Alert.alert('⚠️ Reset adaptations carburant','Efface LTFT et STFT.\nLe moteur doit réapprendre.\n\nContinuer ?',
      [{text:'Annuler',style:'cancel'},{text:'Reset',style:'destructive',onPress:async()=>{
        setLoading(true);
        await OBDService.resetFuelAdaptations();
        setLoading(false);
        Alert.alert('✅ Reset effectué','LTFT/STFT remis à 0.\n\nProcédure:\n1. Couper contact 30s\n2. Démarrer sans accélérer\n3. Ralenti 10 min\n4. Conduire 20km varié');
      }}]
    );
  };

  const fullFactoryReset = () => {
    Alert.alert(
      '🏭 RESET VALEURS CONSTRUCTEUR COMPLET',
      'Cela va remettre:\n• Tous les offsets injecteurs à 0\n• Pression carbu à 350 kPa\n• RPM ralenti à 750 rpm\n• Effacer les adaptations LTFT/STFT\n\n⚠️ Toutes vos corrections seront perdues !',
      [{text:'Annuler',style:'cancel'},{text:'Reset tout',style:'destructive',onPress:async()=>{
        setLoading(true);
        await OBDService.resetFuelAdaptations();
        setInjOffsets({inj1:0,inj2:0,inj3:0,inj4:0});
        setFuelTarget('350');
        setRpmTarget('750');
        actions.setCoding({inj1Offset:0,inj2Offset:0,inj3Offset:0,inj4Offset:0,fuelPressureTarget:350,idleRpmTarget:750});
        setLoading(false);
        Alert.alert('✅ Reset complet effectué','Toutes les valeurs sont aux réglages constructeur.\n\nEffectuez un cycle de conduite pour réapprentissage.');
      }}]
    );
  };

  return (
    <ScrollView style={st.container}>
      {!connected && (
        <View style={st.warn}><Text style={{color:C.yellow,fontSize:13}}>⚡ Mode démo — Connectez ELM327 pour corrections réelles</Text></View>
      )}
      <Text style={st.section}>💉 CORRECTION INJECTEURS (IQA)</Text>
      <View style={st.card}>
        <Text style={st.cardInfo}>Référence constructeur: 12-16Ω · 152cc/min · 2.0-3.5ms ralenti{'\n'}Équilibre max: ±1.5ms inter-injecteurs</Text>
        <View style={st.injRow}>
          <View style={{flex:1}}><Text style={st.injName}>Tous les injecteurs</Text><Text style={{color:C.muted,fontSize:11}}>Remettre les offsets IQA à 0</Text></View>
          <Btn label="🔄 Reset usine" color={C.yellow} small onPress={resetAllInjectors} disabled={loading}/>
        </View>
      </View>

      <Text style={st.section}>⛽ ADAPTATIONS CARBURANT (LTFT/STFT)</Text>
      <View style={st.card}>
        <View style={st.liveRow}><Text style={st.liveLabel}>LTFT actuel:</Text><Text style={[st.liveVal,{color:Math.abs(d.ltft||0)<=5?C.green:C.red}]}>{d.ltft?d.ltft.toFixed(1)+'%':'N/A'}</Text></View>
        <Text style={st.cardInfo}>Normal: -5% à +5% · Efface les corrections apprises</Text>
        <Btn label="🔄 Reset adaptations carburant" color={C.yellow} onPress={resetFuelAdaptations} disabled={loading}/>
      </View>

      <Text style={st.section}>🏭 RESET COMPLET — VALEURS CONSTRUCTEUR</Text>
      <View style={[st.card,{borderColor:C.red+'40'}]}>
        <Text style={{color:C.red,fontSize:13,marginBottom:12,lineHeight:20}}>⚠️ Remet TOUT aux valeurs d'origine constructeur</Text>
        <Btn label="🏭 TOUT REMETTRE AUX VALEURS CONSTRUCTEUR" color={C.red} onPress={fullFactoryReset} disabled={loading}/>
      </View>

      {loading && (<View style={st.overlay}><ActivityIndicator size="large" color={C.accent}/><Text style={{color:C.accent,marginTop:12,fontSize:14}}>Communication ECM...</Text></View>)}
      <View style={{height:30}}/>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container:{flex:1,backgroundColor:'#050810'},
  warn:{backgroundColor:'#ffc80015',borderWidth:1,borderColor:'#ffc80040',borderRadius:8,padding:12,margin:12,alignItems:'center'},
  section:{color:'#00c8ff',fontSize:10,fontFamily:'monospace',letterSpacing:2,textTransform:'uppercase',padding:12,paddingBottom:6},
  card:{backgroundColor:'#0f1520',borderWidth:1,borderColor:'#1a2535',borderRadius:12,padding:14,marginHorizontal:12,marginBottom:14},
  cardInfo:{color:'#3d5570',fontSize:11,fontFamily:'monospace',marginBottom:12,lineHeight:17},
  injRow:{flexDirection:'row',alignItems:'center',paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#1a2535'},
  injName:{color:'#b8d0e8',fontSize:13,fontWeight:'600',marginBottom:2},
  liveRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8},
  liveLabel:{color:'#b8d0e8',fontSize:13},
  liveVal:{fontSize:20,fontWeight:'700',fontFamily:'monospace'},
  btn:{borderWidth:1,borderRadius:8,paddingVertical:11,paddingHorizontal:14,alignItems:'center'},
  btnTxt:{fontWeight:'700',fontSize:13,letterSpacing:0.5},
  overlay:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'#050810E0',justifyContent:'center',alignItems:'center'},
});
