"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
    Activity, Layers, Shield, Play, Plus, Trash2, 
    Maximize2, Zap, Settings, Info, Download, 
    MousePointer2, PlusCircle, Anchor, TrendingUp, Thermometer,
    Cpu
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
interface Node {
    id: string;
    x: number;
    y: number;
    fixedX: boolean;
    fixedY: boolean;
    fx: number;
    fy: number;
}

interface Member {
    id: string;
    node1Id: string;
    node2Id: string;
    area: number; // mm2
    modulus: number; // GPa
}

// --- FEA SOLVER (Optimized Static Kernel) ---
const solveTruss = (nodes: Node[], members: Member[]) => {
    const n = nodes.length;
    if (n < 2 || members.length < 1) return null;

    const K = Array.from({ length: 2 * n }, () => new Array(2 * n).fill(0));
    const F = new Array(2 * n).fill(0);
    const idMap = new Map(nodes.map((node, i) => [node.id, i]));
    
    members.forEach(m => {
        const i1 = idMap.get(m.node1Id)!;
        const i2 = idMap.get(m.node2Id)!;
        if (i1 === undefined || i2 === undefined) return;

        const n1 = nodes[i1];
        const n2 = nodes[i2];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const L = Math.sqrt(dx*dx + dy*dy);
        if (L < 1) return;
        
        const c = dx / L;
        const s = dy / L;
        const kValue = (m.area * m.modulus * 1000) / L; // Consistent units N/mm
        
        const indices = [2*i1, 2*i1+1, 2*i2, 2*i2+1];
        const ke = [
            [c*c, c*s, -c*c, -c*s],
            [c*s, s*s, -c*s, -s*s],
            [-c*c, -c*s, c*c, c*s],
            [-c*s, -s*s, c*s, s*s]
        ];
        
        for (let r=0; r<4; r++) {
            for (let col=0; col<4; col++) {
                K[indices[r]][indices[col]] += kValue * ke[r][col];
            }
        }
    });
    
    nodes.forEach((node, i) => {
        F[2*i] = node.fx;
        F[2*i+1] = node.fy;
    });
    
    const activeDofs: number[] = [];
    nodes.forEach((node, i) => {
        if (!node.fixedX) activeDofs.push(2*i);
        if (!node.fixedY) activeDofs.push(2*i + 1);
    });
    
    if (activeDofs.length === 0) return null;
    
    const K_red = activeDofs.map(r => activeDofs.map(c => K[r][c]));
    const F_red = activeDofs.map(r => F[r]);
    
    const gaussianSolve = (A: number[][], b: number[]) => {
        const dim = b.length;
        for (let i = 0; i < dim; i++) {
            let max = i;
            for (let j = i + 1; j < dim; j++) if (Math.abs(A[j][i]) > Math.abs(A[max][i])) max = j;
            [A[i], A[max]] = [A[max], A[i]];
            [b[i], b[max]] = [b[max], b[i]];
            if (Math.abs(A[i][i]) < 1e-18) throw new Error("Singular matrix");
            for (let j = i + 1; j < dim; j++) {
                const f = A[j][i] / A[i][i];
                b[j] -= f * b[i];
                for (let k = i; k < dim; k++) A[j][k] -= f * A[i][k];
            }
        }
        const x = new Array(dim).fill(0);
        for (let i = dim - 1; i >= 0; i--) {
            let s = 0;
            for (let j = i + 1; j < dim; j++) s += A[i][j] * x[j];
            x[i] = (b[i] - s) / A[i][i];
        }
        return x;
    };
    
    try {
        const u_red = gaussianSolve(K_red, F_red);
        const U = new Array(2 * n).fill(0);
        activeDofs.forEach((dof, i) => U[dof] = u_red[i]);
        
        const memberResults = members.map(m => {
            const i1 = idMap.get(m.node1Id)!;
            const i2 = idMap.get(m.node2Id)!;
            const u1 = [U[2*i1], U[2*i1+1]];
            const u2 = [U[2*i2], U[2*i2+1]];
            const dx = nodes[i2].x - nodes[i1].x;
            const dy = nodes[i2].y - nodes[i1].y;
            const L = Math.sqrt(dx*dx + dy*dy);
            const c = dx / L;
            const s = dy / L;
            const strain = (1/L) * ((u2[0]-u1[0])*c + (u2[1]-u1[1])*s);
            const stress = strain * m.modulus * 1000; // MPa
            const force = stress * m.area; // N
            return { stress, force, strain };
        });
        
        return { U, memberResults };
    } catch (e) {
        return null;
    }
};

