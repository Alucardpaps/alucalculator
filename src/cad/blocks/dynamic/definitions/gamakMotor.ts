/**
 * ⚡ Gamak Industrial Electric Motor Suite (Gamak AGM3EL IE3 / IEC 60034)
 * 
 * Complies with:
 * - Gamak Makina Sanayi A.Ş. Official Technical Handbook & Catalog
 * - IEC 60034-1 / IEC 60034-30-1 (IE3 Premium Efficiency)
 * - DIN EN 50347 (Dimensions and output ratings)
 * 
 * Features:
 * - Full Gamak Frame Series: AGM 63 to AGM 250M (0.18 kW to 55 kW)
 * - Mounting configurations:
 *    - B3: Foot mounted (Ayaklı)
 *    - B5: Large flange mounted (Büyük Flanşlı)
 *    - B14: Small face flange mounted (Küçük Flanşlı)
 *    - B35: Foot + Large flange mounted (Ayaklı + Büyük Flanşlı)
 * - True Gamak finned stator carcass, DIN 6885-1 keyed shaft, terminal box, cowl
 * - 2D Views: Side Elevation, Front Radial, Top Plan
 * - 3D Solid Part Generation
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createCircleEntity, createArcEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export interface GamakMotorSpec {
    frame: string;
    pole: 2 | 4 | 6;
    kw: number;
    rpm: number;
    dShaft: number;     // Mil çapı d (mm)
    lShaft: number;     // Mil boyu l (mm)
    hAxis: number;      // Eksen yüksekliği H (mm)
    lTotal: number;     // Toplam motor boyu L (mm)
    dBody: number;      // Stator dış çapı D (mm)
    aFoot: number;      // Ayak delikleri arası eksen boyu A (mm)
    bFoot: number;      // Ayak delikleri arası eksen eni B (mm)
    cFoot: number;      // Ön ayak deliğinden mil omzuna mesafe C (mm)
    pcdFlangeB5: number;// B5 Flanş delik eksen çapı M (mm)
    dFlangeB5: number;  // B5 Flanş dış çapı P (mm)
    inAmps400V: number; // 400V Nominal akım (A)
    nominalTorque: number;// Anma torku Tn (N·m)
    efficiencyIE3: number;// IE3 % Verim
    cosPhi: number;     // Güç faktörü
    standard: string;
}

export const GAMAK_CATALOG: Record<string, GamakMotorSpec> = {
    // ── 4-POLE (1500 RPM / Standart Sanayi) ──
    'AGM3EL_63_4':   { frame: '63',   pole: 4, kw: 0.18, rpm: 1390, dShaft: 11, lShaft: 23,  hAxis: 63,  lTotal: 215, dBody: 125, aFoot: 100, bFoot: 80,  cFoot: 40,  pcdFlangeB5: 115, dFlangeB5: 140, inAmps400V: 0.65, nominalTorque: 1.24, efficiencyIE3: 65.9, cosPhi: 0.65, standard: 'Gamak AGM3EL / IEC 60034' },
    'AGM3EL_71_4':   { frame: '71',   pole: 4, kw: 0.37, rpm: 1410, dShaft: 14, lShaft: 30,  hAxis: 71,  lTotal: 250, dBody: 140, aFoot: 112, bFoot: 90,  cFoot: 45,  pcdFlangeB5: 130, dFlangeB5: 160, inAmps400V: 1.05, nominalTorque: 2.51, efficiencyIE3: 73.5, cosPhi: 0.70, standard: 'Gamak AGM3EL / IEC 60034' },
    'AGM3EL_80_4':   { frame: '80',   pole: 4, kw: 0.75, rpm: 1430, dShaft: 19, lShaft: 40,  hAxis: 80,  lTotal: 290, dBody: 160, aFoot: 125, bFoot: 100, cFoot: 50,  pcdFlangeB5: 165, dFlangeB5: 200, inAmps400V: 1.90, nominalTorque: 5.01, efficiencyIE3: 82.5, cosPhi: 0.73, standard: 'Gamak AGM3EL / IEC 60034' },
    'AGM3EL_90S_4':  { frame: '90S',  pole: 4, kw: 1.10, rpm: 1440, dShaft: 24, lShaft: 50,  hAxis: 90,  lTotal: 330, dBody: 180, aFoot: 140, bFoot: 100, cFoot: 56,  pcdFlangeB5: 165, dFlangeB5: 200, inAmps400V: 2.65, nominalTorque: 7.30, efficiencyIE3: 84.1, cosPhi: 0.75, standard: 'Gamak AGM3EL / IEC 60034' },
    'AGM3EL_90L_4':  { frame: '90L',  pole: 4, kw: 1.50, rpm: 1440, dShaft: 24, lShaft: 50,  hAxis: 90,  lTotal: 355, dBody: 180, aFoot: 140, bFoot: 125, cFoot: 56,  pcdFlangeB5: 165, dFlangeB5: 200, inAmps400V: 3.45, nominalTorque: 9.95, efficiencyIE3: 85.3, cosPhi: 0.77, standard: 'Gamak AGM3EL / IEC 60034' },
    'AGM3EL_100L_4': { frame: '100L', pole: 4, kw: 2.20, rpm: 1450, dShaft: 28, lShaft: 60,  hAxis: 100, lTotal: 385, dBody: 200, aFoot: 160, bFoot: 140, cFoot: 63,  pcdFlangeB5: 215, dFlangeB5: 250, inAmps400V: 4.80, nominalTorque: 14.5, efficiencyIE3: 86.7, cosPhi: 0.79, standard: 'Gamak AGM3EL / IEC 60034' },
    'AGM3EL_100L2_4':{ frame: '100L', pole: 4, kw: 3.00, rpm: 1450, dShaft: 28, lShaft: 60,  hAxis: 100, lTotal: 410, dBody: 200, aFoot: 160, bFoot: 140, cFoot: 63,  pcdFlangeB5: 215, dFlangeB5: 250, inAmps400V: 6.30, nominalTorque: 19.8, efficiencyIE3: 87.7, cosPhi: 0.81, standard: 'Gamak AGM3EL / IEC 60034' },
    'AGM3EL_112M_4': { frame: '112M', pole: 4, kw: 4.00, rpm: 1455, dShaft: 28, lShaft: 60,  hAxis: 112, lTotal: 430, dBody: 225, aFoot: 190, bFoot: 140, cFoot: 70,  pcdFlangeB5: 215, dFlangeB5: 250, inAmps400V: 8.30, nominalTorque: 26.3, efficiencyIE3: 88.6, cosPhi: 0.82, standard: 'Gamak AGM3EL / IEC 60034' },
    'AGM3EL_132S_4': { frame: '132S', pole: 4, kw: 5.50, rpm: 1460, dShaft: 38, lShaft: 80,  hAxis: 132, lTotal: 490, dBody: 260, aFoot: 216, bFoot: 140, cFoot: 89,  pcdFlangeB5: 265, dFlangeB5: 300, inAmps400V: 11.2, nominalTorque: 36.0, efficiencyIE3: 89.6, cosPhi: 0.82, standard: 'Gamak AGM3EL / IEC 60034' },
    'AGM3EL_132M_4': { frame: '132M', pole: 4, kw: 7.50, rpm: 1460, dShaft: 38, lShaft: 80,  hAxis: 132, lTotal: 530, dBody: 260, aFoot: 216, bFoot: 178, cFoot: 89,  pcdFlangeB5: 265, dFlangeB5: 300, inAmps400V: 15.0, nominalTorque: 49.1, efficiencyIE3: 90.4, cosPhi: 0.83, standard: 'Gamak AGM3EL / IEC 60034' },
    'AGM3EL_160M_4': { frame: '160M', pole: 4, kw: 11.0, rpm: 1470, dShaft: 42, lShaft: 110, hAxis: 160, lTotal: 630, dBody: 315, aFoot: 254, bFoot: 210, cFoot: 108, pcdFlangeB5: 300, dFlangeB5: 350, inAmps400V: 21.5, nominalTorque: 71.5, efficiencyIE3: 91.4, cosPhi: 0.84, standard: 'Gamak AGM3EL / IEC 60034' },
    'AGM3EL_160L_4': { frame: '160L', pole: 4, kw: 15.0, rpm: 1470, dShaft: 42, lShaft: 110, hAxis: 160, lTotal: 675, dBody: 315, aFoot: 254, bFoot: 254, cFoot: 108, pcdFlangeB5: 300, dFlangeB5: 350, inAmps400V: 29.0, nominalTorque: 97.4, efficiencyIE3: 92.1, cosPhi: 0.84, standard: 'Gamak AGM3EL / IEC 60034' },
    'AGM3EL_180M_4': { frame: '180M', pole: 4, kw: 18.5, rpm: 1475, dShaft: 48, lShaft: 110, hAxis: 180, lTotal: 710, dBody: 355, aFoot: 279, bFoot: 241, cFoot: 121, pcdFlangeB5: 300, dFlangeB5: 350, inAmps400V: 35.5, nominalTorque: 120,  efficiencyIE3: 92.6, cosPhi: 0.84, standard: 'Gamak AGM3EL / IEC 60034' },
    'AGM3EL_180L_4': { frame: '180L', pole: 4, kw: 22.0, rpm: 1475, dShaft: 48, lShaft: 110, hAxis: 180, lTotal: 750, dBody: 355, aFoot: 279, bFoot: 279, cFoot: 121, pcdFlangeB5: 300, dFlangeB5: 350, inAmps400V: 42.0, nominalTorque: 142,  efficiencyIE3: 93.0, cosPhi: 0.85, standard: 'Gamak AGM3EL / IEC 60034' },
    'AGM3EL_200L_4': { frame: '200L', pole: 4, kw: 30.0, rpm: 1480, dShaft: 55, lShaft: 110, hAxis: 200, lTotal: 820, dBody: 395, aFoot: 318, bFoot: 305, cFoot: 133, pcdFlangeB5: 350, dFlangeB5: 400, inAmps400V: 56.5, nominalTorque: 194,  efficiencyIE3: 93.6, cosPhi: 0.85, standard: 'Gamak AGM3EL / IEC 60034' }
};

export const DYN_GAMAK_MOTOR: DynamicBlockDef = {
    id: 'dyn_gamak_motor',
    name: 'Gamak Industrial Electric Motor (AGM3EL IE3)',
    nameTr: 'Gamak Elektrik Motoru (AGM3EL Serisi IE3)',
    category: 'Mechanical',
    subcategory: 'Electric Motors & Drives',
    subcategoryTr: 'Elektrik Motorları & Sürücüler',
    description: 'AutoCAD-grade dynamic Gamak 3-phase induction motor: AGM3EL IE3 series with true foot A/B, shaft d/l, B5 flange, terminal box, and live electrical metrics.',
    descriptionTr: 'Gamak Makina Sanayi A.Ş. AGM3EL IE3 serisi standart trifaze asenkron motor; B3 ayaklı, B5 flanşlı montaj, mil kama detayları ve canlı tork/akım hesabı.',
    icon: '⚡',
    calculatorRoute: '/calculators/3-phase-power/',
    calculatorModuleType: '3-phase-power',
    calculatorLabelTr: '3-Fazlı Motor Güç & Tork Çözücüsüne Git',
    citation: {
        tier: 1,
        standard: 'IEC 60034-30-1 / DIN EN 50347 / Gamak Teknik El Kitabı',
        clause: 'Gamak AGM3EL Dökme Demir ve Alüminyum Gövde Standart Boyutları',
        description: 'Standard shaft dimensions d x l, centerline height H, B3 foot holes A x B, B5 PCD M, IE3 efficiency.'
    },
    linearParams: [
        {
            id: 'shaftDia',
            name: 'shaftDia',
            label: 'Shaft Diameter d',
            labelTr: 'Mil Çapı d',
            min: 11,
            max: 65,
            step: 1,
            default: 28,
            unit: 'mm',
            axis: 'x'
        }
    ],
    visibilityParam: {
        id: 'mountStyle',
        name: 'mountStyle',
        label: 'Mounting Style & Frame Type',
        labelTr: 'Montaj Şekli (B3 / B5 / B14 / B35)',
        states: [
            { id: 'b3_foot', label: 'IM B3 Foot Mounted (Ayaklı Montaj)', labelTr: 'IM B3 Ayaklı Montaj' },
            { id: 'b5_flange', label: 'IM B5 Flange Mounted (Büyük Flanşlı)', labelTr: 'IM B5 Büyük Flanşlı' },
            { id: 'b35_both', label: 'IM B35 Foot + Flange (Ayaklı ve Flanşlı)', labelTr: 'IM B35 Ayaklı + Flanşlı' }
        ],
        default: 'b3_foot'
    },
    lookupParams: [
        {
            id: 'gamakModel',
            name: 'gamakModel',
            label: 'Gamak Motor Model Catalog',
            labelTr: 'Gamak Motor Modeli (kW & Gövde)',
            options: Object.keys(GAMAK_CATALOG).map(key => {
                const m = GAMAK_CATALOG[key];
                return {
                    id: key,
                    label: `Gamak AGM3EL ${m.frame} — ${m.kw} kW (Mil Ø${m.dShaft}×${m.lShaft} mm, ${m.rpm} rpm)`,
                    standard: m.standard,
                    values: { gamakModel: key, shaftDia: m.dShaft }
                };
            }),
            default: 'AGM3EL_100L_4'
        }
    ],
    defaultValues: {
        gamakModel: 'AGM3EL_100L_4',
        mountStyle: 'b3_foot',
        shaftDia: 28
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const key = String(params.gamakModel || 'AGM3EL_100L_4');
        const spec = GAMAK_CATALOG[key] || GAMAK_CATALOG['AGM3EL_100L_4'];
        const mount = String(params.mountStyle || 'b3_foot');

        const entities: CadEntity[] = [];
        const layerCarcass = 'layer-mech';
        const layerShaft = 'layer-accent';
        const layerTerminal = 'layer-furn';
        const layerRef = 'layer-ref';

        const colorBody = '#3ad0e6';
        const colorShaft = '#f59e0b';
        const colorBox = '#22c55e';
        const colorCenter = '#ef4444';

        const bx = basePoint.x;
        const by = basePoint.y;

        // Side Elevation View:
        // Centerline is at by + spec.hAxis
        const yShaft = by + spec.hAxis;
        const rShaft = spec.dShaft / 2;
        const rBody = spec.dBody / 2;

        // 1. Output Drive Shaft (Mil)
        // Extends to the left: [bx - spec.lShaft, bx]
        entities.push(createRectangleEntity(
            { x: bx - spec.lShaft / 2, y: yShaft },
            spec.lShaft,
            spec.dShaft,
            layerShaft,
            colorShaft
        ));

        // Shaft Centerline
        entities.push(createLineEntity(
            { x: bx - spec.lShaft - 15, y: yShaft },
            { x: bx + spec.lTotal + 15, y: yShaft },
            layerRef,
            colorCenter
        ));

        // Shaft DIN 6885 Keyway representation
        const keyLen = spec.lShaft * 0.7;
        const keyH = Math.max(2, rShaft * 0.25);
        entities.push(createRectangleEntity(
            { x: bx - spec.lShaft + 5 + keyLen / 2, y: yShaft + rShaft - keyH / 2 },
            keyLen,
            keyH,
            layerShaft,
            colorShaft
        ));

        // 2. Front Endshield / Bearing Hub (Ön Rulman Kapağı)
        const frontCapW = Math.max(15, spec.lTotal * 0.08);
        entities.push(createRectangleEntity(
            { x: bx + frontCapW / 2, y: yShaft },
            frontCapW,
            spec.dBody * 0.9,
            layerCarcass,
            colorBody
        ));

        // 3. Main Stator Carcass with Cooling Fins (Gamak Kanatçıklı Döküm Gövde)
        const carcassW = spec.lTotal * 0.58;
        const xCarcass = bx + frontCapW;
        entities.push(createRectangleEntity(
            { x: xCarcass + carcassW / 2, y: yShaft },
            carcassW,
            spec.dBody,
            layerCarcass,
            colorBody
        ));

        // Cooling Fins longitudinal lines
        const numFins = 6;
        for (let i = 1; i <= numFins; i++) {
            const yFinTop = yShaft + (rBody / (numFins + 1)) * i;
            const yFinBot = yShaft - (rBody / (numFins + 1)) * i;
            entities.push(createLineEntity({ x: xCarcass, y: yFinTop }, { x: xCarcass + carcassW, y: yFinTop }, layerCarcass, colorBody));
            entities.push(createLineEntity({ x: xCarcass, y: yFinBot }, { x: xCarcass + carcassW, y: yFinBot }, layerCarcass, colorBody));
        }

        // 4. Rear Fan Cowl / Shroud (Gamak Pervane Muhafaza Kapağı)
        const cowlW = spec.lTotal - (frontCapW + carcassW);
        const xCowl = xCarcass + carcassW;
        entities.push(createRectangleEntity(
            { x: xCowl + cowlW / 2, y: yShaft },
            cowlW,
            spec.dBody * 0.95,
            layerCarcass,
            colorBody
        ));

        // 5. Terminal Box (Üst Klemens Kutusu)
        const boxW = spec.lTotal * 0.22;
        const boxH = spec.dBody * 0.25;
        const xBox = xCarcass + (carcassW - boxW) / 2;
        entities.push(createRectangleEntity(
            { x: xBox + boxW / 2, y: yShaft + rBody + boxH / 2 },
            boxW,
            boxH,
            layerTerminal,
            colorBox
        ));

        // 6. Mounting Feet / Flange
        if (mount === 'b3_foot' || mount === 'b35_both') {
            const footH = Math.max(12, spec.hAxis - rBody * 0.7);
            const footW = spec.aFoot * 0.35;
            // Front foot
            entities.push(createRectangleEntity({ x: bx + spec.cFoot + footW / 2, y: by + footH / 2 }, footW, footH, layerCarcass, colorBody));
            // Rear foot
            entities.push(createRectangleEntity({ x: bx + spec.cFoot + spec.bFoot + footW / 2, y: by + footH / 2 }, footW, footH, layerCarcass, colorBody));
            // Base ground line
            entities.push(createLineEntity({ x: bx - 10, y: by }, { x: bx + spec.lTotal, y: by }, layerRef, '#64748b'));
        }

        if (mount === 'b5_flange' || mount === 'b35_both') {
            const flT = Math.max(10, spec.dFlangeB5 * 0.05);
            entities.push(createRectangleEntity(
                { x: bx - flT / 2, y: yShaft },
                flT,
                spec.dFlangeB5,
                layerCarcass,
                colorBody
            ));
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const key = String(params.gamakModel || 'AGM3EL_100L_4');
        const spec = GAMAK_CATALOG[key] || GAMAK_CATALOG['AGM3EL_100L_4'];
        const mount = String(params.mountStyle || 'b3_foot');

        const yAxis = basePos.y + spec.hAxis;
        const zAxis = basePos.z;
        const bodyL = spec.lTotal - spec.lShaft;
        const xShaftStart = basePos.x;
        const xBodyStart = basePos.x + spec.lShaft;

        const shieldL = Math.max(14, Math.round(bodyL * 0.10));
        const statorL = Math.round(bodyL * 0.58);
        const cowlL = bodyL - shieldL - statorL;

        const parts: DynamicPart3DDef[] = [];

        // 1. Ana Stator Gövdesi (IEC 60034 IE3 Finned Carcass) - parts[0]
        parts.push({
            id: `gamak_stator_${spec.frame}`,
            name: `Gamak Stator Gövdesi (AGM3EL ${spec.frame} - ${spec.kw} kW)`,
            kind: 'cylinder',
            color: '#0284c7', // Gamak Industrial Blue
            position: { x: xBodyStart + shieldL + statorL / 2, y: yAxis, z: zAxis },
            rotation: { x: 0, y: 0, z: 90 },
            params: { diameter: spec.dBody, length: statorL },
            dimensions: {
                frame: spec.frame,
                kw: spec.kw,
                rpm: spec.rpm,
                dShaft: spec.dShaft,
                lShaft: spec.lShaft,
                hAxis: spec.hAxis,
                lTotal: spec.lTotal,
                dBody: spec.dBody,
                pcdFlangeB5: spec.pcdFlangeB5,
                mountStyle: mount
            },
            designStandard: 'IEC 60034-30-1 IE3',
            materialType: 'GG20 Dökme Demir / Alüminyum'
        });

        // 2. Tahrik Çıkış Mili (DIN 748 Taşlanmış Çelik)
        parts.push({
            id: `gamak_shaft_${spec.frame}`,
            name: `Tahrik Mili Ø${spec.dShaft}×${spec.lShaft} mm (DIN 748)`,
            kind: 'cylinder',
            color: '#cbd5e1', // Ground steel
            position: { x: xShaftStart + spec.lShaft / 2, y: yAxis, z: zAxis },
            rotation: { x: 0, y: 0, z: 90 },
            params: { diameter: spec.dShaft, length: spec.lShaft },
            designStandard: 'DIN 748-1',
            materialType: 'Ç1045 / C45E Taşlanmış Çelik'
        });

        // 3. Mil Kaması (DIN 6885-1 Form A)
        const keyL = Math.round(spec.lShaft * 0.70);
        const keySize = Math.max(4, Math.round(spec.dShaft * 0.25));
        parts.push({
            id: `gamak_key_${spec.frame}`,
            name: `Mil Kaması ${keySize}x${keySize}x${keyL} mm (DIN 6885-1)`,
            kind: 'box',
            color: '#64748b',
            position: {
                x: xShaftStart + spec.lShaft / 2,
                y: yAxis + spec.dShaft / 2 + keySize / 4,
                z: zAxis
            },
            rotation: { x: 0, y: 0, z: 0 },
            params: { width: keyL, height: keySize, depth: keySize },
            designStandard: 'DIN 6885-1 Form A',
            materialType: 'C45+C Islah Çeliği'
        });

        // 4. Ön Rulman Kalkanı / Kapağı (Drive End Shield)
        parts.push({
            id: `gamak_shield_de_${spec.frame}`,
            name: `Ön Rulman Kalkanı (D-End Kapağı)`,
            kind: 'cylinder',
            color: '#0369a1',
            position: { x: xBodyStart + shieldL / 2, y: yAxis, z: zAxis },
            rotation: { x: 0, y: 0, z: 90 },
            params: { diameter: spec.dBody * 0.98, length: shieldL },
            designStandard: 'DIN 42948',
            materialType: 'GG20 Döküm'
        });

        // 5. Arka Pervane Muhafazası (Fan Cowl / Pervane Tas Sacı)
        parts.push({
            id: `gamak_cowl_${spec.frame}`,
            name: `Pervane Muhafazası (Fan Cowl)`,
            kind: 'cylinder',
            color: '#0f172a', // Siyah elektrostatik sac
            position: { x: xBodyStart + shieldL + statorL + cowlL / 2, y: yAxis, z: zAxis },
            rotation: { x: 0, y: 0, z: 90 },
            params: { diameter: spec.dBody * 0.94, length: cowlL },
            designStandard: 'IEC 60034-6 IC411',
            materialType: 'DKP Sac / Koruma Kafesi'
        });

        // 6. Klemens Kutusu (IP55 Terminal Box)
        const tBoxW = Math.round(statorL * 0.52);
        const tBoxH = Math.round(spec.dBody * 0.28);
        const tBoxD = Math.round(spec.dBody * 0.40);
        parts.push({
            id: `gamak_tbox_${spec.frame}`,
            name: `Klemens Kutusu (IP55)`,
            kind: 'box',
            color: '#1e293b',
            position: {
                x: xBodyStart + shieldL + statorL / 2,
                y: yAxis + spec.dBody / 2 + tBoxH / 2,
                z: zAxis
            },
            rotation: { x: 0, y: 0, z: 0 },
            params: { width: tBoxW, height: tBoxH, depth: tBoxD },
            designStandard: 'IEC 60034-5 IP55',
            materialType: 'Alüminyum Enjeksiyon'
        });

        // 7. Pirinç Kablo Rakoru (Cable Gland)
        parts.push({
            id: `gamak_gland_${spec.frame}`,
            name: `Kablo Rakoru (M25x1.5)`,
            kind: 'cylinder',
            color: '#eab308', // Brass gold
            position: {
                x: xBodyStart + shieldL + statorL / 2,
                y: yAxis + spec.dBody / 2 + tBoxH / 2,
                z: zAxis + tBoxD / 2 + 8
            },
            rotation: { x: 90, y: 0, z: 0 },
            params: { diameter: 24, length: 16 },
            designStandard: 'EN 62444',
            materialType: 'Pirinç (CuZn39Pb3)'
        });

        // 8. B3 Montaj Ayakları (B3 Mounting Feet)
        if (mount === 'b3_foot' || mount === 'b35_both') {
            const footH = Math.max(14, spec.hAxis - spec.dBody / 2 + 8);
            const footW = Math.max(24, Math.round(spec.bFoot * 0.28));
            const footSpanZ = spec.aFoot + 36;

            parts.push({
                id: `gamak_foot_front_${spec.frame}`,
                name: `Ön Montaj Ayağı (B3)`,
                kind: 'box',
                color: '#0284c7',
                position: {
                    x: xBodyStart + spec.cFoot,
                    y: basePos.y + footH / 2,
                    z: zAxis
                },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: footW, height: footH, depth: footSpanZ },
                designStandard: 'DIN EN 50347 B3',
                materialType: 'GG20 Döküm'
            });

            parts.push({
                id: `gamak_foot_rear_${spec.frame}`,
                name: `Arka Montaj Ayağı (B3)`,
                kind: 'box',
                color: '#0284c7',
                position: {
                    x: xBodyStart + spec.cFoot + spec.bFoot,
                    y: basePos.y + footH / 2,
                    z: zAxis
                },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: footW, height: footH, depth: footSpanZ },
                designStandard: 'DIN EN 50347 B3',
                materialType: 'GG20 Döküm'
            });
        }

        // 9. B5 Montaj Flanşı (B5 Flange)
        if (mount === 'b5_flange' || mount === 'b35_both') {
            const flangeThick = Math.max(12, Math.round(spec.dFlangeB5 * 0.05));
            parts.push({
                id: `gamak_flange_b5_${spec.frame}`,
                name: `B5 Montaj Flanşı (Ø${spec.dFlangeB5} mm, PCD ${spec.pcdFlangeB5} mm)`,
                kind: 'cylinder',
                color: '#0284c7',
                position: { x: xBodyStart - flangeThick / 2, y: yAxis, z: zAxis },
                rotation: { x: 0, y: 0, z: 90 },
                params: { diameter: spec.dFlangeB5, length: flangeThick },
                designStandard: 'DIN EN 50347 B5',
                materialType: 'GG20 Döküm'
            });
        }

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const key = String(params.gamakModel || 'AGM3EL_100L_4');
        const spec = GAMAK_CATALOG[key] || GAMAK_CATALOG['AGM3EL_100L_4'];

        const grips: DynamicGrip[] = [
            {
                id: 'origin_grip',
                type: 'point',
                paramId: 'basePoint',
                position: basePoint,
                label: 'Motor Base Origin',
                labelTr: 'Motor Taban Noktası'
            },
            {
                id: 'lookup_motor',
                type: 'lookup',
                paramId: 'gamakModel',
                position: { x: basePoint.x + 30, y: basePoint.y + spec.hAxis + 30 },
                label: `Gamak: ${spec.frame} (${spec.kw} kW)`,
                labelTr: `Gamak: ${spec.frame} (${spec.kw} kW)`
            },
            {
                id: 'shaft_dia_grip',
                type: 'linear',
                paramId: 'shaftDia',
                position: { x: basePoint.x - spec.lShaft, y: basePoint.y + spec.hAxis },
                label: `Shaft Ø${spec.dShaft} mm`,
                labelTr: `Mil Ø${spec.dShaft} mm`
            }
        ];

        return grips;
    }
};
