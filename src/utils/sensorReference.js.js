// ================================================================
// BASE DE DONNÉES COMPLÈTE — Hyundai i10 G4HG 1.1L / Bosch M7.9.8
// Inclut les Current Data du manuel constructeur
// ================================================================

// --- Valeurs de référence constructeur pour chaque capteur ---
export const SENSOR_REF = {
  RPM:   { name:'Régime moteur', unit:'rpm', normalMin:700, normalMax:850, coldMin:1000, coldMax:1300, pid:'010C' },
  ECT:   { name:'Temp. liquide refroid.', unit:'°C', normalMin:80, normalMax:95, pid:'0105' },
  IAT:   { name:'Temp. air admission', unit:'°C', normalMin:-20, normalMax:60, pid:'010F' },
  MAP:   { name:'Pression admission', unit:'kPa', normalMin:25, normalMax:45, pid:'010B' },
  MAP_V: { name:'T_MAP Tension', unit:'V', normalMin:3.8, normalMax:4.2, pid:'010B', convertToV: true },
  O2:    { name:'Sonde O2 amont', unit:'V', normalMin:0.2, normalMax:0.8, pid:'0114' },
  O2B:   { name:'Sonde O2 aval', unit:'V', normalMin:0.2, normalMax:0.8, pid:'0115' },
  TPS:   { name:'Position papillon', unit:'%', normalMin:0, normalMax:100, pid:'0111' },
  TPS_V: { name:'TPS Tension', unit:'V', normalMin:0.4, normalMax:4.5, pid:'0111', convertToV: true },
  BATT:  { name:'Tension batterie', unit:'V', normalMin:13.5, normalMax:14.5, pid:'0142' },
  LTFT:  { name:'Correction LT carbu.', unit:'%', normalMin:-5, normalMax:5, pid:'0107' },
  STFT:  { name:'Correction CT carbu.', unit:'%', normalMin:-5, normalMax:5, pid:'0106' },
  LOAD:  { name:'Charge moteur', unit:'%', normalMin:15, normalMax:35, pid:'0104' },
  SPEED: { name:'Vitesse véhicule', unit:'km/h', normalMin:0, normalMax:180, pid:'010D' },
  TIMING:{ name:'Avance allumage', unit:'°', normalMin:5, normalMax:25, pid:'010E' },
  MAF:   { name:'Débit masse air', unit:'g/s', normalMin:2, normalMax:6, pid:'0110' },
  FUEL_P:{ name:'Pression carburant', unit:'kPa', normalMin:330, normalMax:370, pid:'010A' },
};

