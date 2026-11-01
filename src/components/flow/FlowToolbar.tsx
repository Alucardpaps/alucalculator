'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import {
    Play,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Zap,
    Layers,
    Download,
    Upload,
    Maximize2,
    Archive,
    Sparkles,
} from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';
import { useReactFlow } from 'reactflow';
import { TemplateGalleryModal } from './TemplateGalleryModal';
import { AegisFlowAiModal } from './AegisFlowAiModal';
import { ENGINEERING_TEMPLATES } from '@/flow/templates/engineeringTemplates';
import { zipToBlob } from '@/export/zip/zip-builder';
import { collectEngineeringBundle } from '@/export/zip/flow-bundle';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

interface FlowToolbarProps {
    showPalette?: boolean;
    onTogglePalette?: () => void;
    showInspector?: boolean;
    onToggleInspector?: () => void;
}

export function FlowToolbar({
    showPalette = true,
    onTogglePalette,
    showInspector = true,
    onToggleInspector,
}: FlowToolbarProps) {
    const language = useI18nStore((s) => s.language);
    const lastExecution = useFlowStore((s) => s.lastExecution);
    const nodeCount = useFlowStore((s) => s.nodes.length);
    const edgeCount = useFlowStore((s) => s.edges.length);
    const autoRun = useFlowStore((s) => s.autoRun);
    const toggleAutoRun = useFlowStore((s) => s.toggleAutoRun);
    const executeGraph = useFlowStore((s) => s.executeGraph);
    const clearFlow = useFlowStore((s) => s.clearFlow);
    const loadTemplate = useFlowStore((s) => s.loadTemplate);
    const exportProjectJson = useFlowStore((s) => s.exportProjectJson);
    const importProjectJson = useFlowStore((s) => s.importProjectJson);

    const reactFlow = useReactFlow();
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [aiFlowOpen, setAiFlowOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const run = useCallback(() => {
        executeGraph();
    }, [executeGraph]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                run();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [run]);

    const handleSelectTemplate = (templateId: string) => {
        loadTemplate(templateId);
        setTimeout(() => {
            reactFlow.fitView({ padding: 0.25, duration: 400 });
        }, 80);
    };

    const handleExport = () => {
        const json = exportProjectJson();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alucalc-flow-${new Date().toISOString().slice(0, 10)}.aluflow`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                const ok = importProjectJson(content);
                if (ok) {
                    setTimeout(() => {
                        reactFlow.fitView({ padding: 0.25, duration: 400 });
                    }, 80);
                } else {
                    alert(t12(language, 'Invalid flow file format.', 'Geçersiz akış dosyası.'));
                }
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleBundleExport = () => {
        executeGraph();
        const state = useFlowStore.getState();
        const entries = collectEngineeringBundle({
            aluflowJson: state.exportProjectJson(),
            nodes: state.nodes.map((n) => ({
                id: n.id,
                data: {
                    schemaId: 'schemaId' in n.data ? String((n.data as { schemaId?: string }).schemaId ?? n.id) : n.id,
                    outputs: 'outputs' in n.data ? (n.data as { outputs?: Record<string, unknown> }).outputs : undefined,
                },
            })),
        });
        const blob = zipToBlob(entries);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alucalc-bundle-${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <header className="w-full h-13 bg-[var(--bg-1)] border-b border-[var(--line)] px-4 py-2 flex items-center justify-between shrink-0 select-none z-20 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            {/* Left: Brand Identity & Telemetry */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400 ">
                        <Zap size={14} className="fill-cyan-400/30" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black tracking-wider text-slate-100 uppercase">Flow Studio</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-bold">
                                NX-CORE
                            </span>
                        </div>
                        <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1.5">
                            <span className="text-slate-300 font-bold">{nodeCount}</span> {t12(language, 'Nodes', 'Düğüm')}
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-300 font-bold">{edgeCount}</span> {t12(language, 'Edges', 'Hat')}
                        </div>
                    </div>
                </div>

                {/* Status Indicator */}
                {lastExecution && (
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-mono font-bold ${
                        lastExecution.success
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 '
                            : 'bg-red-950/30 border-red-500/40 text-red-300 '
                    }`}>
                        {lastExecution.success ? <CheckCircle2 size={11} className="text-emerald-400" /> : <AlertTriangle size={11} className="text-red-400" />}
                        <span>{lastExecution.success ? 'PASS' : 'FAIL'}</span>
                        <span className="text-slate-400">({lastExecution.executionTimeMs.toFixed(1)}ms)</span>
                        {lastExecution.errorCount > 0 && <span className="text-red-400">{lastExecution.errorCount} ERR</span>}
                    </div>
                )}
            </div>

            {/* Center: Execution & Pipeline Controls */}
            <div className="flex items-center gap-2">
                {/* Run Action */}
                <button
                    type="button"
                    onClick={run}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs tracking-wider uppercase active:scale-[0.98] transition-all"
                    title={t12(language, 'Execute Graph (Ctrl + Enter)', 'Grafiği Çözümle (Ctrl + Enter)')}
                >
                    <Play size={12} fill="currentColor" />
                    <span>{t12(language, 'Execute', 'Çözümle')}</span>
                    <span className="text-[9px] font-mono bg-black/20 text-black/80 px-1 py-0.5 rounded font-normal">
                        Ctrl+↵
                    </span>
                </button>

                {/* Auto-Run Toggle */}
                <button
                    type="button"
                    onClick={toggleAutoRun}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-all ${
                        autoRun
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 '
                            : 'bg-[var(--bg-2)] border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                    title={t12(language, 'Automatically execute as inputs change', 'Girdiler değiştikçe otomatik çözümleme')}
                >
                    <div className={`w-2 h-2 rounded-full ${autoRun ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span>Auto</span>
                </button>

                <div className="h-5 w-px bg-slate-800 mx-1" />

                {/* AI Flow & Calculation Generator */}
                <button
                    type="button"
                    onClick={() => setAiFlowOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-950/30 text-amber-200 text-[10px] font-bold tracking-wider hover:bg-amber-900/40 hover:border-amber-400 transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                    title={t12(language, 'AeGiS AI Engineering Calculation & Flow Generator', 'AeGiS AI Mühendislik Hesap & Akış Motoru')}
                >
                    <Sparkles size={13} className="text-amber-400" />
                    <span>{t12(language, 'AI Flow', 'AI Akış & Hesap')}</span>
                </button>
                <AegisFlowAiModal
                    isOpen={aiFlowOpen}
                    onClose={() => setAiFlowOpen(false)}
                />

                {/* Template Gallery Trigger */}
                <button
                    type="button"
                    onClick={() => setGalleryOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/30 text-cyan-200 text-[10px] font-bold tracking-wider hover:bg-cyan-900/40 hover:border-cyan-400 transition-all "
                    title={t12(language, `${ENGINEERING_TEMPLATES.length} Industrial Engineering Templates`, `${ENGINEERING_TEMPLATES.length} Hazır Endüstriyel Mühendislik Şablonu`)}
                >
                    <Layers size={13} className="text-cyan-400" />
                    <span>{t12(language, 'Templates', 'Şablonlar')}</span>
                    <span className="text-[9px] font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded-full font-bold">
                        {ENGINEERING_TEMPLATES.length}
                    </span>
                </button>
                <TemplateGalleryModal
                    isOpen={galleryOpen}
                    onClose={() => setGalleryOpen(false)}
                    onSelect={handleSelectTemplate}
                />

                {/* ZIP Bundle Export */}
                <button
                    type="button"
                    onClick={handleBundleExport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-200 text-[10px] font-bold tracking-wider hover:bg-emerald-900/40 hover:border-emerald-400 transition-all "
                    title={t12(language, 'Download complete CAD DXF + PDF + .aluflow engineering bundle as ZIP', 'Tüm CAD DXF + Teknik PDF + .aluflow dosyalarını tek ZIP arşivinde indir')}
                >
                    <Archive size={12} className="text-emerald-400" />
                    <span>{t12(language, 'Bundle ZIP', 'Paket İndir')}</span>
                </button>
            </div>

            {/* Right: Project Tools & View Options */}
            <div className="flex items-center gap-1.5">
                {/* Fit View */}
                <button
                    type="button"
                    onClick={() => reactFlow.fitView({ padding: 0.25, duration: 400 })}
                    className="p-1.5 rounded-lg border border-slate-800 bg-[var(--bg-2)] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
                    title={t12(language, 'Fit View (F)', 'Ekrana Sığdır (F)')}
                >
                    <Maximize2 size={13} />
                </button>

                {/* Export .aluflow */}
                <button
                    type="button"
                    onClick={handleExport}
                    className="p-1.5 rounded-lg border border-slate-800 bg-[var(--bg-2)] text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40 transition-all"
                    title={t12(language, 'Download Flow (.aluflow)', 'Akışı İndir (.aluflow)')}
                >
                    <Download size={13} />
                </button>

                {/* Import .aluflow */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportFile}
                    accept=".aluflow,.json"
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-lg border border-slate-800 bg-[var(--bg-2)] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
                    title={t12(language, 'Upload Flow (.aluflow)', 'Akış Dosyası Yükle (.aluflow)')}
                >
                    <Upload size={13} />
                </button>

                {/* Clear Flow */}
                <button
                    type="button"
                    onClick={() => {
                        if (window.confirm(t12(language, 'Are you sure you want to clear the entire flow graph?', 'Tüm akış grafiği temizlensin mi?'))) clearFlow();
                    }}
                    className="p-1.5 rounded-lg border border-slate-800 bg-[var(--bg-2)] text-slate-400 hover:border-red-500/40 hover:text-red-300 transition-all"
                    title={t12(language, 'Clear Flow Graph', 'Grafiği Temizle')}
                >
                    <Trash2 size={13} />
                </button>

                <div className="h-5 w-px bg-slate-800 mx-1" />

                {/* Toggle Palette */}
                {onTogglePalette && (
                    <button
                        type="button"
                        onClick={onTogglePalette}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-all ${
                            showPalette
                                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                                : 'bg-[var(--bg-2)] border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                        title={t12(language, 'Node Library Palette', 'Düğüm Kütüphanesi Paneli')}
                    >
                        {t12(language, 'Palette', 'Palet')}
                    </button>
                )}

                {/* Toggle Inspector */}
                {onToggleInspector && (
                    <button
                        type="button"
                        onClick={onToggleInspector}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-all ${
                            showInspector
                                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                                : 'bg-[var(--bg-2)] border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                        title={t12(language, 'Inspector & Preview Panel', 'Teftiş & CAD Önizleme Paneli')}
                    >
                        {t12(language, 'Inspector', 'Teftiş')}
                    </button>
                )}
            </div>
        </header>
    );
}
