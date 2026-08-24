'use client';

import React, { useState } from 'react';
import { useI18nStore } from '@/store/i18nStore';
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
    Languages
} from 'lucide-react';

type SettingsTab = 'appearance' | 'language' | 'typography' | 'about';

export default function SettingsModule() {
    const { t, language, setLanguage } = useI18nStore();
    const {
        theme, setTheme,
        fontSize, setFontSize,
        fontFamily, setFontFamily,
        activeSettingsTab: activeTab,
        setActiveSettingsTab: setActiveTab
    } = useOSStore();


    const languages = LANGUAGE_OPTIONS;

    const themes = [
        { id: 'dark', label: t.themeDark, icon: Moon, color: 'bg-[#0a0e14]', desc: t.themeDarkDesc },
        { id: 'light', label: t.themeLight, icon: Sun, color: 'bg-[#f8fafc]', desc: t.themeLightDesc },
        { id: 'paper', label: t.themePaper, icon: BookOpen, color: 'bg-[#2c5ea8]', desc: t.themePaperDesc },
        { id: 'sea', label: t.themeSea, icon: Droplets, color: 'bg-[#001e2b]', desc: t.themeSeaDesc },
        { id: 'sky', label: t.themeSky, icon: Cloud, color: 'bg-[#e0f2fe]', desc: t.themeSkyDesc },
    ];



    return (
        <div className="flex h-full w-full min-w-[800px] min-h-[600px] bg-[#05090e]/80 backdrop-blur-3xl text-slate-300 font-sans select-none overflow-hidden">
            {/* Left Navigation Sidebar */}
            <div className="w-64 flex-none border-r border-white/5 p-6 flex flex-col justify-between">
                <div className="space-y-8">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
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
                        <NavBtn active={activeTab === 'typography'} onClick={() => setActiveTab('typography')} icon={Type} label={t.typography} />
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


                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {themes.map((th) => (
                                        <button
                                            key={th.id}
                                            onClick={() => setTheme(th.id as any)}
                                            className={`p-5 rounded-2xl border text-left transition-all duration-300 group ${theme === th.id ? 'bg-white/10 border-cyan-500/50 ring-1 ring-cyan-500/50' : 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10'}`}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`w-10 h-10 rounded-xl ${th.color} flex items-center justify-center border border-white/10 shadow-lg`}>
                                                    <th.icon className={`w-5 h-5 ${th.id === 'light' ? 'text-slate-800' : 'text-white'}`} />
                                                </div>
                                                {theme === th.id && <div className="bg-cyan-500 w-2 h-2 rounded-full shadow-[0_0_8px_rgba(6,182,212,1)]" />}
                                            </div>
                                            <h3 className="text-white font-bold text-sm mb-1">{th.label}</h3>
                                            <p className="text-xs text-slate-500 leading-relaxed">{th.desc}</p>
                                        </button>
                                    ))}
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
                                            {['small', 'medium', 'large'].map((size) => (
                                                <button
                                                    key={size}
                                                    onClick={() => setFontSize(size as any)}
                                                    className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${fontSize === size ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                                >
                                                    {size.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </Card>

                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 border-dashed">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3 font-bold">{t.fontPreviewLabel}</p>
                                        <p className="text-slate-300 leading-relaxed" style={{ fontSize: fontSize === 'large' ? '1.1rem' : fontSize === 'small' ? '0.8rem' : '0.95rem' }}>
                                            {t.fontPreviewText}
                                        </p>
                                    </div>
                                </div>
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
