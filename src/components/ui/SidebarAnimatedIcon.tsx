'use client';

import React from 'react';

interface SidebarAnimatedIconProps {
  itemId?: string;
  id?: string;
  color?: string;
  isActive?: boolean;
  isHovered?: boolean;
  size?: number;
  className?: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  fallbackIcon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

/**
 * 🧵 BESPOKE THREAD-DRAWING FRAMELESS SVG ENGINEERING ICONS
 * Clean, flat vector line icons that draw themselves like a thread on hover.
 */
export function SidebarAnimatedIcon({
  itemId = '',
  id: idProp,
  color = '#38bdf8',
  isActive = false,
  isHovered = false,
  size = 18,
  className = '',
  icon,
  fallbackIcon,
}: SidebarAnimatedIconProps) {
  const id = (idProp || itemId || '').toLowerCase();
  const FallbackIcon = icon || fallbackIcon;
  const isHighlighted = isActive || isHovered;

  // Helper to render bespoke thread-drawing SVG paths based on tool ID
  const renderBespokePath = () => {
    switch (id) {
      // ─── CAD & STUDIOS ───
      case 'design-studio': // 3D Parametric Box (Isometric Wireframe)
        return (
          <>
            {/* Top Face */}
            <polygon points="12,3 21,7.5 12,12 3,7.5" />
            {/* Front Left Face */}
            <polygon points="3,7.5 12,12 12,21 3,16.5" />
            {/* Front Right Face */}
            <polygon points="12,12 21,7.5 21,16.5 12,21" />
            {/* Internal 3D center node */}
            <circle cx="12" cy="12" r="1" fill={color} />
          </>
        );

      case 'cad-editor': // 2D Drafting Pencil & T-Square
        return (
          <>
            <line x1="3" y1="21" x2="21" y2="3" />
            <path d="M14 4 L20 10" />
            <path d="M4 20 L8 20 L3 15 Z" />
            <line x1="10" y1="18" x2="18" y2="18" strokeDasharray="2,2" />
            <line x1="18" y1="10" x2="18" y2="18" strokeDasharray="2,2" />
          </>
        );

      case 'fea-studio': // FEA Linear Static Mesh & Stress Wave
        return (
          <>
            <polygon points="4,5 20,5 18,19 6,19" />
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
            <circle cx="12" cy="12" r="1.5" fill={color} />
            <path d="M2 12 Q7 7 12 12 T22 12" strokeWidth="1.2" strokeDasharray="2,1" className="solver-dash" />
          </>
        );

      case 'nesting': // 2D Sheet Nesting
        return (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <rect x="5" y="5" width="6" height="7" rx="1" />
            <rect x="13" y="5" width="6" height="5" rx="1" />
            <polygon points="6,15 10,15 8,18" />
            <rect x="13" y="12" width="6" height="7" rx="1" />
          </>
        );

      case 'cutting': // 1D Linear Cut Optimizer
        return (
          <>
            <rect x="3" y="9" width="18" height="6" rx="1" />
            <line x1="8" y1="6" x2="8" y2="18" className="solver-scan" strokeDasharray="2,1" />
            <line x1="15" y1="6" x2="15" y2="18" className="solver-scan" strokeDasharray="2,1" />
            <path d="M7 6 L9 6" />
            <path d="M14 6 L16 6" />
          </>
        );

      case 'sketch-pad': // Technical Drafting Pen
        return (
          <>
            <path d="M12 2 L19 9 L8 20 L3 21 L4 16 Z" />
            <circle cx="12" cy="11" r="1.5" fill={color} />
            <line x1="8" y1="20" x2="3" y2="21" />
          </>
        );

      // ─── MECHANICAL SOLVERS ───
      case 'bolt-torque': // Hex Bolt & Torque Helix
        return (
          <>
            <polygon points="12,4 18,7.5 18,14.5 12,18 6,14.5 6,7.5" />
            <circle cx="12" cy="11" r="3" />
            <g className="solver-torque" style={{ transformOrigin: '12px 11px' }}>
              <path d="M18 4 A 9 9 0 0 1 22 13 L20 11 M22 13 L22 10" />
            </g>
          </>
        );

      case 'bearings': // ISO 281 Deep Groove Bearing Race
        return (
          <>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="4.5" />
            <g className="solver-spin" style={{ transformOrigin: '12px 12px' }}>
              <circle cx="12" cy="5.2" r="1.6" fill={color} />
              <circle cx="18.8" cy="12" r="1.6" fill={color} />
              <circle cx="12" cy="18.8" r="1.6" fill={color} />
              <circle cx="5.2" cy="12" r="1.6" fill={color} />
            </g>
          </>
        );

      case 'gears': // ISO 6336 Involute Gear Wheel
        return (
          <g className="solver-spin" style={{ transformOrigin: '12px 12px' }}>
            <circle cx="12" cy="12" r="4" />
            <circle cx="12" cy="12" r="1.8" fill={color} />
            <path d="M12 2 L13.5 4.5 L16.5 3.5 L16.5 6.5 L19.5 7 L18 9.5 L20 12 L18 14.5 L19.5 17 L16.5 17.5 L16.5 20.5 L13.5 19.5 L12 22 L10.5 19.5 L7.5 20.5 L7.5 17.5 L4.5 17 L6 14.5 L4 12 L6 9.5 L4.5 7 L7.5 6.5 L7.5 3.5 L10.5 4.5 Z" />
          </g>
        );

      case 'planetary-gearbox': // Planetary Gearset
        return (
          <>
            <circle cx="12" cy="12" r="9.5" className="solver-dash" strokeDasharray="3,1.5" />
            <g className="solver-spin" style={{ transformOrigin: '12px 12px' }}>
              <circle cx="12" cy="12" r="2.5" fill={color} />
              <circle cx="12" cy="6" r="2" />
              <circle cx="17.2" cy="15" r="2" />
              <circle cx="6.8" cy="15" r="2" />
              <line x1="12" y1="6" x2="17.2" y2="15" strokeDasharray="1.5,1.5" />
              <line x1="17.2" y1="15" x2="6.8" y2="15" strokeDasharray="1.5,1.5" />
              <line x1="6.8" y1="15" x2="12" y2="6" strokeDasharray="1.5,1.5" />
            </g>
          </>
        );

      case 'gearbox-design': // Multi-Stage Gear Train
        return (
          <>
            <g className="solver-spin" style={{ transformOrigin: '8px 9px' }}>
              <circle cx="8" cy="9" r="5" />
              <circle cx="8" cy="9" r="1.5" fill={color} />
            </g>
            <g className="solver-spin-rev" style={{ transformOrigin: '16px 15px' }}>
              <circle cx="16" cy="15" r="6" />
              <circle cx="16" cy="15" r="2" fill={color} />
            </g>
            <line x1="3" y1="9" x2="13" y2="9" className="solver-dash" strokeDasharray="1,2" />
            <line x1="10" y1="15" x2="22" y2="15" className="solver-dash" strokeDasharray="1,2" />
          </>
        );

      case 'reducer-lubrication': // Oil Droplet & Gear Lube
        return (
          <>
            <path d="M12 3 C12 3 6 10 6 15 A6 6 0 0 0 18 15 C18 10 12 3 12 3 Z" />
            <path d="M9 15 Q12 18 15 15" strokeWidth="1.2" />
            <circle cx="10" cy="12" r="1" fill={color} />
          </>
        );

      case 'chain-drive': // ISO 606 Roller Chain
        return (
          <>
            <g className="solver-spin" style={{ transformOrigin: '7px 12px' }}>
              <circle cx="7" cy="12" r="3.5" />
              <circle cx="7" cy="12" r="1.2" fill={color} />
            </g>
            <g className="solver-spin-rev" style={{ transformOrigin: '17px 12px' }}>
              <circle cx="17" cy="12" r="3.5" />
              <circle cx="17" cy="12" r="1.2" fill={color} />
            </g>
            <path d="M7 8.5 L17 8.5 M7 15.5 L17 15.5" className="solver-dash" strokeDasharray="3,2" />
            <path d="M4 12 Q4 8.5 7 8.5 M20 12 Q20 8.5 17 8.5" />
          </>
        );

      case 'belt-drive': // ISO 5291 Belt & Pulley Drive
        return (
          <>
            <g className="solver-spin" style={{ transformOrigin: '6px 12px' }}>
              <circle cx="6" cy="12" r="3" />
              <circle cx="6" cy="12" r="1" fill={color} />
            </g>
            <g className="solver-spin-rev" style={{ transformOrigin: '16px 12px' }}>
              <circle cx="16" cy="12" r="5" />
              <circle cx="16" cy="12" r="1.8" fill={color} />
            </g>
            <line x1="6" y1="9" x2="16" y2="7" className="solver-dash" strokeDasharray="4,3" />
            <line x1="6" y1="15" x2="16" y2="17" className="solver-dash" strokeDasharray="4,3" />
          </>
        );

      case 'sheet-metal': // Sheet Metal 90-deg Bend & K-Factor
        return (
          <g className="solver-bob">
            <path d="M4 6 L12 6 Q16 6 16 10 L16 20" strokeWidth="2.2" />
            <path d="M8 6 L12 6 Q13 6 13 8 L13 20" strokeDasharray="1.5,1.5" strokeWidth="1" />
            <circle cx="12" cy="10" r="1" fill={color} />
          </g>
        );

      case 'spring-design': // Helical Compression Spring
        return (
          <>
            <line x1="7" y1="4" x2="17" y2="4" strokeWidth="2" />
            <path d="M12 4 L7 7 L17 10 L7 13 L17 16 L12 20" />
            <line x1="7" y1="20" x2="17" y2="20" strokeWidth="2" />
          </>
        );

      case 'shafts': // Stepped Shaft & Torsion
        return (
          <>
            <rect x="3" y="10" width="5" height="4" />
            <rect x="8" y="8" width="8" height="8" />
            <rect x="16" y="10" width="5" height="4" />
            <line x1="2" y1="12" x2="22" y2="12" strokeDasharray="2,2" strokeWidth="1" />
            <circle cx="12" cy="12" r="1.5" fill={color} />
          </>
        );

      case 'motor-selection': // Electric Motor & Zap Torque
        return (
          <>
            <rect x="4" y="6" width="12" height="12" rx="2" />
            <line x1="16" y1="12" x2="21" y2="12" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="4" y1="18" x2="2" y2="20" />
            <line x1="16" y1="18" x2="18" y2="20" />
            {/* Center Zap */}
            <path d="M11 8 L8 12 L11 12 L9 16" strokeWidth="1.5" strokeLinejoin="round" />
          </>
        );

      case 'beam-deflection': // Beam Deflection & Elastic Curve
        return (
          <>
            {/* Fixed Support Wall */}
            <line x1="4" y1="4" x2="4" y2="20" strokeWidth="2.5" />
            <line x1="2" y1="7" x2="4" y2="5" />
            <line x1="2" y1="13" x2="4" y2="11" />
            <line x1="2" y1="19" x2="4" y2="17" />
            {/* Parabolic Deflected Cantilever Beam */}
            <path d="M4 9 Q14 9 20 16" strokeWidth="2" />
            {/* Point Load Arrow */}
            <line x1="20" y1="9" x2="20" y2="15" strokeWidth="1.5" />
            <polygon points="18.5,13 21.5,13 20,16" fill={color} />
          </>
        );

      case 'fits-tolerances': // ISO 286 Micrometer / Caliper
        return (
          <>
            <path d="M5 8 C5 4 19 4 19 8 L19 16 C19 20 5 20 5 16 Z" fill="none" strokeWidth="1.5" />
            <rect x="9" y="8" width="6" height="8" rx="1" fill={color} fillOpacity="0.3" className="solver-haz" strokeDasharray="1.5,1.5" />
            <line x1="12" y1="3" x2="12" y2="21" className="solver-scan" strokeDasharray="2,2" strokeWidth="1" />
          </>
        );

      case 'welding': // Welding Joint Stress & Torch
      case 'welding-fillet': // Fillet Weld Throat
        return (
          <>
            {/* Right Angle Plates */}
            <line x1="4" y1="18" x2="20" y2="18" strokeWidth="2.5" />
            <line x1="12" y1="4" x2="12" y2="18" strokeWidth="2.5" />
            {/* Fillet Weld Concave Triangle */}
            <path d="M12 13 Q15 15 17 18 L12 18 Z" fill={color} fillOpacity="0.4" strokeWidth="1.5" className="solver-weld solver-haz" />
            {/* Throat thickness dimension */}
            <line x1="12" y1="18" x2="14.5" y2="15.5" strokeDasharray="1,1" />
          </>
        );

      case 'fasteners': // Thread Geometry & Metric Profile
        return (
          <>
            <line x1="6" y1="4" x2="6" y2="20" strokeWidth="1.5" />
            <path d="M6 5 L10 7 L6 9 L10 11 L6 13 L10 15 L6 17 L10 19" strokeWidth="1.5" />
            <line x1="14" y1="4" x2="14" y2="20" strokeWidth="1.5" />
            <path d="M14 5 L18 7 L14 9 L18 11 L14 13 L18 15 L14 17 L18 19" strokeWidth="1.5" />
          </>
        );

      case 'machining-details': // 4-Flute End Mill Milling Cutter
        return (
          <g className="solver-spin-fast" style={{ transformOrigin: '12px 14px' }}>
            <rect x="8" y="3" width="8" height="6" rx="1" />
            <path d="M8 9 L8 19 L10 21 L12 19 L14 21 L16 19 L16 9 Z" />
            <path d="M8 12 Q12 15 16 12" />
            <path d="M8 16 Q12 19 16 16" />
          </g>
        );

      case 'profile-weight': // Scale / Mass Weighing Beam
        return (
          <g className="solver-bob">
            <line x1="12" y1="4" x2="12" y2="19" strokeWidth="1.8" />
            <polygon points="9,20 15,20 12,16" fill={color} />
            <line x1="4" y1="7" x2="20" y2="7" strokeWidth="1.8" />
            <path d="M4 7 L2 13 L6 13 Z" />
            <path d="M20 7 L18 13 L22 13 Z" />
          </g>
        );

      // ─── THERMAL & FLUIDS ───
      case 'fluid-dynamics':
      case 'pipe-friction':
        return (
          <>
            <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" />
            <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" />
            {/* Velocity profile arrows */}
            <path d="M5 12 L19 12 M16 10 L19 12 L16 14" strokeWidth="1.6" />
            <path d="M5 9 L15 9 M13 8 L15 9 L13 10" strokeWidth="1.2" />
            <path d="M5 15 L15 15 M13 14 L15 15 L13 16" strokeWidth="1.2" />
          </>
        );

      case 'pressure-vessel': // ASME Pressure Tank
        return (
          <>
            <rect x="7" y="5" width="10" height="14" rx="5" />
            <line x1="7" y1="9" x2="17" y2="9" strokeDasharray="1.5,1.5" />
            <line x1="7" y1="15" x2="17" y2="15" strokeDasharray="1.5,1.5" />
            <line x1="4" y1="18" x2="7" y2="16" />
            <line x1="20" y1="18" x2="17" y2="16" />
          </>
        );

      case 'pumps': // Centrifugal Pump Volute
        return (
          <>
            <path d="M12 4 A8 8 0 1 0 20 12 L20 4 L14 4" />
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="1" fill={color} />
          </>
        );

      case 'heat-sink': // Extruded Fin Heat Sink
        return (
          <>
            <rect x="3" y="16" width="18" height="4" rx="1" />
            <line x1="5" y1="6" x2="5" y2="16" strokeWidth="2" />
            <line x1="9" y1="6" x2="9" y2="16" strokeWidth="2" />
            <line x1="13" y1="6" x2="13" y2="16" strokeWidth="2" />
            <line x1="17" y1="6" x2="17" y2="16" strokeWidth="2" />
            <path d="M19 4 L21 4 L20 6" strokeWidth="1" />
          </>
        );

      case 'wind-tunnel':
      case 'hvac-load':
        return (
          <>
            <path d="M3 8 Q10 8 13 6 Q16 4 19 4" />
            <path d="M3 12 Q12 12 16 10 Q19 8 21 8" />
            <path d="M3 16 Q8 16 12 18 Q16 20 20 20" />
            <circle cx="10" cy="12" r="2" fill={color} />
          </>
        );

      // ─── ELECTRICAL ───
      case '3-phase-power':
      case 'ohms-law':
        return (
          <>
            <path d="M3 12 Q6 4 9 12 T15 12 T21 12" strokeWidth="1.5" />
            <path d="M3 14 Q6 6 9 14 T15 14 T21 14" strokeWidth="1.2" opacity="0.6" />
            <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="2,2" strokeWidth="1" />
          </>
        );

      case 'voltage-drop':
        return (
          <>
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="12" r="3" />
            <line x1="9" y1="10" x2="15" y2="10" />
            <line x1="9" y1="14" x2="15" y2="14" />
            <path d="M11 6 L13 8 L11 10" strokeWidth="1.2" />
          </>
        );

      case 'digital-logic':
        return (
          <>
            <path d="M5 6 L12 6 A6 6 0 0 1 12 18 L5 18 Z" />
            <line x1="2" y1="9" x2="5" y2="9" />
            <line x1="2" y1="15" x2="5" y2="15" />
            <circle cx="18.5" cy="12" r="1.5" />
            <line x1="20" y1="12" x2="23" y2="12" />
          </>
        );

      // ─── MATERIALS, CIVIL, SCIENCE ───
      case 'periodic-table':
      case 'materials-db':
      case 'material-selector-ai':
      case 'materials-explorer':
        return (
          <>
            <circle cx="12" cy="12" r="2.5" fill={color} />
            <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(30 12 12)" />
            <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-30 12 12)" />
          </>
        );

      case 'calculator':
        return (
          <>
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <rect x="7" y="6" width="10" height="3" rx="0.5" fill={color} fillOpacity="0.4" />
            <circle cx="8" cy="13" r="1" fill={color} />
            <circle cx="12" cy="13" r="1" fill={color} />
            <circle cx="16" cy="13" r="1" fill={color} />
            <circle cx="8" cy="17" r="1" fill={color} />
            <circle cx="12" cy="17" r="1" fill={color} />
            <circle cx="16" cy="17" r="1" fill={color} />
          </>
        );

      case 'physics-kinematics':
      case 'physics-solver':
        return (
          <>
            <path d="M4 19 Q12 5 20 11" strokeWidth="1.8" strokeDasharray="3,1.5" />
            <circle cx="4" cy="19" r="1.5" fill={color} />
            <circle cx="20" cy="11" r="2" fill={color} />
            <line x1="20" y1="11" x2="23" y2="8" strokeWidth="1.5" />
          </>
        );

      case 'chemistry-reactions':
        return (
          <>
            <path d="M9 3 L15 3 M10 3 L10 8 L5 18 A2 2 0 0 0 7 21 L17 21 A2 2 0 0 0 19 18 L14 8 L14 3" />
            <circle cx="12" cy="16" r="1.5" fill={color} />
            <circle cx="15" cy="14" r="1" fill={color} />
            <line x1="7" y1="17" x2="17" y2="17" strokeDasharray="1,1" />
          </>
        );

      case 'biology-genetics':
        return (
          <>
            <path d="M6 3 Q12 12 18 3 M6 21 Q12 12 18 21" strokeWidth="1.8" />
            <line x1="8" y1="6" x2="16" y2="6" strokeWidth="1.2" />
            <line x1="10" y1="10" x2="14" y2="10" strokeWidth="1.2" />
            <line x1="10" y1="14" x2="14" y2="14" strokeWidth="1.2" />
            <line x1="8" y1="18" x2="16" y2="18" strokeWidth="1.2" />
          </>
        );

      case 'cs-algorithms':
        return (
          <>
            <circle cx="12" cy="5" r="2.5" />
            <circle cx="6" cy="17" r="2.5" fill={color} />
            <circle cx="18" cy="17" r="2.5" />
            <line x1="10.5" y1="7" x2="7.5" y2="15" />
            <line x1="13.5" y1="7" x2="16.5" y2="15" />
          </>
        );

      case 'field':
      case 'download-apps':
        return (
          <>
            <rect x="6" y="3" width="12" height="18" rx="2.5" />
            <circle cx="12" cy="18" r="1" fill={color} />
            <line x1="9" y1="6" x2="15" y2="6" strokeWidth="1.2" />
          </>
        );

      case 'academy':
        return (
          <>
            <polygon points="12,4 22,9 12,14 2,9" />
            <path d="M6 11 L6 17 Q12 21 18 17 L18 11" />
            <path d="M22 9 L22 17" strokeWidth="1.5" />
            <circle cx="22" cy="17" r="1" fill={color} />
          </>
        );

      case 'handbook':
        return (
          <>
            <path d="M4 19.5 A 2.5 2.5 0 0 1 6.5 17 L 20 17" />
            <path d="M6.5 2 H 20 V 22 H 6.5 A 2.5 2.5 0 0 1 4 19.5 V 4.5 A 2.5 2.5 0 0 1 6.5 2 Z" />
            <line x1="8" y1="7" x2="16" y2="7" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </>
        );

      default:
        // Default generic engineering isometric cube
        return (
          <>
            <polygon points="12,3 21,7.5 12,12 3,7.5" />
            <polygon points="3,7.5 12,12 12,21 3,16.5" />
            <polygon points="12,12 21,7.5 21,16.5 12,21" />
          </>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <style>{`
        /* 🧵 SMOOTH THREAD-DRAWING ANIMATION ON HOVER */
        .aegis-thread-icon {
          overflow: visible;
        }
        .aegis-thread-icon path,
        .aegis-thread-icon line,
        .aegis-thread-icon polygon,
        .aegis-thread-icon polyline,
        .aegis-thread-icon rect,
        .aegis-thread-icon circle,
        .aegis-thread-icon ellipse {
          stroke-dasharray: 100;
          stroke-dashoffset: 0;
          transition: stroke-dashoffset 0.8s cubic-bezier(0.25, 1, 0.35, 1), stroke 0.3s ease, filter 0.4s ease;
        }

        .group:hover .aegis-thread-icon path,
        .group:hover .aegis-thread-icon line,
        .group:hover .aegis-thread-icon polygon,
        .group:hover .aegis-thread-icon polyline,
        .group:hover .aegis-thread-icon rect,
        .group:hover .aegis-thread-icon circle,
        .group:hover .aegis-thread-icon ellipse {
          animation: aegisDrawLine 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        /* Subtle staggered drawing for nested elements */
        .group:hover .aegis-thread-icon *:nth-child(2) {
          animation-delay: 0.1s;
        }
        .group:hover .aegis-thread-icon *:nth-child(3) {
          animation-delay: 0.2s;
        }
        .group:hover .aegis-thread-icon *:nth-child(4) {
          animation-delay: 0.3s;
        }

        @keyframes aegisDrawLine {
          0% {
            stroke-dashoffset: 100;
            opacity: 0.3;
          }
          35% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
      `}</style>

      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={isActive ? 2.2 : 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`aegis-thread-icon sai-icon ${isHighlighted ? 'is-on' : 'is-idle'} transition-all duration-300 ${
          isActive
            ? 'drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]'
            : 'group-hover:drop-shadow-[0_0_6px_currentColor]'
        }`}
      >
        {renderBespokePath()}
      </svg>
    </div>
  );
}

export default SidebarAnimatedIcon;
