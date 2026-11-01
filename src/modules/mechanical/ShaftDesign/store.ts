/**
 * modules/mechanical/ShaftDesign/store.ts
 * 
 * Zustand store for Stepped Shaft Design & Calculation
 */

import { create } from 'zustand';
import { 
    ShaftSegment, 
    ShaftRadialLoad, 
    ShaftTorqueLoad, 
    ShaftFeature,
    ShaftBearingSupport,
    ShaftDesignInput,
    ShaftDesignResult,
    ShaftDesignEngine,
    getStandardKeywayDIN6885,
    getStandardCirclipDIN471,
    getRecommendedImbusDIN912,
    getRecommendedPinDIN7,
    getRecommendedThreadISO965,
    getStandardUndercutDIN509,
    getStandardCenterDrillDIN332,
    calculateGearGeometry,
    calculateBearingL10h
} from './engine';
import { EngineMetadata } from '@/engine/project/ProjectSchema';
import { BEARING_CATALOG, parseSKFDesignation } from '@/data/skfBearings';

export interface ShaftDesignState {
    // Inputs
    totalLength: number;
    segments: ShaftSegment[];
    selectedSegmentId: string | null;
    selectedFeatureId: string | null;
    materialId: string;
    supportAPos: number;
    supportBPos: number;
    supportABearing: ShaftBearingSupport;
    supportBBearing: ShaftBearingSupport;
    operatingRpm: number;
    radialLoads: ShaftRadialLoad[];
    torque: ShaftTorqueLoad;
    targetSafetyFactor: number;

    // View state
    activeTab: 'drawing' | 'diagrams' | 'features' | 'checks' | 'standards';
    zoomLevel: number;

    // Solved Results
    result: ShaftDesignResult | null;
    metadata: EngineMetadata | null;

    // Actions
    setTotalLength: (length: number) => void;
    setSegmentCount: (count: number) => void;
    selectSegment: (id: string | null) => void;
    selectFeature: (id: string | null) => void;
    updateSegment: (id: string, updates: Partial<ShaftSegment>) => void;
    setSegmentChamfer: (segmentId: string, chamferLeft: number, chamferRight: number, chamferAngle?: number) => void;
    setGlobalChamfers: (chamferMm: number) => void;
    setShoulderTransition: (segmentIndex: number, transition: 'undercut' | 'radius', radius?: number, form?: 'E' | 'F') => void;
    addSegment: () => void;
    removeSegment: (id: string) => void;
    splitSegment: (segmentId: string, splitOffsetMm: number) => void;
    moveBoundary: (boundaryIndex: number, newX: number) => void;
    addFeatureToSegment: (segmentId: string, type: ShaftFeature['type']) => void;
    updateFeature: (segmentId: string, featureId: string, updates: any) => void;
    removeFeature: (segmentId: string, featureId: string) => void;
    setMaterialId: (id: string) => void;
    setSupports: (a: number, b: number) => void;
    setBearingForSupport: (support: 'A' | 'B', bearingCode: string, syncSegmentDiameter?: boolean) => void;
    setOperatingRpm: (rpm: number) => void;
    updateRadialLoad: (id: string, updates: Partial<ShaftRadialLoad>) => void;
    addRadialLoad: () => void;
    removeRadialLoad: (id: string) => void;
    setTorque: (torque: ShaftTorqueLoad) => void;
    setTargetSafetyFactor: (sf: number) => void;
    setActiveTab: (tab: 'drawing' | 'diagrams' | 'features' | 'checks' | 'standards') => void;
    setZoomLevel: (zoom: number) => void;
    loadPreset: (presetId: 'motor' | 'gearbox' | 'pump' | 'simple' | 'default') => void;
    recalculate: () => void;
}

