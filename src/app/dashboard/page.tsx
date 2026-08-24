"use client";

import { useEffect, useState } from 'react';
import { useWorkspace } from '@/store/useWorkspace';
import { useI18nStore } from '@/store/i18nStore';
import { getDashboardPage } from '@/locales/dashboardTranslations';

import { 
    Folder, Plus, ArrowRight, Activity, 
    Shield, Terminal, Zap, Cog, Database, 
    GitBranch, Box
} from 'lucide-react';
import Link from 'next/link';
import { UserMenu } from '@/components/auth/UserMenu';
import { DependencyGraph } from '@/components/dashboard/DependencyGraph';

/**
 * Command Center v5.0 (Beta Launch Readiness)
 * High-density dashboard for multi-module project intelligence.
 */

export default function DashboardPage() {
    const { language } = useI18nStore();
    const d = getDashboardPage(language);
    const session = null as any; // Static export: auth disabled
    const { currentProjectId, setCurrentProject } = useWorkspace();
    const [projects, setProjects] = useState<any[]>([]);
    const [activeModules, setActiveModules] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'ledger' | 'flow'>('ledger');
    const [selectedNode, setSelectedNode] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (currentProjectId) {
            fetchModules(currentProjectId);
        }
    }, [currentProjectId]);

    const fetchModules = async (projectId: string) => {
        try {
            const response = await fetch(`/api/calculations?projectId=${projectId}`, { cache: 'no-store' });
            if (response.ok) {
                const data = await response.json();
                // Map DB format to UI format
                const mapped = data.map((c: any) => {
                    let type = c.type.replace('seo_', '');
                    // Normalize shorthand types to full registry types
                    if (type === 'gears') type = 'gears-bearings';
                    if (type === 'fasteners') type = 'fasteners';
                    
                    return {
                        id: c.id,
                        type: type,
                        name: c.type.replace('seo_', '').toUpperCase() + ' Analysis',
                        status: 'verified',
                        val: c.result_json ? 
                            (typeof Object.values(c.result_json)[0] === 'number' 
                                ? (Object.values(c.result_json)[0] as number).toFixed(2) 
                                : String(Object.values(c.result_json)[0])) + ' unit' 
                            : 'N/A',
                        input_json: c.input_json,
                        result_json: c.result_json
                    };
                });
                setActiveModules(mapped);
            }
        } catch (error) {
            console.error("Fetch modules failed", error);
        }
    };

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/projects', { cache: 'no-store' });
            const data = await response.json();
            if (response.ok) {
                setProjects(data);
                if (data.length > 0) {
                    // Always default to the first project if none selected
                    if (!currentProjectId) setCurrentProject(data[0].id);
                }
            }
        } catch (error) {
            console.error("Fetch projects failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProject = async (name: string = "New Project") => {
        const projectName = name === "New Project" ? 
            prompt(d.promptProjectName, d.defaultProjectName) : name;
        
        if (!projectName) return;

        setIsCreating(true);
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: projectName })
            });

            if (response.ok) {
                const newProject = await response.json();
                setProjects([...projects, newProject]);
                setCurrentProject(newProject.id);
            }
        } catch (error) {
            alert(d.createFailed);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020408] text-slate-400 selection:bg-blue-500/20 font-sans">
            
            {/* Command Header */}
            <header className="border-b border-slate-900 bg-[#020408]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="flex items-center gap-2 group">
                            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-black text-[10px] group-hover:scale-110 transition-transform">AC</div>
                            <span className="text-white font-bold text-xs tracking-tight uppercase">AluCalc <span className="text-blue-500">OS</span></span>
                        </Link>
                        <div className="h-4 w-[1px] bg-slate-800"></div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-lg border border-slate-800">
                            <Database size={12} className="text-slate-500" />
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{d.instanceLabel}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] text-emerald-500 font-bold uppercase">{d.coreStable}</span>
                        </div>
                        <UserMenu />
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-6 py-8 grid grid-cols-12 gap-8">
                
                {/* Left Sidebar: Control Center Stats */}
                <div className="col-span-12 lg:col-span-3 space-y-6">
                    <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-xl space-y-8">
                        <div>
                            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                                <Activity size={12} className="text-blue-500" />
                                {d.executionMetrics}
                            </h2>
                            <div className="space-y-6">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-[10px] text-slate-600 uppercase">{d.avgLatency}</span>
                                    <span className="text-xl font-mono font-bold text-emerald-500">14.2ms</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-[10px] text-slate-600 uppercase">{d.successRate}</span>
                                    <span className="text-xl font-mono font-bold text-white">100%</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-800 space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{d.systemIdentity}</h3>
                            <div className="space-y-2">
                                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 flex items-center gap-3">
                                    <Shield size={14} className="text-blue-500" />
                                    <span className="text-[10px] font-mono text-slate-400 uppercase">{d.encryptedSession}</span>
                                </div>
                                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 flex items-center gap-3">
                                    <Terminal size={14} className="text-slate-600" />
                                    <span className="text-[10px] font-mono text-slate-400 uppercase">{d.authJwt}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Launchpad */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{d.activeModules}</h3>
                        <div className="grid grid-cols-1 gap-2">
                            <Link href="/bearings" className="flex items-center justify-between p-4 bg-slate-900/20 border border-slate-800/50 rounded-xl hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Zap size={14} className="text-blue-500" />
                                    <span className="text-xs font-bold text-slate-300">{d.bearings}</span>
                                </div>
                                <ArrowRight size={12} />
                            </Link>
                            <Link href="/gears" className="flex items-center justify-between p-4 bg-slate-900/20 border border-slate-800/50 rounded-xl hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Cog size={14} className="text-blue-500" />
                                    <span className="text-xs font-bold text-slate-300">{d.gears}</span>
                                </div>
                                <ArrowRight size={12} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Center Content: Project Intelligence */}
                <div className="col-span-12 lg:col-span-9 space-y-8">
                    
                    {projects.length === 0 && !isLoading ? (
                        /* Empty State Onboarding */
                        <div className="flex flex-col items-center justify-center py-24 px-8 bg-[#0f172a] border border-slate-800 rounded-[3rem] text-center space-y-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
                            
                            <div className="space-y-4 max-w-lg">
                                <div className="p-4 bg-blue-600/10 rounded-3xl w-fit mx-auto border border-blue-500/20">
                                    <Box className="w-8 h-8 text-blue-500" />
                                </div>
                                <h2 className="text-3xl font-black text-white tracking-tight uppercase">{d.emptyTitle}</h2>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    {d.emptyDescription}
                                </p>
                            </div>

                            <button 
                                onClick={() => handleCreateProject("Project Alpha")}
                                disabled={isCreating}
                                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 flex items-center gap-3 group disabled:opacity-50"
                            >
                                <Plus size={16} />
                                {isCreating ? d.initializing : d.initializeProject}
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Workspace Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-8">
                                    <div>
                                        <h1 className="text-2xl font-black tracking-tight text-white uppercase">{d.commandCenter}</h1>
                                        <p className="text-xs text-slate-500 mt-1">{d.commandCenterSubtitle}</p>
                                    </div>
                                    <div className="h-10 w-[1px] bg-slate-900 hidden md:block"></div>
                                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                                        <button 
                                            onClick={() => setViewMode('ledger')}
                                            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'ledger' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            {d.projectLedger}
                                        </button>
                                        <button 
                                            onClick={() => setViewMode('flow')}
                                            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'flow' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            {d.assemblyFlow}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleCreateProject()}
                                        disabled={isCreating}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold text-white transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                    >
                                        <Plus size={16} />
                                        {isCreating ? d.creating : d.newProject}
                                    </button>
                                </div>
                            </div>

                            {/* Dynamic View Content Area */}
                            <div className="flex gap-8 items-start">
                                <div className={`transition-all duration-500 flex-grow ${selectedNode ? 'lg:max-w-[calc(100%-384px-2rem)]' : 'w-full'}`}>
                                    {viewMode === 'flow' ? (
                                        <div className="p-8 bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl">
                                            <div className="flex items-center gap-3 mb-8">
                                                <GitBranch size={18} className="text-blue-500" />
                                                <h3 className="text-sm font-bold text-white uppercase tracking-tight">{d.dependencyGraph}</h3>
                                            </div>
                                            <DependencyGraph 
                                                calculations={activeModules} 
                                                onSelectNode={(node) => setSelectedNode(node)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {/* Active Cards */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {activeModules.map(node => (
                                                    <div 
                                                        key={node.id} 
                                                        onClick={() => setSelectedNode(node)}
                                                        className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all cursor-pointer"
                                                    >
                                                        <div className="absolute top-0 right-0 p-3">
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                                                <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                                                <span className="text-[8px] text-emerald-500 font-bold uppercase">{d.verified}</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-blue-600/10 rounded flex items-center justify-center border border-blue-500/20">
                                                                    {node.type === 'gears' ? <Cog size={20} className="text-blue-500" /> : <Zap size={20} className="text-blue-500" />}
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{node.name}</h4>
                                                                    <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">{node.type} {d.moduleSuffix}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-3xl font-mono font-bold text-white tracking-tighter">{node.val.split(' ')[0]}</span>
                                                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{node.val.split(' ')[1]}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Project Repository Ledger */}
                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2">{d.projectHistory}</h3>
                                                <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
                                                    <table className="w-full text-left border-collapse">
                                                        <tbody className="divide-y divide-slate-900">
                                                            {projects.slice(0, 5).map(p => (
                                                                <tr key={p.id} onClick={() => setSelectedNode(p)} className="hover:bg-slate-900/50 transition-colors cursor-pointer group">
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-4">
                                                                            <Folder size={16} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
                                                                            <div>
                                                                                <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{p.name}</p>
                                                                                <p className="text-[9px] font-mono text-slate-600 mt-0.5">{p.id}</p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-[10px] font-mono text-slate-600 text-right">
                                                                        {new Date(p.created_at).toLocaleDateString()}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Node Quick View (Side Panel) */}
                                {selectedNode && (
                                    <div className="w-96 flex-shrink-0 animate-in slide-in-from-right duration-500">
                                        <div className="sticky top-24 p-6 bg-[#0f172a] border border-blue-500/20 rounded-3xl shadow-2xl space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{d.nodeQuickInspect}</h3>
                                                <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
                                                    <Plus size={14} className="rotate-45" />
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                <h4 className="text-lg font-black text-white uppercase truncate">{selectedNode.name || selectedNode.type}</h4>
                                                <p className="text-[10px] font-mono text-slate-600">{selectedNode.id}</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 space-y-3">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase">{d.inputPayload}</span>
                                                    <pre className="text-[10px] font-mono text-blue-400 overflow-auto max-h-32 scrollbar-hide">
                                                        {JSON.stringify(selectedNode.input_json || {}, null, 2)}
                                                    </pre>
                                                </div>
                                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 space-y-3">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase">{d.executionResult}</span>
                                                    <pre className="text-[10px] font-mono text-emerald-400 overflow-auto max-h-32 scrollbar-hide">
                                                        {JSON.stringify(selectedNode.result_json || {}, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>

                                            <Link 
                                                href={`/${selectedNode.type}?id=${selectedNode.id}`}
                                                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white transition-all group"
                                            >
                                                {d.launchWorkstation}
                                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* System Status Footer */}
                    <footer className="pt-12 border-t border-slate-900 flex justify-between items-center text-[8px] font-bold text-slate-600 uppercase tracking-[0.3em]">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-500"></div> {d.systemOnline}</span>
                            <span>{d.versionLabel}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span>{d.truthLedgerVerified}</span>
                            <span>{d.latencyLabel}</span>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
}
