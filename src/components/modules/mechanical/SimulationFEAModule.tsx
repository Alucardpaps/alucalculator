"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { 
    Activity, Layers, Shield, Play, Plus, Trash2, 
    Maximize2, Zap, Settings, Info, Download, 
    MousePointer2, PlusCircle, Anchor, TrendingUp, Thermometer,
    Cpu, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { useI18nStore } from '@/store/i18nStore';
import { useAssemblyStore } from '@/lib/store/assemblyStore';

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

interface TrussPreset {
    name: string;
    description: string;
    nodes: Node[];
    members: Member[];
}

// --- PRESET TRUSS TEMPLATES ---
const TRUSS_PRESETS: TrussPreset[] = [
    {
        name: 'Simple Beam',
        description: 'Two supports, one loaded top node',
        nodes: [
            { id: 'n1', x: 200, y: 450, fixedX: true, fixedY: true, fx: 0, fy: 0 },
            { id: 'n2', x: 600, y: 450, fixedX: true, fixedY: true, fx: 0, fy: 0 },
            { id: 'n3', x: 400, y: 200, fixedX: false, fixedY: false, fx: 0, fy: 20000 },
        ],
        members: [
            { id: 'm1', node1Id: 'n1', node2Id: 'n3', area: 500, modulus: 210 },
            { id: 'm2', node1Id: 'n2', node2Id: 'n3', area: 500, modulus: 210 },
        ],
    },
    {
        name: 'Warren Truss',
        description: 'Triangulated bridge with alternating diagonals',
        nodes: [
            { id: 'n1', x: 100, y: 400, fixedX: true, fixedY: true, fx: 0, fy: 0 },
            { id: 'n2', x: 275, y: 400, fixedX: false, fixedY: false, fx: 0, fy: 0 },
            { id: 'n3', x: 450, y: 400, fixedX: false, fixedY: false, fx: 0, fy: 0 },
            { id: 'n4', x: 625, y: 400, fixedX: false, fixedY: false, fx: 0, fy: 0 },
            { id: 'n5', x: 700, y: 400, fixedX: true, fixedY: true, fx: 0, fy: 0 },
            { id: 'n6', x: 187, y: 220, fixedX: false, fixedY: false, fx: 0, fy: 0 },
            { id: 'n7', x: 362, y: 220, fixedX: false, fixedY: false, fx: 0, fy: -10000 },
            { id: 'n8', x: 537, y: 220, fixedX: false, fixedY: false, fx: 0, fy: 0 },
        ],
        members: [
            // Bottom chord
            { id: 'm1', node1Id: 'n1', node2Id: 'n2', area: 500, modulus: 210 },
            { id: 'm2', node1Id: 'n2', node2Id: 'n3', area: 500, modulus: 210 },
            { id: 'm3', node1Id: 'n3', node2Id: 'n4', area: 500, modulus: 210 },
            { id: 'm4', node1Id: 'n4', node2Id: 'n5', area: 500, modulus: 210 },
            // Top chord
            { id: 'm5', node1Id: 'n6', node2Id: 'n7', area: 500, modulus: 210 },
            { id: 'm6', node1Id: 'n7', node2Id: 'n8', area: 500, modulus: 210 },
            // Diagonals (alternating)
            { id: 'm7', node1Id: 'n1', node2Id: 'n6', area: 500, modulus: 210 },
            { id: 'm8', node1Id: 'n6', node2Id: 'n2', area: 500, modulus: 210 },
            { id: 'm9', node1Id: 'n2', node2Id: 'n7', area: 500, modulus: 210 },
            { id: 'm10', node1Id: 'n7', node2Id: 'n3', area: 500, modulus: 210 },
            { id: 'm11', node1Id: 'n3', node2Id: 'n8', area: 500, modulus: 210 },
            { id: 'm12', node1Id: 'n8', node2Id: 'n5', area: 500, modulus: 210 },
        ],
    },
    {
        name: 'Pratt Truss',
        description: 'Verticals with diagonals toward center',
        nodes: [
            { id: 'n1', x: 100, y: 400, fixedX: true, fixedY: true, fx: 0, fy: 0 },
            { id: 'n2', x: 275, y: 400, fixedX: false, fixedY: false, fx: 0, fy: 0 },
            { id: 'n3', x: 450, y: 400, fixedX: false, fixedY: false, fx: 0, fy: 0 },
            { id: 'n4', x: 625, y: 400, fixedX: false, fixedY: false, fx: 0, fy: 0 },
            { id: 'n5', x: 700, y: 400, fixedX: true, fixedY: true, fx: 0, fy: 0 },
            { id: 'n6', x: 100, y: 220, fixedX: false, fixedY: false, fx: 0, fy: 0 },
            { id: 'n7', x: 275, y: 220, fixedX: false, fixedY: false, fx: 0, fy: 0 },
            { id: 'n8', x: 450, y: 220, fixedX: false, fixedY: false, fx: 0, fy: -15000 },
            { id: 'n9', x: 625, y: 220, fixedX: false, fixedY: false, fx: 0, fy: 0 },
            { id: 'n10', x: 700, y: 220, fixedX: false, fixedY: false, fx: 0, fy: 0 },
        ],
        members: [
            // Bottom chord
            { id: 'm1', node1Id: 'n1', node2Id: 'n2', area: 500, modulus: 210 },
            { id: 'm2', node1Id: 'n2', node2Id: 'n3', area: 500, modulus: 210 },
            { id: 'm3', node1Id: 'n3', node2Id: 'n4', area: 500, modulus: 210 },
            { id: 'm4', node1Id: 'n4', node2Id: 'n5', area: 500, modulus: 210 },
            // Top chord
            { id: 'm5', node1Id: 'n6', node2Id: 'n7', area: 500, modulus: 210 },
            { id: 'm6', node1Id: 'n7', node2Id: 'n8', area: 500, modulus: 210 },
            { id: 'm7', node1Id: 'n8', node2Id: 'n9', area: 500, modulus: 210 },
            { id: 'm8', node1Id: 'n9', node2Id: 'n10', area: 500, modulus: 210 },
            // Verticals
            { id: 'm9', node1Id: 'n1', node2Id: 'n6', area: 500, modulus: 210 },
            { id: 'm10', node1Id: 'n2', node2Id: 'n7', area: 500, modulus: 210 },
            { id: 'm11', node1Id: 'n3', node2Id: 'n8', area: 500, modulus: 210 },
            { id: 'm12', node1Id: 'n4', node2Id: 'n9', area: 500, modulus: 210 },
            { id: 'm13', node1Id: 'n5', node2Id: 'n10', area: 500, modulus: 210 },
            // Diagonals (slanting toward center)
            { id: 'm14', node1Id: 'n6', node2Id: 'n2', area: 500, modulus: 210 },
            { id: 'm15', node1Id: 'n7', node2Id: 'n3', area: 500, modulus: 210 },
            { id: 'm16', node1Id: 'n9', node2Id: 'n3', area: 500, modulus: 210 },
            { id: 'm17', node1Id: 'n10', node2Id: 'n4', area: 500, modulus: 210 },
        ],
    },
];

