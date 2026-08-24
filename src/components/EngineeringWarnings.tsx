import { AlertTriangle, Info } from 'lucide-react';

interface WarningsProps {
    shape: string;
    inputs: any;
    material: string;
}

export const EngineeringWarnings = ({ shape, inputs, material }: WarningsProps) => {
    const warnings: string[] = [];
    const tips: string[] = [];

    // Parse inputs (safely)
    const t = parseFloat(inputs.thickness || inputs.wallThickness || inputs.webThickness || '0');
    const w = parseFloat(inputs.width || '0');
    const h = parseFloat(inputs.height || '0');
    const d = parseFloat(inputs.diameter || '0');

    // 1. Extrusion Checks (General Aluminum Rules)
    if (material.includes('Aluminum') || material.includes('6061')) {
        if (t > 0 && t < 1.0) {
            warnings.push("Wall thickness < 1.0mm is very difficult to extrude. Recommended min: 1.2mm.");
        }
        if (t > 0 && t < 1.5 && (w > 100 || h > 100)) {
            warnings.push("Thin walls (1.5mm) on large profiles (>100mm) may warp during cooling.");
        }
    }

    // 2. Machinability Checks
    if (t > 0 && t < 3 && material.includes('Custom')) {
        tips.push("Ensure your custom material supports thin-wall machining if not extruding.");
    }

    // 3. Shape Specific
    if (shape === 'box' || shape === 'pipe') {
        if (t > 0 && (w > 0 || d > 0)) {
            const ratio = (w || d) / t;
            if (ratio > 60) {
                warnings.push(`Diameter/Thickness ratio (${ratio.toFixed(0)}) is too high. Pipe may dent easily.`);
            }
        }
    }

    if (warnings.length === 0 && tips.length === 0) return null;

    return (
        <div className="space-y-3 my-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {warnings.map((msg, i) => (
                <div key={`w-${i}`} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <span>{msg}</span>
                </div>
            ))}
            {tips.map((msg, i) => (
                <div key={`t-${i}`} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                    <Info size={18} className="shrink-0 mt-0.5" />
                    <span>{msg}</span>
                </div>
            ))}
        </div>
    );
};
