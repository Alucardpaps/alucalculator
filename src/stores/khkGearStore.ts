import { create } from 'zustand';

export interface KhkRackParams {
    moduleVal: number;
    teethZ1: number;
    rackH: number;
    helixAngle: number;
    profileShiftX: number;
    rpm: number;
    torqueNm: number;
}

export interface KhkBevelParams {
    moduleVal: number;
    teethZ1: number;
    teethZ2: number;
    shaftAngle: number;
    system: 'gleason' | 'standard';
}

export interface KhkWormParams {
    axialModule: number;
    wormStarts: number;
    wheelTeeth: number;
    qFactor: number;
    friction: number;
    rpm: number;
    torqueNm: number;
}

export interface KhkScrewParams {
    moduleVal: number;
    teethZ1: number;
    teethZ2: number;
    beta1: number;
    beta2: number;
    rpm: number;
}

interface KhkGearStoreState {
    // Rack & Pinion
    rack: KhkRackParams;
    setRackParam: <K extends keyof KhkRackParams>(key: K, value: KhkRackParams[K]) => void;
    setRackParams: (params: Partial<KhkRackParams>) => void;

    // Bevel Gear
    bevel: KhkBevelParams;
    setBevelParam: <K extends keyof KhkBevelParams>(key: K, value: KhkBevelParams[K]) => void;
    setBevelParams: (params: Partial<KhkBevelParams>) => void;

    // Worm Gear
    worm: KhkWormParams;
    setWormParam: <K extends keyof KhkWormParams>(key: K, value: KhkWormParams[K]) => void;
    setWormParams: (params: Partial<KhkWormParams>) => void;

    // Screw Gear
    screw: KhkScrewParams;
    setScrewParam: <K extends keyof KhkScrewParams>(key: K, value: KhkScrewParams[K]) => void;
    setScrewParams: (params: Partial<KhkScrewParams>) => void;
}

export const useKhkGearStore = create<KhkGearStoreState>((set) => ({
    // Rack & Pinion defaults
    rack: {
        moduleVal: 3,
        teethZ1: 20,
        rackH: 28,
        helixAngle: 0,
        profileShiftX: 0,
        rpm: 150,
        torqueNm: 45,
    },
    setRackParam: (key, value) =>
        set((state) => ({ rack: { ...state.rack, [key]: value } })),
    setRackParams: (params) =>
        set((state) => ({ rack: { ...state.rack, ...params } })),

    // Bevel Gear defaults
    bevel: {
        moduleVal: 3,
        teethZ1: 20,
        teethZ2: 40,
        shaftAngle: 90,
        system: 'gleason',
    },
    setBevelParam: (key, value) =>
        set((state) => ({ bevel: { ...state.bevel, [key]: value } })),
    setBevelParams: (params) =>
        set((state) => ({ bevel: { ...state.bevel, ...params } })),

    // Worm Gear defaults
    worm: {
        axialModule: 4,
        wormStarts: 2,
        wheelTeeth: 40,
        qFactor: 10,
        friction: 0.04,
        rpm: 1450,
        torqueNm: 50,
    },
    setWormParam: (key, value) =>
        set((state) => ({ worm: { ...state.worm, [key]: value } })),
    setWormParams: (params) =>
        set((state) => ({ worm: { ...state.worm, ...params } })),

    // Screw Gear defaults
    screw: {
        moduleVal: 3,
        teethZ1: 20,
        teethZ2: 20,
        beta1: 45,
        beta2: 45,
        rpm: 1000,
    },
    setScrewParam: (key, value) =>
        set((state) => ({ screw: { ...state.screw, [key]: value } })),
    setScrewParams: (params) =>
        set((state) => ({ screw: { ...state.screw, ...params } })),
}));
