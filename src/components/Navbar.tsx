"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Menu, X, LayoutGrid, Ruler, Cog, Zap, Anchor, Flame, Layers, Droplets, Settings, ArrowRightLeft, Database, BookOpen, Mail, Newspaper, Calculator } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { AdvancedCalculator } from './AdvancedCalculator';

export const Navbar = ({ lang, dict }: { lang: string, dict: any }) => {
    const modules = [
        { label: dict.modules?.aluminum?.title || 'Aluminum Weight', icon: Database, path: '/aluminum' },
        { label: dict.fit?.title || 'Fits (ISO 286)', icon: Ruler, path: '/fits' },
        { label: dict.gear?.title || 'Gears', icon: Cog, path: '/gears' },
        { label: dict.strength?.title || 'Strength', icon: Zap, path: '/strength' },
        { label: dict.bearing?.title || 'Bearings', icon: Anchor, path: '/bearings' },
        { label: dict.welding?.title || 'Welding', icon: Flame, path: '/welding' },
        { label: dict.sheetMetal?.title || 'Sheet Metal', icon: Layers, path: '/sheet-metal' },
        { label: dict.pump?.title || 'Pumps', icon: Droplets, path: '/pumps' },
        { label: dict.fastener?.title || 'Fasteners', icon: Settings, path: '/fasteners' },
        { label: dict.converter?.title || 'Converter', icon: ArrowRightLeft, path: '/converter' },
        { label: dict.nav?.handbook || 'Handbook', icon: BookOpen, path: '/handbook' },
        { label: dict.nav?.news || 'News', icon: Newspaper, path: '/news' },
    ];

    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [calcOpen, setCalcOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const langDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
            if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
                setLangDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        // Init theme
        const isDark = localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setDarkMode(isDark);
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleTheme = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
        if (newMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    };

    // Placeholder links - hidden if not implemented to avoid "useless" errors
    const navLinks = [
        { label: 'Dashboard', path: '/' },
        // { label: 'Handbook', path: '/handbook' }, // Hidden until implemented
        // { label: 'Materials', path: '/materials' }, // Hidden until implemented
    ];

    return (
        <>
            <AdvancedCalculator isOpen={calcOpen} onClose={() => setCalcOpen(false)} />

            <nav className={`w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm py-3' : 'bg-transparent py-4 text-white'}`}>
                <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">

                    {/* Logo & Brand */}
                    <div className="flex items-center gap-8">
                        <Link prefetch={false} href={`/${lang}`} className="flex items-center gap-2 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:rotate-12 transition-transform">
                                A
                            </div>
                            <span className={`text-xl font-black tracking-tight ${scrolled ? 'text-slate-800' : 'text-slate-800'}`}>
                                ALU<span className="text-blue-600">CALC</span>
                            </span>
                        </Link>

                        {/* Calculator Button */}
                        <button
                            onClick={() => setCalcOpen(true)}
                            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                            <Calculator size={14} />
                            CALCULATOR
                        </button>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-6">
                            {navLinks.map(link => (
                                <Link prefetch={false}
                                    key={link.path}
                                    href={`/${lang}${link.path}`}
                                    className={`text-sm font-bold hover:text-blue-600 transition-colors ${scrolled ? 'text-slate-600' : 'text-slate-800'}`}
                                >
                                    {link.label}
                                </Link>
                            ))}

                            {/* Module Mega Menu Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className={`flex items-center gap-1 text-sm font-bold transition-colors ${dropdownOpen ? 'text-blue-600' : (scrolled ? 'text-slate-600 hover:text-blue-600' : 'text-slate-800 hover:text-blue-600')}`}
                                >
                                    <LayoutGrid size={16} />
                                    Modules
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Content */}
                                {dropdownOpen && (
                                    <div className="absolute top-full left-0 mt-4 w-[600px] bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 z-[100]">
                                        {modules.map((module) => (
                                            <Link prefetch={false}
                                                key={module.path}
                                                href={`/${lang}${module.path}`}
                                                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <module.icon size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{module.label}</div>
                                                    <div className="text-xs text-slate-400 font-medium">Professional Tool</div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="hidden md:flex items-center gap-4">

                        {/* Language Dropdown */}
                        <div className="relative" ref={langDropdownRef}>
                            <button
                                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${scrolled ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-100 text-slate-800 hover:bg-white/20'}`}
                            >
                                <span className="text-lg leading-none">
                                    {lang === 'tr' ? '🇹🇷' :
                                        lang === 'de' ? '🇩🇪' :
                                            lang === 'fr' ? '🇫🇷' :
                                                lang === 'es' ? '🇪🇸' :
                                                    lang === 'it' ? '🇮🇹' :
                                                        lang === 'pt' ? '🇵🇹' :
                                                            lang === 'ru' ? '🇷🇺' :
                                                                lang === 'ja' ? '🇯🇵' :
                                                                    lang === 'zh' ? '🇨🇳' : '🇺🇸'}
                                </span>
                                <div>{lang}</div>
                                <ChevronDown size={14} />
                            </button>

                            {/* Lang Dropdown */}
                            {langDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-1 z-50">
                                    <div className="grid grid-cols-2 gap-1">
                                        {['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'ar'].map((locale) => {
                                            const path = `/${locale}${typeof window !== 'undefined' ? window.location.pathname.replace(/^\/[a-z]{2}/, '') : ''}`;
                                            return (
                                                <Link prefetch={false}
                                                    key={locale}
                                                    href={path}
                                                    className={`px-3 py-2 text-xs font-bold uppercase rounded-lg flex items-center justify-center transition-colors ${lang === locale ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                                                >
                                                    {locale}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 transition-colors ${scrolled ? 'text-slate-400 hover:text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Toggle Theme"
                        >
                            <div className={`w-5 h-5 rounded-full border-2 transition-all ${darkMode ? 'border-slate-400 bg-slate-800' : 'border-slate-300 bg-slate-50'}`}>
                                {darkMode && <div className="w-full h-full bg-slate-600 rounded-full scale-50" />}
                            </div>
                        </button>

                        {/* Mail Feedback Button */}
                        <a
                            href="mailto:abdulsametyildirim95@gmail.com?subject=Feedback"
                            className={`p-2 transition-colors ${scrolled ? 'text-slate-400 hover:text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
                            title="Send Feedback"
                        >
                            <Mail size={20} />
                        </a>

                        <a
                            href="mailto:sales@alucalculator.com"
                            className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
                        >
                            Contact Sales
                        </a>
                    </div>

                    {/* Mobile Toggle */}
                    <button className="md:hidden p-2 text-slate-800" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="absolute top-full left-0 w-full h-[calc(100vh-80px)] bg-white border-b border-slate-100 p-6 shadow-xl md:hidden flex flex-col gap-4 overflow-y-auto">
                        <button
                            onClick={() => { setCalcOpen(true); setMenuOpen(false); }}
                            className="flex items-center gap-2 px-3 py-3 bg-slate-100 text-slate-800 font-bold rounded-xl"
                        >
                            <Calculator size={18} />
                            OPEN CALCULATOR
                        </button>

                        {navLinks.map(l => (
                            <Link prefetch={false}
                                key={l.path}
                                href={`/${lang}${l.path}`}
                                onClick={() => setMenuOpen(false)}
                                className="text-lg font-bold text-slate-800 py-2 border-b border-slate-50"
                            >
                                {l.label}
                            </Link>
                        ))}

                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4 mb-2">Modules</div>
                        <div className="grid grid-cols-2 gap-2">
                            {modules.map(m => (
                                <Link prefetch={false}
                                    key={m.path}
                                    href={`/${lang}${m.path}`}
                                    onClick={() => setMenuOpen(false)}
                                    className="p-3 bg-slate-50 rounded-xl text-sm font-medium text-slate-600 flex items-center gap-2"
                                >
                                    <m.icon size={16} />
                                    {m.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
};
