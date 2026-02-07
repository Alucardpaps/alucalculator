/**
 * AluCalc OS - Window Management Store
 * Zustand-based operating system kernel for managing draggable windows
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ModuleType, WindowSize, MODULE_REGISTRY } from '@/config/modules';

// ============================================
// Types
// ============================================

export interface WindowPosition {
    x: number;
    y: number;
}

export interface OSWindow {
    id: string;
    type: ModuleType;
    title: string;
    position: WindowPosition;
    size: WindowSize;
    zIndex: number;
    minimized: boolean;
}

// ============================================
// Store Interface
// ============================================

interface OSState {
    windows: OSWindow[];
    activeWindowId: string | null;
    nextZIndex: number;
    currentLanguage: string;
    dictionary: any;
}

interface OSActions {
    openWindow: (type: ModuleType) => void;
    closeWindow: (id: string) => void;
    focusWindow: (id: string) => void;
    minimizeWindow: (id: string) => void;
    restoreWindow: (id: string) => void;
    updateWindowPosition: (id: string, position: WindowPosition) => void;
    updateWindowSize: (id: string, size: WindowSize) => void;
    closeAllWindows: () => void;
    setLanguage: (lang: string) => void;
    setDictionary: (dict: any) => void;
    toggleWindow: (id: string) => void;
    bringToFront: (id: string) => void;
}

// ============================================
// Store Implementation
// ============================================

export const useOSStore = create<OSState & OSActions>()(
    persist(
        (set, get) => ({
            windows: [],
            activeWindowId: null,
            nextZIndex: 100,
            currentLanguage: 'en',
            dictionary: {},
            setDictionary: (dict: any) => set({ dictionary: dict }),

            bringToFront: (id: string) => get().focusWindow(id),

            toggleWindow: (id: string) => {
                const { windows, activeWindowId } = get();
                const win = windows.find(w => w.id === id);
                if (!win) return;

                if (activeWindowId === id && !win.minimized) {
                    get().minimizeWindow(id);
                } else {
                    if (win.minimized) get().restoreWindow(id);
                    get().focusWindow(id);
                }
            },

            openWindow: (type: ModuleType) => {
                const { windows, nextZIndex } = get();
                const module = MODULE_REGISTRY[type];

                // Check if window of this type already exists
                const existing = windows.find(w => w.type === type);
                if (existing) {
                    // Focus existing window
                    get().focusWindow(existing.id);
                    if (existing.minimized) {
                        get().restoreWindow(existing.id);
                    }
                    return;
                }

                // Calculate position (cascade from top-left)
                const offset = (windows.length % 10) * 30;
                const position: WindowPosition = {
                    x: 100 + offset,
                    y: 80 + offset
                };

                const newWindow: OSWindow = {
                    id: `${type}-${Date.now()}`,
                    type,
                    title: module.title,
                    position,
                    size: module.defaultSize,
                    zIndex: nextZIndex,
                    minimized: false
                };

                set({
                    windows: [...windows, newWindow],
                    activeWindowId: newWindow.id,
                    nextZIndex: nextZIndex + 1
                });
            },

            closeWindow: (id: string) => {
                const { windows, activeWindowId } = get();
                const filtered = windows.filter(w => w.id !== id);

                set({
                    windows: filtered,
                    activeWindowId: activeWindowId === id
                        ? (filtered.length > 0 ? filtered[filtered.length - 1].id : null)
                        : activeWindowId
                });
            },

            focusWindow: (id: string) => {
                const { windows, nextZIndex } = get();

                set({
                    windows: windows.map(w =>
                        w.id === id ? { ...w, zIndex: nextZIndex } : w
                    ),
                    activeWindowId: id,
                    nextZIndex: nextZIndex + 1
                });
            },

            minimizeWindow: (id: string) => {
                const { windows, activeWindowId } = get();

                const updated = windows.map(w =>
                    w.id === id ? { ...w, minimized: true } : w
                );

                // Find next non-minimized window to focus
                const visible = updated.filter(w => !w.minimized);
                const newActive = visible.length > 0
                    ? visible.reduce((a, b) => a.zIndex > b.zIndex ? a : b).id
                    : null;

                set({
                    windows: updated,
                    activeWindowId: activeWindowId === id ? newActive : activeWindowId
                });
            },

            restoreWindow: (id: string) => {
                const { windows, nextZIndex } = get();

                set({
                    windows: windows.map(w =>
                        w.id === id ? { ...w, minimized: false, zIndex: nextZIndex } : w
                    ),
                    activeWindowId: id,
                    nextZIndex: nextZIndex + 1
                });
            },

            updateWindowPosition: (id: string, position: WindowPosition) => {
                set(state => ({
                    windows: state.windows.map(w =>
                        w.id === id ? { ...w, position } : w
                    )
                }));
            },

            updateWindowSize: (id: string, size: WindowSize) => {
                set(state => ({
                    windows: state.windows.map(w =>
                        w.id === id ? { ...w, size } : w
                    )
                }));
            },

            closeAllWindows: () => {
                set({ windows: [], activeWindowId: null });
            },

            setLanguage: (lang: string) => {
                set({ currentLanguage: lang });
            }
        }),
        {
            name: 'alucalc-os-state',
            partialize: (state) => ({
                windows: state.windows,
                activeWindowId: state.activeWindowId,
                nextZIndex: state.nextZIndex,
                currentLanguage: state.currentLanguage
            })
        }
    )
);

// ============================================
// Selectors
// ============================================

export const selectVisibleWindows = (state: OSState) =>
    state.windows.filter(w => !w.minimized);

export const selectMinimizedWindows = (state: OSState) =>
    state.windows.filter(w => w.minimized);

export const selectWindowsByCategory = (state: OSState, category: string) =>
    state.windows.filter(w => MODULE_REGISTRY[w.type].category === category);
