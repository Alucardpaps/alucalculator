/**
 * modules/mechanical/DragAndBuild/store.ts
 */

import { create } from 'zustand';
import { MachineComponent, AssemblyEngine } from './engine';

interface DragState {
    components: MachineComponent[];
    draggingId: string | null;
    snapTarget: MachineComponent | null;

    addComponent: (comp: MachineComponent) => void;
    startDrag: (id: string) => void;
    onDragMove: (x: number, y: number) => void;
    endDrag: () => void;
    rotatePart: (id: string, deltaDegrees: number) => void; // Added rotation action
    removePart: (id: string) => void; // Added removal
}

export const useDragBuildStore = create<DragState>((set, get) => ({
    components: [],
    draggingId: null,
    snapTarget: null,

    addComponent: (comp) => {
        set(state => ({ components: [...state.components, comp] }));
    },

    startDrag: (id) => {
        set({ draggingId: id, snapTarget: null });
    },

    onDragMove: (x, y) => {
        const { draggingId, components } = get();
        if (!draggingId) return;

        // Temporarily move the component
        const updatedComps = components.map(c =>
            c.id === draggingId ? { ...c, position: { x, y } } : c
        );

        // Check for snaps
        const draggingComp = updatedComps.find(c => c.id === draggingId)!;
        const target = AssemblyEngine.checkSnap(draggingComp, components, 40);

        set({ components: updatedComps, snapTarget: target });
    },

    endDrag: () => {
        const { draggingId, snapTarget, components } = get();
        if (!draggingId) return;

        if (snapTarget) {
            // Apply hard snap position calculation
            const draggingComp = components.find(c => c.id === draggingId)!;
            const finalPos = AssemblyEngine.applySnap(draggingComp, snapTarget);

            set(state => ({
                components: state.components.map(c =>
                    c.id === draggingId ? { ...c, position: finalPos } : c
                ),
                draggingId: null,
                snapTarget: null
            }));
        } else {
            set({ draggingId: null, snapTarget: null });
        }
    },

    rotatePart: (id, delta) => {
        set(state => ({
            components: state.components.map(c => {
                if (c.id === id) {
                    const currentRot = c.rotation || 0;
                    return { ...c, rotation: (currentRot + delta) % 360 };
                }
                return c;
            })
        }));
    },

    removePart: (id) => {
        set(state => ({
            components: state.components.filter(c => c.id !== id),
            snapTarget: state.snapTarget?.id === id ? null : state.snapTarget
        }));
    }
}));
