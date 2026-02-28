import { useState, useMemo } from 'react';
import { useCADCanvasStore, CADShape } from '@/store/CADCanvasStore';
import { MousePointer2, Plus, BookOpen } from 'lucide-react';
import { useOSStore } from '@/store/osStore';

type Shape = 'plate' | 'round' | 'tube' | 'hollow-rect' | 'angle' | 'channel' | 'i-beam' | 'hex';

const SHAPES: { id: Shape; label: string }[] = [
    { id: 'plate', label: 'Plate' },
    { id: 'round', label: 'Round' },
    { id: 'tube', label: 'Tube' },
    { id: 'hollow-rect', label: 'Box' },
    { id: 'angle', label: 'Angle' },
    { id: 'channel', label: 'Channel' },
    { id: 'i-beam', label: 'I-Beam' },
    { id: 'hex', label: 'Hexagon' },
];

const MATERIALS_DB = [
    { name: '6061-T6 (US Standard)', density: 2.70, category: 'Aluminum' },
    { name: '6063-T5 (Architectural)', density: 2.69, category: 'Aluminum' },
    { name: '7075-T6 (Aerospace)', density: 2.81, category: 'Aluminum' },
    { name: '5083-H116 (Marine)', density: 2.66, category: 'Aluminum' },
    { name: 'Steel (Mild)', density: 7.85, category: 'Steel' },
    { name: 'Stainless Steel (304)', density: 8.00, category: 'Steel' },
];

