import { useState, useMemo } from 'react';
import { MATERIALS_DB } from '@/data/materialsData';

export type UnitSystem = 'metric' | 'imperial';
export type MetalShape = 'box' | 'sheet' | 'pipe' | 'bar' | 'angle' | 'beam' | 'channel' | 'tee' | 'hex';

// We default to Alu 6061-T6
const DEFAULT_MATERIAL = MATERIALS_DB.find(m => m.name.includes('6061')) || MATERIALS_DB[0];

export const useWeightCalculator = (defaultUnit: UnitSystem = 'metric') => {
    const [unit, setUnit] = useState<UnitSystem>(defaultUnit);
    const [shape, setShape] = useState<MetalShape>('box');
    const [materialName, setMaterialName] = useState<string>(DEFAULT_MATERIAL.name);

    const [inputs, setInputs] = useState({
        width: '',
        height: '',
        length: '',
        thickness: '',
        wallThickness: '',
        diameter: '',
        webThickness: '',
        flangeThickness: '',
        legLength: '', // For equal angles or just use width/height
        rootRadius: '', // Added for visual fidelity (fillets)
    });

    const updateInput = (key: string, value: string) => {
        setInputs(prev => ({ ...prev, [key]: value }));
    };

    const weight = useMemo(() => {
        // Find material
        const mat = MATERIALS_DB.find(m => m.name === materialName) || DEFAULT_MATERIAL;
        // Density in g/cm³
        const density = mat.density;

        // Convert all inputs to mm for calculation
        // If imperial, input is inches. 1 inch = 25.4 mm
        const toMm = (val: string) => {
            const num = parseFloat(val);
            if (isNaN(num)) return 0;
            return unit === 'metric' ? num : num * 25.4;
        };

        const L = toMm(inputs.length);
        // We will calculate Volume in cm³ then multiply by density to get Grams, then convert to kg/lbs

        let volumeMm3 = 0;

        // Dimensions in mm
        const W = toMm(inputs.width); // A (Width/Leg1)
        const H = toMm(inputs.height); // B (Height/Leg2)
        const T = toMm(inputs.thickness); // General Thickness
        const WT = toMm(inputs.wallThickness); // Tube Wall
        const D = toMm(inputs.diameter);
        const Tw = toMm(inputs.webThickness);
        const Tf = toMm(inputs.flangeThickness);

        // Helper for cross-section Area (mm²)
        let areaMm2 = 0;

        switch (shape) {
            case 'box':
                // Outer Area - Inner Area
                if (W > 0 && H > 0) {
                    const outerArea = W * H;
                    const innerW = Math.max(0, W - 2 * WT);
                    const innerH = Math.max(0, H - 2 * WT);
                    const innerArea = innerW * innerH;
                    areaMm2 = outerArea - innerArea;
                }
                break;

            case 'sheet':
                // A = W * T
                if (W > 0 && T > 0) {
                    areaMm2 = W * T;
                }
                break;

            case 'pipe':
                // Area = pi * (R_out^2 - R_in^2)
                if (D > 0) {
                    const rOut = D / 2;
                    const rIn = Math.max(0, rOut - WT);
                    areaMm2 = Math.PI * (rOut * rOut - rIn * rIn);
                }
                break;

            case 'bar':
                // Area = pi * r^2
                if (D > 0) {
                    const r = D / 2;
                    areaMm2 = Math.PI * r * r;
                }
                break;

            case 'hex':
                // Hexagonal Bar
                // S = Flat to Flat distance (Diameter input)
                // Area = (sqrt(3)/2) * S^2  (This is for point-to-point? No)
                // Area of hex = 2 * sqrt(3) * (a^2) where a is side length?
                // Standard formula using Flat-to-Flat (S): Area = 0.8660254 * S^2
                // S = D
                if (D > 0) {
                    areaMm2 = 0.8660254 * D * D;
                }
                break;

            case 'angle':
                // L-Profile (Unequal or Equal)
                // W = Leg A, H = Leg B, T = Thickness
                // Area = (W * T) + (H - T) * T
                if (W > 0 && H > 0 && T > 0) {
                    areaMm2 = (W * T) + (Math.max(0, H - T) * T);
                }
                break;

            case 'beam':
                // I-Beam / H-Beam
                // W = Flange Width, H = Height, Tw = Web Thick, Tf = Flange Thick
                // Area = (2 * W * Tf) + ((H - 2 * Tf) * Tw)
                if (W > 0 && H > 0 && Tw > 0 && Tf > 0) {
                    areaMm2 = (2 * W * Tf) + (Math.max(0, H - 2 * Tf) * Tw);
                }
                break;

            case 'channel':
                // U-Channel (UPN)
                // W = Width (Flange leg?), H = Height (Base?), Tw=BaseThick, Tf=SideThick?
                // Standard: H = Depth (Base), W = Flange Width.
                // UPN: Web is the specific 'H' usually. 
                // Let's stick to generic: H = Height, W = Width.
                // Simple Channel: Base + 2 * Legs.
                // Assuming Constant Thickness T? Or Tw/Tf.
                // Area = (H * Tw) + 2 * (W - Tw) * Tf ? No.
                // Standard U-channel orientation: [
                // Base is H (vertical in [ view). Flanges are W.
                // Let's assume Parallel flange channel.
                // Area = (2 * W * Tf) + (Math.max(0, H - 2*Tf) * Tw) <-- Wait, this is I-beam.
                // U-Channel: 2 Flanges + 1 Web.
                // Area = (2 * W * Tf) + ((H - 2 * Tf) * Tw) -- Logic check:
                // Total H includes flange thickness. Web is between flanges? No, Web is usually full height in construction terms?
                // Actually for UPN: Web Height is H. Flange Width is W.
                // Area = (H * Tw) + 2 * (W - Tw) * Tf. (Assume flanges stick out from web).

                // Let's use simplified additive: 
                // Web Rectangle: H * Tw
                // Flange Rectangles (x2): (W - Tw) * Tf
                if (W > 0 && H > 0 && Tw > 0 && Tf > 0) {
                    areaMm2 = (H * Tw) + (2 * Math.max(0, W - Tw) * Tf);
                }
                break;

            case 'tee':
                // T-Profile
                // W = Width (Top Flange), H = Height (Stem + Flange), T = Thickness (Uniform usually, or Tf/Tw)
                // Let's allow Tf and Tw for generality.
                // Flange Area: W * Tf
                // Stem Area: (H - Tf) * Tw
                if (W > 0 && H > 0 && Tw > 0 && Tf > 0) {
                    areaMm2 = (W * Tf) + (Math.max(0, H - Tf) * Tw);
                }
                break;
        }

        volumeMm3 = areaMm2 * L;

        // Volume in cm³ = mm³ / 1000
        const volumeCm3 = volumeMm3 / 1000;
        const weightGrams = volumeCm3 * density;

        let finalWeight = weightGrams / 1000; // in kg

        if (unit === 'imperial') {
            finalWeight = finalWeight * 2.20462; // kg to lbs
        }

        return finalWeight;

    }, [inputs, shape, unit, materialName]);

    return {
        inputs,
        setInputs, // Added setInputs
        updateInput,
        weight,
        unit,
        setUnit,
        shape,
        setShape,
        materialName,
        setMaterialName
    };
};
