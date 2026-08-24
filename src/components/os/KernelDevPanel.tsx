/**
 * AluCalculator Engineering Kernel — Developer Panel
 * 
 * Shows kernel status, registered modules, and build info.
 * Visible only in development or when enabled.
 */

'use client';

import { useEffect, useState } from 'react';
import { useI18nStore } from '@/store/i18nStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { getKernelDevStrings } from '@/locales/kernelDevTranslations';
import { KERNEL, bootKernel, type KernelModule, type KernelStatus } from '@/core/kernel';
import { CalculatorRegistry } from '@/lib/kernel/registry';
import { auditLog, ExecutionLogEntry } from '@/lib/traceability/audit';
import { CalculatorSchema } from '@/lib/kernel/schema';
import {
    Terminal,
    Cpu,
    Package,
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    X,
    Activity,
    Database,
    FileCode,
    Bot,
    Zap
} from 'lucide-react';

interface KernelDevPanelProps {
    defaultOpen?: boolean;
}

type Tab = 'modules' | 'schemas' | 'trace' | 'intelligence';

export function KernelDevPanel({ defaultOpen = false }: KernelDevPanelProps) {
    const { language } = useI18nStore();
    const kd = getKernelDevStrings(language);
    const debugMode = useWorkspaceStore((s) => s.debugMode);
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [status, setStatus] = useState<KernelStatus | null>(null);
    const [modules, setModules] = useState<KernelModule[]>([]);
    const [schemas, setSchemas] = useState<CalculatorSchema[]>([]);
    const [logs, setLogs] = useState<ExecutionLogEntry[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('schemas');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    // Poll for updates (poor man's subscription)
    useEffect(() => {
        const interval = setInterval(() => {
            if (isOpen) {
                setLogs(auditLog.getLogs());
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isOpen]);

    useEffect(() => {
        const init = async () => {
            try {
                await bootKernel();
                setStatus(KERNEL.getStatus());
                setModules(KERNEL.getAll());

                // Load new kernel schemas
                try {
                    setSchemas(CalculatorRegistry.getAll());
                } catch (e) {
                    console.warn('Engineering Registry not ready yet');
                }

                setLogs(auditLog.getLogs());

            } catch (error) {
                console.error('Kernel boot failed:', error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [isOpen]);

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    // Group modules by category
    const groupedModules = modules.reduce((acc, mod) => {
        const cat = mod.metadata.category || kd.uncategorized;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(mod);
        return acc;
    }, {} as Record<string, KernelModule[]>);

    // Group schemas by category
    const groupedSchemas = schemas.reduce((acc, schema) => {
        const cat = schema.category || kd.uncategorized;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(schema);
        return acc;
    }, {} as Record<string, CalculatorSchema[]>);

    if (!debugMode) return null;

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-50 flex items-center gap-2 text-xs text-slate-300"
            >
                <Terminal size={14} />
                <span>{kd.kernelButton}</span>
                {status && (
                    <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-[10px]">
                        {status.moduleCount + schemas.length}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-[400px] h-[600px] bg-[#0d1117] border border-slate-700 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden font-mono">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <Cpu size={14} className="text-cyan-400" />
                    <span className="text-sm font-bold text-white">{kd.panelTitle}</span>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-slate-700 rounded"
                >
                    <X size={14} className="text-slate-400" />
                </button>
            </div>

            {/* Status Bar */}
            {status && (
                <div className="flex divide-x divide-slate-800 border-b border-slate-800 text-[10px] text-slate-500">
                    <div className="flex-1 px-3 py-1 flex justify-between items-center">
                        <span>{kd.boot}:</span>
                        <span className="text-green-400">OK</span>
                    </div>
                    <div className="flex-1 px-3 py-1 flex justify-between items-center">
                        <span>{kd.modules}:</span>
                        <span className="text-cyan-400">{modules.length}</span>
                    </div>
                    <div className="flex-1 px-3 py-1 flex justify-between items-center">
                        <span>{kd.schemas}:</span>
                        <span className="text-amber-400">{schemas.length}</span>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-slate-700 bg-slate-900/30">
                <button
                    onClick={() => setActiveTab('intelligence')}
                    className={`flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'intelligence' ? 'text-cyan-400 bg-slate-800/50 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Bot size={12} /> MCP
                </button>
                <button
                    onClick={() => setActiveTab('schemas')}
                    className={`flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'schemas' ? 'text-amber-400 bg-slate-800/50 border-b-2 border-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Database size={12} /> {kd.schemas}
                </button>
                <button
                    onClick={() => setActiveTab('trace')}
                    className={`flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'trace' ? 'text-green-400 bg-slate-800/50 border-b-2 border-green-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Activity size={12} /> {kd.trace} ({logs.length})
                </button>
                <button
                    onClick={() => setActiveTab('modules')}
                    className={`flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'modules' ? 'text-cyan-400 bg-slate-800/50 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Package size={12} /> {kd.legacy}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#0a0e14]">
                {/* INTELLIGENCE TAB */}
                {!loading && activeTab === 'intelligence' && (
                    <div className="p-3 space-y-4">
                        <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-bold uppercase tracking-wider mb-4">
                            <Zap size={10} /> {kd.activeLogicBridges}
                        </div>
                        
                        {[
                            { id: 'materials-project', title: 'Materials Science MCP', status: 'CONNECTED', tools: ['search_materials', 'get_structure'] },
                            { id: 'phys-cas', title: 'Physics CAS MCP', status: 'CONNECTED', tools: ['solve_physics', 'plot_symbolic'] },
                            { id: 'figma-context', title: 'Figma Design MCP', status: 'READY', tools: ['get_component_spec'] },
                            { id: 'git-fs', title: 'Git & Filesystem MCP', status: 'INDEXING', tools: ['read_file', 'git_diff'] }
                        ].map(mcp => (
                            <div key={mcp.id} className="bg-[#161b22] border border-slate-800 rounded-lg overflow-hidden">
                                <div className="px-3 py-2 bg-slate-800/30 flex justify-between items-center border-b border-slate-800">
                                    <span className="text-xs font-bold text-white">{mcp.title}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${mcp.status === 'CONNECTED' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-700 text-slate-400'}`}>
                                        {mcp.status}
                                    </span>
                                </div>
                                <div className="p-2">
                                    <div className="text-[9px] text-slate-500 mb-1 uppercase tracking-tighter">{kd.exposedTools}:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {mcp.tools.map(tool => (
                                            <span key={tool} className="text-[9px] px-1.5 py-0.5 bg-black/40 border border-slate-700 rounded text-slate-400 font-mono">
                                                {tool}()
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        <div className="mt-4 p-2 bg-blue-500/5 border border-blue-500/20 rounded text-[10px] text-blue-300">
                            <span className="font-bold">{kd.note}:</span> {kd.mcpNote}
                        </div>
                    </div>
                )}

                {loading && <div className="p-4 text-center text-slate-500 text-xs">{kd.loadingKernel}</div>}

                {/* SCHEMAS TAB */}
                {!loading && activeTab === 'schemas' && (
                    <div className="p-2 space-y-2">
                        {Object.entries(groupedSchemas).map(([category, catSchemas]) => (
                            <div key={category} className="mb-2">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1">{category}</div>
                                <div className="space-y-1">
                                    {catSchemas.map(s => (
                                        <div key={s.id} className="bg-[#161b22] border border-slate-800 rounded px-3 py-2 hover:border-amber-500/50 transition-colors group">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-amber-200 font-bold">{s.id}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">v{s.version}</span>
                                            </div>
                                            <div className="flex gap-2 text-[10px] text-slate-500">
                                                <span>I: {s.inputs.length}</span>
                                                <span>O: {s.outputs.length}</span>
                                                <span className="ml-auto text-slate-600">{s.standards.join(', ')}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* TRACE TAB */}
                {!loading && activeTab === 'trace' && (
                    <div className="p-2 space-y-2">
                        {logs.length === 0 && (
                            <div className="text-center text-slate-600 text-xs py-8">{kd.noExecutionLogs}<br />{kd.runCalculationHint}</div>
                        )}
                        {[...logs].reverse().map((log, i) => (
                            <div key={i} className="bg-[#161b22] border border-slate-800 rounded p-2 text-xs">
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    <span className="text-green-400">{kd.success}</span>
                                </div>
                                <div className="font-bold text-green-300 mb-1">{log.calculatorId}</div>
                                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/50">
                                    <div>
                                        <div className="text-[9px] text-slate-500 mb-1">{kd.inputs}</div>
                                        {Object.entries(log.inputs).map(([k, v]) => (
                                            <div key={k} className="flex justify-between text-[10px] text-slate-300">
                                                <span>{k}:</span>
                                                <span>{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="text-[9px] text-slate-500 mb-1">{kd.outputs}</div>
                                        {Object.entries(log.outputs).map(([k, v]) => (
                                            <div key={k} className="flex justify-between text-[10px] text-slate-300">
                                                <span>{k}:</span>
                                                <span className="text-emerald-400">{v.value.toFixed(2)} {v.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* MODULES TAB */}
                {!loading && activeTab === 'modules' && (
                    <div className="p-2 text-xs">
                        {Object.entries(groupedModules).map(([category, mods]) => (
                            <div key={category} className="mb-2">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1">{category}</div>
                                {mods.map(mod => (
                                    <div key={mod.id} className="bg-[#161b22] border border-slate-800 rounded px-2 py-1 mb-1 flex justify-between">
                                        <span className="text-cyan-200">{mod.metadata.title}</span>
                                        <span className="text-slate-500">{mod.id}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-3 py-1.5 bg-slate-900/50 border-t border-slate-800 text-[10px] text-slate-600 text-center flex justify-between">
                <span>Engineering OS v4.0</span>
                <span>{kd.ready}</span>
            </div>
        </div>
    );
}