const LOCAL_DICTS: Record<string, any> = {
  tr: {
    title: "FEA Çözümleyici",
    subtitle: "Rijitlik Çekirdeği v4.2",
    loadPreset: "Şablon Yükle",
    selectTemplate: "— Şablon Seç —",
    toolSelect: "Seç",
    toolNode: "Düğüm",
    toolTruss: "Kiriş",
    inspectorTitle: "Eleman Detayları",
    selectTopology: "Topoloji seçin",
    fixX: "Sabitle X",
    fixY: "Sabitle Y",
    forceVector: "Kuvvet Vektörü (N)",
    area: "Alan",
    modulus: "Elastisite Modülü",
    dispScale: "Deplasman Ölçeği",
    visualization: "Görselleştirme",
    solved: "ÇÖZÜLDÜ",
    unstable: "KARARSIZ",
    visualizerLabel: "Entegre Topoloji Görselleştirici",
    critStress: "Kritik Gerilme",
    maxDisp: "Maks. Deplasman",
    dof: "Serbestlik Derecesi",
    presets: {
      simpleBeamName: "Basit Kiriş",
      simpleBeamDesc: "İki mesnetli, üstten tek yüklü düğüm",
      warrenName: "Warren Kafes",
      warrenDesc: "Alternatif çaprazlı üçgen köprü",
      prattName: "Pratt Kafes",
      prattDesc: "Merkeze eğimli çaprazlı dikey elemanlar",
    }
  },
  en: {
    title: "FEA Resolve",
    subtitle: "Stiffness Kernel v4.2",
    loadPreset: "Load Preset",
    selectTemplate: "— Select Template —",
    toolSelect: "Select",
    toolNode: "Node",
    toolTruss: "Truss",
    inspectorTitle: "Element Inspector",
    selectTopology: "Select topology",
    fixX: "Fix X",
    fixY: "Fix Y",
    forceVector: "Force Vector (N)",
    area: "Area",
    modulus: "Modulus",
    dispScale: "Disp. Scale",
    visualization: "Visualization",
    solved: "SOLVED",
    unstable: "UNSTABLE",
    visualizerLabel: "Integrated Topology Visualizer",
    critStress: "Critical Stress",
    maxDisp: "Max Displacement",
    dof: "Degrees of Freedom",
    presets: {
      simpleBeamName: "Simple Beam",
      simpleBeamDesc: "Two supports, one loaded top node",
      warrenName: "Warren Truss",
      warrenDesc: "Triangulated bridge with alternating diagonals",
      prattName: "Pratt Truss",
      prattDesc: "Verticals with diagonals toward center",
    }
  },
  de: {
    title: "FEA-Lösung",
    subtitle: "Steifigkeitskern v4.2",
    loadPreset: "Vorlage Laden",
    selectTemplate: "— Vorlage Auswählen —",
    toolSelect: "Auswählen",
    toolNode: "Knoten",
    toolTruss: "Fachwerk",
    inspectorTitle: "Element-Inspektor",
    selectTopology: "Topologie auswählen",
    fixX: "Fixieren X",
    fixY: "Fixieren Y",
    forceVector: "Kraftvektor (N)",
    area: "Querschnittsfläche",
    modulus: "E-Modul",
    dispScale: "Verschiebungsmaßstab",
    visualization: "Visualisierung",
    solved: "GELÖST",
    unstable: "INSTABIL",
    visualizerLabel: "Integrierter Topologie-Visualisierer",
    critStress: "Kritische Spannung",
    maxDisp: "Max. Verschiebung",
    dof: "Freiheitsgrade",
    presets: {
      simpleBeamName: "Einfacher Balken",
      simpleBeamDesc: "Zwei Auflager, ein belasteter oberer Knoten",
      warrenName: "Warren-Fachwerk",
      warrenDesc: "Triangulierte Brücke mit abwechselnden Diagonalen",
      prattName: "Pratt-Fachwerk",
      prattDesc: "Vertikalen mit Diagonalen zur Mitte",
    }
  },
  ja: {
    title: "FEA解決",
    subtitle: "剛性カーネル v4.2",
    loadPreset: "プリセット読み込み",
    selectTemplate: "— テンプレートを選択 —",
    toolSelect: "選択",
    toolNode: "ノード",
    toolTruss: "トラス",
    inspectorTitle: "要素インスペクター",
    selectTopology: "トポロジーを選択してください",
    fixX: "X軸固定",
    fixY: "Y軸固定",
    forceVector: "力ベクトル (N)",
    area: "断面積",
    modulus: "弾性係数",
    dispScale: "変位スケール",
    visualization: "視覚化",
    solved: "解決済み",
    unstable: "不安定",
    visualizerLabel: "統合トポロジービジュアライザ",
    critStress: "許容応力",
    maxDisp: "最大変位",
    dof: "自由度",
    presets: {
      simpleBeamName: "単純梁",
      simpleBeamDesc: "2つの支持部と1つの荷重付き上部ノード",
      warrenName: "ワーレントラス",
      warrenDesc: "交互の対角線を持つ三角形の橋梁",
      prattName: "プラットトラス",
      prattDesc: "中心に向かう対角線を持つ垂直材",
    }
  }
};

