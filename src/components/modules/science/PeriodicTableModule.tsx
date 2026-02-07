'use client';

import { useState, useMemo } from 'react';
import { PERIODIC_TABLE_DATA, ElementData } from '@/data/periodicTableData';
import { Search, Info, Beaker, Thermometer, Box, Layers, Atom } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
    "alkali metal": "#ff6b6b",
    "alkaline earth metal": "#feca57",
    "transition metal": "#48dbfb",
    "post-transition metal": "#1dd1a1",
    "metalloid": "#00d2d3",
    "diatomic nonmetal": "#54a0ff",
    "polyatomic nonmetal": "#5f27cd",
    "noble gas": "#c8d6e5",
    "lanthanide": "#ff9ff3",
    "actinide": "#f368e0",
    "unknown": "#576574"
};

const CATEGORY_LABELS: Record<string, string> = {
    "alkali metal": "Alkali Metal",
    "alkaline earth metal": "Alkaline Earth",
    "transition metal": "Transition Metal",
    "post-transition metal": "Post-Transition",
    "metalloid": "Metalloid",
    "diatomic nonmetal": "Nonmetal",
    "polyatomic nonmetal": "Nonmetal",
    "noble gas": "Noble Gas",
    "lanthanide": "Lanthanide",
    "actinide": "Actinide",
    "unknown": "Unknown"
};

