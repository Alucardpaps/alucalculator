'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid, Calculator, Box, Database, MessageSquare, Settings,
    Search, ChevronLeft, ChevronRight, Share2, FileText, Check, Globe,
    Thermometer, Trash2, Cpu, RefreshCw, Layers, Plus, X, Play, Info, Flame,
    ArrowRight, Save, Download, Copy, CircleDot, Ruler, Zap
} from 'lucide-react';
import { useOSStore } from '@/store/osStore';
import { useI18nStore } from '@/store/i18nStore';
import { useProjectStore, ProjectVariable } from '@/store/projectStore';
import { useWorkspaceTabStore, WorkspaceTab } from '@/lib/store/workspaceTabStore';
import { MODULE_REGISTRY, ModuleType, getModuleIcon } from '@/config/modules';
import { WindowContent } from '@/components/os/WindowContent';
import { getLitePage, type LiteCategoryKey } from '@/locales/liteTranslations';
import dynamic from 'next/dynamic';

// Dynamic imports for heavy components to optimize mobile startup and prevent freezes
const AssemblyScene = dynamic(
  () => import('@/components/scene/AssemblyScene').then((m) => ({ default: m.AssemblyScene })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#080c12]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-t-[#00e5ff] border-white/10 rounded-full animate-spin mx-auto" />
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
            Loading 3D Assembly Engine...
          </p>
        </div>
      </div>
    ),
  }
);

const ComponentPalette = dynamic(() => import('@/components/ui/workspace/ComponentPalette').then(m => m.ComponentPalette), { ssr: false });
const BOMPanel = dynamic(() => import('@/components/ui/workspace/BOMPanel').then(m => m.BOMPanel), { ssr: false });

