/**
 * Generates mobileTranslations.ts, fieldToolsTranslations.ts, kernelDevTranslations.ts
 * Run: node scripts/generate-mobile-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FT_FULL_LOCALES } from './mobile-i18n-data/field-tools/index.mjs';
import { MOBILE_SHELL_FULL } from './i18n-data/mobile-shell/index.mjs';
import { KERNEL_FULL_LOCALES } from './i18n-data/kernel/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const LOCALES = path.join(ROOT, 'src/locales');

const LANGS = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'ar'];

function merge(base, patch) {
  return { ...base, ...patch };
}

// ── Mobile shell (MobileEnvironment) ─────────────────────────────────────────
const MOBILE_EN = {
  dashboard: 'Dashboard',
  solvers: 'Solvers',
  cadWorkspace: '3D CAD',
  variables: 'Variables',
  fieldTools: 'Field Tools',
  aegis: 'Aegis AI',
  settings: 'Settings',
  recentSolvers: 'Recent Solvers',
  activeProject: 'Active Project',
  searchSolvers: 'Search solvers...',
  popularSolvers: 'Popular Solvers',
  quickStats: 'Quick Stats',
  latency: 'Latency',
  status: 'Status',
  online: 'Online',
  version: 'Version',
  solvedCount: 'Solved Computations',
  noRecentCalculations: 'No recent calculations in this session.',
  bomCount: 'BOM Parts',
  allCategories: 'All',
  back: 'Back',
  saveSpec: 'Save to BOM',
  share: 'Share',
  pdfReport: 'PDF Report',
  language: 'Language',
  unitSystem: 'Unit System',
  theme: 'UI Theme',
  clearCache: 'Clear App Cache',
  systemDiagnostics: 'System Diagnostics',
  diagnosticsPass: 'All checks passed',
  hardwareAccel: 'WebGL Accelerator',
  active: 'Active',
  inactive: 'Inactive',
  copied: 'Copied to clipboard!',
  aegisWelcome: 'Aegis AI Assistant',
  aegisSub: 'Ask any engineering questions or request parameter lookup.',
  start3D: 'Load 3D CAD Canvas',
  bomTitle: 'Bill of Materials',
  compTitle: 'Add Profile/Fastener',
  savedVars: 'Saved Variables',
  varName: 'Name',
  varValue: 'Value',
  varSource: 'Source',
  noVariables: 'No saved variables yet. Compute something to save variables.',
  copiedVar: 'Variable copied!',
  addVarBtn: 'Add Variable',
  addVarTitle: 'Add Custom Variable',
  placeholderName: 'VAR_NAME',
  placeholderValue: '0',
  placeholderUnit: 'mm',
  placeholderDesc: 'Optional description',
  cancel: 'Cancel',
  save: 'Save',
  clearProject: 'Reset Project Data',
  confirmClear: 'Are you sure you want to clear all calculations, BOM, and variables? This cannot be undone.',
  projectCleared: 'Project cleared successfully.',
  totalCost: 'Est. Total Cost',
  totalWeight: 'Total Weight',
  loading3D: 'Loading 3D Assembly Engine...',
  cadAssemblyTitle: '3D Prototype Assembly',
  cadAssemblyDesc:
    'Run the hardware-accelerated 3D viewer. Loads profiles, components, and enables assembly editing.',
  cadControlsHelp: '1-Finger: Rotate | 2-Fingers: Zoom/Pan',
  metricUnits: 'Metric (mm, kg)',
  imperialUnits: 'Imperial (in, lbs)',
  pdfGeneratedSim: 'PDF Generated (Simulated)',
  varUnit: 'Unit',
  varDescription: 'Description',
  shareSolverPrefix: 'AluCalc Solver',
  addPartShort: 'Add Part',
  academy: 'Academy',
  quickActions: 'Quick Actions',
  favorites: 'Favorites',
  favorite: 'Add to favorites',
  unfavorite: 'Remove from favorites',
  favorited: 'Added to favorites',
  unfavorited: 'Removed from favorites',
  calcHistory: 'Calculation History',
  reopenCalc: 'Result',
  calcHistoryEmpty: 'No calculation history yet.',
  biometricLock: 'Biometric Lock',
  biometricEnabled: 'Biometric lock enabled',
  biometricDisabled: 'Biometric lock disabled',
  biometricLockTitle: 'App Locked',
  biometricLockSubtitle: 'Authenticate to access AluCalc OS',
  biometricUnlock: 'Unlock with biometrics',
  reduceMotion: 'Reduce motion',
  fontSize: 'Font Size',
  fontSizeSmall: 'Small',
  fontSizeMedium: 'Medium',
  fontSizeLarge: 'Large',
  accessibility: 'Accessibility',
  about: 'About',
  aboutTitle: 'About AluCalc OS',
  aboutDescription: 'Professional engineering intelligence platform with 88+ validated solvers, 3D workspace, and academy lessons.',
  appVersion: 'Version',
  sendFeedback: 'Send Feedback',
  exportJson: 'Export JSON',
  exportSuccess: 'Results exported successfully',
  cacheCleared: 'Cache cleared',
  confirmClearCache: 'Clear session cache and refresh service worker?',
  academyProgress: 'Academy Progress',
  lessonsComplete: 'lessons',
  continueLearning: 'Browse full Academy',
  loading: 'Loading...',
  pullToRefresh: 'Pull to refresh',
  pullRefreshed: 'Refreshed',
  themeLight: 'Light',
  themeDark: 'Dark',
  onboardingTitle: 'Welcome to AluCalc OS',
  onboardingSubtitle: '88+ engineering calculators, 3D workspace, field tools, and Aegis AI — all in your pocket.',
  onboardingGetStarted: 'Get Started',
  skipOnboarding: 'Skip',
  deepLinkOpened: 'Calculator opened from link',
};

const MOBILE_LOCALES = {
  tr: {
    dashboard: 'Panel', solvers: 'Hesaplayıcılar', cadWorkspace: '3D Tasarım', variables: 'Değişkenler',
    fieldTools: 'Saha Araçları', aegis: 'Aegis AI', settings: 'Ayarlar', recentSolvers: 'Son Kullanılanlar',
    activeProject: 'Aktif Proje', searchSolvers: 'Hesaplayıcı ara...', popularSolvers: 'Popüler Çözücüler',
    quickStats: 'Hızlı İstatistikler', latency: 'Gecikme Süresi', status: 'Durum', online: 'Aktif',
    version: 'Sürüm', solvedCount: 'Çözülen Denklemler',
    noRecentCalculations: 'Bu oturumda henüz hesaplama yapılmadı.', bomCount: 'BOM Parçaları',
    allCategories: 'Tümü', back: 'Geri', saveSpec: "BOM'a Kaydet", share: 'Paylaş', pdfReport: 'PDF Raporu',
    language: 'Dil Seçimi', unitSystem: 'Birim Sistemi', theme: 'Arayüz Teması',
    clearCache: 'Uygulama Önbelleğini Temizle', systemDiagnostics: 'Sistem Tanılama',
    diagnosticsPass: 'Tüm sistemler kararlı', hardwareAccel: 'WebGL Hızlandırıcı', active: 'Aktif', inactive: 'Pasif',
    copied: 'Panoya kopyalandı!', aegisWelcome: 'Aegis Yapay Zeka Yardımcısı',
    aegisSub: 'Mühendislik soruları sorun veya standart arayın.', start3D: '3D CAD Motorunu Başlat',
    bomTitle: 'Malzeme Listesi (BOM)', compTitle: 'Profil/Bağlantı Ekle', savedVars: 'Kayıtlı Değişkenler',
    varName: 'Değişken Adı', varValue: 'Değer', varSource: 'Kaynak',
    noVariables: 'Henüz kayıtlı değişken yok. Değişken kaydetmek için bir hesaplama yapın.',
    copiedVar: 'Değişken kopyalandı!', addVarBtn: 'Değişken Ekle', addVarTitle: 'Yeni Değişken Ekle',
    placeholderName: 'DEG_ADI', placeholderDesc: 'İsteğe bağlı açıklama', cancel: 'İptal', save: 'Kaydet',
    clearProject: 'Proje Verilerini Sıfırla',
    confirmClear: 'Tüm hesaplamaları, BOM listesini ve değişkenleri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
    projectCleared: 'Proje başarıyla sıfırlandı.', totalCost: 'Tahmini Maliyet', totalWeight: 'Toplam Ağırlık',
    loading3D: '3D Montaj Motoru yükleniyor...',
  },
  de: {
    dashboard: 'Dashboard', solvers: 'Rechner', cadWorkspace: '3D CAD', variables: 'Variablen',
    fieldTools: 'Feldwerkzeuge', settings: 'Einstellungen', recentSolvers: 'Zuletzt verwendet',
    activeProject: 'Aktives Projekt', searchSolvers: 'Rechner suchen...', popularSolvers: 'Beliebte Rechner',
    quickStats: 'Schnellstatistik', latency: 'Latenz', status: 'Status', online: 'Online', version: 'Version',
    noRecentCalculations: 'Keine Berechnungen in dieser Sitzung.', bomCount: 'Stücklisten-Teile',
    allCategories: 'Alle', back: 'Zurück', saveSpec: 'In Stückliste speichern', share: 'Teilen',
    pdfReport: 'PDF-Bericht', language: 'Sprache', unitSystem: 'Einheitensystem', theme: 'UI-Design',
    clearCache: 'App-Cache leeren', systemDiagnostics: 'Systemdiagnose', diagnosticsPass: 'Alle Prüfungen bestanden',
    hardwareAccel: 'WebGL-Beschleuniger', active: 'Aktiv', inactive: 'Inaktiv',
    copied: 'In Zwischenablage kopiert!', aegisWelcome: 'Aegis KI-Assistent',
    aegisSub: 'Stellen Sie technische Fragen oder suchen Sie Standards.',
    start3D: '3D-CAD-Canvas laden', bomTitle: 'Stückliste', compTitle: 'Profil/Befestigung hinzufügen',
    savedVars: 'Gespeicherte Variablen', noVariables: 'Noch keine Variablen gespeichert.',
    copiedVar: 'Variable kopiert!', addVarBtn: 'Variable hinzufügen', addVarTitle: 'Variable hinzufügen',
    cancel: 'Abbrechen', save: 'Speichern', clearProject: 'Projektdaten zurücksetzen',
    confirmClear: 'Alle Berechnungen, Stückliste und Variablen löschen? Dies kann nicht rückgängig gemacht werden.',
    projectCleared: 'Projekt erfolgreich zurückgesetzt.', totalCost: 'Gesch. Gesamtkosten',
    totalWeight: 'Gesamtgewicht', loading3D: '3D-Montagemotor wird geladen...',
  },
  es: {
    dashboard: 'Panel', solvers: 'Calculadoras', cadWorkspace: 'CAD 3D', variables: 'Variables',
    fieldTools: 'Herramientas de campo', settings: 'Ajustes', recentSolvers: 'Recientes',
    activeProject: 'Proyecto activo', searchSolvers: 'Buscar calculadoras...', popularSolvers: 'Calculadoras populares',
    quickStats: 'Estadísticas rápidas', latency: 'Latencia', status: 'Estado', online: 'En línea',
    noRecentCalculations: 'Sin cálculos recientes en esta sesión.', bomCount: 'Piezas BOM',
    allCategories: 'Todos', back: 'Atrás', saveSpec: 'Guardar en BOM', share: 'Compartir',
    pdfReport: 'Informe PDF', language: 'Idioma', unitSystem: 'Sistema de unidades', theme: 'Tema UI',
    clearCache: 'Borrar caché', systemDiagnostics: 'Diagnóstico del sistema',
    diagnosticsPass: 'Todas las comprobaciones OK', hardwareAccel: 'Acelerador WebGL',
    copied: '¡Copiado al portapapeles!', aegisWelcome: 'Asistente Aegis IA',
    start3D: 'Cargar lienzo CAD 3D', bomTitle: 'Lista de materiales', savedVars: 'Variables guardadas',
    noVariables: 'Aún no hay variables guardadas.', cancel: 'Cancelar', save: 'Guardar',
    loading3D: 'Cargando motor de ensamblaje 3D...',
  },
  fr: {
    dashboard: 'Tableau de bord', solvers: 'Calculateurs', cadWorkspace: 'CAO 3D', variables: 'Variables',
    fieldTools: 'Outils terrain', settings: 'Paramètres', recentSolvers: 'Récents',
    activeProject: 'Projet actif', searchSolvers: 'Rechercher...', popularSolvers: 'Calculateurs populaires',
    quickStats: 'Statistiques rapides', latency: 'Latence', status: 'État', online: 'En ligne',
    noRecentCalculations: 'Aucun calcul récent dans cette session.', bomCount: 'Pièces BOM',
    allCategories: 'Tous', back: 'Retour', saveSpec: 'Enregistrer dans la nomenclature', share: 'Partager',
    pdfReport: 'Rapport PDF', language: 'Langue', unitSystem: 'Système d\u2019unités', theme: 'Thème UI',
    clearCache: 'Vider le cache', systemDiagnostics: 'Diagnostic système',
    diagnosticsPass: 'Tous les contrôles OK', copied: 'Copié dans le presse-papiers !',
    aegisWelcome: 'Assistant Aegis IA', start3D: 'Charger le canevas CAO 3D',
    bomTitle: 'Nomenclature', savedVars: 'Variables enregistrées', cancel: 'Annuler', save: 'Enregistrer',
    loading3D: 'Chargement du moteur d\u2019assemblage 3D...',
  },
  it: {
    dashboard: 'Dashboard', solvers: 'Calcolatori', cadWorkspace: 'CAD 3D', variables: 'Variabili',
    fieldTools: 'Strumenti da campo', settings: 'Impostazioni', recentSolvers: 'Recenti',
    activeProject: 'Progetto attivo', searchSolvers: 'Cerca calcolatori...', popularSolvers: 'Calcolatori popolari',
    quickStats: 'Statistiche rapide', latency: 'Latenza', status: 'Stato', online: 'Online',
    noRecentCalculations: 'Nessun calcolo recente in questa sessione.', bomCount: 'Parti BOM',
    allCategories: 'Tutti', back: 'Indietro', saveSpec: 'Salva in distinta base', share: 'Condividi',
    pdfReport: 'Report PDF', language: 'Lingua', unitSystem: 'Sistema di unit\u00e0', theme: 'Tema UI',
    clearCache: 'Svuota cache', systemDiagnostics: 'Diagnostica di sistema',
    diagnosticsPass: 'Tutti i controlli superati', copied: 'Copiato negli appunti!',
    aegisWelcome: 'Assistente Aegis IA', start3D: 'Carica canvas CAD 3D',
    bomTitle: 'Distinta base', savedVars: 'Variabili salvate', cancel: 'Annulla', save: 'Salva',
    loading3D: 'Caricamento motore di assemblaggio 3D...',
  },
  pt: {
    dashboard: 'Painel', solvers: 'Calculadoras', cadWorkspace: 'CAD 3D', variables: 'Vari\u00e1veis',
    fieldTools: 'Ferramentas de campo', settings: 'Configura\u00e7\u00f5es', recentSolvers: 'Recentes',
    activeProject: 'Projeto ativo', searchSolvers: 'Pesquisar calculadoras...', popularSolvers: 'Calculadoras populares',
    quickStats: 'Estat\u00edsticas r\u00e1pidas', latency: 'Lat\u00eancia', status: 'Estado', online: 'Online',
    noRecentCalculations: 'Nenhum c\u00e1lculo recente nesta sess\u00e3o.', bomCount: 'Pe\u00e7as BOM',
    allCategories: 'Todos', back: 'Voltar', saveSpec: 'Salvar na BOM', share: 'Compartilhar',
    pdfReport: 'Relat\u00f3rio PDF', language: 'Idioma', unitSystem: 'Sistema de unidades', theme: 'Tema UI',
    clearCache: 'Limpar cache', systemDiagnostics: 'Diagn\u00f3stico do sistema',
    diagnosticsPass: 'Todas as verifica\u00e7\u00f5es OK', copied: 'Copiado para a \u00e1rea de transfer\u00eancia!',
    aegisWelcome: 'Assistente Aegis IA', start3D: 'Carregar tela CAD 3D',
    bomTitle: 'Lista de materiais', savedVars: 'Vari\u00e1veis salvas', cancel: 'Cancelar', save: 'Salvar',
    loading3D: 'Carregando motor de montagem 3D...',
  },
  ru: {
    dashboard: '\u041f\u0430\u043d\u0435\u043b\u044c', solvers: '\u041a\u0430\u043b\u044c\u043a\u0443\u043b\u044f\u0442\u043e\u0440\u044b', cadWorkspace: '3D CAD', variables: '\u041f\u0435\u0440\u0435\u043c\u0435\u043d\u043d\u044b\u0435',
    fieldTools: '\u041f\u043e\u043b\u0435\u0432\u044b\u0435 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u044b', settings: '\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438', recentSolvers: '\u041d\u0435\u0434\u0430\u0432\u043d\u0438\u0435',
    activeProject: '\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0439 \u043f\u0440\u043e\u0435\u043a\u0442', searchSolvers: '\u041f\u043e\u0438\u0441\u043a \u043a\u0430\u043b\u044c\u043a\u0443\u043b\u044f\u0442\u043e\u0440\u043e\u0432...', popularSolvers: '\u041f\u043e\u043f\u0443\u043b\u044f\u0440\u043d\u044b\u0435 \u043a\u0430\u043b\u044c\u043a\u0443\u043b\u044f\u0442\u043e\u0440\u044b',
    quickStats: '\u0411\u044b\u0441\u0442\u0440\u0430\u044f \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430', latency: '\u0417\u0430\u0434\u0435\u0440\u0436\u043a\u0430', status: '\u0421\u0442\u0430\u0442\u0443\u0441', online: '\u041e\u043d\u043b\u0430\u0439\u043d',
    noRecentCalculations: '\u0412 \u044d\u0442\u043e\u0439 \u0441\u0435\u0441\u0441\u0438\u0438 \u043d\u0435\u0442 \u0440\u0430\u0441\u0447\u0451\u0442\u043e\u0432.', bomCount: '\u0414\u0435\u0442\u0430\u043b\u0438 BOM',
    allCategories: '\u0412\u0441\u0435', back: '\u041d\u0430\u0437\u0430\u0434', saveSpec: '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0432 BOM', share: '\u041f\u043e\u0434\u0435\u043b\u0438\u0442\u044c\u0441\u044f',
    pdfReport: 'PDF-\u043e\u0442\u0447\u0451\u0442', language: '\u042f\u0437\u044b\u043a', unitSystem: '\u0421\u0438\u0441\u0442\u0435\u043c\u0430 \u0435\u0434\u0438\u043d\u0438\u0446', theme: '\u0422\u0435\u043c\u0430 UI',
    clearCache: '\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u043a\u044d\u0448', systemDiagnostics: '\u0414\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u043a\u0430 \u0441\u0438\u0441\u0442\u0435\u043c\u044b',
    diagnosticsPass: '\u0412\u0441\u0435 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0438 \u043f\u0440\u043e\u0439\u0434\u0435\u043d\u044b', copied: '\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e!',
    aegisWelcome: '\u041f\u043e\u043c\u043e\u0449\u043d\u0438\u043a Aegis \u0418\u0418', start3D: '\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c 3D CAD',
    bomTitle: '\u0421\u043f\u0435\u0446\u0438\u0444\u0438\u043a\u0430\u0446\u0438\u044f', savedVars: '\u0421\u043e\u0445\u0440\u0430\u043d\u0451\u043d\u043d\u044b\u0435 \u043f\u0435\u0440\u0435\u043c\u0435\u043d\u043d\u044b\u0435',
    cancel: '\u041e\u0442\u043c\u0435\u043d\u0430', save: '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c',
    loading3D: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 3D-\u0434\u0432\u0438\u0433\u0430\u0442\u0435\u043b\u044f \u0441\u0431\u043e\u0440\u043a\u0438...',
  },
  ja: {
    dashboard: '\u30c0\u30c3\u30b7\u30e5\u30dc\u30fc\u30c9', solvers: '\u8a08\u7b97\u30c4\u30fc\u30eb', cadWorkspace: '3D CAD', variables: '\u5909\u6570',
    fieldTools: '\u73fe\u5834\u30c4\u30fc\u30eb', settings: '\u8a2d\u5b9a', recentSolvers: '\u6700\u8fd1\u4f7f\u7528',
    activeProject: '\u30a2\u30af\u30c6\u30a3\u30d6\u30d7\u30ed\u30b8\u30a7\u30af\u30c8', searchSolvers: '\u8a08\u7b97\u30c4\u30fc\u30eb\u3092\u691c\u7d22...',
    popularSolvers: '\u4eba\u6c17\u306e\u8a08\u7b97\u30c4\u30fc\u30eb', quickStats: '\u30af\u30a4\u30c3\u30af\u7d71\u8a08',
    latency: '\u9045\u5ef6', status: '\u72b6\u614b', online: '\u30aa\u30f3\u30e9\u30a4\u30f3',
    noRecentCalculations: '\u3053\u306e\u30bb\u30c3\u30b7\u30e7\u30f3\u3067\u306f\u8a08\u7b97\u304c\u3042\u308a\u307e\u305b\u3093\u3002',
    bomCount: 'BOM\u90e8\u54c1', allCategories: '\u3059\u3079\u3066', back: '\u623b\u308b', saveSpec: 'BOM\u306b\u4fdd\u5b58',
    share: '\u5171\u6709', pdfReport: 'PDF\u30ec\u30dd\u30fc\u30c8', language: '\u8a00\u8a9e', unitSystem: '\u5358\u4f4d\u7cfb',
    theme: 'UI\u30c6\u30fc\u30de', clearCache: '\u30ad\u30e3\u30c3\u30b7\u30e5\u3092\u6d88\u53bb',
    systemDiagnostics: '\u30b7\u30b9\u30c6\u30e0\u8a3a\u65ad', diagnosticsPass: '\u3059\u3079\u3066\u6b63\u5e38',
    copied: '\u30af\u30ea\u30c3\u30d7\u30dc\u30fc\u30c9\u306b\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f',
    aegisWelcome: 'Aegis AI\u30a2\u30b7\u30b9\u30bf\u30f3\u30c8', start3D: '3D CAD\u30ad\u30e3\u30f3\u30d0\u30b9\u3092\u8aad\u307f\u8fbc\u307f',
    bomTitle: '\u90e8\u54c1\u8868', savedVars: '\u4fdd\u5b58\u5909\u6570', cancel: '\u30ad\u30e3\u30f3\u30bb\u30eb', save: '\u4fdd\u5b58',
    loading3D: '3D\u7d44\u307f\u8fbc\u307f\u30a8\u30f3\u30b8\u30f3\u3092\u8aad\u307f\u8fbc\u307f\u4e2d...',
  },
  zh: {
    dashboard: '\u4eea\u8868\u677f', solvers: '\u8ba1\u7b97\u5668', cadWorkspace: '3D CAD', variables: '\u53d8\u91cf',
    fieldTools: '\u73b0\u573a\u5de5\u5177', settings: '\u8bbe\u7f6e', recentSolvers: '\u6700\u8fd1\u4f7f\u7528',
    activeProject: '\u6d3b\u52a8\u9879\u76ee', searchSolvers: '\u641c\u7d22\u8ba1\u7b97\u5668...', popularSolvers: '\u70ed\u95e8\u8ba1\u7b97\u5668',
    quickStats: '\u5feb\u901f\u7edf\u8ba1', latency: '\u5ef6\u8fdf', status: '\u72b6\u6001', online: '\u5728\u7ebf',
    noRecentCalculations: '\u672c\u4f1a\u8bdd\u6682\u65e0\u8ba1\u7b97\u8bb0\u5f55\u3002', bomCount: 'BOM\u90e8\u4ef6',
    allCategories: '\u5168\u90e8', back: '\u8fd4\u56de', saveSpec: '\u4fdd\u5b58\u5230BOM', share: '\u5206\u4eab',
    pdfReport: 'PDF\u62a5\u544a', language: '\u8bed\u8a00', unitSystem: '\u5355\u4f4d\u5236', theme: 'UI\u4e3b\u9898',
    clearCache: '\u6e05\u9664\u7f13\u5b58', systemDiagnostics: '\u7cfb\u7edf\u8bca\u65ad', diagnosticsPass: '\u6240\u6709\u68c0\u67e5\u901a\u8fc7',
    copied: '\u5df2\u590d\u5236\u5230\u526a\u8d34\u677f', aegisWelcome: 'Aegis AI \u52a9\u624b', start3D: '\u52a0\u8f7d3D CAD\u753b\u5e03',
    bomTitle: '\u7269\u6599\u6e05\u5355', savedVars: '\u5df2\u4fdd\u5b58\u53d8\u91cf', cancel: '\u53d6\u6d88', save: '\u4fdd\u5b58',
    loading3D: '\u6b63\u5728\u52a0\u8f7d3D\u88c5\u914d\u5f15\u64ce...',
  },
  ko: {
    dashboard: '\ub300\uc2dc\ubcf4\ub4dc', solvers: '\uacc4\uc0b0\uae30', cadWorkspace: '3D CAD', variables: '\ubcc0\uc218',
    fieldTools: '\ud604\uc7a5 \ub3c4\uad6c', settings: '\uc124\uc815', recentSolvers: '\ucd5c\uadfc \uc0ac\uc6a9',
    activeProject: '\ud65c\uc131 \ud504\ub85c\uc81d\ud2b8', searchSolvers: '\uacc4\uc0b0\uae30 \uac80\uc0c9...',
    popularSolvers: '\uc778\uae30 \uacc4\uc0b0\uae30', quickStats: '\ube60\ub978 \ud1b5\uacc4',
    latency: '\uc9c0\uc5f0', status: '\uc0c1\ud0dc', online: '\uc628\ub77c\uc778',
    noRecentCalculations: '\uc774 \uc138\uc158\uc5d0\uc11c \uacc4\uc0b0 \uae30\ub85d\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.',
    bomCount: 'BOM \ubd80\ud488', allCategories: '\uc804\uccb4', back: '\ub4a4\ub85c', saveSpec: 'BOM\uc5d0 \uc800\uc7a5',
    share: '\uacf5\uc720', pdfReport: 'PDF \ubcf4\uace0\uc11c', language: '\uc5b8\uc5b4', unitSystem: '\ub2e8\uc704 \uc2dc\uc2a4\ud15c',
    theme: 'UI \ud14c\ub9c8', clearCache: '\uce90\uc2dc \uc0ad\uc81c', systemDiagnostics: '\uc2dc\uc2a4\ud15c \uc9c4\ub2e8',
    diagnosticsPass: '\ubaa8\ub450 \uc815\uc0c1', copied: '\ud074\ub9bd\ubcf4\ub4dc\uc5d0 \ubcf5\uc0ac\ub428',
    aegisWelcome: 'Aegis AI \uc5b4\uc2dc\uc2a4\ud034\ud2b8', start3D: '3D CAD \uce94\ubc84\uc2a4 \ub85c\ub4dc',
    bomTitle: '\ubd80\ud488 \ubaa9\ub85d', savedVars: '\uc800\uc7a5\ub41c \ubcc0\uc218', cancel: '\ucde8\uc18c', save: '\uc800\uc7a5',
    loading3D: '3D \uc870\ub9bd \uc5d4\uc9c4 \ub85c\ub4dc \uc911...',
  },
  ar: {
    dashboard: '\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645', solvers: '\u0627\u0644\u062d\u0627\u0633\u0628\u0627\u062a', cadWorkspace: 'CAD \u062b\u0644\u0627\u062b\u064a \u0627\u0644\u0623\u0628\u0639\u0627\u062f', variables: '\u0627\u0644\u0645\u062a\u063a\u064a\u0631\u0627\u062a',
    fieldTools: '\u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0645\u0648\u0642\u0639', settings: '\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a', recentSolvers: '\u0627\u0644\u0623\u062e\u064a\u0631\u0629',
    activeProject: '\u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0646\u0634\u0637', searchSolvers: '\u0627\u0644\u0628\u062d\u062b \u0639\u0646 \u062d\u0627\u0633\u0628\u0627\u062a...',
    popularSolvers: '\u062d\u0627\u0633\u0628\u0627\u062a \u0634\u0627\u0626\u0639\u0629', quickStats: '\u0625\u062d\u0635\u0627\u0626\u064a\u0627\u062a \u0633\u0631\u064a\u0639\u0629',
    latency: '\u0627\u0644\u062a\u0623\u062e\u064a\u0631', status: '\u0627\u0644\u062d\u0627\u0644\u0629', online: '\u0645\u062a\u0635\u0644',
    noRecentCalculations: '\u0644\u0627 \u062a\u0648\u062c\u062f \u062d\u0633\u0627\u0628\u0627\u062a \u062d\u062f\u064a\u062b\u0629 \u0641\u064a \u0647\u0630\u0647 \u0627\u0644\u062c\u0644\u0633\u0629.',
    bomCount: '\u0642\u0637\u0639 BOM', allCategories: '\u0627\u0644\u0643\u0644', back: '\u0631\u062c\u0648\u0639', saveSpec: '\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 BOM',
    share: '\u0645\u0634\u0627\u0631\u0643\u0629', pdfReport: '\u062a\u0642\u0631\u064a\u0631 PDF', language: '\u0627\u0644\u0644\u063a\u0629', unitSystem: '\u0646\u0638\u0627\u0645 \u0627\u0644\u0648\u062d\u062f\u0627\u062a',
    theme: '\u0633\u0645\u0629 \u0627\u0644\u0648\u0627\u062c\u0647\u0629', clearCache: '\u0645\u0633\u062d \u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u0645\u0624\u0642\u062a\u0629',
    systemDiagnostics: '\u062a\u0634\u062e\u064a\u0635 \u0627\u0644\u0646\u0638\u0627\u0645', diagnosticsPass: '\u062c\u0645\u064a\u0639 \u0627\u0644\u0641\u062d\u0648\u0635\u0627\u062a \u0646\u0627\u062c\u062d\u0629',
    copied: '\u062a\u0645 \u0627\u0644\u0646\u0633\u062e \u0625\u0644\u0649 \u0627\u0644\u062d\u0627\u0641\u0638\u0629', aegisWelcome: '\u0645\u0633\u0627\u0639\u062f Aegis \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a',
    start3D: '\u062a\u062d\u0645\u064a\u0644 \u0644\u0648\u062d\u0629 CAD \u062b\u0644\u0627\u062b\u064a\u0629 \u0627\u0644\u0623\u0628\u0639\u0627\u062f',
    bomTitle: '\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0648\u0627\u062f', savedVars: '\u0627\u0644\u0645\u062a\u063a\u064a\u0631\u0627\u062a \u0627\u0644\u0645\u062d\u0641\u0648\u0638\u0629',
    cancel: '\u0625\u0644\u063a\u0627\u0621', save: '\u062d\u0641\u0638', loading3D: '\u062c\u0627\u0631\u064d \u062a\u062d\u0645\u064a\u0644 \u0645\u062d\u0631\u0643 \u0627\u0644\u062a\u0631\u0643\u064a\u0628 \u062b\u0644\u0627\u062b\u064a \u0627\u0644\u0623\u0628\u0639\u0627\u062f...',
  },
};

const MOBILE_NEW_KEYS = {
  tr: {
    cadAssemblyTitle: '3D Prototip Montaj',
    cadAssemblyDesc: 'Donanım hızlandırmalı 3D görüntüleyiciyi çalıştırın. Profilleri ve bileşenleri yükler, montaj düzenlemesini etkinleştirir.',
    cadControlsHelp: '1 parmak: Döndür | 2 parmak: Yakınlaştır/Kaydır',
    metricUnits: 'Metrik (mm, kg)', imperialUnits: 'İngiliz (in, lbs)',
    pdfGeneratedSim: 'PDF Oluşturuldu (Simülasyon)', varUnit: 'Birim', varDescription: 'Açıklama',
    shareSolverPrefix: 'AluCalc Hesaplayıcı', addPartShort: 'Parça Ekle',
  },
  de: {
    cadAssemblyTitle: '3D-Prototyp-Montage',
    cadAssemblyDesc: 'Hardwarebeschleunigten 3D-Viewer starten. Lädt Profile, Komponenten und ermöglicht Montagebearbeitung.',
    cadControlsHelp: '1 Finger: Drehen | 2 Finger: Zoomen/Verschieben',
    metricUnits: 'Metrisch (mm, kg)', imperialUnits: 'Imperial (in, lbs)',
    pdfGeneratedSim: 'PDF erstellt (Simuliert)', varUnit: 'Einheit', varDescription: 'Beschreibung',
    shareSolverPrefix: 'AluCalc Rechner', addPartShort: 'Teil hinzufügen',
  },
  es: {
    cadAssemblyTitle: 'Ensamblaje prototipo 3D',
    cadAssemblyDesc: 'Ejecute el visor 3D acelerado por hardware. Carga perfiles, componentes y permite editar el ensamblaje.',
    cadControlsHelp: '1 dedo: Rotar | 2 dedos: Zoom/Desplazar',
    metricUnits: 'Métrico (mm, kg)', imperialUnits: 'Imperial (in, lbs)',
    pdfGeneratedSim: 'PDF generado (simulado)', varUnit: 'Unidad', varDescription: 'Descripción',
    shareSolverPrefix: 'Calculadora AluCalc', addPartShort: 'Añadir pieza',
  },
  fr: {
    cadAssemblyTitle: 'Assemblage prototype 3D',
    cadAssemblyDesc: 'Lancez la visionneuse 3D accélérée. Charge profils, composants et permet l\u2019édition d\u2019assemblage.',
    cadControlsHelp: '1 doigt : Rotation | 2 doigts : Zoom/Pan',
    metricUnits: 'Métrique (mm, kg)', imperialUnits: 'Impérial (in, lbs)',
    pdfGeneratedSim: 'PDF généré (simulé)', varUnit: 'Unité', varDescription: 'Description',
    shareSolverPrefix: 'Calculateur AluCalc', addPartShort: 'Ajouter pièce',
  },
  it: {
    cadAssemblyTitle: 'Assemblaggio prototipo 3D',
    cadAssemblyDesc: 'Avvia il visualizzatore 3D accelerato. Carica profili, componenti e abilita la modifica dell\u2019assemblaggio.',
    cadControlsHelp: '1 dito: Ruota | 2 dita: Zoom/Pan',
    metricUnits: 'Metrico (mm, kg)', imperialUnits: 'Imperiale (in, lbs)',
    pdfGeneratedSim: 'PDF generato (simulato)', varUnit: 'Unità', varDescription: 'Descrizione',
    shareSolverPrefix: 'Calcolatore AluCalc', addPartShort: 'Aggiungi parte',
  },
  pt: {
    cadAssemblyTitle: 'Montagem protótipo 3D',
    cadAssemblyDesc: 'Execute o visualizador 3D acelerado. Carrega perfis, componentes e permite editar a montagem.',
    cadControlsHelp: '1 dedo: Rodar | 2 dedos: Zoom/Pan',
    metricUnits: 'Métrico (mm, kg)', imperialUnits: 'Imperial (in, lbs)',
    pdfGeneratedSim: 'PDF gerado (simulado)', varUnit: 'Unidade', varDescription: 'Descrição',
    shareSolverPrefix: 'Calculadora AluCalc', addPartShort: 'Adicionar peça',
  },
  ru: {
    cadAssemblyTitle: '3D-сборка прототипа',
    cadAssemblyDesc: 'Запустите аппаратно-ускоренный 3D-просмотр. Загружает профили, компоненты и позволяет редактировать сборку.',
    cadControlsHelp: '1 палец: поворот | 2 пальца: масштаб/пан',
    metricUnits: 'Метрическая (мм, кг)', imperialUnits: 'Имперская (in, lbs)',
    pdfGeneratedSim: 'PDF создан (симуляция)', varUnit: 'Единица', varDescription: 'Описание',
    shareSolverPrefix: 'Калькулятор AluCalc', addPartShort: 'Добавить деталь',
  },
  ja: {
    cadAssemblyTitle: '3Dプロトタイプ組立',
    cadAssemblyDesc: 'ハードウェア加速3Dビューアを起動。プロファイルと部品を読み込み、組立編集を有効にします。',
    cadControlsHelp: '1本指: 回転 | 2本指: ズーム/パン',
    metricUnits: 'メートル法 (mm, kg)', imperialUnits: 'ヤード・ポンド法 (in, lbs)',
    pdfGeneratedSim: 'PDF生成完了（シミュレーション）', varUnit: '単位', varDescription: '説明',
    shareSolverPrefix: 'AluCalc計算ツール', addPartShort: '部品追加',
  },
  zh: {
    cadAssemblyTitle: '3D原型装配',
    cadAssemblyDesc: '运行硬件加速3D查看器。加载型材和组件，并启用装配编辑。',
    cadControlsHelp: '单指：旋转 | 双指：缩放/平移',
    metricUnits: '公制 (mm, kg)', imperialUnits: '英制 (in, lbs)',
    pdfGeneratedSim: 'PDF已生成（模拟）', varUnit: '单位', varDescription: '描述',
    shareSolverPrefix: 'AluCalc计算器', addPartShort: '添加零件',
  },
  ko: {
    cadAssemblyTitle: '3D 프로토타입 조립',
    cadAssemblyDesc: '하드웨어 가속 3D 뷰어를 실행합니다. 프로필과 부품을 로드하고 조립 편집을 활성화합니다.',
    cadControlsHelp: '1손가락: 회전 | 2손가락: 확대/이동',
    metricUnits: '미터법 (mm, kg)', imperialUnits: '야드파운드법 (in, lbs)',
    pdfGeneratedSim: 'PDF 생성됨 (시뮬레이션)', varUnit: '단위', varDescription: '설명',
    shareSolverPrefix: 'AluCalc 계산기', addPartShort: '부품 추가',
  },
  ar: {
    cadAssemblyTitle: 'تجميع النموذج ثلاثي الأبعاد',
    cadAssemblyDesc: 'شغّل عارض ثلاثي الأبعاد المعجل. يحمّل المقاطع والمكونات ويمكّن تحرير التجميع.',
    cadControlsHelp: 'إصبع واحد: دوران | إصبعان: تكبير/تحريك',
    metricUnits: 'متري (mm, kg)', imperialUnits: 'إمبراطوري (in, lbs)',
    pdfGeneratedSim: 'تم إنشاء PDF (محاكاة)', varUnit: 'الوحدة', varDescription: 'الوصف',
    shareSolverPrefix: 'حاسبة AluCalc', addPartShort: 'إضافة جزء',
  },
};

const MOBILE_V2_KEYS = {
  tr: {
    academy: 'Akademi', quickActions: 'Hızlı İşlemler', favorites: 'Favoriler',
    favorite: 'Favorilere ekle', unfavorite: 'Favorilerden çıkar', favorited: 'Favorilere eklendi', unfavorited: 'Favorilerden çıkarıldı',
    calcHistory: 'Hesaplama Geçmişi', reopenCalc: 'Sonuç', calcHistoryEmpty: 'Henüz hesaplama geçmişi yok.',
    biometricLock: 'Biyometrik Kilit', biometricEnabled: 'Biyometrik kilit etkin', biometricDisabled: 'Biyometrik kilit devre dışı',
    biometricLockTitle: 'Uygulama Kilitli', biometricLockSubtitle: 'AluCalc OS\'e erişmek için kimlik doğrulayın', biometricUnlock: 'Biyometri ile aç',
    reduceMotion: 'Hareketi azalt', fontSize: 'Yazı Boyutu', fontSizeSmall: 'Küçük', fontSizeMedium: 'Orta', fontSizeLarge: 'Büyük', accessibility: 'Erişilebilirlik',
    about: 'Hakkında', aboutTitle: 'AluCalc OS Hakkında', aboutDescription: '88+ doğrulanmış çözücü, 3D çalışma alanı ve akademi dersleri içeren profesyonel mühendislik platformu.',
    appVersion: 'Sürüm', sendFeedback: 'Geri Bildirim Gönder', exportJson: 'JSON Dışa Aktar', exportSuccess: 'Sonuçlar dışa aktarıldı',
    cacheCleared: 'Önbellek temizlendi', confirmClearCache: 'Oturum önbelleği ve service worker temizlensin mi?',
    academyProgress: 'Akademi İlerlemesi', lessonsComplete: 'ders', continueLearning: 'Tüm Akademiyi Gör',
    loading: 'Yükleniyor...', pullToRefresh: 'Yenilemek için çek', pullRefreshed: 'Yenilendi',
    themeLight: 'Açık', themeDark: 'Koyu',
    onboardingTitle: 'AluCalc OS\'e Hoş Geldiniz', onboardingSubtitle: '88+ mühendislik hesaplayıcısı, 3D çalışma alanı, saha araçları ve Aegis AI — cebinizde.',
    onboardingGetStarted: 'Başla', skipOnboarding: 'Atla', deepLinkOpened: 'Bağlantıdan hesaplayıcı açıldı',
  },
  de: {
    academy: 'Akademie', quickActions: 'Schnellaktionen', favorites: 'Favoriten',
    favorite: 'Zu Favoriten', unfavorite: 'Aus Favoriten', favorited: 'Zu Favoriten hinzugefügt', unfavorited: 'Aus Favoriten entfernt',
    calcHistory: 'Berechnungsverlauf', reopenCalc: 'Ergebnis', biometricLock: 'Biometrische Sperre',
    biometricLockTitle: 'App gesperrt', biometricUnlock: 'Mit Biometrie entsperren', reduceMotion: 'Bewegung reduzieren',
    fontSize: 'Schriftgröße', fontSizeSmall: 'Klein', fontSizeMedium: 'Mittel', fontSizeLarge: 'Groß', accessibility: 'Barrierefreiheit',
    about: 'Über', aboutTitle: 'Über AluCalc OS', sendFeedback: 'Feedback senden', exportJson: 'JSON exportieren', exportSuccess: 'Ergebnisse exportiert',
    cacheCleared: 'Cache geleert', confirmClearCache: 'Sitzungs-Cache leeren?', academyProgress: 'Akademie-Fortschritt',
    continueLearning: 'Vollständige Akademie', loading: 'Laden...', pullToRefresh: 'Zum Aktualisieren ziehen', pullRefreshed: 'Aktualisiert',
    themeLight: 'Hell', themeDark: 'Dunkel', onboardingTitle: 'Willkommen bei AluCalc OS', onboardingGetStarted: 'Loslegen', skipOnboarding: 'Überspringen',
  },
  es: {
    academy: 'Academia', quickActions: 'Acciones rápidas', favorites: 'Favoritos', calcHistory: 'Historial de cálculos',
    biometricLock: 'Bloqueo biométrico', reduceMotion: 'Reducir movimiento', fontSize: 'Tamaño de fuente',
    about: 'Acerca de', exportJson: 'Exportar JSON', onboardingTitle: 'Bienvenido a AluCalc OS', onboardingGetStarted: 'Empezar',
  },
  fr: {
    academy: 'Académie', quickActions: 'Actions rapides', favorites: 'Favoris', calcHistory: 'Historique des calculs',
    biometricLock: 'Verrou biométrique', reduceMotion: 'Réduire les animations', about: 'À propos', exportJson: 'Exporter JSON',
    onboardingTitle: 'Bienvenue sur AluCalc OS', onboardingGetStarted: 'Commencer',
  },
  it: {
    academy: 'Accademia', quickActions: 'Azioni rapide', favorites: 'Preferiti', calcHistory: 'Cronologia calcoli',
    biometricLock: 'Blocco biometrico', reduceMotion: 'Riduci movimento', about: 'Informazioni', exportJson: 'Esporta JSON',
    onboardingTitle: 'Benvenuto in AluCalc OS', onboardingGetStarted: 'Inizia',
  },
  pt: {
    academy: 'Academia', quickActions: 'Ações rápidas', favorites: 'Favoritos', calcHistory: 'Histórico de cálculos',
    biometricLock: 'Bloqueio biométrico', reduceMotion: 'Reduzir movimento', about: 'Sobre', exportJson: 'Exportar JSON',
    onboardingTitle: 'Bem-vindo ao AluCalc OS', onboardingGetStarted: 'Começar',
  },
  ru: {
    academy: 'Академия', quickActions: 'Быстрые действия', favorites: 'Избранное', calcHistory: 'История расчётов',
    biometricLock: 'Биометрическая блокировка', reduceMotion: 'Уменьшить анимацию', about: 'О приложении', exportJson: 'Экспорт JSON',
    onboardingTitle: 'Добро пожаловать в AluCalc OS', onboardingGetStarted: 'Начать',
  },
  ja: {
    academy: 'アカデミー', quickActions: 'クイックアクション', favorites: 'お気に入り', calcHistory: '計算履歴',
    biometricLock: '生体認証ロック', reduceMotion: 'モーションを減らす', about: 'について', exportJson: 'JSONエクスポート',
    onboardingTitle: 'AluCalc OSへようこそ', onboardingGetStarted: '始める',
  },
  zh: {
    academy: '学院', quickActions: '快捷操作', favorites: '收藏', calcHistory: '计算历史',
    biometricLock: '生物识别锁', reduceMotion: '减少动画', about: '关于', exportJson: '导出JSON',
    onboardingTitle: '欢迎使用 AluCalc OS', onboardingGetStarted: '开始',
  },
  ko: {
    academy: '아카데미', quickActions: '빠른 작업', favorites: '즐겨찾기', calcHistory: '계산 기록',
    biometricLock: '생체 인증 잠금', reduceMotion: '모션 줄이기', about: '정보', exportJson: 'JSON보내기',
    onboardingTitle: 'AluCalc OS에 오신 것을 환영합니다', onboardingGetStarted: '시작하기',
  },
  ar: {
    academy: 'الأكاديمية', quickActions: 'إجراءات سريعة', favorites: 'المفضلة', calcHistory: 'سجل الحسابات',
    biometricLock: 'قفل بيومتري', reduceMotion: 'تقليل الحركة', about: 'حول', exportJson: 'تصدير JSON',
    onboardingTitle: 'مرحبًا بك في AluCalc OS', onboardingGetStarted: 'ابدأ',
  },
};

const mobileByLocale = {};
for (const lang of LANGS) {
  if (lang === 'en') {
    mobileByLocale[lang] = MOBILE_EN;
  } else if (lang === 'tr') {
    mobileByLocale[lang] = merge(merge(merge(MOBILE_EN, MOBILE_LOCALES.tr ?? {}), MOBILE_NEW_KEYS.tr ?? {}), MOBILE_V2_KEYS.tr ?? {});
  } else if (lang === 'de') {
    mobileByLocale[lang] = merge(merge(merge(MOBILE_EN, MOBILE_LOCALES.de ?? {}), MOBILE_NEW_KEYS.de ?? {}), MOBILE_V2_KEYS.de ?? {});
  } else if (MOBILE_SHELL_FULL[lang]) {
    mobileByLocale[lang] = merge(merge(MOBILE_EN, MOBILE_SHELL_FULL[lang]), MOBILE_V2_KEYS[lang] ?? {});
  } else {
    mobileByLocale[lang] = merge(MOBILE_EN, MOBILE_V2_KEYS[lang] ?? {});
  }
}

// ── Field tools: full locale data in mobile-i18n-data/field-tools/ ─────────────
const FT_OTHER_LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'ar'];

// ── Kernel dev panel ─────────────────────────────────────────────────────────
const KERNEL_EN = {
  kernelButton: 'Kernel',
  panelTitle: 'Engineering Kernel OS',
  boot: 'BOOT',
  modules: 'MODULES',
  schemas: 'Schemas',
  trace: 'Trace',
  legacy: 'Legacy',
  mcp: 'MCP',
  activeLogicBridges: 'Active Logic Bridges',
  exposedTools: 'Exposed Tools',
  mcpNote: 'These bridges allow AluCalc AI to access external engineering data and files autonomously.',
  loadingKernel: 'Loading kernel state...',
  noExecutionLogs: 'No execution logs yet.',
  runCalculationHint: 'Run a calculation to see trace.',
  success: 'SUCCESS',
  inputs: 'INPUTS',
  outputs: 'OUTPUTS',
  uncategorized: 'Uncategorized',
  ready: 'Ready',
  connected: 'CONNECTED',
  indexing: 'INDEXING',
  note: 'NOTE',
  devModeRequired: 'Developer mode required to view sandbox tools.',
};

const KERNEL_TR = {
  kernelButton: 'Çekirdek', panelTitle: 'Mühendislik Çekirdek OS', boot: 'ÖNYÜKLEME', modules: 'MODÜLLER',
  schemas: 'Şemalar', trace: 'İz', legacy: 'Eski', mcp: 'MCP', activeLogicBridges: 'Aktif Mantık Köprüleri',
  exposedTools: 'Açık Araçlar', mcpNote: "Bu köprüler AluCalc AI'ın harici mühendislik verilerine otonom erişmesini sağlar.",
  loadingKernel: 'Çekirdek durumu yükleniyor...', noExecutionLogs: 'Henüz yürütme günlüğü yok.',
  runCalculationHint: 'İzlemek için bir hesaplama çalıştırın.', success: 'BAŞARILI', inputs: 'GİRDİLER', outputs: 'ÇIKTILAR',
  uncategorized: 'Kategorisiz', ready: 'Hazır', connected: 'BAĞLI', indexing: 'İNDEKSLENİYOR', note: 'NOT',
  devModeRequired: 'Sandbox araçlarını görmek için geliştirici modu gerekli.',
};

const KERNEL_OTHER_LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'ar'];

function serializeObject(obj, indent = 4) {
  const pad = ' '.repeat(indent);
  const lines = Object.entries(obj).map(([k, v]) => `${pad}${k}: ${JSON.stringify(v)},`);
  return lines.join('\n');
}

function writeMobileTranslations() {
  const body = LANGS.map((lang) => `  ${lang}: {\n${serializeObject(mobileByLocale[lang])}\n  }`).join(',\n');
  const content = `/** Auto-generated by scripts/generate-mobile-i18n.mjs — do not edit manually. */
