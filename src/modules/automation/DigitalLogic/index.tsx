'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cpu, Activity, Zap, Play, RotateCcw,
    Layers, Settings, Info, Box, Plus,
    Trash2, ChevronRight, Terminal, HelpCircle
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';

// ─────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────

type GateType = 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'BUFFER';

/** Input source: boolean for manual HIGH/LOW, string (gate id) for linked output. */
type InputSource = boolean | string;

interface Gate {
    id: string;
    type: GateType;
    inputs: InputSource[];
    output: boolean;
    x: number;
    y: number;
}

const LOCAL_DICTS: Record<string, any> = {
  tr: {
    title: "Mantık Laboratuvarı",
    subtitle: "İkili Sistemler v2.8",
    description: "Etkileşimli dijital mantık kapısı simülatörü. Doğruluk tablosu ve osiloskop aracılığıyla gerçek zamanlı sinyal yayılımını gözlemleyerek kapılar ekleyin, girişleri çıkışlara bağlayın ve mantıksal devreler kurun.",
    gateInspector: "Kapı Müfettişi",
    clickToInspect: "Girişlerini incelemek ve yapılandırmak için tuvaldeki bir kapıya tıklayın.",
    manualHigh: "Manuel HIGH (1)",
    manualLow: "Manuel LOW (0)",
    outputLabel: "Çıkış",
    inputLabel: "Giriş",
    inputALabel: "Giriş A",
    inputBLabel: "Giriş B",
    truthAnalysis: "Doğruluk Analizi",
    nodeId: "Düğüm ID",
    type: "Tip",
    outputHeader: "Çıkış",
    signalTiming: "Sinyal Zamanlaması",
    clockingStatus: "Sinyal: Sürekli",
    footerHelp: "Girişleri yapılandırmak için bir kapı seçin. Kapıları birbirine bağlamak için açılır menüleri kullanın.",
    propagationPlane: "Gerçek Zamanlı Mantık Yayılım Düzlemi",
    gateDescriptions: {
        AND: 'Çıkış sadece TÜM girişler HIGH olduğunda HIGH olur',
        OR: 'Çıkış HERHANGİ bir giriş HIGH olduğunda HIGH olur',
        NOT: 'Giriş sinyalini tersine çevirir (HIGH→LOW, LOW→HIGH)',
        XOR: 'Çıkış, girişler FARKLI olduğunda HIGH olur',
        NAND: 'Ters AND — Sadece tüm girişler HIGH olduğunda LOW olur',
        BUFFER: 'Girişi doğrudan çıkışa iletir (sinyal koşullandırma)',
    }
  },
  en: {
    title: "Logic Lab",
    subtitle: "Binary Systems v2.8",
    description: "Interactive digital logic gate simulator. Build combinational circuits by adding gates, connecting inputs to outputs, and observing real-time signal propagation through the truth table and oscilloscope.",
    gateInspector: "Gate Inspector",
    clickToInspect: "Click a gate on the canvas to inspect and configure its inputs.",
    manualHigh: "Manual HIGH",
    manualLow: "Manual LOW",
    outputLabel: "Output",
    inputLabel: "Input",
    inputALabel: "Input A",
    inputBLabel: "Input B",
    truthAnalysis: "Truth Analysis",
    nodeId: "Node ID",
    type: "Type",
    outputHeader: "Output",
    signalTiming: "Signal Timing",
    clockingStatus: "Clocking: Continuous",
    footerHelp: "Select a gate to configure inputs. Use dropdowns to wire gates together.",
    propagationPlane: "Real-Time Logic Propagation Plane",
    gateDescriptions: {
        AND: 'Output is HIGH only when ALL inputs are HIGH',
        OR: 'Output is HIGH when ANY input is HIGH',
        NOT: 'Inverts the input signal (HIGH→LOW, LOW→HIGH)',
        XOR: 'Output is HIGH when inputs DIFFER',
        NAND: 'Inverted AND — LOW only when all inputs HIGH',
        BUFFER: 'Passes input directly to output (signal conditioning)',
    }
  },
  de: {
    title: "Logik-Labor",
    subtitle: "Binärsysteme v2.8",
    description: "Interaktiver digitaler Logikgatter-Simulator. Bauen Sie kombinatorische Schaltungen auf, indem Sie Gatter hinzufügen, Eingänge mit Ausgängen verbinden und die Echtzeit-Signalübertragung durch die Wahrheitstabelle und das Oszilloskop beobachten.",
    gateInspector: "Gatter-Inspektor",
    clickToInspect: "Klicken Sie auf ein Gatter auf der Arbeitsfläche, um seine Eingänge zu inspizieren und zu konfigurieren.",
    manualHigh: "Manuell HIGH",
    manualLow: "Manuell LOW",
    outputLabel: "Ausgang",
    inputLabel: "Eingang",
    inputALabel: "Eingang A",
    inputBLabel: "Eingang B",
    truthAnalysis: "Wahrheitsanalyse",
    nodeId: "Knoten-ID",
    type: "Gattertyp",
    outputHeader: "Ausgang",
    signalTiming: "Signalzeitverlauf",
    clockingStatus: "Taktung: Kontinuierlich",
    footerHelp: "Wählen Sie ein Gatter aus, um Eingänge zu konfigurieren. Verwenden Sie Dropdowns, um Gatter zu verbinden.",
    propagationPlane: "Echtzeit-Logikfortpflanzungsebene",
    gateDescriptions: {
        AND: 'Ausgang ist nur HIGH, wenn ALLE Eingänge HIGH sind',
        OR: 'Ausgang ist HIGH, wenn MINDESTENS ein Eingang HIGH ist',
        NOT: 'Invertiert das Eingangssignal (HIGH→LOW, LOW→HIGH)',
        XOR: 'Ausgang ist HIGH, wenn sich die Eingänge UNTERSCHEIDEN',
        NAND: 'Invertiertes AND — nur LOW, wenn alle Eingänge HIGH sind',
        BUFFER: 'Gibt den Eingang direkt an den Ausgang weiter (Signalkonditionierung)',
    }
  },
  ja: {
    title: "論理回路ラボ",
    subtitle: "バイナリシステム v2.8",
    description: "インタラクティブなデジタル論理ゲートシミュレータ。ゲートを追加し、入力を出力に接続し、真理値表とオシロスコープを介してリアルタイムの信号伝播を観察することにより、組み合わせ回路を構築します。",
    gateInspector: "ゲートインスペクター",
    clickToInspect: "キャンバス上のゲートをクリックして、入力を検査および設定します。",
    manualHigh: "手動 HIGH",
    manualLow: "手動 LOW",
    outputLabel: "出力",
    inputLabel: "入力",
    inputALabel: "入力 A",
    inputBLabel: "入力 B",
    truthAnalysis: "真理値分析",
    nodeId: "ノード ID",
    type: "タイプ",
    outputHeader: "出力",
    signalTiming: "信号タイミング",
    clockingStatus: "クロック: 連続",
    footerHelp: "ゲートを選択して入力を設定します。ドロップダウンを使用してゲート間を配線します。",
    propagationPlane: "リアルタイムロジック伝播プレーン",
    gateDescriptions: {
        AND: 'すべての入力がHIGHの場合のみ出力がHIGHになります',
        OR: 'いずれかの入力がHIGHの場合に出力がHIGHになります',
        NOT: '入力信号を反転します (HIGH→LOW, LOW→HIGH)',
        XOR: '入力が異なる場合に出力がHIGHになります',
        NAND: '反反転AND — すべての入力がHIGHの場合のみLOWになります',
        BUFFER: '入力を直接出力に渡します（信号調整）',
    }
  }
};

