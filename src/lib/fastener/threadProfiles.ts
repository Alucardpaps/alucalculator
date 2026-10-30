/**
 * Universal screw-thread engineering engine.
 * Covers all 45 thread types from inpart24.com and international standards (ISO, ASME, BS, DIN, IEC).
 *
 * Families:
 *   iso60      ISO 68-1 / ASME B1.1   — M, MF, UNC, UNF, UNEF, UN, UNS, JIS metric  60°
 *   whitworth  BS 84 / ISO 228 / ISO 7 — BSW, BSF, BSPP G, BSPT R, Rp, Rc, DIN 477 W 55°
 *   npt        ASME B1.20.1 / B1.20.3  — NPT, NPTF, NPTR                            60° + 1:16 taper
 *   nps        ASME B1.20.1            — NPS, NPSM, NPSC, NPSL                      60° straight
 *   jic        SAE J514 / ISO 8434-2   — JIC 37° flare (UN thread)                  60° thread + 37° seat
 *   sae_orb    SAE J1926 / ISO 11926   — SAE O-Ring Boss (UN thread)                60° thread + O-ring port
 *   orfs       SAE J1453 / ISO 8434-3  — O-Ring Face Seal (UN thread)               60° thread + captive O-ring
 *   tr         ISO 2901 / DIN 103      — Metric Trapezoidal Tr                      30°
 *   acme       ASME B1.5               — General-Purpose / Centralizing ACME        29°
 *   acme_stub  ASME B1.8               — Stub ACME (h = 0.3P)                       29°
 *   buttress   DIN 513 / ASME B1.9     — Sawtooth / S (DIN 45°/3°, ASME 45°/7°)
 *   square     —                       — Square thread (vertical flanks)            0°
 *   round      DIN 405 / DIN 20400     — Knuckle / Round thread (mining, rail)      ~30° round
 *   pg         DIN 40430               — Panzergewinde (cable glands)               80°
 *   edison     IEC 60061 / DIN 40400   — Edison screw lamp base (E10-E40)           Round wave
 *   valve      DIN 7756 / ISO 4570     — Tire valve thread (Vg 5 - Vg 12)           60°
 *   gas_w      DIN 477                 — Gas cylinder valve thread (W 21.8 etc.)    55°
 *   conduit    ANSI C80.1              — Rigid electrical conduit (NC)              60°
 */

export const MM_PER_IN = 25.4;

export type ThreadProfileKind =
  | 'iso60'
  | 'whitworth'
  | 'npt'
  | 'nps'
  | 'jic'
  | 'sae_orb'
  | 'orfs'
  | 'tr'
  | 'acme'
  | 'acme_stub'
  | 'buttress'
  | 'square'
  | 'round'
  | 'pg'
  | 'edison'
  | 'valve'
  | 'gas_w'
  | 'conduit';

export type ThreadTypeCode =
  | 'M'
  | 'MF'
  | 'MFS'
  | 'MJ'
  | 'MS'
  | 'UN'
  | 'UNC'
  | 'UNF'
  | 'UNEF'
  | 'UNS'
  | 'UNJ'
  | 'UNM'
  | 'W'
  | 'BSW'
  | 'BSF'
  | 'BSB'
  | 'BSC'
  | 'BA'
  | 'G'
  | 'BSPP'
  | 'R'
  | 'BSPT'
  | 'Rp'
  | 'Rc'
  | 'NPT'
  | 'NPTF'
  | 'NPS'
  | 'NPSM'
  | 'NPSC'
  | 'NPSL'
  | 'NPTR'
  | 'NPSH'
  | 'NPSF'
  | 'JIC'
  | 'SAE'
  | 'ORFS'
  | 'JIS'
  | 'DIN2353'
  | 'ISO6149'
  | 'Tr'
  | 'Acme'
  | 'AcmeStub'
  | 'S'
  | 'Sq'
  | 'Rd'
  | 'Pg'
  | 'Edison'
  | 'Vg'
  | 'W_GAS'
  | 'NC'
  | 'Other';

export type SealingCategory =
  | 'dryseal'           // NPTF
  | 'taper_compound'     // NPT, BSPT, Rc, NPTR
  | 'parallel_gasket'    // BSPP (G), NPSM, NPSC, NPSL, Rp, JIS
  | 'cone_37'            // JIC (SAE J514 37°)
  | 'face_seal_oring'    // ORFS, SAE ORB
  | 'cable_gland'        // Pg (DIN 40430)
  | 'power_transmission' // Tr, Acme, Buttress, Square
  | 'dirt_tolerant'      // Rd (DIN 405), Edison (IEC 60061)
  | 'pneumatic_valve'    // Vg (DIN 7756)
  | 'gas_cylinder';      // W (DIN 477)

export interface ThreadStandardOption {
  label: string;
  value: ThreadTypeCode;
  standard: string;
  category: string;
  profileAngle: number;
  isTapered: boolean;
  taperRatio?: string;
  sealingCategory: SealingCategory;
  description: string;
}

