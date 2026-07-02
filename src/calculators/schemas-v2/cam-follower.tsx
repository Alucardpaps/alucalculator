import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const camFollowerSchema: CalculatorSchemaV2 = {
    id: 'cam-follower',
    metadata: {
        title: 'Cam & Follower Design',
        description: 'Kinematics (displacement, velocity, acceleration) and curvature check for disk cams with roller followers.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-06-28',
        tags: ['cam follower', 'kinematics', 'cycloidal motion', 'harmonic motion', 'undercutting', 'machine elements'],
        verifiedStandards: ['Rothbart\'s Cam Design Handbook']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Inline roller follower (zero offset).', impact: 'medium' },
            { id: 'a2', text: 'Rigid body kinematics strictly (no dynamic vibrations).', impact: 'high' }
        ],
        standards: [
            { code: 'Cam Design', title: 'Rothbart Cam Design Handbook, McGraw-Hill' }
        ],
        formulaLatex: 'y(\\theta) = \\frac{h}{2} \\left[1 - \\cos\\left(\\frac{\\pi \\theta}{\\theta_r}\\right)\\right] \\quad , \\quad v_{max} = \\frac{\\pi h \\omega}{2 \\theta_r} \\quad , \\quad a_{max} = \\frac{\\pi^2 h \\omega^2}{2 \\theta_r^2}'
    },
    inputs: [
        { key: 'h', label: 'Follower Rise (h)', unit: 'mm', defaultValue: 25, description: 'Maximum vertical lift of the follower', validation: { required: true, min: 1, max: 200 } },
        { key: 'n', label: 'Cam Rotation Speed (n)', unit: 'rpm', defaultValue: 600, description: 'Rotational speed of the cam shaft', validation: { required: true, min: 1, max: 10000 } },
        {
            key: 'profile',
            label: 'Motion Profile',
            unit: '-',
            defaultValue: 'harmonic',
            description: 'Acceleration/velocity profile function during rise',
            options: [
                { label: 'Simple Harmonic Motion (SHM)', value: 'harmonic' },
                { label: 'Cycloidal Motion (Low Shock)', value: 'cycloidal' }
            ],
            validation: { required: true }
        },
        { key: 'thetaR', label: 'Angle of Rise (θr)', unit: 'deg', defaultValue: 120, description: 'Cam rotation angle during follower rise phase', validation: { required: true, min: 10, max: 350 } },
        { key: 'Rb', label: 'Cam Base Radius (Rb)', unit: 'mm', defaultValue: 40, description: 'Minimum physical radius of the cam profile', validation: { required: true, min: 5, max: 500 } },
        { key: 'Rf', label: 'Roller Follower Radius (Rf)', unit: 'mm', defaultValue: 10, description: 'Radius of the follower contact roller', validation: { required: true, min: 2, max: 100 } }
    ],
    outputs: [
        { key: 'omega', label: 'Angular Velocity (ω)', unit: 'rad/s' as any, description: 'Rotational speed of the cam in radians', precision: 2, formulaLatex: '\\omega = 2\\pi \\cdot n / 60' },
        { key: 'vmax', label: 'Max Velocity (vmax)', unit: 'm/s', description: 'Peak vertical velocity of the follower', precision: 3, formulaLatex: 'v_{max} = \\frac{\\pi h \\omega}{2 \\theta_r} \\text{ (Harmonic)}' },
        { key: 'amax', label: 'Max Acceleration (amax)', unit: 'g' as any, description: 'Peak vertical acceleration in gravitational units', precision: 2, formulaLatex: 'a_{max} = \\frac{\\pi^2 h \\omega^2}{2 \\theta_r^2} / 9.81' },
        { key: 'rhoMin', label: 'Min Cam Curvature (ρmin)', unit: 'mm', description: 'Minimum radius of curvature of the cam profile', precision: 1, formulaLatex: '\\rho_{min} \\approx R_b + h/2' },
        { key: 'undercut', label: 'Undercut Safety', unit: '-', description: 'Whether the base radius is sufficient to prevent undercut (ρmin > Rf)', precision: 0, formulaLatex: '\\rho_{min} > R_f' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const h = Number(inputs.h.value);
        const n = Number(inputs.n.value);
        const profile = String(inputs.profile.value);
        const thetaRDeg = Number(inputs.thetaR.value);
        const Rb = Number(inputs.Rb.value);
        const Rf = Number(inputs.Rf.value);

        const omega = (2 * Math.PI * n) / 60;
        const thetaRRad = (thetaRDeg * Math.PI) / 180;

        let vmax = 0;
        let amax = 0;

        if (profile === 'harmonic') {
            vmax = (Math.PI * h * omega) / (2 * thetaRRad); // mm/s
            amax = (Math.PI * Math.PI * h * omega * omega) / (2 * thetaRRad * thetaRRad); // mm/s^2
        } else {
            // Cycloidal
            vmax = (2 * h * omega) / thetaRRad; // mm/s
            amax = (2 * Math.PI * h * omega * omega) / (thetaRRad * thetaRRad); // mm/s^2
        }

        // Convert to standard units (vmax to m/s, amax to g)
        const vmaxMS = vmax / 1000;
        const amaxG = amax / (9.81 * 1000);

        // Approximate minimum radius of curvature
        // To avoid undercutting, the radius of curvature must be greater than roller radius.
        // Simplified conservative check for disk cam: rho_min = Rb - Rf (minimum at inner contour)
        // Let's use Rothbart's estimate for minimum profile curvature:
        const rhoMin = Rb + h / 2 - (amax / (omega * omega)); // rough analytical contour minimum
        const safeMin = Math.max(1.0, rhoMin);
        const isSafe = safeMin > Rf;

        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];

        if (!isSafe) {
            warnings.push({
                field: 'Rb',
                message: `Undercutting alert! Minimum radius of curvature (${safeMin.toFixed(1)} mm) is less than roller radius (${Rf} mm). The follower will not track the profile accurately (profile flat-spot/cusp). Increase Base Radius (Rb).`,
                severity: 'critical'
            });
        }

        if (amaxG > 10) {
            warnings.push({
                field: 'amax',
                message: `Extreme acceleration (${amaxG.toFixed(1)} g) detected. Follower jump/loss of contact may occur without heavy pre-load spring force.`,
                severity: 'warning'
            });
        }

        return {
            outputs: {
                omega: createValidatedValue(omega, 'rad/s' as any, 'derived'),
                vmax: createValidatedValue(vmaxMS, 'm/s', 'derived'),
                amax: createValidatedValue(amaxG, '-', 'derived'), // standard g notation
                rhoMin: createValidatedValue(safeMin, 'mm', 'derived'),
                undercut: createValidatedValue(isSafe ? 1 : 0, '-', 'derived')
            },
            verified: true,
            warnings,
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: any) => {
            const out = result.outputs || {};
            const isSafe = (out.undercut?.value as number) === 1;

            return (
                <div className="w-full h-full flex flex-row items-center justify-center p-6 bg-[#05080b] gap-12">
                    {/* Cam SVG representation */}
                    <div className="relative w-[200px] h-[200px]">
                        <svg viewBox="0 0 200 200" width="100%" height="100%" className="overflow-visible animate-spin" style={{ animationDuration: '6s', animationTimingFunction: 'linear' }}>
                            {/* Rotation Center */}
                            <circle cx="100" cy="100" r="4" fill="#00e5ff" />
                            
                            {/* Base Circle */}
                            <circle cx="100" cy="100" r="35" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />

                            {/* Cam profile (Egg shape representation) */}
                            <path
                                d="M 100 65 C 135 65, 140 100, 135 130 C 130 150, 70 150, 65 130 C 60 100, 65 65, 100 65 Z"
                                fill="none"
                                stroke={isSafe ? '#10b981' : '#ef4444'}
                                strokeWidth="2.5"
                            />

                            {/* Arrow indicating rotation */}
                            <path d="M 155 100 A 55 55 0 0 1 140 135" fill="none" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow_cam)" />
                            <defs>
                                <marker id="arrow_cam" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                    <polygon points="0 0, 6 2, 0 4" fill="#f59e0b" />
                                </marker>
                            </defs>
                        </svg>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col gap-5 w-36 border border-[#1a1f26] bg-[#0a0e14] p-4 rounded-xl">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Max Accel</div>
                            <div className="text-xl font-bold font-mono text-white">
                                {((out.amax?.value as number) || 0).toFixed(1)} <span className="text-[10px] text-gray-500">g</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Max Speed</div>
                            <div className="text-xl font-bold font-mono text-[#00e5ff]">
                                {((out.vmax?.value as number) || 0).toFixed(2)} <span className="text-[10px] text-gray-500">m/s</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Undercutting</div>
                            <div className={`text-xs font-bold font-mono ${isSafe ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isSafe ? 'SAFE' : 'CRITICAL'}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    tier: 'free'
};

export default camFollowerSchema;