// ===== CURRENT DATA — Tableaux du manuel constructeur =====
// Ces données sont extraites des pages 38-44 de la revue technique Hyundai i10
export const CURRENT_DATA_TABLES = [
  {
    title: 'Ralenti (Idle)',
    condition: 'Moteur chaud, sans charge électrique, Point Mort',
    rpm: 750,
    sensors: [
      { label: 'RPM Moteur', key: 'rpm', unit: 'rpm', targetMin: 700, targetMax: 850 },
      { label: 'Temp. Moteur (ECT)', key: 'ect', unit: '°C', targetMin: 80, targetMax: 95 },
      { label: 'Temp. Air (IAT)', key: 'iat', unit: '°C', targetMin: 20, targetMax: 50 },
      { label: 'T_MAP Pression', key: 'map', unit: 'kPa', targetMin: 28, targetMax: 38 },
      { label: 'T_MAP Tension', key: 'map', unit: 'V', targetMin: 1.2, targetMax: 1.8, convertToV: true },
      { label: 'TPS Position', key: 'tps', unit: '%', targetMin: 0, targetMax: 3 },
      { label: 'TPS Tension', key: 'tps', unit: 'V', targetMin: 0.4, targetMax: 0.6, convertToV: true },
      { label: 'O2 Amont', key: 'o2', unit: 'V', targetMin: 0.2, targetMax: 0.8 },
      { label: 'Batterie', key: 'batt', unit: 'V', targetMin: 13.5, targetMax: 14.5 },
      { label: 'LTFT', key: 'ltft', unit: '%', targetMin: -5, targetMax: 5 },
      { label: 'STFT', key: 'stft', unit: '%', targetMin: -5, targetMax: 5 },
      { label: 'Charge Moteur', key: 'load', unit: '%', targetMin: 15, targetMax: 25 },
      { label: 'Pression Carburant', key: 'fuelPressure', unit: 'kPa', targetMin: 330, targetMax: 370 },
      { label: 'Avance Allumage', key: 'timing', unit: '°', targetMin: 5, targetMax: 15 },
      { label: 'MAF Débit Air', key: 'maf', unit: 'g/s', targetMin: 2, targetMax: 4 },
      { label: 'Injecteur 1', key: 'inj1', unit: 'ms', targetMin: 2.0, targetMax: 3.5 },
      { label: 'Injecteur 2', key: 'inj2', unit: 'ms', targetMin: 2.0, targetMax: 3.5 },
      { label: 'Injecteur 3', key: 'inj3', unit: 'ms', targetMin: 2.0, targetMax: 3.5 },
      { label: 'Injecteur 4', key: 'inj4', unit: 'ms', targetMin: 2.0, targetMax: 3.5 },
    ]
  },
  {
    title: '1500 rpm',
    condition: 'Moteur chaud, sans charge électrique, Point Mort',
    rpm: 1500,
    sensors: [
      { label: 'RPM Moteur', key: 'rpm', unit: 'rpm', targetMin: 1450, targetMax: 1550 },
      { label: 'Temp. Moteur (ECT)', key: 'ect', unit: '°C', targetMin: 80, targetMax: 95 },
      { label: 'T_MAP Pression', key: 'map', unit: 'kPa', targetMin: 22, targetMax: 32 },
      { label: 'TPS Position', key: 'tps', unit: '%', targetMin: 0, targetMax: 5 },
      { label: 'O2 Amont', key: 'o2', unit: 'V', targetMin: 0.2, targetMax: 0.8 },
      { label: 'Avance Allumage', key: 'timing', unit: '°', targetMin: 20, targetMax: 35 },
      { label: 'MAF Débit Air', key: 'maf', unit: 'g/s', targetMin: 3, targetMax: 7 },
      { label: 'Injecteur 1', key: 'inj1', unit: 'ms', targetMin: 1.8, targetMax: 3.0 },
      { label: 'Injecteur 2', key: 'inj2', unit: 'ms', targetMin: 1.8, targetMax: 3.0 },
      { label: 'Injecteur 3', key: 'inj3', unit: 'ms', targetMin: 1.8, targetMax: 3.0 },
      { label: 'Injecteur 4', key: 'inj4', unit: 'ms', targetMin: 1.8, targetMax: 3.0 },
    ]
  },
  {
    title: '3000 rpm',
    condition: 'Moteur chaud, sans charge électrique, Point Mort',
    rpm: 3000,
    sensors: [
      { label: 'RPM Moteur', key: 'rpm', unit: 'rpm', targetMin: 2950, targetMax: 3050 },
      { label: 'Temp. Moteur (ECT)', key: 'ect', unit: '°C', targetMin: 80, targetMax: 95 },
      { label: 'T_MAP Pression', key: 'map', unit: 'kPa', targetMin: 18, targetMax: 28 },
      { label: 'TPS Position', key: 'tps', unit: '%', targetMin: 0, targetMax: 5 },
      { label: 'O2 Amont', key: 'o2', unit: 'V', targetMin: 0.2, targetMax: 0.8 },
      { label: 'Avance Allumage', key: 'timing', unit: '°', targetMin: 30, targetMax: 45 },
      { label: 'MAF Débit Air', key: 'maf', unit: 'g/s', targetMin: 5, targetMax: 10 },
      { label: 'Injecteur 1', key: 'inj1', unit: 'ms', targetMin: 1.5, targetMax: 2.8 },
      { label: 'Injecteur 2', key: 'inj2', unit: 'ms', targetMin: 1.5, targetMax: 2.8 },
      { label: 'Injecteur 3', key: 'inj3', unit: 'ms', targetMin: 1.5, targetMax: 2.8 },
      { label: 'Injecteur 4', key: 'inj4', unit: 'ms', targetMin: 1.5, targetMax: 2.8 },
    ]
  },
];

