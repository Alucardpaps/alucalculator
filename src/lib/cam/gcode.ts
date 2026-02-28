/**
 * CAM Engine - GCode Generator
 * 
 * Exports manufacturing paths to standard G-Code (RS-274).
 * Supports Laser and Plasma cutters.
 */

import { Point } from '../../cad/kernel/types';

export interface CamPath {
    start: Point;
    points: Point[];
    type?: 'CUT' | 'RAPID';
}

export function exportGCode(paths: CamPath[], type: 'LASER' | 'PLASMA' = 'LASER'): string {
    const timestamp = new Date().toISOString();
    let code = `%
(ALUCALC CAM OUTPUT)
(TYPE: ${type})
(DATE: ${timestamp})
G21 (Metric)
G90 (Absolute positioning)
F1200 (Default Feed Rate)
`;

    // Tool On/Off commands
    const TOOL_ON = type === 'LASER' ? 'M3 (Laser On)' : 'M3\nG4 P0.5 (Plasma Ignited)';
    const TOOL_OFF = 'M5 (Tool Off)';

    for (const path of paths) {
        // Rapid move to start
        code += `\nG0 X${path.start.x.toFixed(3)} Y${path.start.y.toFixed(3)}\n`;

        // Ignite
        code += `${TOOL_ON}\n`;

        // Cut path
        for (const p of path.points) {
            code += `G1 X${p.x.toFixed(3)} Y${p.y.toFixed(3)}\n`;
        }

        // Extinguish
        code += `${TOOL_OFF}\n`;
    }

    // End program
    code += `\nM30 (End Program)\n%`;

    return code;
}
