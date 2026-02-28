'use client';

import { useState, useMemo } from 'react';
import { PERIODIC_TABLE_DATA, ElementData } from '@/data/periodicTableData';
import { CHEMICAL_COMPOUNDS, ChemicalCompound } from '@/data/chemicalCompounds';
import { Search, Info, Beaker, Thermometer, Box, Layers, Atom, Zap, Database, TestTube2, FlaskConical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_COLORS: Record<string, string> = {
    "alkali metal": "#ff3838",
    "alkaline earth metal": "#ffb8b8",
    "transition metal": "#c56cf0",
    "post-transition metal": "#17c0eb",
    "metalloid": "#32ff7e",
    "diatomic nonmetal": "#3ae374",
    "polyatomic nonmetal": "#67e6dc",
    "noble gas": "#7efff5",
    "lanthanide": "#ff9f1a",
    "actinide": "#ffaf40",
    "unknown": "#4b4b4b"
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

const COMPOUND_COLORS: Record<string, string> = {
    "Acid": "#ff3f34",
    "Base": "#0fbcf9",
    "Salt": "#ffc048",
    "Oxide": "#808e9b",
    "Organic": "#05c46b",
    "Mineral": "#b71540",
    "Alloy": "#d2dae2",
    "Gas": "#00d8d6",
    "Other": "#808e9b"
};

export default function PeriodicTableModule({ lang, dict }: { lang: string, dict: any }) {
    const [viewMode, setViewMode] = useState<'Elements' | 'Materials' | 'Bonds'>('Elements');
    const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
    const [selectedCompound, setSelectedCompound] = useState<ChemicalCompound | null>(null);
    const [selectedBond, setSelectedBond] = useState<string | null>(null);

    // Element Filters
    const [elementFilter, setElementFilter] = useState('');
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    // Compound Filters
    const [compoundFilter, setCompoundFilter] = useState('');
    const [compoundCategoryMode, setCompoundCategoryMode] = useState<string | null>(null);

    const filteredElements = useMemo(() => {
        if (!elementFilter) return PERIODIC_TABLE_DATA;
        const q = elementFilter.toLowerCase();
        return PERIODIC_TABLE_DATA.filter(e =>
            e.name.toLowerCase().includes(q) ||
            e.symbol.toLowerCase().includes(q) ||
            e.number.toString() === q
        );
    }, [elementFilter]);

    const filteredCompounds = useMemo(() => {
        let list = CHEMICAL_COMPOUNDS;
        if (compoundCategoryMode) {
            list = list.filter(c => c.category === compoundCategoryMode);
        }
        if (compoundFilter) {
            const q = compoundFilter.toLowerCase();
            list = list.filter(c => c.name.toLowerCase().includes(q) || c.formula.toLowerCase().includes(q));
        }
        return list;
    }, [compoundFilter, compoundCategoryMode]);

    // Grid placement logic
    const getGridPos = (el: ElementData) => {
        if (el.number >= 57 && el.number <= 71) return { row: 9, col: el.number - 57 + 3 };
        if (el.number >= 89 && el.number <= 103) return { row: 10, col: el.number - 89 + 3 };
        return { row: el.period, col: el.group };
    };

    const isDimmed = (el: ElementData) => {
        if (viewMode === 'Materials') {
            if (selectedCompound) {
                return !selectedCompound.elements.includes(el.number);
            }
            return false;
        }
        if (viewMode === 'Bonds') return true;

        if (hoveredCategory && el.category !== hoveredCategory) return true;
        if (elementFilter && !filteredElements.includes(el)) return true;
        return false;
    };

    const isActive = (el: ElementData) => {
        if (viewMode === 'Materials') {
            if (selectedCompound) {
                return selectedCompound.elements.includes(el.number);
            }
            return false;
        }
        if (viewMode === 'Bonds') return false;
        return selectedElement?.number === el.number;
    };

    const compoundCategories = Array.from(new Set(CHEMICAL_COMPOUNDS.map(c => c.category)));

    return (
        <div className="flex flex-col h-full bg-[#05070a] text-slate-200 overflow-hidden font-sans select-none">
            {/* TOOLBAR */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 px-6 py-4 border-b border-white/5 bg-[#0a0e14]/90 backdrop-blur-xl z-20 shrink-0">

                {/* Mode Switcher */}
                <div className="flex p-1 bg-black/40 rounded-lg border border-white/5 mr-0 sm:mr-4 shadow-inner shrink-0">
                    <button
                        onClick={() => { setViewMode('Elements'); setSelectedCompound(null); setSelectedBond(null); }}
                        className={`px-3 sm:px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'Elements' ? 'bg-[#00e5ff]/20 text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.2)]' : 'text-slate-500 hover:text-white'}`}
                    >
                        <Atom size={14} /> Elements
                    </button>
                    <button
                        onClick={() => { setViewMode('Materials'); setSelectedElement(null); setSelectedBond(null); }}
                        className={`px-3 sm:px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'Materials' ? 'bg-[#ff3f34]/20 text-[#ff3f34] shadow-[0_0_15px_rgba(255,63,52,0.2)]' : 'text-slate-500 hover:text-white'}`}
                    >
                        <FlaskConical size={14} /> Materials
                    </button>
                    <button
                        onClick={() => { setViewMode('Bonds'); setSelectedElement(null); setSelectedCompound(null); }}
                        className={`px-3 sm:px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'Bonds' ? 'bg-[#c56cf0]/20 text-[#c56cf0] shadow-[0_0_15px_rgba(197,108,240,0.2)]' : 'text-slate-500 hover:text-white'}`}
                    >
                        <Zap size={14} /> Bonds
                    </button>
                </div>

                {viewMode === 'Elements' ? (
                    <>
                        <div className="relative flex-1 max-w-md w-full group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                            <div className="relative flex items-center bg-[#0d131a] border border-cyan-900/30 rounded-xl overflow-hidden shadow-inner focus-within:border-[#00e5ff]/50 transition-colors">
                                <Search className="ml-3 text-cyan-500/50" size={16} />
                                <input
                                    type="text"
                                    placeholder="Type element name, symbol (e.g. Au)..."
                                    value={elementFilter}
                                    onChange={e => setElementFilter(e.target.value)}
                                    className="w-full bg-transparent px-3 py-2 text-xs text-cyan-50 placeholder-cyan-500/30 focus:outline-none font-mono"
                                />
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="hidden lg:flex flex-wrap gap-2 text-[9px] items-center justify-end flex-1 max-w-[50%]">
                            {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                                const color = CATEGORY_COLORS[key];
                                return (
                                    <div
                                        key={key}
                                        onMouseEnter={() => setHoveredCategory(key)}
                                        onMouseLeave={() => setHoveredCategory(null)}
                                        className="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-all duration-300 border border-white/5"
                                        style={{
                                            backgroundColor: hoveredCategory === key ? `${color}20` : '#ffffff05',
                                            borderColor: hoveredCategory === key ? `${color}40` : 'transparent',
                                            opacity: hoveredCategory && hoveredCategory !== key ? 0.3 : 1,
                                            boxShadow: hoveredCategory === key ? `0 0 10px ${color}20` : 'none'
                                        }}
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: color, color }} />
                                        <span className="uppercase font-bold tracking-widest text-slate-400" style={{ color: hoveredCategory === key ? color : undefined }}>{label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : viewMode === 'Materials' ? (
                    // Materials Toolbar
                    <>
                        <div className="relative flex-1 max-w-md w-full group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ff3f34]/20 to-[#ffc048]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                            <div className="relative flex items-center bg-[#0d131a] border border-[#ff3f34]/30 rounded-xl overflow-hidden shadow-inner focus-within:border-[#ff3f34]/50 transition-colors">
                                <Search className="ml-3 text-[#ff3f34]/50" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search molecules, acids, salts (e.g. H2O)..."
                                    value={compoundFilter}
                                    onChange={e => setCompoundFilter(e.target.value)}
                                    className="w-full bg-transparent px-3 py-2 text-xs text-[#ff3f34]/90 placeholder-[#ff3f34]/30 focus:outline-none font-mono"
                                />
                            </div>
                        </div>
                        <div className="hidden lg:flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setCompoundCategoryMode(null)}
                                className={`px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold rounded shrink-0 ${!compoundCategoryMode ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                            >
                                All
                            </button>
                            {compoundCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCompoundCategoryMode(cat)}
                                    className={`px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold rounded transition-colors shrink-0 ${compoundCategoryMode === cat ? 'text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                                    style={{ backgroundColor: compoundCategoryMode === cat ? COMPOUND_COLORS[cat] : 'transparent', border: compoundCategoryMode === cat ? 'none' : `1px solid ${COMPOUND_COLORS[cat]}40` }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex justify-end">
                        <div className="text-[10px] uppercase font-mono tracking-widest text-[#c56cf0] flex items-center gap-2 px-4 py-1.5 border border-[#c56cf0]/30 rounded-lg bg-[#c56cf0]/10 shadow-[0_0_15px_rgba(197,108,240,0.1)]">
                            <Zap size={14} className="animate-pulse" /> Chemical Bonds Visualization Engine Active
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                {/* MATERIALS SIDEBAR (Left) */}
                <AnimatePresence>
                    {viewMode === 'Materials' && (
                        <motion.div
                            initial={{ x: '-100%', opacity: 0, width: 0 }}
                            animate={{ x: 0, opacity: 1, width: 320 }}
                            exit={{ x: '-100%', opacity: 0, width: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-[#05090e]/95 backdrop-blur-2xl border-r border-[#ff3f34]/20 flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)] shrink-0 absolute left-0 top-0 bottom-0 sm:relative"
                        >
                            <div className="p-4 border-b border-white/5 bg-black/40 shrink-0">
                                <h2 className="text-[10px] font-bold text-[#ff3f34] uppercase tracking-widest flex items-center gap-2">
                                    <Database size={14} /> Material Database
                                </h2>
                                <p className="text-[9px] text-white/40 mt-1 uppercase tracking-wider">Select a material to analyze its structure</p>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2">
                                {filteredCompounds.map(compound => {
                                    const isSel = selectedCompound?.id === compound.id;
                                    const cColor = COMPOUND_COLORS[compound.category];
                                    return (
                                        <button
                                            key={compound.id}
                                            onClick={() => setSelectedCompound(compound)}
                                            className={`text-left p-3 rounded-lg border transition-all duration-200 group relative overflow-hidden
                                                ${isSel ? 'bg-white/[0.08] shadow-[0_5px_15px_rgba(0,0,0,0.5)]' : 'bg-transparent border-transparent hover:bg-white/[0.04]'}`}
                                            style={{ borderColor: isSel ? `${cColor}60` : 'transparent' }}
                                        >
                                            {isSel && <div className="absolute left-0 top-0 bottom-0 w-1 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: cColor, color: cColor }} />}
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-xs font-bold ${isSel ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{compound.name}</span>
                                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold shrink-0 ml-2" style={{ backgroundColor: `${cColor}20`, color: cColor }}>{compound.category}</span>
                                            </div>
                                            <div className="text-[10px] font-mono text-cyan-400 font-bold">{compound.formula}</div>
                                        </button>
                                    )
                                })}
                                {filteredCompounds.length === 0 && (
                                    <div className="text-center p-8 text-white/30 text-[10px] uppercase font-bold tracking-widest">
                                        No materials found.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                    {viewMode === 'Bonds' && (
                        <motion.div
                            initial={{ x: '-100%', opacity: 0, width: 0 }}
                            animate={{ x: 0, opacity: 1, width: 320 }}
                            exit={{ x: '-100%', opacity: 0, width: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-[#05090e]/95 backdrop-blur-2xl border-r border-[#c56cf0]/20 flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)] shrink-0 absolute left-0 top-0 bottom-0 sm:relative"
                        >
                            <div className="p-4 border-b border-white/5 bg-black/40 shrink-0">
                                <h2 className="text-[10px] font-bold text-[#c56cf0] uppercase tracking-widest flex items-center gap-2">
                                    <Zap size={14} /> Bond Topologies
                                </h2>
                                <p className="text-[9px] text-white/40 mt-1 uppercase tracking-wider">Select interaction force</p>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2">
                                {[
                                    { id: 'ionic', name: 'Ionic Bond', desc: 'Electrostatic force between oppositely charged ions', color: '#ff3838' },
                                    { id: 'covalent', name: 'Covalent Bond', desc: 'Sharing of electron pairs between atoms', color: '#3ae374' },
                                    { id: 'hydrogen', name: 'Hydrogen Bond', desc: 'Dipole-dipole attraction', color: '#0fbcf9' },
                                    { id: 'london', name: 'London Dispersion', desc: 'Temporary quantum fluctuation forces', color: '#a29bfe' }
                                ].map(bond => {
                                    const isSel = selectedBond === bond.id;
                                    return (
                                        <button
                                            key={bond.id}
                                            onClick={() => setSelectedBond(bond.id)}
                                            className={`text-left p-4 rounded-lg border transition-all duration-200 group relative overflow-hidden ${isSel ? 'bg-white/[0.08] shadow-[0_5px_15px_rgba(0,0,0,0.5)]' : 'bg-transparent border-transparent hover:bg-white/[0.04]'}`}
                                            style={{ borderColor: isSel ? `${bond.color}60` : 'transparent' }}
                                        >
                                            {isSel && <div className="absolute left-0 top-0 bottom-0 w-1 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: bond.color, color: bond.color }} />}
                                            <div className="text-sm font-black text-white mb-1 uppercase tracking-widest">{bond.name}</div>
                                            <div className="text-[10px] text-slate-400 font-medium leading-relaxed tracking-wide">{bond.desc}</div>
                                        </button>
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>


                {/* MAIN TABLE AREA */}
                {viewMode === 'Bonds' ? (
                    <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative custom-scrollbar z-10 w-full" style={{ minWidth: 0 }}>
                        <BondVisualizer type={selectedBond} />
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto p-4 flex items-center justify-start lg:justify-center relative custom-scrollbar z-10 w-full" style={{ minWidth: 0, paddingLeft: viewMode === 'Materials' ? '340px' : '16px' }}>
                        <div
                            className="grid gap-1.5 relative shrink-0"
                            style={{
                                gridTemplateColumns: 'repeat(18, minmax(30px, 1fr))',
                                gridTemplateRows: 'repeat(10, minmax(30px, 1fr))',
                                width: '1000px', // Fixed baseline width for table to prevent stacking
                                height: '580px'  // Fixed baseline height
                            }}
                        >
                            {PERIODIC_TABLE_DATA.map(el => {
                                const pos = getGridPos(el);
                                const active = isActive(el);
                                const dimmed = isDimmed(el);
                                const color = CATEGORY_COLORS[el.category];

                                let displayColor = color;
                                let bgColor = `${color}15`;
                                let borderColor = `${color}40`;

                                // If we are in Materials mode and this element is part of the selected compound
                                if (viewMode === 'Materials' && active && selectedCompound) {
                                    // Use the compound's color for the highlight
                                    displayColor = COMPOUND_COLORS[selectedCompound.category] || color;
                                    bgColor = `${displayColor}30`;
                                    borderColor = displayColor;
                                } else if (active && viewMode === 'Elements') {
                                    bgColor = `${color}dd`;
                                    borderColor = '#ffffff';
                                }

                                return (
                                    <motion.button
                                        key={el.number}
                                        onClick={() => {
                                            if (viewMode === 'Elements') {
                                                setSelectedElement(el);
                                            }
                                        }}
                                        layoutId={`el-${el.number}`}
                                        className={`relative flex flex-col items-center justify-center transition-all duration-300 border backdrop-blur-sm
                                        ${active ? 'z-30 rounded-lg scale-125 shadow-[0_10px_30px_rgba(0,0,0,0.8)]' : 'rounded-md hover:scale-110 hover:z-20 hover:rounded-lg'}`}
                                        style={{
                                            gridColumn: pos.col,
                                            gridRow: pos.row,
                                            backgroundColor: dimmed ? '#ffffff02' : bgColor,
                                            borderColor: dimmed ? '#ffffff05' : borderColor,
                                            boxShadow: active ? `0 0 30px ${displayColor}60, inset 0 0 10px ${displayColor}40` : (dimmed ? 'none' : `inherit`),
                                            opacity: dimmed ? 0.3 : (active ? 1 : 0.8),
                                            filter: dimmed ? 'grayscale(100%)' : 'none',
                                            cursor: viewMode === 'Elements' ? 'pointer' : 'default',
                                        }}
                                    >
                                        <span className={`text-[8px] absolute top-1 left-1.5 font-mono font-bold ${active && viewMode === 'Elements' ? 'text-black/60' : 'text-white/40'}`}>
                                            {el.number}
                                        </span>

                                        {/* Composition Badge in Materials Mode */}
                                        {viewMode === 'Materials' && active && selectedCompound && (
                                            <div className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg border border-black/20"
                                                style={{ backgroundColor: displayColor, color: '#000' }}>
                                                {selectedCompound.composition[el.number]}
                                            </div>
                                        )}

                                        <span className={`text-base font-black tracking-tighter ${active && viewMode === 'Elements' ? 'text-white' : 'text-slate-200'} ${viewMode === 'Materials' && active ? 'text-white scale-125 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : ''}`} style={{ textShadow: active ? '0 2px 4px rgba(0,0,0,0.5)' : 'none' }}>
                                            {el.symbol}
                                        </span>
                                        <span className={`text-[6px] truncate leading-none max-w-[90%] font-bold uppercase ${active && viewMode === 'Elements' ? 'text-black/80' : 'text-white/40'} ${viewMode === 'Materials' && active ? 'text-white/80' : ''}`}>
                                            {el.name}
                                        </span>

                                        {viewMode === 'Materials' && active && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none rounded-lg" />
                                        )}
                                    </motion.button>
                                );
                            })}

                            {/* Spacers for Period 6/7 */}
                            <div className="flex items-center justify-center text-[7px] font-mono tracking-widest text-slate-600 uppercase" style={{ gridColumn: 3, gridRow: 6 }}>57-71</div>
                            <div className="flex items-center justify-center text-[7px] font-mono tracking-widest text-slate-600 uppercase" style={{ gridColumn: 3, gridRow: 7 }}>89-103</div>
                        </div>
                    </div>
                )}

                {/* DETAILS SIDEBAR (Right) */}
                <AnimatePresence mode="wait">
                    {/* ELEMENT DETAILS */}
                    {viewMode === 'Elements' && selectedElement && (
                        <motion.div
                            key="element-details"
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-[380px] sm:w-[420px] bg-[#0a0e14]/90 backdrop-blur-3xl border-l border-white/5 overflow-y-auto custom-scrollbar relative z-30 shadow-[-20px_0_50px_rgba(0,0,0,0.7)] shrink-0 absolute right-0 top-0 bottom-0 sm:relative"
                        >
                            <div className="h-1 w-full" style={{ backgroundColor: CATEGORY_COLORS[selectedElement.category] }}></div>
                            <div className="p-6 sm:p-8 pt-10">
                                <button onClick={() => setSelectedElement(null)} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors bg-black/40 p-1.5 rounded-full z-50">
                                    <XIcon />
                                </button>
                                <div className="flex flex-col items-center mb-8 relative">
                                    <div className="absolute inset-0 blur-[80px] opacity-30 pointer-events-none" style={{ backgroundColor: CATEGORY_COLORS[selectedElement.category] }}></div>
                                    <motion.div layoutId={`el-${selectedElement.number}`} className="w-32 h-32 rounded-2xl flex flex-col items-center justify-center mb-6 border-b-[3px] shadow-2xl relative z-10"
                                        style={{ backgroundColor: CATEGORY_COLORS[selectedElement.category], borderColor: 'rgba(255,255,255,0.4)', color: '#000' }}
                                    >
                                        <div className="text-sm font-mono font-black opacity-60 absolute top-2 left-3">{selectedElement.number}</div>
                                        <div className="text-6xl font-black tracking-tighter" style={{ textShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>{selectedElement.symbol}</div>
                                        <div className="text-xs font-bold opacity-80 absolute bottom-2">{selectedElement.mass.toFixed(3)}</div>
                                    </motion.div>
                                    <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight text-center z-10">{selectedElement.name}</h2>
                                    <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[2px] border mb-6 z-10"
                                        style={{ backgroundColor: `${CATEGORY_COLORS[selectedElement.category]}15`, color: CATEGORY_COLORS[selectedElement.category], borderColor: `${CATEGORY_COLORS[selectedElement.category]}40` }}
                                    >
                                        {selectedElement.category}
                                    </div>
                                    <p className="text-sm text-slate-300 text-center leading-relaxed font-medium z-10">
                                        {selectedElement.summary}
                                    </p>
                                </div>
                                <div className="mb-6 p-5 rounded-2xl border border-white/5 bg-black/40 relative overflow-hidden group shadow-inner">
                                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                                        <Atom size={14} className="text-cyan-500" /> Atomic Structure
                                    </h3>
                                    <div className="flex justify-center my-6">
                                        <BohrModel element={selectedElement} color={CATEGORY_COLORS[selectedElement.category]} />
                                    </div>
                                    <div className="mt-4 p-3 bg-[#05070a] rounded-xl border border-white/5 font-mono text-xs text-center text-cyan-200 shadow-inner tracking-widest">
                                        {selectedElement.electron_configuration}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <PropCard icon={<Thermometer />} label="Melting Point" value={selectedElement.melt ? `${selectedElement.melt} K` : 'N/A'} sub={selectedElement.melt ? `${(selectedElement.melt - 273.15).toFixed(1)}°C` : ''} color="#ff7675" />
                                    <PropCard icon={<Thermometer />} label="Boiling Point" value={selectedElement.boil ? `${selectedElement.boil} K` : 'N/A'} sub={selectedElement.boil ? `${(selectedElement.boil - 273.15).toFixed(1)}°C` : ''} color="#fdcb6e" />
                                    <PropCard icon={<Box />} label="Density" value={selectedElement.density ? `${selectedElement.density} g/cm³` : 'N/A'} color="#74b9ff" />
                                    <PropCard icon={<Layers />} label="Position" value={`Grp ${selectedElement.group} / Per ${selectedElement.period}`} color="#a29bfe" />
                                </div>
                                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between shadow-inner">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">
                                            <Search size={14} className="text-cyan-400" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Discovered</span>
                                    </div>
                                    <div className="text-sm font-bold text-white text-right max-w-[150px] sm:max-w-[180px] truncate">
                                        {selectedElement.discovered_by || 'Unknown'}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* COMPOUND DETAILS */}
                    {viewMode === 'Materials' && selectedCompound && (
                        <motion.div
                            key="compound-details"
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-[380px] sm:w-[450px] bg-[#0a0e14]/95 backdrop-blur-3xl border-l border-white/5 overflow-y-auto custom-scrollbar relative z-30 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] shrink-0 absolute right-0 top-0 bottom-0 sm:relative"
                        >
                            <div className="h-1.5 w-full" style={{ backgroundColor: COMPOUND_COLORS[selectedCompound.category] }}></div>

                            <div className="p-6 sm:p-8 pt-10">
                                <button onClick={() => setSelectedCompound(null)} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors bg-black/40 p-1.5 rounded-full z-50">
                                    <XIcon />
                                </button>

                                <div className="flex flex-col items-center mb-8 relative pt-4">
                                    <div className="absolute inset-0 blur-[100px] opacity-30 pointer-events-none" style={{ backgroundColor: COMPOUND_COLORS[selectedCompound.category] }}></div>

                                    <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[3px] border mb-4 shadow-lg z-10"
                                        style={{ backgroundColor: `${COMPOUND_COLORS[selectedCompound.category]}20`, color: COMPOUND_COLORS[selectedCompound.category], borderColor: `${COMPOUND_COLORS[selectedCompound.category]}50` }}
                                    >
                                        {selectedCompound.category} Material
                                    </div>

                                    <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tighter text-center leading-tight drop-shadow-2xl relative z-10">{selectedCompound.name}</h2>

                                    <div className="bg-black/80 px-8 py-4 rounded-2xl border shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] mb-6 z-10"
                                        style={{ borderColor: `${COMPOUND_COLORS[selectedCompound.category]}40` }}>
                                        <span className="text-4xl font-mono font-bold tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ color: COMPOUND_COLORS[selectedCompound.category] }}>
                                            {selectedCompound.formula}
                                        </span>
                                    </div>

                                    <p className="text-sm text-slate-300 text-center leading-relaxed font-medium relative z-10 max-w-[90%]">
                                        {selectedCompound.description}
                                    </p>
                                </div>

                                {/* Structural Elements */}
                                <div className="mb-6 p-5 rounded-2xl border border-white/5 bg-[#05070a]/80 relative overflow-hidden group shadow-inner">
                                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                                        <Layers size={14} style={{ color: COMPOUND_COLORS[selectedCompound.category] }} /> Elemental Composition
                                    </h3>

                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        {selectedCompound.elements.map(zNumber => {
                                            const el = PERIODIC_TABLE_DATA.find(e => e.number === zNumber)!;
                                            const count = selectedCompound.composition[zNumber];
                                            const eColor = CATEGORY_COLORS[el.category];
                                            return (
                                                <div key={zNumber} className="flex items-center p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] group-hover:bg-white/[0.05] transition-colors relative overflow-hidden">
                                                    <div className="absolute right-0 bottom-0 w-8 h-8 opacity-10 pointer-events-none" style={{ backgroundColor: eColor, filter: 'blur(10px)' }}></div>
                                                    <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 border-b-2 shadow-lg"
                                                        style={{ backgroundColor: eColor, color: '#000', borderColor: 'rgba(255,255,255,0.4)' }}>
                                                        <span className="text-sm font-black">{el.symbol}</span>
                                                    </div>
                                                    <div className="ml-3 flex-1 flex flex-col justify-center">
                                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider truncate">{el.name}</span>
                                                        <span className="text-[9px] text-slate-400 font-mono mt-0.5">Atoms: <strong className="text-xs" style={{ color: COMPOUND_COLORS[selectedCompound.category] }}>{count}</strong></span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Material Properties */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <PropCard icon={<Atom />} label="Molar Mass" value={selectedCompound.properties.molarMass ? `${selectedCompound.properties.molarMass} g/mol` : 'Unknown'} color="#a29bfe" />
                                    <PropCard icon={<Box />} label="Density" value={selectedCompound.properties.density ? `${selectedCompound.properties.density} g/cm³` : 'Unknown'} color="#74b9ff" />
                                    <PropCard icon={<Thermometer />} label="Melting Point" value={selectedCompound.properties.meltPoint ? `${selectedCompound.properties.meltPoint} K` : 'N/A'} sub={selectedCompound.properties.meltPoint ? `${(selectedCompound.properties.meltPoint - 273.15).toFixed(1)}°C` : ''} color="#ff7675" />
                                    <PropCard icon={<Beaker />} label="State at STP" value={selectedCompound.properties.stateAtSTP || 'Unknown'} color="#55efc4" />
                                </div>

                                {/* Extra Information */}
                                {(selectedCompound.synthesis || selectedCompound.applications) && (
                                    <div className="mb-6 flex flex-col gap-3">
                                        {selectedCompound.synthesis && (
                                            <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                                                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5"><Beaker size={12} /> Synthesis & Production</div>
                                                <div className="text-xs text-slate-300 leading-relaxed">{selectedCompound.synthesis}</div>
                                            </div>
                                        )}
                                        {selectedCompound.applications && (
                                            <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                                                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5"><Box size={12} /> Industrial Use</div>
                                                <div className="text-xs text-slate-300 leading-relaxed">{selectedCompound.applications}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Dominant Bond Topology */}
                                {selectedCompound.bondType && (
                                    <div className="mb-6 p-5 rounded-2xl border border-white/5 bg-[#05070a]/80 relative overflow-hidden group shadow-inner flex flex-col items-center">
                                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4 w-full">
                                            <Zap size={14} style={{ color: COMPOUND_COLORS[selectedCompound.category] }} /> Dominant Bond Topology
                                        </h3>

                                        <div className="w-full relative h-[220px] rounded-xl overflow-hidden border border-white/5 bg-[#090b10] flex items-center justify-center shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] mt-2 pointer-events-none">
                                            <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                            <div className="absolute inset-0 flex items-center justify-center pt-8" style={{ transform: 'scale(0.48)', transformOrigin: 'center center' }}>
                                                <BondVisualizer
                                                    type={selectedCompound.bondType}
                                                    mini={true}
                                                    symbols={selectedCompound.elements.map(z => PERIODIC_TABLE_DATA.find(e => e.number === z)?.symbol || '')}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-[9px] uppercase tracking-[2px] font-black text-white/70 text-center w-full">
                                            {selectedCompound.bondType === 'ionic' ? 'Ionic Bond (Electrostatic)' :
                                                selectedCompound.bondType === 'covalent' ? 'Covalent Bond (Electron Sharing)' :
                                                    selectedCompound.bondType === 'hydrogen' ? 'Hydrogen Bond (Dipole)' : 'London Dispersion (Fluctuating)'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Reuse PropCard
function PropCard({ icon, label, value, sub, color }: { icon: any, label: string, value: string, sub?: string, color: string }) {
    return (
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-inner">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity" style={{ color }}>
                <div className="w-5 h-5">{icon}</div>
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 z-10">{label}</div>
            <div className="text-sm sm:text-base font-black text-white font-mono z-10">{value}</div>
            {sub && <div className="text-[10px] text-slate-400 font-mono mt-1 z-10">{sub}</div>}
            {/* Ambient lighting line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-50" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        </div>
    );
}

// Mini X Icon
function XIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    )
}

function BohrModel({ element, color }: { element: ElementData, color: string }) {
    const shells = element.period;
    const baseRadius = 25;
    const spacing = 18;
    const svgSize = (baseRadius + (shells * spacing)) * 2 + 20;
    const center = svgSize / 2;

    const electronCounts = getElectronCounts(element.number);

    return (
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="overflow-visible">
            <defs>
                <radialGradient id={`glow-${element.number}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
            </defs>
            <circle cx={center} cy={center} r={20} fill={`url(#glow-${element.number})`} className="animate-pulse" />

            <circle cx={center} cy={center} r={12} fill={color} stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
            <text x={center} y={center} dy=".3em" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="900" fill="#000">{element.symbol}</text>

            <g className="animate-spin-slow" style={{ animationDuration: '40s', transformOrigin: `${center}px ${center}px` }}>
                {electronCounts.map((count, i) => {
                    const r = baseRadius + (i * spacing);
                    return (
                        <g key={i}>
                            <circle cx={center} cy={center} r={r} fill="none" stroke={color} strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 2" />
                            <g className="animate-spin-slow" style={{ animationDuration: `${20 + i * 10}s`, transformOrigin: `${center}px ${center}px`, animationDirection: i % 2 === 0 ? 'normal' : 'reverse' }}>
                                {Array.from({ length: count }).map((_, j) => {
                                    const angle = (j / count) * Math.PI * 2;
                                    const x = center + r * Math.cos(angle);
                                    const y = center + r * Math.sin(angle);
                                    return (
                                        <g key={j}>
                                            <circle cx={x} cy={y} r={4} fill={color} opacity="0.3" className="animate-ping" />
                                            <circle cx={x} cy={y} r={2.5} fill="#fff" stroke={color} strokeWidth="1" />
                                        </g>
                                    );
                                })}
                            </g>
                        </g>
                    )
                })}
            </g>
        </svg>
    )
}

function getElectronCounts(atomicNumber: number): number[] {
    let remaining = atomicNumber;
    const shells = [];
    let n = 1;
    while (remaining > 0) {
        const capacity = 2 * n * n;
        const take = Math.min(remaining, capacity);
        shells.push(take);
        remaining -= take;
        n++;
        if (n > 7) break;
    }
    return shells.map(c => Math.min(c, 32));
}

function BondVisualizer({ type, mini = false, symbols }: { type: string | null, mini?: boolean, symbols?: string[] }) {
    if (!type) {
        return (
            <div className="flex flex-col items-center justify-center text-white/20 uppercase font-mono tracking-widest text-[10px] w-full h-full max-w-4xl max-h-[800px] border border-white/5 rounded-2xl bg-black/40 backdrop-blur-xl shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
                <Zap size={32} className="mb-4 opacity-50" />
                Select a bond topology from the database to initialize visualization sequence.
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className={`relative w-full h-full flex flex-col items-center justify-center max-w-4xl max-h-[800px] ${mini ? '' : 'border border-white/5 rounded-2xl bg-[#090b10] shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] overflow-hidden'}`}
        >
            {/* Cyber Grid Background */}
            {!mini && <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>}

            {type === 'ionic' && <IonicVisualizer symbols={symbols} />}
            {type === 'covalent' && <CovalentVisualizer symbols={symbols} />}
            {type === 'hydrogen' && <HydrogenVisualizer symbols={symbols} />}
            {type === 'london' && <LondonVisualizer symbols={symbols} />}
        </motion.div>
    )
}

function IonicVisualizer({ symbols }: { symbols?: string[] }) {
    const sym1 = symbols?.[0] || 'M';
    const sym2 = symbols?.[1] || 'X';
    return (
        <svg width="600" height="400" viewBox="0 0 600 400" className="overflow-visible select-none drop-shadow-2xl">
            <defs>
                <filter id="neon-red"><feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#ff3838" floodOpacity="0.8" /></filter>
                <filter id="neon-cyan"><feDropShadow dx="0" dy="0" stdDeviation="15" floodColor="#00e5ff" floodOpacity="0.8" /></filter>
            </defs>
            {/* Cation */}
            <g transform="translate(150, 200)">
                <circle cx="0" cy="0" r="50" fill="none" stroke="#ff3838" strokeWidth="2" strokeDasharray="4 4" filter="url(#neon-red)" />
                <circle cx="0" cy="0" r="20" fill="#ff3838" />
                <text x="0" y="5" textAnchor="middle" fill="#000" fontSize="14" fontWeight="bold" fontFamily="monospace">{sym1}</text>
                <text x="0" y="35" textAnchor="middle" fill="#ff3838" fontSize="12" fontWeight="bold" fontFamily="monospace">[+]</text>
                {/* Electron moving away */}
                <motion.circle
                    cx="0" cy="-50" r="5" fill="#fff" filter="url(#neon-red)"
                    animate={{ x: [0, 150, 300], y: [-50, -100, -50] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            </g>
            {/* Anion */}
            <g transform="translate(450, 200)">
                <circle cx="0" cy="0" r="70" fill="none" stroke="#00e5ff" strokeWidth="2" strokeDasharray="4 4" filter="url(#neon-cyan)" />
                <circle cx="0" cy="0" r="25" fill="#00e5ff" />
                <text x="0" y="5" textAnchor="middle" fill="#000" fontSize="14" fontWeight="bold" fontFamily="monospace">{sym2}</text>
                <text x="0" y="45" textAnchor="middle" fill="#00e5ff" fontSize="12" fontWeight="bold" fontFamily="monospace">[-]</text>
            </g>

            <g transform="translate(300, 200)">
                <motion.path d="M-80 0 L80 0" stroke="#fff" strokeWidth="2" strokeDasharray="5 5" opacity="0.5"
                    animate={{ strokeDashoffset: [0, -20] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <text x="0" y="-15" textAnchor="middle" fill="#fff" fontSize="10" fontFamily="monospace" letterSpacing="2">ELECTROSTATIC ATTRACTION</text>
            </g>
        </svg>
    )
}

function CovalentVisualizer({ symbols }: { symbols?: string[] }) {
    const sym1 = symbols?.[0] || 'A';
    const sym2 = symbols?.[1] || 'B';
    return (
        <svg width="600" height="400" viewBox="0 0 600 400" className="overflow-visible select-none drop-shadow-2xl">
            <defs>
                <filter id="neon-green"><feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#3ae374" floodOpacity="0.8" /></filter>
            </defs>
            <g transform="translate(300, 200)">
                {/* Left Atom inner */}
                <circle cx="-60" cy="0" r="20" fill="#3ae374" />
                <text x="-60" y="5" textAnchor="middle" fill="#000" fontSize="14" fontWeight="bold" fontFamily="monospace">{sym1}</text>

                {/* Right Atom inner */}
                <circle cx="60" cy="0" r="20" fill="#3ae374" />
                <text x="60" y="5" textAnchor="middle" fill="#000" fontSize="14" fontWeight="bold" fontFamily="monospace">{sym2}</text>

                {/* Left Orbital */}
                <circle cx="-60" cy="0" r="70" fill="none" stroke="#3ae374" strokeWidth="2" strokeDasharray="4 4" filter="url(#neon-green)" opacity="0.6" />
                {/* Right Orbital */}
                <circle cx="60" cy="0" r="70" fill="none" stroke="#3ae374" strokeWidth="2" strokeDasharray="4 4" filter="url(#neon-green)" opacity="0.6" />

                {/* Overlap Area Highlight */}
                <path d="M 0 -45 A 70 70 0 0 0 0 45 A 70 70 0 0 0 0 -45" fill="#3ae374" opacity="0.2" filter="url(#neon-green)" />

                {/* Shared Electrons */}
                <motion.circle cx="0" cy="-15" r="5" fill="#fff" filter="url(#neon-green)"
                    animate={{ cy: [-15, -20, -15], cx: [-5, 5, -5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.circle cx="0" cy="15" r="5" fill="#fff" filter="url(#neon-green)"
                    animate={{ cy: [15, 20, 15], cx: [5, -5, 5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.circle cx="0" cy="-30" r="5" fill="#fff" filter="url(#neon-green)"
                    animate={{ cy: [-30, -35, -30], cx: [5, -5, 5] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.circle cx="0" cy="30" r="5" fill="#fff" filter="url(#neon-green)"
                    animate={{ cy: [30, 35, 30], cx: [-5, 5, -5] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />

                <text x="0" y="-95" textAnchor="middle" fill="#3ae374" fontSize="10" fontFamily="monospace" letterSpacing="2">SHARED ELECTRON CLOUD</text>
            </g>
        </svg>
    )
}

function HydrogenVisualizer({ symbols }: { symbols?: string[] }) {
    const sym1 = symbols?.[0] || 'X';
    const sym2 = symbols?.[1] || 'Y';
    return (
        <svg width="600" height="400" viewBox="0 0 600 400" className="overflow-visible select-none drop-shadow-2xl">
            <defs>
                <filter id="neon-cyan-2"><feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#0fbcf9" floodOpacity="0.8" /></filter>
                <filter id="neon-red-2"><feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#ff3838" floodOpacity="0.8" /></filter>
            </defs>

            {/* Molecule 1 */}
            <g transform="translate(180, 150) rotate(-20)">
                <circle cx="0" cy="0" r="30" fill="#ff3838" filter="url(#neon-red-2)" />
                <text x="0" y="5" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="monospace">{sym1}δ-</text>

                <line x1="0" y1="0" x2="-40" y2="40" stroke="#fff" strokeWidth="4" />
                <circle cx="-40" cy="40" r="15" fill="#0fbcf9" filter="url(#neon-cyan-2)" />
                <text x="-40" y="44" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold" fontFamily="monospace">Hδ+</text>

                <line x1="0" y1="0" x2="40" y2="40" stroke="#fff" strokeWidth="4" />
                <circle cx="40" cy="40" r="15" fill="#0fbcf9" filter="url(#neon-cyan-2)" />
                <text x="40" y="44" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold" fontFamily="monospace">Hδ+</text>
            </g>

            {/* Molecule 2 */}
            <g transform="translate(420, 250) rotate(10)">
                <circle cx="0" cy="0" r="30" fill="#ff3838" filter="url(#neon-red-2)" />
                <text x="0" y="5" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="monospace">{sym2}δ-</text>

                <line x1="0" y1="0" x2="-40" y2="-40" stroke="#fff" strokeWidth="4" />
                <circle cx="-40" cy="-40" r="15" fill="#0fbcf9" filter="url(#neon-cyan-2)" />
                <text x="-40" y="-36" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold" fontFamily="monospace">Hδ+</text>

                <line x1="0" y1="0" x2="40" y2="-40" stroke="#fff" strokeWidth="4" />
                <circle cx="40" cy="-40" r="15" fill="#0fbcf9" filter="url(#neon-cyan-2)" />
                <text x="40" y="-36" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold" fontFamily="monospace">Hδ+</text>
            </g>

            {/* Hydrogen Bond Line */}
            <motion.line x1="220" y1="185" x2="380" y2="215" stroke="#00e5ff" strokeWidth="3" strokeDasharray="8 8" filter="url(#neon-cyan-2)"
                animate={{ strokeDashoffset: [0, -16], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <text x="300" y="190" textAnchor="middle" fill="#00e5ff" fontSize="10" fontFamily="monospace" letterSpacing="2" transform="rotate(10 300 190)">HYDROGEN BOND</text>

        </svg>
    )
}

function LondonVisualizer({ symbols }: { symbols?: string[] }) {
    const sym1 = symbols?.[0] || 'A';
    const sym2 = symbols?.[1] || 'A';
    return (
        <svg width="600" height="400" viewBox="0 0 600 400" className="overflow-visible select-none drop-shadow-2xl">
            <defs>
                <filter id="neon-purple"><feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#a29bfe" floodOpacity="0.8" /></filter>
                <linearGradient id="cloud-left" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a29bfe" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#a29bfe" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="cloud-right" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a29bfe" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#a29bfe" stopOpacity="0.1" />
                </linearGradient>
            </defs>

            <g transform="translate(180, 200)">
                {/* Fluctuating Electron Cloud */}
                <motion.ellipse cx="0" cy="0" rx="70" ry="50" fill="url(#cloud-left)" filter="url(#neon-purple)"
                    animate={{ rx: [70, 80, 70], cx: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <circle cx="0" cy="0" r="15" fill="#a29bfe" />
                <text x="0" y="4" textAnchor="middle" fill="#000" fontSize="12" fontWeight="bold" fontFamily="monospace">{sym1}</text>
                <motion.text x="35" y="4" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="monospace"
                    animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >δ-</motion.text>
                <motion.text x="-35" y="4" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="monospace"
                    animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >δ+</motion.text>
            </g>

            <g transform="translate(420, 200)">
                <motion.ellipse cx="0" cy="0" rx="70" ry="50" fill="url(#cloud-right)" filter="url(#neon-purple)"
                    animate={{ rx: [70, 80, 70], cx: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                />
                <circle cx="0" cy="0" r="15" fill="#a29bfe" />
                <text x="0" y="4" textAnchor="middle" fill="#000" fontSize="12" fontWeight="bold" fontFamily="monospace">{sym2}</text>
                <motion.text x="-35" y="4" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="monospace"
                    animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                >δ+</motion.text>
                <motion.text x="35" y="4" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="monospace"
                    animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                >δ-</motion.text>
            </g>

            <motion.g animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                <line x1="260" y1="200" x2="340" y2="200" stroke="#a29bfe" strokeWidth="2" strokeDasharray="4 4" filter="url(#neon-purple)" />
                <text x="300" y="180" textAnchor="middle" fill="#a29bfe" fontSize="10" fontFamily="monospace" letterSpacing="1">INDUCED DIPOLE ATTRACTION</text>
            </motion.g>

        </svg>
    )
}
