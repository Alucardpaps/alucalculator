import type { Language } from '@/store/i18nStore';

export type DashboardPageStrings = {
  brandOs: string;
  instanceLabel: string;
  coreStable: string;
  executionMetrics: string;
  avgLatency: string;
  successRate: string;
  systemIdentity: string;
  encryptedSession: string;
  authJwt: string;
  activeModules: string;
  bearings: string;
  gears: string;
  emptyTitle: string;
  emptyDescription: string;
  initializing: string;
  initializeProject: string;
  commandCenter: string;
  commandCenterSubtitle: string;
  projectLedger: string;
  assemblyFlow: string;
  creating: string;
  newProject: string;
  dependencyGraph: string;
  verified: string;
  moduleSuffix: string;
  projectHistory: string;
  nodeQuickInspect: string;
  inputPayload: string;
  executionResult: string;
  launchWorkstation: string;
  systemOnline: string;
  versionLabel: string;
  truthLedgerVerified: string;
  latencyLabel: string;
  promptProjectName: string;
  defaultProjectName: string;
  createFailed: string;
};

const EN: DashboardPageStrings = {
  brandOs: 'AluCalc OS',
  instanceLabel: 'Instance: US-EAST-1',
  coreStable: 'Core Stable',
  executionMetrics: 'Execution Metrics',
  avgLatency: 'Avg Latency',
  successRate: 'Success Rate',
  systemIdentity: 'System Identity',
  encryptedSession: 'Encrypted Session',
  authJwt: 'Auth v2.0-JWT',
  activeModules: 'Active Modules',
  bearings: 'Bearings',
  gears: 'Gears',
  emptyTitle: 'Initialize Your First Assembly',
  emptyDescription:
    'Welcome to the AluCalc Engineering OS. Your repository is currently empty. Create your first project to activate the Truth Ledger and begin multi-module simulation.',
  initializing: 'Initializing...',
  initializeProject: 'Initialize Project Alpha',
  commandCenter: 'Command Center',
  commandCenterSubtitle: 'Multi-module engineering assembly & truth ledger.',
  projectLedger: 'Project Ledger',
  assemblyFlow: 'Assembly Flow',
  creating: 'Creating...',
  newProject: 'New Project',
  dependencyGraph: 'Project Dependency Graph',
  verified: 'Verified',
  moduleSuffix: 'Module',
  projectHistory: 'Project Repository History',
  nodeQuickInspect: 'Node Quick Inspect',
  inputPayload: 'Input Payload',
  executionResult: 'Execution Result',
  launchWorkstation: 'Launch Workstation',
  systemOnline: 'System Online',
  versionLabel: 'v5.0.0-Beta',
  truthLedgerVerified: 'Truth Ledger Verified',
  latencyLabel: 'Latency: 14ms',
  promptProjectName: 'Enter Project Name:',
  defaultProjectName: 'Project Alpha',
  createFailed: 'Project creation failed. Please try again.',
};

const TR: DashboardPageStrings = {
  brandOs: 'AluCalc OS',
  instanceLabel: 'Ortam: US-EAST-1',
  coreStable: 'Core Kararl\u0131',
  executionMetrics: 'Y\u00fcr\u00fctme Metrikleri',
  avgLatency: 'Ort. Gecikme',
  successRate: 'Ba\u015far\u0131 Oran\u0131',
  systemIdentity: 'Sistem Kimli\u011fi',
  encryptedSession: '\u015eifreli Oturum',
  authJwt: 'Auth v2.0-JWT',
  activeModules: 'Aktif Mod\u00fcller',
  bearings: 'Rulmanlar',
  gears: 'Di\u015fliler',
  emptyTitle: '\u0130lk Montaj\u0131n\u0131z\u0131 Ba\u015flat\u0131n',
  emptyDescription:
    'AluCalc M\u00fchendislik OS\u2019e ho\u015f geldiniz. Depo \u015fu an bo\u015f. Truth Ledger\u2019\u0131 etkinle\u015ftirmek ve \u00e7ok mod\u00fcll\u00fc sim\u00fclasyona ba\u015flamak i\u00e7in ilk projenizi olu\u015fturun.',
  initializing: 'Ba\u015flat\u0131l\u0131yor...',
  initializeProject: 'Proje Alpha Ba\u015flat',
  commandCenter: 'Komuta Merkezi',
  commandCenterSubtitle: '\u00c7ok mod\u00fcll\u00fc m\u00fchendislik montaj\u0131 ve truth ledger.',
  projectLedger: 'Proje Defteri',
  assemblyFlow: 'Montaj Ak\u0131\u015f\u0131',
  creating: 'Olu\u015fturuluyor...',
  newProject: 'Yeni Proje',
  dependencyGraph: 'Proje Ba\u011f\u0131ml\u0131l\u0131k Grafi\u011fi',
  verified: 'Do\u011fruland\u0131',
  moduleSuffix: 'Mod\u00fcl',
  projectHistory: 'Proje Deposu Ge\u00e7mi\u015fi',
  nodeQuickInspect: 'D\u00fcm H\u0131zl\u0131 \u0130nceleme',
  inputPayload: 'Girdi Y\u00fck\u00fc',
  executionResult: 'Y\u00fcr\u00fctme Sonucu',
  launchWorkstation: 'Workstation Ba\u015flat',
  systemOnline: 'Sistem \u00c7evrimi\u00e7i',
  versionLabel: 'v5.0.0-Beta',
  truthLedgerVerified: 'Truth Ledger Do\u011fruland\u0131',
  latencyLabel: 'Gecikme: 14ms',
  promptProjectName: 'Proje Ad\u0131 Girin:',
  defaultProjectName: 'Proje Alpha',
  createFailed: 'Proje olu\u015fturma ba\u015far\u0131s\u0131z. L\u00fctfen tekrar deneyin.',
};

const MAP: Record<Language, DashboardPageStrings> = {
  en: EN,
  tr: TR,
  de: EN,
  es: EN,
  fr: EN,
  it: EN,
  pt: EN,
  ru: EN,
  zh: EN,
  ja: EN,
  ko: EN,
  ar: EN,
};

export function getDashboardPage(locale: string): DashboardPageStrings {
  return MAP[locale as Language] ?? EN;
}