/** Evaluate a single gate given already-resolved input values. */
function evaluateGate(type: GateType, inputVals: boolean[]): boolean {
    switch (type) {
        case 'AND':    return inputVals[0] && inputVals[1];
        case 'OR':     return inputVals[0] || inputVals[1];
        case 'NOT':    return !inputVals[0];
        case 'XOR':    return (inputVals[0] || inputVals[1]) && !(inputVals[0] && inputVals[1]);
        case 'NAND':   return !(inputVals[0] && inputVals[1]);
        case 'BUFFER': return !!inputVals[0];
    }
}

/** Generate a unique gate ID that doesn't collide with existing ones. */
function nextGateId(gates: Gate[]): string {
    const existingNums = gates
        .map(g => parseInt(g.id.replace('g', ''), 10))
        .filter(n => !isNaN(n));
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
    return `g${maxNum + 1}`;
}

// ─────────────────────────────────────────────────────────────
// Gate dimensions (for wire anchoring)
// ─────────────────────────────────────────────────────────────

const GATE_CARD_WIDTH = 180;
const GATE_CARD_HEIGHT = 120;
const INPUT_PORT_X_OFFSET = 0;
const OUTPUT_PORT_X_OFFSET = GATE_CARD_WIDTH;
const INPUT_PORT_Y_BASE = 50;
const INPUT_PORT_Y_STEP = 24;
const OUTPUT_PORT_Y_OFFSET = GATE_CARD_HEIGHT / 2;

