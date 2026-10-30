/**
 * 🕸️ AluCAD OS — Block Engineering Mesh & Universal Interconnection Hub
 * 
 * Complies with AGENTS.md & GEMINI.md:
 * - Deterministic ISO/DIN/EN engineering contracts
 * - Bi-directional tri-partite mesh: Dynamic CAD Blocks ⇄ Engineering Calculators ⇄ Flow Engine Nodes ⇄ 3D Assembly
 * - Zero random values: pure deterministic physical formulas
 */

import { DynamicBlockRegistry } from '@/cad/blocks/dynamic/registry';
import { SKF_CATALOG } from '@/cad/blocks/dynamic/definitions/skfBearing';
import { V_PULLEY_SPECS } from '@/cad/blocks/dynamic/definitions/vBeltPulley';
import { IEC_MOTOR_FRAMES } from '@/cad/blocks/dynamic/definitions/electricMotor';
import { METRIC_FASTENER_SPECS } from '@/cad/blocks/dynamic/definitions/fastener';
import { CHAIN_PITCHES } from '@/cad/blocks/dynamic/definitions/rollerSprocket';
import { PULLEY_PROFILE_OPTIONS } from '@/cad/blocks/dynamic/definitions/timingPulley';
import { STEEL_PROFILES_DB } from '@/cad/blocks/dynamic/definitions/steelBeam';
import { PIPE_FLANGE_DB } from '@/cad/blocks/dynamic/definitions/pipeFlange';
import { TSLOT_CATALOG } from '@/cad/catalog/tSlotProfiles';
import { BOX_PROFILES_DB } from '@/cad/blocks/dynamic/definitions/boxProfile';
import { ANGLE_PROFILES_DB } from '@/cad/blocks/dynamic/definitions/angleProfile';
import { SHEET_METAL_MATERIALS, STANDARD_CLEARANCE_HOLES } from '@/cad/blocks/dynamic/definitions/sheetMetalPlate';
import { GAMAK_CATALOG } from '@/cad/blocks/dynamic/definitions/gamakMotor';
import { YILMAZ_CATALOG } from '@/cad/blocks/dynamic/definitions/yilmazGearbox';
import { ALU_PROFILES_DB } from '@/cad/blocks/dynamic/definitions/aluminumProfile';

export interface BlockLiveMetric {
    id: string;
    label: string;
    labelTr: string;
    value: string | number;
    unit?: string;
    formula?: string;
    standard?: string;
}

export interface BlockMeshLink {
    blockId: string;
    name: string;
    nameTr: string;
    calculatorRoute: string;
    calculatorLabel: string;
    calculatorLabelTr: string;
    flowSchemaId: string;
    standard: string;
    standardTier: 1 | 2 | 3;
    /** Builds URL query string for dedicated solver */
    buildCalculatorQuery: (params: Record<string, any>) => Record<string, string | number>;
    /** Builds input payload for Flow Engine node */
    buildFlowInputs: (params: Record<string, any>) => Record<string, any>;
    /** Converts Flow node outputs/inputs into block parameters */
    fromFlowData: (flowInputs: Record<string, any>, flowOutputs: Record<string, any>) => Record<string, any>;
    /** Computes live deterministic engineering metrics for in-CAD inspection */
    computeLiveMetrics: (params: Record<string, any>) => BlockLiveMetric[];
}

