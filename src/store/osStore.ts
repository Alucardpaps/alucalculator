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

export type Theme = 'dark' | 'light' | 'paper' | 'sea' | 'sky';

export interface OSWindow {
    id: string;
    type: ModuleType;
    title: string;
    position: WindowPosition;
    size: WindowSize;
    zIndex: number;
    minimized: boolean;
    maximized: boolean | 'left' | 'right';
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

    // Theme & UX
    theme: Theme;
    fontSize: 'small' | 'medium' | 'large';
    fontFamily: 'sans' | 'mono' | 'serif';
    hasSeenWelcome: boolean;
    showWelcomeModal: boolean;
    startMenuOpen: boolean;
    activeSettingsTab: string;
    isChaosMode: boolean; // Avant-Garde Overdrive State
    isFocusMode: boolean; // Zen / Deep Work State
    isAudioEnabled: boolean; // Cyber-Acoustic Feedback
    isSelfDestructing: boolean; // Theatrical self-destruct state
    isDockHidden: boolean; // Taskbar visibility
    isWebGLSupported: boolean; // Hardware capability flag
}


export type WorkspaceMode = 'cad' | 'cam' | 'desk' | 'fea' | 'mechanical' | 'manufacturing' | 'civil' | 'electrical' | 'science' | 'finance' | 'software' | 'flow';

interface OSActions {
    openWindow: (type: ModuleType, maximized?: boolean) => void;
    closeWindow: (id: string) => void;
    focusWindow: (id: string) => void;
    minimizeWindow: (id: string) => void;
    restoreWindow: (id: string) => void;
    toggleMaximize: (id: string) => void;
    snapWindow: (id: string, mode: 'left' | 'right') => void;
    updateWindowPosition: (id: string, position: WindowPosition) => void;
    updateWindowSize: (id: string, size: WindowSize) => void;
    closeAllWindows: () => void;
    setLanguage: (lang: string) => void;
    setDictionary: (dict: any) => void;
    toggleWindow: (id: string) => void;
    bringToFront: (id: string) => void;

    setTheme: (theme: Theme) => void;
    setFontSize: (size: 'small' | 'medium' | 'large') => void;
    setFontFamily: (family: 'sans' | 'mono' | 'serif') => void;
    openWelcome: () => void;
    completeWelcome: () => void;
    resetWelcome: () => void; // Debug

    // Workspace Mode
    workspaceMode: WorkspaceMode;
    setWorkspaceMode: (mode: WorkspaceMode) => void;

    // Start Menu
    toggleStartMenu: () => void;
    setStartMenuOpen: (open: boolean) => void;
    setActiveSettingsTab: (tab: string) => void;
    toggleChaosMode: () => void;
    toggleFocusMode: () => void;
    toggleAudio: () => void;
    initiateSelfDestruct: () => void;

    // Unit System
    unitSystem: 'metric' | 'imperial';
    setUnitSystem: (sys: 'metric' | 'imperial') => void;

    toggleDock: () => void;
    setWebGLSupported: (supported: boolean) => void;
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

            // Default State
            theme: 'dark',
            fontSize: 'medium',
            fontFamily: 'sans',
            hasSeenWelcome: true, // Skip Welcome Screen by default
            showWelcomeModal: false,
            workspaceMode: 'desk',
            startMenuOpen: false, // Global Start Menu State
            activeSettingsTab: 'appearance',
            unitSystem: 'metric',
            isChaosMode: false, // Default off
            isFocusMode: false, // Default off
            isAudioEnabled: false, // Default off to prevent sudden loud noises
            isSelfDestructing: false,
            isDockHidden: false,
            isWebGLSupported: true, // Default to true until checked


            setDictionary: (dict: any) => set({ dictionary: dict }),
            setWorkspaceMode: (mode: WorkspaceMode) => set({ workspaceMode: mode }),
            setUnitSystem: (sys: 'metric' | 'imperial') => set({ unitSystem: sys }),

            toggleStartMenu: () => set(state => ({ startMenuOpen: !state.startMenuOpen })),
            setStartMenuOpen: (open: boolean) => set({ startMenuOpen: open }),
            setActiveSettingsTab: (tab: string) => set({ activeSettingsTab: tab }),
            toggleChaosMode: () => set(state => ({ isChaosMode: !state.isChaosMode })),
            toggleFocusMode: () => set(state => ({ isFocusMode: !state.isFocusMode })),
            toggleAudio: () => set(state => {
                const newState = !state.isAudioEnabled;
                import('@/lib/audioEngine').then(m => m.sysAudio.setEnabled(newState));
                return { isAudioEnabled: newState };
            }),
            initiateSelfDestruct: () => {
                set({ isSelfDestructing: true });
                // Reset after 12 seconds (10s countdown + 2s crash)
                setTimeout(() => {
                    set({ isSelfDestructing: false });
                }, 13000);
            },

            toggleDock: () => set(state => ({ isDockHidden: !state.isDockHidden })),
            setWebGLSupported: (supported: boolean) => set({ isWebGLSupported: supported }),


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