export function SimulationFEAModule() {
    const [nodes, setNodes] = useState<Node[]>([
        { id: 'n1', x: 200, y: 450, fixedX: true, fixedY: true, fx: 0, fy: 0 },
        { id: 'n2', x: 600, y: 450, fixedX: true, fixedY: true, fx: 0, fy: 0 },
        { id: 'n3', x: 400, y: 200, fixedX: false, fixedY: false, fx: 0, fy: 20000 }
    ]);
    const [members, setMembers] = useState<Member[]>([
        { id: 'm1', node1Id: 'n1', node2Id: 'n3', area: 500, modulus: 210 },
        { id: 'm2', node1Id: 'n2', node2Id: 'n3', area: 500, modulus: 210 }
    ]);
    
    const [selection, setSelection] = useState<{ type: 'node' | 'member', id: string } | null>(null);
    const [mode, setMode] = useState<'select' | 'node' | 'member'>('select');
    const [scale, setScale] = useState(500); 
    
    const results = useMemo(() => solveTruss(nodes, members), [nodes, members]);
    const containerRef = useRef<SVGSVGElement>(null);
    
    const handleCanvasClick = (e: React.MouseEvent) => {
        if (mode !== 'node') return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setNodes([...nodes, { id: `n${nodes.length + 1}-${Date.now()}`, x, y, fixedX: false, fixedY: false, fx: 0, fy: 0 }]);
    };

    const handleNodeClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (mode === 'member' && selection?.type === 'node' && selection.id !== id) {
            setMembers([...members, { id: `m${members.length + 1}-${Date.now()}`, node1Id: selection.id, node2Id: id, area: 500, modulus: 210 }]);
            setSelection(null);
        } else {
            setSelection({ type: 'node', id });
        }
    };

    return (
        <div className="flex w-full h-full bg-[#03060a] text-white overflow-hidden relative selection:bg-blue-500/30">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />

            {/* Config Sidebar */}
            <div className="w-[340px] bg-[#05080f]/95 backdrop-blur-2xl border-r border-white/5 flex flex-col z-20 shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-blue-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">FEA Resolve</h1>
                            <p className="text-[10px] text-blue-500/60 font-mono tracking-widest uppercase mt-1">Stiffness Kernel v4.2</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    <div className="grid grid-cols-3 gap-2">
                        <ToolBtn active={mode === 'select'} onClick={() => setMode('select')} icon={<MousePointer2 size={16}/>} label="Select" />
                        <ToolBtn active={mode === 'node'} onClick={() => setMode('node')} icon={<PlusCircle size={16}/>} label="Node" />
                        <ToolBtn active={mode === 'member'} onClick={() => setMode('member')} icon={<Zap size={16}/>} label="Truss" />
                    </div>

                    <AnimatePresence mode="wait">
                        {selection ? (
                            <motion.div key={selection.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 mb-2">
                                    <span>Element Inspector</span>
                                    <button onClick={() => {
                                        if (selection.type === 'node') {
                                            setNodes(nodes.filter(n => n.id !== selection.id));
                                            setMembers(members.filter(m => m.node1Id !== selection.id && m.node2Id !== selection.id));
                                        } else {
                                            setMembers(members.filter(m => m.id !== selection.id));
                                        }
                                        setSelection(null);
                                    }} className="text-red-500 hover:scale-110 transition-transform"><Trash2 size={14}/></button>
                                </div>
                                {selection.type === 'node' ? (
                                    <NodeInspector node={nodes.find(n => n.id === selection.id)!} onUpdate={(u) => setNodes(nodes.map(n => n.id === selection.id ? {...n, ...u} : n))} />
                                ) : (
                                    <MemberInspector member={members.find(m => m.id === selection.id)!} onUpdate={(u) => setMembers(members.map(m => m.id === selection.id ? {...m, ...u} : m))} />
                                )}
                            </motion.div>
                        ) : (
                            <div className="h-32 flex flex-col items-center justify-center text-slate-700 bg-white/[0.02] border border-dashed border-white/5 rounded-[2rem]">
                                <span className="text-[10px] uppercase font-black tracking-widest">Select topology</span>
                            </div>
                        )}
                    </AnimatePresence>

                    <div className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-4">
                         <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex justify-between">
                            <span>Visualization</span>
                            <span className={results ? 'text-emerald-400' : 'text-red-400'}>{results ? 'SOLVED' : 'UNSTABLE'}</span>
                         </div>
                         <ParameterInput label="Disp. Scale" unit="x" value={scale} min={1} max={5000} step={10} onChange={setScale} icon={<Maximize2 size={12}/>} />
                    </div>
                </div>
            </div>

            {/* Main Viewport */}
            <div className="flex-1 flex flex-col p-8 lg:p-12 gap-8 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 blur-[200px] rounded-full pointer-events-none" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <ValueCard label="Critical Stress" value={results ? Math.max(...results.memberResults.map(r => Math.abs(r.stress))).toFixed(1) : '0.0'} unit="MPa" color="#f87171" icon={<Thermometer size={14}/>}/>
                    <ValueCard label="Max Displacement" value={results ? (Math.max(...results.U.map(Math.abs))).toFixed(3) : '0.000'} unit="px" color="#3b82f6" icon={<Activity size={14}/>}/>
                    <ValueCard label="Degrees of Freedom" value={String(nodes.length * 2)} unit="DOF" color="#94a3b8" icon={<Cpu size={14}/>}/>
                </div>

                <div className="flex-1 bg-black/60 border border-white/10 rounded-[4rem] relative overflow-hidden backdrop-blur-xl shadow-2xl">
                    <svg ref={containerRef} className="w-full h-full cursor-crosshair" onClick={handleCanvasClick}>
                        <defs>
                            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f87171" />
                            </marker>
                        </defs>

                        {members.map((m, i) => {
                            const n1 = nodes.find(n => n.id === m.node1Id);
                            const n2 = nodes.find(n => n.id === m.node2Id);
                            if (!n1 || !n2) return null;
                            const res = results?.memberResults[i];
                            const d1 = results ? [results.U[nodes.indexOf(n1)*2]*scale, results.U[nodes.indexOf(n1)*2+1]*scale] : [0,0];
                            const d2 = results ? [results.U[nodes.indexOf(n2)*2]*scale, results.U[nodes.indexOf(n2)*2+1]*scale] : [0,0];
                            const color = res ? (res.stress > 5 ? '#f87171' : res.stress < -5 ? '#3b82f6' : '#475569') : '#334155';

                            return (
                                <g key={m.id} onClick={(e) => { e.stopPropagation(); setSelection({ type: 'member', id: m.id }); }}>
                                    <line x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} stroke="white" strokeWidth="1" strokeOpacity="0.05" strokeDasharray="4 4" />
                                    <motion.line 
                                        animate={{ x1: n1.x + d1[0], y1: n1.y + d1[1], x2: n2.x + d2[0], y2: n2.y + d2[1] }}
                                        stroke={selection?.id === m.id ? '#fff' : color} 
                                        strokeWidth={selection?.id === m.id ? "4" : "3"} 
                                        className="cursor-pointer transition-all duration-300"
                                    />
                                </g>
                            );
                        })}

                        {nodes.map((n, i) => {
                            const dx = results ? results.U[i*2]*scale : 0;
                            const dy = results ? results.U[i*2+1]*scale : 0;
                            
                            return (
                                <g key={n.id} onClick={(e) => handleNodeClick(n.id, e)} className="cursor-pointer">
                                    <motion.circle 
                                        animate={{ cx: n.x + dx, cy: n.y + dy }} 
                                        r={selection?.id === n.id ? 7 : 5} 
                                        fill={n.fixedX || n.fixedY ? '#10b981' : (selection?.id === n.id ? '#fff' : '#94a3b8')} 
                                    />
                                    {n.fixedX && <rect x={n.x + dx - 10} y={n.y + dy + 8} width="20" height="2" fill="#10b981" opacity="0.5" />}
                                    {n.fy !== 0 && <line x1={n.x+dx} y1={n.y+dy-40} x2={n.x+dx} y2={n.y+dy-8} stroke="#f87171" strokeWidth="2" markerEnd="url(#arrow)" />}
                                </g>
                            );
                        })}
                    </svg>
                    <div className="absolute bottom-8 left-12 text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Integrated Topology Visualizer</div>
                </div>
            </div>
        </div>
    );
}