export default function ProfileWeightModule() {
    const { addShape } = useCADCanvasStore();
    const [shape, setShape] = useState<Shape>('plate');
    const [material, setMaterial] = useState('6061-T6 (US Standard)');
    const [quantity, setQuantity] = useState(1);
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

    // Dimensions
    const [length, setLength] = useState(1000);
    const [width, setWidth] = useState(100);
    const [thickness, setThickness] = useState(10);
    const [diameter, setDiameter] = useState(50);
    const [wallThickness, setWallThickness] = useState(5);
    const [height, setHeight] = useState(100);
    const [flangeW, setFlangeW] = useState(50);
    const [webH, setWebH] = useState(100);
    const [flangeT, setFlangeT] = useState(8);
    const [webT, setWebT] = useState(6);

    const materialData = MATERIALS_DB.find(m => m.name === material);
    const density = materialData?.density || 2.7;

    // Calculate result
    const result = useMemo(() => {
        let volume = 0; // mm³
        let surfaceArea = 0; // mm²

        switch (shape) {
            case 'plate':
                volume = length * width * thickness;
                surfaceArea = 2 * (length * width + length * thickness + width * thickness);
                break;
            case 'round':
                volume = Math.PI * Math.pow(diameter / 2, 2) * length;
                surfaceArea = 2 * Math.PI * (diameter / 2) * length + 2 * Math.PI * Math.pow(diameter / 2, 2);
                break;
            case 'tube':
                const outerR = diameter / 2;
                const innerR = outerR - wallThickness;
                volume = Math.PI * (outerR * outerR - innerR * innerR) * length;
                surfaceArea = 2 * Math.PI * (outerR + innerR) * length;
                break;
            case 'hollow-rect':
                const outerArea = width * height;
                const innerArea = (width - 2 * wallThickness) * (height - 2 * wallThickness);
                volume = (outerArea - innerArea) * length;
                surfaceArea = 2 * (outerArea - innerArea) + 2 * (width + height) * length;
                break;
            case 'angle':
                // L-angle: simple approx
                volume = (width * thickness + (height - thickness) * thickness) * length;
                surfaceArea = 2 * (width * height - (width - thickness) * (height - thickness)) + 2 * (width + height) * length;
                break;
            case 'channel':
                // C-channel: web + 2 flanges
                volume = (width * thickness * 2 + (height - 2 * thickness) * thickness) * length;
                break;
            case 'i-beam':
                // I-beam: 2 flanges + web
                volume = (2 * flangeW * flangeT + (webH - 2 * flangeT) * webT) * length;
                break;
            case 'hex':
                // Regular hexagon
                const hexArea = (3 * Math.sqrt(3) / 2) * Math.pow(diameter / 2, 2);
                volume = hexArea * length;
                break;
        }

        const volumeCm3 = volume / 1000; // mm³ to cm³
        const unitWeightKg = (volumeCm3 * density) / 1000;
        const totalWeightKg = unitWeightKg * quantity;

        return {
            volumeCm3: volumeCm3.toFixed(2),
            surfaceAreaCm2: (surfaceArea / 100).toFixed(2),
            unitWeightKg: unitWeightKg.toFixed(3),
            totalWeightKg: totalWeightKg.toFixed(3),
        };
    }, [shape, length, width, thickness, diameter, wallThickness, height, flangeW, webH, flangeT, webT, density, quantity]);

    const exportToCAD = () => {
        const shapes: any[] = [];

        // Helper to create a shape
        const createPolyline = (points: { x: number, y: number }[]) => ({
            type: 'polyline',
            points,
            style: { strokeColor: '#00e5ff', strokeWidth: 2, fillOpacity: 0.1, fillColor: '#00e5ff' },
            locked: false,
            visible: true,
            layer: 'profile'
        });

        const createCircle = (radius: number) => ({
            type: 'circle',
            points: [{ x: 0, y: 0 }, { x: radius, y: 0 }], // Center + radius point
            style: { strokeColor: '#00e5ff', strokeWidth: 2, fillOpacity: 0.1, fillColor: '#00e5ff' },
            locked: false,
            visible: true,
            layer: 'profile'
        });

        switch (shape) {
            case 'plate':
                // Rectangle
                shapes.push({
                    type: 'rectangle',
                    points: [{ x: -width / 2, y: -thickness / 2 }, { x: width / 2, y: thickness / 2 }],
                    style: { strokeColor: '#00e5ff', strokeWidth: 2, fillOpacity: 0.1, fillColor: '#00e5ff' },
                    locked: false,
                    visible: true,
                    layer: 'profile'
                });
                break;
            case 'round':
                shapes.push(createCircle(diameter / 2));
                break;
            case 'tube':
                shapes.push(createCircle(diameter / 2));
                shapes.push(createCircle((diameter / 2) - wallThickness));
                break;
            case 'hollow-rect':
                // Outer
                shapes.push({
                    type: 'rectangle',
                    points: [{ x: -width / 2, y: -height / 2 }, { x: width / 2, y: height / 2 }],
                    style: { strokeColor: '#00e5ff', strokeWidth: 2, fillOpacity: 0.1, fillColor: '#00e5ff' },
                    visible: true, layer: 'profile', locked: false
                });
                // Inner
                shapes.push({
                    type: 'rectangle',
                    points: [{ x: -(width / 2 - wallThickness), y: -(height / 2 - wallThickness) }, { x: (width / 2 - wallThickness), y: (height / 2 - wallThickness) }],
                    style: { strokeColor: '#00e5ff', strokeWidth: 2 },
                    visible: true, layer: 'profile', locked: false
                });
                break;
            case 'angle':
                // L-shape
                shapes.push(createPolyline([
                    { x: 0, y: 0 },
                    { x: width, y: 0 },
                    { x: width, y: thickness },
                    { x: thickness, y: thickness },
                    { x: thickness, y: height },
                    { x: 0, y: height },
                    { x: 0, y: 0 } // Close
                ]));
                break;
            case 'channel':
                // C-shape
                shapes.push(createPolyline([
                    { x: 0, y: 0 },
                    { x: width, y: 0 },
                    { x: width, y: thickness },
                    { x: thickness, y: thickness },
                    { x: thickness, y: height - thickness },
                    { x: width, y: height - thickness },
                    { x: width, y: height },
                    { x: 0, y: height },
                    { x: 0, y: 0 }
                ]));
                break;
            case 'i-beam':
                // Top Flange
                shapes.push({
                    type: 'rectangle',
                    points: [{ x: -flangeW / 2, y: webH / 2 }, { x: flangeW / 2, y: webH / 2 + flangeT }],
                    visible: true, layer: 'profile', locked: false, style: { strokeColor: '#00e5ff', strokeWidth: 2 }
                });
                // Bottom Flange
                shapes.push({
                    type: 'rectangle',
                    points: [{ x: -flangeW / 2, y: -webH / 2 - flangeT }, { x: flangeW / 2, y: -webH / 2 }],
                    visible: true, layer: 'profile', locked: false, style: { strokeColor: '#00e5ff', strokeWidth: 2 }
                });
                // Web
                shapes.push({
                    type: 'rectangle',
                    points: [{ x: -webT / 2, y: -webH / 2 }, { x: webT / 2, y: webH / 2 }],
                    visible: true, layer: 'profile', locked: false, style: { strokeColor: '#00e5ff', strokeWidth: 2 }
                });
                break;
            case 'hex':
                const R = diameter / 2;
                const points = [];
                for (let i = 0; i < 6; i++) {
                    const angle = (i * 60 - 30) * Math.PI / 180;
                    points.push({ x: R * Math.cos(angle), y: R * Math.sin(angle) });
                }
                points.push(points[0]); // Close
                shapes.push(createPolyline(points));
                break;
        }

        // Add all shapes to store
        shapes.forEach(s => addShape(s));
    };

    const aluminumAlloys = MATERIALS_DB.filter(m => m.category === 'Aluminum');

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Shape Selection */}
            <div className="grid grid-cols-4 gap-1">
                {SHAPES.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setShape(s.id)}
                        className="py-1.5 px-2 rounded text-[9px] font-bold uppercase transition-all"
                        style={{
                            backgroundColor: shape === s.id ? 'var(--color-os-accent)' : 'var(--color-os-header)',
                            color: shape === s.id ? 'var(--color-os-canvas)' : 'var(--color-os-text-secondary)',
                        }}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* 2D/3D Toggle + Visualization */}
            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-os-canvas)' }}>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--color-os-text-secondary)' }}>Preview</span>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => useOSStore.getState().openWindow('handbook')}
                            className="flex items-center gap-1 text-[9px] font-bold uppercase text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            <BookOpen size={10} /> Handbook
                        </button>
                        <div className="flex gap-1">
                            {(['2d', '3d'] as const).map(m => (
                                <button key={m} onClick={() => setViewMode(m)}
                                    className="px-2 py-0.5 rounded text-[9px] font-bold uppercase"
                                    style={{
                                        backgroundColor: viewMode === m ? 'var(--color-os-accent)' : 'var(--color-os-header)',
                                        color: viewMode === m ? 'var(--color-os-canvas)' : 'var(--color-os-text-secondary)',
                                    }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <ShapePreview shape={shape} viewMode={viewMode} w={width} h={height} t={thickness} d={diameter} wt={wallThickness} fW={flangeW} wH={webH} fT={flangeT} wT={webT} L={length} />
            </div>

            {/* Material */}
            <div>
                <label className="block text-[9px] font-bold uppercase mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>Material</label>
                <select value={material} onChange={e => setMaterial(e.target.value)}
                    className="w-full px-2 py-1.5 rounded text-xs"
                    style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                >
                    {aluminumAlloys.map(m => <option key={m.name} value={m.name}>{m.name} ({m.density})</option>)}
                </select>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-3 gap-2">
                <InputField label="Length (mm)" value={length} onChange={setLength} />

                {shape === 'plate' && (
                    <>
                        <InputField label="Width (mm)" value={width} onChange={setWidth} />
                        <InputField label="Thickness (mm)" value={thickness} onChange={setThickness} />
                    </>
                )}
                {shape === 'round' && <InputField label="Diameter (mm)" value={diameter} onChange={setDiameter} />}
                {shape === 'hex' && <InputField label="Diameter (mm)" value={diameter} onChange={setDiameter} />}
                {shape === 'tube' && (
                    <>
                        <InputField label="Outer Ø (mm)" value={diameter} onChange={setDiameter} />
                        <InputField label="Wall (mm)" value={wallThickness} onChange={setWallThickness} />
                    </>
                )}
                {shape === 'hollow-rect' && (
                    <>
                        <InputField label="Width (mm)" value={width} onChange={setWidth} />
                        <InputField label="Height (mm)" value={height} onChange={setHeight} />
                        <InputField label="Wall (mm)" value={wallThickness} onChange={setWallThickness} />
                    </>
                )}
                {shape === 'angle' && (
                    <>
                        <InputField label="Leg A (mm)" value={width} onChange={setWidth} />
                        <InputField label="Leg B (mm)" value={height} onChange={setHeight} />
                        <InputField label="Thickness (mm)" value={thickness} onChange={setThickness} />
                    </>
                )}
                {shape === 'channel' && (
                    <>
                        <InputField label="Width (mm)" value={width} onChange={setWidth} />
                        <InputField label="Height (mm)" value={height} onChange={setHeight} />
                        <InputField label="Thickness (mm)" value={thickness} onChange={setThickness} />
                    </>
                )}
                {shape === 'i-beam' && (
                    <>
                        <InputField label="Flange W (mm)" value={flangeW} onChange={setFlangeW} />
                        <InputField label="Web H (mm)" value={webH} onChange={setWebH} />
                        <InputField label="Flange T (mm)" value={flangeT} onChange={setFlangeT} />
                        <InputField label="Web T (mm)" value={webT} onChange={setWebT} />
                    </>
                )}
                <InputField label="Qty" value={quantity} onChange={setQuantity} />
            </div>

            {/* Results */}
            <div className="p-3 rounded-lg grid grid-cols-2 gap-2" style={{ backgroundColor: 'var(--color-os-header)', border: '1px solid var(--color-os-accent)' }}>
                <ResultBlock label="Unit Weight" value={`${result.unitWeightKg} kg`} />
                <ResultBlock label="Total Weight" value={`${result.totalWeightKg} kg`} accent big />
                <ResultBlock label="Volume" value={`${result.volumeCm3} cm³`} />
                <ResultBlock label="Surface" value={`${result.surfaceAreaCm2} cm²`} />

                {/* Export Button */}
                <button
                    onClick={exportToCAD}
                    className="col-span-2 mt-2 py-2 bg-[#00e5ff] hover:bg-[#00b8d4] text-black font-bold rounded flex items-center justify-center gap-2 text-xs uppercase transition-colors"
                >
                    <Plus size={14} /> Send to CAD Canvas
                </button>
            </div>
        </div>
    );
}

// Shape preview component with 2D/3D modes
function ShapePreview({ shape, viewMode, w, h, t, d, wt, fW, wH, fT, wT, L }: {
    shape: Shape; viewMode: '2d' | '3d';
    w: number; h: number; t: number; d: number; wt: number;
    fW: number; wH: number; fT: number; wT: number; L: number;
}) {
    const is3D = viewMode === '3d';
    const skewX = is3D ? -10 : 0;
    const skewY = is3D ? 10 : 0;

    return (
        <svg viewBox="0 0 140 80" className="w-full h-20" style={{ transform: is3D ? 'perspective(200px) rotateY(-10deg)' : undefined }}>
            {/* Cross-section view */}
            <g transform={`translate(70, 40)`}>
                {shape === 'plate' && (
                    <>
                        <rect x={-30} y={-5} width={60} height={10} fill="var(--color-os-accent)" fillOpacity="0.4" stroke="var(--color-os-accent)" strokeWidth="1" />
                        {is3D && <rect x={-30 + 5} y={-5 - 20} width={60} height={10} fill="var(--color-os-accent)" fillOpacity="0.2" stroke="var(--color-os-accent)" strokeWidth="0.5" />}
                        {is3D && <line x1={-30} y1={-5} x2={-30 + 5} y2={-5 - 20} stroke="var(--color-os-accent)" strokeWidth="0.5" />}
                        {is3D && <line x1={30} y1={-5} x2={30 + 5} y2={-5 - 20} stroke="var(--color-os-accent)" strokeWidth="0.5" />}
                        <text x="0" y="25" textAnchor="middle" fontSize="7" fill="var(--color-os-text-secondary)">{w}×{t}</text>
                    </>
                )}
                {shape === 'round' && (
                    <>
                        <circle r={20} fill="var(--color-os-accent)" fillOpacity="0.4" stroke="var(--color-os-accent)" strokeWidth="1.5" />
                        {is3D && <ellipse cx={5} cy={-15} rx={20} ry={10} fill="var(--color-os-accent)" fillOpacity="0.2" stroke="var(--color-os-accent)" strokeWidth="0.5" />}
                        <text x="0" y="35" textAnchor="middle" fontSize="7" fill="var(--color-os-text-secondary)">Ø{d}</text>
                    </>
                )}
                {shape === 'tube' && (
                    <>
                        <circle r={22} fill="none" stroke="var(--color-os-accent)" strokeWidth="6" />
                        {is3D && <ellipse cx={5} cy={-15} rx={22} ry={10} fill="none" stroke="var(--color-os-accent)" strokeWidth="3" strokeOpacity="0.5" />}
                        <text x="0" y="35" textAnchor="middle" fontSize="7" fill="var(--color-os-text-secondary)">Ø{d}×{wt}</text>
                    </>
                )}
                {shape === 'hollow-rect' && (
                    <>
                        <rect x={-25} y={-15} width={50} height={30} fill="none" stroke="var(--color-os-accent)" strokeWidth="5" />
                        {is3D && <rect x={-25 + 5} y={-15 - 15} width={50} height={30} fill="none" stroke="var(--color-os-accent)" strokeWidth="2" strokeOpacity="0.5" />}
                        <text x="0" y="30" textAnchor="middle" fontSize="7" fill="var(--color-os-text-secondary)">{w}×{h}×{wt}</text>
                    </>
                )}
                {shape === 'angle' && (
                    <>
                        <path d={`M -20,15 L -20,-15 L -15,-15 L -15,10 L 20,10 L 20,15 Z`} fill="var(--color-os-accent)" fillOpacity="0.4" stroke="var(--color-os-accent)" strokeWidth="1" />
                        <text x="0" y="30" textAnchor="middle" fontSize="7" fill="var(--color-os-text-secondary)">L{w}×{h}×{t}</text>
                    </>
                )}
                {shape === 'channel' && (
                    <>
                        <path d={`M -15,-15 L 15,-15 L 15,-10 L -10,-10 L -10,10 L 15,10 L 15,15 L -15,15 Z`} fill="var(--color-os-accent)" fillOpacity="0.4" stroke="var(--color-os-accent)" strokeWidth="1" />
                        <text x="0" y="30" textAnchor="middle" fontSize="7" fill="var(--color-os-text-secondary)">C{w}×{h}</text>
                    </>
                )}
                {shape === 'i-beam' && (
                    <>
                        <rect x={-20} y={-20} width={40} height={5} fill="var(--color-os-accent)" fillOpacity="0.4" stroke="var(--color-os-accent)" strokeWidth="1" />
                        <rect x={-3} y={-15} width={6} height={30} fill="var(--color-os-accent)" fillOpacity="0.4" stroke="var(--color-os-accent)" strokeWidth="1" />
                        <rect x={-20} y={15} width={40} height={5} fill="var(--color-os-accent)" fillOpacity="0.4" stroke="var(--color-os-accent)" strokeWidth="1" />
                        <text x="0" y="35" textAnchor="middle" fontSize="7" fill="var(--color-os-text-secondary)">I{fW}×{wH}</text>
                    </>
                )}
                {shape === 'hex' && (
                    <>
                        <polygon points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11" fill="var(--color-os-accent)" fillOpacity="0.4" stroke="var(--color-os-accent)" strokeWidth="1" />
                        <text x="0" y="35" textAnchor="middle" fontSize="7" fill="var(--color-os-text-secondary)">Hex {d}</text>
                    </>
                )}
            </g>
        </svg>
    );
}

function InputField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div>
            <label className="block text-[8px] font-bold uppercase mb-0.5" style={{ color: 'var(--color-os-text-secondary)' }}>{label}</label>
            <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
                className="w-full px-2 py-1 rounded text-xs font-mono"
                style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
            />
        </div>
    );
}

function ResultBlock({ label, value, accent, big }: { label: string; value: string; accent?: boolean; big?: boolean }) {
    return (
        <div className="text-center">
            <div className="text-[9px] uppercase" style={{ color: 'var(--color-os-text-secondary)' }}>{label}</div>
            <div className={`font-mono font-bold ${big ? 'text-lg' : 'text-sm'}`} style={{ color: accent ? 'var(--color-os-accent)' : 'var(--color-os-text-primary)' }}>{value}</div>
        </div>
    );
}