const DEFAULT_SEGMENTS: ShaftSegment[] = [
    {
        id: 'seg-1',
        segmentIndex: 0,
        length: 70,
        diameter: 25,
        shoulderFilletRadius: 1.5,
        shoulderTransition: 'undercut',
        shoulderUndercutForm: 'E',
        chamferLeft: 1.5,
        chamferRight: 1.0,
        chamferAngle: 45,
        toleranceGrade: 'k6',
        features: [
            {
                type: 'thread',
                id: 'feat-thread-1',
                standard: 'ISO 965 Metric',
                designation: 'M24x1.5',
                pitch: 1.5,
                length: 25,
                offsetFromStart: 5
            },
            {
                type: 'center_drill',
                id: 'feat-cd-1',
                standard: 'DIN 332-1',
                form: 'B',
                pilotDia: 2.0,
                coneDia: 4.25,
                protectingDia: 6.3,
                totalDepth: 3.6,
                face: 'left_end',
                callout: 'DIN 332 - B 2.0x4.25'
            }
        ]
    },
    {
        id: 'seg-2',
        segmentIndex: 1,
        length: 90,
        diameter: 35,
        shoulderFilletRadius: 1.5,
        shoulderTransition: 'undercut',
        shoulderUndercutForm: 'E',
        chamferLeft: 1.0,
        chamferRight: 1.0,
        chamferAngle: 45,
        toleranceGrade: 'k6',
        features: [
            {
                type: 'circlip',
                id: 'feat-circlip-1',
                standard: 'DIN 471',
                grooveDia: 33.0,
                grooveWidth: 1.6,
                offsetFromStart: 15,
                retainingCapacityKN: 22.5,
                edgeMarginMm: 3.0,
                leadInChamferAngle: 15
            }
        ]
    },
    {
        id: 'seg-3',
        segmentIndex: 2,
        length: 180,
        diameter: 45,
        shoulderFilletRadius: 2.0,
        shoulderTransition: 'undercut',
        shoulderUndercutForm: 'E',
        chamferLeft: 1.5,
        chamferRight: 1.5,
        chamferAngle: 45,
        toleranceGrade: 'h7',
        features: [
            {
                type: 'keyway',
                id: 'feat-keyway-1',
                standard: 'DIN 6885-1 Form A',
                width: 14,
                depth: 5.5,
                length: 50,
                offsetFromStart: 15,
                fitClass: 'normal',
                hubMaterialId: 'gg25'
            },
            {
                type: 'gear',
                id: 'feat-gear-1',
                standard: 'DIN 3960 / ISO 54',
                gearType: 'spur',
                module: 2.5,
                numTeeth: 28,
                pressureAngleDeg: 20,
                helixAngleDeg: 0,
                faceWidth: 40,
                offsetFromStart: 75,
                mounting: 'integral',
                pitchDiameter: 70,
                tipDiameter: 75,
                rootDiameter: 63.75,
                tangentialForceN: 4286,
                radialForceN: 1560,
                callout: 'Düz Dişli m=2.5 z=28 (d₀=Ø70 da=Ø75) b=40mm'
            },
            {
                type: 'cross_hole',
                id: 'feat-hole-1',
                diameter: 6,
                offsetFromStart: 140,
                through: true
            }
        ]
    },
    {
        id: 'seg-4',
        segmentIndex: 3,
        length: 90,
        diameter: 35,
        shoulderFilletRadius: 1.5,
        shoulderTransition: 'radius',
        shoulderUndercutForm: 'E',
        chamferLeft: 1.0,
        chamferRight: 1.0,
        chamferAngle: 45,
        toleranceGrade: 'k6',
        features: [
            {
                type: 'pin',
                id: 'feat-pin-1',
                standard: 'DIN 7 / ISO 2338',
                diameter: 6,
                offsetFromStart: 45,
                fit: 'H7/m6'
            }
        ]
    },
    {
        id: 'seg-5',
        segmentIndex: 4,
        length: 70,
        diameter: 28,
        shoulderFilletRadius: 1.5,
        shoulderTransition: 'undercut',
        shoulderUndercutForm: 'E',
        chamferLeft: 1.0,
        chamferRight: 1.5,
        chamferAngle: 15,
        toleranceGrade: 'h7',
        features: [
            {
                type: 'keyway',
                id: 'feat-keyway-2',
                standard: 'DIN 6885-1 Form A',
                width: 8,
                depth: 4.0,
                length: 40,
                offsetFromStart: 15,
                fitClass: 'normal',
                hubMaterialId: 'c45'
            },
            {
                type: 'center_drill',
                id: 'feat-cd-2',
                standard: 'DIN 332-1',
                form: 'B',
                pilotDia: 2.5,
                coneDia: 5.3,
                protectingDia: 8.0,
                totalDepth: 4.6,
                face: 'right_end',
                callout: 'DIN 332 - B 2.5x5.3'
            }
        ]
    }
];

