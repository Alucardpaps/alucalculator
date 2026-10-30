'use client';

import React from 'react';

export interface DynamicBlockAnimatedIconProps {
    blockId: string;
    isSelected?: boolean;
    size?: number;
    className?: string;
}

/**
 * 🎨 AluCAD High-Precision Engineering Animated SVG Icons
 * Replaces plain emoji icons with vector-sharp, technical animated SVGs.
 * Complies with the "AluCalc Instrument" CNC design system tokens.
 */
export const DynamicBlockAnimatedIcon: React.FC<DynamicBlockAnimatedIconProps> = ({
    blockId,
    isSelected = false,
    size = 24,
    className = ''
}) => {
    const strokeColor = isSelected ? '#00e5ff' : '#94a3b8';
    const accentColor = isSelected ? '#38bdf8' : '#64748b';
    const glowClass = isSelected ? 'drop-' : '';

    switch (blockId) {
        // ── 1. SHEET METAL PLATE WITH LASER CUTTER SPARK ──
        case 'dyn_sheet_metal_plate':
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    {/* Outer Plate with rounded corners */}
                    <rect
                        x="3"
                        y="4"
                        width="26"
                        height="24"
                        rx="3"
                        stroke={strokeColor}
                        strokeWidth="1.6"
                        fill="#0b131e"
                    />
                    {/* 4 Corner Clearance Holes */}
                    <circle cx="7.5" cy="8.5" r="1.5" fill={accentColor} />
                    <circle cx="24.5" cy="8.5" r="1.5" fill={accentColor} />
                    <circle cx="24.5" cy="23.5" r="1.5" fill={accentColor} />
                    <circle cx="7.5" cy="23.5" r="1.5" fill={accentColor} />
                    {/* Center Cutout Window */}
                    <rect
                        x="11"
                        y="11"
                        width="10"
                        height="10"
                        rx="1"
                        stroke={strokeColor}
                        strokeWidth="1.2"
                        strokeDasharray="2 2"
                        fill="#07090c"
                    />
                    {/* Laser Cutting Beam / Spark Animation */}
                    <circle cx="16" cy="11" r="1.5" fill="#f59e0b">
                        <animate
                            attributeName="opacity"
                            values="0.3;1;0.3"
                            dur="1.2s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <line
                        x1="11"
                        y1="11"
                        x2="21"
                        y2="11"
                        stroke="#f59e0b"
                        strokeWidth="1.2"
                        strokeDasharray="4 4"
                    >
                        <animate
                            attributeName="stroke-dashoffset"
                            values="8;0"
                            dur="1.2s"
                            repeatCount="indefinite"
                        />
                    </line>
                </svg>
            );

        // ── 2. GAMAK INDUSTRIAL ELECTRIC MOTOR (AGM3EL IE3) ──
        case 'dyn_gamak_motor':
        case 'dyn_electric_motor':
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    {/* Stator Carcass */}
                    <rect x="11" y="9" width="14" height="15" rx="1.5" fill="#0284c7" fillOpacity="0.25" stroke={strokeColor} strokeWidth="1.4" />
                    {/* Stator Cooling Fins */}
                    <line x1="14" y1="9" x2="14" y2="24" stroke={accentColor} strokeWidth="1" strokeDasharray="1 1" />
                    <line x1="18" y1="9" x2="18" y2="24" stroke={accentColor} strokeWidth="1" strokeDasharray="1 1" />
                    <line x1="22" y1="9" x2="22" y2="24" stroke={accentColor} strokeWidth="1" strokeDasharray="1 1" />
                    {/* Terminal Box on top */}
                    <rect x="15" y="4.5" width="6" height="4.5" rx="1" fill="#22c55e" fillOpacity="0.3" stroke="#22c55e" strokeWidth="1.2" />
                    {/* Mounting Feet */}
                    <rect x="12" y="24" width="4" height="3" fill={strokeColor} />
                    <rect x="20" y="24" width="4" height="3" fill={strokeColor} />
                    <line x1="9" y1="27" x2="27" y2="27" stroke={accentColor} strokeWidth="1.2" />
                    {/* Rear Fan Cowl */}
                    <path d="M25 10H28V23H25" stroke={strokeColor} strokeWidth="1.3" />
                    {/* Rotating Rotor Shaft */}
                    <rect x="4" y="14.5" width="7" height="4" rx="0.8" fill="#f59e0b" fillOpacity="0.4" stroke="#f59e0b" strokeWidth="1.2" />
                    {/* Spinning Shaft crosshair animation */}
                    <g className="origin-[7.5px_16.5px]">
                        <line x1="5.5" y1="16.5" x2="9.5" y2="16.5" stroke="#f8fafc" strokeWidth="1">
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from="0 7.5 16.5"
                                to="360 7.5 16.5"
                                dur="1.5s"
                                repeatCount="indefinite"
                            />
                        </line>
                    </g>
                </svg>
            );

        // ── 3. YILMAZ INDUSTRIAL GEARBOX (M & K SERIES) ──
        case 'dyn_yilmaz_gearbox':
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    {/* Gearbox Cast Body Contour */}
                    <path
                        d="M8 8H22C24.2 8 26 9.8 26 12V24H6V12C6 9.8 7.8 8 8 8Z"
                        fill="#0c1a29"
                        stroke={strokeColor}
                        strokeWidth="1.4"
                    />
                    {/* Input Bell Housing PAM Adapter */}
                    <rect x="22" y="11" width="5" height="9" rx="1" fill="#1e293b" stroke={accentColor} strokeWidth="1" />
                    {/* Mounting Feet */}
                    <rect x="5" y="24" width="6" height="3" fill={strokeColor} />
                    <rect x="21" y="24" width="6" height="3" fill={strokeColor} />
                    {/* Counter-Rotating Meshed Gear 1 (Driven Gear) */}
                    <g className="origin-[13px_17px]">
                        <circle cx="13" cy="17" r="5" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="2.5 1.5" />
                        <circle cx="13" cy="17" r="1.8" fill="#f59e0b" />
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 13 17"
                            to="360 13 17"
                            dur="3s"
                            repeatCount="indefinite"
                        />
                    </g>
                    {/* Counter-Rotating Meshed Gear 2 (Pinion) */}
                    <g className="origin-[20px_13px]">
                        <circle cx="20" cy="13" r="3.2" stroke="#00e5ff" strokeWidth="1.1" strokeDasharray="2 1.2" />
                        <circle cx="20" cy="13" r="1.2" fill="#00e5ff" />
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="360 20 13"
                            to="0 20 13"
                            dur="1.5s"
                            repeatCount="indefinite"
                        />
                    </g>
                </svg>
            );

        // ── 4. SKF DEEP GROOVE BALL BEARING (ISO 15) ──
        case 'dyn_skf_bearing':
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    {/* Outer Race */}
                    <circle cx="16" cy="16" r="13" stroke={strokeColor} strokeWidth="1.8" fill="#07090c" />
                    <circle cx="16" cy="16" r="11" stroke={accentColor} strokeWidth="0.8" />
                    {/* Inner Race */}
                    <circle cx="16" cy="16" r="6" stroke={strokeColor} strokeWidth="1.6" fill="#0b131e" />
                    <circle cx="16" cy="16" r="4.2" stroke={accentColor} strokeWidth="0.8" />
                    {/* Revolving Bearing Balls */}
                    <g className="origin-[16px_16px]">
                        <circle cx="16" cy="7.5" r="1.8" fill="#38bdf8" />
                        <circle cx="22" cy="10" r="1.8" fill="#38bdf8" />
                        <circle cx="24.5" cy="16" r="1.8" fill="#38bdf8" />
                        <circle cx="22" cy="22" r="1.8" fill="#38bdf8" />
                        <circle cx="16" cy="24.5" r="1.8" fill="#38bdf8" />
                        <circle cx="10" cy="22" r="1.8" fill="#38bdf8" />
                        <circle cx="7.5" cy="16" r="1.8" fill="#38bdf8" />
                        <circle cx="10" cy="10" r="1.8" fill="#38bdf8" />
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 16 16"
                            to="360 16 16"
                            dur="4s"
                            repeatCount="indefinite"
                        />
                    </g>
                </svg>
            );

        // ── 5. INVOLUTE SPUR GEAR (ISO 6336 / DIN 3990) ──
        case 'dyn_involute_gear':
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    <g className="origin-[16px_16px]">
                        {/* Outer Gear Teeth Contour */}
                        <circle
                            cx="16"
                            cy="16"
                            r="12.5"
                            stroke={strokeColor}
                            strokeWidth="2.4"
                            strokeDasharray="4 2.5"
                        />
                        {/* Pitch Circle */}
                        <circle cx="16" cy="16" r="10" stroke={accentColor} strokeWidth="1" strokeDasharray="1.5 1.5" />
                        {/* Bore Hub & Keyway */}
                        <circle cx="16" cy="16" r="4.5" stroke={strokeColor} strokeWidth="1.4" fill="#07090c" />
                        <rect x="15" y="11.5" width="2" height="3" fill="#f59e0b" />
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 16 16"
                            to="360 16 16"
                            dur="5s"
                            repeatCount="indefinite"
                        />
                    </g>
                </svg>
            );

        // ── 6. ROLLER SPROCKET & CHAIN (ISO 606 / DIN 8187) ──
        case 'dyn_roller_sprocket':
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    <g className="origin-[16px_16px]">
                        <circle cx="16" cy="16" r="11.5" stroke={strokeColor} strokeWidth="2.2" strokeDasharray="3 3" />
                        <circle cx="16" cy="16" r="4" stroke={strokeColor} strokeWidth="1.4" fill="#07090c" />
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 16 16"
                            to="360 16 16"
                            dur="4s"
                            repeatCount="indefinite"
                        />
                    </g>
                    {/* Tangent Chain Drive Line */}
                    <line x1="4" y1="5" x2="28" y2="5" stroke="#f59e0b" strokeWidth="1.6" strokeDasharray="3 3">
                        <animate attributeName="stroke-dashoffset" values="6;0" dur="1s" repeatCount="indefinite" />
                    </line>
                </svg>
            );

        // ── 7. TIMING BELT PULLEY (ISO 13050 HTD / GT2) ──
        case 'dyn_timing_pulley':
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    <circle cx="16" cy="16" r="13" stroke={accentColor} strokeWidth="1" />
                    <g className="origin-[16px_16px]">
                        <circle cx="16" cy="16" r="10.5" stroke={strokeColor} strokeWidth="2.5" strokeDasharray="2 2" />
                        <circle cx="16" cy="16" r="4.2" stroke={strokeColor} strokeWidth="1.4" fill="#07090c" />
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 16 16"
                            to="360 16 16"
                            dur="3.5s"
                            repeatCount="indefinite"
                        />
                    </g>
                </svg>
            );

        // ── 8. V-BELT PULLEY (ISO 4183 / DIN 2211) ──
        case 'dyn_v_belt_pulley':
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    <circle cx="16" cy="16" r="13" stroke={strokeColor} strokeWidth="1.6" fill="#07090c" />
                    <circle cx="16" cy="16" r="9.5" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="4 2" />
                    <circle cx="16" cy="16" r="4.5" stroke={strokeColor} strokeWidth="1.4" fill="#0b131e" />
                </svg>
            );

        // ── 9. UNIVERSAL FASTENER / BOLT & NUT (ISO 4014 / DIN 912) ──
        case 'dyn_fastener':
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    {/* Hexagonal / Socket Bolt Head */}
                    <rect x="7" y="5" width="18" height="6" rx="1.5" fill="#1e293b" stroke={strokeColor} strokeWidth="1.5" />
                    {/* Shank */}
                    <rect x="12" y="11" width="8" height="16" fill="#0f172a" stroke={strokeColor} strokeWidth="1.4" />
                    {/* Thread Ridges */}
                    <line x1="12" y1="16" x2="20" y2="18" stroke="#38bdf8" strokeWidth="1.2" />
                    <line x1="12" y1="19" x2="20" y2="21" stroke="#38bdf8" strokeWidth="1.2" />
                    <line x1="12" y1="22" x2="20" y2="24" stroke="#38bdf8" strokeWidth="1.2" />
                    {/* Washer / Nut */}
                    <rect x="9" y="13" width="14" height="2" fill="#f59e0b" rx="0.5" />
                </svg>
            );

        // ── 10. T-SLOT ALUMINIUM SIGMA PROFILE ──
        case 'dyn_tslot_profile':
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    {/* Outer Square Profile */}
                    <rect x="4" y="4" width="24" height="24" rx="2" stroke={strokeColor} strokeWidth="1.6" fill="#0b131e" />
                    {/* Center Core Hole */}
                    <circle cx="16" cy="16" r="3" stroke={strokeColor} strokeWidth="1.2" fill="#07090c" />
                    {/* 4 T-Slots (Top, Right, Bottom, Left) */}
                    <rect x="13.5" y="4" width="5" height="4" fill="#00e5ff" fillOpacity="0.4" />
                    <rect x="24" y="13.5" width="4" height="5" fill="#00e5ff" fillOpacity="0.4" />
                    <rect x="13.5" y="24" width="5" height="4" fill="#00e5ff" fillOpacity="0.4" />
                    <rect x="4" y="13.5" width="4" height="5" fill="#00e5ff" fillOpacity="0.4" />
                </svg>
            );

        // ── 11. RECTANGULAR BOX PROFILE TUBE ──
        case 'dyn_box_profile':
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    <rect x="4" y="6" width="24" height="20" rx="2.5" stroke={strokeColor} strokeWidth="1.6" fill="#0b131e" />
                    <rect x="8" y="10" width="16" height="12" rx="1.5" stroke={accentColor} strokeWidth="1.2" fill="#07090c" />
                </svg>
            );

        // ── 12. STRUCTURAL STEEL BEAM (HEA / IPE / UNP) ──
        case 'dyn_steel_beam':
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    {/* Top Flange */}
                    <rect x="5" y="5" width="22" height="4.5" rx="0.8" fill="#1e293b" stroke={strokeColor} strokeWidth="1.4" />
                    {/* Web */}
                    <rect x="13.5" y="9.5" width="5" height="13" fill="#1e293b" stroke={strokeColor} strokeWidth="1.4" />
                    {/* Bottom Flange */}
                    <rect x="5" y="22.5" width="22" height="4.5" rx="0.8" fill="#1e293b" stroke={strokeColor} strokeWidth="1.4" />
                </svg>
            );

        // ── 13. ARCHITECTURAL DOOR WITH OPENING SWING ARC ──
        case 'dyn_door':
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    {/* Wall Jambs */}
                    <rect x="4" y="22" width="4" height="5" fill={strokeColor} />
                    <rect x="24" y="22" width="4" height="5" fill={strokeColor} />
                    {/* Door Leaf standing 90 deg */}
                    <rect x="6" y="6" width="3" height="18" fill="#38bdf8" stroke={strokeColor} strokeWidth="1.2" />
                    {/* Swing Arc Path */}
                    <path
                        d="M8 6C17 6 24 13 24 22"
                        stroke="#00e5ff"
                        strokeWidth="1.4"
                        strokeDasharray="3 2"
                    >
                        <animate
                            attributeName="stroke-dashoffset"
                            values="10;0"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </path>
                </svg>
            );

        // ── 14. ARCHITECTURAL WINDOW WITH GLAZING SHEEN ──
        case 'dyn_window':
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    <rect x="4" y="6" width="24" height="20" rx="1.5" stroke={strokeColor} strokeWidth="1.6" fill="#0b131e" />
                    {/* Mullion cross */}
                    <line x1="16" y1="6" x2="16" y2="26" stroke={strokeColor} strokeWidth="1.4" />
                    <line x1="4" y1="16" x2="28" y2="16" stroke={strokeColor} strokeWidth="1.4" />
                    {/* Glazing Reflection Sheen */}
                    <line x1="8" y1="10" x2="13" y2="14" stroke="#00e5ff" strokeWidth="1" strokeOpacity="0.8" />
                    <line x1="20" y1="18" x2="25" y2="22" stroke="#00e5ff" strokeWidth="1" strokeOpacity="0.8" />
                </svg>
            );

        // ── 15. SLIDING DOOR WITH MOTION ARROWS ──
        case 'dyn_sliding_door':
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    {/* Track */}
                    <line x1="4" y1="10" x2="28" y2="10" stroke={strokeColor} strokeWidth="1.6" />
                    <line x1="4" y1="22" x2="28" y2="22" stroke={strokeColor} strokeWidth="1.6" />
                    {/* Left Panel */}
                    <rect x="6" y="8" width="11" height="16" rx="1" fill="#0284c7" fillOpacity="0.3" stroke={strokeColor} strokeWidth="1.2" />
                    {/* Right Sliding Panel */}
                    <rect x="15" y="8" width="11" height="16" rx="1" fill="#00e5ff" fillOpacity="0.3" stroke="#00e5ff" strokeWidth="1.2">
                        <animate
                            attributeName="x"
                            values="15;18;15"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </rect>
                </svg>
            );

        // ── 16. ELEVATOR LIFT SHAFT & CABIN ──
        case 'dyn_elevator':
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    {/* Hoistway Shaft */}
                    <rect x="5" y="4" width="22" height="24" rx="1" stroke={strokeColor} strokeWidth="1.4" fill="#07090c" />
                    {/* Moving Elevator Cabin */}
                    <rect x="8" y="11" width="16" height="12" rx="1" fill="#0284c7" fillOpacity="0.35" stroke="#00e5ff" strokeWidth="1.3">
                        <animate
                            attributeName="y"
                            values="7;13;7"
                            dur="3s"
                            repeatCount="indefinite"
                        />
                    </rect>
                    {/* Suspension Cable */}
                    <line x1="16" y1="4" x2="16" y2="11" stroke="#f59e0b" strokeWidth="1.2" />
                </svg>
            );

        // ── 17. PIPE FLANGE SPOOL (EN 1092-1) ──
        case 'dyn_pipe_flange':
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    <rect x="4" y="6" width="5" height="20" rx="1" fill="#1e293b" stroke={strokeColor} strokeWidth="1.4" />
                    <rect x="9" y="10" width="14" height="12" fill="#0f172a" stroke={strokeColor} strokeWidth="1.4" />
                    <rect x="23" y="6" width="5" height="20" rx="1" fill="#1e293b" stroke={strokeColor} strokeWidth="1.4" />
                    <circle cx="6.5" cy="10" r="1.2" fill="#f59e0b" />
                    <circle cx="6.5" cy="22" r="1.2" fill="#f59e0b" />
                    <circle cx="25.5" cy="10" r="1.2" fill="#f59e0b" />
                    <circle cx="25.5" cy="22" r="1.2" fill="#f59e0b" />
                </svg>
            );

        // ── 18. STRUCTURAL ROOF TRUSS ──
        case 'dyn_roof_truss':
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    <polygon points="4,22 16,8 28,22" stroke={strokeColor} strokeWidth="1.6" fill="#07090c" />
                    <line x1="4" y1="22" x2="28" y2="22" stroke={strokeColor} strokeWidth="1.6" />
                    <line x1="16" y1="8" x2="16" y2="22" stroke={accentColor} strokeWidth="1.2" />
                    <line x1="10" y1="15" x2="16" y2="22" stroke={accentColor} strokeWidth="1" />
                    <line x1="22" y1="15" x2="16" y2="22" stroke={accentColor} strokeWidth="1" />
                </svg>
            );

        // ── DEFAULT BLUEPRINT INSTRUMENT FALLBACK ──
        default:
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform ${glowClass} ${className}`}
                >
                    <rect x="4" y="4" width="24" height="24" rx="3" stroke={strokeColor} strokeWidth="1.5" fill="#0b131e" />
                    <line x1="4" y1="16" x2="28" y2="16" stroke={accentColor} strokeWidth="0.8" strokeDasharray="2 2" />
                    <line x1="16" y1="4" x2="16" y2="28" stroke={accentColor} strokeWidth="0.8" strokeDasharray="2 2" />
                    <circle cx="16" cy="16" r="6" stroke="#00e5ff" strokeWidth="1.4" />
                </svg>
            );
    }
};