import type { Language } from '@/store/i18nStore';

export type MobileStrings = {
${Object.keys(MOBILE_EN).map((k) => `  ${k}: string;`).join('\n')}
};

const EN: MobileStrings = {\n${serializeObject(MOBILE_EN)}\n};

const BY_LOCALE: Record<Language, MobileStrings> = {
${body}
};

export function getMobileStrings(locale: string): MobileStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
`;
  fs.writeFileSync(path.join(LOCALES, 'mobileTranslations.ts'), content, 'utf8');
}

function serializeKernelObject(obj, indent = 4) {
  const pad = ' '.repeat(indent);
  const lines = Object.entries(obj).map(([k, v]) => `${pad}${k}: ${JSON.stringify(v)},`);
  return lines.join('\n');
}

function writeKernelDevTranslations() {
  const otherConsts = KERNEL_OTHER_LANGS.map(
    (lang) => `const ${lang.toUpperCase()}_KD: KernelDevStrings = {\n${serializeKernelObject(KERNEL_FULL_LOCALES[lang])}\n};`,
  ).join('\n\n');

  const content = `/** Auto-generated by scripts/generate-mobile-i18n.mjs — do not edit manually. */
import type { Language } from '@/store/i18nStore';

export type KernelDevStrings = {
${Object.keys(KERNEL_EN).map((k) => `  ${k}: string;`).join('\n')}
};