export const useShaftDesignStore = create<ShaftDesignState>((set, get) => {
    // Initial run
    const initialInput: ShaftDesignInput = {
        totalLength: 500,
        segments: DEFAULT_SEGMENTS,
        materialId: 'c45',
        supportAPos: 35,
        supportBPos: 405,
        radialLoads: [
            { id: 'load-1', position: 250, forceN: 3200, description: 'Dişli Çark Radyal Yükü' }
        ],
        torque: {
            torqueNm: 150,
            inputPosition: 35,
            outputPosition: 250
        },
        targetSafetyFactor: 1.75
    };

    const initialCalc = ShaftDesignEngine.analyze(initialInput);

    const initialBearingA: ShaftBearingSupport = {
        supportId: 'A',
        positionMm: 35,
        segmentIndex: 0,
        bearingCode: '6205',
        fullDesignation: 'SKF 6205',
        bearingType: 'deep-groove-ball',
        boreDia: 25,
        outerDia: 52,
        width: 15,
        dynamicLoadRatingKN: 14.8,
        staticLoadRatingKN: 7.8,
        limitingSpeedRpm: 15000,
        massKg: 0.128,
        reactionForceN: initialCalc.result.supportReactions.RaN,
        lifeHoursL10h: calculateBearingL10h(14.8, initialCalc.result.supportReactions.RaN, 1450),
        status: 'ok'
    };

    const initialBearingB: ShaftBearingSupport = {
        supportId: 'B',
        positionMm: 405,
        segmentIndex: 3,
        bearingCode: '6207',
        fullDesignation: 'SKF 6207',
        bearingType: 'deep-groove-ball',
        boreDia: 35,
        outerDia: 72,
        width: 17,
        dynamicLoadRatingKN: 27.0,
        staticLoadRatingKN: 15.3,
        limitingSpeedRpm: 11000,
        massKg: 0.288,
        reactionForceN: initialCalc.result.supportReactions.RbN,
        lifeHoursL10h: calculateBearingL10h(27.0, initialCalc.result.supportReactions.RbN, 1450),
        status: 'ok'
    };

    return {
        totalLength: 500,
        segments: DEFAULT_SEGMENTS,
        selectedSegmentId: 'seg-3',
        selectedFeatureId: null,
        materialId: 'c45',
        supportAPos: 35,
        supportBPos: 405,
        supportABearing: initialBearingA,
        supportBBearing: initialBearingB,
        operatingRpm: 1450,
        radialLoads: [
            { id: 'load-1', position: 250, forceN: 3200, description: 'Dişli Çark Radyal Yükü' }
        ],
        torque: {
            torqueNm: 150,
            inputPosition: 35,
            outputPosition: 250
        },
        targetSafetyFactor: 1.75,

        activeTab: 'drawing',
        zoomLevel: 1.0,

        result: initialCalc.result,
        metadata: initialCalc.metadata,

        recalculate: () => {
            const state = get();
            const input: ShaftDesignInput = {
                totalLength: state.totalLength,
                segments: state.segments,
                materialId: state.materialId,
                supportAPos: state.supportAPos,
                supportBPos: state.supportBPos,
                radialLoads: state.radialLoads,
                torque: state.torque,
                targetSafetyFactor: state.targetSafetyFactor
            };
            const calc = ShaftDesignEngine.analyze(input);
            const rpm = state.operatingRpm || 1450;
            const raN = calc.result.supportReactions.RaN;
            const rbN = calc.result.supportReactions.RbN;

            const updatedBearingA: ShaftBearingSupport = {
                ...state.supportABearing,
                reactionForceN: raN,
                lifeHoursL10h: calculateBearingL10h(state.supportABearing.dynamicLoadRatingKN, raN, rpm, state.supportABearing.bearingType.includes('roller')),
                status: (calculateBearingL10h(state.supportABearing.dynamicLoadRatingKN, raN, rpm) >= 20000) ? 'ok' : 'warning'
            };

            const updatedBearingB: ShaftBearingSupport = {
                ...state.supportBBearing,
                reactionForceN: rbN,
                lifeHoursL10h: calculateBearingL10h(state.supportBBearing.dynamicLoadRatingKN, rbN, rpm, state.supportBBearing.bearingType.includes('roller')),
                status: (calculateBearingL10h(state.supportBBearing.dynamicLoadRatingKN, rbN, rpm) >= 20000) ? 'ok' : 'warning'
            };

            set({
                result: calc.result,
                metadata: calc.metadata,
                supportABearing: updatedBearingA,
                supportBBearing: updatedBearingB
            });
        },

        setTotalLength: (newLength: number) => {
            const currentTotal = get().segments.reduce((sum, s) => sum + s.length, 0);
            if (currentTotal <= 0) return;
            const ratio = newLength / currentTotal;
            const scaledSegments = get().segments.map(s => ({
                ...s,
                length: Math.max(5, Math.round(s.length * ratio))
            }));
            set({ totalLength: newLength, segments: scaledSegments });
            get().recalculate();
        },

        setSegmentCount: (count: number) => {
            const n = Math.max(1, Math.min(10, Math.round(count)));
            const total = get().totalLength;
            const eachLen = Math.round(total / n);
            const newSegments: ShaftSegment[] = [];

            for (let i = 0; i < n; i++) {
                const len = i === n - 1 ? total - eachLen * (n - 1) : eachLen;
                // create nice stepped profile: smaller at ends, larger in middle
                const midDist = Math.abs(i - (n - 1) / 2);
                const dia = Math.round(25 + (1 - midDist / ((n + 1) / 2)) * 25);

                newSegments.push({
                    id: `seg-${i + 1}-${Date.now()}`,
                    segmentIndex: i,
                    length: Math.max(10, len),
                    diameter: Math.max(15, dia),
                    shoulderFilletRadius: 2.0,
                    toleranceGrade: 'h7',
                    features: []
                });
            }

            set({ segments: newSegments, selectedSegmentId: newSegments[0].id });
            get().recalculate();
        },

        selectSegment: (id) => set({ selectedSegmentId: id }),
        selectFeature: (id) => set({ selectedFeatureId: id }),

        updateSegment: (id, updates) => {
            const updated = get().segments.map(s => s.id === id ? { ...s, ...updates } : s);
            const newTotal = updated.reduce((sum, s) => sum + s.length, 0);
            set({ segments: updated, totalLength: newTotal });
            get().recalculate();
        },

        setSegmentChamfer: (segmentId, chamferLeft, chamferRight, chamferAngle = 45) => {
            const updated = get().segments.map(s => s.id === segmentId ? {
                ...s,
                chamferLeft: Math.max(0, Number(chamferLeft)),
                chamferRight: Math.max(0, Number(chamferRight)),
                chamferAngle: Number(chamferAngle)
            } : s);
            set({ segments: updated });
            get().recalculate();
        },

        setGlobalChamfers: (chamferMm) => {
            const c = Math.max(0, Number(chamferMm));
            const updated = get().segments.map((s, idx, arr) => ({
                ...s,
                chamferLeft: idx === 0 ? c : Math.min(c, 1.0),
                chamferRight: idx === arr.length - 1 ? c : Math.min(c, 1.0),
                chamferAngle: 45
            }));
            set({ segments: updated });
            get().recalculate();
        },

        setShoulderTransition: (segmentIndex, transition, radius, form) => {
            const updated = get().segments.map((s, idx) => {
                if (idx === segmentIndex) {
                    return {
                        ...s,
                        shoulderTransition: transition,
                        ...(radius !== undefined ? { shoulderFilletRadius: radius } : {}),
                        ...(form !== undefined ? { shoulderUndercutForm: form } : {})
                    };
                }
                return s;
            });
            set({ segments: updated });
            get().recalculate();
        },

        addSegment: () => {
            const segs = get().segments;
            const lastSeg = segs[segs.length - 1];
            const newSeg: ShaftSegment = {
                id: `seg-${segs.length + 1}-${Date.now()}`,
                segmentIndex: segs.length,
                length: 60,
                diameter: lastSeg ? Math.max(15, lastSeg.diameter - 5) : 30,
                shoulderFilletRadius: 1.5,
                toleranceGrade: 'h7',
                features: []
            };
            const updated = [...segs, newSeg];
            const newTotal = updated.reduce((sum, s) => sum + s.length, 0);
            set({ segments: updated, totalLength: newTotal, selectedSegmentId: newSeg.id });
            get().recalculate();
        },

        removeSegment: (id) => {
            if (get().segments.length <= 1) return; // Keep at least one
            const updated = get().segments.filter(s => s.id !== id).map((s, idx) => ({ ...s, segmentIndex: idx }));
            const newTotal = updated.reduce((sum, s) => sum + s.length, 0);
            set({ segments: updated, totalLength: newTotal, selectedSegmentId: updated[0]?.id ?? null });
            get().recalculate();
        },

        splitSegment: (segmentId, splitOffsetMm) => {
            const segs = get().segments;
            const targetIdx = segs.findIndex(s => s.id === segmentId);
            if (targetIdx === -1) return;
            const target = segs[targetIdx];
            const safeOffset = Math.max(10, Math.min(target.length - 10, Math.round(splitOffsetMm)));
            const len1 = safeOffset;
            const len2 = target.length - safeOffset;

            // Split features between the two new segments based on their offset or face
            const feat1: ShaftFeature[] = [];
            const feat2: ShaftFeature[] = [];

            for (const f of target.features) {
                if (f.type === 'imbus' || f.type === 'center_drill') {
                    if (f.face === 'right_end') {
                        feat2.push(f);
                    } else {
                        feat1.push(f);
                    }
                } else {
                    if (f.offsetFromStart < len1) {
                        feat1.push(f);
                    } else {
                        feat2.push({ ...f, offsetFromStart: Math.max(5, f.offsetFromStart - len1) });
                    }
                }
            }

            const seg1: ShaftSegment = {
                ...target,
                length: len1,
                features: feat1
            };
            const seg2: ShaftSegment = {
                id: `seg-${Date.now()}`,
                segmentIndex: targetIdx + 1,
                length: len2,
                diameter: target.diameter,
                shoulderFilletRadius: target.shoulderFilletRadius,
                toleranceGrade: target.toleranceGrade,
                features: feat2
            };

            const updated = [
                ...segs.slice(0, targetIdx),
                seg1,
                seg2,
                ...segs.slice(targetIdx + 1)
            ].map((s, i) => ({ ...s, segmentIndex: i }));

            set({ segments: updated, selectedSegmentId: seg2.id });
            get().recalculate();
        },

        moveBoundary: (boundaryIndex, newX) => {
            const segs = [...get().segments];
            if (boundaryIndex <= 0 || boundaryIndex > segs.length) return;

            if (boundaryIndex === segs.length) {
                // Rightmost end: updates total length
                const prevEnds = segs.slice(0, -1).reduce((sum, s) => sum + s.length, 0);
                const newLastLen = Math.max(10, Math.round(newX - prevEnds));
                segs[segs.length - 1] = { ...segs[segs.length - 1], length: newLastLen };
                const newTotal = prevEnds + newLastLen;
                set({ segments: segs, totalLength: newTotal });
                get().recalculate();
                return;
            }

            // Internal shoulder between segs[boundaryIndex - 1] and segs[boundaryIndex]
            let xStartPrev = 0;
            for (let i = 0; i < boundaryIndex - 1; i++) {
                xStartPrev += segs[i].length;
            }
            const combinedLen = segs[boundaryIndex - 1].length + segs[boundaryIndex].length;
            const newLenPrev = Math.max(10, Math.min(combinedLen - 10, Math.round(newX - xStartPrev)));
            const newLenNext = combinedLen - newLenPrev;

            segs[boundaryIndex - 1] = { ...segs[boundaryIndex - 1], length: newLenPrev };
            segs[boundaryIndex] = { ...segs[boundaryIndex], length: newLenNext };

            set({ segments: segs });
            get().recalculate();
        },

        addFeatureToSegment: (segmentId, type) => {
            const seg = get().segments.find(s => s.id === segmentId);
            if (!seg) return;

            let newFeature: ShaftFeature;
            const fid = `feat-${type}-${Date.now()}`;

            if (type === 'keyway') {
                const kw = getStandardKeywayDIN6885(seg.diameter);
                newFeature = {
                    type: 'keyway',
                    id: fid,
                    standard: 'DIN 6885-1 Form A',
                    width: kw.width,
                    depth: kw.depth,
                    length: Math.min(kw.maxLength, Math.max(kw.minLength, Math.round(seg.length * 0.6))),
                    offsetFromStart: Math.max(5, Math.round(seg.length * 0.2))
                };
            } else if (type === 'circlip') {
                const cc = getStandardCirclipDIN471(seg.diameter);
                newFeature = {
                    type: 'circlip',
                    id: fid,
                    standard: 'DIN 471',
                    grooveDia: cc.grooveDia,
                    grooveWidth: cc.grooveWidth,
                    offsetFromStart: Math.max(5, Math.round(seg.length * 0.3))
                };
            } else if (type === 'thread') {
                const th = getRecommendedThreadISO965(seg.diameter);
                newFeature = {
                    type: 'thread',
                    id: fid,
                    standard: 'ISO 965 Metric',
                    designation: th.designation,
                    pitch: th.pitch,
                    length: Math.round(seg.length * 0.5),
                    offsetFromStart: 0
                };
            } else if (type === 'spline') {
                newFeature = {
                    type: 'spline',
                    id: fid,
                    standard: 'DIN 5480',
                    module: 1.5,
                    numTeeth: Math.max(12, Math.round((seg.diameter - 2) / 1.5)),
                    length: Math.round(seg.length * 0.7),
                    offsetFromStart: 5
                };
            } else if (type === 'cross_hole') {
                newFeature = {
                    type: 'cross_hole',
                    id: fid,
                    diameter: Math.max(3, Math.round(seg.diameter * 0.15)),
                    offsetFromStart: Math.round(seg.length * 0.5),
                    through: true
                };
            } else if (type === 'imbus') {
                const imb = getRecommendedImbusDIN912(seg.diameter);
                newFeature = {
                    type: 'imbus',
                    id: fid,
                    standard: 'DIN 912 / ISO 4762',
                    thread: imb.thread,
                    counterboreDia: imb.counterboreDia,
                    counterboreDepth: imb.counterboreDepth,
                    tapDepth: imb.tapDepth,
                    face: 'left_end'
                };
            } else if (type === 'pin') {
                const p = getRecommendedPinDIN7(seg.diameter);
                newFeature = {
                    type: 'pin',
                    id: fid,
                    standard: 'DIN 7 / ISO 2338',
                    diameter: p.diameter,
                    offsetFromStart: Math.round(seg.length * 0.5),
                    fit: p.fit
                };
            } else if (type === 'gear') {
                const defaultModule = 2.5;
                const defaultTeeth = Math.max(16, Math.round((seg.diameter * 1.5) / defaultModule));
                const defaultFaceWidth = Math.max(15, Math.min(60, Math.round(seg.length * 0.6)));
                const geom = calculateGearGeometry(defaultModule, defaultTeeth, defaultFaceWidth, 0, 20, get().torque.torqueNm);
                newFeature = {
                    type: 'gear',
                    id: fid,
                    standard: 'DIN 3960 / ISO 54',
                    gearType: 'spur',
                    module: defaultModule,
                    numTeeth: defaultTeeth,
                    pressureAngleDeg: 20,
                    helixAngleDeg: 0,
                    faceWidth: defaultFaceWidth,
                    offsetFromStart: Math.max(5, Math.round((seg.length - defaultFaceWidth) / 2)),
                    mounting: 'integral',
                    pitchDiameter: geom.pitchDiameter,
                    tipDiameter: geom.tipDiameter,
                    rootDiameter: geom.rootDiameter,
                    tangentialForceN: geom.tangentialForceN,
                    radialForceN: geom.radialForceN,
                    callout: geom.callout
                };
            } else if (type === 'undercut') {
                // Undercut belongs to the shoulder transition of this step
                get().setShoulderTransition(seg.segmentIndex, 'undercut');
                return;
            } else {
                // center_drill: Strictly allowed ONLY on first segment (left end) or last segment (right end)
                const isEnd = seg.segmentIndex === 0 || seg.segmentIndex === get().segments.length - 1;
                if (!isEnd) return;

                const cd = getStandardCenterDrillDIN332(seg.diameter, 'B');
                newFeature = {
                    type: 'center_drill',
                    id: fid,
                    standard: 'DIN 332-1',
                    form: 'B',
                    pilotDia: cd.pilotDia,
                    coneDia: cd.coneDia,
                    protectingDia: cd.protectingDia,
                    totalDepth: cd.totalDepth,
                    face: seg.segmentIndex === 0 ? 'left_end' : 'right_end',
                    callout: cd.callout
                };
            }

            const updatedSegments = get().segments.map(s => {
                if (s.id === segmentId) {
                    return { ...s, features: [...s.features, newFeature] };
                }
                return s;
            });

            set({ segments: updatedSegments, selectedFeatureId: fid });
            get().recalculate();
        },

        updateFeature: (segmentId, featureId, updates) => {
            const updatedSegments = get().segments.map(s => {
                if (s.id === segmentId) {
                    return {
                        ...s,
                        features: s.features.map(f => {
                            if (f.id === featureId) {
                                const merged = { ...f, ...updates };
                                if (merged.type === 'gear') {
                                    const geom = calculateGearGeometry(
                                        merged.module || 2.5,
                                        merged.numTeeth || 20,
                                        merged.faceWidth || 30,
                                        merged.helixAngleDeg || 0,
                                        merged.pressureAngleDeg || 20,
                                        get().torque.torqueNm
                                    );
                                    return {
                                        ...merged,
                                        pitchDiameter: geom.pitchDiameter,
                                        tipDiameter: geom.tipDiameter,
                                        rootDiameter: geom.rootDiameter,
                                        tangentialForceN: geom.tangentialForceN,
                                        radialForceN: geom.radialForceN,
                                        callout: geom.callout
                                    };
                                }
                                return merged;
                            }
                            return f;
                        })
                    };
                }
                return s;
            });
            set({ segments: updatedSegments });
            get().recalculate();
        },

        removeFeature: (segmentId, featureId) => {
            const updatedSegments = get().segments.map(s => {
                if (s.id === segmentId) {
                    return {
                        ...s,
                        features: s.features.filter(f => f.id !== featureId)
                    };
                }
                return s;
            });
            set({ segments: updatedSegments, selectedFeatureId: null });
            get().recalculate();
        },

        setMaterialId: (id) => {
            set({ materialId: id });
            get().recalculate();
        },

        setSupports: (a, b) => {
            set({ supportAPos: a, supportBPos: b });
            get().recalculate();
        },

        setBearingForSupport: (support: 'A' | 'B', bearingCode: string, syncSegmentDiameter = true) => {
            const bData = BEARING_CATALOG.find(b => b.code === bearingCode || b.code.endsWith(bearingCode));
            if (!bData) return;

            const pos = support === 'A' ? get().supportAPos : get().supportBPos;
            
            // Find which segment covers this support position
            const segments = [...get().segments];
            let cumX = 0;
            let targetSegIndex = 0;
            for (let i = 0; i < segments.length; i++) {
                cumX += segments[i].length;
                if (pos <= cumX) {
                    targetSegIndex = i;
                    break;
                }
            }

            const currentBearing = support === 'A' ? get().supportABearing : get().supportBBearing;
            const reactionN = currentBearing?.reactionForceN || 1000;
            const rpm = get().operatingRpm || 1450;
            const isRoller = bData.type.includes('roller');
            const lifeHours = calculateBearingL10h(bData.C, reactionN, rpm, isRoller);

            const newBearing: ShaftBearingSupport = {
                supportId: support,
                positionMm: pos,
                segmentIndex: targetSegIndex,
                bearingCode: bData.code,
                fullDesignation: `SKF ${bData.code}`,
                bearingType: bData.type,
                boreDia: bData.d,
                outerDia: bData.D,
                width: bData.B,
                dynamicLoadRatingKN: bData.C,
                staticLoadRatingKN: bData.C0,
                limitingSpeedRpm: bData.nMax || 15000,
                massKg: bData.mass || 0.15,
                reactionForceN: reactionN,
                lifeHoursL10h: lifeHours,
                status: lifeHours >= 20000 ? 'ok' : 'warning'
            };

            let updatedSegments = segments;
            if (syncSegmentDiameter && segments[targetSegIndex]) {
                updatedSegments = segments.map((seg, idx) => {
                    if (idx === targetSegIndex) {
                        return { ...seg, diameter: bData.d };
                    }
                    return seg;
                });
            }

            if (support === 'A') {
                set({ supportABearing: newBearing, segments: updatedSegments });
            } else {
                set({ supportBBearing: newBearing, segments: updatedSegments });
            }
            get().recalculate();
        },

        setOperatingRpm: (rpm: number) => {
            set({ operatingRpm: Math.max(1, rpm) });
            get().recalculate();
        },

        updateRadialLoad: (id, updates) => {
            const updated = get().radialLoads.map(l => l.id === id ? { ...l, ...updates } : l);
            set({ radialLoads: updated });
            get().recalculate();
        },

        addRadialLoad: () => {
            const loads = get().radialLoads;
            const newLoad: ShaftRadialLoad = {
                id: `load-${loads.length + 1}-${Date.now()}`,
                position: Math.round(get().totalLength * 0.5),
                forceN: 1500,
                description: 'Yeni Yük'
            };
            set({ radialLoads: [...loads, newLoad] });
            get().recalculate();
        },

        removeRadialLoad: (id) => {
            set({ radialLoads: get().radialLoads.filter(l => l.id !== id) });
            get().recalculate();
        },

        setTorque: (torque) => {
            set({ torque });
            get().recalculate();
        },

        setTargetSafetyFactor: (sf) => {
            set({ targetSafetyFactor: sf });
            get().recalculate();
        },

        setActiveTab: (tab) => set({ activeTab: tab }),
        setZoomLevel: (zoom) => set({ zoomLevel: zoom }),

        loadPreset: (presetId) => {
            if (presetId === 'motor') {
                const motorSegments: ShaftSegment[] = [
                    {
                        id: 'seg-m1',
                        segmentIndex: 0,
                        length: 60,
                        diameter: 28,
                        shoulderFilletRadius: 1.5,
                        toleranceGrade: 'k6',
                        features: [
                            {
                                type: 'keyway',
                                id: 'feat-m-kw1',
                                standard: 'DIN 6885-1 Form A',
                                width: 8,
                                depth: 4.0,
                                length: 40,
                                offsetFromStart: 10
                            }
                        ]
                    },
                    {
                        id: 'seg-m2',
                        segmentIndex: 1,
                        length: 50,
                        diameter: 35,
                        shoulderFilletRadius: 2.0,
                        toleranceGrade: 'k6',
                        features: []
                    },
                    {
                        id: 'seg-m3',
                        segmentIndex: 2,
                        length: 150,
                        diameter: 48,
                        shoulderFilletRadius: 2.5,
                        toleranceGrade: 'h7',
                        features: [
                            {
                                type: 'keyway',
                                id: 'feat-m-kw2',
                                standard: 'DIN 6885-1 Form A',
                                width: 14,
                                depth: 5.5,
                                length: 90,
                                offsetFromStart: 30
                            }
                        ]
                    },
                    {
                        id: 'seg-m4',
                        segmentIndex: 3,
                        length: 50,
                        diameter: 35,
                        shoulderFilletRadius: 2.0,
                        toleranceGrade: 'k6',
                        features: [
                            {
                                type: 'circlip',
                                id: 'feat-m-circ',
                                standard: 'DIN 471',
                                grooveDia: 33.0,
                                grooveWidth: 1.6,
                                offsetFromStart: 15
                            }
                        ]
                    },
                    {
                        id: 'seg-m5',
                        segmentIndex: 4,
                        length: 70,
                        diameter: 24,
                        shoulderFilletRadius: 1.5,
                        toleranceGrade: 'h7',
                        features: [
                            {
                                type: 'thread',
                                id: 'feat-m-th',
                                standard: 'ISO 965 Metric',
                                designation: 'M24x1.5',
                                pitch: 1.5,
                                length: 25,
                                offsetFromStart: 0
                            },
                            {
                                type: 'imbus',
                                id: 'feat-m-imb',
                                standard: 'DIN 912 / ISO 4762',
                                thread: 'M8',
                                counterboreDia: 15,
                                counterboreDepth: 8.5,
                                tapDepth: 20,
                                face: 'right_end'
                            }
                        ]
                    }
                ];
                set({
                    totalLength: 380,
                    segments: motorSegments,
                    selectedSegmentId: 'seg-m3',
                    selectedFeatureId: null,
                    materialId: 'c45',
                    supportAPos: 85,
                    supportBPos: 285,
                    radialLoads: [
                        { id: 'load-m1', position: 30, forceN: 2200, description: 'Kasnak / Kayış Yükü' },
                        { id: 'load-m2', position: 185, forceN: 3500, description: 'Rotor Ağırlığı & Manyetik Çekme' }
                    ],
                    torque: { torqueNm: 180, inputPosition: 30, outputPosition: 185 }
                });
            } else if (presetId === 'gearbox') {
                const gbSegments: ShaftSegment[] = [
                    {
                        id: 'seg-g1',
                        segmentIndex: 0,
                        length: 55,
                        diameter: 35,
                        shoulderFilletRadius: 2.0,
                        toleranceGrade: 'k6',
                        features: []
                    },
                    {
                        id: 'seg-g2',
                        segmentIndex: 1,
                        length: 120,
                        diameter: 50,
                        shoulderFilletRadius: 2.5,
                        toleranceGrade: 'h7',
                        features: [
                            {
                                type: 'keyway',
                                id: 'feat-g-kw1',
                                standard: 'DIN 6885-1 Form A',
                                width: 14,
                                depth: 5.5,
                                length: 70,
                                offsetFromStart: 25
                            }
                        ]
                    },
                    {
                        id: 'seg-g3',
                        segmentIndex: 2,
                        length: 60,
                        diameter: 60,
                        shoulderFilletRadius: 3.0,
                        toleranceGrade: 'h9',
                        features: []
                    },
                    {
                        id: 'seg-g4',
                        segmentIndex: 3,
                        length: 130,
                        diameter: 52,
                        shoulderFilletRadius: 2.5,
                        toleranceGrade: 'h7',
                        features: [
                            {
                                type: 'keyway',
                                id: 'feat-g-kw2',
                                standard: 'DIN 6885-1 Form A',
                                width: 16,
                                depth: 6.0,
                                length: 80,
                                offsetFromStart: 25
                            },
                            {
                                type: 'cross_hole',
                                id: 'feat-g-hole',
                                diameter: 6,
                                offsetFromStart: 115,
                                through: true
                            }
                        ]
                    },
                    {
                        id: 'seg-g5',
                        segmentIndex: 4,
                        length: 65,
                        diameter: 35,
                        shoulderFilletRadius: 2.0,
                        toleranceGrade: 'k6',
                        features: [
                            {
                                type: 'circlip',
                                id: 'feat-g-circ',
                                standard: 'DIN 471',
                                grooveDia: 33.0,
                                grooveWidth: 1.6,
                                offsetFromStart: 20
                            }
                        ]
                    }
                ];
                set({
                    totalLength: 430,
                    segments: gbSegments,
                    selectedSegmentId: 'seg-g2',
                    selectedFeatureId: null,
                    materialId: '42crmo4',
                    supportAPos: 27,
                    supportBPos: 397,
                    radialLoads: [
                        { id: 'load-g1', position: 115, forceN: 4800, description: '1. Kademe Dişli Kuvveti' },
                        { id: 'load-g2', position: 300, forceN: 3600, description: '2. Kademe Pinyon Kuvveti' }
                    ],
                    torque: { torqueNm: 320, inputPosition: 115, outputPosition: 300 }
                });
            } else if (presetId === 'pump') {
                const pumpSegments: ShaftSegment[] = [
                    {
                        id: 'seg-p1',
                        segmentIndex: 0,
                        length: 50,
                        diameter: 22,
                        shoulderFilletRadius: 1.5,
                        toleranceGrade: 'h7',
                        features: [
                            {
                                type: 'thread',
                                id: 'feat-p-th',
                                standard: 'ISO 965 Metric',
                                designation: 'M20x1.5',
                                pitch: 1.5,
                                length: 30,
                                offsetFromStart: 0
                            },
                            {
                                type: 'pin',
                                id: 'feat-p-pin',
                                standard: 'DIN 7 / ISO 2338',
                                diameter: 5,
                                offsetFromStart: 40,
                                fit: 'H7/m6'
                            }
                        ]
                    },
                    {
                        id: 'seg-p2',
                        segmentIndex: 1,
                        length: 90,
                        diameter: 32,
                        shoulderFilletRadius: 2.0,
                        toleranceGrade: 'h7',
                        features: []
                    },
                    {
                        id: 'seg-p3',
                        segmentIndex: 2,
                        length: 110,
                        diameter: 42,
                        shoulderFilletRadius: 2.5,
                        toleranceGrade: 'h7',
                        features: []
                    },
                    {
                        id: 'seg-p4',
                        segmentIndex: 3,
                        length: 70,
                        diameter: 35,
                        shoulderFilletRadius: 2.0,
                        toleranceGrade: 'k6',
                        features: [
                            {
                                type: 'circlip',
                                id: 'feat-p-circ',
                                standard: 'DIN 471',
                                grooveDia: 33.0,
                                grooveWidth: 1.6,
                                offsetFromStart: 15
                            }
                        ]
                    },
                    {
                        id: 'seg-p5',
                        segmentIndex: 4,
                        length: 80,
                        diameter: 28,
                        shoulderFilletRadius: 1.5,
                        toleranceGrade: 'k6',
                        features: [
                            {
                                type: 'keyway',
                                id: 'feat-p-kw',
                                standard: 'DIN 6885-1 Form A',
                                width: 8,
                                depth: 4.0,
                                length: 45,
                                offsetFromStart: 15
                            }
                        ]
                    }
                ];
                set({
                    totalLength: 400,
                    segments: pumpSegments,
                    selectedSegmentId: 'seg-p3',
                    selectedFeatureId: null,
                    materialId: 'x5crni18-10',
                    supportAPos: 195,
                    supportBPos: 285,
                    radialLoads: [
                        { id: 'load-p1', position: 25, forceN: 1800, description: 'Fan Hidrolik Radyal İtkisi' }
                    ],
                    torque: { torqueNm: 110, inputPosition: 360, outputPosition: 25 }
                });
            } else if (presetId === 'simple') {
                const simpleSegments: ShaftSegment[] = [
                    {
                        id: 'seg-s1',
                        segmentIndex: 0,
                        length: 80,
                        diameter: 25,
                        shoulderFilletRadius: 1.5,
                        toleranceGrade: 'k6',
                        features: []
                    },
                    {
                        id: 'seg-s2',
                        segmentIndex: 1,
                        length: 140,
                        diameter: 40,
                        shoulderFilletRadius: 2.0,
                        toleranceGrade: 'h7',
                        features: [
                            {
                                type: 'keyway',
                                id: 'feat-s-kw',
                                standard: 'DIN 6885-1 Form A',
                                width: 12,
                                depth: 5.0,
                                length: 70,
                                offsetFromStart: 35
                            }
                        ]
                    },
                    {
                        id: 'seg-s3',
                        segmentIndex: 2,
                        length: 80,
                        diameter: 25,
                        shoulderFilletRadius: 1.5,
                        toleranceGrade: 'k6',
                        features: []
                    }
                ];
                set({
                    totalLength: 300,
                    segments: simpleSegments,
                    selectedSegmentId: 'seg-s2',
                    selectedFeatureId: null,
                    materialId: 'c45',
                    supportAPos: 40,
                    supportBPos: 260,
                    radialLoads: [
                        { id: 'load-s1', position: 150, forceN: 2500, description: 'Merkez Kasnak Yükü' }
                    ],
                    torque: { torqueNm: 120, inputPosition: 40, outputPosition: 150 }
                });
            } else {
                // default
                set({
                    totalLength: 500,
                    segments: DEFAULT_SEGMENTS,
                    selectedSegmentId: 'seg-3',
                    selectedFeatureId: null,
                    materialId: 'c45',
                    supportAPos: 35,
                    supportBPos: 405,
                    radialLoads: [
                        { id: 'load-1', position: 250, forceN: 3200, description: 'Dişli Çark Radyal Yükü' }
                    ],
                    torque: { torqueNm: 150, inputPosition: 35, outputPosition: 250 }
                });
            }
            get().recalculate();
        },
    };
});
