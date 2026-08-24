/**
 * Enhanced 1D Bin Packing Algorithms
 * 
 * Supports:
 * - Best Fit Decreasing (BFD) - Minimizes waste per bar
 * - First Fit Decreasing (FFD) - Faster, good approximation
 * - Reusable remnants from previous cuts
 */

export interface StockItem {
    length: number;
    count: number;
}

export interface CutItem {
    id: string;
    length: number;
    qty: number;
    label: string;
}

export interface CutPattern {
    stockLength: number;
    effectiveLength?: number; // After trimming
    cuts: CutItem[];
    waste: number;
    wastePct: number;
    isRemnant?: boolean;
    rotationApplied?: boolean; // Track if rotation was needed
}

export interface ManualSheet {
    width: number;
    height: number;
}

export interface NestingResult {
    patterns: CutPattern[];
    totalStockUsed: number;
    totalWaste: number;
    totalWastePct: number;
    stockLength: number;
    algorithm: NestingAlgorithm;
    stats: {
        totalCuts: number;
        avgWastePerBar: number;
        efficiencyRating: 'excellent' | 'good' | 'fair' | 'poor';
    };
}

export type NestingAlgorithm = 'bfd' | 'ffd';

export interface NestingOptions {
    algorithm?: NestingAlgorithm;
    bladeWidth?: number;
    remnants?: number[]; // Available remnant lengths to use first
    minUsableWaste?: number; // Minimum waste length to keep as remnant
    trimming?: { start: number; end: number }; // mm removed from raw bar ends
}

/**
 * Main nesting function with algorithm selection
 */
export function calculateNesting(
    items: CutItem[],
    stockLength: number,
    options: NestingOptions = {}
): NestingResult {
    const {
        algorithm = 'bfd',
        bladeWidth = 4,
        remnants = [],
        minUsableWaste = 100,
        trimming = { start: 0, end: 0 },
    } = options;

    // Calculate effective stock length after trimming
    const effectiveStockLength = stockLength - trimming.start - trimming.end;

    // 1. Expand items into individual pieces
    const pieces: CutItem[] = [];
    items.forEach(item => {
        for (let i = 0; i < item.qty; i++) {
            pieces.push({ ...item, qty: 1 });
        }
    });

    // 2. Sort decreasing (critical for both BFD and FFD)
    pieces.sort((a, b) => b.length - a.length);

    // 3. Initialize patterns with available remnants first
    const patterns: CutPattern[] = remnants
        .sort((a, b) => b - a)
        .map(remnantLength => ({
            stockLength: remnantLength,
            cuts: [],
            waste: remnantLength,
            wastePct: 100,
            isRemnant: true,
        }));

    // 4. Allocate pieces based on algorithm (use effective length for new stock)
    if (algorithm === 'bfd') {
        allocateBestFit(pieces, patterns, effectiveStockLength, bladeWidth, stockLength);
    } else {
        allocateFirstFit(pieces, patterns, effectiveStockLength, bladeWidth, stockLength);
    }

    // 5. Remove empty patterns (unused remnants)
    const usedPatterns = patterns.filter(p => p.cuts.length > 0);

    // 6. Mark useful waste as remnants
    usedPatterns.forEach(pattern => {
        if (pattern.waste >= minUsableWaste) {
            pattern.isRemnant = true;
        }
    });

    // 7. Calculate stats
    const totalLength = usedPatterns.reduce((sum, p) => sum + p.stockLength, 0);
    const totalWaste = usedPatterns.reduce((sum, p) => sum + p.waste, 0);
    const totalCuts = pieces.length;
    const avgWastePerBar = usedPatterns.length > 0 ? totalWaste / usedPatterns.length : 0;
    const wastePct = totalLength > 0 ? (totalWaste / totalLength) * 100 : 0;

    let efficiencyRating: 'excellent' | 'good' | 'fair' | 'poor';
    if (wastePct <= 5) efficiencyRating = 'excellent';
    else if (wastePct <= 15) efficiencyRating = 'good';
    else if (wastePct <= 25) efficiencyRating = 'fair';
    else efficiencyRating = 'poor';

    return {
        patterns: usedPatterns,
        totalStockUsed: usedPatterns.filter(p => !p.isRemnant || p.cuts.length > 0).length,
        totalWaste,
        totalWastePct: wastePct,
        stockLength,
        algorithm,
        stats: {
            totalCuts,
            avgWastePerBar,
            efficiencyRating,
        },
    };
}

/**
 * Best Fit Decreasing - Places each piece in the bar with minimum remaining space
 */
