"use client";
import { useState, useMemo, useEffect } from 'react';

import {
    BEARING_CATALOG,
    BearingData,
    BearingType,
    detectBearingType,
    getBearingTypeInfo,
    getBearingsByType,
    findBearing,
    calculateBearingLife
} from "@/data/skfBearings";
import { CalculatorInput } from "@/components/CalculatorInput";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";
import { Search, Info, AlertTriangle, CheckCircle, Save } from 'lucide-react';
import { SaveButton } from '@/components/calculation/SaveButton';

const BEARING_TYPE_FILTERS: { id: BearingType | 'all'; label: string; labelTr: string }[] = [
    { id: 'all', label: 'All Types', labelTr: 'Tüm Tipler' },
    { id: 'deep-groove-ball', label: 'Deep Groove', labelTr: 'Sabit Bilyalı' },
    { id: 'angular-contact-ball', label: 'Angular Contact', labelTr: 'Açısal Temaslı' },
    { id: 'tapered-roller', label: 'Tapered Roller', labelTr: 'Konik Makaralı' },
    { id: 'cylindrical-roller', label: 'Cylindrical', labelTr: 'Silindirik' },
    { id: 'needle-roller', label: 'Needle', labelTr: 'İğne Makaralı' },
    { id: 'thrust-ball', label: 'Thrust Ball', labelTr: 'Eksenel Bilyalı' },
];

import { getBearingsPageStrings, getBearingFilterLabel } from '@/locales/bearingsPageTranslations';

