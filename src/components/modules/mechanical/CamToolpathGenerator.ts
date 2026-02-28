import type { NestingResult } from '@/utils/nestingAlgorithm';

export interface CNCConfig {
    feedRate: number; // mm/min
    plungeRate: number; // mm/min
    safeZ: number; // mm
    cutZ: number; // mm
    material: string;
    bladeWidth: number; // mm
}

export function generateGCodeToolpath(result: NestingResult, config: CNCConfig): string {
    const lines: string[] = [];

    // Header
    lines.push('( ======= AluCalc CNC Optimizer Toolpath ======= )');
    lines.push(`( Material: ${config.material} )`);
    lines.push(`( Feed Rate: F${config.feedRate} | Plunge Rate: F${config.plungeRate} )`);
    lines.push(`( Blade/Kerf: ${config.bladeWidth}mm )`);
    lines.push('G90 ; Absolute Positioning');
    lines.push('G21 ; Millimeters');
    lines.push('G17 ; XY Plane Selection');
    lines.push(`G00 Z${config.safeZ.toFixed(3)} ; Move to Safe Z`);
    lines.push('M03 S3000 ; Spindle ON (example speed)');

    // Loop through nested patterns (bars)
    result.patterns.forEach((pattern, pIdx) => {
        lines.push('');
        lines.push(`( --- Stock Bar #${pIdx + 1} | Length: ${pattern.stockLength}mm --- )`);
        lines.push('M00 ; Program Stop - Load New Bar');

        let currentX = 0;

        // Loop through cuts
        pattern.cuts.forEach((cut, cIdx) => {
            lines.push(`( Cut ${cIdx + 1}: ${cut.label} [${cut.length}mm] )`);

            // To cut a part of `cut.length`, the blade's leading edge must be at `currentX + cut.length`.
            // Depending on CNC setup, standard saw offset is usually handled by the post-processor,
            // but for simulation, we place the cut at the right side of the part.
            const cutPositionX = currentX + cut.length + (config.bladeWidth / 2);

            lines.push(`G00 X${cutPositionX.toFixed(3)} Y0.000 ; Rapid to cut X`);
            lines.push(`G01 Z${config.cutZ.toFixed(3)} F${config.plungeRate} ; Plunge cut`);
            lines.push(`G01 Y100.000 F${config.feedRate} ; Saw traverse Y`);
            lines.push(`G00 Z${config.safeZ.toFixed(3)} ; Retract Z`);
            lines.push(`G00 Y0.000 ; Return saw Y`);

            // Advance X by part length + kerf
            currentX += cut.length + config.bladeWidth;
        });

        // Trim Cut (Optional remnant separation)
        if (pattern.waste > 0 && pattern.cuts.length > 0) {
            lines.push(`( Remaining Waste: ${pattern.waste.toFixed(1)}mm )`);
        }
    });

    // Footer
    lines.push('');
    lines.push('( --- End of Toolpath --- )');
    lines.push(`G00 Z${config.safeZ.toFixed(3)} ; Safe Z`);
    lines.push('G00 X0 Y0 ; Return to home');
    lines.push('M05 ; Spindle OFF');
    lines.push('M30 ; End Program');

    return lines.join('\n');
}