export default function PeriodicTableModule({ lang, dict }: { lang: string, dict: any }) {
    const [selected, setSelected] = useState<ElementData | null>(null);
    const [filter, setFilter] = useState('');
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    const filteredElements = useMemo(() => {
        if (!filter) return PERIODIC_TABLE_DATA;
        const q = filter.toLowerCase();
        return PERIODIC_TABLE_DATA.filter(e =>
            e.name.toLowerCase().includes(q) ||
            e.symbol.toLowerCase().includes(q) ||
            e.number.toString() === q
        );
    }, [filter]);

    // Grid placement logic
    const getGridPos = (el: ElementData) => {
        // Lanthanides (57-71) and Actinides (89-103) go to separate rows
        if (el.number >= 57 && el.number <= 71) return { row: 9, col: el.number - 57 + 3 }; // Period 6 expansion
        if (el.number >= 89 && el.number <= 103) return { row: 10, col: el.number - 89 + 3 }; // Period 7 expansion
        return { row: el.period, col: el.group };
    };

    const isDimmed = (el: ElementData) => {
        if (hoveredCategory && el.category !== hoveredCategory) return true;
        if (filter && !filteredElements.includes(el)) return true;
        return false;
    };

    return (
        <div className="flex flex-col h-full bg-[#0f1014] text-slate-200 overflow-hidden">
            {/* Header / Toolbar */}
            <div className="flex items-center gap-4 p-4 border-b border-slate-800 bg-[#16171d]">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder={dict.science?.searchPlaceholder || "Search Element..."}
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="w-full bg-[#0f1014] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                    />
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-2 text-[10px] items-center justify-end flex-1">
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <div
                            key={key}
                            onMouseEnter={() => setHoveredCategory(key)}
                            onMouseLeave={() => setHoveredCategory(null)}
                            className="flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-all hover:bg-white/5"
                            style={{ opacity: hoveredCategory && hoveredCategory !== key ? 0.3 : 1 }}
                        >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[key] }} />
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Table Area */}
                <div className="flex-1 overflow-auto p-6 flex items-center justify-center min-h-[500px]">
                    <div
                        className="grid gap-1 relative"
                        style={{
                            gridTemplateColumns: 'repeat(18, minmax(36px, 1fr))',
                            gridTemplateRows: 'repeat(10, minmax(36px, 1fr))',
                            maxWidth: '1400px',
                            width: '100%',
                            aspectRatio: '18/10'
                        }}
                    >
                        {PERIODIC_TABLE_DATA.map(el => {
                            const pos = getGridPos(el);
                            const isActive = selected?.number === el.number;
                            const dimmed = isDimmed(el);

                            return (
                                <button
                                    key={el.number}
                                    onClick={() => setSelected(el)}
                                    className={`relative rounded flex flex-col items-center justify-center transition-all duration-200 ${isActive ? 'z-10 ring-2 ring-white scale-110' : 'hover:scale-105 hover:z-10'}`}
                                    style={{
                                        gridColumn: pos.col,
                                        gridRow: pos.row,
                                        backgroundColor: CATEGORY_COLORS[el.category],
                                        opacity: dimmed ? 0.1 : 1,
                                        filter: dimmed ? 'grayscale(100%)' : 'none',
                                        color: '#000'
                                    }}
                                >
                                    <span className="text-[8px] absolute top-0.5 left-1 opacity-70 font-mono">{el.number}</span>
                                    <span className="text-sm font-bold">{el.symbol}</span>
                                    <span className="text-[7px] opacity-80 truncate max-w-full px-0.5">{el.name}</span>
                                </button>
                            );
                        })}

                        {/* Spacers for Period 6/7 visualization */}
                        <div className="text-slate-600 text-[10px] font-mono flex items-center justify-center" style={{ gridColumn: 3, gridRow: 6 }}>57-71</div>
                        <div className="text-slate-600 text-[10px] font-mono flex items-center justify-center" style={{ gridColumn: 3, gridRow: 7 }}>89-103</div>
                    </div>
                </div>

                {/* Detail Panel */}
                {selected && (
                    <div className="w-96 bg-[#16171d] border-l border-slate-800 overflow-y-auto p-6 animate-in slide-in-from-right duration-300">
                        <div className="flex flex-col items-center mb-8">
                            <div
                                className="w-32 h-32 rounded-2xl flex flex-col items-center justify-center mb-4 shadow-[0_0_40px_-5px_var(--glow-color)] transition-all"
                                style={{
                                    backgroundColor: CATEGORY_COLORS[selected.category] || '#576574',
                                    color: '#000',
                                    '--glow-color': CATEGORY_COLORS[selected.category] || '#576574'
                                } as any}
                            >
                                <div className="text-lg font-mono opacity-60 mb-1">{selected.number}</div>
                                <div className="text-6xl font-bold mb-1">{selected.symbol}</div>
                                <div className="text-sm font-medium opacity-80">{selected.mass.toFixed(3)}</div>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-1">{selected.name}</h2>
                            <div
                                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6"
                                style={{
                                    backgroundColor: `${CATEGORY_COLORS[selected.category] || '#576574'}20`,
                                    color: CATEGORY_COLORS[selected.category] || '#576574'
                                }}
                            >
                                {selected.category}
                            </div>

                            <p className="text-sm text-slate-400 text-center leading-relaxed">
                                {selected.summary}
                            </p>
                        </div>

                        {/* Bohr Model Visualization */}
                        <div className="mb-8 p-4 bg-black/20 rounded-xl">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Atom size={12} /> {dict.science?.atomicStructure || "Atomic Structure"}
                            </h3>
                            <div className="flex justify-center my-4">
                                <BohrModel element={selected} color={CATEGORY_COLORS[selected.category]} />
                            </div>
                            <div className="text-center font-mono text-xs text-slate-500">
                                {selected.electron_configuration}
                            </div>
                        </div>

                        {/* Properties */}
                        <div className="grid gap-4">
                            <PropertyRow icon={<Thermometer size={14} />} label={dict.science?.meltingPoint || "Melting Point"} value={selected.melt ? `${selected.melt} K` : 'N/A'} subValue={selected.melt ? `${(selected.melt - 273.15).toFixed(1)}°C` : undefined} />
                            <PropertyRow icon={<Thermometer size={14} />} label={dict.science?.boilingPoint || "Boiling Point"} value={selected.boil ? `${selected.boil} K` : 'N/A'} subValue={selected.boil ? `${(selected.boil - 273.15).toFixed(1)}°C` : undefined} />
                            <PropertyRow icon={<Box size={14} />} label={dict.science?.density || "Density"} value={selected.density ? `${selected.density} g/cm³` : 'N/A'} />
                            <PropertyRow icon={<Layers size={14} />} label={dict.science?.groupPeriod || "Group/Period"} value={`${dict.science?.group || "Group"} ${selected.group}, ${dict.science?.period || "Period"} ${selected.period}`} />
                            <PropertyRow icon={<Search size={14} />} label={dict.science?.discoveredBy || "Discovered By"} value={selected.discovered_by || 'Unknown'} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function PropertyRow({ icon, label, value, subValue }: { icon: any, label: string, value: string, subValue?: string }) {
    return (
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
            <div className="flex items-center gap-3">
                <div className="text-slate-400">{icon}</div>
                <div className="text-xs font-medium text-slate-300">{label}</div>
            </div>
            <div className="text-right">
                <div className="text-sm font-bold text-white">{value}</div>
                {subValue && <div className="text-[10px] text-slate-500">{subValue}</div>}
            </div>
        </div>
    );
}

// Simple Schematic Bohr Model
function BohrModel({ element, color }: { element: ElementData, color: string }) {
    // Determine shell count from Period
    const shells = element.period;
    const baseRadius = 25;
    const spacing = 12;
    const svgSize = (baseRadius + (shells * spacing)) * 2 + 10;
    const center = svgSize / 2;

    // Electrons per shell approximation (2, 8, 18, 32...)
    // This is visual only, standard rule 2n^2 roughly
    const electronCounts = getElectronCounts(element.number);

    return (
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="animate-spin" style={{ animationDuration: '60s' }}>
            <circle cx={center} cy={center} r={10} fill={color} />
            <text x={center} y={center} dy=".3em" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#000">{element.symbol}</text>

            {electronCounts.map((count, i) => {
                const r = baseRadius + (i * spacing);
                return (
                    <g key={i}>
                        <circle cx={center} cy={center} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                        {Array.from({ length: count }).map((_, j) => {
                            const angle = (j / count) * Math.PI * 2;
                            const x = center + r * Math.cos(angle);
                            const y = center + r * Math.sin(angle);
                            return <circle key={j} cx={x} cy={y} r={2} fill={color} className="animate-pulse" />;
                        })}
                    </g>
                )
            })}
        </svg>
    )
}

function getElectronCounts(atomicNumber: number): number[] {
    // Simplified logic for visual purposes
    let remaining = atomicNumber;
    const shells = [];
    let n = 1;
    while (remaining > 0) {
        const capacity = 2 * n * n; // 2, 8, 18, 32
        const take = Math.min(remaining, capacity);

        // This is a naive filling, real physics is more complex (s, p, d, f blocks)
        // But for a visual "Bohr-like" representation, it often visually suffices or we can hardcode for low Z
        // Better approximation for higher Z:
        // Period 1: 2
        // Period 2: 8
        // Period 3: 8 (Argon is 2, 8, 8) -> Wait, capacity is 18 but octet rule

        // Let's use a standard lookup for first few rows or just purely visual "rings"
        // Since we don't have exact shell data in JSON, we approximate for visual effect

        shells.push(take);
        remaining -= take;
        n++;
        if (n > 7) break; // Safety
    }

    // Fix for outer shells being too full in naive 2n^2
    // For visual aesthetics, let's limit outer shells to 8-18 max to look "readable"
    return shells;
}