// --- Injecteurs — Valeurs constructeur G4HG ---
export const INJECTOR_SPECS = {
  resistance: { min: 12, max: 16, unit: 'Ω', label: 'Résistance bobine' },
  openTime:   { min: 2.0, max: 3.5, unit: 'ms', label: 'Temps ouverture ralenti' },
  balance:    { maxDiff: 1.5, unit: 'ms', label: 'Équilibre inter-injecteurs (max écart)' },
  iqa:        { label: 'IQA (Injector Quantity Adjustment)', range: { min: -4, max: 4, unit: 'mg/coup' } },
  flowRate:   { nominal: 152, unit: 'cc/min', label: 'Débit nominal' },
  corrections: [
    { id: 'inj1', name: 'Injecteur 1 (Cyl.1)', defaultOffset: 0, minOffset: -4, maxOffset: 4 },
    { id: 'inj2', name: 'Injecteur 2 (Cyl.2)', defaultOffset: 0, minOffset: -4, maxOffset: 4 },
    { id: 'inj3', name: 'Injecteur 3 (Cyl.3)', defaultOffset: 0, minOffset: -4, maxOffset: 4 },
    { id: 'inj4', name: 'Injecteur 4 (Cyl.4)', defaultOffset: 0, minOffset: -4, maxOffset: 4 },
  ],
};

// --- Régulateur pression carburant ---
export const FUEL_REGULATOR = {
  name: 'Régulateur pression carburant',
  type: 'Return-less (intégré pompe)',
  nominalPressure: 350,   // kPa
  idlePressure:    330,   // kPa avec dépression
  maxPressure:     380,   // kPa
  minPressure:     300,   // kPa (seuil défaut)
  testProcedure: [
    'Contact ON (pompe amorce 2s)',
    'Brancher manomètre sur rampe injection',
    'Démarrer → mesurer : doit être 330-370 kPa',
    'Couper moteur → pression doit rester > 280 kPa après 5 min',
    'Si chute rapide → injecteur ou clapet anti-retour fuyant',
  ],
};

// --- Codes DTC complets G4HG ---
export const DTC_DB = {
  P0105: { desc:'Circuit capteur MAP/Baro', sev:'high', causes:['MAP défectueux','Fuite dépression','Câblage'], tests:['IG ON: 3.8-4.2V','Continuité ECM pin 78','Fuite dépression'] },
  P0110: { desc:'Circuit capteur IAT', sev:'medium', causes:['IAT défectueux','Connexion','ECM utilise -40°C'], tests:['20°C = 2.3-2.7kΩ','Câblage ECM'] },
  P0115: { desc:'Circuit capteur ECT', sev:'medium', causes:['ECT défectueux','Câblage coupé','Masse'], tests:['80°C = 0.30-0.32kΩ','Tension 1.25V±0.3V à 80°C'] },
  P0120: { desc:'Circuit capteur TPS', sev:'high', causes:['TPS défectueux','Câblage','Alimentation 5V'], tests:['Fermé=0.5V, plein=4.5V','Comparer TPS+MAP'] },
  P0130: { desc:'Sonde O2 amont hors plage', sev:'high', causes:['O2 morte','Fuite échappement','Mélange incorrect'], tests:['0.2-0.8V oscillant','Résistance chauffage 5-7Ω'] },
  P0171: { desc:'Système trop pauvre (Bank 1)', sev:'high', causes:["Fuite air admission","O2 défect.","Pression carbu basse","Injecteur bouché"], tests:['LTFT > +10%','Fumigène admission','Pression carbu 3.5 bar'] },
  P0172: { desc:'Système trop riche (Bank 1)', sev:'high', causes:['Injecteur fuyard','Pression carbu haute','Filtre air bouché'], tests:['LTFT < -10%','Résistance injecteurs 12-16Ω'] },
  P0201: { desc:'Circuit injecteur cylindre 1', sev:'high', causes:['Injecteur HS','Câblage','ECM'], tests:['Résistance 12-16Ω','Son clic à oscillo'] },
  P0202: { desc:'Circuit injecteur cylindre 2', sev:'high', causes:['Injecteur HS','Câblage','ECM'], tests:['Résistance 12-16Ω','Son clic à oscillo'] },
  P0203: { desc:'Circuit injecteur cylindre 3', sev:'high', causes:['Injecteur HS','Câblage','ECM'], tests:['Résistance 12-16Ω','Son clic à oscillo'] },
  P0204: { desc:'Circuit injecteur cylindre 4', sev:'high', causes:['Injecteur HS','Câblage','ECM'], tests:['Résistance 12-16Ω','Son clic à oscillo'] },
  P0300: { desc:'Ratés allumage aléatoires', sev:'high', causes:['Bougies usées','Bobine défect.','Injecteurs'], tests:['Bougies OK?','Résistance bobine 0.82Ω primaire'] },
  P0335: { desc:'Circuit CKP — Pas de signal', sev:'critical', causes:['CKP défect.','Entrefer','Câblage'], tests:['Résistance 800-1200Ω','Entrefer 0.5-1.5mm'] },
  P0340: { desc:'Circuit CMP — Pas de signal', sev:'high', causes:['CMP défect.','Câblage','Roue cible'], tests:['Comparer formes CKP+CMP','Alimentation 12V'] },
  P0480: { desc:'Circuit commande ventilateur', sev:'medium', causes:['Relais venti HS','Câblage','Moteur venti'], tests:['Tester relais','Alimentation moteur venti'] },
  P0505: { desc:'Système contrôle ralenti (ISA)', sev:'medium', causes:['ISA encrassé','Bobine HS','Fuite air'], tests:['250Hz PWM','Résistance 10-14Ω','Nettoyer canal'] },
  P0560: { desc:'Tension système OBD hors plage', sev:'medium', causes:['Alternateur','Batterie','Câblage'], tests:['Marche: 13.5-14.5V','Test alternateur'] },
  P0A0F: { desc:'Circuit régulateur pression carbu.', sev:'high', causes:['Régulateur HS','Pompe faible','Fuite rampe'], tests:['Pression ralenti 330-370kPa','Tenir coupé 5min >280kPa'] },
};

