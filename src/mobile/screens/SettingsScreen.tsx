'use client';

import { motion } from 'framer-motion';
import { Settings, Info, Mail, ExternalLink } from 'lucide-react';
import type { MobileStrings } from '@/locales/mobileTranslations';
import type { Language } from '@/store/i18nStore';
import type { Theme } from '@/store/osStore';
import type { MobileFontSize } from '@/mobile/store/mobileStore';
import { MOBILE_APP_VERSION } from '@/mobile/theme/mobileTheme';

const LANGUAGE_OPTIONS: { code: Language; labelKey: string }[] = [
  { code: 'en', labelKey: 'languageEn' },
  { code: 'tr', labelKey: 'languageTr' },
  { code: 'de', labelKey: 'languageDe' },
  { code: 'es', labelKey: 'languageEs' },
  { code: 'fr', labelKey: 'languageFr' },
  { code: 'it', labelKey: 'languageIt' },
  { code: 'pt', labelKey: 'languagePt' },
  { code: 'ru', labelKey: 'languageRu' },
  { code: 'ja', labelKey: 'languageJa' },
  { code: 'zh', labelKey: 'languageZh' },
  { code: 'ko', labelKey: 'languageKo' },
  { code: 'ar', labelKey: 'languageAr' },
];

type Props = {
  m: MobileStrings;
  osT: Record<string, unknown>;
  language: Language;
  setLanguage: (l: Language) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  unitSystem: 'metric' | 'imperial';
  setUnitSystem: (u: 'metric' | 'imperial') => void;
  fontSize: MobileFontSize;
  setFontSize: (s: MobileFontSize) => void;
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  onToggleBiometric: () => void;
  debugMode: boolean;
  toggleDebugMode: () => void;
  onClearCache: () => void;
  onClearProject: () => void;
  onShowAbout: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
};

export function SettingsScreen({
  m,
  osT,
  language,
  setLanguage,
  theme,
  setTheme,
  unitSystem,
  setUnitSystem,
  fontSize,
  setFontSize,
  reduceMotion,
  setReduceMotion,
  biometricEnabled,
  biometricAvailable,
  onToggleBiometric,
  debugMode,
  toggleDebugMode,
  onClearCache,
  onClearProject,
  onShowAbout,
  soundEnabled,
  onToggleSound,
}: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 space-y-6">
      <h3 className="text-md font-bold text-white flex items-center gap-2 pb-2 border-b border-white/5">
        <Settings size={16} className="text-cyan-400" />
        {m.settings}
      </h3>

      <div className="space-y-4">
        <Section title={m.language}>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGE_OPTIONS.map(({ code, labelKey }) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                className={`py-2.5 text-[10px] font-bold rounded-lg border transition-all ${language === code ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400' : 'bg-transparent border-white/5 text-slate-400'}`}
              >
                {(osT as Record<string, string>)[labelKey] ?? code.toUpperCase()}
              </button>
            ))}
          </div>
        </Section>

        <Section title={m.theme}>
          <div className="flex gap-2">
            {(['dark', 'light'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 py-3 text-xs font-bold uppercase rounded-lg border ${theme === t ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400' : 'bg-transparent border-white/5 text-slate-400'}`}
              >
                {t === 'dark' ? m.themeDark : m.themeLight}
              </button>
            ))}
          </div>
        </Section>

        <Section title={m.unitSystem}>
          <div className="flex gap-2">
            {(['metric', 'imperial'] as const).map((unit) => (
              <button
                key={unit}
                onClick={() => setUnitSystem(unit)}
                className={`flex-1 py-3 text-xs font-bold uppercase rounded-lg border ${unitSystem === unit ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400' : 'bg-transparent border-white/5 text-slate-400'}`}
              >
                {unit === 'metric' ? m.metricUnits : m.imperialUnits}
              </button>
            ))}
          </div>
        </Section>

        <Section title={m.fontSize}>
          <div className="flex gap-2">
            {(['small', 'medium', 'large'] as MobileFontSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`flex-1 py-3 text-xs font-bold uppercase rounded-lg border ${fontSize === size ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400' : 'bg-transparent border-white/5 text-slate-400'}`}
              >
                {size === 'small' ? m.fontSizeSmall : size === 'large' ? m.fontSizeLarge : m.fontSizeMedium}
              </button>
            ))}
          </div>
        </Section>

        <Section title={m.accessibility}>
          <ToggleRow
            label={m.reduceMotion}
            checked={reduceMotion}
            onChange={setReduceMotion}
          />
          <ToggleRow
            label={language === 'tr' ? 'Sesli Geri Bildirim' : 'Audio Feedback'}
            checked={soundEnabled}
            onChange={onToggleSound}
          />
          {biometricAvailable && (
            <ToggleRow
              label={m.biometricLock}
              checked={biometricEnabled}
              onChange={onToggleBiometric}
            />
          )}
        </Section>

        <Section title={String(osT.toggleDevMode ?? 'Developer')}>
          <button
            onClick={toggleDebugMode}
            className={`w-full py-3 text-xs font-bold uppercase rounded-lg border ${debugMode ? 'bg-amber-500/15 border-amber-500 text-amber-400' : 'bg-transparent border-white/5 text-slate-400'}`}
          >
            {debugMode ? String(osT.statusOptimized ?? 'Optimized') : String(osT.toggleDevMode ?? 'Dev Mode')}
          </button>
        </Section>

        <div className="space-y-2">
          <button
            onClick={onClearCache}
            className="w-full py-3 bg-slate-900 border border-white/5 text-slate-400 rounded-xl text-xs font-bold uppercase"
          >
            {m.clearCache}
          </button>
          <button
            onClick={onClearProject}
            className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold uppercase"
          >
            {m.clearProject}
          </button>
        </div>

        <button
          onClick={onShowAbout}
          className="w-full py-4 flex items-center justify-between px-4 bg-slate-950/30 border border-white/5 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <Info size={18} className="text-cyan-400" />
            <span className="font-bold text-sm text-white">{m.about}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">v{MOBILE_APP_VERSION}</span>
        </button>
      </div>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl border border-white/5 bg-slate-950/20 space-y-3">
      <span className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">{title}</span>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-cyan-500' : 'bg-slate-700'}`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  );
}

export function AboutScreen({ m, onClose }: { m: MobileStrings; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-[60] bg-[#020408] flex flex-col p-6"
    >
      <button onClick={onClose} className="self-end text-slate-500 text-xs font-bold uppercase mb-8">
        {m.back}
      </button>
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-24 h-24 bg-cyan-500 rounded-3xl flex items-center justify-center text-black font-black text-3xl shadow-[0_0_40px_rgba(6,182,212,0.4)]">
          AC
        </div>
        <div>
          <h1 className="text-xl font-black text-white">{m.aboutTitle}</h1>
          <p className="text-sm text-slate-500 mt-2">AluCalc OS — {m.appVersion} {MOBILE_APP_VERSION}</p>
        </div>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{m.aboutDescription}</p>
        <a
          href="mailto:feedback@alucalculator.com?subject=AluCalc%20Mobile%20Feedback"
          className="flex items-center gap-2 px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl text-xs font-bold uppercase"
        >
          <Mail size={14} />
          {m.sendFeedback}
        </a>
        <a
          href="https://www.alucalculator.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-slate-500 text-xs"
        >
          www.alucalculator.com <ExternalLink size={12} />
        </a>
      </div>
    </motion.div>
  );
}