const LOCAL_TRANSLATIONS: Record<string, any> = {
    en: {
        dashboard: "Dashboard",
        solvers: "Solvers",
        cadWorkspace: "3D CAD",
        variables: "Variables",
        copilot: "Copilot",
        settings: "Settings",
        recentSolvers: "Recent Solvers",
        activeProject: "Active Project",
        searchSolvers: "Search solvers...",
        popularSolvers: "Popular Solvers",
        quickStats: "Quick Stats",
        latency: "Latency",
        status: "Status",
        online: "Online",
        version: "Version",
        solvedCount: "Solved Computations",
        noRecentCalculations: "No recent calculations in this session.",
        bomCount: "BOM Parts",
        allCategories: "All",
        back: "Back",
        saveSpec: "Save to BOM",
        share: "Share",
        pdfReport: "PDF Report",
        language: "Language",
        unitSystem: "Unit System",
        theme: "UI Theme",
        clearCache: "Clear App Cache",
        systemDiagnostics: "System Diagnostics",
        diagnosticsPass: "All checks passed",
        hardwareAccel: "WebGL Accelerator",
        active: "Active",
        inactive: "Inactive",
        copied: "Copied to clipboard!",
        copilotWelcome: "AluCalc AI Copilot",
        copilotSub: "Ask any engineering questions or request parameter lookup.",
        start3D: "Load 3D CAD Canvas",
        bomTitle: "Bill of Materials",
        compTitle: "Add Profile/Fastener",
        savedVars: "Saved Variables",
        varName: "Name",
        varValue: "Value",
        varSource: "Source",
        noVariables: "No saved variables yet. Compute something to save variables.",
        copiedVar: "Variable copied!",
        addVarBtn: "Add Variable",
        addVarTitle: "Add Custom Variable",
        placeholderName: "VAR_NAME",
        placeholderValue: "0",
        placeholderUnit: "mm",
        placeholderDesc: "Optional description",
        cancel: "Cancel",
        save: "Save",
        clearProject: "Reset Project Data",
        confirmClear: "Are you sure you want to clear all calculations, BOM, and variables? This cannot be undone.",
        projectCleared: "Project cleared successfully.",
        totalCost: "Est. Total Cost",
        totalWeight: "Total Weight"
    },
    tr: {
        dashboard: "Panel",
        solvers: "Hesaplayıcılar",
        cadWorkspace: "3D Tasarım",
        variables: "Değişkenler",
        copilot: "Copilot AI",
        settings: "Ayarlar",
        recentSolvers: "Son Kullanılanlar",
        activeProject: "Aktif Proje",
        searchSolvers: "Hesaplayıcı ara...",
        popularSolvers: "Popüler Çözücüler",
        quickStats: "Hızlı İstatistikler",
        latency: "Gecikme Süresi",
        status: "Durum",
        online: "Aktif",
        version: "Sürüm",
        solvedCount: "Çözülen Denklemler",
        noRecentCalculations: "Bu oturumda henüz hesaplama yapılmadı.",
        bomCount: "BOM Parçaları",
        allCategories: "Tümü",
        back: "Geri",
        saveSpec: "BOM'a Kaydet",
        share: "Paylaş",
        pdfReport: "PDF Raporu",
        language: "Dil Seçimi",
        unitSystem: "Birim Sistemi",
        theme: "Arayüz Teması",
        clearCache: "Uygulama Önbelleğini Temizle",
        systemDiagnostics: "Sistem Tanılama",
        diagnosticsPass: "Tüm sistemler kararlı",
        hardwareAccel: "WebGL Hızlandırıcı",
        active: "Aktif",
        inactive: "Pasif",
        copied: "Panoya kopyalandı!",
        copilotWelcome: "AluCalc Yapay Zeka Yardımcısı",
        copilotSub: "Mühendislik soruları sorun veya standart arayın.",
        start3D: "3D CAD Motorunu Başlat",
        bomTitle: "Malzeme Listesi (BOM)",
        compTitle: "Profil/Bağlantı Ekle",
        savedVars: "Kayıtlı Değişkenler",
        varName: "Değişken Adı",
        varValue: "Değer",
        varSource: "Kaynak",
        noVariables: "Henüz kayıtlı değişken yok. Değişken kaydetmek için bir hesaplama yapın.",
        copiedVar: "Değişken kopyalandı!",
        addVarBtn: "Değişken Ekle",
        addVarTitle: "Yeni Değişken Ekle",
        placeholderName: "DEG_ADI",
        placeholderValue: "0",
        placeholderUnit: "mm",
        placeholderDesc: "İsteğe bağlı açıklama",
        cancel: "İptal",
        save: "Kaydet",
        clearProject: "Proje Verilerini Sıfırla",
        confirmClear: "Tüm hesaplamaları, BOM listesini ve değişkenleri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
        projectCleared: "Proje başarıyla sıfırlandı.",
        totalCost: "Tahmini Maliyet",
        totalWeight: "Toplam Ağırlık"
    }
};

const CATEGORIES_LIST: LiteCategoryKey[] = ['mechanical', 'manufacturing', 'civil', 'electrical', 'finance', 'science', 'software', 'other'];