// --- Points de masse G4HG ---
export const GROUND_POINTS = [
  { id:'g1', name:'Batt(−) → Carrosserie', max:0.1, location:'Aile gauche avant' },
  { id:'g2', name:'Batt(−) → Bloc moteur', max:0.1, location:'Support démarreur' },
  { id:'g3', name:'Bloc → Carrosserie', max:0.1, location:'Tresse de masse' },
  { id:'g4', name:'ECM → Carrosserie', max:0.05, location:'Boîtier ECM (pin 25,26)' },
  { id:'g5', name:'Masse capteurs (5V ref)', max:0.05, location:'Collecteur admission' },
];

// --- Liste complète des capteurs et connecteurs G4HG ---
export const ALL_SENSORS_CONNECTORS = [
  { id:'ckp', cat:'Moteur', name:'CKP — Capteur vilebrequin', type:'Hall IC', pins:'ECM 15,16', normal:'Signal carré 0-5V', testMethod:'Oscillo ou fréquence-mètre', pid:null },
  { id:'cmp', cat:'Moteur', name:'CMP — Capteur arbre à cames', type:'Hall IC', pins:'ECM 13,14', normal:'Signal carré 0-5V', testMethod:'Oscillo, comparer avec CKP', pid:null },
  { id:'map', cat:'Moteur', name:'T_MAP — Pression + Temp. air', type:'Analogique', pins:'ECM 78,79,80', normal:'IG ON: 3.8-4.2V', testMethod:'Voltmètre', pid:'010B' },
  { id:'ect', cat:'Moteur', name:'ECT — Temp. liquide refroid.', type:'NTC', pins:'ECM 45,46', normal:'80°C = 0.95-1.55V', testMethod:'Voltmètre/ohmmètre', pid:'0105' },
  { id:'iat', cat:'Moteur', name:'IAT — Temp. air admission', type:'NTC (dans MAP)', pins:'Intégré MAP', normal:'20°C = 3.3-3.7V', testMethod:'Voltmètre', pid:'010F' },
  { id:'tps', cat:'Moteur', name:'TPS — Position papillon', type:'Potentiomètre', pins:'ECM 54,55,56', normal:'Fermé: 0.4-0.6V / Plein: 4.5V', testMethod:'Voltmètre scope', pid:'0111' },
  { id:'o2up', cat:'Moteur', name:'O2 Amont — Sonde lambda', type:'Zirconie chauffée', pins:'ECM 36,5,37', normal:'0.2-0.8V oscillant', testMethod:'Voltmètre/oscillo', pid:'0114' },
  { id:'o2dn', cat:'Moteur', name:'O2 Aval — Sonde lambda', type:'Zirconie chauffée', pins:'ECM 38,6,39', normal:'0.2-0.8V stable', testMethod:'Voltmètre/oscillo', pid:'0115' },
  { id:'knock', cat:'Moteur', name:'Knock — Capteur cliquetis', type:'Piézoélectrique', pins:'ECM 18,19', normal:'Signal variable, 20±5Nm', testMethod:'Oscillo, frapper bloc', pid:null },
  { id:'maf', cat:'Moteur', name:'MAF — Débitmètre air', type:'Fil chaud', pins:'ECM 22,23', normal:'Ralenti: 2-6 g/s', testMethod:'Données OBD2', pid:'0110' },
  { id:'coil', cat:'Allumage', name:'DLI — Bobine allumage (×4)', type:'Bobine mold', pins:'ECM 60-63', normal:'Primaire 0.82Ω±10%', testMethod:'Ohmmètre', pid:null },
  { id:'inj1', cat:'Injection', name:'Injecteur 1 — Cylindre 1', type:'Solénoïde', pins:'ECM 91', normal:'12-16Ω / 2-3.5ms', testMethod:'Ohmmètre + stéthoscope', pid:null },
  { id:'inj2', cat:'Injection', name:'Injecteur 2 — Cylindre 2', type:'Solénoïde', pins:'ECM 92', normal:'12-16Ω / 2-3.5ms', testMethod:'Ohmmètre + stéthoscope', pid:null },
  { id:'inj3', cat:'Injection', name:'Injecteur 3 — Cylindre 3', type:'Solénoïde', pins:'ECM 93', normal:'12-16Ω / 2-3.5ms', testMethod:'Ohmmètre + stéthoscope', pid:null },
  { id:'inj4', cat:'Injection', name:'Injecteur 4 — Cylindre 4', type:'Solénoïde', pins:'ECM 94', normal:'12-16Ω / 2-3.5ms', testMethod:'Ohmmètre + stéthoscope', pid:null },
  { id:'freg', cat:'Injection', name:'Régulateur pression carbu.', type:'Électronique', pins:'Pompe/Rampe', normal:'330-370 kPa ralenti', testMethod:'Manomètre carburant', pid:'010A' },
  { id:'isa', cat:'Admission', name:'ISA — Actuateur ralenti', type:'Double bobine', pins:'ECM 70,71', normal:'250Hz, 10-14Ω', testMethod:'Fréquencemètre + ohmmètre', pid:null },
  { id:'batt', cat:'Électrique', name:'Batterie — Tension', type:'Mesure directe', pins:'ECM 1,2', normal:'Marche: 13.5-14.5V', testMethod:'Voltmètre', pid:'0142' },
  { id:'grnd1', cat:'Électrique', name:'Masse moteur → carrosserie', type:'Câble masse', pins:'Tresse moteur', normal:'< 0.1V de chute', testMethod:'Voltmètre (chute tension)', pid:null },
  { id:'tstat', cat:'Refroid.', name:'Thermostat', type:'Mécanique', pins:'Sortie moteur', normal:'Ouverture 82°C → Plein 95°C', testMethod:'Casserole eau + thermomètre', pid:null },
];

