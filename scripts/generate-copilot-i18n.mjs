/**
 * Generates copilot engine locale TS bundle.
 * Run: node scripts/generate-copilot-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'src/locales/copilotEngineTranslations.ts');
const LANGS = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'ar'];

const EN = {
  feedbackReply: '**Technical Discrepancy Report**\n\nI apologize for the inaccuracy. Engineering simulations can occasionally drift under extreme boundary conditions. Please trigger a manual verification request via the button below.',
  feedbackAction: 'Contact Engineering Support',
  resetReply: 'Conversational memory reset. Ready for new parameter definitions.',
  moduleOnPage: 'You are currently navigating the **{label}**. You can simulate complex systems here, adjust boundary conditions, and monitor real-time analytical data from the panels below. Would you like to ask a specific calculation question (e.g., "What if input torque is 50Nm?")?',
  moduleRoute: 'I can route you to the **{label}**. Deep dive info:\n\n{desc}\n\nUse the button below to navigate there.',
  contextReply: 'You are currently at the **{label}** workstation.\n\n{desc}\n\nAll calculations here are solved in real-time according to ISO and DIN standards. Which parameter would you like to optimize?',
  assumeSteel: 'Defaulted material to Steel (S235JR).',
  assumeLength: 'Span length defaulted to 2m (2000 mm).',
  assumeForce: 'Applied force defaulted to 5000 N (5 kN).',
  assumeProfile: 'Profile shape assumed 50x100 mm rectangular box.',
  openBeamDeflection: 'Open Beam Deflection Solver',
  simplySupported: 'Simply Supported',
  cantilever: 'Cantilever',
  safe: '✅ SAFE',
  critical: '❌ CRITICAL UNDERSIZED',
  paramsHeader: 'Parameters updated in memory:\n',
  paramsFooter: "\nType 'calculate' or 'solve stress' to run structural analysis on these parameters.",
  materialLine: '• **Material:** {type} ({grade})\n',
  loadLine: '• **Load (F):** {val} N\n',
  lengthLine: '• **Length (L):** {val} mm\n',
  profileLine: '• **Profile Section:** {w}x{h} mm\n',
  mThreadTitle: '**M{size} Metric Thread Specs**\n\nStandard pitch is **{pitch} mm**. Recommended drill size is **{drill} mm**. Check the Fasteners module for torque specs!',
  openFasteners: 'Open Fasteners Suite',
  defaultFallback: "No verifiable engineering boundary conditions or analytical tokens were detected. Please specify clear parametric queries like 'S235 steel 5000N load' or 'M12 thread'.",
  whoAreYou: 'I am the **Sovereign Intelligence** of AluCalc. Current active parameters:\n• Material: {material}\n• Load: {load}\n• Span: {span}\n\nAsk me \'calculate deflection\' once you have set these parameters!',
  helpReply: '**Emergency Mode Triggered**\n\nAre you stuck in a simulation loop? Describe your problem—like \'M10 thread pitch\' or \'S355 steel yield strength\'—and I\'ll provide standard reference values immediately.',
  generalFallback: 'I\'ve analyzed your input ("{query}"). While it sounds interesting, I\'m currently specialized in **50+ engineering modules** including CAD, FEA, and Structural analysis. Give me a technical parameter to get a real Gemini-level breakdown!',
  notSet: 'Not set',
};

const TR = {
  feedbackReply: '**Teknik Hata Bildirimi**\n\nAnalitik sonuçlardaki tutarsızlığı fark ettiğiniz için teşekkürler. Mühendislik kütüphanelerimiz bazen aşırı hassas sınır koşullarında sapma yapabilir. Lütfen teknik ekibimize bildirin, anında inceleyelim.',
  feedbackAction: 'Teknik Destekle İletişime Geç',
  resetReply: 'Mühendislik hafızam sıfırlandı. Yeni parametrelerinizi tanımlayabilirsiniz.',
  moduleOnPage: 'Şu anda zaten **{label}** modülündesin. Bu modül ile kompleks sistemleri simüle edebilir, sınır koşullarını değiştirebilir ve gerçek zamanlı analitik verileri aşağıdaki panellerden takip edebilirsin. Spesifik bir hesaplama (örneğin: "Giriş torku 50Nm ise ne olur?") sormak ister misin?',
  moduleRoute: 'Seni **{label}** modülüne yönlendirebilirim. Bu modülün derinlikleri:\n\n{desc}\n\nGitmek için aşağıdaki butonu kullanabilirsin.',
  contextReply: 'Şu an **{label}** çalışma istasyonundasın.\n\n{desc}\n\nBuradaki tüm hesaplamalar ISO ve DIN standartlarına göre gerçek zamanlı çözülmektedir. Hangi parametre üzerinde optimizasyon yapmak istersin?',
  assumeSteel: 'Varsayılan olarak çelik (S235JR) malzeme seçildi.',
  assumeLength: 'Açıklık boyu varsayılan 2 metre (2000 mm) kabul edildi.',
  assumeForce: 'Yük varsayılan 5000 N (5 kN) kabul edildi.',
  assumeProfile: 'Profil kesiti 50x100 mm dikdörtgen kutu profil kabul edildi.',
  openBeamDeflection: 'Kiriş Sehim Modülünü Aç',
  simplySupported: 'Basit Mesnetli',
  cantilever: 'Konsol Kiriş',
  safe: '✅ GÜVENLİ',
  critical: '❌ KRİTİK SEVİYE',
  paramsHeader: 'Hafıza güncellendi:\n',
  paramsFooter: "\nHesaplamayı başlatmak için 'hesapla' veya 'sehim analizi yap' yazabilirsiniz.",
  materialLine: '• **Malzeme:** {type} ({grade})\n',
  loadLine: '• **Yük (F):** {val} N\n',
  lengthLine: '• **Boy (L):** {val} mm\n',
  profileLine: '• **Profil Kesiti:** {w}x{h} mm\n',
  mThreadTitle: '**M{size} Metrik Vida Bilgileri**\n\nBu vida için standart adım **{pitch} mm**\'dir. Matkap deliği olarak **{drill} mm** kullanmanı öneririm. Bağlantı elemanları modülünde daha fazla detay bulabilirsin.',
  openFasteners: 'Bağlantı Elemanlarını Aç',
  defaultFallback: "Girdiğiniz metinde mühendislik terimi tespit edilemedi. Lütfen 'S235 çelik için 5000N yük' veya 'M12 vida' gibi belirgin bir talep giriniz.",
  whoAreYou: 'Ben AluCalc\'ın **Sovereign Intelligence** katmanıyım.\n• Malzeme: {material}\n• Yük: {load}\n• Boy: {span}\n\nParametrelerinizi girerek analiz yapmamı isteyebilirsiniz.',
  helpReply: '**Acil Durum Modu Aktif**\n\nNerede takıldın? Spesifik bir mühendislik problemi söylersen (örn: \'M12 torku\') anında çözebiliriz.',
  generalFallback: 'Söylediğin şeyi ("{query}") geniş mühendislik veritabanımda taradım. Daha spesifik bir şey denemek ister misin?',
  notSet: 'Henüz girilmedi',
};

const mk = (tr, de, es, fr, it, pt, ru, ja, zh, ko, ar) => ({ tr, de, es, fr, it, pt, ru, ja, zh, ko, ar });
const LOCALES = mk(TR,
  { feedbackAction: 'Technischen Support kontaktieren', resetReply: 'Speicher zurückgesetzt. Bereit für neue Parameter.', openBeamDeflection: 'Balkendurchbiegung öffnen', openFasteners: 'Verbindungselemente öffnen', defaultFallback: 'Keine Ingenieurparameter erkannt. Bitte z. B. \'S235 Stahl 5000N\' angeben.' },
  { feedbackAction: 'Contactar soporte técnico', resetReply: 'Memoria reiniciada. Listo para nuevos parámetros.', openBeamDeflection: 'Abrir deflexión de viga', openFasteners: 'Abrir elementos de fijación', defaultFallback: 'No se detectaron parámetros de ingeniería. Especifique p. ej. \'acero S235 5000N\' o \'M12\'.' },
  { feedbackAction: 'Contacter le support technique', resetReply: 'Mémoire réinitialisée. Prêt pour de nouveaux paramètres.', openBeamDeflection: 'Ouvrir flèche de poutre', openFasteners: 'Ouvrir éléments de fixation', defaultFallback: 'Aucun paramètre d\'ingénierie détecté. Précisez p. ex. \'acier S235 5000N\' ou \'M12\'.' },
  { feedbackAction: 'Contatta supporto tecnico', resetReply: 'Memoria azzerata. Pronto per nuovi parametri.', openBeamDeflection: 'Apri deflessione trave', openFasteners: 'Apri elementi di fissaggio', defaultFallback: 'Nessun parametro rilevato. Specificare es. \'acciaio S235 5000N\' o \'M12\'.' },
  { feedbackAction: 'Contactar suporte técnico', resetReply: 'Memória reiniciada. Pronto para novos parâmetros.', openBeamDeflection: 'Abrir deflexão de viga', openFasteners: 'Abrir elementos de fixação', defaultFallback: 'Nenhum parâmetro detectado. Especifique ex. \'aço S235 5000N\' ou \'M12\'.' },
  { feedbackAction: 'Связаться с поддержкой', resetReply: 'Память сброшена. Готов к новым параметрам.', openBeamDeflection: 'Открыть прогиб балки', openFasteners: 'Открыть крепёж', defaultFallback: 'Инженерные параметры не обнаружены. Укажите, напр., \'сталь S235 5000Н\' или \'M12\'.' },
  { feedbackAction: '技術サポートに連絡', resetReply: 'メモリをリセットしました。新しいパラメータの準備ができています。', openBeamDeflection: 'はりたわみモジュールを開く', openFasteners: '締結部品を開く', defaultFallback: '工学パラメータが検出されませんでした。例：\'S235鋼 5000N\' または \'M12\'。' },
  { feedbackAction: '联系技术支持', resetReply: '记忆已重置。可输入新参数。', openBeamDeflection: '打开梁挠度求解器', openFasteners: '打开紧固件套件', defaultFallback: '未检测到工程参数。请指定如 \'S235钢 5000N\' 或 \'M12螺纹\'。' },
  { feedbackAction: '기술 지원 문의', resetReply: '메모리가 초기화되었습니다. 새 매개변수를 입력하세요.', openBeamDeflection: '보 처짐 솔버 열기', openFasteners: '체결 부품 열기', defaultFallback: '공학 매개변수가 감지되지 않았습니다. 예: \'S235 강철 5000N\' 또는 \'M12\'.' },
  { feedbackAction: 'اتصل بالدعم الفني', resetReply: 'تم إعادة تعيين الذاكرة. جاهز لمعاملات جديدة.', openBeamDeflection: 'فتح انحراف العتبة', openFasteners: 'فتح عناصر التثبيت', defaultFallback: 'لم يتم اكتشاف معاملات هندسية. حدد مثلاً \'فولاذ S235 5000N\' أو \'M12\'.' },
);

const bundles = { en: EN };
for (const lang of LANGS) {
  if (lang === 'en') continue;
  bundles[lang] = { ...EN, ...(LOCALES[lang] ?? {}) };
}

const typeBody = Object.keys(EN).map((k) => `  ${k}: string;`).join('\n');
const content = `import type { Language } from '@/store/i18nStore';
import { getCopilotModuleLabel } from './copilotModuleLabels';

export type CopilotEngineStrings = {
${typeBody}
};

const EN: CopilotEngineStrings = ${JSON.stringify(EN, null, 2)} as CopilotEngineStrings;

${LANGS.filter((l) => l !== 'en').map((lang) => `const ${lang.toUpperCase()}: CopilotEngineStrings = ${JSON.stringify(bundles[lang], null, 2)} as CopilotEngineStrings;`).join('\n\n')}

const BY_LOCALE: Record<Language, CopilotEngineStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getCopilotEngineStrings(locale: string): CopilotEngineStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}

/** Replace {key} placeholders in copilot templates */
export function copilotFmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\\{([a-zA-Z]+)\\}/g, (_, k) => String(vars[k] ?? ''));
}

/** Module routes — localized labels for all 12 languages; descriptions use en/tr */
export function getModuleLocaleCopy<T extends { en: { label: string; desc: string }; tr: { label: string; desc: string }; route?: string }>(
  item: T & { route?: string },
  locale: string,
): { label: string; desc: string } {
  const lang = locale as Language;
  const route = item.route ?? '';
  const label = route
    ? getCopilotModuleLabel(route, lang, item.en.label)
    : (lang === 'tr' ? item.tr.label : item.en.label);
  const desc = lang === 'tr' ? item.tr.desc : item.en.desc;
  return { label, desc };
}
`;

fs.writeFileSync(OUT, content, 'utf8');
console.log('Wrote', OUT);