export default function BearingsPageClient({ dict, lang }: { dict: any, lang: string }) {
    const s = getBearingsPageStrings(lang);
    // Search & Filter State
    const [searchCode, setSearchCode] = useState('');
    const [typeFilter, setTypeFilter] = useState<BearingType | 'all'>('all');
    const [selectedBearing, setSelectedBearing] = useState<BearingData>(BEARING_CATALOG[14]); // 6204 default

    // Load Inputs
    const [fr, setFr] = useState(5000);  // Radial Load (N) -> convert to kN for calc
    const [fa, setFa] = useState(1000);  // Axial Load (N)
    const [rpm, setRpm] = useState(3000);
    const [reliability, setReliability] = useState(90);

    // Filtered bearings list
    const filteredBearings = useMemo(() => {
        let list = BEARING_CATALOG;

        if (typeFilter !== 'all') {
            list = list.filter(b => b.type === typeFilter);
        }

        const trimmed = searchCode.trim();
        if (trimmed) {
            const search = trimmed.toUpperCase().replace(/\s|-/g, '');
            let filtered = list.filter(b => b.code.toUpperCase().replace(/\s|-/g, '').includes(search));
            
            // Try to find a dynamic parsed bearing matching the search code
            const parsed = findBearing(trimmed);
            if (parsed) {
                const alreadyExists = filtered.some(b => b.code.toUpperCase().replace(/\s|-/g, '') === parsed.code.toUpperCase().replace(/\s|-/g, ''));
                if (!alreadyExists) {
                    filtered = [parsed, ...filtered];
                }
            }
            return filtered;
        }

        return list;
    }, [typeFilter, searchCode]);

    // Auto-select bearing if it matches exactly or is parsed dynamically
    useEffect(() => {
        const trimmed = searchCode.trim();
        if (trimmed.length >= 3) {
            const match = findBearing(trimmed);
            if (match) {
                setSelectedBearing(match);
            }
        }
    }, [searchCode]);

    // Auto-detect type from search input
    const detectedType = useMemo(() => {
        if (searchCode.length >= 3) {
            return detectBearingType(searchCode);
        }
        return null;
    }, [searchCode]);

    // Calculate bearing life
    const results = useMemo(() => {
        const frKN = fr / 1000;
        const faKN = fa / 1000;
        return calculateBearingLife(selectedBearing, frKN, faKN, rpm, reliability);
    }, [selectedBearing, fr, fa, rpm, reliability]);

    const typeInfo = getBearingTypeInfo(selectedBearing.type);

    // Life status
    const getLifeStatus = (hours: number) => {
        if (hours > 50000) return { status: 'excellent', color: 'text-emerald-400', label: 'Excellent' };
        if (hours > 20000) return { status: 'good', color: 'text-green-400', label: 'Good' };
        if (hours > 5000) return { status: 'acceptable', color: 'text-yellow-400', label: 'Acceptable' };
        return { status: 'low', color: 'text-red-400', label: 'Low Life' };
    };

    const lifeStatus = getLifeStatus(results.L10h);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-12 font-sans overflow-hidden">
            {/* Header */}
            <header className="w-full max-w-6xl flex justify-between items-center mb-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded flex items-center justify-center text-white font-black text-xl">B</div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">{dict.bearing?.title || 'Bearing Calculator'}</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{dict.bearing?.subtitle || 'SKF Catalog • ISO 281'}</p>
                    </div>
                </div>

                {/* Type Badge & Save */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                        style={{ backgroundColor: `${typeInfo.color}20`, color: typeInfo.color }}>
                        <span>{typeInfo.icon}</span>
                        <span>{getBearingFilterLabel(s, selectedBearing.type)}</span>
                    </div>
                </div>
            </header>

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT: SEARCH & SELECT */}
                <div className="lg:col-span-7 space-y-6">

                    {/* SKF Code Search */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                            {s.searchSkf}
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                placeholder="6204, 30208, NU210, NA4906..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>

                        {/* Auto-detected type hint */}
                        {detectedType && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                <Info size={12} />
                                <span>Detected: <strong className="text-emerald-600">{detectedType.type.replace(/-/g, ' ')}</strong> ({detectedType.series} series)</span>
                            </div>
                        )}
                    </div>

                    {/* Type Filter Tabs */}
                    <div className="flex flex-wrap gap-2">
                        {BEARING_TYPE_FILTERS.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setTypeFilter(filter.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${typeFilter === filter.id
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {getBearingFilterLabel(s, filter.id)}
                            </button>
                        ))}
                    </div>

                    {/* Bearing Select Grid */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 max-h-64 overflow-y-auto">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {filteredBearings.slice(0, 24).map((b) => {
                                const info = getBearingTypeInfo(b.type);
                                const isSelected = selectedBearing.code === b.code;
                                return (
                                    <button
                                        key={b.code}
                                        onClick={() => setSelectedBearing(b)}
                                        className={`p-3 rounded-lg border text-left transition-all ${isSelected
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="font-mono font-bold text-slate-900 dark:text-white">{b.code}</div>
                                        <div className="text-[10px] text-slate-500 mt-1">
                                            {b.d}×{b.D}×{b.B} mm
                                        </div>
                                        <div className="text-[10px] mt-1" style={{ color: info.color }}>
                                            {info.icon} {getBearingFilterLabel(s, b.type)}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {filteredBearings.length > 24 && (
                            <p className="text-xs text-slate-400 mt-3 text-center">
                                +{filteredBearings.length - 24} more results
                            </p>
                        )}
                        {filteredBearings.length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-8">No bearings found</p>
                        )}
                    </div>

                    {/* Load Inputs */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                            {s.loadingConditions}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <CalculatorInput label={dict.bearing?.inputs?.radialLoad || 'Radial Load (Fr)'} unit="N" value={fr} onChange={(e) => setFr(Number(e.target.value))} />
                            <CalculatorInput label={dict.bearing?.inputs?.axialLoad || 'Axial Load (Fa)'} unit="N" value={fa} onChange={(e) => setFa(Number(e.target.value))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <CalculatorInput label={dict.bearing?.inputs?.rpm || 'Speed'} unit="RPM" value={rpm} onChange={(e) => setRpm(Number(e.target.value))} />
                            <CalculatorInput label={dict.bearing?.inputs?.reliability || 'Reliability'} unit="%" value={reliability} onChange={(e) => setReliability(Number(e.target.value))} />
                        </div>
                    </div>
                </div>

                {/* RIGHT: RESULTS */}
                <div className="lg:col-span-5 space-y-6">

                    {/* Bearing Visual */}
                    <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl h-56 relative overflow-hidden flex items-center justify-center">
                        <TechnicalDrawing
                            mode="bearing"
                            activeField={null}
                            data={{
                                od: selectedBearing.D,
                                id: selectedBearing.d,
                                width: selectedBearing.B,
                                type: selectedBearing.type.includes('ball') ? 'ball' :
                                    selectedBearing.type.includes('tapered') ? 'tapered' :
                                        selectedBearing.type.includes('needle') ? 'needle' : 'roller'
                            }}
                        />
                    </div>

                    {/* Bearing Specs Card */}
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-mono font-bold text-2xl text-slate-900 dark:text-white">{selectedBearing.code}</span>
                            <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: `${typeInfo.color}20`, color: typeInfo.color }}>
                                {typeInfo.icon} {getBearingFilterLabel(s, selectedBearing.type)}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase">d (ID)</div>
                                <div className="font-mono font-bold text-slate-900 dark:text-white">{selectedBearing.d} mm</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase">D (OD)</div>
                                <div className="font-mono font-bold text-slate-900 dark:text-white">{selectedBearing.D} mm</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase">B (Width)</div>
                                <div className="font-mono font-bold text-slate-900 dark:text-white">{selectedBearing.B} mm</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase">C (Dynamic)</div>
                                <div className="font-mono text-emerald-600 font-bold">{selectedBearing.C} kN</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase">C₀ (Static)</div>
                                <div className="font-mono text-blue-600 font-bold">{selectedBearing.C0} kN</div>
                            </div>
                        </div>
                        {selectedBearing.nMax && (
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-center">
                                <div className="text-[10px] text-slate-500 uppercase">Max Speed</div>
                                <div className="font-mono text-slate-900 dark:text-white">{selectedBearing.nMax.toLocaleString()} RPM</div>
                            </div>
                        )}
                    </div>

                    {/* Result Dashboard */}
                    <div className="bg-emerald-900 text-white rounded-xl p-6 shadow-xl relative overflow-hidden">
                        {/* Life Status Badge */}
                        <div className={`absolute top-4 right-4 flex items-center gap-1 text-xs font-bold ${lifeStatus.color}`}>
                            {lifeStatus.status === 'excellent' || lifeStatus.status === 'good' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                            {lifeStatus.label}
                        </div>

                        <div className="mb-6">
                            <div className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-1">
                                {dict.bearing?.results?.lifeHours || 'Basic Rating Life (L₁₀h)'}
                            </div>
                            <div className="text-5xl font-mono font-bold text-white">
                                {results.L10h > 1000000 ? '>1M' : results.L10h > 1000 ? `${(results.L10h / 1000).toFixed(1)}k` : results.L10h.toFixed(0)}
                                <span className="text-xl text-emerald-400 ml-2">hours</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-700">
                            <div>
                                <div className="text-[10px] text-emerald-300 uppercase">{dict.bearing?.results?.equivalentLoad || 'Equiv. Load (P)'}</div>
                                <div className="font-mono text-lg">{(results.P * 1000).toFixed(0)} N</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-emerald-300 uppercase">Adjusted Life (Lₙₐ)</div>
                                <div className="font-mono text-lg">{results.Lna > 1000 ? `${(results.Lna / 1000).toFixed(1)}k` : results.Lna.toFixed(0)} h</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-emerald-300 uppercase">{dict.bearing?.results?.staticSafety || 'Static Safety (S₀)'}</div>
                                <div className={`font-mono text-lg font-bold ${results.staticSafety < 1 ? 'text-red-400' : results.staticSafety < 2 ? 'text-yellow-400' : 'text-emerald-200'}`}>
                                    {results.staticSafety.toFixed(2)}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-emerald-300 uppercase">L₁₀ (Mrev)</div>
                                <div className="font-mono text-lg">{results.L10.toFixed(1)}</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