const EN: KernelDevStrings = {\n${serializeKernelObject(KERNEL_EN)}\n};

const TR: KernelDevStrings = {\n${serializeKernelObject(KERNEL_TR)}\n};

${otherConsts}

const BY_LOCALE: Record<Language, KernelDevStrings> = {
  en: EN,
  tr: TR,
${KERNEL_OTHER_LANGS.map((lang) => `  ${lang}: ${lang.toUpperCase()}_KD,`).join('\n')}
};

export function getKernelDevStrings(locale: string): KernelDevStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
`;
  fs.writeFileSync(path.join(LOCALES, 'kernelDevTranslations.ts'), content, 'utf8');
}

function serializeFieldTools(obj, indent = 4) {
  const pad = ' '.repeat(indent);
  const lines = Object.entries(obj).map(([k, v]) => {
    if (typeof v === 'string' && v.includes('\n')) {
      return `${pad}${k}:\n${pad}    ${JSON.stringify(v)},`;
    }
    return `${pad}${k}: ${JSON.stringify(v)},`;
  });
  return `{\n${lines.join('\n')}\n${' '.repeat(indent - 4)}}`;
}

function patchFieldToolsTranslations() {
  const fieldToolsPath = path.join(LOCALES, 'fieldToolsTranslations.ts');
  const existingFt = fs.readFileSync(fieldToolsPath, 'utf8');

  const localeConsts = FT_OTHER_LANGS.map((lang) => {
    const constName = `${lang.toUpperCase()}_FT`;
    return `const ${constName}: FieldToolsStrings = ${serializeFieldTools(FT_FULL_LOCALES[lang])};`;
  }).join('\n\n');

  const byLocaleBlock = `const BY_LOCALE: Record<Language, FieldToolsStrings> = {
  en: EN,
  tr: TR,
${FT_OTHER_LANGS.map((lang) => `  ${lang}: ${lang.toUpperCase()}_FT,`).join('\n')}
};

export function getFieldToolsStrings(locale: string): FieldToolsStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}`;

  const updated = existingFt.replace(
    /const DE_FT:[\s\S]*?export function getFieldToolsStrings\(locale: string\): FieldToolsStrings \{[\s\S]*?\n\}/,
    `${localeConsts}\n\n${byLocaleBlock}`,
  );

  if (updated === existingFt) {
    // Already up to date — skip write
    return;
  }
  fs.writeFileSync(fieldToolsPath, updated, 'utf8');
}

writeMobileTranslations();
writeKernelDevTranslations();
patchFieldToolsTranslations();
console.log('Generated mobileTranslations.ts, kernelDevTranslations.ts, patched fieldToolsTranslations.ts');