const getPresetLocalName = (name: string, t: any) => {
    if (name === 'Simple Beam') return t.presets.simpleBeamName;
    if (name === 'Warren Truss') return t.presets.warrenName;
    if (name === 'Pratt Truss') return t.presets.prattName;
    return name;
};

const getPresetLocalDesc = (name: string, t: any) => {
    if (name === 'Simple Beam') return t.presets.simpleBeamDesc;
    if (name === 'Warren Truss') return t.presets.warrenDesc;
    if (name === 'Pratt Truss') return t.presets.prattDesc;
    return '';
};

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
    const { language } = useI18nStore();
    const t = LOCAL_DICTS[language] || LOCAL_DICTS.en;

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
    const [activePreset, setActivePreset] = useState<string>('');

    const importFromAssembly = useCallback(() => {
        const componentsObj = useAssemblyStore.getState().components;
        const selectedId = useAssemblyStore.getState().selectedId;
        
        let targetProfile = selectedId ? componentsObj[selectedId] : null;
        if (!targetProfile || targetProfile.type !== 'profile') {
            targetProfile = Object.values(componentsObj).find(c => c.type === 'profile') || null;
        }

        if (!targetProfile) {
            alert('No profiles found in 3D Assembly. Please add a profile in the 3D Assembly tab first.');
            return;
        }

        const length = targetProfile.metadata?.length || 500; // in mm
        const material = targetProfile.metadata?.material || 'AL-6063-T5';
        
        let modulus = 70; // Default aluminum (GPa)
        if (material.includes('Steel') || material.includes('Steel 8.8')) {
            modulus = 210;
        }

        // Map length to display scale (px)
        const scaleFactor = 0.8;
        const widthPx = Math.max(200, Math.min(600, length * scaleFactor));
        
        const n1 = { id: 'n1', x: 200, y: 450, fixedX: true, fixedY: true, fx: 0, fy: 0 };
        const n2 = { id: 'n2', x: 200 + widthPx, y: 450, fixedX: true, fixedY: true, fx: 0, fy: 0 };
        const n3 = { id: 'n3', x: 200 + widthPx / 2, y: 350, fixedX: false, fixedY: false, fx: 0, fy: 15000 };

        const m1 = { id: 'm1', node1Id: 'n1', node2Id: 'n3', area: 500, modulus };
        const m2 = { id: 'm2', node1Id: 'n2', node2Id: 'n3', area: 500, modulus };

        setNodes([n1, n2, n3]);
        setMembers([m1, m2]);
        setSelection(null);
        setActivePreset('');
        
        alert(`Successfully imported ${material} profile (Length: ${length}mm) into FEA Workspace!`);
    }, []);

    const loadPreset = useCallback((presetName: string) => {
        const preset = TRUSS_PRESETS.find(p => p.name === presetName);
        if (!preset) return;
        setNodes(preset.nodes.map(n => ({ ...n })));
        setMembers(preset.members.map(m => ({ ...m })));
        setSelection(null);
        setActivePreset(presetName);
    }, []);
    
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
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">{t.title}</h1>
                            <p className="text-[10px] text-blue-500/60 font-mono tracking-widest uppercase mt-1">{t.subtitle}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {/* Preset Template Selector */}
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-2">
                        <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t.loadPreset}</div>
                        <div className="relative">
                            <select
                                value={activePreset}
                                onChange={(e) => loadPreset(e.target.value)}
                                className="w-full bg-[#0e1622] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold outline-none appearance-none cursor-pointer hover:border-blue-500/30 transition-colors"
                            >
                                <option value="">{t.selectTemplate}</option>
                                {TRUSS_PRESETS.map(p => (
                                    <option key={p.name} value={p.name}>{getPresetLocalName(p.name, t)}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                        {activePreset && (
                            <p className="text-[9px] text-slate-600 font-mono px-1">
                                {getPresetLocalDesc(activePreset, t)}
                            </p>
                        )}
                        <div className="pt-2">
                            <button
                                onClick={importFromAssembly}
                                className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-wider transition-all border border-cyan-500/20 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                            >
                                📥 Import Profile from 3D Assembly
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <ToolBtn active={mode === 'select'} onClick={() => setMode('select')} icon={<MousePointer2 size={16}/>} label={t.toolSelect} />
                        <ToolBtn active={mode === 'node'} onClick={() => setMode('node')} icon={<PlusCircle size={16}/>} label={t.toolNode} />
                        <ToolBtn active={mode === 'member'} onClick={() => setMode('member')} icon={<Zap size={16}/>} label={t.toolTruss} />
                    </div>

                    <AnimatePresence mode="wait">
                        {selection ? (
                            <motion.div key={selection.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 mb-2">
                                    <span>{t.inspectorTitle}</span>
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
                                    <NodeInspector node={nodes.find(n => n.id === selection.id)!} onUpdate={(u: any) => setNodes(nodes.map(n => n.id === selection.id ? {...n, ...u} : n))} t={t} />
                                ) : (
                                    <MemberInspector member={members.find(m => m.id === selection.id)!} onUpdate={(u: any) => setMembers(members.map(m => m.id === selection.id ? {...m, ...u} : m))} t={t} />
                                )}
                            </motion.div>
                        ) : (
                            <div className="h-32 flex flex-col items-center justify-center text-slate-700 bg-white/[0.02] border border-dashed border-white/5 rounded-[2rem]">
                                <span className="text-[10px] uppercase font-black tracking-widest">{t.selectTopology}</span>
                            </div>
                        )}
                    </AnimatePresence>

                    <div className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-4">
                         <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex justify-between">
                            <span>{t.visualization}</span>
                            <span className={results ? 'text-emerald-400' : 'text-red-400'}>{results ? t.solved : t.unstable}</span>
                         </div>
                         <ParameterInput label={t.dispScale} unit="x" value={scale} min={1} max={5000} step={10} onChange={setScale} icon={<Maximize2 size={12}/>} />
                    </div>
                </div>
            </div>

            {/* Main Viewport */}
            <div className="flex-1 flex flex-col p-8 lg:p-12 gap-8 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 blur-[200px] rounded-full pointer-events-none" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <ValueCard label={t.critStress} value={results ? Math.max(...results.memberResults.map(r => Math.abs(r.stress))).toFixed(1) : '0.0'} unit="MPa" color="#f87171" icon={<Thermometer size={14}/>}/>
                    <ValueCard label={t.maxDisp} value={results ? (Math.max(...results.U.map(Math.abs))).toFixed(3) : '0.000'} unit="px" color="#3b82f6" icon={<Activity size={14}/>}/>
                    <ValueCard label={t.dof} value={String(nodes.length * 2)} unit="DOF" color="#94a3b8" icon={<Cpu size={14}/>}/>
                </div>

                <div className="flex-1 bg-black/60 border border-white/10 rounded-[4rem] relative overflow-hidden backdrop-blur-xl shadow-2xl">
                    <svg ref={containerRef} viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" className="w-full h-full cursor-crosshair" onClick={handleCanvasClick}>
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
                            // Normalize stress color against yield strength (modulus * 0.002 approximates yield for structural steel)
                            const yieldStrength = m.modulus * 0.002 * 1000; // Approximate yield in MPa (e.g. 210 GPa → 420 MPa)
                            const stressRatio = res ? Math.abs(res.stress) / yieldStrength : 0;
                            const color = res ? (stressRatio > 0.6 ? (res.stress > 0 ? '#f87171' : '#3b82f6') : stressRatio > 0.3 ? '#f59e0b' : '#475569') : '#334155';

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
                                    {/* Invisible touch target overlay for mobile viewports */}
                                    <motion.circle
                                        animate={{ cx: n.x + dx, cy: n.y + dy }}
                                        r={18}
                                        fill="transparent"
                                    />
                                    {n.fixedX && <rect x={n.x + dx - 10} y={n.y + dy + 8} width="20" height="2" fill="#10b981" opacity="0.5" />}
                                    {n.fy !== 0 && <line x1={n.x+dx} y1={n.y+dy-40} x2={n.x+dx} y2={n.y+dy-8} stroke="#f87171" strokeWidth="2" markerEnd="url(#arrow)" />}
                                </g>
                            );
                        })}
                    </svg>
                    <div className="absolute bottom-8 left-12 text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">{t.visualizerLabel}</div>
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

