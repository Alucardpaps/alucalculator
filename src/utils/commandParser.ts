/**
 * AluCalc OS — Command Parser
 * Parses terminal input and dispatches to CalculationEngine
 * 
 * Supported commands:
 *   calc plate 500x200x10 [material]        → Plate mass
 *   calc bar 50x1000 [material]              → Round bar mass
 *   calc tube 100x5x1000 [material]          → Tube mass
 *   calc box 60x40x3x1000 [material]         → Hollow rect mass
 *   kerf <method> <cutLength> <thickness>     → Kerf loss for 1kg net
 *   thermal <length> <deltaT> [material]      → Thermal expansion
 *   material <name>                           → Show material properties
 *   list materials                            → List all materials
 *   list methods                              → List cutting methods
 *   help                                      → Show help
 *   clear                                     → Clear terminal
 */

import CalculationEngine, { CalculatorUtils } from '@/lib/CalculationEngine';
import { MATERIALS_DB, getMaterial } from '@/data/materialsData';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface CommandResult {
    type: 'success' | 'error' | 'info' | 'clear';
    output: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function findMaterialName(query: string): string | null {
    const q = query.toLowerCase();
    const found = MATERIALS_DB.find(m =>
        m.name.toLowerCase().includes(q) ||
        m.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(q.replace(/[^a-z0-9]/g, ''))
    );
    return found ? found.name : null;
}

function parseDimensions(str: string): number[] {
    return str.split('x').map(Number).filter(n => !isNaN(n) && n > 0);
}

function formatNumber(n: number, decimals = 3): string {
    return n.toFixed(decimals).replace(/\.?0+$/, '') || '0';
}

// ─────────────────────────────────────────────
// Main Parser
// ─────────────────────────────────────────────

export function parseCommand(input: string): CommandResult {
    const trimmed = input.trim();
    if (!trimmed) {
        return { type: 'info', output: '' };
    }

    const args = trimmed.split(/\s+/);
    const command = args[0].toLowerCase();

    try {
        switch (command) {
            case 'calc':
            case 'mass':
                return handleCalc(args.slice(1));

            case 'kerf':
                return handleKerf(args.slice(1));

            case 'thermal':
                return handleThermal(args.slice(1));

            case 'material':
            case 'mat':
                return handleMaterial(args.slice(1));

            case 'list':
            case 'ls':
                return handleList(args.slice(1));

            case 'help':
            case '?':
                return getCommandHelp();

            case 'clear':
            case 'cls':
                return { type: 'clear', output: '' };

            default:
                return {
                    type: 'error',
                    output: `Unknown command: "${command}"\nType "help" for available commands.`
                };
        }
    } catch (err) {
        return {
            type: 'error',
            output: `Error: ${(err as Error).message}`
        };
    }
}

// ─────────────────────────────────────────────
// Command Handlers
// ─────────────────────────────────────────────

function handleCalc(args: string[]): CommandResult {
    if (args.length < 2) {
        return {
            type: 'error',
            output: 'Usage: calc <shape> <dimensions> [material]\nShapes: plate, bar, tube, box\nExample: calc plate 500x200x10 6061'
        };
    }

    const shape = args[0].toLowerCase();
    const dims = parseDimensions(args[1]);
    const materialQuery = args[2] || '6061';
    const materialName = findMaterialName(materialQuery);

    if (!materialName) {
        return { type: 'error', output: `Material not found: "${materialQuery}"\nUse "list materials" to see available materials.` };
    }

    const engine = new CalculationEngine(materialName);
    const quantity = args[3] ? parseInt(args[3], 10) : 1;

    switch (shape) {
        case 'plate':
        case 'plaka':
        case 'levha': {
            if (dims.length !== 3) {
                return { type: 'error', output: 'Plate requires 3 dimensions: LxWxT\nExample: calc plate 500x200x10' };
            }
            const result = engine.calculatePlate(dims[0], dims[1], dims[2], quantity);
            if (!result.success) return { type: 'error', output: `Calculation error: ${result.error}` };
            return {
                type: 'success',
                output: [
                    `✅ Plate Calculation — ${materialName}`,
                    `   Dimensions: ${dims[0]} × ${dims[1]} × ${dims[2]} mm`,
                    `   Volume:     ${formatNumber(result.volumeCm3!)} cm³`,
                    `   Unit Mass:  ${formatNumber(result.unitWeightKg!, 4)} kg`,
                    quantity > 1 ? `   Total Mass: ${formatNumber(result.totalWeightKg!)} kg (×${quantity})` : '',
                    `   Density:    ${result.density} g/cm³`,
                ].filter(Boolean).join('\n')
            };
        }

        case 'bar':
        case 'rod':
        case 'mil': {
            if (dims.length !== 2) {
                return { type: 'error', output: 'Bar requires 2 dimensions: ØxL\nExample: calc bar 50x1000' };
            }
            const result = engine.calculateRoundBar(dims[0], dims[1], quantity);
            if (!result.success) return { type: 'error', output: `Calculation error: ${result.error}` };
            return {
                type: 'success',
                output: [
                    `✅ Round Bar — ${materialName}`,
                    `   Diameter:   Ø${dims[0]} mm`,
                    `   Length:     ${dims[1]} mm`,
                    `   Volume:     ${formatNumber(result.volumeCm3!)} cm³`,
                    `   Unit Mass:  ${formatNumber(result.unitWeightKg!, 4)} kg`,
                    quantity > 1 ? `   Total Mass: ${formatNumber(result.totalWeightKg!)} kg (×${quantity})` : '',
                ].filter(Boolean).join('\n')
            };
        }

        case 'tube':
        case 'boru': {
            if (dims.length !== 3) {
                return { type: 'error', output: 'Tube requires 3 dimensions: ODxWTxL\nExample: calc tube 100x5x1000' };
            }
            const result = engine.calculateTube(dims[0], dims[1], dims[2], quantity);
            if (!result.success) return { type: 'error', output: `Calculation error: ${result.error}` };
            return {
                type: 'success',
                output: [
                    `✅ Tube — ${materialName}`,
                    `   OD: ${dims[0]} mm | Wall: ${dims[1]} mm | L: ${dims[2]} mm`,
                    `   Volume:     ${formatNumber(result.volumeCm3!)} cm³`,
                    `   Unit Mass:  ${formatNumber(result.unitWeightKg!, 4)} kg`,
                    quantity > 1 ? `   Total Mass: ${formatNumber(result.totalWeightKg!)} kg (×${quantity})` : '',
                ].filter(Boolean).join('\n')
            };
        }

        case 'box':
        case 'kutu':
        case 'hollow': {
            if (dims.length !== 4) {
                return { type: 'error', output: 'Box requires 4 dimensions: WxHxWTxL\nExample: calc box 60x40x3x1000' };
            }
            const result = engine.calculateHollowRect(dims[0], dims[1], dims[2], dims[3], quantity);
            if (!result.success) return { type: 'error', output: `Calculation error: ${result.error}` };
            return {
                type: 'success',
                output: [
                    `✅ Hollow Rect — ${materialName}`,
                    `   ${dims[0]}×${dims[1]} mm | Wall: ${dims[2]} mm | L: ${dims[3]} mm`,
                    `   Volume:     ${formatNumber(result.volumeCm3!)} cm³`,
                    `   Unit Mass:  ${formatNumber(result.unitWeightKg!, 4)} kg`,
                    quantity > 1 ? `   Total Mass: ${formatNumber(result.totalWeightKg!)} kg (×${quantity})` : '',
                ].filter(Boolean).join('\n')
            };
        }

        default:
            return { type: 'error', output: `Unknown shape: "${shape}"\nAvailable: plate, bar, tube, box` };
    }
}

function handleKerf(args: string[]): CommandResult {
    if (args.length < 3) {
        return {
            type: 'error',
            output: 'Usage: kerf <method> <cutLengthMm> <thicknessMm> [material]\nExample: kerf laser_fiber 5000 6\nUse "list methods" for available cutting methods.'
        };
    }

    const method = args[0].toLowerCase();
    const cutLength = parseFloat(args[1]);
    const thickness = parseFloat(args[2]);
    const materialQuery = args[3] || '6061';
    const materialName = findMaterialName(materialQuery);

    if (!materialName) {
        return { type: 'error', output: `Material not found: "${materialQuery}"` };
    }
    if (isNaN(cutLength) || isNaN(thickness)) {
        return { type: 'error', output: 'Cut length and thickness must be numbers.' };
    }

    const engine = new CalculationEngine(materialName);
    const result = engine.calculateKerfLoss(1.0, method, cutLength, thickness);

    if (!result.success) return { type: 'error', output: `Kerf error: ${result.error}` };

    return {
        type: 'success',
        output: [
            `✅ Kerf Loss — ${result.cuttingMethod} — ${materialName}`,
            `   Net Weight:    1.000 kg`,
            `   Kerf Width:    ${result.kerfMm} mm`,
            `   Kerf Weight:   ${formatNumber(result.kerfWeightKg!, 4)} kg`,
            `   Gross Weight:  ${formatNumber(result.grossWeightKg!)} kg`,
            `   Loss:          ${result.lossPercentage}%`,
        ].join('\n')
    };
}

function handleThermal(args: string[]): CommandResult {
    if (args.length < 2) {
        return {
            type: 'error',
            output: 'Usage: thermal <lengthMm> <deltaT_°C> [material]\nExample: thermal 1000 50 6061'
        };
    }

    const length = parseFloat(args[0]);
    const deltaT = parseFloat(args[1]);
    const materialQuery = args[2] || '6061';
    const materialName = findMaterialName(materialQuery);

    if (!materialName) return { type: 'error', output: `Material not found: "${materialQuery}"` };
    if (isNaN(length) || isNaN(deltaT)) return { type: 'error', output: 'Length and deltaT must be numbers.' };

    const engine = new CalculationEngine(materialName);
    const result = engine.calculateThermalExpansion(length, deltaT);

    if (!result.success) return { type: 'error', output: `Error: ${result.error}` };

    return {
        type: 'success',
        output: [
            `✅ Thermal Expansion — ${materialName}`,
            `   Original:     ${result.originalLengthMm} mm`,
            `   ΔT:           ${result.deltaT}°C`,
            `   α:            ${result.thermalCoefficient} µm/(m·K)`,
            `   ΔL:           ${formatNumber(result.deltaLengthMm!, 4)} mm`,
            `   Final Length:  ${formatNumber(result.finalLengthMm!, 4)} mm`,
        ].join('\n')
    };
}

function handleMaterial(args: string[]): CommandResult {
    if (args.length < 1) {
        return { type: 'error', output: 'Usage: material <name>\nExample: material 6061' };
    }

    const query = args.join(' ');
    const mat = MATERIALS_DB.find(m =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(query.toLowerCase().replace(/[^a-z0-9]/g, ''))
    );

    if (!mat) {
        return { type: 'error', output: `Material not found: "${query}"\nUse "list materials" to see available materials.` };
    }

    const props = [
        `📋 ${mat.name}`,
        `   Category:      ${mat.category}`,
        `   Density:        ${mat.density} g/cm³`,
        `   Yield Strength: ${mat.yield} MPa`,
        `   Tensile:        ${mat.tensile} MPa`,
        `   Hardness:       ${mat.hardness}`,
        `   Young's Mod:    ${mat.youngsModulus} GPa`,
        `   Poisson's:      ${mat.poissonsRatio}`,
    ];

    if (mat.thermalCond) props.push(`   Thermal Cond:   ${mat.thermalCond} W/(m·K)`);
    if (mat.thermalExp) props.push(`   Thermal Exp:    ${mat.thermalExp} µm/(m·K)`);
    if (mat.meltingPoint) props.push(`   Melting Point:  ${mat.meltingPoint}°C`);
    if (mat.weldability) props.push(`   Weldability:    ${mat.weldability}`);
    if (mat.machinability) props.push(`   Machinability:  ${mat.machinability}`);

    return { type: 'success', output: props.join('\n') };
}

function handleList(args: string[]): CommandResult {
    const target = (args[0] || '').toLowerCase();

    if (target === 'materials' || target === 'mat') {
        const grouped: Record<string, string[]> = {};
        MATERIALS_DB.forEach(m => {
            if (!grouped[m.category]) grouped[m.category] = [];
            grouped[m.category].push(`  ${m.name} (ρ=${m.density})`);
        });

        const output = Object.entries(grouped).map(([cat, items]) =>
            `── ${cat} ──\n${items.join('\n')}`
        ).join('\n\n');

        return { type: 'info', output: `📦 Available Materials:\n\n${output}` };
    }

    if (target === 'methods' || target === 'cutting') {
        const methods = CalculatorUtils.getCuttingMethods();
        const output = methods.map(m =>
            `  ${m.id.padEnd(18)} ${m.name.padEnd(24)} kerf: ${m.defaultKerf} mm`
        ).join('\n');

        return { type: 'info', output: `🔧 Cutting Methods:\n\n${output}` };
    }

    return { type: 'error', output: 'Usage: list <materials|methods>' };
}

// ─────────────────────────────────────────────
// Help
// ─────────────────────────────────────────────

export function getCommandHelp(): CommandResult {
    return {
        type: 'info',
        output: [
            '╔══════════════════════════════════════════════╗',
            '║        AluCalc OS — Terminal v1.0            ║',
            '╚══════════════════════════════════════════════╝',
            '',
            '  CALCULATION:',
            '    calc plate <LxWxT> [material]    Plate mass',
            '    calc bar   <ØxL>   [material]    Round bar mass',
            '    calc tube  <ODxWTxL> [material]  Tube mass',
            '    calc box   <WxHxWTxL> [mat]      Hollow rect mass',
            '',
            '  ENGINEERING:',
            '    kerf <method> <cutLen> <thick>    Kerf loss calc',
            '    thermal <len> <ΔT> [material]    Thermal expansion',
            '',
            '  DATABASE:',
            '    material <name>                   Show properties',
            '    list materials                    All materials',
            '    list methods                      Cutting methods',
            '',
            '  SYSTEM:',
            '    help                              This help text',
            '    clear                             Clear terminal',
            '',
            '  Examples:',
            '    calc plate 500x200x10 6061',
            '    calc tube 100x5x1000 st37',
            '    kerf laser_fiber 5000 6',
            '    thermal 1000 50 7075',
            '    material 304',
        ].join('\n')
    };
}
