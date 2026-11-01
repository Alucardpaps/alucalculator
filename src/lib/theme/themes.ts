/**
 * Theme registry — single source of truth for the theme picker, the
 * pre-paint init script and the <meta name="theme-color"> value.
 * CSS lives in src/styles/themes.css; keep ids in sync.
 */
export type ThemeId = 'graphite' | 'midnight' | 'oled' | 'light' | 'paper';
export type ThemePreference = ThemeId | 'system';

export interface ThemeInfo {
  id: ThemeId;
  kind: 'dark' | 'light';
  name: { tr: string; en: string };
  description: { tr: string; en: string };
  /** swatches for the picker preview: page, card, text, accent */
  swatch: [string, string, string, string];
  /** browser chrome colour */
  metaColor: string;
}

export const DEFAULT_THEME: ThemeId = 'graphite';
export const DEFAULT_LIGHT_THEME: ThemeId = 'light';
export const THEME_STORAGE_KEY = 'alucalc-theme';

export const THEMES: ThemeInfo[] = [
  {
    id: 'graphite',
    kind: 'dark',
    name: { tr: 'Grafit', en: 'Graphite' },
    description: { tr: 'Varsayılan koyu tema. Nötr, uzun süreli çalışmaya uygun.', en: 'Default dark. Neutral and easy on the eyes.' },
    swatch: ['#0c0e11', '#161a1f', '#eceff3', '#3cc6e6'],
    metaColor: '#0c0e11',
  },
  {
    id: 'midnight',
    kind: 'dark',
    name: { tr: 'Gece Mavisi', en: 'Midnight' },
    description: { tr: 'Lacivert tonlu koyu tema, mavi vurgu.', en: 'Navy-tinted dark with a blue accent.' },
    swatch: ['#070b14', '#101829', '#edf2fb', '#4ea8ff'],
    metaColor: '#070b14',
  },
  {
    id: 'oled',
    kind: 'dark',
    name: { tr: 'OLED Siyah', en: 'OLED Black' },
    description: { tr: 'Saf siyah, yüksek kontrast. Telefonda pil dostu.', en: 'True black, high contrast. Battery friendly on phones.' },
    swatch: ['#000000', '#0c0c0c', '#f5f5f5', '#00e5ff'],
    metaColor: '#000000',
  },
  {
    id: 'light',
    kind: 'light',
    name: { tr: 'Açık', en: 'Light' },
    description: { tr: 'Temiz, aydınlık ofis teması.', en: 'Clean, bright office theme.' },
    swatch: ['#f3f4f6', '#ffffff', '#14171c', '#0a7ea4'],
    metaColor: '#fbfbfc',
  },
  {
    id: 'paper',
    kind: 'light',
    name: { tr: 'Teknik Kağıt', en: 'Drafting Paper' },
    description: { tr: 'Sıcak kağıt zemin, mavi mürekkep. Çizim masası hissi.', en: 'Warm paper, blue ink. Drafting-table feel.' },
    swatch: ['#f1ede4', '#fffdf8', '#1b2440', '#1f4fd1'],
    metaColor: '#f8f5ee',
  },
];

export const THEME_IDS = THEMES.map((t) => t.id);

export function getTheme(id: string | null | undefined): ThemeInfo {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function resolveTheme(pref: ThemePreference, prefersDark: boolean): ThemeId {
  if (pref === 'system') return prefersDark ? DEFAULT_THEME : DEFAULT_LIGHT_THEME;
  return THEME_IDS.includes(pref) ? pref : DEFAULT_THEME;
}

/**
 * Inline, render-blocking script injected in <head>. Applies the stored theme
 * before first paint so there is no flash. Must stay dependency-free.
 * Also migrates the legacy `.light` / `.paper` class preference.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var K='${THEME_STORAGE_KEY}',ids=${JSON.stringify(THEME_IDS)},meta=${JSON.stringify(
  Object.fromEntries(THEMES.map((t) => [t.id, t.metaColor])),
)};
var p=localStorage.getItem(K);
if(!p){var o=null;try{o=JSON.parse(localStorage.getItem('alucalc-theme-settings')||'null')}catch(e){}
var legacy=o&&(o.state&&o.state.theme||o.theme);if(legacy==='light'||legacy==='sky')p='light';else if(legacy==='paper')p='paper';else if(legacy==='sea')p='midnight';}
p=p||'${DEFAULT_THEME}';
var t=p==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'${DEFAULT_LIGHT_THEME}':'${DEFAULT_THEME}'):(ids.indexOf(p)>-1?p:'${DEFAULT_THEME}');
var d=document.documentElement;d.setAttribute('data-theme',t);d.classList.add('dark');
var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',meta[t]);
}catch(e){document.documentElement.setAttribute('data-theme','${DEFAULT_THEME}')}})();`;