export function MobileEnvironment() {
    const { language, setLanguage } = useI18nStore();
    const tLite = getLitePage(language);
    const m = LOCAL_TRANSLATIONS[language] || LOCAL_TRANSLATIONS.en;

    const { theme, setTheme, unitSystem, setUnitSystem } = useOSStore();
    const { 
        projectName, items, variables, 
        addVariable, removeVariable, updateVariable, clearProject,
        getTotalWeight, getTotalCost 
    } = useProjectStore();

    // Tab state
    const [activeTab, setActiveTab] = useState<'dashboard' | 'solvers' | 'cad' | 'variables' | 'copilot' | 'settings'>('dashboard');
    const [activeModule, setActiveModule] = useState<ModuleType | null>(null);

    // Search and filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<LiteCategoryKey | 'all'>('all');

    // Drawer and overlay states
    const [isCadEngineActive, setIsCadEngineActive] = useState(false);
    const [isBomDrawerOpen, setIsBomDrawerOpen] = useState(false);
    const [isAddPartOpen, setIsAddPartOpen] = useState(false);
    const [isAddingVar, setIsAddingVar] = useState(false);
    const [newVar, setNewVar] = useState({ name: '', value: '', unit: '', description: '' });

    // Toast feedback state
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Track recently accessed solvers during the session
    const [recentSolvers, setRecentSolvers] = useState<ModuleType[]>([]);

    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
    };

    // Filter calculators
    const filteredModules = useMemo(() => {
        const list = Object.values(MODULE_REGISTRY).filter(mod => 
            !['settings', 'terminal', 'browser', 'media-player', 'image-viewer', 'pdf-viewer', 'spreadsheet-viewer', 'file-explorer', 'project-vault', 'project-variables', 'ai-copilot'].includes(mod.type)
        );

        return list.filter(mod => {
            const matchesSearch = mod.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  mod.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  mod.type.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCat = selectedCategory === 'all' || mod.category === selectedCategory;
            return matchesSearch && matchesCat;
        });
    }, [searchQuery, selectedCategory]);

    const handleLaunchModule = (type: ModuleType) => {
        setActiveModule(type);
        setRecentSolvers(prev => {
            const filtered = prev.filter(x => x !== type);
            return [type, ...filtered].slice(0, 4);
        });
    };

    // Copy to clipboard utility
    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        triggerToast(m.copied);
    };

    const handleSaveVariable = () => {
        if (!newVar.name || !newVar.value) return;
        addVariable({
            name: newVar.name.replace(/\s+/g, '_').toUpperCase(),
            value: Number(newVar.value),
            unit: newVar.unit,
            description: newVar.description
        });
        setNewVar({ name: '', value: '', unit: '', description: '' });
        setIsAddingVar(false);
        triggerToast(m.copiedVar);
    };

    const handleResetData = () => {
        if (confirm(m.confirmClear)) {
            clearProject();
            triggerToast(m.projectCleared);
        }
    };

    // Share calculator parameters
    const handleShare = () => {
        if (!activeModule) return;
        const url = `${window.location.origin}/${activeModule}`;
        if (navigator.share) {
            navigator.share({
                title: MODULE_REGISTRY[activeModule].title,
                text: `AluCalc Solver: ${MODULE_REGISTRY[activeModule].title}`,
                url: url,
            }).catch(console.error);
        } else {
            handleCopyToClipboard(url);
        }
    };

    return (
        <div className="fixed inset-0 flex flex-col bg-[#020408] text-slate-100 font-sans overflow-hidden select-none">
            
            {/* Top Premium Status Header */}
            <header className="flex-none px-4 py-3 bg-black/40 border-b border-cyan-950/30 backdrop-blur-md flex items-center justify-between z-30">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-cyan-500 rounded-lg flex items-center justify-center text-black font-black text-xs shadow-[0_0_10px_rgba(6,182,212,0.4)]">AC</div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/40 tracking-[0.2em] font-mono leading-none uppercase">ALUCALC OS</span>
                        <span className="text-xs font-bold text-white tracking-tight mt-0.5">{projectName}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Tiny latency telemetry */}
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[8px] text-emerald-400 font-mono">14ms</span>
                    </div>
                    {/* Small flag language changer */}
                    <button 
                        onClick={() => setLanguage(language === 'en' ? 'tr' : 'en')}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-900 border border-white/5 hover:border-cyan-500/30 transition-all text-[9px] font-bold text-slate-300 font-mono"
                    >
                        {language.toUpperCase()}
                    </button>
                </div>
            </header>

            {/* Scrollable Body Content */}
            <main className="flex-1 overflow-y-auto pb-20 relative custom-scrollbar bg-radial-gradient">
                <AnimatePresence mode="wait">
                    
                    {/* TAB 1: DASHBOARD */}
                    {activeTab === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="p-4 space-y-6"
                        >
                            {/* Project Telemetry Card */}
                            <div className="relative p-5 rounded-2xl border border-cyan-950/40 bg-slate-950/30 backdrop-blur-xl overflow-hidden shadow-xl">
                                <div className="absolute top-0 right-0 p-4">
                                    <Layers className="w-12 h-12 text-cyan-500/10 rotate-12" />
                                </div>
                                <h3 className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-1">{m.activeProject}</h3>
                                <h2 className="text-xl font-bold text-white truncate max-w-[80%]">{projectName}</h2>
                                
                                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
                                    <div>
                                        <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-wider">{m.bomCount}</span>
                                        <span className="text-md font-mono font-bold text-cyan-300">{items.length}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-wider">{m.totalWeight}</span>
                                        <span className="text-md font-mono font-bold text-purple-300">{getTotalWeight().toFixed(1)} kg</span>
                                    </div>
                                    <div>
                                        <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-wider">{m.totalCost}</span>
                                        <span className="text-md font-mono font-bold text-emerald-300">${getTotalCost().toFixed(0)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Popular Solvers Shortcut Grid */}
                            <div>
                                <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">{m.popularSolvers}</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { slug: 'bolt-torque', name: 'Bolt Torque', icon: Zap, color: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
                                        { slug: 'bearings', name: 'Bearing Life', icon: CircleDot, color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' },
                                        { slug: 'beam-deflection', name: 'Beam Deflection', icon: Layers, color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' },
                                        { slug: 'profile-weight', name: 'Profile Weight', icon: Ruler, color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' }
                                    ].map(pop => {
                                        const DynamicIcon = pop.icon;
                                        return (
                                            <button
                                                key={pop.slug}
                                                onClick={() => handleLaunchModule(pop.slug as any)}
                                                className={`flex items-center gap-3 p-4 rounded-xl border bg-slate-900/30 text-left transition-all active:scale-95 ${pop.color}`}
                                            >
                                                <div className="p-2 rounded-lg bg-black/40">
                                                    <DynamicIcon size={18} />
                                                </div>
                                                <span className="font-bold text-xs leading-snug">{pop.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Recent Calculators Feed */}
                            <div>
                                <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">{m.recentSolvers}</h3>
                                <div className="space-y-2">
                                    {recentSolvers.length === 0 ? (
                                        <p className="text-xs text-slate-600 italic py-4">{m.noRecentCalculations}</p>
                                    ) : (
                                        recentSolvers.map(slug => {
                                            const mod = MODULE_REGISTRY[slug];
                                            if (!mod) return null;
                                            const IconNode = getModuleIcon(mod.iconName);
                                            return (
                                                <button
                                                    key={slug}
                                                    onClick={() => handleLaunchModule(slug)}
                                                    className="w-full flex items-center justify-between p-3 bg-slate-950/20 border border-white/5 rounded-xl hover:border-cyan-500/30 active:bg-slate-900/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                                                            <IconNode size={16} />
                                                        </div>
                                                        <span className="font-bold text-xs text-slate-200">{mod.title}</span>
                                                    </div>
                                                    <ChevronRight size={14} className="text-slate-600" />
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Quick Stats Telemetry */}
                            <div className="p-4 rounded-xl border border-white/5 bg-slate-950/10 space-y-3">
                                <h4 className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">{m.quickStats}</h4>
                                <div className="flex justify-between text-xs font-mono">
                                    <span className="text-slate-600">{m.latency}</span>
                                    <span className="text-emerald-500 font-bold">14.2 ms</span>
                                </div>
                                <div className="flex justify-between text-xs font-mono border-t border-white/5 pt-2">
                                    <span className="text-slate-600">{m.status}</span>
                                    <span className="text-cyan-400 font-bold">{m.online}</span>
                                </div>
                                <div className="flex justify-between text-xs font-mono border-t border-white/5 pt-2">
                                    <span className="text-slate-600">{m.version}</span>
                                    <span className="text-slate-400 font-bold">5.0.0</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 2: SOLVERS LIST */}
                    {activeTab === 'solvers' && (
                        <motion.div
                            key="solvers"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="p-4 space-y-6"
                        >
                            {/* Search and Category Headers */}
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-900/60" />
                                    <input 
                                        type="text" 
                                        placeholder={m.searchSolvers} 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-950/40 border border-cyan-900/30 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/30 transition-all text-white placeholder:text-cyan-900/50"
                                    />
                                </div>

                                {/* Category Pills Horizontal Scroll */}
                                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide select-none -mx-4 px-4">
                                    <button
                                        onClick={() => setSelectedCategory('all')}
                                        className={`px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase border transition-all shrink-0 ${selectedCategory === 'all' ? 'bg-cyan-50 border-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-slate-950/40 border-cyan-950/30 text-cyan-50/50'}`}
                                    >
                                        {m.allCategories}
                                    </button>
                                    {CATEGORIES_LIST.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase border transition-all shrink-0 ${selectedCategory === cat ? 'bg-cyan-50 border-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-slate-950/40 border-cyan-950/30 text-cyan-50/50'}`}
                                        >
                                            {tLite.categories[cat] || cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Solvers List */}
                            <div className="grid grid-cols-2 gap-3 pb-8">
                                {filteredModules.length === 0 ? (
                                    <div className="col-span-2 text-center py-20 text-slate-500 text-xs">
                                        {tLite.emptyState}
                                    </div>
                                ) : (
                                    filteredModules.map(mod => {
                                        const IconNode = getModuleIcon(mod.iconName);
                                        return (
                                            <button
                                                key={mod.type}
                                                onClick={() => handleLaunchModule(mod.type)}
                                                className="flex flex-col items-start p-4 bg-slate-950/30 border border-white/5 rounded-2xl hover:border-cyan-500/30 transition-all text-left group active:bg-slate-900/40"
                                            >
                                                <div className="w-9 h-9 rounded-xl bg-cyan-500/5 text-cyan-400 flex items-center justify-center border border-cyan-500/10 mb-3 group-hover:bg-cyan-500/10 transition-colors">
                                                    <IconNode size={16} />
                                                </div>
                                                <span className="font-bold text-xs text-white line-clamp-2 leading-tight">
                                                    {mod.title}
                                                </span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 3: 3D CAD ASSEMBLY */}
                    {activeTab === 'cad' && (
                        <motion.div
                            key="cad"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 top-[53px] bottom-16 flex flex-col overflow-hidden bg-black"
                        >
                            {!isCadEngineActive ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                        <Box size={32} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-white text-md">3D Prototype Assembly</h3>
                                        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                                            Run the hardware-accelerated 3D viewer. Loads profiles, components, and enables assembly editing.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsCadEngineActive(true)}
                                        className="px-8 py-3.5 bg-cyan-500 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2"
                                    >
                                        <Play size={14} className="fill-black" />
                                        {m.start3D}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-grow relative w-full h-full">
                                    {/* 3D Scene View */}
                                    <AssemblyScene />

                                    {/* Floating overlay widgets for CAD */}
                                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                                        <button 
                                            onClick={() => setIsAddPartOpen(true)}
                                            className="p-3.5 rounded-xl bg-black/75 border border-cyan-500/30 text-cyan-400 flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur active:bg-black/90 shadow-[0_0_15px_rgba(0,229,255,0.15)]"
                                        >
                                            <Plus size={14} />
                                            <span>Add Part</span>
                                        </button>
                                    </div>

                                    <div className="absolute top-4 right-4 z-20">
                                        <button 
                                            onClick={() => setIsBomDrawerOpen(true)}
                                            className="p-3.5 rounded-xl bg-black/75 border border-cyan-500/30 text-cyan-400 flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur active:bg-black/90 shadow-[0_0_15px_rgba(0,229,255,0.15)]"
                                        >
                                            <Layers size={14} />
                                            <span>BOM ({items.length})</span>
                                        </button>
                                    </div>

                                    {/* Simple controls help */}
                                    <div className="absolute bottom-4 left-4 z-20 px-3 py-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/5 text-[9px] font-mono text-white/40 pointer-events-none">
                                        1-Finger: Rotate | 2-Fingers: Zoom/Pan
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* TAB 4: VARIABLES & SAVED */}
                    {activeTab === 'variables' && (
                        <motion.div
                            key="variables"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="p-4 space-y-6"
                        >
                            <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                <h3 className="text-md font-bold text-white flex items-center gap-2">
                                    <Database size={16} className="text-cyan-400" />
                                    {m.savedVars}
                                </h3>
                                <button
                                    onClick={() => setIsAddingVar(true)}
                                    className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400 font-bold text-xs uppercase flex items-center gap-1 hover:bg-cyan-500/20 active:scale-95 transition-all"
                                >
                                    <Plus size={14} />
                                    {m.addVarBtn}
                                </button>
                            </div>

                            {/* Variables list */}
                            <div className="space-y-2">
                                {variables.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500 text-xs">
                                        {m.noVariables}
                                    </div>
                                ) : (
                                    variables.map(v => (
                                        <div 
                                            key={v.id}
                                            className="p-4 bg-slate-950/30 border border-white/5 rounded-xl flex items-center justify-between"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-mono text-sm font-bold text-cyan-300">{v.name}</span>
                                                    {v.unit && <span className="text-[10px] text-slate-500 font-mono">({v.unit})</span>}
                                                </div>
                                                {v.description && <p className="text-[10px] text-slate-500">{v.description}</p>}
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleCopyToClipboard(String(v.value))}
                                                    className="p-2 rounded bg-white/5 hover:bg-white/10 text-slate-400 active:text-cyan-400 transition-colors"
                                                    title="Copy Value"
                                                >
                                                    <Copy size={12} />
                                                </button>
                                                <div className="font-mono text-sm font-bold text-white bg-slate-900 border border-white/5 px-3 py-1.5 rounded-lg shadow-inner">
                                                    {v.value}
                                                </div>
                                                <button
                                                    onClick={() => removeVariable(v.id)}
                                                    className="p-2 rounded text-slate-600 hover:text-red-400 active:bg-red-500/10 transition-colors"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 5: AI COPILOT */}
                    {activeTab === 'copilot' && (
                        <motion.div
                            key="copilot"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 top-[53px] bottom-16 flex flex-col bg-[#05080e]"
                        >
                            {/* Render AI Copilot solver directly from registry to reuse core intelligence */}
                            <div className="flex-1 w-full h-full relative overflow-hidden">
                                <WindowContent type="ai-copilot" />
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 6: SETTINGS */}
                    {activeTab === 'settings' && (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="p-4 space-y-6"
                        >
                            <h3 className="text-md font-bold text-white flex items-center gap-2 pb-2 border-b border-white/5">
                                <Settings size={16} className="text-cyan-400" />
                                {m.settings}
                            </h3>

                            <div className="space-y-4">
                                {/* Language settings */}
                                <div className="p-4 rounded-xl border border-white/5 bg-slate-950/20 space-y-3">
                                    <span className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">{m.language}</span>
                                    <div className="flex gap-2">
                                        {['en', 'tr'].map(lang => (
                                            <button
                                                key={lang}
                                                onClick={() => setLanguage(lang as any)}
                                                className={`flex-1 py-3 text-xs font-bold uppercase rounded-lg border transition-all ${language === lang ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400' : 'bg-transparent border-white/5 text-slate-400'}`}
                                            >
                                                {lang === 'en' ? 'English' : 'Türkçe'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Unit Settings */}
                                <div className="p-4 rounded-xl border border-white/5 bg-slate-950/20 space-y-3">
                                    <span className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">{m.unitSystem}</span>
                                    <div className="flex gap-2">
                                        {['metric', 'imperial'].map(unit => (
                                            <button
                                                key={unit}
                                                onClick={() => setUnitSystem(unit as any)}
                                                className={`flex-1 py-3 text-xs font-bold uppercase rounded-lg border transition-all ${unitSystem === unit ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400' : 'bg-transparent border-white/5 text-slate-400'}`}
                                            >
                                                {unit === 'metric' ? 'Metric (mm, kg)' : 'Imperial (in, lbs)'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Diagnostics */}
                                <div className="p-4 rounded-xl border border-white/5 bg-slate-950/20 space-y-3">
                                    <span className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">{m.systemDiagnostics}</span>
                                    <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2.5">
                                        <span className="text-slate-500">{m.hardwareAccel}</span>
                                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                            {m.active}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500">Status</span>
                                        <span className="text-cyan-400 font-bold">{m.diagnosticsPass}</span>
                                    </div>
                                </div>

                                {/* Clear Cache / Reset Project */}
                                <div className="space-y-2 pt-4">
                                    <button
                                        onClick={handleResetData}
                                        className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-98 transition-all rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={14} />
                                        {m.clearProject}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>

            {/* Bottom Glassmorphic Navigation Bar */}
            <nav className="flex-none fixed bottom-0 left-0 right-0 h-16 bg-slate-950/90 border-t border-cyan-950/50 backdrop-blur-xl flex items-center justify-around z-30 px-2 select-none">
                {[
                    { id: 'dashboard', label: m.dashboard, icon: LayoutGrid },
                    { id: 'solvers', label: m.solvers, icon: Calculator },
                    { id: 'cad', label: m.cadWorkspace, icon: Box },
                    { id: 'variables', label: m.variables, icon: Database },
                    { id: 'copilot', label: m.copilot, icon: MessageSquare },
                    { id: 'settings', label: m.settings, icon: Settings }
                ].map(tab => {
                    const TabIcon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as any);
                                // Make sure sheets are hidden on switch
                                if (tab.id !== 'cad') {
                                    setIsBomDrawerOpen(false);
                                    setIsAddPartOpen(false);
                                }
                            }}
                            className="flex flex-col items-center justify-center flex-1 h-full relative"
                        >
                            <div className={`p-1 rounded-lg transition-all ${isActive ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'text-slate-500'}`}>
                                <TabIcon size={20} />
                            </div>
                            <span className={`text-[8px] font-mono uppercase font-black tracking-tighter mt-1 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-600'}`}>
                                {tab.label}
                            </span>
                            {isActive && (
                                <motion.div 
                                    layoutId="bottomTabLine" 
                                    className="absolute bottom-1 w-6 h-0.5 bg-cyan-400 rounded-full"
                                />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* FULLSCREEN SHEET FOR CALCULATOR (Slide-up modal) */}
            <AnimatePresence>
                {activeModule && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        className="fixed inset-0 z-50 bg-[#020408] flex flex-col"
                    >
                        {/* Slide-over Header */}
                        <header className="flex-none h-14 border-b border-cyan-950/30 flex items-center justify-between px-4 bg-slate-950/80 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setActiveModule(null)}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 active:bg-slate-800 text-slate-400 active:text-white transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                                        {tLite.categories[MODULE_REGISTRY[activeModule].category] || MODULE_REGISTRY[activeModule].category}
                                    </span>
                                    <span className="font-bold text-xs text-white max-w-[180px] sm:max-w-xs truncate leading-none mt-0.5">
                                        {MODULE_REGISTRY[activeModule].title}
                                    </span>
                                </div>
                            </div>

                            {/* Actions bar inside header */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={handleShare}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 active:bg-cyan-500/20 text-slate-400 active:text-cyan-400 transition-all"
                                    title={m.share}
                                >
                                    <Share2 size={14} />
                                </button>
                                <button
                                    onClick={() => triggerToast("PDF Generated (Simulated)")}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 active:bg-cyan-500/20 text-slate-400 active:text-cyan-400 transition-all"
                                    title={m.pdfReport}
                                >
                                    <FileText size={14} />
                                </button>
                            </div>
                        </header>

                        {/* Scrollable Calculator Contents */}
                        <div className="flex-grow w-full relative overflow-y-auto px-4 py-6 pb-12 custom-scrollbar bg-[#020408]">
                            {/* We wrap WindowContent inside a relative div mimicking a workspace layout if needed */}
                            <div className="min-h-full w-full relative select-text">
                                <WindowContent type={activeModule} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CAD TAB SUB-DRAWER 1: BOM BOTTOM DRAWER */}
            <AnimatePresence>
                {isBomDrawerOpen && (
                    <>
                        {/* Backdrop overlay */}
                        <div 
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsBomDrawerOpen(false)}
                        />
                        {/* Slide up sheet */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-x-0 bottom-0 z-50 h-[65vh] bg-[#070b11] border-t border-cyan-950/80 rounded-t-[2.5rem] flex flex-col overflow-hidden shadow-2xl"
                        >
                            {/* Drag pill handle */}
                            <div className="flex-none w-full py-3 flex justify-center">
                                <div className="w-12 h-1.5 rounded-full bg-slate-700/50" />
                            </div>

                            <header className="flex-none px-6 pb-4 border-b border-white/5 flex items-center justify-between">
                                <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                                    <Layers size={16} className="text-cyan-400" />
                                    {m.bomTitle} ({items.length})
                                </h3>
                                <button 
                                    onClick={() => setIsBomDrawerOpen(false)}
                                    className="p-1 rounded-full bg-slate-900 border border-white/5 text-slate-500 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            </header>

                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                <BOMPanel />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* CAD TAB SUB-DRAWER 2: ADD COMPONENT BOTTOM DRAWER */}
            <AnimatePresence>
                {isAddPartOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsAddPartOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-x-0 bottom-0 z-50 h-[60vh] bg-[#070b11] border-t border-cyan-950/80 rounded-t-[2.5rem] flex flex-col overflow-hidden shadow-2xl"
                        >
                            <div className="flex-none w-full py-3 flex justify-center">
                                <div className="w-12 h-1.5 rounded-full bg-slate-700/50" />
                            </div>

                            <header className="flex-none px-6 pb-4 border-b border-white/5 flex items-center justify-between">
                                <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                                    <Plus size={16} className="text-cyan-400" />
                                    {m.compTitle}
                                </h3>
                                <button 
                                    onClick={() => setIsAddPartOpen(false)}
                                    className="p-1 rounded-full bg-slate-900 border border-white/5 text-slate-500 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            </header>

                            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                                <ComponentPalette />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ADD VARIABLE DIALOG DIAL */}
            <AnimatePresence>
                {isAddingVar && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-sm bg-[#0a1018] border border-cyan-900/40 rounded-3xl p-6 shadow-2xl space-y-6"
                        >
                            <div>
                                <h4 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                                    <Database size={16} className="text-cyan-400" />
                                    {m.addVarTitle}
                                </h4>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-mono font-bold text-cyan-900/60 uppercase tracking-widest">{m.varName}</label>
                                    <input 
                                        type="text" 
                                        placeholder={m.placeholderName}
                                        value={newVar.name}
                                        onChange={e => setNewVar({ ...newVar, name: e.target.value.toUpperCase() })}
                                        className="w-full bg-[#03060a] border border-cyan-900/30 rounded-xl p-3 text-xs text-white font-mono uppercase outline-none focus:border-cyan-500/70"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-mono font-bold text-cyan-900/60 uppercase tracking-widest">{m.varValue}</label>
                                        <input 
                                            type="number" 
                                            placeholder={m.placeholderValue}
                                            value={newVar.value}
                                            onChange={e => setNewVar({ ...newVar, value: e.target.value })}
                                            className="w-full bg-[#03060a] border border-cyan-900/30 rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-cyan-500/70"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-mono font-bold text-cyan-900/60 uppercase tracking-widest">Unit</label>
                                        <input 
                                            type="text" 
                                            placeholder={m.placeholderUnit}
                                            value={newVar.unit}
                                            onChange={e => setNewVar({ ...newVar, unit: e.target.value })}
                                            className="w-full bg-[#03060a] border border-cyan-900/30 rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-cyan-500/70"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-mono font-bold text-cyan-900/60 uppercase tracking-widest">Description</label>
                                    <input 
                                        type="text" 
                                        placeholder={m.placeholderDesc}
                                        value={newVar.description}
                                        onChange={e => setNewVar({ ...newVar, description: e.target.value })}
                                        className="w-full bg-[#03060a] border border-cyan-900/30 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-500/70"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                                <button 
                                    onClick={() => setIsAddingVar(false)}
                                    className="px-4 py-2 rounded-lg border border-white/5 text-slate-400 text-xs font-bold uppercase transition-all"
                                >
                                    {m.cancel}
                                </button>
                                <button 
                                    onClick={handleSaveVariable}
                                    className="px-5 py-2.5 bg-cyan-500 text-black font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                                >
                                    {m.save}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Global toast notification system */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-slate-900 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase rounded-full shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur flex items-center gap-2"
                    >
                        <Check size={14} />
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