// ─────────────────────────────────────────────────────────────
// WireOverlay — SVG wires between connected gates
// ─────────────────────────────────────────────────────────────

interface WireOverlayProps {
    gates: Gate[];
}

function WireOverlay({ gates }: WireOverlayProps) {
    const gateMap = useMemo(() => {
        const map = new Map<string, Gate>();
        gates.forEach(g => map.set(g.id, g));
        return map;
    }, [gates]);

    const wires: React.ReactElement[] = [];

    gates.forEach(gate => {
        gate.inputs.forEach((inp, inputIdx) => {
            if (typeof inp !== 'string') return;
            const sourceGate = gateMap.get(inp);
            if (!sourceGate) return;

            // Source: right side (output port) of source gate
            const sx = sourceGate.x + OUTPUT_PORT_X_OFFSET;
            const sy = sourceGate.y + OUTPUT_PORT_Y_OFFSET;

            // Target: left side (input port) of this gate
            const tx = gate.x + INPUT_PORT_X_OFFSET;
            const ty = gate.y + INPUT_PORT_Y_BASE + inputIdx * INPUT_PORT_Y_STEP;

            const dx = Math.abs(tx - sx) * 0.5;
            const path = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;

            const isHigh = sourceGate.output;

            wires.push(
                <path
                    key={`${gate.id}-in${inputIdx}-${inp}`}
                    d={path}
                    fill="none"
                    stroke={isHigh ? '#10b981' : '#334155'}
                    strokeWidth={isHigh ? 2.5 : 1.5}
                    strokeLinecap="round"
                    opacity={isHigh ? 0.85 : 0.4}
                    style={{
                        filter: isHigh ? 'drop-shadow(0 0 6px rgba(16,185,129,0.5))' : 'none',
                        transition: 'stroke 0.3s, opacity 0.3s, filter 0.3s',
                    }}
                />
            );

            // Animated pulse dot when HIGH
            if (isHigh) {
                wires.push(
                    <circle key={`dot-${gate.id}-in${inputIdx}`} r={3} fill="#34d399">
                        <animateMotion dur="1.5s" repeatCount="indefinite" path={path} />
                    </circle>
                );
            }
        });
    });

    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-[5]">
            {wires}
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────
// InputSourceSelector — dropdown for each gate input
// ─────────────────────────────────────────────────────────────

interface InputSourceSelectorProps {
    gateId: string;
    inputIndex: number;
    currentValue: InputSource;
    allGates: Gate[];
    onChange: (gateId: string, inputIndex: number, newValue: InputSource) => void;
    t: any;
}

function InputSourceSelector({ gateId, inputIndex, currentValue, allGates, onChange, t }: InputSourceSelectorProps) {
    const selectValue = typeof currentValue === 'string'
        ? currentValue
        : currentValue ? 'HIGH' : 'LOW';

    const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'HIGH') onChange(gateId, inputIndex, true);
        else if (val === 'LOW') onChange(gateId, inputIndex, false);
        else onChange(gateId, inputIndex, val); // gate id string
    }, [gateId, inputIndex, onChange]);

    const otherGates = allGates.filter(g => g.id !== gateId);

    return (
        <select
            value={selectValue}
            onChange={handleChange}
            className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer appearance-none hover:bg-white/5"
            style={{ minWidth: 100 }}
        >
            <option value="HIGH">{t.manualHigh}</option>
            <option value="LOW">{t.manualLow}</option>
            {otherGates.map(g => (
                <option key={g.id} value={g.id}>
                    {g.id} ({g.type}) {t.outputLabel}
                </option>
            ))}
        </select>
    );
}

// ─────────────────────────────────────────────────────────────
// PaletteBtn with tooltip
// ─────────────────────────────────────────────────────────────

interface PaletteBtnProps {
    label: GateType;
    onClick: () => void;
    t: any;
}

