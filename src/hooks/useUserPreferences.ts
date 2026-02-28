'use client';

import { useState, useEffect } from 'react';

const STORAGE_PREFIX = 'alucalc_';

export interface UserPreferences {
    selectedMaterial: string;
    unitSystem: 'metric' | 'imperial';
    unitPrice: number;
    lastShape: string;
    lastDimensions: Record<string, number>;
    cuttingMethod: string;
    theme: 'light' | 'dark' | 'system';
    terminalHistory: string[];
}

const DEFAULT_PREFERENCES: UserPreferences = {
    selectedMaterial: '6061-T6 (US Standard)',
    unitSystem: 'metric',
    unitPrice: 0,
    lastShape: 'plate',
    lastDimensions: {},
    cuttingMethod: 'laser_fiber',
    theme: 'system',
    terminalHistory: []
};

/**
 * Save a single preference to localStorage
 */
export function savePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
): void {
    try {
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch (e) {
        console.warn('localStorage unavailable:', e);
    }
}

/**
 * Load a single preference from localStorage
 */
export function loadPreference<K extends keyof UserPreferences>(
    key: K,
    defaultValue: UserPreferences[K]
): UserPreferences[K] {
    try {
        const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

/**
 * Load all preferences
 */
export function loadAllPreferences(): UserPreferences {
    return {
        selectedMaterial: loadPreference('selectedMaterial', DEFAULT_PREFERENCES.selectedMaterial),
        unitSystem: loadPreference('unitSystem', DEFAULT_PREFERENCES.unitSystem),
        unitPrice: loadPreference('unitPrice', DEFAULT_PREFERENCES.unitPrice),
        lastShape: loadPreference('lastShape', DEFAULT_PREFERENCES.lastShape),
        lastDimensions: loadPreference('lastDimensions', DEFAULT_PREFERENCES.lastDimensions),
        cuttingMethod: loadPreference('cuttingMethod', DEFAULT_PREFERENCES.cuttingMethod),
        theme: loadPreference('theme', DEFAULT_PREFERENCES.theme),
        terminalHistory: loadPreference('terminalHistory', DEFAULT_PREFERENCES.terminalHistory)
    };
}

/**
 * Clear all preferences
 */
export function clearAllPreferences(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
    keys.forEach(key => localStorage.removeItem(key));
}

/**
 * Custom hook for persisted state
 */
export function usePersistedState<K extends keyof UserPreferences>(
    key: K,
    defaultValue: UserPreferences[K]
): [UserPreferences[K], (value: UserPreferences[K]) => void] {
    const [value, setValue] = useState<UserPreferences[K]>(defaultValue);
    const [isHydrated, setIsHydrated] = useState(false);

    // Hydrate from localStorage on mount
    useEffect(() => {
        const stored = loadPreference(key, defaultValue);
        setValue(stored);
        setIsHydrated(true);
    }, [key]); // Only re-hydrate if the key changes. DefaultValue is only for fallback.

    // Save to localStorage on change
    useEffect(() => {
        if (isHydrated) {
            savePreference(key, value);
        }
    }, [key, value, isHydrated]);

    return [value, setValue];
}

/**
 * Hook for managing all user preferences
 */
export function useUserPreferences() {
    const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setPreferences(loadAllPreferences());
        setIsLoaded(true);
    }, []);

    const updatePreference = <K extends keyof UserPreferences>(
        key: K,
        value: UserPreferences[K]
    ) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
        savePreference(key, value);
    };

    const resetPreferences = () => {
        clearAllPreferences();
        setPreferences(DEFAULT_PREFERENCES);
    };

    return {
        preferences,
        updatePreference,
        resetPreferences,
        isLoaded
    };
}

export default useUserPreferences;