function ToolBtn({ active, onClick, icon, label }: any) {
    return (
        <button onClick={onClick} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${active ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-xl' : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-white'}`}>
            {icon}
            <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}

function NodeInspector({ node, onUpdate }: any) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onUpdate({ fixedX: !node.fixedX })} className={`py-2 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${node.fixedX ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>Fix X</button>
                <button onClick={() => onUpdate({ fixedY: !node.fixedY })} className={`py-2 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${node.fixedY ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>Fix Y</button>
            </div>
            <div className="space-y-2">
                <div className="text-[8px] text-slate-600 uppercase font-black">Force Vector (N)</div>
                <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={node.fx} onChange={(e) => onUpdate({ fx: Number(e.target.value) })} className="bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-blue-400 outline-none" placeholder="Fx"/>
                    <input type="number" value={node.fy} onChange={(e) => onUpdate({ fy: Number(e.target.value) })} className="bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-blue-400 outline-none" placeholder="Fy"/>
                </div>
            </div>
        </div>
    );
}

function MemberInspector({ member, onUpdate }: any) {
    return (
        <div className="space-y-4">
             <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-4">
                 <ParameterInput label="Area" unit="mm²" value={member.area} min={10} max={5000} step={10} onChange={(v: any) => onUpdate({ area: v })} icon={<Layers size={10}/>} />
                 <ParameterInput label="Modulus" unit="GPa" value={member.modulus} min={10} max={500} step={1} onChange={(v: any) => onUpdate({ modulus: v })} icon={<Zap size={10}/>} />
             </div>
        </div>
    );
}

function ParameterInput({ label, unit, value, onChange, icon }: any) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">{icon} {label}</span>
                <span className="text-[10px] font-mono text-blue-400 font-black">{value} {unit}</span>
            </div>
            <input type="range" min="10" max={label.includes('Area') ? 5000 : 500} step="1" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-white/5 rounded-full" />
        </div>
    );
}

function ValueCard({ label, value, unit, color, icon }: any) {
    return (
        <div className="bg-[#0a0f18] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">{icon} {label}</div>
            <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black font-mono text-white leading-none tracking-tighter" style={{ color: color }}>{value}</div>
                <span className="text-xs font-bold text-slate-600 uppercase italic">{unit}</span>
            </div>
        </div>
    );
}
