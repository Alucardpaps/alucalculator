/**
 * Shaft to 2D AluCAD Drafting Editor Bridge
 * URL Target: /cad-editor/
 * 
 * Converts stepped shaft parametric geometry into production 2D CAD entities
 * (centerlines, stepped contours, chamfers, undercuts, keyways, circlips, pitch circles, and dimensions)
 * and commits them to AluCAD store, automatically navigating to /cad-editor/.
 */

import { commitCadEntities } from '@/system/crossModuleBridge';
import { useOSStore } from '@/store/osStore';
import {
    CadEntity,
    Point,
    createLineEntity,
    createCircleEntity,
    createPolylineEntity,
    createTextEntity
} from '@/cad/kernel/types';
import type { ShaftSegment } from './engine';
import { getStandardKeywayDIN6885, getStandardUndercutDIN509 } from './engine';

export interface CadTransferResult {
    success: boolean;
    entityCount: number;
    totalLength: number;
    message: string;
}

export interface CadTransferOptions {
    navigate?: boolean;
    shaftTitle?: string;
    includeDimensions?: boolean;
}

/**
 * Converts shaft segments into 2D CAD entities and transfers to http://localhost:3000/cad-editor/
 */
export function transferShaftToCadEditor(
    segments: ShaftSegment[],
    options: CadTransferOptions = {}
): CadTransferResult {
    const {
        navigate = true,
        shaftTitle = 'Kademeli Mil - 2D CAD Teknik Resim',
        includeDimensions = true
    } = options;

    if (!segments || segments.length === 0) {
        return {
            success: false,
            entityCount: 0,
            totalLength: 0,
            message: 'Aktarılacak mil kademesi bulunamadı.'
        };
    }

    const totalLength = segments.reduce((acc, s) => acc + s.length, 0);
    const maxRadius = Math.max(...segments.map(s => s.diameter / 2), 20);
    const entities: CadEntity[] = [];

    // ─── 1. ISO 128 CENTERLINE (Eksen Çizgisi) ───
    const ext = Math.max(20, Math.min(40, totalLength * 0.08));
    entities.push(
        createLineEntity(
            { x: -ext, y: 0 },
            { x: totalLength + ext, y: 0 },
            'CENTERLINES',
            '#ef4444'
        )
    );

    let currentX = 0;

    // Detect center drill features on ends to open end-face mouths
    const leftCenterDrill = segments[0]?.features?.find(f => f.type === 'center_drill' && (f.face === 'left_end' || !f.face)) as any;
    const rightCenterDrill = segments[segments.length - 1]?.features?.find(f => f.type === 'center_drill' && f.face === 'right_end') as any;

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const segX1 = currentX;
        const segX2 = currentX + seg.length;
        const r = seg.diameter / 2;

        const isFirst = i === 0;
        const isLast = i === segments.length - 1;
        const prevSeg = i > 0 ? segments[i - 1] : null;
        const nextSeg = i < segments.length - 1 ? segments[i + 1] : null;

        // ─── 2. CALCULATE TRIMMED CONTOUR BOUNDARIES (PAHLAR & TAŞLAMA KANALLARI) ───
        // Chamfers on free ends or steps
        const cL = isFirst
            ? (seg.chamferLeft ?? 1.5)
            : (prevSeg && seg.diameter > prevSeg.diameter ? (seg.chamferLeft ?? 1.0) : 0);
        const cR = isLast
            ? (seg.chamferRight ?? 1.5)
            : (nextSeg && seg.diameter > nextSeg.diameter ? (seg.chamferRight ?? 1.0) : 0);

        // Determine left contour start X (trim for undercut or chamfer)
        let topStartX = segX1;
        if (isFirst) {
            topStartX = segX1 + cL;
        } else if (prevSeg) {
            if (seg.diameter < prevSeg.diameter && seg.shoulderTransition !== 'radius') {
                // Step-Down: Undercut on current segment left shoulder
                const uc = getStandardUndercutDIN509(seg.diameter, seg.shoulderUndercutForm ?? 'E');
                topStartX = segX1 + uc.grooveWidth;
            } else if (seg.diameter > prevSeg.diameter && cL > 0) {
                // Step-Up: 45° chamfer on current segment step
                topStartX = segX1 + cL;
            }
        }

        // Determine right contour end X (trim for undercut or chamfer)
        let topEndX = segX2;
        if (isLast) {
            topEndX = segX2 - cR;
        } else if (nextSeg) {
            if (seg.diameter < nextSeg.diameter && seg.shoulderTransition !== 'radius') {
                // Step-Up: Undercut on current segment right shoulder
                const uc = getStandardUndercutDIN509(seg.diameter, seg.shoulderUndercutForm ?? 'E');
                topEndX = segX2 - uc.grooveWidth;
            } else if (seg.diameter > nextSeg.diameter && cR > 0) {
                // Step-Down: 45° chamfer on current segment step corner
                topEndX = segX2 - cR;
            }
        }

        // ─── 3. SİLİNDİR ÜST & ALT KONTUR ÇİZGİLERİ (ASLA OYUK ÜSTÜNÜ ÖRTMEZ) ───
        if (topEndX > topStartX) {
            // Upper contour
            entities.push(
                createLineEntity(
                    { x: topStartX, y: r },
                    { x: topEndX, y: r },
                    '0',
                    '#00e5ff'
                )
            );
            // Lower contour
            entities.push(
                createLineEntity(
                    { x: topStartX, y: -r },
                    { x: topEndX, y: -r },
                    '0',
                    '#00e5ff'
                )
            );
        }

        // ─── 4. SOL VE SAĞ BOŞTA KALAN ALIN YÜZEYLERİ VE PAHLAR (FREE ENDS) ───
        if (isFirst) {
            const mouthR = leftCenterDrill ? (((leftCenterDrill.coneDia || (leftCenterDrill.pilotDia ? leftCenterDrill.pilotDia * 2.12 : 4.25))) / 2) : 0;
            const faceTopR = r - cL;

            if (mouthR > 0 && mouthR < faceTopR) {
                // Punta deliği ağzı açık bırakılır (kesilmez!)
                entities.push(createLineEntity({ x: 0, y: mouthR }, { x: 0, y: faceTopR }, '0', '#00e5ff'));
                entities.push(createLineEntity({ x: 0, y: -mouthR }, { x: 0, y: -faceTopR }, '0', '#00e5ff'));
            } else if (mouthR === 0) {
                // Düz kapalı alın
                entities.push(createLineEntity({ x: 0, y: -faceTopR }, { x: 0, y: faceTopR }, '0', '#00e5ff'));
            }

            // 45° Dış Pah Çizgileri
            if (cL > 0) {
                entities.push(createLineEntity({ x: 0, y: faceTopR }, { x: cL, y: r }, '0', '#00e5ff'));
                entities.push(createLineEntity({ x: 0, y: -faceTopR }, { x: cL, y: -r }, '0', '#00e5ff'));
            }
        }

        if (isLast) {
            const mouthR = rightCenterDrill ? (((rightCenterDrill.coneDia || (rightCenterDrill.pilotDia ? rightCenterDrill.pilotDia * 2.12 : 5.3))) / 2) : 0;
            const faceTopR = r - cR;

            if (mouthR > 0 && mouthR < faceTopR) {
                // Punta deliği ağzı açık bırakılır
                entities.push(createLineEntity({ x: segX2, y: mouthR }, { x: segX2, y: faceTopR }, '0', '#00e5ff'));
                entities.push(createLineEntity({ x: segX2, y: -mouthR }, { x: segX2, y: -faceTopR }, '0', '#00e5ff'));
            } else if (mouthR === 0) {
                entities.push(createLineEntity({ x: segX2, y: -faceTopR }, { x: segX2, y: faceTopR }, '0', '#00e5ff'));
            }

            // 45° Dış Pah Çizgileri
            if (cR > 0) {
                entities.push(createLineEntity({ x: segX2 - cR, y: r }, { x: segX2, y: faceTopR }, '0', '#00e5ff'));
                entities.push(createLineEntity({ x: segX2 - cR, y: -r }, { x: segX2, y: -faceTopR }, '0', '#00e5ff'));
            }
        }

        // ─── 5. KADEMELER ARASI OMUZ GEÇİŞLERİ (SHOULDERS, PAHLAR & DIN 509 OYUKLAR) ───
        if (!isLast && nextSeg) {
            const nextR = nextSeg.diameter / 2;

            if (r < nextR) {
                // ─── STEP-UP (Kademe Büyümesi: r -> nextR) ───
                const cNextL = nextSeg.chamferLeft ?? 1.0;
                const shoulderFaceTop = cNextL > 0 ? (nextR - cNextL) : nextR;

                if (seg.shoulderTransition === 'undercut') {
                    // DIN 509 Taşlama Boşluğu: Mevcut kademenin sağ ucunda
                    const uc = getStandardUndercutDIN509(seg.diameter, seg.shoulderUndercutForm ?? 'E');
                    const ucW = uc.grooveWidth;
                    const ucDepth = uc.depth;
                    const rampLen = Math.min(ucDepth * 3.732, ucW * 0.45); // 15° rampa
                    const xRamp = segX2 - rampLen;
                    const grooveFloorY = r - ucDepth;

                    // Üst Oyuk Konturu: 15° rampa + taban
                    entities.push(createLineEntity({ x: segX2 - ucW, y: r }, { x: xRamp, y: grooveFloorY }, '0', '#38bdf8'));
                    entities.push(createLineEntity({ x: xRamp, y: grooveFloorY }, { x: segX2, y: grooveFloorY }, '0', '#38bdf8'));

                    // Alt Oyuk Konturu (Simetrik)
                    entities.push(createLineEntity({ x: segX2 - ucW, y: -r }, { x: xRamp, y: -grooveFloorY }, '0', '#38bdf8'));
                    entities.push(createLineEntity({ x: xRamp, y: -grooveFloorY }, { x: segX2, y: -grooveFloorY }, '0', '#38bdf8'));

                    // Dikey Omuz Yüzeyi: Oyuk tabanından büyük silindire
                    entities.push(createLineEntity({ x: segX2, y: grooveFloorY }, { x: segX2, y: shoulderFaceTop }, '0', '#00e5ff'));
                    entities.push(createLineEntity({ x: segX2, y: -grooveFloorY }, { x: segX2, y: -shoulderFaceTop }, '0', '#00e5ff'));

                    // Eğer sonraki kademenin omuzunda 45° pah varsa
                    if (cNextL > 0) {
                        entities.push(createLineEntity({ x: segX2, y: shoulderFaceTop }, { x: segX2 + cNextL, y: nextR }, '0', '#00e5ff'));
                        entities.push(createLineEntity({ x: segX2, y: -shoulderFaceTop }, { x: segX2 + cNextL, y: -nextR }, '0', '#00e5ff'));
                    }
                } else {
                    // Temiz Dikey Omuz Geçişi (Standard Fillet/Shoulder)
                    entities.push(createLineEntity({ x: segX2, y: r }, { x: segX2, y: shoulderFaceTop }, '0', '#00e5ff'));
                    entities.push(createLineEntity({ x: segX2, y: -r }, { x: segX2, y: -shoulderFaceTop }, '0', '#00e5ff'));

                    if (cNextL > 0) {
                        entities.push(createLineEntity({ x: segX2, y: shoulderFaceTop }, { x: segX2 + cNextL, y: nextR }, '0', '#00e5ff'));
                        entities.push(createLineEntity({ x: segX2, y: -shoulderFaceTop }, { x: segX2 + cNextL, y: -nextR }, '0', '#00e5ff'));
                    }
                }
            } else if (r > nextR) {
                // ─── STEP-DOWN (Kademe Küçülmesi: r -> nextR) ───
                const cCurR = seg.chamferRight ?? 1.0;
                const shoulderFaceStart = cCurR > 0 ? (r - cCurR) : r;

                // Mevcut kademenin basamak köşesindeki 45° pah
                if (cCurR > 0) {
                    entities.push(createLineEntity({ x: segX2 - cCurR, y: r }, { x: segX2, y: shoulderFaceStart }, '0', '#00e5ff'));
                    entities.push(createLineEntity({ x: segX2 - cCurR, y: -r }, { x: segX2, y: -shoulderFaceStart }, '0', '#00e5ff'));
                }

                if (nextSeg.shoulderTransition === 'undercut') {
                    // DIN 509 Taşlama Boşluğu: Küçük olan sonraki kademenin sol omuzunda!
                    const uc = getStandardUndercutDIN509(nextSeg.diameter, nextSeg.shoulderUndercutForm ?? 'E');
                    const ucW = uc.grooveWidth;
                    const ucDepth = uc.depth;
                    const rampLen = Math.min(ucDepth * 3.732, ucW * 0.45); // 15° rampa
                    const xRampStart = segX2 + ucW - rampLen;
                    const grooveFloorY = nextR - ucDepth;

                    // Dikey Omuz Yüzeyi: Büyük silindirden oyuk tabanına kadar iner
                    entities.push(createLineEntity({ x: segX2, y: shoulderFaceStart }, { x: segX2, y: grooveFloorY }, '0', '#00e5ff'));
                    entities.push(createLineEntity({ x: segX2, y: -shoulderFaceStart }, { x: segX2, y: -grooveFloorY }, '0', '#00e5ff'));

                    // Üst Oyuk Konturu: Taban + 15° rampa yukarı
                    entities.push(createLineEntity({ x: segX2, y: grooveFloorY }, { x: xRampStart, y: grooveFloorY }, '0', '#38bdf8'));
                    entities.push(createLineEntity({ x: xRampStart, y: grooveFloorY }, { x: segX2 + ucW, y: nextR }, '0', '#38bdf8'));

                    // Alt Oyuk Konturu (Simetrik)
                    entities.push(createLineEntity({ x: segX2, y: -grooveFloorY }, { x: xRampStart, y: -grooveFloorY }, '0', '#38bdf8'));
                    entities.push(createLineEntity({ x: xRampStart, y: -grooveFloorY }, { x: segX2 + ucW, y: -nextR }, '0', '#38bdf8'));
                } else {
                    // Temiz Dikey Omuz Geçişi
                    entities.push(createLineEntity({ x: segX2, y: shoulderFaceStart }, { x: segX2, y: nextR }, '0', '#00e5ff'));
                    entities.push(createLineEntity({ x: segX2, y: -shoulderFaceStart }, { x: segX2, y: -nextR }, '0', '#00e5ff'));
                }
            }
        }

        // ─── 5. MAKİNE ELEMANLARI (Kama, Segman, Dişli, Delik) ───
        if (seg.features && seg.features.length > 0) {
            for (const f of seg.features) {
                if (f.type === 'keyway') {
                    const stdKw = getStandardKeywayDIN6885(seg.diameter);
                    const depth = (typeof f.depth === 'number' && f.depth > 0) ? f.depth : stdKw.depth;
                    const kwX1 = segX1 + f.offsetFromStart;
                    const kwX2 = kwX1 + f.length;
                    const floorY = r - depth;

                    // Kama Yuvası Kesit Sınırı
                    entities.push(createLineEntity({ x: kwX1, y: r }, { x: kwX1, y: floorY }, 'HOLES', '#f59e0b'));
                    entities.push(createLineEntity({ x: kwX1, y: floorY }, { x: kwX2, y: floorY }, 'HOLES', '#f59e0b'));
                    entities.push(createLineEntity({ x: kwX2, y: floorY }, { x: kwX2, y: r }, 'HOLES', '#f59e0b'));

                    if (includeDimensions) {
                        entities.push(
                            createTextEntity(
                                { x: (kwX1 + kwX2) / 2, y: floorY - 3 },
                                `DIN 6885 (${f.width}x${depth}x${f.length})`,
                                7.5,
                                'DIMENSIONS',
                                '#f59e0b',
                                'center'
                            )
                        );
                    }
                } else if (f.type === 'circlip') {
                    const ccX1 = segX1 + f.offsetFromStart;
                    const ccX2 = ccX1 + f.grooveWidth;
                    const grooveR = f.grooveDia / 2;

                    // Üst Segman Kanalı
                    entities.push(createLineEntity({ x: ccX1, y: r }, { x: ccX1, y: grooveR }, 'HOLES', '#38bdf8'));
                    entities.push(createLineEntity({ x: ccX1, y: grooveR }, { x: ccX2, y: grooveR }, 'HOLES', '#38bdf8'));
                    entities.push(createLineEntity({ x: ccX2, y: grooveR }, { x: ccX2, y: r }, 'HOLES', '#38bdf8'));

                    // Alt Segman Kanalı
                    entities.push(createLineEntity({ x: ccX1, y: -r }, { x: ccX1, y: -grooveR }, 'HOLES', '#38bdf8'));
                    entities.push(createLineEntity({ x: ccX1, y: -grooveR }, { x: ccX2, y: -grooveR }, 'HOLES', '#38bdf8'));
                    entities.push(createLineEntity({ x: ccX2, y: -grooveR }, { x: ccX2, y: -r }, 'HOLES', '#38bdf8'));

                    if (includeDimensions) {
                        entities.push(
                            createTextEntity(
                                { x: (ccX1 + ccX2) / 2, y: r + 5 },
                                `DIN 471 Ø${f.grooveDia}`,
                                7.5,
                                'DIMENSIONS',
                                '#38bdf8',
                                'center'
                            )
                        );
                    }
                } else if (f.type === 'gear') {
                    const gearX1 = segX1 + f.offsetFromStart;
                    const gearX2 = gearX1 + f.faceWidth;
                    const tipR = f.tipDiameter / 2;
                    const pitchR = f.pitchDiameter / 2;

                    // Diş Üstü Dairesi (da)
                    entities.push(createLineEntity({ x: gearX1, y: r }, { x: gearX1, y: tipR }, 'GEARS', '#a855f7'));
                    entities.push(createLineEntity({ x: gearX1, y: tipR }, { x: gearX2, y: tipR }, 'GEARS', '#a855f7'));
                    entities.push(createLineEntity({ x: gearX2, y: tipR }, { x: gearX2, y: r }, 'GEARS', '#a855f7'));

                    // Simetrik Alt Diş
                    entities.push(createLineEntity({ x: gearX1, y: -r }, { x: gearX1, y: -tipR }, 'GEARS', '#a855f7'));
                    entities.push(createLineEntity({ x: gearX1, y: -tipR }, { x: gearX2, y: -tipR }, 'GEARS', '#a855f7'));
                    entities.push(createLineEntity({ x: gearX2, y: -tipR }, { x: gearX2, y: -r }, 'GEARS', '#a855f7'));

                    // Taksimat Eksen Çizgisi (d0)
                    entities.push(createLineEntity({ x: gearX1 - 4, y: pitchR }, { x: gearX2 + 4, y: pitchR }, 'PITCH_CIRCLES', '#38bdf8'));
                    entities.push(createLineEntity({ x: gearX1 - 4, y: -pitchR }, { x: gearX2 + 4, y: -pitchR }, 'PITCH_CIRCLES', '#38bdf8'));

                    entities.push(
                        createTextEntity(
                            { x: (gearX1 + gearX2) / 2, y: tipR + 5 },
                            `Düz Dişli m=${f.module} z=${f.numTeeth} (d₀=Ø${f.pitchDiameter})`,
                            8.5,
                            'GEARS',
                            '#c084fc',
                            'center',
                            true
                        )
                    );
                } else if (f.type === 'cross_hole' || f.type === 'pin') {
                    const holeX = segX1 + f.offsetFromStart;
                    const holeR = f.diameter / 2;

                    // Delik eksen haçı ve delik konturları
                    entities.push(createLineEntity({ x: holeX - holeR, y: -r }, { x: holeX - holeR, y: r }, 'HOLES', '#f59e0b'));
                    entities.push(createLineEntity({ x: holeX + holeR, y: -r }, { x: holeX + holeR, y: r }, 'HOLES', '#f59e0b'));
                    entities.push(createCircleEntity({ x: holeX, y: 0 }, holeR, 'HOLES', '#f59e0b'));
                    entities.push(createLineEntity({ x: holeX - holeR - 3, y: 0 }, { x: holeX + holeR + 3, y: 0 }, 'CENTERLINES', '#ef4444'));
                    entities.push(createLineEntity({ x: holeX, y: -holeR - 3 }, { x: holeX, y: holeR + 3 }, 'CENTERLINES', '#ef4444'));

                    if (includeDimensions) {
                        entities.push(
                            createTextEntity(
                                { x: holeX, y: r + 5 },
                                `Pim Ø${f.diameter}`,
                                7.5,
                                'DIMENSIONS',
                                '#f59e0b',
                                'center'
                            )
                        );
                    }
                } else if (f.type === 'center_drill') {
                    const pilotDia = f.pilotDia || 2.0;
                    const coneDia = f.coneDia || (pilotDia * 2.12);
                    const depth = f.totalDepth || 4.5;
                    const isLeft = f.face === 'left_end' || !f.face;
                    const startX = isLeft ? 0 : segX2;
                    const sign = isLeft ? 1 : -1;

                    // DIN 332 60° havşa konisi boyu: L_cone = (d2 - d1)/(2 * tan(30°)) = (d2 - d1)/2 * sqrt(3)
                    const coneLen = ((coneDia - pilotDia) / 2) * Math.sqrt(3);
                    // 118° matkap ucu konisi boyu: L_tip = (d1/2) / tan(59°)
                    const tipLen = (pilotDia / 2) / Math.tan((59 * Math.PI) / 180);

                    const xConeEnd = startX + sign * coneLen;
                    const xPilotEnd = startX + sign * depth;
                    const xTipEnd = startX + sign * (depth + tipLen);

                    // 1. 60° Havşa Konisi
                    entities.push(createLineEntity({ x: startX, y: coneDia / 2 }, { x: xConeEnd, y: pilotDia / 2 }, 'HOLES', '#94a3b8'));
                    entities.push(createLineEntity({ x: startX, y: -coneDia / 2 }, { x: xConeEnd, y: -pilotDia / 2 }, 'HOLES', '#94a3b8'));

                    // 2. Silindirik Pilot Kılavuz Deliği
                    entities.push(createLineEntity({ x: xConeEnd, y: pilotDia / 2 }, { x: xPilotEnd, y: pilotDia / 2 }, 'HOLES', '#94a3b8'));
                    entities.push(createLineEntity({ x: xConeEnd, y: -pilotDia / 2 }, { x: xPilotEnd, y: -pilotDia / 2 }, 'HOLES', '#94a3b8'));

                    // 3. Pilot Delik Dibi Enine Çizgi
                    entities.push(createLineEntity({ x: xPilotEnd, y: -pilotDia / 2 }, { x: xPilotEnd, y: pilotDia / 2 }, 'HOLES', '#94a3b8'));

                    // 4. 118° Matkap Ucu Tepe Konisi
                    entities.push(createLineEntity({ x: xPilotEnd, y: pilotDia / 2 }, { x: xTipEnd, y: 0 }, 'HOLES', '#94a3b8'));
                    entities.push(createLineEntity({ x: xPilotEnd, y: -pilotDia / 2 }, { x: xTipEnd, y: 0 }, 'HOLES', '#94a3b8'));

                    // 5. DIN 332 Lider Çizgili Ölçülendirme (Mil Gövdesi ve Eksen Çizgisi Dışında!)
                    if (includeDimensions) {
                        const calloutText = f.callout || (f.form ? `DIN 332-${f.form} ${pilotDia}x${coneDia}` : `DIN 332 Ø${pilotDia}`);
                        const elbowX = startX - sign * 12;
                        const shelfEndX = startX - sign * 36;
                        const labelY = r + 9;

                        // Lider çizgisi: Havşa ağzından yukarı mil dışına
                        entities.push(createLineEntity({ x: startX, y: coneDia / 2 }, { x: elbowX, y: labelY }, 'DIMENSIONS', '#94a3b8'));
                        entities.push(createLineEntity({ x: elbowX, y: labelY }, { x: shelfEndX, y: labelY }, 'DIMENSIONS', '#94a3b8'));
                        entities.push(
                            createTextEntity(
                                { x: (elbowX + shelfEndX) / 2, y: labelY + 3 },
                                calloutText,
                                7.5,
                                'DIMENSIONS',
                                '#94a3b8',
                                'center'
                            )
                        );
                    }
                }
            }
        }

        // ─── 6. KADEME BOY VE ÇAP ÖLÇÜLENDİRMELERİ ───
        if (includeDimensions) {
            // Segment Çapı (Üstte)
            entities.push(
                createTextEntity(
                    { x: (segX1 + segX2) / 2, y: r + 7 },
                    `Ø${seg.diameter} ${seg.toleranceGrade || 'h7'}`,
                    8.5,
                    'DIMENSIONS',
                    '#ffcc00',
                    'center',
                    true
                )
            );

            // Segment Boyu (Altta)
            const dimY = -(maxRadius + 14);
            entities.push(createLineEntity({ x: segX1, y: dimY }, { x: segX2, y: dimY }, 'DIMENSIONS', '#ffcc00'));
            entities.push(createLineEntity({ x: segX1, y: dimY - 3 }, { x: segX1, y: dimY + 3 }, 'DIMENSIONS', '#ffcc00'));
            entities.push(createLineEntity({ x: segX2, y: dimY - 3 }, { x: segX2, y: dimY + 3 }, 'DIMENSIONS', '#ffcc00'));
            entities.push(
                createTextEntity(
                    { x: (segX1 + segX2) / 2, y: dimY - 4 },
                    `${seg.length}`,
                    8,
                    'DIMENSIONS',
                    '#ffcc00',
                    'center'
                )
            );
        }

        currentX += seg.length;
    }

    // ─── 7. TOPLAM BOY ÖLÇÜLENDİRMESİ ───
    if (includeDimensions) {
        const totalDimY = -(maxRadius + 26);
        entities.push(createLineEntity({ x: 0, y: totalDimY }, { x: totalLength, y: totalDimY }, 'DIMENSIONS', '#38bdf8'));
        entities.push(createLineEntity({ x: 0, y: totalDimY - 4 }, { x: 0, y: totalDimY + 4 }, 'DIMENSIONS', '#38bdf8'));
        entities.push(createLineEntity({ x: totalLength, y: totalDimY - 4 }, { x: totalLength, y: totalDimY + 4 }, 'DIMENSIONS', '#38bdf8'));
        entities.push(
            createTextEntity(
                { x: totalLength / 2, y: totalDimY - 5 },
                `TOPLAM BOY L = ${totalLength} mm`,
                9,
                'DIMENSIONS',
                '#38bdf8',
                'center',
                true
            )
        );
    }

    // Commit to AluCAD store and persist in sessionStorage & localStorage
    commitCadEntities(entities, shaftTitle);

    // Navigate to /cad-editor/
    if (navigate && typeof window !== 'undefined') {
        const os = useOSStore.getState();
        const isDesktopHome = window.location.pathname === '/' || window.location.pathname === '';
        if (isDesktopHome && typeof os.openWindow === 'function') {
            os.openWindow('cad-editor' as any);
        } else {
            window.location.href = '/cad-editor/';
        }
    }

    return {
        success: true,
        entityCount: entities.length,
        totalLength,
        message: `${entities.length} CAD elemanı başarıyla /cad-editor/'e aktarıldı.`
    };
}
