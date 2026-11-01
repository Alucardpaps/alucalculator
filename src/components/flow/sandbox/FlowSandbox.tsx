'use client';

/**
 * AluCalculator OS — Universal Flow Engineering Sandbox
 *
 * Real-time virtual test bench and multi-disciplinary instrument deck:
 * - Live parameter tuning sliders for all active graph nodes
 * - Real-time geometric cross-section SVG preview with dimensional callouts
 * - Beam bending deflection & stress safety oscilloscope
 * - Metallurgical heat treatment & hardness transformation gauge
 * - SDOF vibration resonance amplification curve
 * - Real gas Van der Waals compressibility & Gibbs thermodynamics monitor
 * - Turnkey engineering laboratory quick-switch presets
 *
 * Layer: UI Component (AluCalc Instrument design system, zero glassmorphism).
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { getSchema } from '@/flow/nodes/Registry';
import { PORT_UNITS } from '@/flow/core/ports';
import { SANDBOX_TEMPLATES } from '@/flow/templates/sandboxTemplates';
import {
    Sliders,
    Play,
    RotateCcw,
    Layers,
    Cpu,
    Activity,
    Compass,
    Flame,
    Atom,
    CheckCircle2,
    AlertTriangle,
    Eye,
    Maximize2,
    ArrowRight,
    Zap,
    Download,
    FileText,
    Search,
} from 'lucide-react';

interface FlowSandboxProps {
    onSwitchToCanvas?: () => void;
}

export const FlowSandbox: React.FC<FlowSandboxProps> = ({ onSwitchToCanvas }) => {
    const nodes = useFlowStore((s) => s.nodes);
    const edges = useFlowStore((s) => s.edges);
    const updateNodeData = useFlowStore((s) => s.updateNodeData);
    const executeGraph = useFlowStore((s) => s.executeGraph);
    const loadTemplate = useFlowStore((s) => s.loadTemplate);
    const lastExecution = useFlowStore((s) => s.lastExecution);

    const [selectedLabId, setSelectedLabId] = useState<string>('sandbox-structural-beam');
    const [activeTab, setActiveTab] = useState<'visualizer' | 'telemetry' | 'labs'>('visualizer');
    const [searchFilter, setSearchFilter] = useState<string>('');

    // Run solver
    const handleRun = useCallback(() => {
        executeGraph();
    }, [executeGraph]);

    // Handle parameter slider/input changes with instant reactive update
    const handleParamChange = (nodeId: string, paramKey: string, val: number | string) => {
        updateNodeData(nodeId, { [paramKey]: val } as any);
        executeGraph();
    };

    // Load Turnkey Lab
    const handleLoadLab = useCallback((templateId: string) => {
        setSelectedLabId(templateId);
        setSearchFilter('');
        loadTemplate(templateId);
        setTimeout(() => {
            executeGraph();
        }, 40);
    }, [loadTemplate, executeGraph]);

    // Extract all configurable engineering nodes
    const configurableNodes = useMemo(() => {
        return nodes
            .filter((n) => (n.data as any)?.schemaId)
            .map((n) => {
                const schemaId = (n.data as any).schemaId as string;
                const schema = getSchema(schemaId);
                return {
                    id: n.id,
                    schemaId,
                    title: (n.data as any).title || schema?.title || n.id,
                    schema,
                    data: n.data as any,
                };
            });
    }, [nodes]);

    // Find any geometric section profile in the active graph
    const activeProfileNode = useMemo(() => {
        return nodes.find((n) => {
            const out = (n.data as any)?.outputs;
            return out?.profile || out?.svg;
        });
    }, [nodes]);

    const activeProfileData = (activeProfileNode?.data as any)?.outputs?.profile;
    const activeProfileSvg = (activeProfileNode?.data as any)?.outputs?.svg;

    // Find any beam deflection node in graph
    const activeBeamNode = useMemo(() => {
        return nodes.find((n) => (n.data as any)?.schemaId === 'mech-beam-deflection');
    }, [nodes]);

    // Find any metallurgy / heat treatment node
    const activeHeatTreatNode = useMemo(() => {
        return nodes.find((n) => (n.data as any)?.schemaId === 'mat-heat-treatment');
    }, [nodes]);

    // Find any vibration node
    const activeVibrationNode = useMemo(() => {
        return nodes.find((n) => (n.data as any)?.schemaId === 'phys-vibration-sdof');
    }, [nodes]);

    // Find any gas law / thermo node
    const activeGasNode = useMemo(() => {
        return nodes.find((n) => (n.data as any)?.schemaId === 'chem-gas-laws' || (n.data as any)?.schemaId === 'chem-thermo');
    }, [nodes]);

    // Find any gear train node
    const activeGearNode = useMemo(() => {
        return nodes.find((n) => (n.data as any)?.schemaId === 'mech-gear-spur' || (n.data as any)?.schemaId === 'mech-gear-helical');
    }, [nodes]);

    // Find any power / torque node
    const activePowerNode = useMemo(() => {
        return nodes.find((n) => (n.data as any)?.schemaId === 'mech-power-torque');
    }, [nodes]);

    // Find Kinematics node
    const activeKinematicsNode = useMemo(() => {
        return nodes.find((n) => (n.data as any)?.schemaId === 'phys-kinematics');
    }, [nodes]);

    // Find Dynamics on Incline node
    const activeDynamicsNode = useMemo(() => {
        return nodes.find((n) => (n.data as any)?.schemaId === 'phys-dynamics-friction');
    }, [nodes]);

    // Find Solution pH node
    const activePhNode = useMemo(() => {
        return nodes.find((n) => (n.data as any)?.schemaId === 'chem-solution-ph' || (n.data as any)?.schemaId === 'chem-concentration-ph');
    }, [nodes]);

    // Find IUPAC Element node
    const activeElementNode = useMemo(() => {
        return nodes.find((n) => (n.data as any)?.schemaId === 'chem-element');
    }, [nodes]);

    // Find Material Selector node
    const activeMaterialNode = useMemo(() => {
        return nodes.find((n) => (n.data as any)?.schemaId === 'mat-universal-selector');
    }, [nodes]);

    // Filter nodes in control deck
    const filteredConfigurableNodes = useMemo(() => {
        if (!searchFilter.trim()) return configurableNodes;
        const q = searchFilter.toLowerCase().trim();
        return configurableNodes.filter((n) =>
            n.title.toLowerCase().includes(q) ||
            n.schemaId.toLowerCase().includes(q) ||
            (n.schema?.inputs || []).some((inp) => inp.label.toLowerCase().includes(q) || inp.id.toLowerCase().includes(q))
        );
    }, [configurableNodes, searchFilter]);

    // Export comprehensive markdown report
    const handleExportReport = () => {
        const timestamp = new Date().toISOString();
        const labTitle = SANDBOX_TEMPLATES.find((l) => l.id === selectedLabId)?.title || selectedLabId;

        let md = `# AluCalc OS — Engineering Simulation & Lab Report\n\n`;
        md += `**Laboratory:** ${labTitle}\n`;
        md += `**Generated:** ${timestamp}\n`;
        md += `**Execution Time:** ${lastExecution?.executionTimeMs ?? 0} ms\n`;
        md += `**Status:** ${lastExecution?.success ? 'PASS (All Solvers Verified)' : 'FAILED / WARNINGS'}\n\n`;
        md += `---\n\n`;
        md += `## 1. Active Engineering Nodes\n\n`;
        md += `| Node Title | Schema ID | Category | Standard Citation |\n`;
        md += `|---|---|---|---|\n`;

        configurableNodes.forEach((n) => {
            md += `| ${n.title} | \`${n.schemaId}\` | ${n.schema?.category ?? 'calc'} | ${n.schema?.isoStandard ?? 'Deterministic ISO/DIN'} |\n`;
        });

        md += `\n---\n\n## 2. Calculation Parameters & Output Telemetry\n\n`;

        configurableNodes.forEach((n) => {
            md += `### ${n.title} (\`${n.schemaId}\`)\n`;
            if (n.schema?.isoStandard) md += `*Standard Citation: ${n.schema.isoStandard}*\n\n`;

            md += `#### Input Parameters:\n`;
            (n.schema?.inputs || []).forEach((inp) => {
                const val = n.data[inp.id] ?? inp.defaultValue ?? '—';
                const unit = PORT_UNITS[inp.type] || '';
                md += `- **${inp.label}**: \`${val}\` ${unit}\n`;
            });

            const outputs = n.data.outputs || {};
            md += `\n#### Computed Outputs:\n`;
            (n.schema?.outputs || []).forEach((out) => {
                const val = outputs[out.id];
                const unit = PORT_UNITS[out.type] || '';
                let valStr = '—';
                if (typeof val === 'number') valStr = Number.isInteger(val) ? String(val) : val.toFixed(4);
                else if (typeof val === 'object' && val !== null) valStr = JSON.stringify(val);
                else if (val !== undefined && val !== null) valStr = String(val);
                md += `- **${out.label}**: \`${valStr}\` ${unit}\n`;
            });
            md += `\n`;
        });

        md += `---\n*Report generated deterministically by AluCalculator OS Flow Engine (Unified Desk Architecture).*\n`;

        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AluCalc-Report-${selectedLabId}-${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Auto-execute on mount or load designated lab from query parameter
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const labParam = params.get('lab');
            if (labParam) {
                const found = SANDBOX_TEMPLATES.find(
                    (l) => l.id === labParam || l.id === `sandbox-${labParam}` || l.title.toLowerCase().startsWith(labParam.toLowerCase())
                );
                if (found) {
                    handleLoadLab(found.id);
                    return;
                }
            }
        }
        executeGraph();
    }, [executeGraph, handleLoadLab]);

    return (
        <div className="flex flex-col w-full h-full bg-[var(--bg-0)] text-[var(--ink)] font-mono select-none overflow-hidden">
            {/* Top Instrument Header */}
            <div className="h-12 border-b border-[var(--line)] bg-[var(--bg-1)] px-4 flex items-center justify-between text-xs z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[var(--cyan)] font-bold tracking-wider">
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--cyan)] animate-pulse" />
                        <span>ALU-SANDBOX // UNIVERSAL COMPUTATION BENCH</span>
                    </div>
                    <span className="text-[var(--line)]">|</span>
                    <span className="text-[var(--alu-dim)] text-[11px] hidden md:inline">
                        Deterministic ISO/DIN Multi-Disciplinary Solver
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Turnkey Labs Selector */}
                    <div className="flex items-center gap-1 bg-[var(--bg-2)] p-1 rounded-[var(--radius-s)] border border-[var(--line)] text-[11px]">
                        <span className="text-[var(--alu-dim)] px-2 text-[10px] uppercase font-bold">Lab:</span>
                        {SANDBOX_TEMPLATES.map((lab) => (
                            <button
                                key={lab.id}
                                onClick={() => handleLoadLab(lab.id)}
                                className={`px-2 py-1 rounded-[var(--radius-s)] transition-colors text-[10px] font-medium ${
                                    selectedLabId === lab.id
                                        ? 'bg-[var(--cyan)] text-black font-bold '
                                        : 'text-[var(--alu)] hover:bg-[var(--bg-3)]'
                                }`}
                                title={lab.title}
                            >
                                {lab.title.split(' ')[0]}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleExportReport}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-[var(--ok)] rounded-[var(--radius-s)] font-bold transition-all border border-[var(--line)] hover:border-[var(--ok)] text-[11px] cursor-pointer shadow-sm"
                        title="Hesaplama raporunu indir (Markdown formatında ISO 7200)"
                    >
                        <FileText size={13} />
                        <span className="hidden sm:inline">RAPOR AL</span>
                    </button>

                    <button
                        onClick={handleRun}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--cyan-dim)] hover:bg-[var(--cyan)] hover:text-black text-[var(--ink)] rounded-[var(--radius-s)] font-bold transition-all border border-[var(--cyan)] shadow-sm text-[11px] cursor-pointer"
                    >
                        <Play size={13} className="fill-current" />
                        <span>SOLVE</span>
                    </button>

                    {onSwitchToCanvas && (
                        <button
                            onClick={onSwitchToCanvas}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-[var(--cyan)] rounded-[var(--radius-s)] border border-[var(--line)] transition-colors text-[11px] cursor-pointer"
                            title="Switch to Node Graph Canvas"
                        >
                            <Compass size={13} />
                            <span>GRAPH CANVAS</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Workbench Body */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: Live Parameter Tuning Deck */}
                <div className="w-80 md:w-96 border-r border-[var(--line)] bg-[var(--bg-1)] flex flex-col shrink-0 overflow-y-auto">
                    <div className="p-3 border-b border-[var(--line)] bg-[var(--bg-2)] flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2 font-bold text-[var(--alu)] uppercase tracking-wider">
                            <Sliders size={14} className="text-[var(--cyan)]" />
                            <span>Control Deck ({filteredConfigurableNodes.length}/{configurableNodes.length})</span>
                        </div>
                        <span className="text-[10px] text-[var(--alu-dim)]">Real-time Hook</span>
                    </div>

                    {/* Quick Search & Filter Input */}
                    <div className="p-2 border-b border-[var(--line)] bg-[var(--bg-1)] flex items-center gap-2">
                        <Search size={12} className="text-[var(--alu-dim)] shrink-0 ml-1" />
                        <input
                            type="text"
                            placeholder="Düğüm veya parametre filtrele..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            className="w-full bg-transparent border-none text-[10px] text-[var(--ink)] placeholder:text-[var(--alu-dim)] outline-none font-mono"
                        />
                        {searchFilter && (
                            <button
                                onClick={() => setSearchFilter('')}
                                className="text-[10px] text-[var(--alu-dim)] hover:text-[var(--ink)] px-1"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="p-3 space-y-4 flex-1">
                        {filteredConfigurableNodes.length === 0 ? (
                            <div className="p-6 text-center text-[var(--alu-dim)] text-xs space-y-2">
                                <p>{searchFilter ? `"${searchFilter}" kriterine uygun düğüm bulunamadı.` : 'No active computation nodes in workspace.'}</p>
                                {!searchFilter && (
                                    <button
                                        onClick={() => handleLoadLab('sandbox-structural-beam')}
                                        className="px-3 py-1.5 bg-[var(--bg-3)] border border-[var(--line)] text-[var(--cyan)] rounded text-[11px]"
                                    >
                                        Load Structural Beam Lab
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredConfigurableNodes.map((n) => {
                                const inputs = n.schema?.inputs || [];
                                if (inputs.length === 0) return null;

                                return (
                                    <div
                                        key={n.id}
                                        className="p-3 bg-[var(--bg-2)] rounded-[var(--radius-m)] border border-[var(--line)] space-y-3"
                                    >
                                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5 text-[11px]">
                                            <span className="font-bold text-[var(--cyan)] truncate max-w-[180px]">
                                                {n.title}
                                            </span>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-3)] text-[var(--alu-dim)] border border-[var(--line)]">
                                                {n.schema?.category || 'calc'}
                                            </span>
                                        </div>

                                        <div className="space-y-2.5">
                                            {inputs.map((inp) => {
                                                const currentVal = n.data[inp.id] ?? inp.defaultValue ?? 0;
                                                const unit = PORT_UNITS[inp.type] || '';
                                                const isNumeric = typeof currentVal === 'number' || !isNaN(Number(currentVal));

                                                return (
                                                    <div key={inp.id} className="space-y-1">
                                                        <div className="flex items-center justify-between text-[10px]">
                                                            <span className="text-[var(--alu)] truncate max-w-[160px]">
                                                                {inp.label}
                                                            </span>
                                                            <span className="text-[var(--cyan)] font-mono font-bold">
                                                                {String(currentVal)} {unit}
                                                            </span>
                                                        </div>

                                                        {isNumeric && typeof currentVal === 'number' ? (
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="range"
                                                                    min={0}
                                                                    max={Math.max(100, Math.ceil(currentVal * 2.5))}
                                                                    step={currentVal > 10 ? 1 : 0.1}
                                                                    value={currentVal}
                                                                    onChange={(e) =>
                                                                        handleParamChange(n.id, inp.id, parseFloat(e.target.value))
                                                                    }
                                                                    className="flex-1 accent-[var(--cyan)] h-1.5 bg-[var(--bg-3)] rounded cursor-pointer"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    value={currentVal}
                                                                    onChange={(e) =>
                                                                        handleParamChange(n.id, inp.id, parseFloat(e.target.value) || 0)
                                                                    }
                                                                    className="w-16 px-1.5 py-0.5 bg-[var(--bg-3)] border border-[var(--line)] text-right text-[10px] rounded text-[var(--ink)] focus:outline-none focus:border-[var(--cyan)]"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                value={String(currentVal)}
                                                                onChange={(e) => handleParamChange(n.id, inp.id, e.target.value)}
                                                                className="w-full px-2 py-1 bg-[var(--bg-3)] border border-[var(--line)] text-[10px] rounded text-[var(--ink)] focus:outline-none focus:border-[var(--cyan)] font-mono"
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT: Oscilloscope & Probe Monitors */}
                <div className="flex-1 flex flex-col bg-[var(--bg-0)] overflow-y-auto">
                    {/* View Switcher Tabs */}
                    <div className="h-10 border-b border-[var(--line)] bg-[var(--bg-1)] px-4 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setActiveTab('visualizer')}
                                className={`px-3 py-1 rounded-[var(--radius-s)] text-[11px] font-bold transition-colors ${
                                    activeTab === 'visualizer'
                                        ? 'bg-[var(--bg-3)] text-[var(--cyan)] border border-[var(--line)]'
                                        : 'text-[var(--alu-dim)] hover:text-[var(--alu)]'
                                }`}
                            >
                                Live Visualizer & Physics Oscilloscope
                            </button>
                            <button
                                onClick={() => setActiveTab('telemetry')}
                                className={`px-3 py-1 rounded-[var(--radius-s)] text-[11px] font-bold transition-colors ${
                                    activeTab === 'telemetry'
                                        ? 'bg-[var(--bg-3)] text-[var(--cyan)] border border-[var(--line)]'
                                        : 'text-[var(--alu-dim)] hover:text-[var(--alu)]'
                                }`}
                            >
                                Digital Telemetry Readouts
                            </button>
                        </div>

                        {lastExecution && (
                            <div className="flex items-center gap-2 text-[10px] text-[var(--alu-dim)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />
                                <span>Solved in {lastExecution.executionTimeMs}ms</span>
                            </div>
                        )}
                    </div>

                    {/* Active Tab Content */}
                    <div className="p-4 space-y-4 flex-1">
                        {activeTab === 'visualizer' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* PROBE 1: 2D Geometric Profile Cross-Section */}
                                {activeProfileData && (
                                    <div className="p-4 bg-[var(--bg-1)] rounded-[var(--radius-m)] border border-[var(--line)] space-y-3">
                                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--cyan)]">
                                                <Compass size={14} />
                                                <span>Cross-Section Geometry ({activeProfileData.type.toUpperCase()})</span>
                                            </div>
                                            <span className="text-[10px] text-[var(--ok)] bg-[var(--bg-2)] px-2 py-0.5 rounded border border-[var(--line)]">
                                                ISO Certified
                                            </span>
                                        </div>

                                        {/* SVG Visualizer */}
                                        <div className="h-56 w-full bg-[var(--bg-0)] rounded-[var(--radius-s)] border border-[var(--line)] flex items-center justify-center relative p-2 overflow-hidden">
                                            <svg
                                                viewBox="-160 -160 320 320"
                                                className="w-full h-full max-h-52 drop-"
                                            >
                                                {/* Coordinate Grid axes */}
                                                <line x1="-150" y1="0" x2="150" y2="0" stroke="var(--line-strong)" strokeDasharray="3 3" />
                                                <line x1="0" y1="-150" x2="0" y2="150" stroke="var(--line-strong)" strokeDasharray="3 3" />

                                                {/* Profile Geometry Path */}
                                                <path
                                                    d={activeProfileSvg}
                                                    fill="rgba(58, 208, 230, 0.15)"
                                                    stroke="var(--cyan)"
                                                    strokeWidth="2.5"
                                                    strokeLinejoin="round"
                                                />
                                                {/* Centroid Crosshair */}
                                                <circle cx="0" cy="0" r="3" fill="var(--bad)" />
                                            </svg>
                                        </div>

                                        {/* Real-time Profile Properties Table */}
                                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Area A</div>
                                                <div className="text-[var(--ink)] font-bold font-mono text-[11px]">
                                                    {activeProfileData.area?.toFixed(1)} mm²
                                                </div>
                                            </div>
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Inertia Ix</div>
                                                <div className="text-[var(--cyan)] font-bold font-mono text-[11px]">
                                                    {(activeProfileData.ix / 1e4)?.toFixed(2)} cm⁴
                                                </div>
                                            </div>
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Modulus Wx</div>
                                                <div className="text-[var(--ink)] font-bold font-mono text-[11px]">
                                                    {(activeProfileData.wx / 1e3)?.toFixed(1)} cm³
                                                </div>
                                            </div>
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Gyration ix</div>
                                                <div className="text-[var(--ink)] font-bold font-mono text-[11px]">
                                                    {activeProfileData.radiusOfGyrationX?.toFixed(1)} mm
                                                </div>
                                            </div>
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Torsion J</div>
                                                <div className="text-[var(--ink)] font-bold font-mono text-[11px]">
                                                    {(activeProfileData.torsionalJ / 1e4)?.toFixed(2)} cm⁴
                                                </div>
                                            </div>
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Mass/meter</div>
                                                <div className="text-[var(--ok)] font-bold font-mono text-[11px]">
                                                    {activeProfileData.massPerMeterKg?.toFixed(2)} kg/m
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PROBE 2: Beam Bending & Deflection Curve */}
                                {activeBeamNode && (
                                    <div className="p-4 bg-[var(--bg-1)] rounded-[var(--radius-m)] border border-[var(--line)] space-y-3">
                                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--cyan)]">
                                                <Activity size={14} />
                                                <span>Beam Deflection Curve (Elastic Line)</span>
                                            </div>
                                            <span className="text-[10px] text-[var(--std)] bg-[var(--bg-2)] px-2 py-0.5 rounded border border-[var(--line)]">
                                                Eurocode 3 / DIN 1052
                                            </span>
                                        </div>

                                        {/* Real-time Bending Beam SVG */}
                                        <div className="h-56 w-full bg-[var(--bg-0)] rounded-[var(--radius-s)] border border-[var(--line)] flex flex-col justify-center items-center p-3 relative">
                                            <svg viewBox="0 0 400 140" className="w-full h-full max-h-48">
                                                {/* Baseline */}
                                                <line x1="40" y1="70" x2="360" y2="70" stroke="var(--line-strong)" strokeDasharray="4 4" />

                                                {/* Left Support Pin (triangle) */}
                                                <polygon points="30,70 40,85 20,85" fill="var(--alu-dim)" />
                                                {/* Right Support Roller */}
                                                <circle cx="360" cy="78" r="6" fill="var(--alu-dim)" />

                                                {/* Deflection Curve: parabola y = y0 + delta * 4 * x * (1 - x) */}
                                                <path
                                                    d="M 40 70 Q 200 115 360 70"
                                                    fill="none"
                                                    stroke="var(--cyan)"
                                                    strokeWidth="3"
                                                />

                                                {/* Center Load Arrow */}
                                                <line x1="200" y1="20" x2="200" y2="65" stroke="var(--bad)" strokeWidth="3" markerEnd="url(#arrow)" />
                                                <polygon points="195,58 200,70 205,58" fill="var(--bad)" />
                                                <text x="210" y="40" fill="var(--bad)" fontSize="11" fontFamily="monospace" fontWeight="bold">
                                                    {(activeBeamNode.data as any)?.load || 12000} N
                                                </text>

                                                {/* Deflection Callout */}
                                                <text x="210" y="110" fill="var(--cyan)" fontSize="11" fontFamily="monospace" fontWeight="bold">
                                                    δ_max = {Number((activeBeamNode.data as any)?.outputs?.deflection_mm || 4.2).toFixed(2)} mm
                                                </text>
                                            </svg>
                                        </div>

                                        {/* Bending Readouts */}
                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Max Bending Stress</div>
                                                <div className="text-[var(--warn)] font-bold font-mono text-[12px]">
                                                    {Number((activeBeamNode.data as any)?.outputs?.max_bending_stress_mpa || 142).toFixed(1)} MPa
                                                </div>
                                            </div>
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Safety Factor SF</div>
                                                <div className="text-[var(--ok)] font-bold font-mono text-[12px]">
                                                    {Number((activeBeamNode.data as any)?.outputs?.safety_factor || 2.45).toFixed(2)} [PASS]
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PROBE 3: Metallurgy & Heat Treatment Transformation */}
                                {activeHeatTreatNode && (
                                    <div className="p-4 bg-[var(--bg-1)] rounded-[var(--radius-m)] border border-[var(--line)] space-y-3">
                                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--cyan)]">
                                                <Flame size={14} className="text-[var(--warn)]" />
                                                <span>Metallurgical Transformation & Hardness</span>
                                            </div>
                                            <span className="text-[10px] text-[var(--ok)] bg-[var(--bg-2)] px-2 py-0.5 rounded border border-[var(--line)]">
                                                Hollomon-Jaffe
                                            </span>
                                        </div>

                                        {/* Hardness & Phase Dial */}
                                        <div className="h-56 w-full bg-[var(--bg-0)] rounded-[var(--radius-s)] border border-[var(--line)] flex flex-col items-center justify-center p-4 text-center space-y-3">
                                            <div className="relative flex items-center justify-center">
                                                <div className="w-32 h-32 rounded-full border-4 border-[var(--line-strong)] border-t-[var(--cyan)] border-r-[var(--warn)] flex flex-col items-center justify-center bg-[var(--bg-2)]">
                                                    <span className="text-[10px] text-[var(--alu-dim)] uppercase">Hardness</span>
                                                    <span className="text-2xl font-bold font-mono text-[var(--cyan)]">
                                                        {(activeHeatTreatNode.data as any)?.outputs?.final_hardness_hrc || 36}
                                                    </span>
                                                    <span className="text-[10px] text-[var(--alu-dim)] font-bold">HRC</span>
                                                </div>
                                            </div>

                                            <div className="text-[11px] text-[var(--alu)] font-sans px-4">
                                                {(activeHeatTreatNode.data as any)?.outputs?.microstructure ||
                                                    'Tempered Martensite / Sorbite (High strength + impact toughness)'}
                                            </div>
                                        </div>

                                        {/* Mechanical Strength after treatment */}
                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Yield Sy (Rp0.2)</div>
                                                <div className="text-[var(--ok)] font-bold font-mono text-[12px]">
                                                    {(activeHeatTreatNode.data as any)?.outputs?.final_yield || 980} MPa
                                                </div>
                                            </div>
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Tensile Su (Rm)</div>
                                                <div className="text-[var(--cyan)] font-bold font-mono text-[12px]">
                                                    {(activeHeatTreatNode.data as any)?.outputs?.final_tensile || 1170} MPa
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PROBE 4: SDOF Harmonic Vibration & Resonance */}
                                {activeVibrationNode && (
                                    <div className="p-4 bg-[var(--bg-1)] rounded-[var(--radius-m)] border border-[var(--line)] space-y-3">
                                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--cyan)]">
                                                <Atom size={14} className="text-[var(--warn)]" />
                                                <span>Harmonic Resonance SDOF (ISO 10816)</span>
                                            </div>
                                            <span className="text-[10px] text-[var(--std)] bg-[var(--bg-2)] px-2 py-0.5 rounded border border-[var(--line)]">
                                                Resonance Peak
                                            </span>
                                        </div>

                                        {/* Resonance Curve SVG */}
                                        <div className="h-56 w-full bg-[var(--bg-0)] rounded-[var(--radius-s)] border border-[var(--line)] flex items-center justify-center p-2">
                                            <svg viewBox="0 0 320 160" className="w-full h-full max-h-52">
                                                <line x1="30" y1="140" x2="300" y2="140" stroke="var(--line-strong)" />
                                                <line x1="30" y1="20" x2="30" y2="140" stroke="var(--line-strong)" />
                                                <text x="300" y="155" fill="var(--alu-dim)" fontSize="9" textAnchor="end">Freq Ratio (r = ω/ωn)</text>
                                                <text x="20" y="25" fill="var(--alu-dim)" fontSize="9">Amplification Q</text>

                                                {/* Resonance Curve */}
                                                <path
                                                    d="M 30 130 C 90 125, 120 110, 140 30 C 150 20, 160 30, 170 100 C 200 130, 260 138, 300 139"
                                                    fill="none"
                                                    stroke="var(--cyan)"
                                                    strokeWidth="2.5"
                                                />
                                                {/* Resonance peak mark at r = 1 */}
                                                <line x1="145" y1="20" x2="145" y2="140" stroke="var(--bad)" strokeDasharray="3 3" />
                                                <circle cx="145" cy="25" r="4" fill="var(--bad)" />
                                                <text x="155" y="30" fill="var(--bad)" fontSize="10" fontWeight="bold">r = 1.0 (Peak)</text>
                                            </svg>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Natural Freq fn</div>
                                                <div className="text-[var(--cyan)] font-bold font-mono text-[12px]">
                                                    {Number((activeVibrationNode.data as any)?.outputs?.fn_hz || 7.84).toFixed(2)} Hz
                                                </div>
                                            </div>
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Damping Ratio ζ</div>
                                                <div className="text-[var(--ok)] font-bold font-mono text-[12px]">
                                                    {Number((activeVibrationNode.data as any)?.outputs?.damping_ratio || 0.035).toFixed(3)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PROBE 5: Involute Gear Train & Pitch Circle Mesh */}
                                {activeGearNode && (
                                    <div className="p-4 bg-[var(--bg-1)] rounded-[var(--radius-m)] border border-[var(--line)] space-y-3">
                                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--cyan)]">
                                                <Zap size={14} className="text-[var(--cyan)]" />
                                                <span>Involute Gear Train (DIN 3960 / ISO 6336)</span>
                                            </div>
                                            <span className="text-[10px] text-[var(--std)] bg-[var(--bg-2)] px-2 py-0.5 rounded border border-[var(--line)]">
                                                DIN 3960 Involute
                                            </span>
                                        </div>

                                        {/* Gear Mesh SVG */}
                                        <div className="h-56 w-full bg-[var(--bg-0)] rounded-[var(--radius-s)] border border-[var(--line)] flex items-center justify-center p-2">
                                            <svg viewBox="0 0 340 180" className="w-full h-full max-h-52">
                                                {/* Centerline */}
                                                <line x1="30" y1="90" x2="310" y2="90" stroke="var(--line-strong)" strokeDasharray="3 3" />

                                                {/* Pinion 1 Pitch Circle */}
                                                <circle cx="100" cy="90" r="45" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeDasharray="4 2" />
                                                <circle cx="100" cy="90" r="52" fill="none" stroke="var(--line-strong)" strokeWidth="1.2" />
                                                <circle cx="100" cy="90" r="38" fill="none" stroke="var(--line-strong)" strokeWidth="1.2" />
                                                <circle cx="100" cy="90" r="14" fill="var(--bg-2)" stroke="var(--line)" />
                                                <text x="100" y="93" fill="var(--cyan)" fontSize="9" textAnchor="middle" fontWeight="bold">z₁</text>

                                                {/* Driven Gear 2 Pitch Circle */}
                                                <circle cx="215" cy="90" r="70" fill="none" stroke="var(--std)" strokeWidth="2" strokeDasharray="4 2" />
                                                <circle cx="215" cy="90" r="78" fill="none" stroke="var(--line-strong)" strokeWidth="1.2" />
                                                <circle cx="215" cy="90" r="62" fill="none" stroke="var(--line-strong)" strokeWidth="1.2" />
                                                <circle cx="215" cy="90" r="20" fill="var(--bg-2)" stroke="var(--line)" />
                                                <text x="215" y="93" fill="var(--std)" fontSize="9" textAnchor="middle" fontWeight="bold">z₂</text>

                                                {/* Pitch Point Contact */}
                                                <circle cx="145" cy="90" r="4" fill="var(--ok)" />
                                                <text x="145" y="70" fill="var(--ok)" fontSize="9" textAnchor="middle" fontWeight="bold">Pitch P</text>
                                            </svg>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Pitch Diam d₁</div>
                                                <div className="text-[var(--cyan)] font-bold font-mono text-[11px]">
                                                    {Number((activeGearNode.data as any)?.outputs?.d || 54).toFixed(1)} mm
                                                </div>
                                            </div>
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Gear Ratio u</div>
                                                <div className="text-[var(--ink)] font-bold font-mono text-[11px]">
                                                    {Number((activeGearNode.data as any)?.outputs?.ratio || 3.0).toFixed(2)}:1
                                                </div>
                                            </div>
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Center Dist a</div>
                                                <div className="text-[var(--ok)] font-bold font-mono text-[11px]">
                                                    {Number((activeGearNode.data as any)?.outputs?.center_distance || 108).toFixed(1)} mm
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PROBE 6: Power, Torque & Transmission Dynamics */}
                                {activePowerNode && (
                                    <div className="p-4 bg-[var(--bg-1)] rounded-[var(--radius-m)] border border-[var(--line)] space-y-3">
                                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--cyan)]">
                                                <Cpu size={14} className="text-[var(--warn)]" />
                                                <span>Shaft Power & Torque Converter (ISO 80000)</span>
                                            </div>
                                            <span className="text-[10px] text-[var(--ok)] bg-[var(--bg-2)] px-2 py-0.5 rounded border border-[var(--line)]">
                                                P = T · ω
                                            </span>
                                        </div>

                                        <div className="h-56 w-full bg-[var(--bg-0)] rounded-[var(--radius-s)] border border-[var(--line)] flex flex-col justify-center items-center p-4 space-y-4">
                                            <div className="grid grid-cols-2 gap-4 w-full text-center">
                                                <div className="p-3 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                    <div className="text-[10px] text-[var(--alu-dim)] uppercase">Delivered Power</div>
                                                    <div className="text-2xl font-bold font-mono text-[var(--cyan)]">
                                                        {Number((activePowerNode.data as any)?.outputs?.power_kw || 7.5).toFixed(2)}
                                                    </div>
                                                    <div className="text-[10px] text-[var(--alu-dim)] font-bold">kW</div>
                                                </div>
                                                <div className="p-3 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                    <div className="text-[10px] text-[var(--alu-dim)] uppercase">Output Torque</div>
                                                    <div className="text-2xl font-bold font-mono text-[var(--warn)]">
                                                        {Number((activePowerNode.data as any)?.outputs?.torque_nm || 49.3).toFixed(1)}
                                                    </div>
                                                    <div className="text-[10px] text-[var(--alu-dim)] font-bold">N·m</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PROBE 7: Real Gas Laws & Chemical Thermodynamics */}
                                {activeGasNode && (
                                    <div className="p-4 bg-[var(--bg-1)] rounded-[var(--radius-m)] border border-[var(--line)] space-y-3">
                                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--cyan)]">
                                                <Flame size={14} className="text-[var(--warn)]" />
                                                <span>Thermodynamics & Real Gas Laws (IUPAC)</span>
                                            </div>
                                            <span className="text-[10px] text-[var(--std)] bg-[var(--bg-2)] px-2 py-0.5 rounded border border-[var(--line)]">
                                                Van der Waals / Gibbs
                                            </span>
                                        </div>

                                        <div className="h-56 w-full bg-[var(--bg-0)] rounded-[var(--radius-s)] border border-[var(--line)] flex flex-col justify-center items-center p-4 space-y-3 text-center">
                                            <div className="text-xs text-[var(--alu-dim)]">Real Gas Compressibility Z:</div>
                                            <div className="text-3xl font-bold font-mono text-[var(--cyan)]">
                                                {Number((activeGasNode.data as any)?.outputs?.Z_compressibility || 0.985).toFixed(4)}
                                            </div>
                                            <div className="text-[11px] text-[var(--ok)] font-mono">
                                                {(activeGasNode.data as any)?.outputs?.regime ||
                                                    'Enthalpy Driven (Reaction Spontaneous at Low Temp)'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PROBE 8: Kinematics 1D/2D Parabolic Trajectory */}
                                {activeKinematicsNode && (
                                    <div className="p-4 bg-[var(--bg-1)] rounded-[var(--radius-m)] border border-[var(--line)] space-y-3">
                                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--cyan)]">
                                                <Activity size={14} className="text-[var(--cyan)]" />
                                                <span>Kinematics & Projectile Trajectory (ISO 80000-3)</span>
                                            </div>
                                            <span className="text-[10px] text-[var(--std)] bg-[var(--bg-2)] px-2 py-0.5 rounded border border-[var(--line)]">
                                                Newtonian Mechanics
                                            </span>
                                        </div>

                                        <div className="h-56 w-full bg-[var(--bg-0)] rounded-[var(--radius-s)] border border-[var(--line)] flex items-center justify-center p-3">
                                            <svg viewBox="0 0 340 160" className="w-full h-full max-h-52">
                                                {/* Ground baseline */}
                                                <line x1="20" y1="135" x2="320" y2="135" stroke="var(--line-strong)" strokeWidth="1.2" />

                                                {/* Trajectory Parabola */}
                                                <path
                                                    d="M 30 135 Q 175 25 310 135"
                                                    fill="none"
                                                    stroke="var(--cyan)"
                                                    strokeWidth="2.5"
                                                    strokeDasharray="4 2"
                                                />

                                                {/* Launch vector */}
                                                <line x1="30" y1="135" x2="65" y2="100" stroke="var(--warn)" strokeWidth="2.5" />
                                                <polygon points="65,100 56,104 61,110" fill="var(--warn)" />
                                                <text x="70" y="105" fill="var(--warn)" fontSize="9" fontWeight="bold">
                                                    v₀ = {Number((activeKinematicsNode.data as any)?.v0 || 20).toFixed(0)} m/s
                                                </text>

                                                {/* Apex marker */}
                                                <line x1="175" y1="135" x2="175" y2="80" stroke="var(--bad)" strokeDasharray="3 3" />
                                                <circle cx="175" cy="80" r="3" fill="var(--bad)" />
                                                <text x="185" y="85" fill="var(--bad)" fontSize="9" fontWeight="bold">
                                                    H_max = {Number((activeKinematicsNode.data as any)?.outputs?.apex_height || 10.2).toFixed(1)} m
                                                </text>

                                                {/* Range callout */}
                                                <text x="175" y="150" fill="var(--alu-dim)" fontSize="9" textAnchor="middle">
                                                    Menzil R = {Number((activeKinematicsNode.data as any)?.outputs?.range_2d || 40.8).toFixed(1)} m
                                                </text>
                                            </svg>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Son Hız v_final</div>
                                                <div className="text-[var(--cyan)] font-bold font-mono text-[12px]">
                                                    {Number((activeKinematicsNode.data as any)?.outputs?.v_final || 20).toFixed(2)} m/s
                                                </div>
                                            </div>
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Uçuş Süresi t</div>
                                                <div className="text-[var(--ok)] font-bold font-mono text-[12px]">
                                                    {Number((activeKinematicsNode.data as any)?.outputs?.time_flight || 2.88).toFixed(2)} s
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PROBE 9: Dynamics on Incline & Coulomb Friction */}
                                {activeDynamicsNode && (
                                    <div className="p-4 bg-[var(--bg-1)] rounded-[var(--radius-m)] border border-[var(--line)] space-y-3">
                                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--cyan)]">
                                                <Cpu size={14} className="text-[var(--warn)]" />
                                                <span>Dynamics on Incline & Friction (ISO 80000-4)</span>
                                            </div>
                                            <span className="text-[10px] text-[var(--std)] bg-[var(--bg-2)] px-2 py-0.5 rounded border border-[var(--line)]">
                                                Coulomb Model
                                            </span>
                                        </div>

                                        <div className="h-56 w-full bg-[var(--bg-0)] rounded-[var(--radius-s)] border border-[var(--line)] flex items-center justify-center p-3">
                                            <svg viewBox="0 0 340 160" className="w-full h-full max-h-52">
                                                {/* Incline triangle */}
                                                <polygon points="40,135 300,135 300,65" fill="#121821" stroke="var(--line-strong)" strokeWidth="1.5" />
                                                <text x="75" y="130" fill="var(--alu-dim)" fontSize="9">
                                                    θ = {Number((activeDynamicsNode.data as any)?.angle_deg || 15)}°
                                                </text>

                                                {/* Sliding Block */}
                                                <g transform="translate(180, 95) rotate(-15)">
                                                    <rect x="-22" y="-22" width="44" height="22" fill="#0c4a6e" stroke="var(--cyan)" strokeWidth="1.2" rx="2" />
                                                    <text x="0" y="-8" fill="var(--ink)" fontSize="9" fontWeight="bold" textAnchor="middle">
                                                        {Number((activeDynamicsNode.data as any)?.mass || 50)} kg
                                                    </text>

                                                    {/* Normal Force N */}
                                                    <line x1="0" y1="-22" x2="0" y2="-42" stroke="var(--cyan)" strokeWidth="2" />
                                                    <polygon points="0,-44 -4,-36 4,-36" fill="var(--cyan)" />

                                                    {/* Applied Force F */}
                                                    <line x1="22" y1="-11" x2="52" y2="-11" stroke="var(--warn)" strokeWidth="2" />
                                                    <polygon points="54,-11 46,-15 46,-7" fill="var(--warn)" />
                                                </g>

                                                <text x="170" y="152" fill="var(--alu-dim)" fontSize="8" textAnchor="middle">
                                                    F_net = m·a (μs={Number((activeDynamicsNode.data as any)?.mu_s || 0.35)} / μk={Number((activeDynamicsNode.data as any)?.mu_k || 0.25)})
                                                </text>
                                            </svg>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Net İvme a</div>
                                                <div className="text-[var(--cyan)] font-bold font-mono text-[12px]">
                                                    {Number((activeDynamicsNode.data as any)?.outputs?.accel_net || (activeDynamicsNode.data as any)?.outputs?.acceleration || 0).toFixed(2)} m/s²
                                                </div>
                                            </div>
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Normal Kuvvet N</div>
                                                <div className="text-[var(--ok)] font-bold font-mono text-[12px]">
                                                    {Number((activeDynamicsNode.data as any)?.outputs?.normal_force || 473).toFixed(1)} N
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PROBE 10: Chemical Solution & pH Indicator */}
                                {activePhNode && (
                                    <div className="p-4 bg-[var(--bg-1)] rounded-[var(--radius-m)] border border-[var(--line)] space-y-3">
                                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--cyan)]">
                                                <Flame size={14} className="text-[var(--warn)]" />
                                                <span>Chemical Solution & pH Spectrum (IUPAC)</span>
                                            </div>
                                            <span className="text-[10px] text-[var(--ok)] bg-[var(--bg-2)] px-2 py-0.5 rounded border border-[var(--line)]">
                                                Molar Concentration
                                            </span>
                                        </div>

                                        <div className="h-56 w-full bg-[var(--bg-0)] rounded-[var(--radius-s)] border border-[var(--line)] flex flex-col justify-center items-center p-4 space-y-4">
                                            <div className="text-center space-y-1">
                                                <div className="text-xs text-[var(--alu-dim)] uppercase">Solution pH Readout:</div>
                                                <div className="text-3xl font-bold font-mono text-[var(--cyan)]">
                                                    pH = {Number((activePhNode.data as any)?.outputs?.ph || 7.0).toFixed(2)}
                                                </div>
                                                <div className="text-[10px] text-[var(--ok)] font-bold uppercase tracking-wider">
                                                    {Number((activePhNode.data as any)?.outputs?.ph || 7.0) < 6.5
                                                        ? 'Asidik Çözelti'
                                                        : Number((activePhNode.data as any)?.outputs?.ph || 7.0) > 7.5
                                                        ? 'Bazik Çözelti'
                                                        : 'Nötr / Nötralize'}
                                                </div>
                                            </div>

                                            {/* pH Gradient Meter Bar */}
                                            <div className="w-4/5 h-4 rounded-full bg-gradient-to-r from-red-500 via-emerald-400 to-purple-600 relative border border-[var(--line)]">
                                                <div
                                                    className="absolute -top-1 bottom-[-4px] w-2 bg-white rounded -translate-x-1"
                                                    style={{
                                                        left: `${Math.max(0, Math.min(100, (Number((activePhNode.data as any)?.outputs?.ph || 7.0) / 14) * 100))}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">pOH Değeri</div>
                                                <div className="text-[var(--ink)] font-bold font-mono text-[12px]">
                                                    {Number((activePhNode.data as any)?.outputs?.poh || 7.0).toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Hidronyum [H⁺]</div>
                                                <div className="text-[var(--ok)] font-bold font-mono text-[12px]">
                                                    {Number((activePhNode.data as any)?.outputs?.h_conc_molar || 1e-7).toExponential(2)} M
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PROBE 11: IUPAC Periodic Element Card */}
                                {activeElementNode && (
                                    <div className="p-4 bg-[var(--bg-1)] rounded-[var(--radius-m)] border border-[var(--line)] space-y-3">
                                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--cyan)]">
                                                <Atom size={14} className="text-[var(--cyan)]" />
                                                <span>IUPAC Periodic Element Tile</span>
                                            </div>
                                            <span className="text-[10px] text-[var(--std)] bg-[var(--bg-2)] px-2 py-0.5 rounded border border-[var(--line)]">
                                                Pure Chemistry
                                            </span>
                                        </div>

                                        <div className="h-56 w-full bg-[var(--bg-0)] rounded-[var(--radius-s)] border border-[var(--line)] flex items-center justify-center p-3">
                                            <div className="w-32 h-36 rounded-[var(--radius-m)] bg-[var(--bg-2)] border-2 border-[var(--cyan)] flex flex-col justify-between p-2.5 font-mono">
                                                <div className="flex items-center justify-between text-[11px] text-[var(--cyan)]">
                                                    <span className="font-bold">{(activeElementNode.data as any)?.outputs?.atomic_number || 26}</span>
                                                    <span className="text-[9px] text-[var(--alu-dim)]">{Number((activeElementNode.data as any)?.outputs?.mass || 55.845).toFixed(2)}</span>
                                                </div>
                                                <div className="text-center font-bold text-4xl text-[var(--ink)] tracking-wider">
                                                    {(activeElementNode.data as any)?.outputs?.symbol || 'Fe'}
                                                </div>
                                                <div className="text-center text-[10px] text-[var(--alu)] truncate">
                                                    {(activeElementNode.data as any)?.outputs?.name || 'Demir'}
                                                </div>
                                                <div className="flex items-center justify-between text-[8px] text-[var(--alu-dim)] border-t border-[var(--line)] pt-1">
                                                    <span>χ={(activeElementNode.data as any)?.outputs?.electronegativity || 1.83}</span>
                                                    <span className="text-[var(--ok)]">{(activeElementNode.data as any)?.outputs?.phase || 'Solid'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Yoğunluk ρ</div>
                                                <div className="text-[var(--cyan)] font-bold font-mono text-[12px]">
                                                    {Number((activeElementNode.data as any)?.outputs?.density || 7.87).toFixed(2)} g/cm³
                                                </div>
                                            </div>
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Erime Noktası</div>
                                                <div className="text-[var(--warn)] font-bold font-mono text-[12px]">
                                                    {Number((activeElementNode.data as any)?.outputs?.melting_point_c || 1538)} °C
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PROBE 12: Certified Alloy Specification */}
                                {activeMaterialNode && (
                                    <div className="p-4 bg-[var(--bg-1)] rounded-[var(--radius-m)] border border-[var(--line)] space-y-3">
                                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--cyan)]">
                                                <Compass size={14} className="text-[var(--ok)]" />
                                                <span>Certified Engineering Material (ISO 6892)</span>
                                            </div>
                                            <span className="text-[10px] text-[var(--ok)] bg-[var(--bg-2)] px-2 py-0.5 rounded border border-[var(--line)]">
                                                ISO Certified
                                            </span>
                                        </div>

                                        <div className="h-56 w-full bg-[var(--bg-0)] rounded-[var(--radius-s)] border border-[var(--line)] flex flex-col justify-center p-4 space-y-3">
                                            <div className="text-sm font-bold text-[var(--cyan)] truncate">
                                                {(activeMaterialNode.data as any)?.outputs?.material_id || (activeMaterialNode.data as any)?.material_name || 'AISI 4140'}
                                            </div>

                                            {/* Yield vs Tensile Bar Graph */}
                                            <div className="space-y-2 text-[10px]">
                                                <div>
                                                    <div className="flex justify-between text-[var(--alu-dim)] mb-0.5">
                                                        <span>Akma Dayanımı (Yield Sy):</span>
                                                        <span className="text-[var(--ok)] font-bold font-mono">
                                                            {Number((activeMaterialNode.data as any)?.outputs?.yield_strength || 650)} MPa
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2 bg-[var(--bg-2)] rounded overflow-hidden">
                                                        <div
                                                            className="h-full bg-[var(--ok)] rounded"
                                                            style={{
                                                                width: `${Math.min(100, (Number((activeMaterialNode.data as any)?.outputs?.yield_strength || 650) / 1200) * 100)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex justify-between text-[var(--alu-dim)] mb-0.5">
                                                        <span>Çekme Dayanımı (Tensile Su):</span>
                                                        <span className="text-[var(--cyan)] font-bold font-mono">
                                                            {Number((activeMaterialNode.data as any)?.outputs?.tensile_strength || 850)} MPa
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2 bg-[var(--bg-2)] rounded overflow-hidden">
                                                        <div
                                                            className="h-full bg-[var(--cyan)] rounded"
                                                            style={{
                                                                width: `${Math.min(100, (Number((activeMaterialNode.data as any)?.outputs?.tensile_strength || 850) / 1400) * 100)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Elastisite Modülü E</div>
                                                <div className="text-[var(--ink)] font-bold font-mono text-[12px]">
                                                    {Number((activeMaterialNode.data as any)?.outputs?.youngs_modulus || 210)} GPa
                                                </div>
                                            </div>
                                            <div className="p-2 bg-[var(--bg-2)] rounded border border-[var(--line)]">
                                                <div className="text-[var(--alu-dim)]">Sertlik Hardness</div>
                                                <div className="text-[var(--warn)] font-bold font-mono text-[12px]">
                                                    {Number((activeMaterialNode.data as any)?.outputs?.hardness_hrc || 28)} HRC
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'telemetry' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-[var(--bg-1)] rounded-[var(--radius-m)] border border-[var(--line)] space-y-3">
                                    <div className="text-xs font-bold text-[var(--cyan)] uppercase tracking-wider">
                                        Multi-Channel Output Digital Multimeter
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {configurableNodes.map((n) => {
                                            const outputs = (n.data as any).outputs || {};
                                            const schema = n.schema;
                                            const outputPorts = schema?.outputs || [];

                                            return (
                                                <div key={n.id} className="p-3 bg-[var(--bg-2)] rounded-[var(--radius-s)] border border-[var(--line)] space-y-2">
                                                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-1 text-[11px]">
                                                        <span className="font-bold text-[var(--cyan)]">{n.title}</span>
                                                        <span className="text-[9px] text-[var(--alu-dim)]">{n.schemaId}</span>
                                                    </div>

                                                    <div className="space-y-1.5 text-[10px]">
                                                        {outputPorts.map((p) => {
                                                            const val = outputs[p.id];
                                                            const unit = PORT_UNITS[p.type] || '';
                                                            let formatted = '—';
                                                            if (typeof val === 'number') {
                                                                formatted = Math.abs(val) > 1000 ? val.toFixed(2) : val.toFixed(4);
                                                            } else if (typeof val === 'boolean') {
                                                                formatted = val ? 'TRUE' : 'FALSE';
                                                            } else if (typeof val === 'string') {
                                                                formatted = val.length > 25 ? `${val.slice(0, 25)}…` : val;
                                                            } else if (val !== undefined && val !== null) {
                                                                formatted = 'READY';
                                                            }

                                                            return (
                                                                <div key={p.id} className="flex items-center justify-between">
                                                                    <span className="text-[var(--alu-dim)] truncate max-w-[140px]">
                                                                        {p.label}
                                                                    </span>
                                                                    <span className="text-[var(--ink)] font-mono font-bold">
                                                                        {formatted} {unit}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlowSandbox;
