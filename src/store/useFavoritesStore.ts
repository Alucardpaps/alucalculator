'use client';

import { create } from 'zustand';

export interface FavoriteToolItem {
  id: string;
  href: string;
  labelEn: string;
  labelTr: string;
  category?: string;
  badge?: string;
  color?: string;
}

export interface RecentToolItem {
  id: string;
  href: string;
  labelEn: string;
  labelTr: string;
  timestamp: number;
}

interface FavoritesState {
  favorites: FavoriteToolItem[];
  recents: RecentToolItem[];
  isLoaded: boolean;
  init: () => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: FavoriteToolItem) => void;
  addRecent: (item: Omit<RecentToolItem, 'timestamp'>) => void;
  clearRecents: () => void;
}

const STORAGE_KEY_FAVORITES = 'alucalc_favorite_tools_v1';
const STORAGE_KEY_RECENTS = 'alucalc_recent_tools_v1';

const DEFAULT_FAVORITES: FavoriteToolItem[] = [
  {
    id: 'beam-deflection',
    href: '/beam-deflection',
    labelEn: 'Beam Deflection Analysis',
    labelTr: 'Kiriş Sehim Analizi',
    category: 'mechanical',
    color: '#22c55e',
  },
  {
    id: 'bolt-torque',
    href: '/bolt-torque',
    labelEn: 'Bolt Torque & Fasteners (VDI 2230)',
    labelTr: 'Cıvata Torku & Bağlantı (VDI 2230)',
    category: 'mechanical',
    color: '#f59e0b',
  },
  {
    id: 'gears',
    href: '/gears',
    labelEn: 'Gear Design (ISO 6336)',
    labelTr: 'Dişli Tasarımı (ISO 6336)',
    category: 'mechanical',
    color: '#00e5ff',
  },
  {
    id: 'design-studio',
    href: '/design-studio',
    labelEn: 'Parametric Part Configurator (3D Preview)',
    labelTr: 'Parametrik Parça Konfigüratörü (3D)',
    category: 'studios',
    color: '#00e5ff',
    badge: '3D',
  },
  {
    id: 'unit-converter',
    href: '/unit-converter',
    labelEn: 'Multi-Unit Converter',
    labelTr: 'Birim Dönüştürücü',
    category: 'science',
    color: '#10b981',
  },
];

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: DEFAULT_FAVORITES,
  recents: [],
  isLoaded: false,

  init: () => {
    if (typeof window === 'undefined') return;
    try {
      const savedFavs = localStorage.getItem(STORAGE_KEY_FAVORITES);
      const savedRecents = localStorage.getItem(STORAGE_KEY_RECENTS);

      set({
        favorites: savedFavs ? JSON.parse(savedFavs) : DEFAULT_FAVORITES,
        recents: savedRecents ? JSON.parse(savedRecents) : [],
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true });
    }
  },

  isFavorite: (id: string) => {
    return get().favorites.some((f) => f.id === id);
  },

  toggleFavorite: (item: FavoriteToolItem) => {
    const current = get().favorites;
    const exists = current.some((f) => f.id === item.id);
    const updated = exists
      ? current.filter((f) => f.id !== item.id)
      : [item, ...current];

    set({ favorites: updated });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated));
      } catch {}
    }
  },

  addRecent: (item: Omit<RecentToolItem, 'timestamp'>) => {
    const current = get().recents;
    const filtered = current.filter((r) => r.id !== item.id);
    const updated: RecentToolItem[] = [
      { ...item, timestamp: Date.now() },
      ...filtered,
    ].slice(0, 6);

    set({ recents: updated });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_RECENTS, JSON.stringify(updated));
      } catch {}
    }
  },

  clearRecents: () => {
    set({ recents: [] });
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY_RECENTS);
      } catch {}
    }
  },
}));
