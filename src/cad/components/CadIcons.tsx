import React from 'react';

export interface CadIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

/**
 * Common SVG wrapper ensuring uniform stroke and sizing matching Lucide icons.
 */
function createCadIcon(name: string, svgContent: React.ReactNode) {
  const IconComponent = React.forwardRef<SVGSVGElement, CadIconProps>(({ size = 16, className = '', ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {svgContent}
    </svg>
  ));
  IconComponent.displayName = name;
  return IconComponent;
}

/**
 * Ellipse Tool (EL) - Distinct horizontal ellipse with axes markers
 */
export const EllipseIcon = createCadIcon('EllipseIcon', (
  <>
    <ellipse cx="12" cy="12" rx="9" ry="5.5" />
    <line x1="12" y1="9.5" x2="12" y2="14.5" strokeOpacity="0.45" />
    <line x1="7" y1="12" x2="17" y2="12" strokeOpacity="0.45" />
  </>
));

/**
 * 3-Point Arc Tool (A) - Curved arc segment with start, midpoint, and end vertex points
 */
export const ArcIcon = createCadIcon('ArcIcon', (
  <>
    <path d="M4 17 A 10.5 10.5 0 0 1 20 17" />
    <circle cx="4" cy="17" r="1.5" fill="currentColor" />
    <circle cx="12" cy="6.5" r="1.5" fill="currentColor" />
    <circle cx="20" cy="17" r="1.5" fill="currentColor" />
  </>
));

/**
 * Spline Tool (SPL) - Smooth cubic NURBS / B-spline curve with control vertices
 */
export const SplineIcon = createCadIcon('SplineIcon', (
  <>
    <path d="M3 18 C 8 3, 16 21, 21 6" />
    <circle cx="3" cy="18" r="1.2" fill="currentColor" />
    <circle cx="8" cy="7" r="1.2" fill="currentColor" strokeOpacity="0.5" />
    <circle cx="16" cy="17" r="1.2" fill="currentColor" strokeOpacity="0.5" />
    <circle cx="21" cy="6" r="1.2" fill="currentColor" />
  </>
));

/**
 * Polyline Tool (PL) - Multi-segment connected lines with vertices
 */
export const PolylineIcon = createCadIcon('PolylineIcon', (
  <>
    <polyline points="4 19 9 7 15 15 20 5" />
    <circle cx="4" cy="19" r="1.3" fill="currentColor" />
    <circle cx="9" cy="7" r="1.3" fill="currentColor" />
    <circle cx="15" cy="15" r="1.3" fill="currentColor" />
    <circle cx="20" cy="5" r="1.3" fill="currentColor" />
  </>
));

/**
 * Leader Note Tool (LEAD) - Engineering pointer arrow with landing shoulder and text guideline
 */
export const LeaderIcon = createCadIcon('LeaderIcon', (
  <>
    <polyline points="21 7 12 7 6 17" />
    <polygon points="6 17 5 13 9 16" fill="currentColor" />
    <line x1="14" y1="4" x2="21" y2="4" strokeOpacity="0.5" strokeDasharray="1.5 1.5" />
  </>
));

/**
 * Extend Tool (EX) - Boundary target line with incoming arrow extending to boundary
 */
export const ExtendIcon = createCadIcon('ExtendIcon', (
  <>
    {/* Boundary wall */}
    <line x1="20" y1="3" x2="20" y2="21" strokeWidth="2.5" />
    {/* Line extending forward */}
    <line x1="3" y1="12" x2="16" y2="12" />
    <polyline points="12 8 16 12 12 16" />
  </>
));

/**
 * Offset Tool (O) - Two parallel curves with double-headed offset distance arrow
 */
export const OffsetIcon = createCadIcon('OffsetIcon', (
  <>
    {/* Base line */}
    <line x1="4" y1="6" x2="20" y2="6" strokeWidth="2" />
    {/* Parallel offset line */}
    <line x1="4" y1="18" x2="20" y2="18" strokeDasharray="2.5 1.5" />
    {/* Double arrow indicator */}
    <line x1="12" y1="8" x2="12" y2="16" strokeOpacity="0.8" />
    <polyline points="9.5 10 12 7.5 14.5 10" />
    <polyline points="9.5 14 12 16.5 14.5 14" />
  </>
));

/**
 * Fillet Tool (F) - 90-degree corner with smooth tangent arc radius
 */
export const FilletIcon = createCadIcon('FilletIcon', (
  <>
    {/* Rounded corner contour */}
    <line x1="4" y1="21" x2="4" y2="13" />
    <path d="M4 13 A 9 9 0 0 1 13 4" />
    <line x1="13" y1="4" x2="21" y2="4" />
    {/* Phantom sharp corner */}
    <line x1="4" y1="13" x2="4" y2="4" strokeDasharray="2 2" strokeOpacity="0.35" />
    <line x1="4" y1="4" x2="13" y2="4" strokeDasharray="2 2" strokeOpacity="0.35" />
  </>
));

/**
 * Chamfer Tool (CHA) - 90-degree corner with flat 45-degree beveled cut
 */
export const ChamferIcon = createCadIcon('ChamferIcon', (
  <>
    {/* Beveled corner contour */}
    <line x1="4" y1="21" x2="4" y2="13" />
    <line x1="4" y1="13" x2="13" y2="4" strokeWidth="2" />
    <line x1="13" y1="4" x2="21" y2="4" />
    {/* Phantom sharp corner */}
    <line x1="4" y1="13" x2="4" y2="4" strokeDasharray="2 2" strokeOpacity="0.35" />
    <line x1="4" y1="4" x2="13" y2="4" strokeDasharray="2 2" strokeOpacity="0.35" />
  </>
));

/**
 * Hatch Tool (H) - Closed contour with ANSI31 diagonal crosshatch stripes
 */
export const HatchIcon = createCadIcon('HatchIcon', (
  <>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <line x1="4" y1="12" x2="12" y2="4" />
    <line x1="4" y1="18" x2="18" y2="4" />
    <line x1="8" y1="20" x2="20" y2="8" />
    <line x1="14" y1="20" x2="20" y2="14" />
  </>
));

/**
 * Rectangular Array Tool (ARRAY) - 3x3 grid pattern of elements
 */
export const RectArrayIcon = createCadIcon('RectArrayIcon', (
  <>
    <rect x="4" y="4" width="3.5" height="3.5" rx="0.5" fill="currentColor" fillOpacity="0.3" />
    <rect x="10.25" y="4" width="3.5" height="3.5" rx="0.5" fill="currentColor" fillOpacity="0.3" />
    <rect x="16.5" y="4" width="3.5" height="3.5" rx="0.5" fill="currentColor" fillOpacity="0.3" />
    <rect x="4" y="10.25" width="3.5" height="3.5" rx="0.5" fill="currentColor" fillOpacity="0.3" />
    <rect x="10.25" y="10.25" width="3.5" height="3.5" rx="0.5" fill="currentColor" fillOpacity="0.3" />
    <rect x="16.5" y="10.25" width="3.5" height="3.5" rx="0.5" fill="currentColor" fillOpacity="0.3" />
    <rect x="4" y="16.5" width="3.5" height="3.5" rx="0.5" fill="currentColor" fillOpacity="0.3" />
    <rect x="10.25" y="16.5" width="3.5" height="3.5" rx="0.5" fill="currentColor" fillOpacity="0.3" />
    <rect x="16.5" y="16.5" width="3.5" height="3.5" rx="0.5" fill="currentColor" fillOpacity="0.3" />
  </>
));

/**
 * Polar Array Tool (CA) - Circular orbit with radial pattern of elements around center
 */
export const PolarArrayIcon = createCadIcon('PolarArrayIcon', (
  <>
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <circle cx="12" cy="12" r="7.5" strokeDasharray="2 2" strokeOpacity="0.4" />
    <circle cx="12" cy="4.5" r="1.5" fill="currentColor" />
    <circle cx="18.5" cy="8.25" r="1.5" fill="currentColor" />
    <circle cx="18.5" cy="15.75" r="1.5" fill="currentColor" />
    <circle cx="12" cy="19.5" r="1.5" fill="currentColor" />
    <circle cx="5.5" cy="15.75" r="1.5" fill="currentColor" />
    <circle cx="5.5" cy="8.25" r="1.5" fill="currentColor" />
  </>
));

/**
 * Measure / Distance Tool (DIST) - Caliper dimension between stop ticks
 */
export const MeasureIcon = createCadIcon('MeasureIcon', (
  <>
    {/* Left and right boundary stop lines */}
    <line x1="3" y1="5" x2="3" y2="19" strokeWidth="2" />
    <line x1="21" y1="5" x2="21" y2="19" strokeWidth="2" />
    {/* Dimension line with arrows */}
    <line x1="4" y1="12" x2="20" y2="12" />
    <polyline points="7 9.5 4 12 7 14.5" />
    <polyline points="17 9.5 20 12 17 14.5" />
    {/* Measurement badge symbol */}
    <rect x="8.5" y="9" width="7" height="6" rx="1" fill="#080a11" stroke="currentColor" strokeWidth="1" />
    <text x="12" y="13.5" fontSize="4.5" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="monospace" fontWeight="bold">d</text>
  </>
));

/**
 * Cross-Section / Profile Properties Tool (AREA / SECTION) - Structural I-Beam profile
 */
export const CrossSectionIcon = createCadIcon('CrossSectionIcon', (
  <>
    {/* Structural I-beam profile */}
    <path d="M5 4h14v3.5h-5v9h5v3.5H5V16.5h5v-9H5V4z" fill="currentColor" fillOpacity="0.15" />
    {/* Centroid marker */}
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <line x1="10" y1="12" x2="14" y2="12" strokeOpacity="0.8" />
    <line x1="12" y1="10" x2="12" y2="14" strokeOpacity="0.8" />
  </>
));

/**
 * Scale Tool (SC) - Concentric bounding boxes with diagonal expansion arrow
 */
export const ScaleIcon = createCadIcon('ScaleIcon', (
  <>
    {/* Base small square */}
    <rect x="4" y="11" width="9" height="9" strokeDasharray="2 2" strokeOpacity="0.6" />
    {/* Scaled large square */}
    <rect x="4" y="4" width="16" height="16" rx="1" />
    {/* Expansion diagonal arrow */}
    <line x1="13" y1="11" x2="18.5" y2="5.5" strokeWidth="2" />
    <polyline points="15 5.5 18.5 5.5 18.5 9" />
  </>
));

/**
 * Move Tool (M) - 4-way translation crosshairs arrow
 */
export const MoveIcon = createCadIcon('MoveIcon', (
  <>
    <line x1="12" y1="2" x2="12" y2="22" strokeWidth="1.8" />
    <line x1="2" y1="12" x2="22" y2="12" strokeWidth="1.8" />
    <polyline points="9 5 12 2 15 5" />
    <polyline points="9 19 12 22 15 19" />
    <polyline points="5 9 2 12 5 15" />
    <polyline points="19 9 22 12 19 15" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </>
));

/**
 * Copy Tool (CO) - Two overlapping offset entity shapes with duplication symbol
 */
export const CopyIcon = createCadIcon('CopyIcon', (
  <>
    {/* Source rectangle */}
    <rect x="4" y="8" width="10" height="10" rx="1" strokeDasharray="2 2" strokeOpacity="0.6" />
    {/* Copied destination rectangle */}
    <rect x="10" y="4" width="10" height="10" rx="1" strokeWidth="1.8" />
    {/* Plus badge */}
    <line x1="15" y1="7" x2="15" y2="11" strokeWidth="1.5" />
    <line x1="13" y1="9" x2="17" y2="9" strokeWidth="1.5" />
  </>
));

/**
 * Rotate Tool (RO) - Circular revolution arc with arrow around pivot center
 */
export const RotateIcon = createCadIcon('RotateIcon', (
  <>
    {/* Pivot center point */}
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    {/* Rotation arc path */}
    <path d="M 20 12 A 8 8 0 1 1 14.5 4.5" strokeWidth="1.8" />
    {/* Tangent arrowhead */}
    <polyline points="11 2 15 4.5 13 8.5" fill="currentColor" />
  </>
));

/**
 * Timing Belt & Pulley Generator (PULLEY) - Dual wheels with wrapped timing belt
 */
export const BeltPulleyIcon = createCadIcon('BeltPulleyIcon', (
  <>
    <circle cx="7" cy="12" r="4.5" />
    <circle cx="7" cy="12" r="1.5" fill="currentColor" />
    <circle cx="17.5" cy="12" r="3.2" />
    <circle cx="17.5" cy="12" r="1.2" fill="currentColor" />
    {/* Tangent belt tracks */}
    <line x1="7" y1="7.5" x2="17.5" y2="8.8" />
    <line x1="7" y1="16.5" x2="17.5" y2="15.2" />
  </>
));

/**
 * Planetary Gear Train (PLANET) - Ring gear with sun and orbiting planet gears
 */
export const PlanetaryGearIcon = createCadIcon('PlanetaryGearIcon', (
  <>
    <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3" />
    <circle cx="12" cy="6.2" r="1.8" fill="currentColor" />
    <circle cx="7" cy="15" r="1.8" fill="currentColor" />
    <circle cx="17" cy="15" r="1.8" fill="currentColor" />
  </>
));

/**
 * Roller Chain & Sprocket (CHAIN / SPROCKET) - ISO 606 roller chain links and sprocket drive
 */
export const RollerChainIcon = createCadIcon('RollerChainIcon', (
  <>
    {/* Left and Right roller chain pins */}
    <circle cx="6.5" cy="12" r="3.2" />
    <circle cx="6.5" cy="12" r="1.3" fill="currentColor" />
    <circle cx="17.5" cy="12" r="3.2" />
    <circle cx="17.5" cy="12" r="1.3" fill="currentColor" />
    {/* Upper & lower outer link plate contours */}
    <path d="M6.5 8.8 H17.5" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M6.5 15.2 H17.5" strokeWidth="1.8" strokeLinecap="round" />
    {/* Waist curve contour of roller chain link */}
    <path d="M6.5 8.8 Q12 10.5 17.5 8.8" strokeOpacity="0.4" strokeWidth="1" />
    <path d="M6.5 15.2 Q12 13.5 17.5 15.2" strokeOpacity="0.4" strokeWidth="1" />
  </>
));


/**
 * Linear Dimension (DIMLIN) - Witness lines with dimension arrows
 */
export const DimLinearIcon = createCadIcon('DimLinearIcon', (
  <>
    <line x1="3" y1="4" x2="3" y2="15" />
    <line x1="21" y1="4" x2="21" y2="15" />
    <line x1="4" y1="8" x2="20" y2="8" />
    <polygon points="7 6.5 3.5 8 7 9.5" fill="currentColor" />
    <polygon points="17 6.5 20.5 8 17 9.5" fill="currentColor" />
    <line x1="3" y1="19" x2="21" y2="19" strokeWidth="2" />
  </>
));

/**
 * Mirror Tool (MI) - Vertical dashed mirror line with symmetric reflections
 */
export const MirrorIcon = createCadIcon('MirrorIcon', (
  <>
    <line x1="12" y1="3" x2="12" y2="21" strokeDasharray="3 2" strokeWidth="1.8" />
    {/* Left shape */}
    <polygon points="4 16 9 8 9 16" fill="currentColor" fillOpacity="0.25" />
    {/* Right mirrored shape */}
    <polygon points="20 16 15 8 15 16" fill="currentColor" fillOpacity="0.5" />
  </>
));

/**
 * Trim Tool (TR) - Scissors with cutting intersection boundary
 */
export const TrimIcon = createCadIcon('TrimIcon', (
  <>
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="8.5" y1="8.5" x2="20" y2="20" />
    <line x1="8.5" y1="15.5" x2="20" y2="4" />
    <line x1="14" y1="2" x2="14" y2="22" strokeDasharray="2 2" strokeOpacity="0.4" />
  </>
));

/**
 * Join Tool (J) - Two connecting lines fusing at a common vertex node
 */
export const JoinIcon = createCadIcon('JoinIcon', (
  <>
    <line x1="3" y1="17" x2="12" y2="9" strokeWidth="2" />
    <line x1="12" y1="9" x2="21" y2="17" strokeWidth="2" />
    <circle cx="12" cy="9" r="2.5" fill="currentColor" />
    <path d="M7 16 L12 11 L17 16" strokeOpacity="0.4" />
  </>
));

/**
 * Group Tool (G) - Dashed atomic bounding box enclosing shapes
 */
export const GroupIcon = createCadIcon('GroupIcon', (
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 2" />
    <circle cx="9" cy="9" r="2.5" />
    <rect x="13" y="13" width="4" height="4" />
    <line x1="9" y1="11.5" x2="13" y2="13" strokeOpacity="0.5" />
  </>
));

/**
 * Ungroup Tool (UNG) - Broken group box separating entities
 */
export const UngroupIcon = createCadIcon('UngroupIcon', (
  <>
    <path d="M7 3 H3 V7" />
    <path d="M17 3 H21 V7" />
    <path d="M21 17 V21 H17" />
    <path d="M7 21 H3 V17" />
    <circle cx="8" cy="8" r="2" />
    <rect x="14" y="14" width="3" height="3" />
    <line x1="4" y1="20" x2="20" y2="4" strokeWidth="1.5" strokeOpacity="0.6" />
  </>
));

/**
 * Explode Tool (X) - Compound shape exploding outward into constituent segments
 */
export const ExplodeIcon = createCadIcon('ExplodeIcon', (
  <>
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <line x1="12" y1="7" x2="12" y2="2" strokeWidth="2" />
    <line x1="12" y1="17" x2="12" y2="22" strokeWidth="2" />
    <line x1="7" y1="12" x2="2" y2="12" strokeWidth="2" />
    <line x1="17" y1="12" x2="22" y2="12" strokeWidth="2" />
    <line x1="8" y1="8" x2="4" y2="4" strokeWidth="1.5" />
    <line x1="16" y1="16" x2="20" y2="20" strokeWidth="1.5" />
    <line x1="16" y1="8" x2="20" y2="4" strokeWidth="1.5" />
    <line x1="8" y1="16" x2="4" y2="20" strokeWidth="1.5" />
  </>
));

/**
 * Block Tool (B) - Isometric 3D component with insertion anchor
 */
export const BlockIcon = createCadIcon('BlockIcon', (
  <>
    <path d="M12 2 L20 6.5 V15.5 L12 20 L4 15.5 V6.5 Z" />
    <path d="M12 2 V11 L20 6.5" />
    <path d="M12 11 L4 6.5" />
    <circle cx="12" cy="11" r="2" fill="currentColor" />
  </>
));

// ═══════════════════════════════════════════════════════════════
// CIRCLE CONSTRUCTION METHODS ICONS
// ═══════════════════════════════════════════════════════════════

/** Center, Radius: Center point with radius line */
export const CircleRadiusIcon = createCadIcon('CircleRadiusIcon', (
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="1.75" fill="currentColor" />
    <line x1="12" y1="12" x2="20" y2="8" strokeWidth="1.5" />
    <polygon points="20,8 17.5,7 18.5,10" fill="currentColor" />
  </>
));

/** Center, Diameter: Center point with full diameter through-line */
export const CircleDiameterIcon = createCadIcon('CircleDiameterIcon', (
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="1.75" fill="currentColor" />
    <line x1="3.5" y1="12" x2="20.5" y2="12" strokeWidth="1.5" />
    <polygon points="4,12 7,10 7,14" fill="currentColor" />
    <polygon points="20,12 17,10 17,14" fill="currentColor" />
  </>
));

/** 2-Point: 2 diameter endpoints on circumference */
export const Circle2PIcon = createCadIcon('Circle2PIcon', (
  <>
    <circle cx="12" cy="12" r="9" strokeDasharray="3 2" strokeOpacity="0.7" />
    <line x1="3" y1="12" x2="21" y2="12" strokeWidth="1.5" />
    <circle cx="3" cy="12" r="2" fill="currentColor" />
    <circle cx="21" cy="12" r="2" fill="currentColor" />
  </>
));

/** 3-Point: 3 points on circumference (triangle circumcircle) */
export const Circle3PIcon = createCadIcon('Circle3PIcon', (
  <>
    <circle cx="12" cy="12" r="9" />
    <polygon points="12,3 4,17 20,17" strokeOpacity="0.35" strokeDasharray="2 2" />
    <circle cx="12" cy="3" r="1.75" fill="currentColor" />
    <circle cx="4" cy="17" r="1.75" fill="currentColor" />
    <circle cx="20" cy="17" r="1.75" fill="currentColor" />
  </>
));

/** Tan, Tan, Radius: 2 tangent guide lines + radius */
export const CircleTtrIcon = createCadIcon('CircleTtrIcon', (
  <>
    <line x1="3" y1="21" x2="21" y2="21" strokeWidth="1.5" strokeOpacity="0.8" />
    <line x1="3" y1="21" x2="3" y2="3" strokeWidth="1.5" strokeOpacity="0.8" />
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <line x1="12" y1="12" x2="18" y2="6" strokeWidth="1.25" />
  </>
));

/** Tan, Tan, Tan: Circle inscribed in 3 tangents */
export const CircleTttIcon = createCadIcon('CircleTttIcon', (
  <>
    <polygon points="12,2 2,21 22,21" strokeWidth="1.5" strokeOpacity="0.75" />
    <circle cx="12" cy="14" r="6" strokeWidth="1.75" />
  </>
));

// ═══════════════════════════════════════════════════════════════
// ARC CONSTRUCTION METHODS ICONS
// ═══════════════════════════════════════════════════════════════

/** 3-Point Arc */
export const Arc3PIcon = ArcIcon;

/** Start, Center, End Arc */
export const ArcSceIcon = createCadIcon('ArcSceIcon', (
  <>
    <path d="M5 19 A 11 11 0 0 1 19 8" strokeWidth="2" />
    <circle cx="14" cy="17" r="1.5" fill="currentColor" />
    <line x1="14" y1="17" x2="5" y2="19" strokeOpacity="0.4" strokeDasharray="2 2" />
    <line x1="14" y1="17" x2="19" y2="8" strokeOpacity="0.4" strokeDasharray="2 2" />
    <circle cx="5" cy="19" r="2" fill="currentColor" />
    <circle cx="19" cy="8" r="2" fill="currentColor" />
  </>
));

/** Start, Center, Angle Arc */
export const ArcScaIcon = createCadIcon('ArcScaIcon', (
  <>
    <path d="M4 18 A 12 12 0 0 1 18 5" strokeWidth="2" />
    <circle cx="15" cy="17" r="1.5" fill="currentColor" />
    <line x1="15" y1="17" x2="4" y2="18" strokeOpacity="0.4" strokeDasharray="2 2" />
    <line x1="15" y1="17" x2="18" y2="5" strokeOpacity="0.4" strokeDasharray="2 2" />
    <path d="M12 17 A 3 3 0 0 1 16 14" strokeWidth="1.2" />
    <circle cx="4" cy="18" r="2" fill="currentColor" />
  </>
));

/** Start, Center, Length (Chord) Arc */
export const ArcSclIcon = createCadIcon('ArcSclIcon', (
  <>
    <path d="M4 18 A 11 11 0 0 1 19 6" strokeWidth="2" />
    <line x1="4" y1="18" x2="19" y2="6" strokeWidth="1.2" strokeOpacity="0.8" strokeDasharray="2 2" />
    <circle cx="4" cy="18" r="2" fill="currentColor" />
    <circle cx="19" cy="6" r="2" fill="currentColor" />
  </>
));

/** Start, End, Radius Arc */
export const ArcSerIcon = createCadIcon('ArcSerIcon', (
  <>
    <path d="M4 17 A 10 10 0 0 1 20 17" strokeWidth="2" />
    <circle cx="4" cy="17" r="2" fill="currentColor" />
    <circle cx="20" cy="17" r="2" fill="currentColor" />
    <circle cx="12" cy="17" r="1.2" fill="currentColor" />
    <line x1="12" y1="17" x2="12" y2="7" strokeWidth="1.2" strokeOpacity="0.7" />
    <polygon points="12,7 10,9.5 14,9.5" fill="currentColor" />
  </>
));

/** Start, End, Direction (Tangent) Arc */
export const ArcSedIcon = createCadIcon('ArcSedIcon', (
  <>
    <path d="M5 19 A 12 12 0 0 1 19 7" strokeWidth="2" />
    <circle cx="5" cy="19" r="2" fill="currentColor" />
    <circle cx="19" cy="7" r="2" fill="currentColor" />
    {/* Tangent vector arrow at start */}
    <line x1="5" y1="19" x2="5" y2="10" strokeWidth="1.5" />
    <polygon points="5,10 3,13 7,13" fill="currentColor" />
  </>
));

/** Center, Start, End Arc */
export const ArcCseIcon = createCadIcon('ArcCseIcon', (
  <>
    <circle cx="8" cy="16" r="2" fill="currentColor" />
    <path d="M8 5 A 11 11 0 0 1 19 16" strokeWidth="2" />
    <line x1="8" y1="16" x2="8" y2="5" strokeOpacity="0.4" strokeDasharray="2 2" />
    <line x1="8" y1="16" x2="19" y2="16" strokeOpacity="0.4" strokeDasharray="2 2" />
    <circle cx="8" cy="5" r="1.75" />
    <circle cx="19" cy="16" r="1.75" />
  </>
));

/** Center, Start, Angle Arc */
export const ArcCsaIcon = createCadIcon('ArcCsaIcon', (
  <>
    <circle cx="7" cy="17" r="2" fill="currentColor" />
    <path d="M7 6 A 11 11 0 0 1 18 10" strokeWidth="2" />
    <line x1="7" y1="17" x2="7" y2="6" strokeOpacity="0.4" strokeDasharray="2 2" />
    <line x1="7" y1="17" x2="18" y2="10" strokeOpacity="0.4" strokeDasharray="2 2" />
    <path d="M7 13 A 4 4 0 0 1 11 14.5" strokeWidth="1.2" />
  </>
));

/** Continue / Tangent Arc */
export const ArcContinueIcon = createCadIcon('ArcContinueIcon', (
  <>
    {/* Preceding straight line */}
    <line x1="3" y1="19" x2="10" y2="19" strokeWidth="1.75" />
    {/* Smooth tangential continuation */}
    <path d="M10 19 A 9 9 0 0 0 19 10" strokeWidth="2.2" />
    <polygon points="19,10 18,14 21,12" fill="currentColor" />
    <circle cx="10" cy="19" r="1.5" fill="currentColor" />
  </>
));

// ═══════════════════════════════════════════════════════════════
// RECTANGLE CONSTRUCTION METHODS ICONS
// ═══════════════════════════════════════════════════════════════

/** 2-Point Corner-to-Corner Rectangle */
export const Rec2PIcon = createCadIcon('Rec2PIcon', (
  <>
    <rect x="4" y="5" width="16" height="14" strokeWidth="1.8" />
    <circle cx="4" cy="5" r="2" fill="currentColor" />
    <circle cx="20" cy="19" r="2" fill="currentColor" />
    <line x1="4" y1="5" x2="20" y2="19" strokeOpacity="0.3" strokeDasharray="2 2" />
  </>
));

/** Center to Corner Rectangle */
export const RecCenterIcon = createCadIcon('RecCenterIcon', (
  <>
    <rect x="4" y="5" width="16" height="14" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <line x1="12" y1="12" x2="20" y2="19" strokeWidth="1.5" />
    <circle cx="20" cy="19" r="1.75" fill="currentColor" />
    <line x1="9" y1="12" x2="15" y2="12" strokeOpacity="0.5" />
    <line x1="12" y1="9" x2="12" y2="15" strokeOpacity="0.5" />
  </>
));

/** 3-Point Rotated Rectangle */
export const Rec3PIcon = createCadIcon('Rec3PIcon', (
  <>
    <polygon points="4,16 16,20 20,8 8,4" strokeWidth="1.6" />
    <circle cx="4" cy="16" r="2" fill="currentColor" />
    <circle cx="16" cy="20" r="2" fill="currentColor" />
    <circle cx="20" cy="8" r="2" fill="currentColor" />
  </>
));

/** Filleted Corner Rectangle */
export const RecFilletIcon = createCadIcon('RecFilletIcon', (
  <>
    <rect x="4" y="5" width="16" height="14" rx="4" strokeWidth="1.8" />
    <path d="M4 9 A 4 4 0 0 1 8 5" strokeWidth="2.2" />
  </>
));

/** Chamfered Corner Rectangle */
export const RecChamferIcon = createCadIcon('RecChamferIcon', (
  <>
    <polygon points="7,5 17,5 20,8 20,16 17,19 7,19 4,16 4,8" strokeWidth="1.8" />
    <line x1="4" y1="8" x2="7" y2="5" strokeWidth="2.2" />
  </>
));

// ═══════════════════════════════════════════════════════════════
// POLYGON CONSTRUCTION METHODS ICONS
// ═══════════════════════════════════════════════════════════════

/** Inscribed in Circle Polygon (Vertices on circle) */
export const PolyInscribedIcon = createCadIcon('PolyInscribedIcon', (
  <>
    <circle cx="12" cy="12" r="9" strokeDasharray="2 2" strokeOpacity="0.4" />
    <polygon points="12,3 19.8,7.5 19.8,16.5 12,21 4.2,16.5 4.2,7.5" strokeWidth="1.8" />
    <circle cx="12" cy="3" r="1.75" fill="currentColor" />
    <circle cx="19.8" cy="7.5" r="1.75" fill="currentColor" />
  </>
));

/** Circumscribed about Circle Polygon (Edges tangent to circle / AF) */
export const PolyCircumscribedIcon = createCadIcon('PolyCircumscribedIcon', (
  <>
    <circle cx="12" cy="12" r="6.5" strokeDasharray="2 2" strokeOpacity="0.4" />
    <polygon points="12,2 20.6,7 20.6,17 12,22 3.4,17 3.4,7" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <line x1="12" y1="12" x2="12" y2="5.5" strokeWidth="1.5" />
  </>
));

/** Edge-Based Polygon */
export const PolyEdgeIcon = createCadIcon('PolyEdgeIcon', (
  <>
    <polygon points="12,3 19.8,7.5 19.8,16.5 12,21 4.2,16.5 4.2,7.5" strokeWidth="1.3" strokeOpacity="0.6" />
    <line x1="4.2" y1="16.5" x2="12" y2="21" strokeWidth="2.4" />
    <circle cx="4.2" cy="16.5" r="2" fill="currentColor" />
    <circle cx="12" cy="21" r="2" fill="currentColor" />
  </>
));

// ═══════════════════════════════════════════════════════════════
// ELLIPSE CONSTRUCTION METHODS ICONS
// ═══════════════════════════════════════════════════════════════

/** Center & Radii Ellipse */
export const EllipseCenterIcon = createCadIcon('EllipseCenterIcon', (
  <>
    <ellipse cx="12" cy="12" rx="9" ry="6" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="1.75" fill="currentColor" />
    <line x1="12" y1="12" x2="21" y2="12" strokeWidth="1.5" />
    <line x1="12" y1="12" x2="12" y2="6" strokeWidth="1.5" />
  </>
));

/** Axis Endpoints Ellipse */
export const EllipseAxisIcon = createCadIcon('EllipseAxisIcon', (
  <>
    <ellipse cx="12" cy="12" rx="9" ry="6" strokeWidth="1.5" strokeDasharray="3 2" />
    <line x1="3" y1="12" x2="21" y2="12" strokeWidth="1.8" />
    <circle cx="3" cy="12" r="2" fill="currentColor" />
    <circle cx="21" cy="12" r="2" fill="currentColor" />
  </>
));

/** Elliptical Arc */
export const EllipseArcIcon = createCadIcon('EllipseArcIcon', (
  <>
    <path d="M5 14 A 9 6 0 0 1 20 10" strokeWidth="2.2" />
    <circle cx="5" cy="14" r="2" fill="currentColor" />
    <circle cx="20" cy="10" r="2" fill="currentColor" />
  </>
));

// ═══════════════════════════════════════════════════════════════
// LINE & CONSTRUCTION METHODS ICONS
// ═══════════════════════════════════════════════════════════════

/** 2-Point Line Segment */
export const Line2PIcon = createCadIcon('Line2PIcon', (
  <>
    <line x1="4" y1="20" x2="20" y2="4" strokeWidth="2" />
    <circle cx="4" cy="20" r="2" fill="currentColor" />
    <circle cx="20" cy="4" r="2" fill="currentColor" />
  </>
));

/** Infinite Construction Line (XLine) */
export const LineXlineIcon = createCadIcon('LineXlineIcon', (
  <>
    <line x1="2" y1="22" x2="22" y2="2" strokeWidth="1.6" strokeDasharray="4 2" />
    <polygon points="2,22 6,21 3,18" fill="currentColor" />
    <polygon points="22,2 18,3 21,6" fill="currentColor" />
    <circle cx="8" cy="16" r="1.5" fill="currentColor" />
    <circle cx="16" cy="8" r="1.5" fill="currentColor" />
  </>
));

/** Semi-Infinite Ray */
export const LineRayIcon = createCadIcon('LineRayIcon', (
  <>
    <circle cx="4" cy="20" r="2.5" fill="currentColor" />
    <line x1="4" y1="20" x2="21" y2="3" strokeWidth="1.8" />
    <polygon points="21,3 17,4 20,7" fill="currentColor" />
  </>
));

// ═══════════════════════════════════════════════════════════════
// DIMENSION METHODS ICONS
// ═══════════════════════════════════════════════════════════════

/** Smart Auto Dimension */
export const DimSmartIcon = createCadIcon('DimSmartIcon', (
  <>
    <line x1="4" y1="18" x2="20" y2="18" strokeWidth="1.5" />
    <line x1="4" y1="14" x2="4" y2="22" strokeWidth="1.5" />
    <line x1="20" y1="14" x2="20" y2="22" strokeWidth="1.5" />
    <polygon points="5,18 8,16 8,20" fill="currentColor" />
    <polygon points="19,18 16,16 16,20" fill="currentColor" />
    {/* Spark / Auto Icon */}
    <path d="M12 3 L13.5 7 L17.5 8.5 L13.5 10 L12 14 L10.5 10 L6.5 8.5 L10.5 7 Z" fill="currentColor" />
  </>
));

/** Aligned Dimension */
export const DimAlignedIcon = createCadIcon('DimAlignedIcon', (
  <>
    <line x1="5" y1="19" x2="19" y2="5" strokeWidth="1.5" />
    <line x1="3" y1="17" x2="7" y2="21" strokeWidth="1.5" />
    <line x1="17" y1="3" x2="21" y2="7" strokeWidth="1.5" />
    <polygon points="6,18 7.5,14.5 10.5,17.5" fill="currentColor" />
    <polygon points="18,6 16.5,9.5 13.5,6.5" fill="currentColor" />
  </>
));

/** Angular Dimension */
export const DimAngularIcon = createCadIcon('DimAngularIcon', (
  <>
    <line x1="4" y1="20" x2="20" y2="20" strokeWidth="1.5" />
    <line x1="4" y1="20" x2="18" y2="6" strokeWidth="1.5" />
    <path d="M14 20 A 10 10 0 0 0 12.5 11.5" strokeWidth="1.5" />
    <polygon points="14,20 12,18 14,16" fill="currentColor" />
    <polygon points="12.5,11.5 14.5,13.5 15.5,11" fill="currentColor" />
  </>
));

/** Radial Dimension (R) */
export const DimRadialIcon = createCadIcon('DimRadialIcon', (
  <>
    <circle cx="6" cy="18" r="1.5" fill="currentColor" />
    <path d="M6 18 A 12 12 0 0 1 18 6" strokeWidth="1.2" strokeDasharray="2 2" />
    <line x1="6" y1="18" x2="15" y2="9" strokeWidth="1.5" />
    <line x1="15" y1="9" x2="21" y2="9" strokeWidth="1.5" />
    <polygon points="15,9 12,10.5 13.5,12" fill="currentColor" />
    <text x="17" y="7" fontSize="7" fontWeight="bold" fill="currentColor">R</text>
  </>
));

/** Diameter Dimension (Ø) */
export const DimDiameterIcon = createCadIcon('DimDiameterIcon', (
  <>
    <circle cx="12" cy="12" r="8" strokeWidth="1.2" />
    <line x1="4" y1="20" x2="20" y2="4" strokeWidth="1.5" />
    <polygon points="5,19 8,19 5,16" fill="currentColor" />
    <polygon points="19,5 16,5 19,8" fill="currentColor" />
  </>
));

/**
 * ISO 1302 Surface Finish Tool (SURF) - Machining required surface texture symbol
 */
export const SurfaceFinishIcon = createCadIcon('SurfaceFinishIcon', (
  <>
    {/* Short 60 deg leg */}
    <line x1="4" y1="13" x2="8" y2="20" strokeWidth="1.75" />
    {/* Long 60 deg leg */}
    <line x1="8" y1="20" x2="16" y2="6" strokeWidth="1.75" />
    {/* Overbar extension */}
    <line x1="16" y1="6" x2="22" y2="6" strokeWidth="1.75" />
    {/* Closed machining bar */}
    <line x1="5.7" y1="16" x2="10.3" y2="16" strokeWidth="1.5" />
  </>
));

/**
 * Surface Finish with Leader (SURF_LEADER) - Pointer arrow connecting to ISO 1302 symbol
 */
export const SurfaceLeaderIcon = createCadIcon('SurfaceLeaderIcon', (
  <>
    {/* Arrow line from bottom left */}
    <line x1="3" y1="21" x2="11" y2="13" strokeWidth="1.5" />
    <polygon points="3,21 3,16 8,21" fill="currentColor" />
    {/* Horizontal landing */}
    <line x1="11" y1="13" x2="15" y2="13" strokeWidth="1.5" />
    {/* ISO 1302 check symbol */}
    <line x1="14" y1="9" x2="16" y2="13" strokeWidth="1.5" />
    <line x1="16" y1="13" x2="20" y2="5" strokeWidth="1.5" />
    <line x1="20" y1="5" x2="23" y2="5" strokeWidth="1.5" />
  </>
));

/**
 * T-Slot Aluminum Extrusion Profile Tool (TSLOT) - Iconic 4-slot modular beam with central bore
 */
export const TSlotIcon = createCadIcon('TSlotIcon', (
  <>
    {/* Outer Profile with 4 T-Slot indentations */}
    <path
      d="M5 3 h4 v2 h-1 v3 h8 v-3 h-1 v-2 h4 a2 2 0 0 1 2 2 v4 h-2 v-1 h-3 v8 h3 v-1 h2 v4 a2 2 0 0 1 -2 2 h-4 v-2 h1 v-3 h-8 v3 h1 v2 h-4 a2 2 0 0 1 -2 -2 v-4 h2 v1 h3 v-8 h-3 v1 h-2 v-4 a2 2 0 0 1 2 -2 z"
      strokeWidth="1.5"
    />
    {/* Center Bore Hole */}
    <circle cx="12" cy="12" r="2.2" strokeWidth="1.5" />
  </>
));