            openWindow: (type: ModuleType, maximized: boolean = false) => {
                const { windows, nextZIndex } = get();
                const moduleDef = MODULE_REGISTRY[type];

                if (!moduleDef) {
                    console.error(`Attempted to open undefined module: ${type}`);
                    return;
                }

                // Check if window of this type already exists
                const existing = windows.find(w => w.type === type);
                if (existing) {
                    // Focus existing window
                    get().focusWindow(existing.id);
                    if (existing.minimized) {
                        get().restoreWindow(existing.id);
                    }
                    if (maximized && !existing.maximized) {
                        get().toggleMaximize(existing.id);
                    }
                    import('@/lib/audioEngine').then(m => m.sysAudio.playSwoosh());
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
                    title: moduleDef.title,
                    position,
                    size: moduleDef.defaultSize,
                    zIndex: nextZIndex,
                    minimized: false,
                    maximized: maximized
                };

                import('@/lib/audioEngine').then(m => m.sysAudio.playSwoosh());

                set({
                    windows: [...windows, newWindow],
                    activeWindowId: newWindow.id,
                    nextZIndex: nextZIndex + 1
                });
            },

            closeWindow: (id: string) => {
                const { windows, activeWindowId } = get();
                const filtered = windows.filter(w => w.id !== id);

                let nextActiveId = activeWindowId === id
                    ? (filtered.length > 0 ? filtered[filtered.length - 1].id : null)
                    : activeWindowId;

                set({
                    windows: filtered,
                    activeWindowId: nextActiveId
                });

                import('@/lib/audioEngine').then(m => m.sysAudio.playSwoosh());

                if (nextActiveId) {
                    get().focusWindow(nextActiveId);
                } else {
                    set({ workspaceMode: 'desk' });
                }
            },

            focusWindow: (id: string) => {
                const { windows, nextZIndex } = get();
                const win = windows.find(w => w.id === id);
                if (!win) return;

                // Sync workspace mode based on window type for contextual tools and sidebar highlight
                let mode: any = 'desk';
                if (win.type === 'cad-editor') mode = 'cad';
                else if (win.type === 'cutting-optimizer') mode = 'cam';
                else if (win.type === 'simulation-fea') mode = 'fea';
                else if (win.type === 'manufacturing-sandbox') mode = 'cam'; // Sandbox belongs to CAM/Mfg workspace
                else if (win.type === 'engineering-selection') mode = 'mechanical';
                else if (win.type === 'thermal-expansion') mode = 'mechanical';
                else {
                    const category = MODULE_REGISTRY[win.type].category;
                    if (['mechanical', 'manufacturing', 'civil', 'electrical', 'science', 'finance', 'software'].includes(category)) {
                        mode = category;
                    }
                }

                set({
                    windows: windows.map(w =>
                        w.id === id ? { ...w, zIndex: nextZIndex } : w
                    ),
                    activeWindowId: id,
                    nextZIndex: nextZIndex + 1,
                    workspaceMode: mode
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

            toggleMaximize: (id: string) => {
                set(state => ({
                    windows: state.windows.map(w => {
                        if (w.id === id) {
                            const isMax = w.maximized === true || w.maximized === 'left' || w.maximized === 'right';
                            return { ...w, maximized: !isMax };
                        }
                        return w;
                    })
                }));
            },

            snapWindow: (id: string, mode: 'left' | 'right') => {
                set(state => ({
                    windows: state.windows.map(w =>
                        w.id === id ? { ...w, maximized: mode, minimized: false, zIndex: state.nextZIndex } : w
                    ),
                    activeWindowId: id,
                    nextZIndex: state.nextZIndex + 1
                }));
            },

            updateWindowPosition: (id: string, position: WindowPosition) => {
                set(state => ({
                    windows: state.windows.map(w =>
                        (w.id === id && !w.maximized) ? { ...w, position } : w
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
            },

            // Theme & UX Actions
            setTheme: (theme: Theme) => set({ theme }),
            setFontSize: (fontSize) => set({ fontSize }),
            setFontFamily: (fontFamily) => set({ fontFamily }),

            openWelcome: () => set({ showWelcomeModal: true }),

            completeWelcome: () => set({
                showWelcomeModal: false,
                hasSeenWelcome: true
            }),

            resetWelcome: () => set({
                hasSeenWelcome: false,
                showWelcomeModal: true
            })
        }),
        {
            name: 'alucalc-os-state',
            version: 2,
            migrate: (persistedState: any, version: number) => {
                if (version < 2) {
                    // v2 migration: filter out windows with invalid module types
                    // This prevents crashes when MODULE_REGISTRY changes between deploys
                    const validTypes = Object.keys(MODULE_REGISTRY);
                    return {
                        ...persistedState,
                        windows: (persistedState.windows || []).filter(
                            (w: any) => validTypes.includes(w.type)
                        ),
                        activeWindowId: null,
                        nextZIndex: 100,
                    };
                }
                return persistedState as OSState & OSActions;
            },
            partialize: (state) => ({
                windows: state.windows,
                activeWindowId: state.activeWindowId,
                nextZIndex: state.nextZIndex,
                currentLanguage: state.currentLanguage,
                theme: state.theme,
                hasSeenWelcome: state.hasSeenWelcome,
                workspaceMode: state.workspaceMode,
                isChaosMode: state.isChaosMode,
                isFocusMode: state.isFocusMode,
                isAudioEnabled: state.isAudioEnabled,
                isDockHidden: state.isDockHidden,
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
