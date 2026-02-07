'use client';

import { useState, useMemo } from 'react';

// Concrete Reinforcement Calculator (RC Design)
const CONCRETE_GRADES = [
    { grade: 'C20', fck: 20, fcd: 13.3 },
    { grade: 'C25', fck: 25, fcd: 16.7 },
    { grade: 'C30', fck: 30, fcd: 20.0 },
    { grade: 'C35', fck: 35, fcd: 23.3 },
    { grade: 'C40', fck: 40, fcd: 26.7 },
    { grade: 'C45', fck: 45, fcd: 30.0 },
];

const STEEL_GRADES = [
    { grade: 'S420', fyk: 420, fyd: 365 },
    { grade: 'S500', fyk: 500, fyd: 435 },
    { grade: 'S550', fyk: 550, fyd: 478 },
];

const REBAR_DIAMETERS = [8, 10, 12, 14, 16, 20, 25, 32];

export default function ConcreteReinforcementModule() {
    const [concreteIdx, setConcreteIdx] = useState(2); // C30
    const [steelIdx, setSteelIdx] = useState(1); // S500
    const [sectionType, setSectionType] = useState<'beam' | 'column'>('beam');

    // Section dimensions
    const [width, setWidth] = useState(300); // mm
    const [height, setHeight] = useState(500); // mm
    const [cover, setCover] = useState(35); // mm
    const [moment, setMoment] = useState(150); // kN·m (design moment)

    const concrete = CONCRETE_GRADES[concreteIdx];
    const steel = STEEL_GRADES[steelIdx];

    const results = useMemo(() => {
        const b = width;
        const h = height;
        const d = h - cover - 10; // effective depth (assuming 20mm bar/2)
        const Md = moment * 1e6; // N·mm
        const fcd = concrete.fcd;
        const fyd = steel.fyd;

        // Normalized moment
        const mu = Md / (b * d * d * fcd);

        // Check if compression steel needed
        const muLim = 0.295; // balanced section limit
        const needsCompression = mu > muLim;

        // Lever arm factor
        const zeta = 0.5 * (1 + Math.sqrt(1 - 2 * Math.min(mu, muLim)));
        const z = zeta * d;

        // Required tension steel area
        const As = Md / (z * fyd);

        // Minimum steel ratio (EC2)
        const rhoMin = Math.max(0.26 * Math.sqrt(concrete.fck) / steel.fyk, 0.0013);
        const AsMin = rhoMin * b * d;

        // Actual steel ratio
        const rho = As / (b * d);

        // Suggest rebar combination
        const barDia = REBAR_DIAMETERS[3]; // 14mm default
        const barArea = Math.PI * (barDia / 2) ** 2;
        const numBars = Math.ceil(As / barArea);

        return {
            d, mu, zeta, z,
            As: Math.max(As, AsMin),
            AsMin,
            rho: rho * 100,
            rhoMin: rhoMin * 100,
            needsCompression,
            numBars,
            barDia,
            actualAs: numBars * barArea
        };
    }, [width, height, cover, moment, concrete, steel]);

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Material Selection */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-[9px] font-bold uppercase mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>Concrete</label>
                    <select value={concreteIdx} onChange={e => setConcreteIdx(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded text-xs"
                        style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                    >
                        {CONCRETE_GRADES.map((c, i) => <option key={c.grade} value={i}>{c.grade} (fck={c.fck} MPa)</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[9px] font-bold uppercase mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>Steel</label>
                    <select value={steelIdx} onChange={e => setSteelIdx(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded text-xs"
                        style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                    >
                        {STEEL_GRADES.map((s, i) => <option key={s.grade} value={i}>{s.grade} (fyk={s.fyk} MPa)</option>)}
                    </select>
                </div>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-2">
                <InputField label="Width b (mm)" value={width} onChange={setWidth} />
                <InputField label="Height h (mm)" value={height} onChange={setHeight} />
                <InputField label="Cover (mm)" value={cover} onChange={setCover} />
                <InputField label="Moment Md (kN·m)" value={moment} onChange={setMoment} />
            </div>

            {/* Section SVG */}
            <div className="rounded-lg p-2 flex justify-center" style={{ backgroundColor: 'var(--color-os-canvas)' }}>
                <svg viewBox="0 0 100 120" className="w-24 h-28">
                    {/* Section outline */}
                    <rect x="20" y="10" width="60" height="100" fill="var(--color-os-header)" stroke="var(--color-os-border)" strokeWidth="2" />
                    {/* Cover zone */}
                    <rect x="25" y="15" width="50" height="90" fill="none" stroke="var(--color-os-text-secondary)" strokeWidth="0.5" strokeDasharray="2" />
                    {/* Tension bars */}
                    {Array.from({ length: Math.min(results.numBars, 4) }).map((_, i) => (
                        <circle key={i} cx={30 + i * 14} cy="100" r="4" fill="var(--color-os-accent)" />
                    ))}
                    {/* Labels */}
                    <text x="50" y="7" textAnchor="middle" fontSize="6" fill="var(--color-os-text-secondary)">{width}mm</text>
                    <text x="85" y="60" fontSize="6" fill="var(--color-os-text-secondary)">{height}</text>
                </svg>
            </div>

            {/* Results */}
            <div className="p-3 rounded-lg grid grid-cols-2 gap-2" style={{ backgroundColor: 'var(--color-os-header)', border: '1px solid var(--color-os-accent)' }}>
                <ResultBlock label="Required As" value={`${results.As.toFixed(0)} mm²`} big accent />
                <ResultBlock label="Suggested" value={`${results.numBars}×Ø${results.barDia}`} big />
                <ResultBlock label="Actual As" value={`${results.actualAs.toFixed(0)} mm²`} />
                <ResultBlock label="Effective d" value={`${results.d.toFixed(0)} mm`} />
                <ResultBlock label="ρ Required" value={`${results.rho.toFixed(3)}%`} />
                <ResultBlock label="ρ Min (EC2)" value={`${results.rhoMin.toFixed(3)}%`} />
            </div>

            {results.needsCompression && (
                <div className="p-2 rounded text-[10px] text-center" style={{ backgroundColor: 'var(--color-os-warning)', color: 'var(--color-os-canvas)' }}>
                    ⚠️ Section requires compression reinforcement (μ &gt; 0.295)
                </div>
            )}
        </div>
    );
}

function InputField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div>
            <label className="block text-[9px] font-bold uppercase mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>{label}</label>
            <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
                className="w-full px-2 py-1.5 rounded text-xs font-mono"
                style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
            />
        </div>
    );
}

function ResultBlock({ label, value, big, accent }: { label: string; value: string; big?: boolean; accent?: boolean }) {
    return (
        <div className="text-center">
            <div className="text-[9px] uppercase" style={{ color: 'var(--color-os-text-secondary)' }}>{label}</div>
            <div className={`font-mono font-bold ${big ? 'text-lg' : 'text-sm'}`} style={{ color: accent ? 'var(--color-os-accent)' : 'var(--color-os-text-primary)' }}>{value}</div>
        </div>
    );
}