export const THREAD_TYPE_OPTIONS: ThreadStandardOption[] = [
  // 1. Metric
  { label: 'Metric Coarse (M)', value: 'M', standard: 'ISO 68-1 / ISO 262', category: 'Metric', profileAngle: 60, isTapered: false, sealingCategory: 'parallel_gasket', description: 'General mechanical bolting and fastening.' },
  { label: 'Metric Fine (MF)', value: 'MF', standard: 'ISO 261 / ISO 965', category: 'Metric', profileAngle: 60, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Precision instruments, high vibration resistance.' },
  { label: 'Metric Superfine (MFS)', value: 'MFS', standard: 'ISO 261', category: 'Metric', profileAngle: 60, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Ultra fine metric pitch for optics and precision micrometers.' },
  { label: 'Metric Aerospace (MJ)', value: 'MJ', standard: 'ISO 5855', category: 'Metric', profileAngle: 60, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Aerospace metric thread with controlled root radius (0.150P-0.180P) for high fatigue strength.' },
  { label: 'Miniature Metric (S / MS)', value: 'MS', standard: 'ISO 1501', category: 'Metric', profileAngle: 60, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Miniature screw threads for horology and watches (0.3mm to 1.4mm).' },

  // 2. Unified Inch
  { label: 'Unified Coarse (UNC)', value: 'UNC', standard: 'ASME B1.1', category: 'Unified Inch', profileAngle: 60, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Standard American coarse bolting.' },
  { label: 'Unified Fine (UNF)', value: 'UNF', standard: 'ASME B1.1', category: 'Unified Inch', profileAngle: 60, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Automotive and aerospace fine fastening.' },
  { label: 'Unified Extra Fine (UNEF)', value: 'UNEF', standard: 'ASME B1.1', category: 'Unified Inch', profileAngle: 60, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Thin walls, electrical connectors, aerospace.' },
  { label: 'Unified Constant Pitch (UN)', value: 'UN', standard: 'ASME B1.1', category: 'Unified Inch', profileAngle: 60, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Constant pitch series (8-UN, 12-UN, 16-UN).' },
  { label: 'Unified Special (UNS)', value: 'UNS', standard: 'ASME B1.1', category: 'Unified Inch', profileAngle: 60, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Non-standard diameter/pitch combinations.' },
  { label: 'Unified Aerospace (UNJ)', value: 'UNJ', standard: 'ASME B1.15', category: 'Unified Inch', profileAngle: 60, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Aerospace Unified thread with enlarged root radius for superior fatigue resistance.' },
  { label: 'Unified Miniature (UNM)', value: 'UNM', standard: 'ASME B1.10', category: 'Unified Inch', profileAngle: 60, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Miniature inch threads for optical and medical micro-instruments.' },

  // 3. British Whitworth & Pipe
  { label: 'Whitworth Coarse (BSW)', value: 'BSW', standard: 'BS 84:2007', category: 'British Whitworth', profileAngle: 55, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Classic 55° Whitworth coarse thread with rounded crests/roots.' },
  { label: 'Whitworth General (W)', value: 'W', standard: 'BS 84:2007', category: 'British Whitworth', profileAngle: 55, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Standard Whitworth nominal designation.' },
  { label: 'Whitworth Fine (BSF)', value: 'BSF', standard: 'BS 84:2007', category: 'British Whitworth', profileAngle: 55, isTapered: false, sealingCategory: 'parallel_gasket', description: 'British fine automotive and machinery thread.' },
  { label: 'British Standard Brass (BSB)', value: 'BSB', standard: 'BS 84 (Brass)', category: 'British Whitworth', profileAngle: 55, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Constant 26 TPI pitch on all diameters for thin brass tubing and lighting.' },
  { label: 'British Standard Cycle (BSC / CEI)', value: 'BSC', standard: 'BS 811', category: 'British Whitworth', profileAngle: 60, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Bicycle cycle engineers institute thread: 26 TPI, 60° angle.' },
  { label: 'British Association (BA)', value: 'BA', standard: 'BS 93', category: 'British Whitworth', profileAngle: 47.5, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Small instrument thread with 47.5° included angle and heavy rounding.' },
  { label: 'Pipe Parallel (BSPP)', value: 'BSPP', standard: 'ISO 228-1', category: 'British Pipe', profileAngle: 55, isTapered: false, sealingCategory: 'parallel_gasket', description: 'British standard parallel pipe thread G (ISO 228-1).' },
  { label: 'Pipe Parallel (G)', value: 'G', standard: 'ISO 228-1', category: 'British Pipe', profileAngle: 55, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Parallel Whitworth pipe thread G. Requires sealing washer/O-ring.' },
  { label: 'Pipe Taper External (BSPT)', value: 'BSPT', standard: 'ISO 7-1 / EN 10226', category: 'British Pipe', profileAngle: 55, isTapered: true, taperRatio: '1:16', sealingCategory: 'taper_compound', description: 'Taper external Whitworth pipe thread (1:16 taper). Uses sealant.' },
  { label: 'Pipe Taper External (R)', value: 'R', standard: 'ISO 7-1 / EN 10226-1', category: 'British Pipe', profileAngle: 55, isTapered: true, taperRatio: '1:16', sealingCategory: 'taper_compound', description: 'British standard taper pipe external thread R (1:16 taper).' },
  { label: 'Pipe Parallel Internal (Rp)', value: 'Rp', standard: 'DIN EN 10226-1', category: 'British Pipe', profileAngle: 55, isTapered: false, sealingCategory: 'taper_compound', description: 'Parallel internal Whitworth thread that seals with tapered R external.' },
  { label: 'Pipe Taper Internal (Rc)', value: 'Rc', standard: 'ISO 7-1 / EN 10226-2', category: 'British Pipe', profileAngle: 55, isTapered: true, taperRatio: '1:16', sealingCategory: 'taper_compound', description: 'Taper internal Whitworth thread (1:16 taper) for R external.' },

  // 4. American Pipe
  { label: 'NPT (National Pipe Taper)', value: 'NPT', standard: 'ASME B1.20.1', category: 'American Pipe', profileAngle: 60, isTapered: true, taperRatio: '1:16', sealingCategory: 'taper_compound', description: 'Standard American tapered pipe thread (1:16). Requires PTFE/paste.' },
  { label: 'NPTF (Dryseal Pipe Taper)', value: 'NPTF', standard: 'ASME B1.20.3', category: 'American Pipe', profileAngle: 60, isTapered: true, taperRatio: '1:16', sealingCategory: 'dryseal', description: 'Fuel/hydraulic dryseal taper. Metal-to-metal crest/root interference.' },
  { label: 'NPS (National Pipe Straight)', value: 'NPS', standard: 'ASME B1.20.1', category: 'American Pipe', profileAngle: 60, isTapered: false, sealingCategory: 'parallel_gasket', description: 'American cylindrical pipe thread for basic mechanical joints.' },
  { label: 'NPSM (Straight Mechanical)', value: 'NPSM', standard: 'ASME B1.20.1', category: 'American Pipe', profileAngle: 60, isTapered: false, sealingCategory: 'parallel_gasket', description: 'American cylindrical pipe thread for free-fitting mechanical joints.' },
  { label: 'NPSC (Straight Coupling)', value: 'NPSC', standard: 'ASME B1.20.1', category: 'American Pipe', profileAngle: 60, isTapered: false, sealingCategory: 'taper_compound', description: 'Straight internal pipe coupling for mating with tapered NPT.' },
  { label: 'NPSL (Straight Locknut)', value: 'NPSL', standard: 'ASME B1.20.1', category: 'American Pipe', profileAngle: 60, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Straight pipe thread with locknut for mechanical retention.' },
  { label: 'NPTR (Taper Railing)', value: 'NPTR', standard: 'ASME B1.20.1', category: 'American Pipe', profileAngle: 60, isTapered: true, taperRatio: '1:16', sealingCategory: 'taper_compound', description: 'Taper pipe thread for handrails and architectural piping.' },
  { label: 'NPSH (Straight Hose Coupling)', value: 'NPSH', standard: 'ASME B1.20.7', category: 'American Pipe', profileAngle: 60, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Straight pipe thread for industrial fluid and fire hose couplings.' },
  { label: 'NPSF (Dryseal Straight Female)', value: 'NPSF', standard: 'ASME B1.20.3', category: 'American Pipe', profileAngle: 60, isTapered: false, sealingCategory: 'dryseal', description: 'Dryseal internal parallel thread mating with NPTF taper male.' },

  // 5. Hydraulic & Flared Fittings
  { label: 'JIC 37° Flare (SAE J514)', value: 'JIC', standard: 'SAE J514 / ISO 8434-2', category: 'Hydraulic Fittings', profileAngle: 60, isTapered: false, sealingCategory: 'cone_37', description: 'UN-threaded fitting with 37° machined cone metal-to-metal seal (up to 10,000 PSI).' },
  { label: 'SAE O-Ring Boss (ORB)', value: 'SAE', standard: 'SAE J1926-1', category: 'Hydraulic Fittings', profileAngle: 60, isTapered: false, sealingCategory: 'face_seal_oring', description: 'Straight UN thread with O-ring counterbore chamber for leak-free hydraulic ports.' },
  { label: 'ORFS (O-Ring Face Seal)', value: 'ORFS', standard: 'SAE J1453 / ISO 8434-3', category: 'Hydraulic Fittings', profileAngle: 60, isTapered: false, sealingCategory: 'face_seal_oring', description: 'Flat face fitting with trapped elastomeric O-ring for extreme pulse/vibration.' },
  { label: 'JIS Hydraulic Pipe', value: 'JIS', standard: 'JIS B 0202 / B 0203', category: 'Hydraulic Fittings', profileAngle: 55, isTapered: false, sealingCategory: 'parallel_gasket', description: 'Japanese Industrial Standard pipe threads (similar to BSPP/BSPT).' },
  { label: 'DIN 2353 / ISO 8434-1 (24° Cone)', value: 'DIN2353', standard: 'DIN 2353 / ISO 8434-1', category: 'Hydraulic Fittings', profileAngle: 60, isTapered: false, sealingCategory: 'cone_37', description: 'Metric compression fitting with 24° cone seat and cutting ring.' },
  { label: 'ISO 6149 Metric Port O-Ring', value: 'ISO6149', standard: 'ISO 6149-1', category: 'Hydraulic Fittings', profileAngle: 60, isTapered: false, sealingCategory: 'face_seal_oring', description: 'Metric parallel thread with integrated O-ring port for high-pressure hydraulics.' },

  // 6. Power & Motion Screws
  { label: 'Trapezoidal Metric (Tr)', value: 'Tr', standard: 'ISO 2901 / DIN 103', category: 'Power Screws', profileAngle: 30, isTapered: false, sealingCategory: 'power_transmission', description: 'Symmetrical 30° metric leadscrew for linear drives, lathes, and jacks.' },
  { label: 'ACME General Purpose', value: 'Acme', standard: 'ASME B1.5', category: 'Power Screws', profileAngle: 29, isTapered: false, sealingCategory: 'power_transmission', description: 'American 29° trapezoidal power screw for heavy linear positioning.' },
  { label: 'ACME Stub', value: 'AcmeStub', standard: 'ASME B1.8', category: 'Power Screws', profileAngle: 29, isTapered: false, sealingCategory: 'power_transmission', description: 'Shallow 29° ACME thread (depth = 0.3P) for thin-walled tubes/casing.' },
  { label: 'Buttress / Sawtooth (S)', value: 'S', standard: 'DIN 513 / ASME B1.9', category: 'Power Screws', profileAngle: 45, isTapered: false, sealingCategory: 'power_transmission', description: 'Asymmetrical 45°/3° or 45°/7° profile. Extreme unidirectional load capacity.' },
  { label: 'Square Thread (Sq)', value: 'Sq', standard: 'Non-standardized', category: 'Power Screws', profileAngle: 0, isTapered: false, sealingCategory: 'power_transmission', description: '0° vertical flanks. Maximum mechanical efficiency, zero bursting force.' },
  { label: 'Round / Knuckle (Rd)', value: 'Rd', standard: 'DIN 405 / DIN 20400', category: 'Heavy & Mining', profileAngle: 30, isTapered: false, sealingCategory: 'dirt_tolerant', description: 'Rounded circular profile. Highly dirt-tolerant, train couplings, crane hooks.' },

  // 7. Electrical & Specialty
  { label: 'Panzergewinde (Pg)', value: 'Pg', standard: 'DIN 40430', category: 'Electrical & Specialty', profileAngle: 80, isTapered: false, sealingCategory: 'cable_gland', description: 'German 80° shallow thread for electrical cable gland penetrations.' },
  { label: 'Edison Screw (E-Series)', value: 'Edison', standard: 'IEC 60061 / DIN 40400', category: 'Electrical & Specialty', profileAngle: 0, isTapered: false, sealingCategory: 'dirt_tolerant', description: 'Smooth rounded rolled sheet thread for light bulb sockets (E10-E40).' },
  { label: 'Tire Valve (Vg / Ven)', value: 'Vg', standard: 'DIN 7756 / ISO 4570', category: 'Automotive & Valves', profileAngle: 60, isTapered: false, sealingCategory: 'pneumatic_valve', description: 'Automotive and bicycle pneumatic valve stem threads (Vg 5 to Vg 12).' },
  { label: 'Gas Cylinder Valve (DIN 477 W)', value: 'W_GAS', standard: 'DIN 477-1', category: 'Gas Cylinders', profileAngle: 55, isTapered: true, taperRatio: '3:25', sealingCategory: 'gas_cylinder', description: 'Heavy-duty Whitworth taper thread for high-pressure gas cylinder valves.' },
  { label: 'Rigid Conduit (NC)', value: 'NC', standard: 'ANSI C80.1', category: 'Electrical & Specialty', profileAngle: 60, isTapered: true, taperRatio: '1:16', sealingCategory: 'taper_compound', description: 'American electrical conduit threaded pipe for wiring protection.' },
];

export interface StandardThreadSize {
  name: string;
  standardType: ThreadTypeCode;
  diameterMm: number;
  pitchMm: number;
  tpi?: number;
  tapDrillMm: number;
  maxHoleMm?: number;
  gaugeLengthMm?: number;
  handTurns?: number;
  wrenchTurns?: number;
  internalMinMaxMm?: [number, number];
  externalMinMaxMm?: [number, number];
  description?: string;
}

/**
 * Tabulated standard sizes matching Inpart24.com and international standards.
 */
export const STANDARD_THREAD_SIZES: StandardThreadSize[] = [
  // ── Cylindrical Pipe (BSP / G - ISO 228-1) [Inpart24 Article 37 Exact Table] ──
  { name: 'G 1/8"', standardType: 'G', diameterMm: 9.728, pitchMm: 0.907, tpi: 28, tapDrillMm: 8.8, maxHoleMm: 8.848, internalMinMaxMm: [8.50, 8.90], externalMinMaxMm: [9.40, 9.70] },
  { name: 'G 1/4"', standardType: 'G', diameterMm: 13.157, pitchMm: 1.337, tpi: 19, tapDrillMm: 11.8, maxHoleMm: 11.890, internalMinMaxMm: [11.40, 11.90], externalMinMaxMm: [12.90, 13.10] },
  { name: 'G 3/8"', standardType: 'G', diameterMm: 16.662, pitchMm: 1.337, tpi: 19, tapDrillMm: 15.25, maxHoleMm: 15.395, internalMinMaxMm: [14.90, 15.40], externalMinMaxMm: [16.30, 16.60] },
  { name: 'G 1/2"', standardType: 'G', diameterMm: 20.955, pitchMm: 1.814, tpi: 14, tapDrillMm: 19.0, maxHoleMm: 19.172, internalMinMaxMm: [18.60, 19.00], externalMinMaxMm: [20.50, 20.90] },
  { name: 'G 5/8"', standardType: 'G', diameterMm: 22.911, pitchMm: 1.814, tpi: 14, tapDrillMm: 21.0, maxHoleMm: 21.128 },
  { name: 'G 3/4"', standardType: 'G', diameterMm: 26.441, pitchMm: 1.814, tpi: 14, tapDrillMm: 24.5, maxHoleMm: 24.658, internalMinMaxMm: [24.10, 24.50], externalMinMaxMm: [26.10, 26.40] },
  { name: 'G 7/8"', standardType: 'G', diameterMm: 30.201, pitchMm: 1.814, tpi: 14, tapDrillMm: 28.25, maxHoleMm: 28.418 },
  { name: 'G 1"', standardType: 'G', diameterMm: 33.249, pitchMm: 2.309, tpi: 11, tapDrillMm: 30.75, maxHoleMm: 30.931, internalMinMaxMm: [30.30, 30.80], externalMinMaxMm: [33.00, 33.20] },
  { name: 'G 1 1/8"', standardType: 'G', diameterMm: 37.897, pitchMm: 2.309, tpi: 11, tapDrillMm: 35.5, maxHoleMm: 35.579 },
  { name: 'G 1 1/4"', standardType: 'G', diameterMm: 41.910, pitchMm: 2.309, tpi: 11, tapDrillMm: 39.25, maxHoleMm: 39.592, internalMinMaxMm: [39.00, 39.50], externalMinMaxMm: [41.50, 41.90] },
  { name: 'G 1 3/8"', standardType: 'G', diameterMm: 44.323, pitchMm: 2.309, tpi: 11, tapDrillMm: 41.7, maxHoleMm: 42.005 },
  { name: 'G 1 1/2"', standardType: 'G', diameterMm: 47.803, pitchMm: 2.309, tpi: 11, tapDrillMm: 45.25, maxHoleMm: 45.485, internalMinMaxMm: [44.80, 45.30], externalMinMaxMm: [47.40, 47.80] },
  { name: 'G 1 3/4"', standardType: 'G', diameterMm: 53.746, pitchMm: 2.309, tpi: 11, tapDrillMm: 51.1, maxHoleMm: 51.428 },
  { name: 'G 2"', standardType: 'G', diameterMm: 59.614, pitchMm: 2.309, tpi: 11, tapDrillMm: 57.0, maxHoleMm: 57.296 },
  { name: 'G 2 1/4"', standardType: 'G', diameterMm: 65.710, pitchMm: 2.309, tpi: 11, tapDrillMm: 63.1, maxHoleMm: 63.392 },
  { name: 'G 2 1/2"', standardType: 'G', diameterMm: 75.184, pitchMm: 2.309, tpi: 11, tapDrillMm: 72.6, maxHoleMm: 72.866 },
  { name: 'G 2 3/4"', standardType: 'G', diameterMm: 81.534, pitchMm: 2.309, tpi: 11, tapDrillMm: 78.9, maxHoleMm: 79.216 },
  { name: 'G 3"', standardType: 'G', diameterMm: 87.884, pitchMm: 2.309, tpi: 11, tapDrillMm: 85.3, maxHoleMm: 85.566 },
  { name: 'G 3 1/4"', standardType: 'G', diameterMm: 93.980, pitchMm: 2.309, tpi: 11, tapDrillMm: 91.5, maxHoleMm: 91.662 },
  { name: 'G 3 1/2"', standardType: 'G', diameterMm: 100.330, pitchMm: 2.309, tpi: 11, tapDrillMm: 97.7, maxHoleMm: 98.012 },
  { name: 'G 3 3/4"', standardType: 'G', diameterMm: 106.680, pitchMm: 2.309, tpi: 11, tapDrillMm: 104.0, maxHoleMm: 104.362 },
  { name: 'G 4"', standardType: 'G', diameterMm: 113.030, pitchMm: 2.309, tpi: 11, tapDrillMm: 110.4, maxHoleMm: 110.712 },

  // ── Tapered Pipe (NPT / NPTF - ASME B1.20.1) [Inpart24 Article 37 Exact Table] ──
  { name: '1/16" NPT', standardType: 'NPT', diameterMm: 7.894, pitchMm: 0.941, tpi: 27, tapDrillMm: 6.15, gaugeLengthMm: 4.10, handTurns: 4.3, wrenchTurns: 3.0 },
  { name: '1/8" NPT', standardType: 'NPT', diameterMm: 10.287, pitchMm: 0.941, tpi: 27, tapDrillMm: 8.50, gaugeLengthMm: 4.10, handTurns: 4.3, wrenchTurns: 3.0, internalMinMaxMm: [8.50, 8.90], externalMinMaxMm: [9.40, 9.70] },
  { name: '1/4" NPT', standardType: 'NPT', diameterMm: 13.716, pitchMm: 1.411, tpi: 18, tapDrillMm: 11.00, gaugeLengthMm: 5.79, handTurns: 4.1, wrenchTurns: 3.0, internalMinMaxMm: [11.40, 11.90], externalMinMaxMm: [12.90, 13.10] },
  { name: '3/8" NPT', standardType: 'NPT', diameterMm: 17.145, pitchMm: 1.411, tpi: 18, tapDrillMm: 14.50, gaugeLengthMm: 6.10, handTurns: 4.3, wrenchTurns: 3.0, internalMinMaxMm: [14.90, 15.40], externalMinMaxMm: [16.30, 16.60] },
  { name: '1/2" NPT', standardType: 'NPT', diameterMm: 21.336, pitchMm: 1.814, tpi: 14, tapDrillMm: 17.85, gaugeLengthMm: 8.13, handTurns: 4.5, wrenchTurns: 3.0, internalMinMaxMm: [18.30, 18.70], externalMinMaxMm: [20.70, 21.10] },
  { name: '3/4" NPT', standardType: 'NPT', diameterMm: 26.670, pitchMm: 1.814, tpi: 14, tapDrillMm: 23.20, gaugeLengthMm: 8.61, handTurns: 4.7, wrenchTurns: 3.0, internalMinMaxMm: [23.70, 24.10], externalMinMaxMm: [26.30, 26.70] },
  { name: '1" NPT', standardType: 'NPT', diameterMm: 33.401, pitchMm: 2.209, tpi: 11.5, tapDrillMm: 29.00, gaugeLengthMm: 10.16, handTurns: 4.6, wrenchTurns: 3.0, internalMinMaxMm: [30.30, 30.80], externalMinMaxMm: [32.90, 33.40] },
  { name: '1 1/4" NPT', standardType: 'NPT', diameterMm: 42.164, pitchMm: 2.209, tpi: 11.5, tapDrillMm: 37.80, gaugeLengthMm: 10.67, handTurns: 4.8, wrenchTurns: 3.0, internalMinMaxMm: [39.20, 39.60], externalMinMaxMm: [41.40, 42.00] },
  { name: '1 1/2" NPT', standardType: 'NPT', diameterMm: 48.260, pitchMm: 2.209, tpi: 11.5, tapDrillMm: 44.00, gaugeLengthMm: 10.67, handTurns: 4.8, wrenchTurns: 3.0, internalMinMaxMm: [45.10, 45.50], externalMinMaxMm: [47.30, 47.90] },
  { name: '2" NPT', standardType: 'NPT', diameterMm: 60.325, pitchMm: 2.209, tpi: 11.5, tapDrillMm: 56.00, gaugeLengthMm: 11.07, handTurns: 5.0, wrenchTurns: 3.0 },

  // ── Panzergewinde (Pg - DIN 40430) 80° Flank Angle ──
  { name: 'Pg 7', standardType: 'Pg', diameterMm: 12.5, pitchMm: 1.27, tapDrillMm: 11.3, description: 'Cable outer dia 3-6.5 mm' },
  { name: 'Pg 9', standardType: 'Pg', diameterMm: 15.2, pitchMm: 1.41, tapDrillMm: 13.9, description: 'Cable outer dia 4-8 mm' },
  { name: 'Pg 11', standardType: 'Pg', diameterMm: 18.6, pitchMm: 1.41, tapDrillMm: 17.3, description: 'Cable outer dia 5-10 mm' },
  { name: 'Pg 13.5', standardType: 'Pg', diameterMm: 20.4, pitchMm: 1.41, tapDrillMm: 19.1, description: 'Cable outer dia 6-12 mm' },
  { name: 'Pg 16', standardType: 'Pg', diameterMm: 22.5, pitchMm: 1.41, tapDrillMm: 21.2, description: 'Cable outer dia 9-14 mm' },
  { name: 'Pg 21', standardType: 'Pg', diameterMm: 28.3, pitchMm: 1.588, tapDrillMm: 26.8, description: 'Cable outer dia 13-18 mm' },
  { name: 'Pg 29', standardType: 'Pg', diameterMm: 37.0, pitchMm: 1.588, tapDrillMm: 35.5, description: 'Cable outer dia 18-25 mm' },
  { name: 'Pg 36', standardType: 'Pg', diameterMm: 47.0, pitchMm: 1.588, tapDrillMm: 45.5, description: 'Cable outer dia 22-32 mm' },
  { name: 'Pg 42', standardType: 'Pg', diameterMm: 54.0, pitchMm: 1.588, tapDrillMm: 52.5, description: 'Cable outer dia 30-38 mm' },
  { name: 'Pg 48', standardType: 'Pg', diameterMm: 59.3, pitchMm: 1.588, tapDrillMm: 57.8, description: 'Cable outer dia 34-44 mm' },

  // ── Edison Sockets (IEC 60061) Round Wave ──
  { name: 'E10', standardType: 'Edison', diameterMm: 10.0, pitchMm: 1.81, tapDrillMm: 8.5, description: 'Miniature flashlight & indicator bulbs' },
  { name: 'E12', standardType: 'Edison', diameterMm: 12.0, pitchMm: 2.54, tapDrillMm: 10.0, description: 'Candelabra base (North America)' },
  { name: 'E14', standardType: 'Edison', diameterMm: 14.0, pitchMm: 2.82, tapDrillMm: 11.5, description: 'Small Edison Screw (SES - Europe/Asia)' },
  { name: 'E27', standardType: 'Edison', diameterMm: 27.0, pitchMm: 3.628, tapDrillMm: 24.0, description: 'Standard residential lamp base (ES)' },
  { name: 'E40', standardType: 'Edison', diameterMm: 40.0, pitchMm: 6.35, tapDrillMm: 35.0, description: 'Giant Edison Screw (GES - Industrial / High Bay)' },

  // ── JIC 37° Flared Hydraulic (SAE J514) ──
  { name: 'JIC 7/16-20 (-04)', standardType: 'JIC', diameterMm: 11.112, pitchMm: 1.27, tpi: 20, tapDrillMm: 9.9, description: 'Tube OD 1/4" (6.35 mm)' },
  { name: 'JIC 1/2-20 (-05)', standardType: 'JIC', diameterMm: 12.700, pitchMm: 1.27, tpi: 20, tapDrillMm: 11.5, description: 'Tube OD 5/16" (7.94 mm)' },
  { name: 'JIC 9/16-18 (-06)', standardType: 'JIC', diameterMm: 14.288, pitchMm: 1.411, tpi: 18, tapDrillMm: 12.9, description: 'Tube OD 3/8" (9.52 mm)' },
  { name: 'JIC 3/4-16 (-08)', standardType: 'JIC', diameterMm: 19.050, pitchMm: 1.588, tpi: 16, tapDrillMm: 17.5, description: 'Tube OD 1/2" (12.7 mm)' },
  { name: 'JIC 7/8-14 (-10)', standardType: 'JIC', diameterMm: 22.225, pitchMm: 1.814, tpi: 14, tapDrillMm: 20.4, description: 'Tube OD 5/8" (15.88 mm)' },
  { name: 'JIC 1-1/16-12 (-12)', standardType: 'JIC', diameterMm: 26.988, pitchMm: 2.117, tpi: 12, tapDrillMm: 24.9, description: 'Tube OD 3/4" (19.05 mm)' },
  { name: 'JIC 1-5/16-12 (-16)', standardType: 'JIC', diameterMm: 33.338, pitchMm: 2.117, tpi: 12, tapDrillMm: 31.3, description: 'Tube OD 1" (25.4 mm)' },

  // ── ORFS (O-Ring Face Seal SAE J1453) ──
  { name: 'ORFS 9/16-18 (-04)', standardType: 'ORFS', diameterMm: 14.288, pitchMm: 1.411, tpi: 18, tapDrillMm: 12.9, description: 'Tube OD 1/4"' },
  { name: 'ORFS 11/16-16 (-06)', standardType: 'ORFS', diameterMm: 17.462, pitchMm: 1.588, tpi: 16, tapDrillMm: 15.9, description: 'Tube OD 3/8"' },
  { name: 'ORFS 13/16-16 (-08)', standardType: 'ORFS', diameterMm: 20.638, pitchMm: 1.588, tpi: 16, tapDrillMm: 19.1, description: 'Tube OD 1/2"' },
  { name: 'ORFS 1-14 (-10)', standardType: 'ORFS', diameterMm: 25.400, pitchMm: 1.814, tpi: 14, tapDrillMm: 23.6, description: 'Tube OD 5/8"' },
  { name: 'ORFS 1-3/16-12 (-12)', standardType: 'ORFS', diameterMm: 30.162, pitchMm: 2.117, tpi: 12, tapDrillMm: 28.1, description: 'Tube OD 3/4"' },

  // ── Pneumatic Tire Valves (Vg - DIN 7756 / ISO 4570) ──
  { name: 'Vg 5', standardType: 'Vg', diameterMm: 5.2, pitchMm: 0.907, tapDrillMm: 4.3, description: 'Bicycle & miniature valves' },
  { name: 'Vg 8', standardType: 'Vg', diameterMm: 7.7, pitchMm: 0.794, tapDrillMm: 6.9, description: 'Standard Schrader automotive tire valve (8V1)' },
  { name: 'Vg 10', standardType: 'Vg', diameterMm: 10.3, pitchMm: 0.907, tapDrillMm: 9.4, description: 'Heavy truck and bus tire valve (10V1)' },
  { name: 'Vg 12', standardType: 'Vg', diameterMm: 12.2, pitchMm: 0.907, tapDrillMm: 11.3, description: 'Earthmover and agricultural tire valve (12V1)' },

  // ── Gas Cylinder Valves (DIN 477-1) ──
  { name: 'W 19.8 × 1/14"', standardType: 'W', diameterMm: 19.8, pitchMm: 1.814, tpi: 14, tapDrillMm: 18.0, description: 'Small gas cylinder valve' },
  { name: 'W 21.8 × 1/14"', standardType: 'W', diameterMm: 21.8, pitchMm: 1.814, tpi: 14, tapDrillMm: 19.9, description: 'Standard oxygen, CO2, argon gas cylinder valve' },
  { name: 'W 24.32 × 1/14"', standardType: 'W', diameterMm: 24.32, pitchMm: 1.814, tpi: 14, tapDrillMm: 22.5, description: 'Flammable / technical gas cylinder valve' },
  { name: 'W 31.3 × 1/14"', standardType: 'W', diameterMm: 31.3, pitchMm: 1.814, tpi: 14, tapDrillMm: 29.5, description: 'Large industrial gas cylinder' },

  // ── Metric Trapezoidal (Tr - ISO 2901 / DIN 103) ──
  { name: 'Tr 10×2', standardType: 'Tr', diameterMm: 10, pitchMm: 2, tapDrillMm: 8.2 },
  { name: 'Tr 12×3', standardType: 'Tr', diameterMm: 12, pitchMm: 3, tapDrillMm: 9.25 },
  { name: 'Tr 16×4', standardType: 'Tr', diameterMm: 16, pitchMm: 4, tapDrillMm: 12.25 },
  { name: 'Tr 20×4', standardType: 'Tr', diameterMm: 20, pitchMm: 4, tapDrillMm: 16.25 },
  { name: 'Tr 24×5', standardType: 'Tr', diameterMm: 24, pitchMm: 5, tapDrillMm: 19.25 },
  { name: 'Tr 30×6', standardType: 'Tr', diameterMm: 30, pitchMm: 6, tapDrillMm: 24.5 },
  { name: 'Tr 36×6', standardType: 'Tr', diameterMm: 36, pitchMm: 6, tapDrillMm: 30.5 },
  { name: 'Tr 40×7', standardType: 'Tr', diameterMm: 40, pitchMm: 7, tapDrillMm: 33.5 },

  // ── ACME (ASME B1.5) ──
  { name: 'ACME 1/2-10', standardType: 'Acme', diameterMm: 12.7, pitchMm: 2.54, tpi: 10, tapDrillMm: 10.3 },
  { name: 'ACME 5/8-8', standardType: 'Acme', diameterMm: 15.875, pitchMm: 3.175, tpi: 8, tapDrillMm: 13.0 },
  { name: 'ACME 3/4-6', standardType: 'Acme', diameterMm: 19.05, pitchMm: 4.233, tpi: 6, tapDrillMm: 15.2 },
  { name: 'ACME 1-5', standardType: 'Acme', diameterMm: 25.4, pitchMm: 5.08, tpi: 5, tapDrillMm: 20.8 },
  { name: 'ACME 1 1/4-5', standardType: 'Acme', diameterMm: 31.75, pitchMm: 5.08, tpi: 5, tapDrillMm: 27.2 },
  { name: 'ACME 1 1/2-4', standardType: 'Acme', diameterMm: 38.1, pitchMm: 6.35, tpi: 4, tapDrillMm: 32.3 },

  // ── Metric Coarse (ISO 261 / ISO 262) ──
  { name: 'M3', standardType: 'M', diameterMm: 3, pitchMm: 0.5, tapDrillMm: 2.5 },
  { name: 'M4', standardType: 'M', diameterMm: 4, pitchMm: 0.7, tapDrillMm: 3.3 },
  { name: 'M5', standardType: 'M', diameterMm: 5, pitchMm: 0.8, tapDrillMm: 4.2 },
  { name: 'M6', standardType: 'M', diameterMm: 6, pitchMm: 1.0, tapDrillMm: 5.0 },
  { name: 'M8', standardType: 'M', diameterMm: 8, pitchMm: 1.25, tapDrillMm: 6.8 },
  { name: 'M10', standardType: 'M', diameterMm: 10, pitchMm: 1.5, tapDrillMm: 8.5 },
  { name: 'M12', standardType: 'M', diameterMm: 12, pitchMm: 1.75, tapDrillMm: 10.2 },
  { name: 'M14', standardType: 'M', diameterMm: 14, pitchMm: 2.0, tapDrillMm: 12.0 },
  { name: 'M16', standardType: 'M', diameterMm: 16, pitchMm: 2.0, tapDrillMm: 14.0 },
  { name: 'M18', standardType: 'M', diameterMm: 18, pitchMm: 2.5, tapDrillMm: 15.5 },
  { name: 'M20', standardType: 'M', diameterMm: 20, pitchMm: 2.5, tapDrillMm: 17.5 },
  { name: 'M22', standardType: 'M', diameterMm: 22, pitchMm: 2.5, tapDrillMm: 19.5 },
  { name: 'M24', standardType: 'M', diameterMm: 24, pitchMm: 3.0, tapDrillMm: 21.0 },
  { name: 'M27', standardType: 'M', diameterMm: 27, pitchMm: 3.0, tapDrillMm: 24.0 },
  { name: 'M30', standardType: 'M', diameterMm: 30, pitchMm: 3.5, tapDrillMm: 26.5 },
  { name: 'M33', standardType: 'M', diameterMm: 33, pitchMm: 3.5, tapDrillMm: 29.5 },
  { name: 'M36', standardType: 'M', diameterMm: 36, pitchMm: 4.0, tapDrillMm: 32.0 },

  // ── Metric Fine (ISO 261) ──
  { name: 'M8x1', standardType: 'MF', diameterMm: 8, pitchMm: 1.0, tapDrillMm: 7.0 },
  { name: 'M10x1', standardType: 'MF', diameterMm: 10, pitchMm: 1.0, tapDrillMm: 9.0 },
  { name: 'M10x1.25', standardType: 'MF', diameterMm: 10, pitchMm: 1.25, tapDrillMm: 8.8 },
  { name: 'M12x1.25', standardType: 'MF', diameterMm: 12, pitchMm: 1.25, tapDrillMm: 10.8 },
  { name: 'M12x1.5', standardType: 'MF', diameterMm: 12, pitchMm: 1.5, tapDrillMm: 10.5 },
  { name: 'M14x1.5', standardType: 'MF', diameterMm: 14, pitchMm: 1.5, tapDrillMm: 12.5 },
  { name: 'M16x1.5', standardType: 'MF', diameterMm: 16, pitchMm: 1.5, tapDrillMm: 14.5 },
  { name: 'M18x1.5', standardType: 'MF', diameterMm: 18, pitchMm: 1.5, tapDrillMm: 16.5 },
  { name: 'M20x1.5', standardType: 'MF', diameterMm: 20, pitchMm: 1.5, tapDrillMm: 18.5 },
  { name: 'M24x2', standardType: 'MF', diameterMm: 24, pitchMm: 2.0, tapDrillMm: 22.0 },

  // ── Unified Coarse (UNC - ASME B1.1) ──
  { name: '#4-40', standardType: 'UNC', diameterMm: 2.845, pitchMm: 25.4 / 40, tpi: 40, tapDrillMm: 2.35 },
  { name: '#6-32', standardType: 'UNC', diameterMm: 3.505, pitchMm: 25.4 / 32, tpi: 32, tapDrillMm: 2.85 },
  { name: '#8-32', standardType: 'UNC', diameterMm: 4.166, pitchMm: 25.4 / 32, tpi: 32, tapDrillMm: 3.5 },
  { name: '#10-24', standardType: 'UNC', diameterMm: 4.826, pitchMm: 25.4 / 24, tpi: 24, tapDrillMm: 3.9 },
  { name: '1/4-20', standardType: 'UNC', diameterMm: 6.350, pitchMm: 25.4 / 20, tpi: 20, tapDrillMm: 5.1 },
  { name: '5/16-18', standardType: 'UNC', diameterMm: 7.938, pitchMm: 25.4 / 18, tpi: 18, tapDrillMm: 6.6 },
  { name: '3/8-16', standardType: 'UNC', diameterMm: 9.525, pitchMm: 25.4 / 16, tpi: 16, tapDrillMm: 8.0 },
  { name: '7/16-14', standardType: 'UNC', diameterMm: 11.112, pitchMm: 25.4 / 14, tpi: 14, tapDrillMm: 9.4 },
  { name: '1/2-13', standardType: 'UNC', diameterMm: 12.700, pitchMm: 25.4 / 13, tpi: 13, tapDrillMm: 10.8 },
  { name: '5/8-11', standardType: 'UNC', diameterMm: 15.875, pitchMm: 25.4 / 11, tpi: 11, tapDrillMm: 13.5 },
  { name: '3/4-10', standardType: 'UNC', diameterMm: 19.050, pitchMm: 25.4 / 10, tpi: 10, tapDrillMm: 16.5 },
  { name: '7/8-9', standardType: 'UNC', diameterMm: 22.225, pitchMm: 25.4 / 9, tpi: 9, tapDrillMm: 19.5 },
  { name: '1-8', standardType: 'UNC', diameterMm: 25.400, pitchMm: 25.4 / 8, tpi: 8, tapDrillMm: 22.25 },

  // ── Unified Fine (UNF - ASME B1.1) ──
  { name: '#10-32', standardType: 'UNF', diameterMm: 4.826, pitchMm: 25.4 / 32, tpi: 32, tapDrillMm: 4.1 },
  { name: '1/4-28', standardType: 'UNF', diameterMm: 6.350, pitchMm: 25.4 / 28, tpi: 28, tapDrillMm: 5.5 },
  { name: '5/16-24', standardType: 'UNF', diameterMm: 7.938, pitchMm: 25.4 / 24, tpi: 24, tapDrillMm: 6.9 },
  { name: '3/8-24', standardType: 'UNF', diameterMm: 9.525, pitchMm: 25.4 / 24, tpi: 24, tapDrillMm: 8.5 },
  { name: '7/16-20', standardType: 'UNF', diameterMm: 11.112, pitchMm: 25.4 / 20, tpi: 20, tapDrillMm: 9.9 },
  { name: '1/2-20', standardType: 'UNF', diameterMm: 12.700, pitchMm: 25.4 / 20, tpi: 20, tapDrillMm: 11.5 },
  { name: '5/8-18', standardType: 'UNF', diameterMm: 15.875, pitchMm: 25.4 / 18, tpi: 18, tapDrillMm: 14.5 },
  { name: '3/4-16', standardType: 'UNF', diameterMm: 19.050, pitchMm: 25.4 / 16, tpi: 16, tapDrillMm: 17.5 },
  { name: '1-12', standardType: 'UNF', diameterMm: 25.400, pitchMm: 25.4 / 12, tpi: 12, tapDrillMm: 23.25 },

  // ── Unified Extra Fine (UNEF - ASME B1.1) ──
  { name: '1/4-32', standardType: 'UNEF', diameterMm: 6.350, pitchMm: 25.4 / 32, tpi: 32, tapDrillMm: 5.6 },
  { name: '5/16-32', standardType: 'UNEF', diameterMm: 7.938, pitchMm: 25.4 / 32, tpi: 32, tapDrillMm: 7.1 },
  { name: '3/8-32', standardType: 'UNEF', diameterMm: 9.525, pitchMm: 25.4 / 32, tpi: 32, tapDrillMm: 8.7 },
  { name: '7/16-28', standardType: 'UNEF', diameterMm: 11.112, pitchMm: 25.4 / 28, tpi: 28, tapDrillMm: 10.2 },
  { name: '1/2-28', standardType: 'UNEF', diameterMm: 12.700, pitchMm: 25.4 / 28, tpi: 28, tapDrillMm: 11.8 },
  { name: '9/16-24', standardType: 'UNEF', diameterMm: 14.288, pitchMm: 25.4 / 24, tpi: 24, tapDrillMm: 13.2 },
  { name: '5/8-24', standardType: 'UNEF', diameterMm: 15.875, pitchMm: 25.4 / 24, tpi: 24, tapDrillMm: 14.8 },
  { name: '3/4-20', standardType: 'UNEF', diameterMm: 19.050, pitchMm: 25.4 / 20, tpi: 20, tapDrillMm: 17.8 },

  // ── British Standard Whitworth (BSW - BS 84) ──
  { name: 'W 1/8', standardType: 'BSW', diameterMm: 3.175, pitchMm: 25.4 / 40, tpi: 40, tapDrillMm: 2.5 },
  { name: 'W 3/16', standardType: 'BSW', diameterMm: 4.762, pitchMm: 25.4 / 24, tpi: 24, tapDrillMm: 3.7 },
  { name: 'W 1/4', standardType: 'BSW', diameterMm: 6.350, pitchMm: 25.4 / 20, tpi: 20, tapDrillMm: 5.1 },
  { name: 'W 5/16', standardType: 'BSW', diameterMm: 7.938, pitchMm: 25.4 / 18, tpi: 18, tapDrillMm: 6.5 },
  { name: 'W 3/8', standardType: 'BSW', diameterMm: 9.525, pitchMm: 25.4 / 16, tpi: 16, tapDrillMm: 7.9 },
  { name: 'W 1/2', standardType: 'BSW', diameterMm: 12.700, pitchMm: 25.4 / 12, tpi: 12, tapDrillMm: 10.5 },
  { name: 'W 5/8', standardType: 'BSW', diameterMm: 15.875, pitchMm: 25.4 / 11, tpi: 11, tapDrillMm: 13.5 },
  { name: 'W 3/4', standardType: 'BSW', diameterMm: 19.050, pitchMm: 25.4 / 10, tpi: 10, tapDrillMm: 16.5 },
  { name: 'W 1', standardType: 'BSW', diameterMm: 25.400, pitchMm: 25.4 / 8, tpi: 8, tapDrillMm: 22.0 },

  // ── British Standard Fine (BSF - BS 84) ──
  { name: 'BSF 3/16', standardType: 'BSF', diameterMm: 4.762, pitchMm: 25.4 / 32, tpi: 32, tapDrillMm: 4.0 },
  { name: 'BSF 1/4', standardType: 'BSF', diameterMm: 6.350, pitchMm: 25.4 / 26, tpi: 26, tapDrillMm: 5.3 },
  { name: 'BSF 5/16', standardType: 'BSF', diameterMm: 7.938, pitchMm: 25.4 / 22, tpi: 22, tapDrillMm: 6.8 },
  { name: 'BSF 3/8', standardType: 'BSF', diameterMm: 9.525, pitchMm: 25.4 / 20, tpi: 20, tapDrillMm: 8.3 },
  { name: 'BSF 1/2', standardType: 'BSF', diameterMm: 12.700, pitchMm: 25.4 / 16, tpi: 16, tapDrillMm: 11.1 },
  { name: 'BSF 5/8', standardType: 'BSF', diameterMm: 15.875, pitchMm: 25.4 / 14, tpi: 14, tapDrillMm: 14.0 },
  { name: 'BSF 3/4', standardType: 'BSF', diameterMm: 19.050, pitchMm: 25.4 / 12, tpi: 12, tapDrillMm: 16.8 },
  { name: 'BSF 1', standardType: 'BSF', diameterMm: 25.400, pitchMm: 25.4 / 10, tpi: 10, tapDrillMm: 22.8 },

  // ── British Standard Tapered Pipe (BSPT / R - ISO 7-1) ──
  { name: 'R 1/16', standardType: 'BSPT', diameterMm: 7.723, pitchMm: 25.4 / 28, tpi: 28, tapDrillMm: 6.5 },
  { name: 'R 1/8', standardType: 'BSPT', diameterMm: 9.728, pitchMm: 25.4 / 28, tpi: 28, tapDrillMm: 8.2 },
  { name: 'R 1/4', standardType: 'BSPT', diameterMm: 13.157, pitchMm: 25.4 / 19, tpi: 19, tapDrillMm: 11.1 },
  { name: 'R 3/8', standardType: 'BSPT', diameterMm: 16.662, pitchMm: 25.4 / 19, tpi: 19, tapDrillMm: 14.5 },
  { name: 'R 1/2', standardType: 'BSPT', diameterMm: 20.955, pitchMm: 25.4 / 14, tpi: 14, tapDrillMm: 18.0 },
  { name: 'R 3/4', standardType: 'BSPT', diameterMm: 26.441, pitchMm: 25.4 / 14, tpi: 14, tapDrillMm: 23.5 },
  { name: 'R 1', standardType: 'BSPT', diameterMm: 33.249, pitchMm: 25.4 / 11, tpi: 11, tapDrillMm: 29.5 },
  { name: 'R 1 1/4', standardType: 'BSPT', diameterMm: 41.910, pitchMm: 25.4 / 11, tpi: 11, tapDrillMm: 38.0 },
  { name: 'R 1 1/2', standardType: 'BSPT', diameterMm: 47.803, pitchMm: 25.4 / 11, tpi: 11, tapDrillMm: 44.0 },
  { name: 'R 2', standardType: 'BSPT', diameterMm: 59.614, pitchMm: 25.4 / 11, tpi: 11, tapDrillMm: 55.5 },

  // ── Dryseal American Taper Pipe (NPTF - ASME B1.20.3) ──
  { name: '1/16 NPTF', standardType: 'NPTF', diameterMm: 7.950, pitchMm: 25.4 / 27, tpi: 27, tapDrillMm: 6.1 },
  { name: '1/8 NPTF', standardType: 'NPTF', diameterMm: 10.287, pitchMm: 25.4 / 27, tpi: 27, tapDrillMm: 8.4 },
  { name: '1/4 NPTF', standardType: 'NPTF', diameterMm: 13.716, pitchMm: 25.4 / 18, tpi: 18, tapDrillMm: 11.0 },
  { name: '3/8 NPTF', standardType: 'NPTF', diameterMm: 17.145, pitchMm: 25.4 / 18, tpi: 18, tapDrillMm: 14.5 },
  { name: '1/2 NPTF', standardType: 'NPTF', diameterMm: 21.336, pitchMm: 25.4 / 14, tpi: 14, tapDrillMm: 17.8 },
  { name: '3/4 NPTF', standardType: 'NPTF', diameterMm: 26.670, pitchMm: 25.4 / 14, tpi: 14, tapDrillMm: 23.0 },
  { name: '1 NPTF', standardType: 'NPTF', diameterMm: 33.401, pitchMm: 25.4 / 11.5, tpi: 11.5, tapDrillMm: 29.0 },

  // ── Straight Mechanical Pipe (NPSM - ASME B1.20.1 Table 8 / Machining Doctor) ──
  { name: '1/8 NPSM', standardType: 'NPSM', diameterMm: 10.084, pitchMm: 25.4 / 27, tpi: 27, tapDrillMm: 9.1, maxHoleMm: 9.25, internalMinMaxMm: [9.09, 9.25], externalMinMaxMm: [9.91, 10.08] },
  { name: '1/4 NPSM', standardType: 'NPSM', diameterMm: 13.360, pitchMm: 25.4 / 18, tpi: 18, tapDrillMm: 11.9, maxHoleMm: 12.22, internalMinMaxMm: [11.89, 12.22], externalMinMaxMm: [13.13, 13.36] },
  { name: '3/8 NPSM', standardType: 'NPSM', diameterMm: 16.815, pitchMm: 25.4 / 18, tpi: 18, tapDrillMm: 15.3, maxHoleMm: 15.55, internalMinMaxMm: [15.32, 15.55], externalMinMaxMm: [16.59, 16.82] },
  { name: '1/2 NPSM', standardType: 'NPSM', diameterMm: 20.904, pitchMm: 25.4 / 14, tpi: 14, tapDrillMm: 19.0, maxHoleMm: 19.28, internalMinMaxMm: [18.97, 19.28], externalMinMaxMm: [20.65, 20.90] },
  { name: '3/4 NPSM', standardType: 'NPSM', diameterMm: 26.264, pitchMm: 25.4 / 14, tpi: 14, tapDrillMm: 24.3, maxHoleMm: 24.64, internalMinMaxMm: [24.33, 24.64], externalMinMaxMm: [26.01, 26.26] },
  { name: '1 NPSM', standardType: 'NPSM', diameterMm: 32.842, pitchMm: 25.4 / 11.5, tpi: 11.5, tapDrillMm: 30.5, maxHoleMm: 30.76, internalMinMaxMm: [30.51, 30.76], externalMinMaxMm: [32.54, 32.84] },
  { name: '1-1/4 NPSM', standardType: 'NPSM', diameterMm: 41.605, pitchMm: 25.4 / 11.5, tpi: 11.5, tapDrillMm: 39.3, maxHoleMm: 39.57, internalMinMaxMm: [39.27, 39.57], externalMinMaxMm: [41.30, 41.61] },
  { name: '1-1/2 NPSM', standardType: 'NPSM', diameterMm: 47.676, pitchMm: 25.4 / 11.5, tpi: 11.5, tapDrillMm: 45.0, maxHoleMm: 45.34, internalMinMaxMm: [45.03, 45.34], externalMinMaxMm: [47.37, 47.68] },
  { name: '2 NPSM', standardType: 'NPSM', diameterMm: 59.715, pitchMm: 25.4 / 11.5, tpi: 11.5, tapDrillMm: 57.4, maxHoleMm: 57.68, internalMinMaxMm: [57.38, 57.68], externalMinMaxMm: [59.41, 59.72] },
  { name: '2-1/2 NPSM', standardType: 'NPSM', diameterMm: 72.161, pitchMm: 25.4 / 8, tpi: 8, tapDrillMm: 68.8, maxHoleMm: 69.10, internalMinMaxMm: [68.73, 69.09], externalMinMaxMm: [71.68, 72.16] },
  { name: '3 NPSM', standardType: 'NPSM', diameterMm: 88.062, pitchMm: 25.4 / 8, tpi: 8, tapDrillMm: 84.7, maxHoleMm: 85.00, internalMinMaxMm: [84.63, 85.01], externalMinMaxMm: [87.58, 88.06] },
  { name: '4 NPSM', standardType: 'NPSM', diameterMm: 113.436, pitchMm: 25.4 / 8, tpi: 8, tapDrillMm: 110.1, maxHoleMm: 110.40, internalMinMaxMm: [110.03, 110.41], externalMinMaxMm: [112.95, 113.44] },

  // ── Metric Buttress (S - DIN 513) ──
  { name: 'S 16x4', standardType: 'S', diameterMm: 16, pitchMm: 4, tapDrillMm: 12.0 },
  { name: 'S 20x5', standardType: 'S', diameterMm: 20, pitchMm: 5, tapDrillMm: 15.0 },
  { name: 'S 24x5', standardType: 'S', diameterMm: 24, pitchMm: 5, tapDrillMm: 19.0 },
  { name: 'S 32x6', standardType: 'S', diameterMm: 32, pitchMm: 6, tapDrillMm: 26.0 },
  { name: 'S 40x7', standardType: 'S', diameterMm: 40, pitchMm: 7, tapDrillMm: 33.0 },

  // ── Square Thread ──
  { name: 'Sq 16x4', standardType: 'Sq', diameterMm: 16, pitchMm: 4, tapDrillMm: 12.0 },
  { name: 'Sq 20x5', standardType: 'Sq', diameterMm: 20, pitchMm: 5, tapDrillMm: 15.0 },
  { name: 'Sq 24x6', standardType: 'Sq', diameterMm: 24, pitchMm: 6, tapDrillMm: 18.0 },
  { name: 'Sq 32x6', standardType: 'Sq', diameterMm: 32, pitchMm: 6, tapDrillMm: 26.0 },

  // ── Round Knuckle (Rd - DIN 405) ──
  { name: 'Rd 12', standardType: 'Rd', diameterMm: 12, pitchMm: 2.54, tapDrillMm: 9.5 },
  { name: 'Rd 16', standardType: 'Rd', diameterMm: 16, pitchMm: 2.54, tapDrillMm: 13.5 },
  { name: 'Rd 20', standardType: 'Rd', diameterMm: 20, pitchMm: 2.54, tapDrillMm: 17.5 },
  { name: 'Rd 24', standardType: 'Rd', diameterMm: 24, pitchMm: 3.175, tapDrillMm: 20.8 },
  { name: 'Rd 30', standardType: 'Rd', diameterMm: 30, pitchMm: 3.175, tapDrillMm: 26.8 },
];

export function getSizesForType(type: string): StandardThreadSize[] {
  return STANDARD_THREAD_SIZES.filter((s) => s.standardType === type);
}

export type ThreadProfile = {
  kind: ThreadProfileKind;
  type: ThreadTypeCode;
  angleDeg: number;
  angleLabel: string;
  P: number;
  d: number;
  /** Pitch diameter d2 / E. */
  d2: number;
  /** Internal basic minor D1 (catalog `minorDia`). */
  d1: number;
  /** External root d3 when the family distinguishes it. */
  d3: number;
  /** Engagement / useful height. */
  h1: number;
  tapDrill: number;
  maxHoleDia?: number;
  stressArea: number;
  isTapered: boolean;
  taper: number;
  taperLabel?: string;
  sealingCategory: SealingCategory;
  sealingNote: string;
  standardCode: string;
  formulaLatex: string;
  notes: string[];
};

const SQRT3 = Math.sqrt(3);
const PI4 = Math.PI / 4;

/** ISO 68-1 / ASME B1.1 60° V. */
export const ISO60 = {
  H_over_P: SQRT3 / 2,
  k_d2: 0.649519052838,
  k_D1: 1.08253175473,
  k_d3: 1.22686932156,
  k_As: 0.9382,
  angleDeg: 60,
};

/** BS 84 Whitworth: rounded 55°. h = 0.640327 P, r = 0.137329 P. */
export const WHITWORTH = {
  h_over_P: 0.640327,
  r_over_P: 0.137329,
  angleDeg: 55,
};

/** ASME B1.20.1 truncated 60°; height 0.8 P; taper 1:16 on diameter. */
export const NPT = {
  h_over_P: 0.8,
  H_over_P: SQRT3 / 2,
  trunc_over_P: 0.033,
  taper: 1 / 16,
  angleDeg: 60,
};

export function kindOf(type: string): ThreadProfileKind {
  const t = String(type || 'M');
  if (['W', 'BSW', 'BSF', 'G', 'BSPP', 'R', 'BSPT', 'Rp', 'Rc', 'BSB', 'BA', 'W_GAS'].includes(t)) return 'whitworth';
  if (['NPT', 'NPTF', 'NPTR'].includes(t)) return 'npt';
  if (['NPS', 'NPSM', 'NPSC', 'NPSL', 'NPSH', 'NPSF'].includes(t)) return 'nps';
  if (t === 'JIC') return 'jic';
  if (t === 'SAE') return 'sae_orb';
  if (t === 'ORFS') return 'orfs';
  if (t === 'Tr') return 'tr';
  if (t === 'Acme' || t === 'ACME') return 'acme';
  if (t === 'AcmeStub') return 'acme_stub';
  if (t === 'S') return 'buttress';
  if (t === 'Sq' || t === 'Square') return 'square';
  if (t === 'Rd') return 'round';
  if (t === 'Pg') return 'pg';
  if (t === 'Edison') return 'edison';
  if (t === 'Vg' || t === 'Ven') return 'valve';
  if (t === 'NC') return 'conduit';
  return 'iso60';
}

export function isImperialType(type: string): boolean {
  return [
    'UNC', 'UNF', 'UNEF', 'UN', 'UNS',
    'W', 'BSW', 'BSF', 'G', 'BSPP', 'R', 'BSPT', 'Rp', 'Rc',
    'NPT', 'NPTF', 'NPS', 'NPSM', 'NPSC', 'NPSL', 'NPTR',
    'JIC', 'SAE', 'ORFS'
  ].includes(type);
}

function r3(n: number) { return Math.round(n * 1000) / 1000; }
function r2(n: number) { return Math.round(n * 100) / 100; }
function r1(n: number) { return Math.round(n * 10) / 10; }

function asFromMean(a: number, b: number) {
  const m = (a + b) / 2;
  return PI4 * m * m;
}

function isoAs(d: number, P: number) {
  return PI4 * Math.pow(d - ISO60.k_As * P, 2);
}

/** ASME B1.1 tensile stress area, D in inches, n = TPI. Returns mm². */
export function unStressAreaMm2(dInch: number, tpi: number): number {
  const AsIn2 = 0.7854 * Math.pow(dInch - 0.9743 / tpi, 2);
  return AsIn2 * 645.16;
}

export function pitchMmFromTpi(tpi: number): number {
  return tpi > 0 ? MM_PER_IN / tpi : 0;
}

export function trapezoidalClearance(P: number): number {
  return P >= 6 ? 0.5 : 0.25;
}

export function computeThreadProfile(
  type: string,
  d: number,
  P: number,
): ThreadProfile {
  const kind = kindOf(type);
  const code = (type as ThreadTypeCode) || 'M';
  const notes: string[] = [];
  let angleDeg = 60;
  let angleLabel = '60°';
  let dOut = d;
  let d2 = 0;
  let d1 = 0;
  let d3 = 0;
  let h1 = 0;
  let tapDrill = 0;
  let maxHoleDia: number | undefined;
  let stressArea = 0;
  let isTapered = false;
  let taper = 0;
  let taperLabel: string | undefined;
  let sealingCategory: SealingCategory = 'parallel_gasket';
  let sealingNote = 'Requires mechanical washer, bonded seal, or O-ring.';
  let standardCode = 'ISO 68-1';
  let formulaLatex = 'd_2 = d - 0.6495 P';

  // Check matching standard in options
  const opt = THREAD_TYPE_OPTIONS.find((o) => o.value === code);
  if (opt) {
    standardCode = opt.standard;
    sealingCategory = opt.sealingCategory;
  }

  // Exact tabulated match check from Inpart24 database / ASME B1.20.1
  const catalogMatch = STANDARD_THREAD_SIZES.find(
    (s) => s.standardType === code &&
      (Math.abs(s.diameterMm - d) < (code === 'NPSM' ? 1.4 : 0.25) || (s.externalMinMaxMm && d >= s.externalMinMaxMm[0] - 0.2 && d <= s.externalMinMaxMm[1] + 1.2)) &&
      Math.abs(s.pitchMm - P) < 0.1
  );
  if (catalogMatch?.maxHoleMm) {
    maxHoleDia = catalogMatch.maxHoleMm;
  }

  if (kind === 'iso60' || kind === 'jic' || kind === 'sae_orb' || kind === 'orfs') {
    d2 = d - ISO60.k_d2 * P;
    d1 = d - ISO60.k_D1 * P;
    d3 = d - ISO60.k_d3 * P;
    h1 = (5 / 8) * ISO60.H_over_P * P;
    tapDrill = Math.max(d - P, 0);
    stressArea = isoAs(d, P);
    angleDeg = 60;
    angleLabel = '60°';
    formulaLatex = 'd_2 = d - 0.64952 P,\\; d_1 = d - 1.08253 P';

    if (kind === 'jic') {
      sealingCategory = 'cone_37';
      sealingNote = 'SAE J514 37° machined cone metal-to-metal high-pressure seal (up to 10,000 PSI).';
      notes.push('JIC fittings use Unified 60° threads with a 37° flared seat on the nose.');
    } else if (kind === 'sae_orb') {
      sealingCategory = 'face_seal_oring';
      sealingNote = 'Straight UN thread with O-ring boss port chamber.';
      notes.push('SAE J1926 O-ring Boss (ORB) provides zero-leak hydraulic sealing.');
    } else if (kind === 'orfs') {
      sealingCategory = 'face_seal_oring';
      sealingNote = 'Flat face with captive elastomeric O-ring seal.';
      notes.push('ORFS (SAE J1453) eliminates over-torquing and resists severe impulse.');
    } else {
      notes.push('ISO 68-1 / ASME B1.1 60° basic profile. minorDia is internal D1.');
    }
  } else if (kind === 'whitworth') {
    const h = WHITWORTH.h_over_P * P;
    d2 = d - h;
    d1 = d - 2 * h;
    d3 = d1;
    h1 = h;
    tapDrill = catalogMatch?.tapDrillMm ?? Math.max(d - P, 0);
    stressArea = asFromMean(d2, d1);
    angleDeg = 55;
    angleLabel = '55°';
    isTapered = code === 'BSPT' || code === 'R' || code === 'Rc';
    taper = isTapered ? 1 / 16 : 0;
    taperLabel = isTapered ? '1:16 (1°47\')' : undefined;
    formulaLatex = 'h = 0.640327 P,\\; d_2 = d - h,\\; d_1 = d - 2h';
    notes.push('BS 84 / ISO 228 Whitworth 55° with rounded crest and root r = 0.137329 P.');
    if (code === 'G' || code === 'BSPP') {
      sealingCategory = 'parallel_gasket';
      sealingNote = 'Parallel pipe thread (ISO 228). Must use a sealing washer, O-ring, or copper gasket.';
    } else if (isTapered) {
      sealingCategory = 'taper_compound';
      sealingNote = 'Tapered Whitworth thread (1:16). Mating requires PTFE tape or anaerobic sealant.';
      notes.push('ISO 7-1 BSPT taper 1:16 on diameter.');
    } else if (code === 'Rp') {
      sealingCategory = 'taper_compound';
      sealingNote = 'Parallel internal Whitworth thread designed to seal with tapered R male threads.';
    }
  } else if (kind === 'npt') {
    const h = NPT.h_over_P * P;
    d2 = d - h;
    d1 = d - 2 * h;
    d3 = d1;
    h1 = h;
    tapDrill = catalogMatch?.tapDrillMm ?? Math.max(d - 1.1 * P, 0);
    stressArea = asFromMean(d2, d1);
    angleDeg = 60;
    isTapered = true;
    taper = NPT.taper;
    taperLabel = '1:16 (1°47\')';
    angleLabel = '60° + 1:16';
    formulaLatex = 'h = 0.8 P,\\; E = d - h \\; (1{:}16\\;\\mathrm{taper})';
    notes.push('ASME B1.20.1 truncated 60° pipe thread. Diameters at the gauge plane.');
    if (code === 'NPTF') {
      sealingCategory = 'dryseal';
      sealingNote = 'Dryseal (ASME B1.20.3). Crests crush into roots to prevent leakage without PTFE.';
      notes.push('NPTF dryseal: crest/root interference; same pitch table as NPT.');
    } else {
      sealingCategory = 'taper_compound';
      sealingNote = 'Tapered pipe thread. Requires thread tape or pipe sealant.';
    }
  } else if (kind === 'nps') {
    const threadMajor = catalogMatch?.externalMinMaxMm ? catalogMatch.externalMinMaxMm[1] : (catalogMatch?.diameterMm ?? d);
    dOut = threadMajor;
    const h = 0.8 * P;
    d2 = threadMajor - ISO60.k_d2 * P;
    d1 = threadMajor - ISO60.k_D1 * P;
    d3 = threadMajor - 2 * h;
    h1 = h;
    tapDrill = catalogMatch?.tapDrillMm ?? Math.max(d1, 0);
    stressArea = asFromMean(d2, d1);
    angleDeg = 60;
    angleLabel = '60° (cylindrical)';
    isTapered = false;
    sealingCategory = 'parallel_gasket';
    sealingNote = 'American cylindrical pipe thread (ASME B1.20.1). Requires sealing washer or packing.';
    formulaLatex = 'h = 0.8 P,\\; d_2 = d - 0.6495 P,\\; D_1 = d - 1.0825 P';
    notes.push('NPSM / NPS: Free-fitting mechanical joint per ASME B1.20.1 Table 8. Thread major is cut below pipe OD.');
  } else if (kind === 'tr') {
    const ac = trapezoidalClearance(P);
    d2 = d - 0.5 * P;
    d1 = d - P - 2 * ac;
    d3 = d1;
    h1 = 0.5 * P;
    tapDrill = catalogMatch?.tapDrillMm ?? Math.max(d - P + 0.2, 0);
    stressArea = asFromMean(d2, d1);
    angleDeg = 30;
    angleLabel = '30°';
    sealingCategory = 'power_transmission';
    sealingNote = 'Power transmission leadscrew. High bidirectional axial thrust capacity.';
    formulaLatex = 'H_1 = 0.5 P,\\; d_2 = d - 0.5 P,\\; d_3 = d - P - 2 a_c';
    notes.push('ISO 2901 / DIN 103 trapezoidal. Power screw, not a fastener thread.');
  } else if (kind === 'acme') {
    d2 = d - 0.5 * P;
    d1 = d - P;
    d3 = d1;
    h1 = 0.5 * P;
    tapDrill = catalogMatch?.tapDrillMm ?? Math.max(d - P, 0);
    stressArea = asFromMean(d2, d1);
    angleDeg = 29;
    angleLabel = '29°';
    sealingCategory = 'power_transmission';
    sealingNote = 'General purpose power screw (ASME B1.5). High load, smooth actuation.';
    formulaLatex = 'h = 0.5 P,\\; d_2 = d - 0.5 P \\; (29^\\circ\\;\\mathrm{ACME})';
    notes.push('ASME B1.5 general-purpose ACME basic height 0.5P.');
  } else if (kind === 'acme_stub') {
    d2 = d - 0.3 * P;
    d1 = d - 0.6 * P;
    d3 = d1;
    h1 = 0.3 * P;
    tapDrill = Math.max(d - 0.6 * P, 0);
    stressArea = asFromMean(d2, d1);
    angleDeg = 29;
    angleLabel = '29° (stub)';
    sealingCategory = 'power_transmission';
    sealingNote = 'Shallow depth power screw (ASME B1.8) for thin-walled sections.';
    formulaLatex = 'h = 0.3 P,\\; d_2 = d - 0.3 P';
    notes.push('ASME B1.8 Stub ACME: shallower thread depth for compact mechanisms.');
  } else if (kind === 'buttress') {
    d2 = d - 0.6 * P;
    d1 = d - 1.2 * P;
    d3 = d1;
    h1 = 0.6 * P;
    tapDrill = Math.max(d - 1.2 * P, 0);
    stressArea = asFromMean(d2, d1);
    angleDeg = 45;
    angleLabel = '7° / 45°';
    sealingCategory = 'power_transmission';
    sealingNote = 'Unidirectional high-thrust screw (presses, gun breeches, heavy jacks).';
    formulaLatex = 'h = 0.6 P,\\; 7^\\circ/45^\\circ\\;\\mathrm{buttress}';
    notes.push('ASME B1.9 / DIN 513 sawtooth: 7° load flank, 45° clearance flank.');
  } else if (kind === 'square') {
    d2 = d - 0.5 * P;
    d1 = d - P;
    d3 = d1;
    h1 = 0.5 * P;
    tapDrill = Math.max(d - P, 0);
    stressArea = asFromMean(d2, d1);
    angleDeg = 0;
    angleLabel = '0° (square)';
    sealingCategory = 'power_transmission';
    sealingNote = 'Theoretical highest mechanical efficiency; zero radial bursting force.';
    formulaLatex = 'h = 0.5 P,\\; d_2 = d - 0.5 P';
    notes.push('Square thread: vertical flanks, highest efficiency power screw, difficult to machine.');
  } else if (kind === 'pg') {
    const H = P / (2 * Math.tan((40 * Math.PI) / 180));
    h1 = 0.5 * H;
    d2 = d - 0.6 * P;
    d1 = d - 1.19175 * P;
    d3 = d1;
    tapDrill = catalogMatch?.tapDrillMm ?? Math.max(d - 1.2 * P, 0);
    stressArea = asFromMean(d2, d1);
    angleDeg = 80;
    angleLabel = '80° (Pg)';
    sealingCategory = 'cable_gland';
    sealingNote = 'Electrical conduit & cable glands (DIN 40430). IP68 with rubber compression grommet.';
    formulaLatex = '\\alpha = 80^\\circ,\\; H = 0.5959 P,\\; d_1 = d - 1.192 P';
    notes.push('DIN 40430 Panzergewinde: 80° angle creates shallow depth for thin sheet metal cabinets.');
  } else if (kind === 'edison') {
    d2 = d - 0.5 * P;
    d1 = d - P;
    d3 = d1;
    h1 = 0.5 * P;
    tapDrill = catalogMatch?.tapDrillMm ?? Math.max(d - P, 0);
    stressArea = asFromMean(d2, d1);
    angleDeg = 0;
    angleLabel = 'Round Wave';
    sealingCategory = 'dirt_tolerant';
    sealingNote = 'Electrical lamp socket screw thread (IEC 60061).';
    formulaLatex = 'h = 0.5 P,\\; \\mathrm{sinusoidal\\;rolled\\;sheet}';
    notes.push('Edison thread: continuous rounded wave without sharp edges, cold-formed in brass/aluminum.');
  } else if (kind === 'valve') {
    d2 = d - 0.64952 * P;
    d1 = d - 1.08253 * P;
    d3 = d1;
    h1 = 0.54127 * P;
    tapDrill = catalogMatch?.tapDrillMm ?? Math.max(d - P, 0);
    stressArea = isoAs(d, P);
    angleDeg = 60;
    angleLabel = '60° (Vg)';
    sealingCategory = 'pneumatic_valve';
    sealingNote = 'Pneumatic tire valve stem thread (DIN 7756). Seals with internal Schrader core.';
    formulaLatex = 'd_2 = d - 0.6495 P \\; (\\mathrm{DIN}\\,7756)';
    notes.push('DIN 7756 tire valve thread: Vg 8 is the worldwide standard 8V1 passenger car valve.');
  } else if (kind === 'gas_w') {
    const h = WHITWORTH.h_over_P * P;
    d2 = d - h;
    d1 = d - 2 * h;
    d3 = d1;
    h1 = h;
    tapDrill = catalogMatch?.tapDrillMm ?? Math.max(d - 1.8 * P, 0);
    stressArea = asFromMean(d2, d1);
    angleDeg = 55;
    angleLabel = '55° (W)';
    isTapered = true;
    taper = 3 / 25;
    taperLabel = '3:25 taper';
    sealingCategory = 'gas_cylinder';
    sealingNote = 'High-pressure gas cylinder valve (DIN 477). Heavy taper with lead/PTFE washer.';
    formulaLatex = '\\alpha = 55^\\circ,\\; \\mathrm{taper\\;3{:}25}';
    notes.push('DIN 477-1: specialized taper thread engineered for 200-300 bar compressed gas valves.');
  } else {
    d2 = d - 0.5 * P;
    d1 = d - P;
    d3 = d1;
    h1 = 0.5 * P;
    tapDrill = catalogMatch?.tapDrillMm ?? Math.max(d - P, 0);
    stressArea = asFromMean(d2, d1);
    angleDeg = 30;
    angleLabel = 'Rd 30°';
    sealingCategory = 'dirt_tolerant';
    sealingNote = 'Heavy-duty knuckle thread for abrasive environments (railway couplers, mining).';
    formulaLatex = 'h = 0.5 P,\\; r = 0.23851 P \\; (\\mathrm{DIN}\\,405)';
    notes.push('DIN 405 knuckle/round thread: circular semicircles prevent jamming by sand or debris.');
  }

  return {
    kind,
    type: code,
    angleDeg,
    angleLabel,
    P,
    d: dOut,
    d2,
    d1,
    d3,
    h1,
    tapDrill,
    maxHoleDia,
    stressArea,
    isTapered,
    taper,
    taperLabel,
    sealingCategory,
    sealingNote,
    standardCode,
    formulaLatex,
    notes,
  };
}

export function roundedCatalogRow(profile: ThreadProfile): {
  majorDia: number;
  minorDia: number;
  pitchDia: number;
  tapDrill: number;
  stressArea: number;
} {
  return {
    majorDia: r3(profile.d),
    minorDia: r3(profile.d1),
    pitchDia: r3(profile.d2),
    tapDrill: r2(profile.tapDrill),
    stressArea: r1(profile.stressArea) >= 100 ? r1(profile.stressArea) : r2(profile.stressArea),
  };
}

/** Preferred coarse pitch (ISO 262) for a metric diameter. */
export const METRIC_COARSE_PITCH: Record<number, number> = {
  1.6: 0.35, 2: 0.4, 2.5: 0.45, 3: 0.5, 3.5: 0.6, 4: 0.7, 5: 0.8, 6: 1,
  8: 1.25, 10: 1.5, 12: 1.75, 14: 2, 16: 2, 18: 2.5, 20: 2.5, 22: 2.5,
  24: 3, 27: 3, 30: 3.5, 33: 3.5, 36: 4, 39: 4, 42: 4.5, 45: 4.5, 48: 5,
  52: 5, 56: 5.5, 64: 6,
};

export const METRIC_FINE_PITCH: Record<number, number> = {
  3: 0.35, 4: 0.5, 5: 0.5, 6: 0.75, 8: 1, 10: 1.25, 12: 1.5, 14: 1.5,
  16: 1.5, 18: 1.5, 20: 1.5, 22: 1.5, 24: 2, 27: 2, 30: 2, 33: 2, 36: 3,
  39: 3, 42: 3, 45: 3, 48: 3, 52: 3, 56: 4, 64: 4,
};

export function defaultPitchMm(type: string, d: number): number | null {
  const kind = kindOf(type);
  if (type === 'MF') return METRIC_FINE_PITCH[d] ?? METRIC_FINE_PITCH[Math.round(d)] ?? null;
  if (kind === 'iso60' && (type === 'M' || type === 'UN')) {
    return METRIC_COARSE_PITCH[d] ?? METRIC_COARSE_PITCH[Math.round(d)] ?? null;
  }
  if (kind === 'tr') {
    if (d <= 10) return 2;
    if (d <= 14) return 3;
    if (d <= 20) return 4;
    if (d <= 28) return 5;
    if (d <= 36) return 6;
    if (d <= 44) return 7;
    return 8;
  }
  return null;
}

// ---------------------------------------------------------------------------
// SVG basic-profile path (2 pitches). y increases downward. Crest at yCrest.
// ---------------------------------------------------------------------------

export type ProfilePt = { x: number; y: number };

function closeBody(pts: ProfilePt[], hBox: number): string {
  if (!pts.length) return '';
  const last = pts[pts.length - 1];
  const first = pts[0];
  const body = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  return `${body} L${last.x.toFixed(2)},${hBox} L${first.x.toFixed(2)},${hBox} Z`;
}

function closeOpen(open: string, x0: number, x1: number, hBox: number): string {
  return `${open} L${x1.toFixed(2)},${hBox} L${x0.toFixed(2)},${hBox} Z`;
}

/** Whitworth 55° with real crest/root radii (BS 84 / ISO 228). */
function whitworthArcOpen(p: number, yCrest: number, n: number): { d: string; x0: number; x1: number } {
  const h = WHITWORTH.h_over_P * p;
  const r = WHITWORTH.r_over_P * p;
  const a = (27.5 * Math.PI) / 180;
  const sa = Math.sin(a);
  const ca = Math.cos(a);
  const parts: string[] = [];
  let x0 = 0;
  let x1 = n * p;
  for (let i = 0; i < n; i++) {
    const cx = i * p;
    const tL = { x: cx - r * sa, y: yCrest + r * (1 - ca) };
    const tR = { x: cx + r * sa, y: yCrest + r * (1 - ca) };
    if (i === 0) {
      x0 = tL.x;
      parts.push(`M${tL.x.toFixed(2)},${tL.y.toFixed(2)}`);
    }
    parts.push(`A${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${tR.x.toFixed(2)} ${tR.y.toFixed(2)}`);
    const rx = i * p + p / 2;
    const rL = { x: rx - r * sa, y: yCrest + h - r * (1 - ca) };
    const rR = { x: rx + r * sa, y: yCrest + h - r * (1 - ca) };
    parts.push(`L${rL.x.toFixed(2)},${rL.y.toFixed(2)}`);
    parts.push(`A${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${rR.x.toFixed(2)} ${rR.y.toFixed(2)}`);
    if (i === n - 1) {
      const tEnd = { x: (i + 1) * p - r * sa, y: yCrest + r * (1 - ca) };
      parts.push(`L${tEnd.x.toFixed(2)},${tEnd.y.toFixed(2)}`);
      x1 = (i + 1) * p + r * sa;
      parts.push(`A${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${x1.toFixed(2)} ${(yCrest + r * (1 - ca)).toFixed(2)}`);
    }
  }
  return { d: parts.join(' '), x0, x1 };
}

function roundArcOpen(p: number, yCrest: number, n: number): { d: string; x0: number; x1: number } {
  const r = 0.23851 * p;
  const h = 0.5 * p;
  const parts: string[] = [`M0,${yCrest.toFixed(2)}`];
  for (let i = 0; i < n; i++) {
    const x1 = (i + 0.5) * p;
    const x2 = (i + 1) * p;
    parts.push(`A${r.toFixed(2)} ${h.toFixed(2)} 0 0 1 ${x1.toFixed(2)} ${(yCrest + h).toFixed(2)}`);
    parts.push(`A${r.toFixed(2)} ${h.toFixed(2)} 0 0 1 ${x2.toFixed(2)} ${yCrest.toFixed(2)}`);
  }
  return { d: parts.join(' '), x0: 0, x1: n * p };
}

function polylineOpen(pts: ProfilePt[]): { d: string; x0: number; x1: number } {
  if (!pts.length) return { d: '', x0: 0, x1: 0 };
  return {
    d: pts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(' '),
    x0: pts[0].x,
    x1: pts[pts.length - 1].x,
  };
}

export function threadProfileOpen(
  kind: ThreadProfileKind,
  p = 100,
  yCrest = 50,
  nPitches = 3,
): { d: string; x0: number; x1: number } {
  if (kind === 'whitworth' || kind === 'gas_w') return whitworthArcOpen(p, yCrest, nPitches);
  if (kind === 'round' || kind === 'edison') return roundArcOpen(p, yCrest, nPitches);
  return polylineOpen(threadProfilePoints(kind, p, yCrest, nPitches));
}

function iso60Points(p: number, yCrest: number, n: number): ProfilePt[] {
  const H = ISO60.H_over_P * p;
  const depth = (5 / 8) * H;
  const crest = p / 8;
  const root = p / 4;
  const flank = (p - crest - root) / 2;
  const pts: ProfilePt[] = [];
  for (let i = 0; i < n; i++) {
    const x = i * p;
    pts.push({ x: x, y: yCrest });
    pts.push({ x: x + crest, y: yCrest });
    pts.push({ x: x + crest + flank, y: yCrest + depth });
    pts.push({ x: x + crest + flank + root, y: yCrest + depth });
    pts.push({ x: x + p, y: yCrest });
  }
  return pts;
}

function whitworthPoints(p: number, yCrest: number, n: number): ProfilePt[] {
  const depth = WHITWORTH.h_over_P * p;
  const r = WHITWORTH.r_over_P * p;
  const pts: ProfilePt[] = [];
  for (let i = 0; i < n; i++) {
    const x = i * p;
    pts.push({ x, y: yCrest + r * 0.15 });
    pts.push({ x: x + p * 0.12, y: yCrest });
    pts.push({ x: x + p * 0.38, y: yCrest + depth });
    pts.push({ x: x + p * 0.62, y: yCrest + depth });
    pts.push({ x: x + p * 0.88, y: yCrest });
    pts.push({ x: x + p, y: yCrest + r * 0.15 });
  }
  return pts;
}

function nptPoints(p: number, yCrest: number, n: number): ProfilePt[] {
  const depth = NPT.h_over_P * p;
  const crest = 0.033 * p / Math.tan(Math.PI / 6);
  const root = crest;
  const flank = (p - crest - root) / 2;
  const pts: ProfilePt[] = [];
  for (let i = 0; i < n; i++) {
    const x = i * p;
    pts.push({ x, y: yCrest });
    pts.push({ x: x + crest, y: yCrest });
    pts.push({ x: x + crest + flank, y: yCrest + depth });
    pts.push({ x: x + crest + flank + root, y: yCrest + depth });
    pts.push({ x: x + p, y: yCrest });
  }
  return pts;
}

function trapPoints(p: number, yCrest: number, n: number, includedDeg: number, depthScale: number): ProfilePt[] {
  const depth = depthScale * p;
  const half = (includedDeg * Math.PI) / 360;
  const slope = depth * Math.tan(half);
  const top = Math.max(p * 0.2, p - 2 * slope);
  const pts: ProfilePt[] = [];
  for (let i = 0; i < n; i++) {
    const x = i * p;
    const crestL = (p - top) / 2;
    pts.push({ x, y: yCrest });
    pts.push({ x: x + Math.max(0, crestL - slope), y: yCrest });
    pts.push({ x: x + crestL, y: yCrest + depth });
    pts.push({ x: x + crestL + top, y: yCrest + depth });
    pts.push({ x: x + p - Math.max(0, crestL - slope), y: yCrest });
    pts.push({ x: x + p, y: yCrest });
  }
  return pts;
}

function buttressPoints(p: number, yCrest: number, n: number): ProfilePt[] {
  const depth = 0.6 * p;
  const load = depth * Math.tan((7 * Math.PI) / 180);
  const clear = depth * Math.tan((45 * Math.PI) / 180);
  const pts: ProfilePt[] = [];
  for (let i = 0; i < n; i++) {
    const x = i * p;
    pts.push({ x, y: yCrest });
    pts.push({ x: x + load, y: yCrest + depth });
    pts.push({ x: x + p - clear, y: yCrest + depth });
    pts.push({ x: x + p, y: yCrest });
  }
  return pts;
}

function squarePoints(p: number, yCrest: number, n: number): ProfilePt[] {
  const depth = 0.5 * p;
  const w = 0.5 * p;
  const pts: ProfilePt[] = [];
  for (let i = 0; i < n; i++) {
    const x = i * p;
    pts.push({ x, y: yCrest });
    pts.push({ x: x + w, y: yCrest });
    pts.push({ x: x + w, y: yCrest + depth });
    pts.push({ x: x + p, y: yCrest + depth });
    pts.push({ x: x + p, y: yCrest });
  }
  return pts;
}

function pgPoints(p: number, yCrest: number, n: number): ProfilePt[] {
  const depth = 0.5 * (p / (2 * Math.tan((40 * Math.PI) / 180)));
  const half = (40 * Math.PI) / 180;
  const slope = depth * Math.tan(half);
  const crest = p * 0.15;
  const root = p * 0.15;
  const flank = (p - crest - root) / 2;
  const pts: ProfilePt[] = [];
  for (let i = 0; i < n; i++) {
    const x = i * p;
    pts.push({ x, y: yCrest });
    pts.push({ x: x + crest, y: yCrest });
    pts.push({ x: x + crest + flank, y: yCrest + depth });
    pts.push({ x: x + crest + flank + root, y: yCrest + depth });
    pts.push({ x: x + p, y: yCrest });
  }
  return pts;
}

function roundPoints(p: number, yCrest: number, n: number): ProfilePt[] {
  const depth = 0.5 * p;
  const pts: ProfilePt[] = [];
  const steps = 8;
  for (let i = 0; i < n; i++) {
    const x0 = i * p;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = x0 + t * p;
      const y = yCrest + Math.sin(t * Math.PI) * depth;
      pts.push({ x, y });
    }
  }
  return pts;
}

export function threadProfilePoints(
  kind: ThreadProfileKind,
  p = 100,
  yCrest = 50,
  nPitches = 2,
): ProfilePt[] {
  switch (kind) {
    case 'whitworth':
    case 'gas_w':
      return whitworthPoints(p, yCrest, nPitches);
    case 'npt':
      return nptPoints(p, yCrest, nPitches);
    case 'tr':
      return trapPoints(p, yCrest, nPitches, 30, 0.5);
    case 'acme':
      return trapPoints(p, yCrest, nPitches, 29, 0.5);
    case 'acme_stub':
      return trapPoints(p, yCrest, nPitches, 29, 0.3);
    case 'buttress':
      return buttressPoints(p, yCrest, nPitches);
    case 'square':
      return squarePoints(p, yCrest, nPitches);
    case 'pg':
      return pgPoints(p, yCrest, nPitches);
    case 'round':
    case 'edison':
      return roundPoints(p, yCrest, nPitches);
    default:
      return iso60Points(p, yCrest, nPitches);
  }
}

export function threadProfilePath(
  kind: ThreadProfileKind,
  p = 100,
  yCrest = 50,
  hBox = 250,
  nPitches = 2,
): string {
  if (kind === 'whitworth' || kind === 'round' || kind === 'edison' || kind === 'gas_w') {
    const o = threadProfileOpen(kind, p, yCrest, nPitches);
    return closeOpen(o.d, o.x0, o.x1, hBox);
  }
  return closeBody(threadProfilePoints(kind, p, yCrest, nPitches), hBox);
}

export function engagementDepth(kind: ThreadProfileKind, p: number): number {
  if (kind === 'whitworth' || kind === 'gas_w') return WHITWORTH.h_over_P * p;
  if (kind === 'npt') return NPT.h_over_P * p;
  if (kind === 'buttress') return 0.6 * p;
  if (kind === 'acme_stub') return 0.3 * p;
  if (kind === 'pg') return 0.5 * (p / (2 * Math.tan((40 * Math.PI) / 180)));
  if (kind === 'iso60' || kind === 'jic' || kind === 'sae_orb' || kind === 'orfs') {
    return (5 / 8) * ISO60.H_over_P * p;
  }
  return 0.5 * p;
}

export function angleLabelFor(type: string): string {
  return computeThreadProfile(type, 10, 1.5).angleLabel;
}
