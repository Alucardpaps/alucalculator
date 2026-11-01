/**
 * ⚡ Dynamic V-Belt Pulley Suite (DIN 2211 / ISO 4183)
 * 
 * AutoCAD-Grade Dynamic V-Belt Pulley:
 * - Profiles:
 *    - SPZ (9.7 x 8 mm - Kompakt Yüksek Hız)
 *    - SPA (12.7 x 10 mm - Standart Endüstriyel)
 *    - SPB (16.3 x 13 mm - Güçlü Ağır Sanayi)
 *    - SPC (22.0 x 18 mm - Ekstra Ağır Güç)
 * - Number of Grooves: 1 to 6 channels (Dynamic array stretch)
 * - Datum Diameter (dd): 63 mm to 630 mm
 * - Shaft Connection: Taper-Lock / DIN 6885 Keyway
 * - Views:
 *    - Axial Section (Yan Kesit — V-Kanal trapez profilleri, göbek, faturalar, kama kanalı)
 *    - Front Radial View (Ön Dairesel Görünüş — Bölüm dairesi, kollar, delik)
 * - 3D Solids: True multi-groove V-pulley solid
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createCircleEntity, createArcEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export interface VPulleyProfileSpec {
    lp: number;   // Pitch width (mm)
    b: number;    // Top width (mm)
    h: number;    // Groove depth (mm)
    e: number;    // Groove spacing (mm)
    f: number;    // Edge margin (mm)
    minDd: number;
}

export const V_PULLEY_SPECS: Record<string, VPulleyProfileSpec> = {
    'SPZ': { lp: 8.5,  b: 9.7,  h: 11.0, e: 12.0, f: 8.0,  minDd: 63 },
    'SPA': { lp: 11.0, b: 12.7, h: 13.8, e: 15.0, f: 10.0, minDd: 90 },
    'SPB': { lp: 14.0, b: 16.3, h: 17.5, e: 19.0, f: 12.5, minDd: 140 },
    'SPC': { lp: 19.0, b: 22.0, h: 23.8, e: 25.5, f: 17.0, minDd: 224 }
};

export const DYN_V_BELT_PULLEY: DynamicBlockDef = {
    id: 'dyn_v_belt_pulley',
    name: 'Dynamic V-Belt Pulley (DIN 2211 / ISO 4183)',
    nameTr: 'Dinamik V-Kayış Kasnağı (DIN 2211)',
    category: 'Mechanical',
    subcategory: 'Gears & Power Transmission',
    subcategoryTr: 'Dişli ve Güç Aktarımı',
    description: 'AutoCAD-grade dynamic narrow V-belt pulley: SPZ, SPA, SPB, SPC profiles with 1 to 6 grooves, axial section and front views.',
    descriptionTr: 'DIN 2211 ve ISO 4183 normunda 1-6 kanallı SPZ, SPA, SPB, SPC dar V-kayış kasnakları; eksenel kesit ve ön görünüş.',
    icon: '⚡',
    calculatorRoute: '/belt-drive/',
    calculatorModuleType: 'belt-drive',
    calculatorLabelTr: 'V-Kayış & Kasnak Hesabına Git (DIN 2211)',
    citation: {
        tier: 1,
        standard: 'DIN 2211 / ISO 4183 / BS 3790',
        clause: 'Grooved pulleys for narrow V-belts (Groove sections SPZ, SPA, SPB, SPC)',
        description: 'Standard groove geometry: angle 34°/38°, pitch spacing e, edge margin f, datum diameter dd.'
    },
    linearParams: [
        {
            id: 'grooves',
            name: 'grooves',
            label: 'Number of Grooves',
            labelTr: 'Kanal Sayısı',
            min: 1,
            max: 6,
            step: 1,
            default: 2,
            unit: 'adet',
            axis: 'x'
        },
        {
            id: 'datumDiameter',
            name: 'datumDiameter',
            label: 'Datum Diameter (dd)',
            labelTr: 'Hesap Çapı / Bölüm Çapı (dd)',
            min: 63,
            max: 630,
            step: 5,
            default: 160,
            unit: 'mm',
            axis: 'both'
        },
        {
            id: 'boreDiameter',
            name: 'boreDiameter',
            label: 'Shaft Bore Diameter (d)',
            labelTr: 'Mil / Göbek Delik Çapı (d)',
            min: 12,
            max: 90,
            step: 2,
            default: 28,
            unit: 'mm',
            axis: 'both'
        }
    ],
    visibilityParam: {
        id: 'viewMode',
        name: 'viewMode',
        label: 'Projection View Mode',
        labelTr: 'Görünüş / Kesit Tipi',
        states: [
            { id: 'axial_section', label: 'Axial Cross-Section (Mil Boyu Kesit)', labelTr: 'Mil Boyu Eksenel Kesit' },
            { id: 'radial_front', label: 'Radial Front View (Ön Dairesel Görünüş)', labelTr: 'Ön Dairesel Görünüş' }
        ],
        default: 'axial_section'
    },
    lookupParams: [
        {
            id: 'profileType',
            name: 'profileType',
            label: 'V-Belt Profile Standard',
            labelTr: 'V-Kayış Profil Standardı',
            options: [
                { id: 'SPZ', label: 'SPZ (9.7 x 8 mm — Min dd=63 mm)', values: { profileType: 'SPZ' } },
                { id: 'SPA', label: 'SPA (12.7 x 10 mm — Min dd=90 mm)', values: { profileType: 'SPA' } },
                { id: 'SPB', label: 'SPB (16.3 x 13 mm — Min dd=140 mm)', values: { profileType: 'SPB' } },
                { id: 'SPC', label: 'SPC (22.0 x 18 mm — Min dd=224 mm)', values: { profileType: 'SPC' } }
            ],
            default: 'SPA'
        }
    ],
    defaultValues: {
        profileType: 'SPA',
        grooves: 2,
        datumDiameter: 160,
        boreDiameter: 28,
        viewMode: 'axial_section'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const profKey = String(params.profileType || 'SPA');
        const spec = V_PULLEY_SPECS[profKey] || V_PULLEY_SPECS['SPA'];
        const grooves = Math.max(1, Math.min(6, Math.round(Number(params.grooves) || 2)));
        const dd = Math.max(spec.minDd, Number(params.datumDiameter) || 160);
        const bore = Math.max(10, Math.min(dd * 0.6, Number(params.boreDiameter) || 28));
        const viewMode = String(params.viewMode || 'axial_section');

        const faceW = (grooves - 1) * spec.e + 2 * spec.f;
        const da = dd + spec.b * 0.45; // Outside tip diameter
        const df = dd - (spec.h - spec.b * 0.45) * 2; // Root diameter
        const radOut = da / 2;
        const radBore = bore / 2;
        const radHub = Math.max(bore * 0.85, bore / 2 + 15);

        const entities: CadEntity[] = [];
        const layerRims = 'layer-mech';
        const layerGrooves = 'layer-accent';
        const layerRef = 'layer-ref';

        const colorBody = '#3ad0e6';
        const colorGroove = '#fb923c';
        const colorRef = '#64748b';

        if (viewMode === 'axial_section') {
            // Shaft Centerline
            entities.push(createLineEntity(
                { x: basePoint.x - faceW / 2 - 15, y: basePoint.y },
                { x: basePoint.x + faceW / 2 + 15, y: basePoint.y },
                layerRef,
                colorRef
            ));

            // Upper Half Rim
            entities.push(createRectangleEntity(
                { x: basePoint.x, y: basePoint.y + (radOut + radHub) / 2 },
                faceW,
                radOut - radHub,
                layerRims,
                colorBody
            ));

            // Lower Half Rim
            entities.push(createRectangleEntity(
                { x: basePoint.x, y: basePoint.y - (radOut + radHub) / 2 },
                faceW,
                radOut - radHub,
                layerRims,
                colorBody
            ));

            // Individual V-Grooves (Upper Half notches)
            for (let i = 0; i < grooves; i++) {
                const gx = basePoint.x - faceW / 2 + spec.f + i * spec.e;
                // V-Groove notch line indicators
                entities.push(createLineEntity(
                    { x: gx - spec.b / 2, y: basePoint.y + radOut },
                    { x: gx, y: basePoint.y + radOut - spec.h },
                    layerGrooves,
                    colorGroove
                ));
                entities.push(createLineEntity(
                    { x: gx + spec.b / 2, y: basePoint.y + radOut },
                    { x: gx, y: basePoint.y + radOut - spec.h },
                    layerGrooves,
                    colorGroove
                ));
                // Lower half V-Grooves
                entities.push(createLineEntity(
                    { x: gx - spec.b / 2, y: basePoint.y - radOut },
                    { x: gx, y: basePoint.y - radOut + spec.h },
                    layerGrooves,
                    colorGroove
                ));
                entities.push(createLineEntity(
                    { x: gx + spec.b / 2, y: basePoint.y - radOut },
                    { x: gx, y: basePoint.y - radOut + spec.h },
                    layerGrooves,
                    colorGroove
                ));
            }

            // Central Hub Boss
            entities.push(createRectangleEntity(
                { x: basePoint.x, y: basePoint.y + (radHub + radBore) / 2 },
                faceW + 10,
                radHub - radBore,
                layerRims,
                colorBody
            ));
            entities.push(createRectangleEntity(
                { x: basePoint.x, y: basePoint.y - (radHub + radBore) / 2 },
                faceW + 10,
                radHub - radBore,
                layerRims,
                colorBody
            ));
        } else {
            // Front Radial View (Concentric Circles)
            entities.push(createCircleEntity(basePoint, radOut, layerRims, colorBody));
            entities.push(createCircleEntity(basePoint, dd / 2, layerRef, colorRef)); // Pitch circle
            entities.push(createCircleEntity(basePoint, radHub, layerRims, colorBody));
            entities.push(createCircleEntity(basePoint, radBore, layerRims, colorBody));

            // Standard DIN 6885-1 Keyway notch on bore
            const keyW = Math.max(4, Math.round(bore * 0.25));
            const keyH = Math.max(3, Math.round(bore * 0.15));
            entities.push(createRectangleEntity(
                { x: basePoint.x, y: basePoint.y + radBore + keyH / 2 },
                keyW,
                keyH,
                layerRims,
                colorBody
            ));
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const profKey = String(params.profileType || 'SPA');
        const spec = V_PULLEY_SPECS[profKey] || V_PULLEY_SPECS['SPA'];
        const grooves = Math.max(1, Math.min(6, Math.round(Number(params.grooves) || 2)));
        const dd = Math.max(spec.minDd, Number(params.datumDiameter) || 160);
        const bore = Math.max(10, Math.min(dd * 0.6, Number(params.boreDiameter) || 28));
        const faceW = (grooves - 1) * spec.e + 2 * spec.f;

        const parts: DynamicPart3DDef[] = [
            {
                id: `v_pulley_${Date.now()}`,
                name: `DIN 2211 V-Kasnak (${profKey}, ${grooves} Kanallı, dd=Ø${dd} mm, delik=Ø${bore} mm)`,
                kind: 'pulley',
                color: '#3ad0e6',
                position: { x: basePos.x, y: basePos.y, z: basePos.z },
                rotation: { x: 90, y: 0, z: 0 },
                params: {
                    form: 'v-belt',
                    beltProfile: profKey,
                    grooves,
                    diameter: dd + spec.b * 0.45,
                    pitchDiameter: dd,
                    bore,
                    depth: faceW
                },
                designStandard: 'DIN 2211 / ISO 4183'
            }
        ];

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const profKey = String(params.profileType || 'SPA');
        const spec = V_PULLEY_SPECS[profKey] || V_PULLEY_SPECS['SPA'];
        const grooves = Math.max(1, Math.min(6, Math.round(Number(params.grooves) || 2)));
        const dd = Math.max(spec.minDd, Number(params.datumDiameter) || 160);
        const faceW = (grooves - 1) * spec.e + 2 * spec.f;

        const grips: DynamicGrip[] = [
            // Datum Diameter Stretch Grip
            {
                id: 'grip_pulley_dd',
                type: 'stretch',
                paramId: 'datumDiameter',
                position: { x: basePoint.x, y: basePoint.y + dd / 2 },
                direction: { x: 0, y: 1 },
                tooltip: `Grip: Bölüm Çapını Esnet (dd=Ø${dd} mm)`,
                tooltipTr: `Grip: Bölüm Çapını Esnet (dd=Ø${dd} mm)`
            },
            // Grooves Linear Count Grip
            {
                id: 'grip_pulley_grooves',
                type: 'stretch',
                paramId: 'grooves',
                position: { x: basePoint.x + faceW / 2, y: basePoint.y },
                direction: { x: 1, y: 0 },
                tooltip: `Grip: Kanal Sayısı (${grooves} Kanal — ${faceW} mm genişlik)`,
                tooltipTr: `Grip: Kanal Sayısı (${grooves} Kanal — ${faceW} mm genişlik)`
            },
            // View Mode Visibility Grip
            {
                id: 'grip_pulley_vis',
                type: 'visibility',
                paramId: 'viewMode',
                position: { x: basePoint.x - 30, y: basePoint.y - 30 },
                tooltip: 'Görünüş Tipi (Eksenel Kesit / Ön Radyal Görünüş)',
                tooltipTr: 'Görünüş Tipi (Eksenel Kesit / Ön Radyal Görünüş)'
            }
        ];

        return grips;
    }
};
