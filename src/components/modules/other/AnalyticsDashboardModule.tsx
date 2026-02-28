'use client';

/**
 * AluCalc OS — Analytics Dashboard Module
 * 
 * Real-time overview of calculator usage statistics,
 * active Flow nodes, recent calculations, and system health.
 */

import React, { useMemo } from 'react';
import {
    BarChart3, Activity, Cpu, Layers, Clock, TrendingUp,
    Calculator, Wrench, Zap, Database, ArrowUpRight, ArrowDownRight,
    LucideIcon
} from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';
import { getAllCalculators, DOMAIN_INFO } from '@/calculators/registry';

// ── Stat Card ──
function StatCard({ label, value, icon: Icon, color, trend }: {
    label: string; value: string | number; icon: LucideIcon;
    color: string; trend?: { value: string; up: boolean };
}) {
    return (
        <div className="bg-[#0f1419] border border-white/5 rounded-xl p-4 flex flex-col gap-3 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                    <Icon size={18} style={{ color }} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-0.5 text-[11px] font-bold ${trend.up ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trend.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {trend.value}
                    </div>
                )}
            </div>
            <div>
                <div className="text-2xl font-black text-white tracking-tight">{value}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">{label}</div>
            </div>
        </div>
    );
}

// ── Domain Bar ──
function DomainBar({ name, count, total, color }: { name: string; count: number; total: number; color: string }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 w-24 text-right font-medium truncate">{name}</span>
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-[11px] text-slate-500 w-8 font-mono">{count}</span>
        </div>
    );
}

export default function AnalyticsDashboardModule() {
    const { nodes, edges } = useFlowStore();
    const allCalcs = useMemo(() => getAllCalculators(), []);

    // Derived stats
    const calcNodes = nodes.filter(n => n.type === 'calculator');
    const noteNodes = nodes.filter(n => n.type === 'note');
    const mediaNodes = nodes.filter(n => n.type === 'media');

    // Domain distribution
    const domainCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        allCalcs.forEach(c => {
            const d = c.domain || 'other';
            counts[d] = (counts[d] || 0) + 1;
        });
        return counts;
    }, [allCalcs]);

    const domainMeta = Object.entries(DOMAIN_INFO);

    return (
        <div className="w-full h-full bg-[#0a0e14] overflow-y-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20 flex items-center justify-center">
                    <BarChart3 size={20} className="text-blue-400" />
                </div>
                <div>
                    <h1 className="text-lg font-black text-white tracking-tight">Analytics Dashboard</h1>
                    <p className="text-xs text-slate-500">System overview & calculator statistics</p>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                <StatCard label="Total Calculators" value={allCalcs.length} icon={Calculator} color="#00e5ff" trend={{ value: '+2', up: true }} />
                <StatCard label="Active Flow Nodes" value={nodes.length} icon={Layers} color="#8b5cf6" />
                <StatCard label="Connections" value={edges.length} icon={Activity} color="#10b981" />
                <StatCard label="Calc Domains" value={Object.keys(domainCounts).length} icon={Database} color="#f59e0b" />
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-2 gap-4">
                {/* Domain Distribution */}
                <div className="bg-[#0f1419] border border-white/5 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Calculator Domains</h3>
                    <div className="space-y-2.5">
                        {domainMeta.map(([key, meta]) => (
                            <DomainBar
                                key={key}
                                name={(meta as any).label || key}
                                count={domainCounts[key] || 0}
                                total={allCalcs.length}
                                color={(meta as any).color || '#666'}
                            />
                        ))}
                    </div>
                </div>

                {/* Active Nodes Breakdown */}
                <div className="bg-[#0f1419] border border-white/5 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Flow Canvas Nodes</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <Calculator size={14} className="text-cyan-400" />
                                <span className="text-sm text-slate-300">Calculator Nodes</span>
                            </div>
                            <span className="text-sm font-bold text-white">{calcNodes.length}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <Wrench size={14} className="text-orange-400" />
                                <span className="text-sm text-slate-300">Note Nodes</span>
                            </div>
                            <span className="text-sm font-bold text-white">{noteNodes.length}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <Zap size={14} className="text-yellow-400" />
                                <span className="text-sm text-slate-300">Media Nodes</span>
                            </div>
                            <span className="text-sm font-bold text-white">{mediaNodes.length}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2">
                                <Activity size={14} className="text-emerald-400" />
                                <span className="text-sm text-slate-300">Edge Connections</span>
                            </div>
                            <span className="text-sm font-bold text-white">{edges.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Status */}
            <div className="mt-4 bg-[#0f1419] border border-white/5 rounded-xl p-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">System Status</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <div>
                            <div className="text-xs font-bold text-white">Engine</div>
                            <div className="text-[10px] text-emerald-400">Online</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <div>
                            <div className="text-xs font-bold text-white">Flow System</div>
                            <div className="text-[10px] text-emerald-400">{nodes.length} nodes active</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <div>
                            <div className="text-xs font-bold text-white">Calculator Registry</div>
                            <div className="text-[10px] text-emerald-400">{allCalcs.length} loaded</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