function NodeInspector({ node, onUpdate, t }: any) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onUpdate({ fixedX: !node.fixedX })} className={`py-2 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${node.fixedX ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>{t.fixX}</button>
                <button onClick={() => onUpdate({ fixedY: !node.fixedY })} className={`py-2 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${node.fixedY ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>{t.fixY}</button>
            </div>
            <div className="space-y-2">
                <div className="text-[8px] text-slate-600 uppercase font-black">{t.forceVector}</div>
                <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={node.fx} onChange={(e) => onUpdate({ fx: Number(e.target.value) })} className="bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-blue-400 outline-none" placeholder="Fx"/>
                    <input type="number" value={node.fy} onChange={(e) => onUpdate({ fy: Number(e.target.value) })} className="bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-blue-400 outline-none" placeholder="Fy"/>
                </div>
            </div>
        </div>
    );
}

function MemberInspector({ member, onUpdate, t }: any) {
    return (
        <div className="space-y-4">
             <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-4">
                 <ParameterInput label={t.area} unit="mm²" value={member.area} min={10} max={5000} step={10} onChange={(v: any) => onUpdate({ area: v })} icon={<Layers size={10}/>} />
                 <ParameterInput label={t.modulus} unit="GPa" value={member.modulus} min={10} max={500} step={1} onChange={(v: any) => onUpdate({ modulus: v })} icon={<Zap size={10}/>} />
             </div>
        </div>
    );
}

function ParameterInput({ label, unit, value, onChange, icon, min = 0, max = 100, step = 1 }: {
    label: string;
    unit: string;
    value: number;
    onChange: (value: number) => void;
    icon?: React.ReactNode;
    min?: number;
    max?: number;
    step?: number;
}) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">{icon} {label}</span>
                <span className="text-[10px] font-mono text-blue-400 font-black">{value} {unit}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-white/5 rounded-full" />
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
