import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useApp } from '../context/AppContext';
import { CURRENT_DATA_TABLES } from '../utils/sensorReference';

const { width } = Dimensions.get('window');
const C = {
  bg:'#050810', surface:'#0a0e18', panel:'#0f1520', border:'#1a2535',
  accent:'#00c8ff', accent2:'#ff6020', green:'#00ff88', yellow:'#ffc800',
  red:'#ff2050', text:'#b8d0e8', muted:'#3d5570',
};

export default function CurrentDataScreen() {
  const { state } = useApp();
  const [selectedTable, setSelectedTable] = useState(0);
  const d = state.liveData;

  const getStatusColor = (value, min, max) => {
    if (!value || value === 0) return C.muted;
    if (value >= min && value <= max) return C.green;
    const range = max - min;
    const margin = range * 0.1;
    if (value >= min - margin && value <= max + margin) return C.yellow;
    return C.red;
  };

  const getStatusLabel = (value, min, max) => {
    if (!value || value === 0) return 'N/A';
    if (value >= min && value <= max) return '✅';
    const range = max - min;
    const margin = range * 0.1;
    if (value >= min - margin && value <= max + margin) return '⚠️';
    return '❌';
  };

  const getLiveValue = (sensor) => {
    const val = d[sensor.key];
    if (val === null || val === undefined || val === 0) return null;
    if (sensor.convertToV) {
      if (sensor.key === 'map') return (val * 5 / 255).toFixed(2);
      if (sensor.key === 'tps') return (val * 5 / 100).toFixed(2);
    }
    return val;
  };

  const formatValue = (value, unit) => {
    if (value === null || value === undefined) return '--';
    if (unit === 'V') return Number(value).toFixed(2);
    if (unit === 'ms') return Number(value).toFixed(2);
    if (unit === '%') return Number(value).toFixed(1);
    return Number(value).toFixed(0);
  };

  const currentTable = CURRENT_DATA_TABLES[selectedTable];

  return (
    <View style={s.container}>
      {/* Sélecteur de table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tableSelector} contentContainerStyle={s.tableSelectorContent}>
        {CURRENT_DATA_TABLES.map((table, index) => (
          <TouchableOpacity key={index} style={[s.tableTab, selectedTable === index && s.tableTabActive]} onPress={() => setSelectedTable(index)}>
            <Text style={[s.tableTabText, selectedTable === index && s.tableTabTextActive]}>{table.title}</Text>
            <Text style={s.tableTabRpm}>{table.rpm} rpm</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Condition du test */}
      <View style={s.conditionBanner}>
        <Text style={s.conditionText}>📋 Condition: {currentTable.condition}</Text>
      </View>

      {/* En-tête du tableau */}
      <View style={s.headerRow}>
        <Text style={[s.headerText, s.headerLeft]}>Capteur</Text>
        <Text style={[s.headerText, s.headerCenter]}>Actuel</Text>
        <Text style={[s.headerText, s.headerRight]}>Constructeur</Text>
        <Text style={[s.headerText, s.headerStatus]}>Statut</Text>
      </View>

      {/* Liste des capteurs */}
      <ScrollView style={s.sensorList}>
        {currentTable.sensors.map((sensor, index) => {
          const liveValue = getLiveValue(sensor);
          const statusColor = getStatusColor(liveValue, sensor.targetMin, sensor.targetMax);
          const statusLabel = getStatusLabel(liveValue, sensor.targetMin, sensor.targetMax);

          return (
            <View key={`${sensor.key}_${index}`} style={[s.row, index % 2 === 0 && s.rowEven]}>
              <View style={s.rowLeft}>
                <Text style={s.sensorName}>{sensor.label}</Text>
              </View>
              <View style={s.rowCenter}>
                <Text style={[s.liveValue, { color: statusColor }]}>
                  {liveValue !== null && liveValue !== undefined ? formatValue(liveValue, sensor.unit) : '--'}
                </Text>
                <Text style={s.unitText}>{sensor.unit}</Text>
              </View>
              <View style={s.rowRight}>
                <Text style={s.targetRange}>
                  {sensor.targetMin} ~ {sensor.targetMax} {sensor.unit}
                </Text>
              </View>
              <View style={s.statusCell}>
                <Text style={[s.statusIndicator, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Légende */}
      <View style={s.legend}>
        <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.green }]} /><Text style={s.legendText}>Dans la plage</Text></View>
        <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.yellow }]} /><Text style={s.legendText}>Limite (±10%)</Text></View>
        <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.red }]} /><Text style={s.legendText}>Hors plage</Text></View>
        <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.muted }]} /><Text style={s.legendText}>Pas de données</Text></View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  tableSelector: { maxHeight: 60, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  tableSelectorContent: { paddingHorizontal: 10, paddingVertical: 8, gap: 8 },
  tableTab: { backgroundColor: C.panel, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' },
  tableTabActive: { borderColor: C.accent, backgroundColor: C.accent + '20' },
  tableTabText: { color: C.muted, fontSize: 12, fontWeight: '600' },
  tableTabTextActive: { color: C.accent },
  tableTabRpm: { color: C.muted, fontSize: 9, marginTop: 2, fontFamily: 'monospace' },
  conditionBanner: { backgroundColor: C.accent + '10', borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 14, paddingVertical: 8 },
  conditionText: { color: C.accent, fontSize: 11, fontFamily: 'monospace' },
  headerRow: { flexDirection: 'row', backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' },
  headerText: { color: C.accent, fontSize: 9, fontFamily: 'monospace', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  headerLeft: { flex: 2.5 },
  headerCenter: { flex: 1.5, textAlign: 'center' },
  headerRight: { flex: 2, textAlign: 'center' },
  headerStatus: { width: 40, textAlign: 'center' },
  sensorList: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: C.border + '50' },
  rowEven: { backgroundColor: C.surface + '80' },
  rowLeft: { flex: 2.5 },
  sensorName: { color: C.text, fontSize: 11, fontWeight: '500' },
  rowCenter: { flex: 1.5, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
  liveValue: { fontSize: 16, fontFamily: 'monospace', fontWeight: '700' },
  unitText: { color: C.muted, fontSize: 9, marginLeft: 2 },
  rowRight: { flex: 2, alignItems: 'center' },
  targetRange: { color: C.muted, fontSize: 10, fontFamily: 'monospace' },
  statusCell: { width: 40, alignItems: 'center' },
  statusIndicator: { fontSize: 14, fontWeight: '700' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: C.muted, fontSize: 10 },
});