// --- Procédures de reset valeurs constructeur ---
export const RESET_PROCEDURES = {
  fuelAdaptations: {
    name: 'Reset adaptations carburant (LTFT/STFT)',
    cmd: '04',
    steps: [
      'Brancher ELM327, contact ON',
      'Envoyer commande 04 (efface codes + adaptations)',
      'Couper contact 30 secondes',
      'Démarrer sans appuyer sur accélérateur',
      'Laisser ralenti 10 minutes',
      'Rouler 20km en variant les régimes',
      'Vérifier LTFT revient entre -5% et +5%',
    ],
    warning: 'Le moteur devra réapprendre ses adaptations. Conduite légèrement instable pendant ~50km.',
  },
  throttleAdaptation: {
    name: 'Réapprentissage papillon (TPS reset)',
    steps: [
      'Contact ON (moteur arrêté)',
      'Attendre 10 secondes sans toucher pédale',
      'Appuyer lentement sur accélérateur à fond (3-4s)',
      'Relâcher lentement (3-4s)',
      'Contact OFF',
      'Attendre 30 secondes',
      'Démarrer et laisser ralenti 5 minutes',
    ],
  },
  idleRpmReset: {
    name: 'Reset RPM ralenti (valeur constructeur: 750 rpm)',
    targetRpm: 750,
    steps: [
      'Moteur chaud (ECT > 80°C)',
      'Toutes charges électriques OFF (clim, ventil...)',
      'Transmission au point mort',
      'Débrancher connecteur ISA 30 secondes',
      'Rebrancher',
      'Couper contact 10s puis redémarrer',
    ],
  },
};