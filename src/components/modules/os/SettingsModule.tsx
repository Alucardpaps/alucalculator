'use client';

import React, { useState } from 'react';
import { ThemeGrid } from '@/components/settings/ThemePicker';
import { AIConnectPanel } from '@/components/settings/AIConnectPanel';
import { ReportBrandingPanel } from '@/components/settings/ReportBrandingPanel';
import { BackdropPicker } from '@/components/settings/BackdropPicker';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { LANGUAGE_OPTIONS } from '@/locales/siteNav';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { useOSStore } from '@/store/osStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Monitor,
    Globe,
    Type,
    Palette,
    Check,
    Moon,
    Sun,
    Droplets,
    Cloud,
    BookOpen,
    Info,
    Shield,
    Languages,
    Wrench,
    Sparkles,
    Binary,
    Sliders,
    RotateCcw,
    FileText
} from 'lucide-react';
import { formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

export default function SettingsModule() {
    const { t, language, setLanguage } = useI18nStore();
    const {
        theme, setTheme,
        fontSize, setFontSize,
        fontFamily, setFontFamily,
        decimalPrecision, setDecimalPrecision,
        unitSystem, setUnitSystem,
        activeSettingsTab: activeTab,
        setActiveSettingsTab: setActiveTab
    } = useOSStore();


    const languages = LANGUAGE_OPTIONS;

    const themes = [
        { id: 'dark', label: t.themeDark, icon: Moon, color: 'bg-[var(--bg-1)]', desc: t.themeDarkDesc },
        { id: 'light', label: t.themeLight, icon: Sun, color: 'bg-[#f8fafc]', desc: t.themeLightDesc },
        { id: 'paper', label: t.themePaper, icon: BookOpen, color: 'bg-[#2c5ea8]', desc: t.themePaperDesc },
        { id: 'sea', label: t.themeSea, icon: Droplets, color: 'bg-[var(--bg-2)]', desc: t.themeSeaDesc },
        { id: 'sky', label: t.themeSky, icon: Cloud, color: 'bg-[var(--ink)]', desc: t.themeSkyDesc },
    ];



    return (
        <div className="flex h-full w-full min-w-0 min-h-[600px] bg-[var(--bg-0)]/80 text-slate-300 font-sans select-none overflow-hidden">
            {/* Left Navigation Sidebar */}
            <div className="w-64 flex-none border-r border-white/5 p-6 flex flex-col justify-between">
                <div className="space-y-8">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--cyan-glow)] flex items-center justify-center border border-[var(--cyan)]/40 ">
                            <Monitor className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white tracking-widest uppercase">{t.settings}</h1>
                            <p className="text-[9px] text-slate-500 font-mono">{t.systemInit}</p>
                        </div>

                    </div>

                    <nav className="space-y-1">
                        <NavBtn active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} icon={Palette} label={t.appearance} />
                        <NavBtn active={activeTab === 'language'} onClick={() => setActiveTab('language')} icon={Globe} label={t.language} />
                        <NavBtn active={activeTab === 'precision'} onClick={() => setActiveTab('precision')} icon={Binary} label={t12(language, 'Precision & Decimals', 'Hassasiyet & Ondalık')} />
                        <NavBtn active={activeTab === 'typography'} onClick={() => setActiveTab('typography')} icon={Type} label={t.typography} />
                        <NavBtn active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={FileText} label={t12(language, 'Reports & branding', 'Raporlar & kurumsal kimlik')} />
                        <NavBtn active={activeTab === 'about'} onClick={() => setActiveTab('about')} icon={Info} label={t.about} />

                    </nav>
                </div>

                <div className="px-2 py-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                        <Shield className="w-3 h-3" />
                        <span>{t.securityVerified}</span>
                    </div>

                </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="max-w-5xl mx-auto p-8 md:p-12 pb-24 h-full">
                    <AnimatePresence mode="wait">
                        {activeTab === 'appearance' && (
                            <motion.section
                                key="appearance"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-10"
                            >
                                <header>
                                    <h2 className="text-2xl font-bold text-white mb-2">{t.appearance}</h2>
                                    <p className="text-sm text-slate-400">{t.appearanceDesc}</p>
                                </header>



                                <ThemeGrid />

                                <BackdropPicker />

                                <div className="border-t border-[var(--line)] pt-8">
                                    <AIConnectPanel />
                                </div>
                            </motion.section>
                        )}

                        {activeTab === 'language' && (
                            <motion.section
                                key="language"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-10"
                            >
                                <header>
                                    <h2 className="text-2xl font-bold text-white mb-2">{t.language}</h2>
                                    <p className="text-sm text-slate-400">{t.languageDesc}</p>
                                </header>


                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {languages.map((lang) => (
                                        <button
                                            key={lang.id}
                                            type="button"
                                            title={lang.native}
                                            aria-label={lang.native}
                                            onClick={() => setLanguage(lang.id)}
                                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
                                                language === lang.id
                                                    ? 'bg-cyan-500/10 border-cyan-500/50 ring-1 ring-cyan-500/30 scale-105'
                                                    : 'bg-white/5 border-white/5 hover:bg-white/[0.1] hover:border-white/10'
                                            }`}
                                        >
                                            <FlagIcon lang={lang.id} className="w-8 h-5.5 object-cover rounded-md" />
                                            {language === lang.id && <Check className="w-4 h-4 text-cyan-400" />}
                                        </button>
                                    ))}
                                </div>

                            </motion.section>
                        )}

                        {activeTab === 'precision' && (
                            <motion.section
                                key="precision"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <header>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white mb-1">
                                                {t12(language, 'Calculation Precision & Decimals', 'Hesaplama Hassasiyeti & Ondalık Basamak')}
                                            </h2>
                                            <p className="text-sm text-slate-400">
                                                {t12(
                                                    language,
                                                    'Determines the number of decimal places for all calculation engines and smart inputs across the site.',
                                                    'Tüm sitedeki hesaplayıcıların virgülden sonraki basamak sayısını belirler. Anında tüm modüllere uygulanır.'
                                                )}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setDecimalPrecision(4)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
                                            title={t12(language, 'Reset to default (4 decimals)', 'Varsayılan değere dön (4 Basamak)')}
                                        >
                                            <RotateCcw size={12} className="text-cyan-400" />
                                            <span>{t12(language, 'Default (4)', 'Varsayılan (4)')}</span>
                                        </button>
                                    </div>
                                </header>

                                {/* Quick Standard Presets */}
                                <Card label={t12(language, 'Standard Precision Presets', 'Standart Hassasiyet Ön Ayarları')}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {[
                                            {
                                                digits: 2,
                                                label: t12(language, '2 Digits (.01)', '2 Basamak (.01)'),
                                                tag: t12(language, 'Field / Rough', 'Şantiye / Kaba'),
                                                desc: t12(language, 'Ideal for rough structural work and quick screening.', 'Büyük yapılar ve kaba montaj toleransları için ideal.'),
                                            },
                                            {
                                                digits: 3,
                                                label: t12(language, '3 Digits (.001)', '3 Basamak (.001)'),
                                                tag: t12(language, 'Machining / Shop', 'Talaşlı / İmalat'),
                                                desc: t12(language, 'CNC milling, turning, and shop tolerances.', 'CNC işleme, mil-delik geçmeleri ve atölye üretimi.'),
                                            },
                                            {
                                                digits: 4,
                                                label: t12(language, '4 Digits (.0001)', '4 Basamak (.0001)'),
                                                tag: t12(language, 'Engineering / ISO', 'Mühendislik / ISO'),
                                                desc: t12(language, 'Recommended standard: FEA, bolt torque, gear stresses.', 'Önerilen standart: FEA, cıvata torku, dişli mukavemeti.'),
                                            },
                                            {
                                                digits: 6,
                                                label: t12(language, '6 Digits (.000001)', '6 Basamak (.000001)'),
                                                tag: t12(language, 'Metrology / Aero', 'Metroloji / Bilimsel'),
                                                desc: t12(language, 'Aerospace, optical, and scientific simulation tolerances.', 'Havacılık, optik ve bilimsel simülasyon hesaplamaları.'),
                                            },
                                        ].map((p) => (
                                            <button
                                                key={p.digits}
                                                type="button"
                                                onClick={() => setDecimalPrecision(p.digits)}
                                                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                                                    decimalPrecision === p.digits
                                                        ? 'bg-cyan-500/10 border-cyan-500/60 ring-1 ring-cyan-500/40 '
                                                        : 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-mono text-sm font-bold text-white">{p.label}</span>
                                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-cyan-400 border border-cyan-500/20">
                                                        {p.tag}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </Card>

                                {/* Custom Precision Fine Tuning Slider */}
                                <Card label={t12(language, 'Custom Fine Precision Slider (1 - 8 Digits)', 'Özel Hassas Ayar Çubuğu (1 - 8 Basamak)')}>
                                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-white">
                                                {t12(language, 'Active Decimal Digits:', 'Aktif Basamak Sayısı:')}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-base font-bold border border-cyan-500/40 shadow-sm">
                                                    {decimalPrecision} {t12(language, 'Decimals', 'Basamak')}
                                                </span>
                                                <span className="text-xs font-mono text-slate-400">
                                                    (10^{`-${decimalPrecision}`})
                                                </span>
                                            </div>
                                        </div>

                                        <input
                                            type="range"
                                            min={1}
                                            max={8}
                                            step={1}
                                            value={decimalPrecision}
                                            onChange={(e) => setDecimalPrecision(Number(e.target.value))}
                                            className="w-full accent-[var(--cyan)] cursor-pointer h-2 bg-black/40 rounded-lg appearance-none"
                                        />

                                        <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
                                            <span>1 (.0)</span>
                                            <span>2 (.00)</span>
                                            <span>3 (.000)</span>
                                            <span className="text-cyan-400 font-bold">4 (.0000 ISO)</span>
                                            <span>5</span>
                                            <span>6 (.000000)</span>
                                            <span>7</span>
                                            <span>8 (Ultra)</span>
                                        </div>
                                    </div>
                                </Card>

                                {/* Live Interactive Engineering Telemetry Preview */}
                                <Card label={t12(language, 'Live Engineering Telemetry Preview', 'Canlı Mühendislik Çıktı Önizlemesi')}>
                                    <div className="p-5 rounded-2xl bg-[var(--bg-1)] border border-cyan-500/20 shadow-xl space-y-3 font-mono">
                                        <div className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold mb-3 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                            <span>{t12(language, 'System Outputs Will Render at This Precision:', 'Sistem Çıktıları Bu Hassasiyetle Formatlanacak:')}</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                                                <div className="text-[10px] text-slate-500">{t12(language, 'Tightening Torque (MA)', 'Sıkma Torku (MA)')}</div>
                                                <div className="text-base font-bold text-white mt-1">
                                                    {formatEngineeringValue(87.432891, decimalPrecision)} <span className="text-xs text-cyan-400 font-normal">N·m</span>
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                                                <div className="text-[10px] text-slate-500">{t12(language, 'Bolt Preload (FM)', 'Cıvata Ön Yükü (FM)')}</div>
                                                <div className="text-base font-bold text-white mt-1">
                                                    {formatEngineeringValue(41.258734, decimalPrecision)} <span className="text-xs text-cyan-400 font-normal">kN</span>
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                                                <div className="text-[10px] text-slate-500">{t12(language, 'Yield Strength (Sy)', 'Akma Mukavemeti (Sy)')}</div>
                                                <div className="text-base font-bold text-white mt-1">
                                                    {formatEngineeringValue(640.128765, decimalPrecision)} <span className="text-xs text-cyan-400 font-normal">MPa</span>
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                                                <div className="text-[10px] text-slate-500">{t12(language, 'Beam Deflection (f)', 'Kiriş Sehimi (f)')}</div>
                                                <div className="text-base font-bold text-white mt-1">
                                                    {formatEngineeringValue(0.043289, decimalPrecision)} <span className="text-xs text-cyan-400 font-normal">mm</span>
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                                                <div className="text-[10px] text-slate-500">{t12(language, 'Pi Constant (π)', 'Pi Sayısı (π)')}</div>
                                                <div className="text-base font-bold text-white mt-1">
                                                    {formatEngineeringValue(Math.PI, decimalPrecision)}
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                                                <div className="text-[10px] text-slate-500">{t12(language, 'Euler Constant (e)', 'Euler Sabiti (e)')}</div>
                                                <div className="text-base font-bold text-white mt-1">
                                                    {formatEngineeringValue(Math.E, decimalPrecision)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.section>
                        )}

                        {activeTab === 'typography' && (
                            <motion.section
                                key="typography"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-10"
                            >
                                <header>
                                    <h2 className="text-2xl font-bold text-white mb-2">{t.typography}</h2>
                                    <p className="text-sm text-slate-400">{t.typographyDesc}</p>
                                </header>


                                <div className="space-y-8">
                                    <Card label={t.fontFamily}>

                                        <div className="flex gap-2 p-1 bg-black/20 rounded-xl">
                                            {['sans', 'mono', 'serif'].map((font) => (
                                                <button
                                                    key={font}
                                                    onClick={() => setFontFamily(font as any)}
                                                    className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${fontFamily === font ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                                    style={{ fontFamily: font === 'mono' ? 'monospace' : font === 'serif' ? 'serif' : 'sans-serif' }}
                                                >
                                                    {font.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </Card>

                                    <Card label={t.fontSizeKey}>

                                        <div className="flex gap-2 p-1 bg-black/20 rounded-xl">
                                            {[
                                                { id: 'auto', label: 'AUTO' },
                                                { id: 'small', label: 'S (90%)' },
                                                { id: 'medium', label: 'M (100%)' },
                                                { id: 'large', label: 'L (115%)' },
                                                { id: 'xlarge', label: 'XL (130%)' }
                                            ].map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setFontSize(item.id as any)}
                                                    className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${fontSize === item.id ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </Card>

                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 border-dashed">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3 font-bold">{t.fontPreviewLabel}</p>
                                        <p className="text-slate-300 leading-relaxed" style={{ fontSize: fontSize === 'xlarge' ? '1.25rem' : fontSize === 'large' ? '1.15rem' : fontSize === 'small' ? '0.9rem' : '1rem' }}>
                                            {t.fontPreviewText}
                                        </p>
                                    </div>
                                </div>
                            </motion.section>
                        )}

                        {activeTab === 'reports' && (
                            <motion.section
                                key="reports"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <header>
                                    <h2 className="text-2xl font-bold text-[var(--ink)] mb-2">{t12(language, 'Reports & branding', 'Raporlar & kurumsal kimlik')}</h2>
                                    <p className="text-sm text-[var(--alu-dim)]">{t12(language, 'Company logo, name and the Designed / Checked / Approved block printed on PDF and print reports.', 'PDF ve yazdırma raporlarına basılan firma amblemi, adı ve Tasarlayan / Kontrol eden / Onaylayan bloğu.')}</p>
                                </header>
                                <ReportBrandingPanel />
                            </motion.section>
                        )}

                        {activeTab === 'about' && (
                            <motion.section
                                key="about"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-10"
                            >
                                <header>
                                    <h2 className="text-2xl font-bold text-white mb-2">{t.about} {t.osName}</h2>
                                    <p className="text-sm text-slate-400">{t.systemVersion}</p>
                                </header>


                                <div className="space-y-4">
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4 font-mono text-xs">
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-slate-500 uppercase">{t.architecture}</span>
                                            <span className="text-cyan-400">{t.archName}</span>
                                        </div>

                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-slate-500 uppercase">{t.engineStatus}</span>
                                            <span className="text-green-500">{t.statusOptimized}</span>
                                        </div>

                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-slate-500 uppercase">{t.localeLatency}</span>
                                            <span className="text-slate-300">{t.latencyValue}</span>
                                        </div>

                                    </div>
                                    <p className="text-[10px] text-slate-600 px-2 italic">{t.aboutDesc}</p>
                                </div>

                            </motion.section>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function NavBtn({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${active ? 'bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20 shadow-lg' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
        >
            <Icon size={18} className={active ? 'text-cyan-400' : 'text-slate-500'} />
            <span className="text-sm font-bold tracking-wide">{label}</span>
        </button>
    );
}

function Card({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-600 pl-1">{label}</h4>
            {children}
        </div>
    );
}
