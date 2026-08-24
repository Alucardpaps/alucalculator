import { create } from 'zustand';
import * as THREE from 'three';

export type ProfileType = 'flat' | 'L-bracket' | 'U-channel' | 'I-beam';

interface PartState {
    profileType: ProfileType;

    // Flat Plate dimensions
    width: number;
    height: number;
    thickness: number; // Z-depth for flat plate
    holeRadius: number;

    // Structural Profile dimensions
    webHeight: number;
    flangeWidth: number;
    webThickness: number;
    flangeThickness: number;
    length: number; // Z-depth for extruded profiles

    // Material Selection for Mod 2
    materialId: string;

    // Mod 3 & 4: Kerf & STL
    kerfLoss: number;
    meshRef: THREE.Mesh | null;

    // Phase 6: Inspection & Assembly
    sectionX: number; // Clipping Plane X (0 to 1)
    sectionY: number; // Clipping Plane Y (0 to 1)
    sectionZ: number; // Clipping Plane Z (0 to 1)
    isSectionActive: boolean;
    
    measurePointA: THREE.Vector3 | null;
    measurePointB: THREE.Vector3 | null;
    isMeasuring: boolean;

    visibleComponents: string[]; // List of active component IDs in assembly

    setDimensions: (dims: Partial<Omit<PartState, 'setDimensions' | 'setMeshRef'>>) => void;
    setMeshRef: (mesh: THREE.Mesh | null) => void;
}

export const usePartStore = create<PartState>((set) => ({
    profileType: 'flat',

    // Default flat plate
    width: 200,
    height: 150,
    thickness: 10,
    holeRadius: 25,

    // Default structural profile
    webHeight: 100,
    flangeWidth: 50,
    webThickness: 5,
    flangeThickness: 5,
    length: 500,

    materialId: 'alu-6061', // Default

    kerfLoss: 0,
    meshRef: null,

    // Phase 6 defaults
    sectionX: 0,
    sectionY: 0,
    sectionZ: 0,
    isSectionActive: false,
    measurePointA: null,
    measurePointB: null,
    isMeasuring: false,
    visibleComponents: ['all'], // Default show all

    setDimensions: (dims) => set((state) => ({ ...state, ...dims })),
    setMeshRef: (mesh) => set({ meshRef: mesh })
}));
