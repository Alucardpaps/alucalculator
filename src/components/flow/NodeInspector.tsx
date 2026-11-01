'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    X,
    Settings,
    Activity,
    FileText,
    Database,
    Zap,
    Download,
    Copy,
    Trash2,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Link2,
    Maximize2,
    Layers,
    ExternalLink,
    Box,
    Scissors,
    Grid,
} from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { getSchema } from '@/flow/nodes/Registry';
import { PORT_UNITS } from '@/flow/core/ports';
import type { EngineeringNodeData } from '@/store/flowStore';
import { dxfToSvgPreview } from '@/viewers/dxf-preview';
import { getModuleLinkInfo } from '@/flow/core/moduleLinks';
import { NodeVisualizerPreview } from '@/components/flow/NodeVisualizerPreview';

interface NodeInspectorProps {
    onClose?: () => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({ onClose }) => {
    const { language } = useI18nStore();
    const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
    const nodes = useFlowStore((s) => s.nodes);
    const edges = useFlowStore((s) => s.edges);
    const updateNodeData = useFlowStore((s) => s.updateNodeData);
    const executeGraph = useFlowStore((s) => s.executeGraph);
    const removeNode = useFlowStore((s) => s.removeNode);
    const duplicateNode = useFlowStore((s) => s.duplicateNode);
    const lastExecution = useFlowStore((s) => s.lastExecution);
    const setSelectedNode = useFlowStore((s) => s.setSelectedNode);

    const [copiedOutputKey, setCopiedOutputKey] = useState<string | null>(null);
    const handleCopySingleOutput = (key: string, val: unknown) => {
        if (val === undefined || val === null) return;
        const text = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
        navigator.clipboard?.writeText(text);
        setCopiedOutputKey(key);
        setTimeout(() => setCopiedOutputKey(null), 1200);
    };

    const selectedNode = nodes.find((n) => n.id === selectedNodeId);
    const engineeringData =
        selectedNode && selectedNode.data.type === 'engineering'
            ? (selectedNode.data as EngineeringNodeData)
            : null;
    const schema = engineeringData ? getSchema(engineeringData.schemaId) : undefined;
    const outputs = engineeringData?.outputs || {};
    const linkInfo = useMemo(() => schema && engineeringData ? getModuleLinkInfo(schema.id, engineeringData as any, outputs) : null, [schema, engineeringData, outputs]);
    const dxfOutputKey = schema?.outputs.find((o) => o.type === 'dxf_file')?.id;
    const dxfContent = dxfOutputKey && typeof outputs[dxfOutputKey] === 'string' ? (outputs[dxfOutputKey] as string) : null;
    const pdfOutputKey = schema?.outputs.find((o) => o.type === 'pdf_file')?.id;
    const pdfContent = pdfOutputKey && typeof outputs[pdfOutputKey] === 'string' ? (outputs[pdfOutputKey] as string) : null;

    const dxfSvg = useMemo(() => (dxfContent ? dxfToSvgPreview(dxfContent, 288, 168) : null), [dxfContent]);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    useEffect(() => {
        if (!pdfContent || !pdfContent.startsWith('%PDF')) {
            setPdfUrl(null);
            return;
        }
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [pdfContent]);

    // If no node selected, show general flow diagnostics
    if (!selectedNode || selectedNode.data.type !== 'engineering') {
        return (
            <div className="w-80 h-full bg-[var(--bg-1)] border-l border-cyan-500/20 flex flex-col select-none text-slate-300">
                <div className="px-4 py-3 border-b border-cyan-950/60 bg-[var(--bg-1)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Layers size={14} className="text-cyan-400" />
                        <span className="text-xs font-bold tracking-wider text-slate-200">
                            {t12(language, 'FLOW INSPECTION & OVERVIEW', 'AKIŞ TEFTİŞ & GENEL DURUM')}
                        </span>
                    </div>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-slate-500 hover:text-slate-300 p-0.5"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    <div className="bg-[var(--bg-2)] border border-cyan-900/30 rounded-lg p-3">
                        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                            {t12(language, 'Graph Statistics', 'Grafik İstatistikleri')}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-[var(--bg-1)] border border-slate-800 rounded p-2">
                                <div className="text-lg font-mono font-bold text-cyan-400">{nodes.length}</div>
                                <div className="text-[9px] text-slate-500 uppercase">{t12(language, 'Total Nodes', 'Toplam Düğüm')}</div>
                            </div>
                            <div className="bg-[var(--bg-1)] border border-slate-800 rounded p-2">
                                <div className="text-lg font-mono font-bold text-cyan-400">{edges.length}</div>
                                <div className="text-[9px] text-slate-500 uppercase">{t12(language, 'Edges', 'Bağlantı (Edge)')}</div>
                            </div>
                        </div>
                    </div>

                    {lastExecution && (
                        <div className="bg-[var(--bg-2)] border border-cyan-900/30 rounded-lg p-3 space-y-2">
                            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                                {t12(language, 'Last Execution', 'Son Çözümleme')}
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span>{t12(language, 'Status:', 'Durum:')}</span>
                                <span className={`font-bold flex items-center gap-1 ${lastExecution.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {lastExecution.success ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                                    {lastExecution.success ? t12(language, 'PASSED', 'BAŞARILI (PASS)') : t12(language, 'FAILED', 'HATALI (FAIL)')}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span>{t12(language, 'Exec Time:', 'Hesaplama Süresi:')}</span>
                                <span className="text-slate-200">{lastExecution.executionTimeMs.toFixed(2)} ms</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span>{t12(language, 'Errors:', 'Hata Sayısı:')}</span>
                                <span className={lastExecution.errorCount > 0 ? 'text-red-400 font-bold' : 'text-slate-400'}>
                                    {lastExecution.errorCount}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span>{t12(language, 'Warnings:', 'Uyarı Sayısı:')}</span>
                                <span className={lastExecution.warningCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                                    {lastExecution.warningCount}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="text-[10px] text-slate-500 leading-relaxed border border-slate-800/80 rounded-lg p-3 bg-[var(--bg-1)]">
                        {t12(language, '💡 Click any node on canvas to inspect its parameters, formulas and DXF output.', '💡 Bir düğümün giriş/çıkış parametrelerini, formüllerini ve DXF çıktısını teftiş etmek için tuval üzerindeki herhangi bir düğüme tıklayın.')}
                    </div>
                </div>
            </div>
        );
    }

    const data = selectedNode.data as EngineeringNodeData;

    if (!schema) {
        return (
            <div className="w-80 h-full bg-[var(--bg-1)] border-l border-cyan-500/20 p-4 text-xs text-red-400 font-mono">
                Bilinmeyen şema: {data.schemaId}
            </div>
        );
    }

    const errors = data.executionErrors || [];
    const warnings = data.executionWarnings || [];

    const handleDownloadDxf = () => {
        if (!dxfContent) return;
        const blob = new Blob([dxfContent], { type: 'application/dxf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${schema.id}-${Date.now()}.dxf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCopyOutputs = () => {
        navigator.clipboard.writeText(JSON.stringify(outputs, null, 2));
        alert('Çıktı değerleri panoya kopyalandı.');
    };

    const handleDownloadPdf = () => {
        if (!pdfContent) return;
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${schema.id}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-80 h-full bg-[var(--bg-1)] border-l border-cyan-500/20 flex flex-col select-none text-slate-300">
            {/* Header */}
            <div className="px-4 py-3 border-b border-cyan-950/60 bg-[var(--bg-1)] flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold tracking-wide text-slate-100 truncate">
                            {schema.title}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-mono text-cyan-400">
                            {schema.id}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">v{schema.version}</span>
                        {schema.isoStandard && (
                            <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-cyan-950/80 border border-cyan-900/50 text-cyan-400 font-bold">
                                {schema.isoStandard}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setSelectedNode(null)}
                    className="text-slate-500 hover:text-slate-300 p-0.5 rounded"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {/* Description */}
                <div className="text-[10px] text-slate-400 leading-relaxed bg-[var(--bg-1)] border border-slate-800 rounded-lg p-2.5">
                    {schema.description}
                </div>

                {/* Live Engineering Blueprint Visualizer */}
                <div className="bg-[var(--bg-1)] border border-cyan-500/30 rounded-lg overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
                    <div className="p-2.5 bg-[var(--bg-2)] border-b border-cyan-950/60 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-bold text-cyan-300 flex items-center gap-1.5">
                                <Activity size={12} className="text-cyan-400" />
                                Canlı Mühendislik Şeması
                            </div>
                            <div className="text-[8px] font-mono text-slate-400">
                                {linkInfo?.info.standard || 'Parametrik Vektör Çizimi'}
                            </div>
                        </div>
                        {linkInfo && (
                            <a
                                href={linkInfo.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[9px] font-bold hover:bg-cyan-500/30 transition-all cursor-pointer "
                                title="Bu hesabı tam ekran hesaplayıcıda aç"
                            >
                                <span>Modülde Aç</span>
                                <ExternalLink size={10} />
                            </a>
                        )}
                    </div>

                    <div className="p-2 bg-[var(--bg-0)]">
                        <NodeVisualizerPreview
                            schemaId={schema.id}
                            inputs={data}
                            outputs={outputs}
                            mode="full"
                        />
                    </div>

                    {/* Cross-Module Action Buttons */}
                    {(linkInfo?.info.supports3DStudio || linkInfo?.info.supportsCuttingOptimizer || linkInfo?.info.supportsFea || linkInfo?.info.supportsCadDynamicBlock) && (
                        <div className="p-2 border-t border-cyan-950/50 bg-[var(--bg-1)] flex flex-wrap gap-1.5">
                            {linkInfo.info.supportsCadDynamicBlock && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const res = linkInfo.info.executeExportCadDynamicBlock?.(data, outputs);
                                        if (res?.message) alert(res.message);
                                    }}
                                    className="flex-1 min-w-[90px] flex items-center justify-center gap-1 px-2 py-1 rounded bg-teal-950/60 border border-teal-500/40 text-teal-300 text-[9px] font-bold hover:bg-teal-900/60 transition-all cursor-pointer "
                                    title="2D CAD çalışma alanına parametrik dinamik blok olarak ekle"
                                >
                                    <Grid size={10} />
                                    2D CAD Blok
                                </button>
                            )}

                            {linkInfo.info.supports3DStudio && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const res = linkInfo.info.executeExport3D?.(data, outputs);
                                        if (res?.message) alert(res.message);
                                    }}
                                    className="flex-1 min-w-[90px] flex items-center justify-center gap-1 px-2 py-1 rounded bg-sky-950/60 border border-sky-500/40 text-sky-300 text-[9px] font-bold hover:bg-sky-900/60 transition-all cursor-pointer "
                                >
                                    <Box size={10} />
                                    3D Stüdyo
                                </button>
                            )}

                            {linkInfo.info.supportsCuttingOptimizer && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const res = linkInfo.info.executeExportCutting?.(data, outputs);
                                        if (res?.message) alert(res.message);
                                    }}
                                    className="flex-1 min-w-[90px] flex items-center justify-center gap-1 px-2 py-1 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[9px] font-bold hover:bg-amber-900/60 transition-all cursor-pointer "
                                >
                                    <Scissors size={10} />
                                    1D Kesim
                                </button>
                            )}

                            {linkInfo.info.supportsFea && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const res = linkInfo.info.executeExportFea?.(data, outputs);
                                        if (res?.message) alert(res.message);
                                    }}
                                    className="flex-1 min-w-[90px] flex items-center justify-center gap-1 px-2 py-1 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300 text-[9px] font-bold hover:bg-purple-900/60 transition-all cursor-pointer "
                                >
                                    <Activity size={10} />
                                    FEA Analizi
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {dxfContent && (
                    <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-lg overflow-hidden">
                        <div className="p-2.5 flex items-center justify-between">
                            <div>
                                <div className="text-[10px] font-bold text-emerald-300">AutoCAD R12 DXF Önizleme</div>
                                <div className="text-[8px] font-mono text-slate-400">Katmanlı kontur · canlı çıktı</div>
                            </div>
                            <button
                                type="button"
                                onClick={handleDownloadDxf}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[9px] font-bold hover:bg-emerald-500/30 transition-all "
                            >
                                <Download size={11} />
                                İndir
                            </button>
                        </div>
                        {dxfSvg && (
                            <div
                                className="border-t border-emerald-900/40 bg-[var(--bg-0)]"
                                dangerouslySetInnerHTML={{ __html: dxfSvg }}
                            />
                        )}
                    </div>
                )}

                {pdfContent && (
                    <div className="bg-violet-950/30 border border-violet-500/40 rounded-lg overflow-hidden">
                        <div className="p-2.5 flex items-center justify-between">
                            <div>
                                <div className="text-[10px] font-bold text-violet-300">PDF Rapor Önizleme</div>
                                <div className="text-[8px] font-mono text-slate-400">ISO 7200 hesap raporu</div>
                            </div>
                            <button
                                type="button"
                                onClick={handleDownloadPdf}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-violet-500/20 border border-violet-400/50 text-violet-300 text-[9px] font-bold hover:bg-violet-500/30 transition-all"
                            >
                                <Download size={11} />
                                İndir
                            </button>
                        </div>
                        {pdfUrl && (
                            <iframe
                                title="PDF önizleme"
                                src={pdfUrl}
                                className="w-full h-40 border-t border-violet-900/40 bg-white"
                            />
                        )}
                    </div>
                )}

                {/* Inputs Section */}
                <div className="space-y-1.5">
                    <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                        Giriş Portları ({schema.inputs.length})
                    </div>
                    <div className="space-y-1">
                        {schema.inputs.map((input) => {
                            const isConnected = edges.some(
                                (e) => e.target === selectedNode.id && e.targetHandle === input.id
                            );
                            const unit = PORT_UNITS[input.type] || input.type;
                            const currentValue = (data as any)[input.id] ?? input.defaultValue ?? '';
                            return (
                                <div
                                    key={input.id}
                                    className="bg-[var(--bg-1)] border border-slate-800 rounded px-2.5 py-1.5 flex items-center justify-between gap-2"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] text-slate-200 font-medium truncate flex items-center gap-1">
                                            {input.label}
                                            <span className="text-[8px] text-slate-500 font-mono">[{unit}]</span>
                                        </div>
                                    </div>
                                    {isConnected ? (
                                        <div className="flex items-center gap-1 text-[8px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-900/40 px-1.5 py-0.5 rounded">
                                            <Link2 size={9} />
                                            BAĞLI
                                        </div>
                                    ) : (
                                        <input
                                            type={input.type === 'string' ? 'text' : 'number'}
                                            value={currentValue}
                                            onChange={(e) => {
                                                const val = input.type === 'string' ? e.target.value : parseFloat(e.target.value);
                                                updateNodeData(selectedNode.id, { [input.id]: isNaN(val as number) ? e.target.value : val } as any);
                                                executeGraph();
                                            }}
                                            className="w-20 bg-[var(--bg-2)] border border-slate-700 rounded px-1.5 py-0.5 text-right text-[10px] font-mono text-cyan-300 outline-none focus:border-cyan-500"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Outputs Section */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
                            Hesaplanan Çıktılar ({schema.outputs.length})
                        </span>
                        <button
                            type="button"
                            onClick={handleCopyOutputs}
                            className="text-[9px] font-mono text-slate-500 hover:text-slate-300 flex items-center gap-0.5"
                            title="Tüm değerleri JSON olarak kopyala"
                        >
                            <Copy size={10} />
                            Tümünü Kopyala
                        </button>
                    </div>
                    <div className="space-y-1">
                        {schema.outputs.map((output) => {
                            const val = outputs[output.id];
                            const unit = PORT_UNITS[output.type] || output.type;
                            let displayVal = '—';
                            if (typeof val === 'number') {
                                if (!Number.isFinite(val)) displayVal = String(val);
                                else if (Math.abs(val) >= 1e7 || (Math.abs(val) > 0 && Math.abs(val) < 1e-4)) {
                                    displayVal = val.toExponential(3);
                                } else if (Number.isInteger(val)) {
                                    displayVal = val.toLocaleString('en-US');
                                } else {
                                    displayVal = Math.abs(val) >= 1000
                                        ? val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
                                        : val.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
                                }
                            } else if (typeof val === 'boolean') {
                                displayVal = val ? 'TRUE' : 'FALSE';
                            } else if (typeof val === 'string') {
                                displayVal = val.length > 20 ? `${val.slice(0, 20)}…` : val;
                            } else if (val && typeof val === 'object') {
                                displayVal = JSON.stringify(val).slice(0, 20) + '…';
                            }
                            return (
                                <div
                                    key={output.id}
                                    className="bg-[var(--bg-1)] border border-slate-800 hover:border-slate-700 rounded px-2.5 py-1.5 flex items-center justify-between transition-colors"
                                >
                                    <div className="text-[10px] text-slate-400 truncate max-w-[150px]" title={output.label}>
                                        {output.label}
                                        <span className="ml-1 text-[8px] text-slate-600 font-mono">[{unit}]</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleCopySingleOutput(output.id, val)}
                                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1 ${
                                            copiedOutputKey === output.id
                                                ? 'bg-emerald-900/60 border-emerald-400 text-emerald-200'
                                                : 'bg-[var(--bg-0)] border-emerald-500/20 text-emerald-400 hover:border-emerald-400/50 hover:bg-emerald-950/40'
                                        }`}
                                        title={copiedOutputKey === output.id ? 'KOPYALANDI!' : `Tekil değeri kopyala: ${val ?? '—'}`}
                                    >
                                        {copiedOutputKey === output.id ? (
                                            <>
                                                <CheckCircle2 size={10} />
                                                <span className="text-[9px]">KOPYALANDI</span>
                                            </>
                                        ) : (
                                            <span>{displayVal}</span>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Diagnostics / Validation */}
                {(errors.length > 0 || warnings.length > 0) && (
                    <div className="space-y-1.5">
                        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                            Doğrulama & Standart Kontrolleri
                        </div>
                        {errors.map((err, i) => (
                            <div
                                key={i}
                                className="bg-red-950/30 border border-red-500/40 rounded p-2 text-[9px] font-mono text-red-300 flex items-start gap-1.5"
                            >
                                <AlertTriangle size={12} className="text-red-400 shrink-0 mt-0.5" />
                                <span>{err}</span>
                            </div>
                        ))}
                        {warnings.map((warn, i) => (
                            <div
                                key={i}
                                className="bg-amber-950/30 border border-amber-500/40 rounded p-2 text-[9px] font-mono text-amber-300 flex items-start gap-1.5"
                            >
                                <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                                <span>{warn}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions Footer */}
            <div className="p-3 border-t border-slate-800 bg-[var(--bg-1)] flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => duplicateNode(selectedNode.id)}
                    className="px-2.5 py-1 rounded border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 text-[10px] font-bold font-mono transition-all"
                >
                    Çoğalt
                </button>
                <button
                    type="button"
                    onClick={() => removeNode(selectedNode.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded border border-red-900/50 text-red-400 hover:bg-red-950/30 text-[10px] font-bold font-mono transition-all"
                >
                    <Trash2 size={11} />
                    Sil
                </button>
            </div>
        </div>
    );
};