function allocateBestFit(
    pieces: CutItem[],
    patterns: CutPattern[],
    effectiveStockLength: number,
    bladeWidth: number,
    originalStockLength: number = effectiveStockLength
): void {
    pieces.forEach(piece => {
        let bestPatternIndex = -1;
        let minRemaining = Infinity;

        // Find bar with minimum remaining space that can fit this piece
        for (let i = 0; i < patterns.length; i++) {
            const used = patterns[i].cuts.reduce((sum, c) => sum + c.length + bladeWidth, 0);
            const remaining = patterns[i].stockLength - used;

            if (remaining >= piece.length) {
                if (remaining < minRemaining) {
                    minRemaining = remaining;
                    bestPatternIndex = i;
                }
            }
        }

        if (bestPatternIndex !== -1) {
            addCutToPattern(patterns[bestPatternIndex], piece, bladeWidth);
        } else {
            // Start new stock (use effective length for capacity, original for display)
            const newPattern: CutPattern = {
                stockLength: originalStockLength,
                effectiveLength: effectiveStockLength,
                cuts: [piece],
                waste: effectiveStockLength - piece.length,
                wastePct: ((effectiveStockLength - piece.length) / effectiveStockLength) * 100,
            };
            patterns.push(newPattern);
        }
    });
}

/**
 * First Fit Decreasing - Places each piece in the first bar that can fit it
 */
function allocateFirstFit(
    pieces: CutItem[],
    patterns: CutPattern[],
    effectiveStockLength: number,
    bladeWidth: number,
    originalStockLength: number = effectiveStockLength
): void {
    pieces.forEach(piece => {
        let placed = false;

        // Find first bar that can fit this piece
        for (let i = 0; i < patterns.length; i++) {
            const used = patterns[i].cuts.reduce((sum, c) => sum + c.length + bladeWidth, 0);
            const remaining = patterns[i].stockLength - used;

            if (remaining >= piece.length) {
                addCutToPattern(patterns[i], piece, bladeWidth);
                placed = true;
                break;
            }
        }

        if (!placed) {
            // Start new stock (use effective length for capacity, original for display)
            const newPattern: CutPattern = {
                stockLength: originalStockLength,
                effectiveLength: effectiveStockLength,
                cuts: [piece],
                waste: effectiveStockLength - piece.length,
                wastePct: ((effectiveStockLength - piece.length) / effectiveStockLength) * 100,
            };
            patterns.push(newPattern);
        }
    });
}

/**
 * 2D Nesting Helper (Simple Rotation Check)
 * This logic extends the 1D algorithm for basic 2D checks if needed,
 * though full 2D nesting is handled by the worker.
 * 
 * Mimics the requested logic:
 * if (currentX + part.width > sheet.width) {
 *    // Try rotation
 *    if (currentX + part.height <= sheet.width && ...)
 * }
 */
export function canFitWithRotation(
    partWidth: number,
    partHeight: number,
    spaceWidth: number,
    spaceHeight: number
): { fits: boolean, rotated: boolean } {
    // Try normal
    if (partWidth <= spaceWidth && partHeight <= spaceHeight) {
        return { fits: true, rotated: false };
    }

    // Try rotation
    if (partHeight <= spaceWidth && partWidth <= spaceHeight) {
        return { fits: true, rotated: true };
    }

    return { fits: false, rotated: false };
}

/**
 * Add cut to pattern and recalculate waste
 */
function addCutToPattern(pattern: CutPattern, cut: CutItem, bladeWidth: number): void {
    pattern.cuts.push(cut);
    const used = pattern.cuts.reduce((sum, c) => sum + c.length + bladeWidth, 0) - bladeWidth;
    pattern.waste = pattern.stockLength - used;
    pattern.wastePct = (pattern.waste / pattern.stockLength) * 100;
}

/**
 * Compare algorithms for a given set of cuts
 */
export function compareAlgorithms(
    items: CutItem[],
    stockLength: number,
    bladeWidth: number = 4
): { bfd: NestingResult; ffd: NestingResult; recommendation: NestingAlgorithm } {
    const bfd = calculateNesting(items, stockLength, { algorithm: 'bfd', bladeWidth });
    const ffd = calculateNesting(items, stockLength, { algorithm: 'ffd', bladeWidth });

    // Recommend the one with less waste
    const recommendation = bfd.totalWaste <= ffd.totalWaste ? 'bfd' : 'ffd';

    return { bfd, ffd, recommendation };
}

/**
 * Get remnants from a nesting result (waste pieces >= minLength)
 */
export function extractRemnants(result: NestingResult, minLength: number = 100): number[] {
    return result.patterns
        .filter(p => p.waste >= minLength)
        .map(p => p.waste)
        .sort((a, b) => b - a);
}

/**
 * Calculate theoretical minimum bars needed (lower bound)
 */
export function calculateMinBars(items: CutItem[], stockLength: number, bladeWidth: number = 4): number {
    let totalLength = 0;
    items.forEach(item => {
        totalLength += item.qty * (item.length + bladeWidth);
    });
    totalLength -= bladeWidth; // Last piece doesn't need blade width after
    return Math.ceil(totalLength / stockLength);
}