function PaletteBtn({ label, onClick, t }: PaletteBtnProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={onClick}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="flex items-center justify-center gap-2 p-3 w-full bg-white/[0.03] hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group"
            >
                <Plus size={12} className="text-slate-500 group-hover:text-emerald-400" />
                {label}
            </button>
            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 px-3 py-2 bg-[#0c1220] border border-emerald-500/20 rounded-lg shadow-xl max-w-[200px] pointer-events-none"
                    >
                        <p className="text-[9px] text-slate-400 leading-relaxed whitespace-normal">
                            {t.gateDescriptions[label]}
                        </p>
                        <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-[#0c1220] border-l border-t border-emerald-500/20 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Main Module
// ─────────────────────────────────────────────────────────────

export default function DigitalLogicModule() {
    const { language } = useI18nStore();
    const t = LOCAL_DICTS[language] || LOCAL_DICTS.en;

    const [gates, setGates] = useState<Gate[]>([
        { id: 'g1', type: 'AND', inputs: [true, false], output: false, x: 100, y: 100 },
        { id: 'g2', type: 'NOT', inputs: ['g1'], output: false, x: 350, y: 100 },
    ]);
    const [history, setHistory] = useState<boolean[][]>([]);
    const [showInfo, setShowInfo] = useState(false);
    const [selectedGateId, setSelectedGateId] = useState<string | null>(null);

    // ── Live Logic Resolution ──
    const resolvedGates = useMemo(() => {
        const temp = gates.map(g => ({ ...g }));
        const outputMap = new Map<string, boolean>();
        temp.forEach(g => outputMap.set(g.id, g.output));

        for (let iter = 0; iter < 10; iter++) {
            let stable = true;
            temp.forEach(g => {
                const inputVals = g.inputs.map(inp => {
                    if (typeof inp === 'boolean') return inp;
                    return outputMap.get(inp) ?? false;
                });
                const newOutput = evaluateGate(g.type, inputVals);
                if (newOutput !== g.output) stable = false;
                g.output = newOutput;
                outputMap.set(g.id, newOutput);
            });
            if (stable) break;
        }
        return temp;
    }, [gates]);

    // ── Update history for Oscilloscope ──
    useEffect(() => {
        setHistory(prev => {
            const currentStates = resolvedGates.map(g => g.output);
            return [...prev, currentStates].slice(-50);
        });
    }, [resolvedGates]);

    // ── Gate mutations ──
    const addGate = useCallback((type: GateType) => {
        setGates(prev => {
            const newGate: Gate = {
                id: nextGateId(prev),
                type,
                inputs: type === 'NOT' || type === 'BUFFER' ? [false] : [false, false],
                output: false,
                x: 100 + Math.random() * 80,
                y: 280 + Math.random() * 80,
            };
            return [...prev, newGate];
        });
    }, []);

    const removeGate = useCallback((gateId: string) => {
        setGates(prev => {
            return prev
                .filter(g => g.id !== gateId)
                .map(g => ({
                    ...g,
                    inputs: g.inputs.map(inp => (inp === gateId ? false : inp)),
                }));
        });
        setSelectedGateId(prev => (prev === gateId ? null : prev));
    }, []);

    const setInputSource = useCallback((gateId: string, inputIndex: number, newValue: InputSource) => {
        setGates(prev =>
            prev.map(g => {
                if (g.id !== gateId) return g;
                const newInputs = [...g.inputs];
                newInputs[inputIndex] = newValue;
                return { ...g, inputs: newInputs };
            })
        );
    }, []);

    const handleDrag = useCallback((id: string, x: number, y: number) => {
        setGates(prev => prev.map(g => (g.id === id ? { ...g, x, y } : g)));
    }, []);

    // ── Drag state ──
    const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    const onPointerDown = useCallback((e: React.PointerEvent, gateId: string) => {
        const gate = gates.find(g => g.id === gateId);
        if (!gate) return;

        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (!canvasRect) return;

        dragRef.current = {
            id: gateId,
            offsetX: e.clientX - canvasRect.left - gate.x,
            offsetY: e.clientY - canvasRect.top - gate.y,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setSelectedGateId(gateId);
    }, [gates]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragRef.current) return;
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (!canvasRect) return;

        const x = Math.max(0, e.clientX - canvasRect.left - dragRef.current.offsetX);
        const y = Math.max(0, e.clientY - canvasRect.top - dragRef.current.offsetY);
        handleDrag(dragRef.current.id, x, y);
    }, [handleDrag]);

    const onPointerUp = useCallback(() => {
        dragRef.current = null;
    }, []);

    // Find the selected gate from resolved data for the inspector
    const selectedGate = selectedGateId
        ? resolvedGates.find(g => g.id === selectedGateId) ?? null
        : null;

    return (
        <div className="flex w-full h-full bg-[#03060a] text-white overflow-hidden relative selection:bg-emerald-500/30 font-sans">
            {/* Background Data Stream Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />

            {/* SIDEBAR: Components, Inspector & Registry */}
            <div className="w-[320px] bg-[#05080f]/95 backdrop-blur-3xl border-r border-white/5 flex flex-col z-20 shadow-2xl">

                {/* Header + Palette */}
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-emerald-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            <Cpu size={24} />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none text-white">{t.title}</h1>
                            <p className="text-[10px] text-emerald-500/60 font-mono tracking-widest uppercase mt-1">{t.subtitle}</p>
                        </div>
                        <button
                            onClick={() => setShowInfo(prev => !prev)}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 flex items-center justify-center transition-all"
                            title="Module info"
                        >
                            <Info size={14} className="text-slate-400" />
                        </button>
                    </div>

                    {/* Module Description Panel */}
                    <AnimatePresence>
                        {showInfo && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 mb-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                    <p className="text-[10px] text-slate-400 leading-relaxed">
                                        {t.description}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-3 gap-2">
                        <PaletteBtn label="AND" onClick={() => addGate('AND')} t={t} />
                        <PaletteBtn label="OR" onClick={() => addGate('OR')} t={t} />
                        <PaletteBtn label="NOT" onClick={() => addGate('NOT')} t={t} />
                        <PaletteBtn label="XOR" onClick={() => addGate('XOR')} t={t} />
                        <PaletteBtn label="NAND" onClick={() => addGate('NAND')} t={t} />
                        <PaletteBtn label="BUFFER" onClick={() => addGate('BUFFER')} t={t} />
                    </div>
                </div>

                {/* Scrollable Panels */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* Gate Inspector */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Settings size={14} /> {t.gateInspector}
                        </h3>
                        {selectedGate ? (
                            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-black text-white">{selectedGate.id}</span>
                                        <span className="text-[10px] text-emerald-500 font-bold ml-2">{selectedGate.type}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${selectedGate.output ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                                        {selectedGate.output ? 'HIGH' : 'LOW'}
                                    </span>
                                </div>

                                <p className="text-[9px] text-slate-500 leading-relaxed italic border-l-2 border-emerald-500/20 pl-3">
                                    {t.gateDescriptions[selectedGate.type]}
                                </p>

                                <div className="space-y-3">
                                    {selectedGate.inputs.map((inp, idx) => {
                                        const inputLabel = selectedGate.type === 'NOT' || selectedGate.type === 'BUFFER'
                                            ? t.inputLabel
                                            : `${t.inputLabel} ${String.fromCharCode(65 + idx)}`;
                                        return (
                                            <div key={idx} className="flex items-center justify-between gap-3">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                                                    {inputLabel}
                                                </span>
                                                <InputSourceSelector
                                                    gateId={selectedGate.id}
                                                    inputIndex={idx}
                                                    currentValue={inp}
                                                    allGates={gates}
                                                    onChange={setInputSource}
                                                    t={t}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-black/20 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                                <HelpCircle size={20} className="text-slate-700 mb-2" />
                                <p className="text-[10px] text-slate-600 leading-relaxed">
                                    {t.clickToInspect}
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Truth Analysis */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Terminal size={14} /> {t.truthAnalysis}
                        </h3>
                        <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
                             <table className="w-full text-left text-[10px] font-mono">
                                 <thead className="bg-white/5">
                                     <tr>
                                         <th className="px-4 py-2 text-slate-500">{t.nodeId}</th>
                                         <th className="px-4 py-2 text-slate-500">{t.type}</th>
                                         <th className="px-4 py-2 text-slate-500">{t.outputHeader}</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-white/5">
                                     {resolvedGates.map(g => (
                                         <tr
                                             key={g.id}
                                             className={`transition-colors cursor-pointer ${selectedGateId === g.id ? 'bg-emerald-500/5' : 'hover:bg-white/[0.02]'}`}
                                             onClick={() => setSelectedGateId(g.id)}
                                         >
                                             <td className="px-4 py-2 font-black text-slate-300">{g.id}</td>
                                             <td className="px-4 py-2 text-emerald-500 font-bold">{g.type}</td>
                                             <td className="px-4 py-2">
                                                 <span className={`px-2 py-0.5 rounded font-black ${g.output ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                                                     {g.output ? 'HIGH' : 'LOW'}
                                                 </span>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                              </table>
                        </div>
                    </section>

                    {/* Oscilloscope View */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={14} /> {t.signalTiming}
                        </h3>
                        <div className="h-40 bg-black/60 border border-white/10 rounded-2xl overflow-hidden p-4 flex gap-1 items-end">
                            {history.map((tick, i) => (
                                <div key={i} className="flex-1 flex flex-col gap-[2px]">
                                    {tick.slice(0, 4).map((state, si) => (
                                        <div
                                            key={si}
                                            className={`w-full transition-all ${state ? 'h-4 bg-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'h-1 bg-white/5'}`}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer Status */}
                <div className="p-4 bg-black/20 border-t border-white/5">
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                         <div className="flex items-center gap-2 mb-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{t.clockingStatus}</span>
                         </div>
                         <p className="text-[9px] text-slate-500 leading-relaxed italic">
                             {t.footerHelp}
                         </p>
                    </div>
                </div>
            </div>

            {/* MAIN CANVAS: Visualization */}
            <div
                className="flex-1 relative overflow-hidden"
                ref={canvasRef}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none" />

                {/* Wire Overlay */}
                <WireOverlay gates={resolvedGates} />

                {/* Gate Nodes */}
                <div className="w-full h-full relative z-10">
                    {resolvedGates.map(gate => (
                        <div
                            key={gate.id}
                            className={`absolute group select-none cursor-grab active:cursor-grabbing ${selectedGateId === gate.id ? 'z-20' : 'z-10'}`}
                            style={{ left: gate.x, top: gate.y }}
                            onPointerDown={e => {
                                if ((e.target as HTMLElement).closest('button, select')) return;
                                onPointerDown(e, gate.id);
                            }}
                        >
                            <div
                                className={`p-6 bg-[#0a0f18]/90 backdrop-blur-xl border-2 rounded-2xl flex flex-col items-center gap-4 shadow-2xl transition-all ${
                                    selectedGateId === gate.id
                                        ? 'border-emerald-400/70 shadow-[0_0_40px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/20'
                                        : gate.output
                                            ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] scale-105'
                                            : 'border-white/10 opacity-80'
                                }`}
                                onClick={() => setSelectedGateId(gate.id)}
                            >
                                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest absolute -top-3 left-4 bg-[#0a0f18] px-2">
                                    {gate.id}
                                </div>
                                <div className="text-xl font-black italic tracking-tighter text-white">{gate.type}</div>

                                <div className="flex gap-4 items-center">
                                    <div className="flex flex-col gap-2">
                                        {gate.inputs.map((inp, idx) => {
                                            const isLinked = typeof inp === 'string';
                                            const resolvedVal = isLinked
                                                ? (resolvedGates.find(s => s.id === inp)?.output ?? false)
                                                : inp;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${
                                                        isLinked
                                                            ? resolvedVal
                                                                ? 'bg-cyan-500 text-black shadow-lg ring-1 ring-cyan-400/40'
                                                                : 'bg-cyan-900/40 text-cyan-600 ring-1 ring-cyan-700/30'
                                                            : resolvedVal
                                                                ? 'bg-emerald-500 text-black shadow-lg'
                                                                : 'bg-white/5 text-slate-500'
                                                    }`}
                                                    title={isLinked ? `Linked to ${inp}` : `Manual ${resolvedVal ? 'HIGH' : 'LOW'}`}
                                                >
                                                    {resolvedVal ? '1' : '0'}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <ChevronRight className="text-slate-700" size={16} />
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${gate.output ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-black/40 border-white/5'}`}>
                                        <div className={`w-3 h-3 rounded-full ${gate.output ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-slate-800'}`} />
                                    </div>
                                </div>

                                <button
                                    onClick={e => { e.stopPropagation(); removeGate(gate.id); }}
                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>

                            {/* Signal Traces */}
                            {gate.output && (
                                <motion.div
                                    layoutId={`${gate.id}-trace`}
                                    className="absolute left-full top-1/2 -translate-y-1/2 w-20 h-[2px] bg-gradient-to-r from-emerald-500 to-transparent shadow-[0_0_10px_#14b8a6]"
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="absolute bottom-8 right-8 text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] pointer-events-none">
                    {t.propagationPlane}
                </div>
            </div>
        </div>
    );
}