export const BLOCK_ENGINEERING_MESH: Record<string, BlockMeshLink> = {
    // ─── 1. INVOLUTE SPUR & HELICAL GEAR (ISO 53 / DIN 3960 / ISO 6336) ───
    'dyn_involute_gear': {
        blockId: 'dyn_involute_gear',
        name: 'Involute Gear Transmission',
        nameTr: 'Evolvent Dişli Çark Mekanizması',
        calculatorRoute: '/gears/',
        calculatorLabel: 'Open Gearbox & Involute Solver (ISO 6336 / DIN 3960)',
        calculatorLabelTr: 'Dişli & Şanzıman Mukavemet Çözücüsüne Git (ISO 6336)',
        flowSchemaId: 'mech-gear-spur',
        standard: 'ISO 53 / DIN 3960 / ISO 6336:2019',
        standardTier: 1,
        buildCalculatorQuery: (p) => ({
            m: p.module || 3.0,
            z1: p.teeth || 20,
            z2: p.teeth2 || 60,
            alpha: p.pressureAngle || 20,
            beta: p.helixAngle || 0,
            b: p.faceWidth || 30,
            x1: p.profileShift || 0,
            x2: p.profileShift2 || 0,
        }),
        buildFlowInputs: (p) => {
            const isHelical = Number(p.helixAngle || 0) > 0;
            return {
                module_mm: Number(p.module) || 3.0,
                pinion_teeth: Number(p.teeth) || 20,
                gear_teeth: Number(p.teeth2) || 60,
                pressure_angle_deg: Number(p.pressureAngle) || 20,
                helix_angle_deg: Number(p.helixAngle) || 0,
                face_width_mm: Number(p.faceWidth) || 30,
                power_kw: 7.5,
                pinion_speed_rpm: 1450,
            };
        },
        fromFlowData: (inputs, _outputs) => ({
            module: inputs.module_mm ?? inputs.module ?? 3.0,
            teeth: inputs.pinion_teeth ?? inputs.teethPinion ?? 20,
            teeth2: inputs.gear_teeth ?? inputs.teethGear ?? 60,
            pressureAngle: inputs.pressure_angle_deg ?? inputs.pressureAngle ?? 20,
            helixAngle: inputs.helix_angle_deg ?? inputs.helixAngle ?? 0,
            faceWidth: inputs.face_width_mm ?? inputs.faceWidth ?? 30,
        }),
        computeLiveMetrics: (p) => {
            const m = Number(p.module) || 3.0;
            const z1 = Number(p.teeth) || 20;
            const z2 = Number(p.teeth2) || 60;
            const alphaDeg = Number(p.pressureAngle) || 20;
            const alphaRad = (alphaDeg * Math.PI) / 180;
            const betaDeg = Number(p.helixAngle) || 0;
            const betaRad = (betaDeg * Math.PI) / 180;
            const cosBeta = Math.cos(betaRad);

            const mt = cosBeta > 0.001 ? m / cosBeta : m;
            const d1 = mt * z1;
            const d2 = mt * z2;
            const da1 = d1 + 2 * m;
            const da2 = d2 + 2 * m;
            const db1 = d1 * Math.cos(alphaRad);
            const a = (d1 + d2) / 2;
            const ratio = z2 / z1;
            const pCirc = Math.PI * m;

            return [
                { id: 'd1', label: 'Pitch Diameter d1', labelTr: 'Bölüm Dairesi Çapı d1', value: d1.toFixed(2), unit: 'mm', formula: 'd = mt · z' },
                { id: 'da1', label: 'Tip Diameter da1', labelTr: 'Diş Üstü Çapı da1', value: da1.toFixed(2), unit: 'mm', formula: 'da = d + 2·m' },
                { id: 'db1', label: 'Base Diameter db1', labelTr: 'Temel Daire Çapı db1', value: db1.toFixed(2), unit: 'mm', formula: 'db = d · cos(α)' },
                { id: 'a', label: 'Center Distance a', labelTr: 'Eksenler Arası Mesafe a', value: a.toFixed(2), unit: 'mm', formula: 'a = (d1 + d2) / 2' },
                { id: 'i', label: 'Gear Ratio i', labelTr: 'Çevrim Oranı i', value: ratio.toFixed(2), unit: '', formula: 'i = z2 / z1' },
                { id: 'p', label: 'Circular Pitch p', labelTr: 'Adım p', value: pCirc.toFixed(2), unit: 'mm', formula: 'p = π · m' },
            ];
        },
    },

    // ─── 2. SKF ROLLING BEARING (ISO 15 / ISO 281 / DIN 625) ───
    'dyn_skf_bearing': {
        blockId: 'dyn_skf_bearing',
        name: 'SKF Deep Groove Ball Bearing',
        nameTr: 'SKF Sabit Bilyalı Rulman',
        calculatorRoute: '/bearings/',
        calculatorLabel: 'Open Bearing Rating Life Solver (ISO 281)',
        calculatorLabelTr: 'Rulman Ömrü ve Yataklama Hesabına Git (ISO 281)',
        flowSchemaId: 'mech-bearing-life',
        standard: 'ISO 15 / ISO 281:2007 / DIN 625',
        standardTier: 1,
        buildCalculatorQuery: (p) => {
            const desig = String(p.designation || '6205');
            const data = SKF_CATALOG[desig] || SKF_CATALOG['6205'];
            return {
                d: data.d,
                D: data.D,
                B: data.B,
                C: data.C,
                C0: data.C0,
                desig,
            };
        },
        buildFlowInputs: (p) => {
            const desig = String(p.designation || '6205');
            const data = SKF_CATALOG[desig] || SKF_CATALOG['6205'];
            return {
                innerDia: data.d,
                outerDia: data.D,
                width: data.B,
                dynCapacity: data.C * 1000,
                statCapacity: data.C0 * 1000,
                radialLoad: 4500,
                axialLoad: 1200,
                speedRpm: 1450,
            };
        },
        fromFlowData: (inputs, _outputs) => {
            const d = Number(inputs.innerDia) || 25;
            const match = Object.entries(SKF_CATALOG).find(([, v]) => v.d === d);
            return {
                designation: match ? match[0] : '6205',
            };
        },
        computeLiveMetrics: (p) => {
            const desig = String(p.designation || '6205');
            const data = SKF_CATALOG[desig] || SKF_CATALOG['6205'];
            // ISO 281: L10h = (10^6 / (60 * n)) * (C / P)^p  (p=3 for ball bearings)
            const n = 1450;
            const Fr = 4.5; // kN
            const P = Fr; // pure radial
            const L10h = (1e6 / (60 * n)) * Math.pow(data.C / P, 3);

            return [
                { id: 'bore', label: 'Bore Diameter d', labelTr: 'Mil Çapı d', value: data.d, unit: 'mm' },
                { id: 'od', label: 'Outer Diameter D', labelTr: 'Dış Çap D', value: data.D, unit: 'mm' },
                { id: 'w', label: 'Width B', labelTr: 'Genişlik B', value: data.B, unit: 'mm' },
                { id: 'C', label: 'Dynamic Capacity C', labelTr: 'Dinamik Yük Sayısı C', value: data.C.toFixed(1), unit: 'kN', standard: 'ISO 281' },
                { id: 'C0', label: 'Static Capacity C0', labelTr: 'Statik Yük Sayısı C0', value: data.C0.toFixed(1), unit: 'kN' },
                { id: 'L10h', label: 'L10h Life @1450rpm/4.5kN', labelTr: 'L10h Nominal Ömür', value: Math.round(L10h).toLocaleString('en-US'), unit: 'saat (hours)', formula: 'L10h = (10⁶/60n)·(C/P)³' },
            ];
        },
    },

    // ─── 3. V-BELT PULLEY (DIN 2211 / ISO 4184) ───
    'dyn_v_belt_pulley': {
        blockId: 'dyn_v_belt_pulley',
        name: 'V-Belt Pulley Drive',
        nameTr: 'V-Kayış Kasnak Mekanizması',
        calculatorRoute: '/belt-drive/',
        calculatorLabel: 'Open V-Belt Power Rating Solver (DIN 2211 / ISO 4184)',
        calculatorLabelTr: 'V-Kayış Güç & Kasnak Hesabına Git (DIN 2211)',
        flowSchemaId: 'mech-belt-drive',
        standard: 'DIN 2211 / ISO 4183 / ISO 4184',
        standardTier: 1,
        buildCalculatorQuery: (p) => ({
            profile: p.profile || 'SPA',
            dp: p.pitchDiameter || 140,
            grooves: p.grooves || 2,
            type: 'v',
        }),
        buildFlowInputs: (p) => ({
            d1: Number(p.pitchDiameter) || 140,
            d2: Math.round((Number(p.pitchDiameter) || 140) * 2.2),
            C: 550,
            rpm: 1450,
            power_kw: 5.5,
            belt_type: 'v',
        }),
        fromFlowData: (inputs, _outputs) => ({
            pitchDiameter: inputs.d1 ?? 140,
            grooves: 2,
            profile: 'SPA',
        }),
        computeLiveMetrics: (p) => {
            const profile = String(p.profile || 'SPA');
            const std = V_PULLEY_SPECS[profile] || V_PULLEY_SPECS['SPA'];
            const dp = Number(p.pitchDiameter) || 140;
            const grooves = Number(p.grooves) || 2;
            const da = dp + 2 * (std.b - std.lp);
            const B = (grooves - 1) * std.e + 2 * std.f;
            const n = 1450;
            const v = (Math.PI * dp * n) / 60000; // m/s

            return [
                { id: 'dp', label: 'Pitch Diameter dp', labelTr: 'Hatve Çapı dp', value: dp.toFixed(1), unit: 'mm' },
                { id: 'da', label: 'Outer Diameter da', labelTr: 'Dış Çap da', value: da.toFixed(1), unit: 'mm', formula: 'da = dp + 2·c' },
                { id: 'B', label: 'Total Face Width B', labelTr: 'Toplam Kasnak Genişliği B', value: B.toFixed(1), unit: 'mm', formula: 'B = (z-1)·e + 2·f' },
                { id: 'v', label: 'Belt Speed v @1450rpm', labelTr: 'Kayış Hızı v', value: v.toFixed(2), unit: 'm/s', formula: 'v = π·dp·n / 60000' },
                { id: 'grooves', label: 'Groove Count', labelTr: 'Kanal Sayısı', value: grooves },
            ];
        },
    },

    // ─── 4. TIMING BELT PULLEY (ISO 13050 / DIN 7721) ───
    'dyn_timing_pulley': {
        blockId: 'dyn_timing_pulley',
        name: 'Synchronous Timing Pulley',
        nameTr: 'Triger Senkron Dişli Kasnak',
        calculatorRoute: '/belt-drive/',
        calculatorLabel: 'Open Synchronous Belt Solver (ISO 13050 / DIN 7721)',
        calculatorLabelTr: 'Triger Kayış & Kasnak Çözücüsüne Git (ISO 13050)',
        flowSchemaId: 'mech-belt-drive',
        standard: 'ISO 13050 / DIN 7721',
        standardTier: 1,
        buildCalculatorQuery: (p) => ({
            profile: p.profile || '8M_HTD',
            teeth: p.teeth || 36,
            flanged: p.flanged ? 1 : 0,
            type: 'timing',
        }),
        buildFlowInputs: (p) => ({
            d1: Math.round(((Number(p.teeth) || 36) * 8) / Math.PI),
            d2: Math.round(((Number(p.teeth) || 36) * 8 * 2) / Math.PI),
            C: 400,
            rpm: 1450,
            power_kw: 4.0,
            belt_type: 'timing',
        }),
        fromFlowData: (inputs, _outputs) => {
            const d1 = Number(inputs.d1) || 91.67;
            const z = Math.max(14, Math.round((d1 * Math.PI) / 8));
            return {
                teeth: z,
                profile: '8M_HTD',
            };
        },
        computeLiveMetrics: (p) => {
            const profile = String(p.profile || 'HTD_8M');
            const opt = PULLEY_PROFILE_OPTIONS[profile] || PULLEY_PROFILE_OPTIONS['HTD_8M'] || { pitch: 8.0, label: '', type: 'timing-htd' as const };
            const pitch = opt.pitch;
            const z = Number(p.teeth) || 36;
            const dp = (z * pitch) / Math.PI;
            const pld = profile.startsWith('T') ? 0.4 : profile.startsWith('8M') ? 0.686 : 0.381;
            const do_ = dp - 2 * pld;

            return [
                { id: 'pitch', label: 'Tooth Pitch p', labelTr: 'Hatve p', value: pitch, unit: 'mm' },
                { id: 'z', label: 'Teeth Count z', labelTr: 'Diş Sayısı z', value: z },
                { id: 'dp', label: 'Pitch Diameter dp', labelTr: 'Hatve Çapı dp', value: dp.toFixed(2), unit: 'mm', formula: 'dp = (z · p) / π' },
                { id: 'do', label: 'Outer Diameter do', labelTr: 'Dış Çap do', value: do_.toFixed(2), unit: 'mm', formula: 'do = dp - 2·PLD' },
            ];
        },
    },

    // ─── 5. ROLLER CHAIN SPROCKET (ISO 606 / DIN 8187) ───
    'dyn_roller_sprocket': {
        blockId: 'dyn_roller_sprocket',
        name: 'Roller Chain Sprocket',
        nameTr: 'Makaralı Zincir Dişlisi',
        calculatorRoute: '/chain-drive/',
        calculatorLabel: 'Open Roller Chain Transmission Solver (ISO 606)',
        calculatorLabelTr: 'Makaralı Zincir Mekanizması Çözücüsüne Git (ISO 606)',
        flowSchemaId: 'mech-chain-drive',
        standard: 'ISO 606:2015 / DIN 8187 / DIN 8188',
        standardTier: 1,
        buildCalculatorQuery: (p) => ({
            chain: p.chainSize || '08B',
            z1: p.teeth || 21,
            strand: p.strandCount || 'simplex',
        }),
        buildFlowInputs: (p) => {
            const chainSize = String(p.chainSize || '08B');
            const pMm = CHAIN_PITCHES[chainSize]?.pitch || 12.7;
            const z1 = Number(p.teeth) || 21;
            return {
                z1,
                z2: Math.round(z1 * 2),
                p: pMm,
                C: 450,
                rpm: 1450,
                power_kw: 5.5,
                chain_no: chainSize,
            };
        },
        fromFlowData: (inputs, _outputs) => ({
            chainSize: inputs.chain_no ? String(inputs.chain_no) : '08B',
            teeth: inputs.z1 ?? 21,
        }),
        computeLiveMetrics: (p) => {
            const chainSize = String(p.chainSize || '08B');
            const data = CHAIN_PITCHES[chainSize] || CHAIN_PITCHES['08B'];
            const pitch = data.pitch;
            const rollerD = data.d1;
            const z = Number(p.teeth) || 21;
            const pitchRad = (Math.PI / z);
            const d = pitch / Math.sin(pitchRad);
            const da = d + 1.25 * pitch - rollerD;
            const df = d - rollerD;

            return [
                { id: 'pitch', label: 'Chain Pitch p', labelTr: 'Zincir Adımı p', value: pitch, unit: 'mm' },
                { id: 'z', label: 'Tooth Count z', labelTr: 'Diş Sayısı z', value: z },
                { id: 'd', label: 'Pitch Circle d', labelTr: 'Bölüm Dairesi d', value: d.toFixed(2), unit: 'mm', formula: 'd = p / sin(180°/z)' },
                { id: 'da', label: 'Tip Diameter da', labelTr: 'Diş Dış Çapı da', value: da.toFixed(2), unit: 'mm', formula: 'da = d + 1.25p - d1' },
                { id: 'df', label: 'Root Diameter df', labelTr: 'Diş Dibi Çapı df', value: df.toFixed(2), unit: 'mm', formula: 'df = d - d1' },
            ];
        },
    },

    // ─── 6. METRIC FASTENER BOLT & NUT (VDI 2230 / ISO 898-1 / ISO 4014) ───
    'dyn_fastener': {
        blockId: 'dyn_fastener',
        name: 'Metric Structural Fastener',
        nameTr: 'Metrik Yapısal Cıvata & Somun',
        calculatorRoute: '/bolt-torque/',
        calculatorLabel: 'Open High-Strength Bolt Preload & Torque Solver (VDI 2230)',
        calculatorLabelTr: 'Cıvata Ön Yük & Tork Çözücüsüne Git (VDI 2230)',
        flowSchemaId: 'mech-bolt-stress',
        standard: 'VDI 2230 / ISO 898-1 / ISO 4014 / DIN 912',
        standardTier: 1,
        buildCalculatorQuery: (p) => ({
            size: p.size || 'M12',
            length: p.length || 60,
            head: p.headType || 'hex',
        }),
        buildFlowInputs: (p) => {
            const size = String(p.size || 'M12');
            const spec = METRIC_FASTENER_SPECS[size] || METRIC_FASTENER_SPECS['M12'];
            const dNom = parseFloat(size.replace('M', '')) || 12;
            return {
                diameter: dNom,
                pitch: spec.pitch,
                clampingForce: Math.round(spec.As * 640 * 0.9), // 8.8 grade 90% yield
                frictionCoeff: 0.14,
            };
        },
        fromFlowData: (inputs, _outputs) => {
            const d = Number(inputs.diameter) || 12;
            const size = `M${Math.round(d)}`;
            return {
                size: METRIC_FASTENER_SPECS[size] ? size : 'M12',
            };
        },
        computeLiveMetrics: (p) => {
            const size = String(p.size || 'M12');
            const spec = METRIC_FASTENER_SPECS[size] || METRIC_FASTENER_SPECS['M12'];
            const length = Number(p.length) || 60;
            const dNom = parseFloat(size.replace('M', '')) || 12;
            // Class 8.8: Rp0.2 = 640 MPa, Rm = 800 MPa
            const As = spec.As;
            const Fm90 = 0.9 * 640 * As; // N
            // VDI 2230 simplified: MA = Fm * (0.16*P + 0.58*d2*mu + 0.5*dw*mu) with mu=0.14
            const d2 = dNom - 0.6495 * spec.pitch;
            const dw = spec.sHex * 0.9;
            const MaNm = (Fm90 * (0.16 * spec.pitch + 0.58 * d2 * 0.14 + 0.5 * dw * 0.14)) / 1000;

            return [
                { id: 'size', label: 'Thread Size', labelTr: 'Diş Ölçüsü', value: size },
                { id: 'pitch', label: 'Pitch P', labelTr: 'Hatve P', value: spec.pitch, unit: 'mm' },
                { id: 'As', label: 'Stress Area As', labelTr: 'Gerilme Kesit Alanı As', value: spec.As.toFixed(1), unit: 'mm²', formula: 'ISO 898-1' },
                { id: 'Fm', label: '90% Yield Preload Fm (8.8)', labelTr: 'Montaj Ön Yükü Fm', value: (Fm90 / 1000).toFixed(1), unit: 'kN', formula: '0.9 · Rp0.2 · As' },
                { id: 'Ma', label: 'Tightening Torque MA (μ=0.14)', labelTr: 'Sıkma Torku MA', value: (spec.torque88 || MaNm).toFixed(1), unit: 'N·m', formula: 'VDI 2230 §5.4' },
                { id: 'len', label: 'Grip Length L', labelTr: 'Cıvata Boyu L', value: length, unit: 'mm' },
            ];
        },
    },

    // ─── 7. STRUCTURAL STEEL BEAM (EN 1993-1-1 / AISC) ───
    'dyn_steel_beam': {
        blockId: 'dyn_steel_beam',
        name: 'Structural Steel Section Beam',
        nameTr: 'Yapısal Çelik Profil Kirişi',
        calculatorRoute: '/beam-deflection/',
        calculatorLabel: 'Open Beam Bending & Deflection Solver (Eurocode 3)',
        calculatorLabelTr: 'Kiriş Eğilme & Sehim Çözücüsüne Git (Eurocode 3)',
        flowSchemaId: 'mech-beam-deflection',
        standard: 'EN 1993-1-1 / DIN 1025 / AISC 360',
        standardTier: 1,
        buildCalculatorQuery: (p) => ({
            section: p.sectionType || 'IPE',
            size: p.designation || 'IPE200',
            L: p.length || 3000,
        }),
        buildFlowInputs: (p) => {
            const desigRaw = String(p.designation || 'IPE 200');
            const match = desigRaw.match(/^([A-Za-z]+)\s*(\d+)$/);
            const desig = match ? `${match[1]} ${match[2]}` : desigRaw;
            const data = STEEL_PROFILES_DB[desig] || STEEL_PROFILES_DB['IPE 200'];
            const Ix_mm4 = (data.b * Math.pow(data.h, 3) - (data.b - data.tw) * Math.pow(data.h - 2 * data.tf, 3)) / 12;
            return {
                length: Number(p.length) || 3000,
                force: 15000,
                elasticModulus: 210000,
                momentOfInertia: Ix_mm4,
            };
        },
        fromFlowData: (inputs, _outputs) => ({
            length: inputs.length ?? 3000,
            designation: 'IPE 200',
        }),
        computeLiveMetrics: (p) => {
            const desigRaw = String(p.designation || 'IPE 200');
            const match = desigRaw.match(/^([A-Za-z]+)\s*(\d+)$/);
            const desig = match ? `${match[1]} ${match[2]}` : desigRaw;
            const data = STEEL_PROFILES_DB[desig] || STEEL_PROFILES_DB['IPE 200'];
            const L = Number(p.length) || 3000;
            const h = data.h;
            const b = data.b;
            const tw = data.tw;
            const tf = data.tf;
            const Ix_mm4 = (b * Math.pow(h, 3) - (b - tw) * Math.pow(h - 2 * tf, 3)) / 12;
            const Ix_cm4 = Math.round(Ix_mm4 / 10000);
            const Wx_cm3 = Math.round((Ix_mm4 / (h / 2)) / 1000);
            const A_cm2 = Math.round((2 * b * tf + (h - 2 * tf) * tw) / 100);
            const fy = 275; // S275 steel MPa
            const Mc_Rd = (Wx_cm3 * 1000 * fy) / 1e6; // kNm (EN 1993-1-1)
            // Midspan point load F=10kN deflection: f = F*L^3 / (48*E*I)
            const E = 210000;
            const F = 10000; // N
            const f_deflection = (F * Math.pow(L, 3)) / (48 * E * Ix_mm4);

            return [
                { id: 'h', label: 'Section Height h', labelTr: 'Profil Yüksekliği h', value: data.h, unit: 'mm' },
                { id: 'b', label: 'Flange Width b', labelTr: 'Başlık Genişliği b', value: data.b, unit: 'mm' },
                { id: 'A', label: 'Cross Section Area A', labelTr: 'Kesit Alanı A', value: A_cm2, unit: 'cm²' },
                { id: 'Ix', label: 'Moment of Inertia Ix', labelTr: 'Atalet Momenti Ix', value: Ix_cm4.toLocaleString('en-US'), unit: 'cm⁴' },
                { id: 'Mc', label: 'Bending Resistance Mc,Rd', labelTr: 'Eğilme Mukavemeti Mc,Rd (S275)', value: Mc_Rd.toFixed(2), unit: 'kN·m', formula: 'W_el · fy / γM0' },
                { id: 'def', label: 'Deflection @10kN (Midspan)', labelTr: 'Orta Nokta Sehimi @10kN', value: f_deflection.toFixed(2), unit: 'mm', formula: 'F·L³ / 48·E·I' },
            ];
        },
    },

    // ─── 8. FOUNDATION REINFORCED COLUMN (EN 1992 / EN 1993 / Euler) ───
    'dyn_foundation_column': {
        blockId: 'dyn_foundation_column',
        name: 'Structural Support Column',
        nameTr: 'Yapısal Taşıyıcı Kolon',
        calculatorRoute: '/column-buckling/',
        calculatorLabel: 'Open Column Buckling & Euler Limit Solver',
        calculatorLabelTr: 'Kolon Burkulma & Euler Kritik Yük Çözücüsüne Git',
        flowSchemaId: 'mech-column-buckling',
        standard: 'EN 1993-1-1 / Euler / Tetmajer',
        standardTier: 1,
        buildCalculatorQuery: (p) => ({
            w: p.width || 400,
            d: p.depth || 400,
            L: p.height || 3500,
        }),
        buildFlowInputs: (p) => {
            const w = Number(p.width) || 400;
            const d = Number(p.depth) || 400;
            const L = Number(p.height) || 3500;
            const A = w * d;
            const I = (w * Math.pow(d, 3)) / 12;
            return {
                lengthMm: L,
                areaMm2: A,
                momentOfInertiaMm4: I,
                elasticModulusMpa: 30000, // concrete C30/37
                axialLoadN: 500000,
            };
        },
        fromFlowData: (inputs, _outputs) => ({
            width: Math.round(Math.sqrt(inputs.areaMm2 || 160000)),
            depth: Math.round(Math.sqrt(inputs.areaMm2 || 160000)),
            height: inputs.lengthMm ?? 3500,
        }),
        computeLiveMetrics: (p) => {
            const w = Number(p.width) || 400;
            const d = Number(p.depth) || 400;
            const L = Number(p.height) || 3500;
            const A = w * d;
            const Imin = (Math.min(w, d) * Math.pow(Math.min(w, d), 3)) / 12;
            const imin = Math.sqrt(Imin / A);
            const lambda = L / imin;
            const E = 30000; // Concrete C30/37 MPa
            const Ncr = (Math.PI * Math.PI * E * Imin) / (L * L); // N

            return [
                { id: 'A', label: 'Gross Section Area A', labelTr: 'Kesit Alanı A', value: (A / 100).toFixed(0), unit: 'cm²' },
                { id: 'i', label: 'Radius of Gyration imin', labelTr: 'Atalet Yarıçapı imin', value: imin.toFixed(1), unit: 'mm', formula: '√(I/A)' },
                { id: 'lambda', label: 'Slenderness Ratio λ', labelTr: 'Narinlik Oranı λ', value: lambda.toFixed(1), unit: '', formula: 'L / imin' },
                { id: 'Ncr', label: 'Euler Critical Load Ncr', labelTr: 'Euler Kritik Burkulma Yükü', value: (Ncr / 1000).toFixed(1), unit: 'kN', formula: 'π²·E·I / L²' },
            ];
        },
    },

    // ─── 9. INDUSTRIAL PIPE FLANGE (EN 1092-1 / ASME B16.5) ───
    'dyn_pipe_flange': {
        blockId: 'dyn_pipe_flange',
        name: 'Industrial Pipe Flange',
        nameTr: 'Endüstriyel Boru Flanşı',
        calculatorRoute: '/fluid-dynamics/',
        calculatorLabel: 'Open Pipe Flow & Hydrostatic Thrust Solver',
        calculatorLabelTr: 'Boru Akışı ve Hidrostatik İtme Hesabına Git',
        flowSchemaId: 'mech-pressure-vessel',
        standard: 'EN 1092-1 / ASME B16.5',
        standardTier: 1,
        buildCalculatorQuery: (p) => ({
            dn: p.nominalDiameter || 'DN100',
            pn: p.pressureRating || 'PN16',
        }),
        buildFlowInputs: (p) => {
            const dnStr = String(p.nominalDiameter || 'DN100');
            const spec = PIPE_FLANGE_DB[dnStr] || PIPE_FLANGE_DB['DN100'];
            return {
                innerDiameter: spec.pipeOD - 2 * spec.pipeWall,
                outerDiameter: spec.flangeD,
                designPressureBar: 16,
            };
        },
        fromFlowData: (inputs, _outputs) => ({
            nominalDiameter: `DN${Math.round(inputs.innerDiameter || 100)}`,
        }),
        computeLiveMetrics: (p) => {
            const dnStr = String(p.nominalDiameter || 'DN100');
            const spec = PIPE_FLANGE_DB[dnStr] || PIPE_FLANGE_DB['DN100'];
            const dnNum = parseFloat(spec.dn.replace('DN', '')) || 100;
            const Pbar = 16;
            const Pmpa = Pbar * 0.1;
            const Apipe = (Math.PI * Math.pow(dnNum, 2)) / 4; // mm2
            const Fthrust = Apipe * Pmpa; // N

            return [
                { id: 'dn', label: 'Nominal Bore DN', labelTr: 'Anma Çapı DN', value: spec.dn, unit: 'mm' },
                { id: 'D', label: 'Flange OD D', labelTr: 'Flanş Dış Çapı D', value: spec.flangeD, unit: 'mm' },
                { id: 'K', label: 'Pitch Circle K', labelTr: 'Cıvata Eksen Dairesi K', value: spec.boltPCD, unit: 'mm' },
                { id: 'bolts', label: 'Bolt Count & Size', labelTr: 'Cıvata Sayısı & Çapı', value: `${spec.boltHoles} × Ø${spec.boltDia}mm` },
                { id: 'thrust', label: 'Pressure Thrust @16 bar', labelTr: 'Eksenel Basınç İtmesi', value: (Fthrust / 1000).toFixed(2), unit: 'kN', formula: 'P · (π·DN²/4)' },
            ];
        },
    },

    // ─── 10. IEC ELECTRIC MOTOR (IEC 60034-30 / DIN 42673) ───
    'dyn_electric_motor': {
        blockId: 'dyn_electric_motor',
        name: 'IEC Standard Induction Motor',
        nameTr: 'IEC Standart Asenkron Elektrik Motoru',
        calculatorRoute: '/three-phase-power/',
        calculatorLabel: 'Open 3-Phase Electric Motor Power & Torque Solver',
        calculatorLabelTr: '3-Fazlı Motor Güç & Tork Çözücüsüne Git',
        flowSchemaId: 'mech-power-torque',
        standard: 'IEC 60034-30-1 / DIN 42673',
        standardTier: 1,
        buildCalculatorQuery: (p) => {
            const frameRaw = String(p.frameSize || '132');
            const frameKey = frameRaw.startsWith('IEC_') ? frameRaw : `IEC_${frameRaw.replace(/[^0-9A-Z]/g, '')}`;
            const data = IEC_MOTOR_FRAMES[frameKey] || IEC_MOTOR_FRAMES['IEC_132'];
            return {
                frame: data.frame,
                powerKw: data.kw,
                mount: p.mounting || 'B3',
            };
        },
        buildFlowInputs: (p) => {
            const frameRaw = String(p.frameSize || '132');
            const frameKey = frameRaw.startsWith('IEC_') ? frameRaw : `IEC_${frameRaw.replace(/[^0-9A-Z]/g, '')}`;
            const data = IEC_MOTOR_FRAMES[frameKey] || IEC_MOTOR_FRAMES['IEC_132'];
            return {
                power_kw: data.kw,
                speed_rpm: 1450,
            };
        },
        fromFlowData: (inputs, _outputs) => ({
            frameSize: '132',
        }),
        computeLiveMetrics: (p) => {
            const frameRaw = String(p.frameSize || '132');
            const frameKey = frameRaw.startsWith('IEC_') ? frameRaw : `IEC_${frameRaw.replace(/[^0-9A-Z]/g, '')}`;
            const data = IEC_MOTOR_FRAMES[frameKey] || IEC_MOTOR_FRAMES['IEC_132'];
            const n = 1450; // 4-pole synchronous ~1500, nominal 1450 rpm
            const torqueNm = (9550 * data.kw) / n;
            // 400V 3-phase, cos phi=0.84, eta=0.89 (IE3)
            const I_amps = (data.kw * 1000) / (Math.sqrt(3) * 400 * 0.84 * 0.89);

            return [
                { id: 'frame', label: 'Frame Size', labelTr: 'Gövde Şasi Tipi', value: `IEC ${data.frame}` },
                { id: 'P', label: 'Rated Power P', labelTr: 'Anma Gücü P', value: data.kw, unit: 'kW' },
                { id: 'shaft', label: 'Shaft Diameter D', labelTr: 'Mil Çapı D', value: data.dShaft, unit: 'mm' },
                { id: 'T', label: 'Nominal Torque T @1450rpm', labelTr: 'Nominal Tork T', value: torqueNm.toFixed(1), unit: 'N·m', formula: '9550 · P / n' },
                { id: 'I', label: 'Full Load Current In (400V)', labelTr: 'Tam Yük Akımı In (400V IE3)', value: I_amps.toFixed(1), unit: 'A', formula: 'P / (√3·U·cosφ·η)' },
            ];
        },
    },

    // ─── 11. MODULAR ALUMINUM T-SLOT / SIGMA PROFILE (DIN EN 12020 / EN 755) ───
    'dyn_tslot_profile': {
        blockId: 'dyn_tslot_profile',
        name: 'Aluminum T-Slot Extrusion (Sigma Profile)',
        nameTr: 'Modüler Alüminyum T-Slot / Sigma Profil (DIN EN 12020)',
        calculatorRoute: '/beam-deflection/',
        calculatorLabel: 'Beam Deflection & Bending Stress Solver (DIN EN 12020 / Eurocode 9)',
        calculatorLabelTr: 'Kiriş Sehimi ve Eğilme Gerilmesi Çözücüsü (DIN EN 12020)',
        flowSchemaId: 'mech-beam-deflection',
        standard: 'DIN EN 12020 / EN 755 / Eurocode 9',
        standardTier: 1,
        buildCalculatorQuery: (p) => {
            const spec = TSLOT_CATALOG.find(s => s.id === p.profileId) || TSLOT_CATALOG[2];
            return {
                profile: spec.name,
                ix: spec.ix_cm4,
                iy: spec.iy_cm4,
                length: p.length || 1000,
                emodulus: 70000,
            };
        },
        buildFlowInputs: (p) => {
            const spec = TSLOT_CATALOG.find(s => s.id === p.profileId) || TSLOT_CATALOG[2];
            return {
                length_mm: Number(p.length) || 1000,
                ix_cm4: spec.ix_cm4,
                iy_cm4: spec.iy_cm4,
                mass_per_m_kg: spec.massKgPerM,
                width_mm: spec.width,
                height_mm: spec.height,
            };
        },
        fromFlowData: (inputs, _outputs) => ({
            profileId: inputs.profile_id ?? '4040',
            length: inputs.length_mm ?? 1000,
        }),
        computeLiveMetrics: (p) => {
            const profileId = String(p.profileId || '4040');
            const spec = TSLOT_CATALOG.find(s => s.id === profileId) || TSLOT_CATALOG[2];
            const lengthMm = Number(p.length) || 1000;
            const totalMassKg = spec.massKgPerM * (lengthMm / 1000);
            
            // Midspan deflection delta under 1000 N point load (simply supported)
            // delta = (F * L^3) / (48 * E * I)
            const F = 1000; // N
            const E = 70000; // MPa for 6063-T6
            const I = spec.ix_cm4 * 10000; // mm4
            const deltaMm = (F * Math.pow(lengthMm, 3)) / (48 * E * I);
            const wxCm3 = (I / (spec.height / 2)) / 1000;

            return [
                { id: 'spec', label: 'Section Size', labelTr: 'Kesit Ölçüsü', value: `${spec.width}×${spec.height} mm (Slot ${spec.slot})` },
                { id: 'mass_m', label: 'Linear Mass', labelTr: 'Birim Ağırlık', value: spec.massKgPerM.toFixed(2), unit: 'kg/m' },
                { id: 'mass_tot', label: 'Total Weight', labelTr: 'Profil Toplam Kütlesi', value: totalMassKg.toFixed(2), unit: 'kg' },
                { id: 'ix', label: 'Moment of Inertia Ix', labelTr: 'Atalet Momenti Ix', value: spec.ix_cm4.toFixed(2), unit: 'cm⁴' },
                { id: 'iy', label: 'Moment of Inertia Iy', labelTr: 'Atalet Momenti Iy', value: spec.iy_cm4.toFixed(2), unit: 'cm⁴' },
                { id: 'wx', label: 'Section Modulus Wx', labelTr: 'Mukavemet Momenti Wx', value: wxCm3.toFixed(2), unit: 'cm³', formula: 'Ix / (h/2)' },
                { id: 'deflection', label: 'Midspan Deflection @1kN', labelTr: 'Orta Nokta Sehimi @1kN', value: deltaMm.toFixed(2), unit: 'mm', formula: 'F·L³ / (48·E·Ix)' },
                { id: 'tnut', label: 'Slot T-Nut Spec', labelTr: 'Kanal Somun Normu', value: `DIN 508 / ISO 299 (${spec.slot}mm)` },
            ];
        },
    },

    // ─── 12. HOLLOW STRUCTURAL SECTION (SHS / RHS - EN 10219 / EN 10210) ───
    'dyn_box_profile': {
        blockId: 'dyn_box_profile',
        name: 'Hollow Box Section (SHS / RHS)',
        nameTr: 'Kutu Profil (Kare / Dikdörtgen Profil - EN 10219)',
        calculatorRoute: '/beam-deflection/',
        calculatorLabel: 'Hollow Beam Deflection & Bending Stress (EN 10219 / Eurocode 3)',
        calculatorLabelTr: 'Kutu Profil Sehim ve Mukavemet Çözücüsü (EN 10219)',
        flowSchemaId: 'mech-beam-deflection',
        standard: 'EN 10219-2 / EN 10210-2 / EN 755-8',
        standardTier: 1,
        buildCalculatorQuery: (p) => {
            const spec = BOX_PROFILES_DB[p.profileId] || BOX_PROFILES_DB['SHS 40x40x3'];
            return {
                profile: spec.id,
                w: spec.w,
                h: spec.h,
                t: spec.t,
                length: p.length || 1000,
                material: p.material || 'steel',
            };
        },
        buildFlowInputs: (p) => {
            const spec = BOX_PROFILES_DB[p.profileId] || BOX_PROFILES_DB['SHS 40x40x3'];
            return {
                length_mm: Number(p.length) || 1000,
                width_mm: spec.w,
                height_mm: spec.h,
                thickness_mm: spec.t,
                mass_per_m_kg: p.material === 'aluminum' ? spec.massAluKgM : spec.massKgM,
            };
        },
        fromFlowData: (inputs, _outputs) => ({
            profileId: inputs.profile_id ?? 'SHS 40x40x3',
            length: inputs.length_mm ?? 1000,
            material: inputs.material ?? 'steel',
        }),
        computeLiveMetrics: (p) => {
            const profileId = String(p.profileId || 'SHS 40x40x3');
            const spec = BOX_PROFILES_DB[profileId] || BOX_PROFILES_DB['SHS 40x40x3'];
            const lengthMm = Number(p.length) || 1000;
            const isAlu = p.material === 'aluminum';
            const unitMass = isAlu ? spec.massAluKgM : spec.massKgM;
            const totalMass = unitMass * (lengthMm / 1000);

            // Exact Ix, Iy for hollow rectangle: (B*H^3 - b*h^3) / 12
            const bi = spec.w - 2 * spec.t;
            const hi = spec.h - 2 * spec.t;
            const Ix_mm4 = (spec.w * Math.pow(spec.h, 3) - bi * Math.pow(hi, 3)) / 12;
            const Iy_mm4 = (spec.h * Math.pow(spec.w, 3) - hi * Math.pow(bi, 3)) / 12;
            const Ix_cm4 = Ix_mm4 / 10000;
            const Iy_cm4 = Iy_mm4 / 10000;
            const Wx_cm3 = (Ix_mm4 / (spec.h / 2)) / 1000;

            // Elastic moment capacity Mel = Wx * fy
            const fy = isAlu ? 160 : 235; // MPa (6060-T6 or S235)
            const Mel_kNm = (Wx_cm3 * 1000 * fy) / 1e6;

            return [
                { id: 'spec', label: 'Section Dimensions', labelTr: 'Kesit Ölçüleri', value: `${spec.w}×${spec.h}×${spec.t} mm (Rext=${spec.rExt}mm)` },
                { id: 'mat', label: 'Material', labelTr: 'Malzeme Cinsi', value: isAlu ? 'Al EN AW-6060-T6' : 'Steel S235JR' },
                { id: 'mass_m', label: 'Linear Mass', labelTr: 'Birim Ağırlık', value: unitMass.toFixed(2), unit: 'kg/m' },
                { id: 'mass_tot', label: 'Total Weight', labelTr: 'Toplam Ağırlık', value: totalMass.toFixed(2), unit: 'kg' },
                { id: 'ix', label: 'Moment of Inertia Ix', labelTr: 'Atalet Momenti Ix', value: Ix_cm4.toFixed(1), unit: 'cm⁴', formula: '(B·H³ - b·h³)/12' },
                { id: 'iy', label: 'Moment of Inertia Iy', labelTr: 'Atalet Momenti Iy', value: Iy_cm4.toFixed(1), unit: 'cm⁴', formula: '(H·B³ - h·b³)/12' },
                { id: 'wx', label: 'Section Modulus Wx', labelTr: 'Mukavemet Momenti Wx', value: Wx_cm3.toFixed(1), unit: 'cm³' },
                { id: 'mel', label: 'Elastic Moment Mel,Rd', labelTr: 'Elastik Moment Kapasitesi', value: Mel_kNm.toFixed(2), unit: 'kN·m', formula: 'Wx · fy' },
            ];
        },
    },

    // ─── 13. STRUCTURAL ANGLE PROFILE (L-SECTION - DIN EN 10056) ───
    'dyn_angle_profile': {
        blockId: 'dyn_angle_profile',
        name: 'Structural Angle (Köşebent L-Profil)',
        nameTr: 'Köşebent Profil (L-Kesit - DIN EN 10056)',
        calculatorRoute: '/beam-deflection/',
        calculatorLabel: 'Angle Section Deflection & Center of Gravity (DIN EN 10056)',
        calculatorLabelTr: 'Köşebent Sehim & Ağırlık Merkezi Çözücüsü (EN 10056)',
        flowSchemaId: 'mech-beam-deflection',
        standard: 'DIN EN 10056-1 / ISO 657-1 / EN 755-9',
        standardTier: 1,
        buildCalculatorQuery: (p) => {
            const spec = ANGLE_PROFILES_DB[p.profileId] || ANGLE_PROFILES_DB['L 50x50x5'];
            return {
                profile: spec.id,
                a: spec.a,
                b: spec.b,
                t: spec.t,
                cx: spec.cx,
                cy: spec.cy,
                length: p.length || 1000,
            };
        },
        buildFlowInputs: (p) => {
            const spec = ANGLE_PROFILES_DB[p.profileId] || ANGLE_PROFILES_DB['L 50x50x5'];
            return {
                leg_a_mm: spec.a,
                leg_b_mm: spec.b,
                thickness_mm: spec.t,
                length_mm: Number(p.length) || 1000,
                mass_per_m_kg: p.material === 'aluminum' ? spec.massAluKgM : spec.massKgM,
            };
        },
        fromFlowData: (inputs, _outputs) => ({
            profileId: inputs.profile_id ?? 'L 50x50x5',
            length: inputs.length_mm ?? 1000,
        }),
        computeLiveMetrics: (p) => {
            const profileId = String(p.profileId || 'L 50x50x5');
            const spec = ANGLE_PROFILES_DB[profileId] || ANGLE_PROFILES_DB['L 50x50x5'];
            const lengthMm = Number(p.length) || 1000;
            const isAlu = p.material === 'aluminum';
            const unitMass = isAlu ? spec.massAluKgM : spec.massKgM;
            const totalMass = unitMass * (lengthMm / 1000);

            // Area A = t * (a + b - t)
            const areaMm2 = spec.t * (spec.a + spec.b - spec.t);
            // Parallel axis theorem moment of inertia Ix:
            const Ix_mm4 = (spec.t * Math.pow(spec.a, 3)) / 12 + (spec.t * spec.a) * Math.pow(spec.a / 2 - spec.cy, 2)
                         + ((spec.b - spec.t) * Math.pow(spec.t, 3)) / 12 + ((spec.b - spec.t) * spec.t) * Math.pow(spec.cy - spec.t / 2, 2);
            const Ix_cm4 = Ix_mm4 / 10000;

            return [
                { id: 'spec', label: 'Angle Dimensions', labelTr: 'Köşebent Kesiti', value: `L ${spec.a}×${spec.b}×${spec.t} mm` },
                { id: 'cog', label: 'Center of Gravity (cx, cy)', labelTr: 'Ağırlık Merkezi (cx, cy)', value: `(${spec.cx.toFixed(1)}, ${spec.cy.toFixed(1)}) mm` },
                { id: 'area', label: 'Cross Section Area A', labelTr: 'Kesit Alanı A', value: areaMm2.toFixed(1), unit: 'mm²' },
                { id: 'mass_m', label: 'Linear Mass', labelTr: 'Birim Ağırlık', value: unitMass.toFixed(2), unit: 'kg/m' },
                { id: 'mass_tot', label: 'Total Weight', labelTr: 'Toplam Ağırlık', value: totalMass.toFixed(2), unit: 'kg' },
                { id: 'ix', label: 'Moment of Inertia Ix', labelTr: 'Atalet Momenti Ix', value: Ix_cm4.toFixed(1), unit: 'cm⁴', formula: 'Parallel Axis Theorem' },
                { id: 'standard', label: 'Manufacturing Norm', labelTr: 'İmalat Standardı', value: spec.standard },
            ];
        },
    },

    // ─── 14. PARAMETRIC SHEET METAL PLATE WITH CUTOUTS & HOLES (DIN EN 10131 / ISO 9013) ───
    'dyn_sheet_metal_plate': {
        blockId: 'dyn_sheet_metal_plate',
        name: 'Parametric Sheet Metal Plate & Hole Matrix',
        nameTr: 'Sac Levha (Kesik ve Delik Matrisli - ISO 9013)',
        calculatorRoute: '/nesting-2d/',
        calculatorLabel: '2D Nesting & Plasma CAM Toolpath Optimizer (ISO 9013)',
        calculatorLabelTr: '2D Yerleşim & Plazma CAM Takım Yolu (ISO 9013)',
        flowSchemaId: 'sheet-plate-cutting',
        standard: 'DIN EN 10131 / ISO 9013 / VDI 3368',
        standardTier: 1,
        buildCalculatorQuery: (p) => ({
            width: p.width || 300,
            length: p.length || 400,
            thickness: p.thickness || 3,
            material: p.material || 'alu_6061',
            holePattern: p.holePattern || '4_corners',
        }),
        buildFlowInputs: (p) => {
            const matKey = String(p.material || 'alu_6061');
            const mat = SHEET_METAL_MATERIALS[matKey] || SHEET_METAL_MATERIALS['alu_6061'];
            const w = Number(p.width) || 300;
            const l = Number(p.length) || 400;
            const t = Number(p.thickness) || 3;
            const grossMass = (w * l * t * mat.densityGcm3) / 1e6;
            return {
                width_mm: w,
                length_mm: l,
                thickness_mm: t,
                density_g_cm3: mat.densityGcm3,
                gross_mass_kg: grossMass,
            };
        },
        fromFlowData: (inputs, _outputs) => ({
            width: inputs.width_mm ?? 300,
            length: inputs.length_mm ?? 400,
            thickness: inputs.thickness_mm ?? 3,
        }),
        computeLiveMetrics: (p) => {
            const w = Number(p.width) || 300;
            const l = Number(p.length) || 400;
            const t = Number(p.thickness) || 3;
            const matKey = String(p.material || 'alu_6061');
            const mat = SHEET_METAL_MATERIALS[matKey] || SHEET_METAL_MATERIALS['alu_6061'];
            const holeKey = String(p.holeDiameter || 'M8');
            const holeSpec = STANDARD_CLEARANCE_HOLES[holeKey] || STANDARD_CLEARANCE_HOLES['M8'];
            const dHole = holeSpec.dHole;
            const ex = Number(p.edgeMarginX) || 25;
            const ey = Number(p.edgeMarginY) || 25;

            // Hole count based on pattern
            let holeCount = 0;
            const pattern = String(p.holePattern || '4_corners');
            if (pattern === '4_corners') holeCount = 4;
            else if (pattern === 'center') holeCount = 1;
            else if (pattern === 'grid') {
                const nx = Math.max(2, Math.min(10, Math.round(Number(p.gridCols || 3))));
                const ny = Math.max(2, Math.min(10, Math.round(Number(p.gridRows || 2))));
                holeCount = nx * ny;
            } else if (pattern === 'perimeter') {
                const nx = Math.max(2, Math.min(10, Math.round(Number(p.gridCols || 3))));
                const ny = Math.max(2, Math.min(10, Math.round(Number(p.gridRows || 2))));
                holeCount = (nx * 2) + ((ny - 2) * 2);
            }

            const grossAreaMm2 = w * l;
            const holesAreaMm2 = holeCount * (Math.PI * Math.pow(dHole / 2, 2));

            // Cutout area
            let cutoutAreaMm2 = 0;
            let cutoutPerimeterMm = 0;
            const cutoutType = String(p.cutoutType || 'none');
            if (cutoutType === 'rect') {
                const cw = Number(p.cutoutWidth) || 100;
                const ch = Number(p.cutoutHeight) || 60;
                cutoutAreaMm2 = cw * ch;
                cutoutPerimeterMm = 2 * (cw + ch);
            } else if (cutoutType === 'circle') {
                const cd = Number(p.cutoutDia) || 80;
                cutoutAreaMm2 = Math.PI * Math.pow(cd / 2, 2);
                cutoutPerimeterMm = Math.PI * cd;
            }

            const netAreaMm2 = Math.max(1, grossAreaMm2 - holesAreaMm2 - cutoutAreaMm2);
            const netMassKg = (netAreaMm2 * t * mat.densityGcm3) / 1e6;
            const outerPerimeterMm = 2 * (w + l);
            const totalCutLengthMm = outerPerimeterMm + (holeCount * Math.PI * dHole) + cutoutPerimeterMm;

            // DIN 9830 margin safety check: edge margin >= 1.5 * dHole
            const minMargin = Math.min(ex, ey);
            const marginRatio = minMargin / dHole;
            const marginSafe = marginRatio >= 1.5;

            return [
                { id: 'size', label: 'Plate Dimensions', labelTr: 'Plaka Ölçüleri (E×B×t)', value: `${w}×${l}×${t} mm` },
                { id: 'mat', label: 'Alloy / Grade', labelTr: 'Malzeme Standardı', value: mat.label },
                { id: 'net_mass', label: 'Net Mass (After Cuts)', labelTr: 'Net Plaka Ağırlığı', value: netMassKg.toFixed(3), unit: 'kg', formula: 'Vnet · ρ' },
                { id: 'cut_length', label: 'Total Cutting Contour', labelTr: 'Toplam Lazer Kesim Boyu', value: (totalCutLengthMm / 1000).toFixed(2), unit: 'm', formula: 'Pouter + ∑Pholes + Pcutout' },
                { id: 'holes', label: 'Hole Array Spec', labelTr: 'Delik Dizisi & Çapı', value: `${holeCount} × Ø${dHole}mm (${holeSpec.thread})` },
                { id: 'margin_check', label: 'Edge Margin Safety (DIN 9830)', labelTr: 'Kenar Payı Emniyeti (e ≥ 1.5d)', value: marginSafe ? `OK (${marginRatio.toFixed(2)}d ≥ 1.5d)` : `WARN (${marginRatio.toFixed(2)}d < 1.5d)` },
                { id: 'scrap_pct', label: 'Material Cutout Scrap', labelTr: 'Fire Boşaltma Oranı', value: ((1 - netAreaMm2 / grossAreaMm2) * 100).toFixed(1), unit: '%' },
            ];
        },
    },

    // ─── 15. GAMAK INDUSTRIAL ELECTRIC MOTOR (GAMAK AGM3EL IE3 / IEC 60034) ───
    'dyn_gamak_motor': {
        blockId: 'dyn_gamak_motor',
        name: 'Gamak Industrial Induction Motor',
        nameTr: 'Gamak Elektrik Motoru (AGM3EL Serisi IE3 Premium)',
        calculatorRoute: '/three-phase-power/',
        calculatorLabel: '3-Phase Induction Motor Power & Torque Solver (Gamak / IEC 60034)',
        calculatorLabelTr: '3-Fazlı Motor Güç, Tork & Akım Çözücüsü (Gamak / IEC 60034)',
        flowSchemaId: 'mech-power-torque',
        standard: 'IEC 60034-30-1 / DIN EN 50347 / Gamak Makina',
        standardTier: 1,
        buildCalculatorQuery: (p) => {
            const spec = GAMAK_CATALOG[p.motorModel] || GAMAK_CATALOG['AGM3EL_132M_4'];
            return {
                model: spec.frame,
                powerKw: spec.kw,
                rpm: spec.rpm,
                mounting: p.mounting || 'B3',
            };
        },
        buildFlowInputs: (p) => {
            const spec = GAMAK_CATALOG[p.motorModel] || GAMAK_CATALOG['AGM3EL_132M_4'];
            return {
                power_kw: spec.kw,
                speed_rpm: spec.rpm,
                efficiency_pct: spec.efficiencyIE3,
                power_factor: spec.cosPhi,
                nominal_torque_nm: spec.nominalTorque,
                nominal_current_a: spec.inAmps400V,
            };
        },
        fromFlowData: (inputs, _outputs) => ({
            motorModel: inputs.motor_model ?? 'AGM3EL_132M_4',
        }),
        computeLiveMetrics: (p) => {
            const modelKey = String(p.motorModel || 'AGM3EL_132M_4');
            const spec = GAMAK_CATALOG[modelKey] || GAMAK_CATALOG['AGM3EL_132M_4'];

            return [
                { id: 'frame', label: 'Gamak Frame Size', labelTr: 'Gamak Gövde Şasisi', value: `Gamak AGM ${spec.frame} (4-Kutup)` },
                { id: 'p_kw', label: 'Rated Power Pn', labelTr: 'Anma Gücü Pn', value: spec.kw.toFixed(2), unit: 'kW' },
                { id: 'speed', label: 'Full Load Speed n', labelTr: 'Tam Yük Devri n', value: spec.rpm, unit: 'rpm' },
                { id: 'torque', label: 'Nominal Torque Tn', labelTr: 'Anma Torku Tn', value: spec.nominalTorque.toFixed(1), unit: 'N·m', formula: '9550 · P / n' },
                { id: 'amps', label: 'Full Load Current In (400V)', labelTr: 'Tam Yük Akımı In (400V)', value: spec.inAmps400V.toFixed(2), unit: 'A' },
                { id: 'eff', label: 'IE3 Premium Efficiency', labelTr: 'IE3 Premium Verim', value: `${spec.efficiencyIE3.toFixed(1)}% (cosφ=${spec.cosPhi})` },
                { id: 'shaft', label: 'Shaft Spec (DIN 6885-1)', labelTr: 'Mil ve Kama Ölçüsü', value: `Ø${spec.dShaft}×${spec.lShaft} mm` },
                { id: 'mount', label: 'Mounting Config', labelTr: 'Bağlantı Şekli', value: `${p.mounting || 'B3'} (${p.mounting === 'B5' ? `Flanş Ø${spec.dFlangeB5}mm` : `Ayak ${spec.aFoot}×${spec.bFoot}mm`})` },
            ];
        },
    },

    // ─── 16. YILMAZ REDÜKTÖR INDUSTRIAL GEARBOX (M & K SERIES / ISO 6336) ───
    'dyn_yilmaz_gearbox': {
        blockId: 'dyn_yilmaz_gearbox',
        name: 'Yılmaz Redüktör Helical Gearbox',
        nameTr: 'Yılmaz Redüktör (M / K Endüstriyel Dişli Kutusu)',
        calculatorRoute: '/gears/',
        calculatorLabel: 'Gearbox Ratio, Torque & Service Factor Solver (ISO 6336 / Yılmaz)',
        calculatorLabelTr: 'Redüktör Tahvil, Tork ve Servis Faktörü Çözücüsü (ISO 6336)',
        flowSchemaId: 'mech-gear-speed-ratio',
        standard: 'ISO 6336:2019 / DIN 3990 / Yılmaz Redüktör San. A.Ş.',
        standardTier: 1,
        buildCalculatorQuery: (p) => ({
            model: p.gearboxModel || 'M04',
            ratio: p.ratio || 20,
            inputKw: p.inputPowerKw || 5.5,
            inputRpm: p.inputSpeedRpm || 1450,
        }),
        buildFlowInputs: (p) => {
            const spec = YILMAZ_CATALOG[p.gearboxModel] || YILMAZ_CATALOG['M04'];
            const i = Number(p.ratio) || 20;
            const p1 = Number(p.inputPowerKw) || 5.5;
            const n1 = Number(p.inputSpeedRpm) || 1450;
            const n2 = n1 / i;
            const eta = 0.96;
            const t2 = (9550 * p1 * eta) / n2;
            return {
                reduction_ratio: i,
                input_power_kw: p1,
                input_speed_rpm: n1,
                output_speed_rpm: n2,
                output_torque_nm: t2,
                max_allowable_torque_nm: spec.maxTorqueNm,
                service_factor: spec.maxTorqueNm / t2,
            };
        },
        fromFlowData: (inputs, _outputs) => ({
            gearboxModel: inputs.gearbox_model ?? 'M04',
            ratio: inputs.reduction_ratio ?? 20,
            inputPowerKw: inputs.input_power_kw ?? 5.5,
        }),
        computeLiveMetrics: (p) => {
            const modelKey = String(p.gearboxModel || 'M04');
            const spec = YILMAZ_CATALOG[modelKey] || YILMAZ_CATALOG['M04'];
            const i = Number(p.ratio) || 20;
            const p1 = Number(p.inputPowerKw) || 5.5;
            const n1 = Number(p.inputSpeedRpm) || 1450;
            const eta = 0.96; // 2/3 stage helical efficiency
            const n2 = n1 / i;
            const t2 = (9550 * p1 * eta) / n2;
            const sf = spec.maxTorqueNm / Math.max(1, t2);

            return [
                { id: 'model', label: 'Yılmaz Gearbox Model', labelTr: 'Yılmaz Redüktör Modeli', value: `Yılmaz ${spec.model} (${spec.series === 'K' ? '90° Konik-Helisel' : 'Helisel Ayaklı'})` },
                { id: 'ratio', label: 'Reduction Ratio (i)', labelTr: 'Tahvil Oranı (i)', value: `${i.toFixed(1)}:1` },
                { id: 'n2', label: 'Output Speed n2', labelTr: 'Çıkış Devri n2', value: n2.toFixed(1), unit: 'rpm', formula: 'n1 / i' },
                { id: 't2', label: 'Output Torque T2', labelTr: 'Çıkış Torku T2', value: t2.toFixed(1), unit: 'N·m', formula: '9550 · P1 · η / n2' },
                { id: 't2max', label: 'Permissible Max Torque T2max', labelTr: 'İzin Verilen Azami Tork T2max', value: spec.maxTorqueNm, unit: 'N·m' },
                { id: 'sf', label: 'Calculated Service Factor fs', labelTr: 'İşletme Katsayısı (Servis Faktörü)', value: `${sf.toFixed(2)} (${sf >= 1.2 ? 'Güvenli / Safe' : 'Düşük / Low'})`, formula: 'T2max / T2' },
                { id: 'shaft2', label: 'Output Shaft Diameter', labelTr: 'Çıkış Mili Çapı d2', value: `Ø${spec.dOutput}×${spec.lOutput} mm` },
                { id: 'fr2', label: 'Max Permissible Radial Load Fr2', labelTr: 'İzin Verilen Radyal Yük Fr2', value: spec.frMaxKn.toFixed(1), unit: 'kN' },
            ];
        },
    },

    // ─── 17. STRUCTURAL ALUMINUM BEAM (I, H & T SECTIONS - EN 755 / EUROCODE 9) ───
    'dyn_aluminum_profile': {
        blockId: 'dyn_aluminum_profile',
        name: 'Structural Aluminum Extruded Beam (I/H/T)',
        nameTr: 'Alüminyum Yapısal Kiriş (I / H / T Kesit - EN 755)',
        calculatorRoute: '/beam-deflection/',
        calculatorLabel: 'Aluminum Beam Deflection & Stress (Eurocode 9 / EN 755)',
        calculatorLabelTr: 'Alüminyum Kiriş Sehim ve Gerilme Çözücüsü (Eurocode 9)',
        flowSchemaId: 'mech-beam-deflection',
        standard: 'EN 755-9 / DIN 1748 / Eurocode 9 (EN 1999-1-1)',
        standardTier: 1,
        buildCalculatorQuery: (p) => {
            const spec = ALU_PROFILES_DB[p.profileId] || ALU_PROFILES_DB['Alu I 100x50x5'];
            return {
                profile: spec.id,
                h: spec.h,
                b: spec.b,
                tw: spec.tw,
                tf: spec.tf,
                length: p.length || 1000,
                emodulus: 70000,
            };
        },
        buildFlowInputs: (p) => {
            const spec = ALU_PROFILES_DB[p.profileId] || ALU_PROFILES_DB['Alu I 100x50x5'];
            return {
                length_mm: Number(p.length) || 1000,
                height_mm: spec.h,
                flange_width_mm: spec.b,
                web_thickness_mm: spec.tw,
                flange_thickness_mm: spec.tf,
                mass_per_m_kg: spec.massKgM,
            };
        },
        fromFlowData: (inputs, _outputs) => ({
            profileId: inputs.profile_id ?? 'Alu I 100x50x5',
            length: inputs.length_mm ?? 1000,
        }),
        computeLiveMetrics: (p) => {
            const profileId = String(p.profileId || 'Alu I 100x50x5');
            const spec = ALU_PROFILES_DB[profileId] || ALU_PROFILES_DB['Alu I 100x50x5'];
            const lengthMm = Number(p.length) || 1000;
            const totalMass = spec.massKgM * (lengthMm / 1000);

            // Moment of Inertia Ix for I/H section:
            let Ix_cm4 = 0;
            let Iy_cm4 = 0;
            let Wx_cm3 = 0;

            if (spec.type === 'I' || spec.type === 'H') {
                const hw = spec.h - 2 * spec.tf;
                const Ix_mm4 = (spec.b * Math.pow(spec.h, 3) - (spec.b - spec.tw) * Math.pow(hw, 3)) / 12;
                const Iy_mm4 = (2 * spec.tf * Math.pow(spec.b, 3) + hw * Math.pow(spec.tw, 3)) / 12;
                Ix_cm4 = Ix_mm4 / 10000;
                Iy_cm4 = Iy_mm4 / 10000;
                Wx_cm3 = (Ix_mm4 / (spec.h / 2)) / 1000;
            } else {
                // T profile: area = b*tf + (h-tf)*tw
                const hw = spec.h - spec.tf;
                const aFlange = spec.b * spec.tf;
                const aWeb = hw * spec.tw;
                const A = aFlange + aWeb;
                const cy = (aFlange * (spec.h - spec.tf / 2) + aWeb * (hw / 2)) / A;
                const Ix_mm4 = (spec.b * Math.pow(spec.tf, 3)) / 12 + aFlange * Math.pow(spec.h - spec.tf / 2 - cy, 2)
                             + (spec.tw * Math.pow(hw, 3)) / 12 + aWeb * Math.pow(cy - hw / 2, 2);
                Ix_cm4 = Ix_mm4 / 10000;
                Iy_cm4 = ((spec.tf * Math.pow(spec.b, 3)) + hw * Math.pow(spec.tw, 3)) / (12 * 10000);
                Wx_cm3 = (Ix_mm4 / Math.max(cy, spec.h - cy)) / 1000;
            }

            // Eurocode 9 bending design moment MRd = Wx * fo / gamma_M0 (Alloy 6082-T6 fo=260 MPa, gamma_M0=1.1)
            const MRd_kNm = (Wx_cm3 * 1000 * (260 / 1.1)) / 1e6;

            return [
                { id: 'spec', label: 'Section Dimensions', labelTr: 'Kesit Ölçüleri', value: `${spec.id} (${spec.h}×${spec.b}×${spec.tw}/${spec.tf} mm)` },
                { id: 'alloy', label: 'Aluminum Alloy', labelTr: 'Alüminyum Alaşımı', value: 'EN AW-6082-T6 (Eurocode 9)' },
                { id: 'mass_m', label: 'Linear Mass', labelTr: 'Birim Ağırlık', value: spec.massKgM.toFixed(2), unit: 'kg/m' },
                { id: 'mass_tot', label: 'Total Weight', labelTr: 'Toplam Ağırlık', value: totalMass.toFixed(2), unit: 'kg' },
                { id: 'ix', label: 'Moment of Inertia Ix', labelTr: 'Atalet Momenti Ix', value: Ix_cm4.toFixed(1), unit: 'cm⁴' },
                { id: 'iy', label: 'Moment of Inertia Iy', labelTr: 'Atalet Momenti Iy', value: Iy_cm4.toFixed(1), unit: 'cm⁴' },
                { id: 'wx', label: 'Section Modulus Wx', labelTr: 'Mukavemet Momenti Wx', value: Wx_cm3.toFixed(1), unit: 'cm³' },
                { id: 'mrd', label: 'Eurocode 9 Bending MRd', labelTr: 'Eğilme Momenti Kapasitesi MRd', value: MRd_kNm.toFixed(2), unit: 'kN·m', formula: 'Wx · fo / γM0' },
            ];
        },
    },
};

/**
 * Registry helper: Retrieve mesh link for a dynamic block
 */
export function getBlockMeshLink(blockId: string): BlockMeshLink | undefined {
    return BLOCK_ENGINEERING_MESH[blockId];
}

/**
 * Generate full URL with search params for dedicated calculator
 */
export function buildCalculatorUrlWithParams(blockId: string, params: Record<string, any>): string {
    const mesh = getBlockMeshLink(blockId);
    if (!mesh) return '/';
    const query = mesh.buildCalculatorQuery(params);
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) {
            qs.set(k, String(v));
        }
    }
    const cleanRoute = mesh.calculatorRoute.endsWith('/') ? mesh.calculatorRoute : `${mesh.calculatorRoute}/`;
    return `${cleanRoute}?${qs.toString()}`;
}
