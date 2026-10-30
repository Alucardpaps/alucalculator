import { describe, it, expect, beforeEach } from 'vitest';
import { useFavoritesStore } from '../store/useFavoritesStore';

describe('Quality of Life (QoL) - useFavoritesStore', () => {
  beforeEach(() => {
    useFavoritesStore.setState({
      favorites: [
        {
          id: 'beam-deflection',
          href: '/beam-deflection',
          labelEn: 'Beam Deflection Analysis',
          labelTr: 'Kiriş Sehim Analizi',
        },
      ],
      recents: [],
      isLoaded: true,
    });
  });

  it('correctly checks isFavorite for existing item', () => {
    const { isFavorite } = useFavoritesStore.getState();
    expect(isFavorite('beam-deflection')).toBe(true);
    expect(isFavorite('non-existent')).toBe(false);
  });

  it('toggles favorite on and off', () => {
    const store = useFavoritesStore.getState();
    const newTool = {
      id: 'gearbox-design',
      href: '/gearbox-design',
      labelEn: 'Gearbox Design Engine',
      labelTr: 'Redüktör Tasarım Motoru',
    };

    // Toggle on
    store.toggleFavorite(newTool);
    expect(useFavoritesStore.getState().isFavorite('gearbox-design')).toBe(true);
    expect(useFavoritesStore.getState().favorites.length).toBe(2);

    // Toggle off
    useFavoritesStore.getState().toggleFavorite(newTool);
    expect(useFavoritesStore.getState().isFavorite('gearbox-design')).toBe(false);
    expect(useFavoritesStore.getState().favorites.length).toBe(1);
  });

  it('adds recent tool item and keeps it at the top', () => {
    const store = useFavoritesStore.getState();
    store.addRecent({
      id: 'gears',
      href: '/gears',
      labelEn: 'Gear Design',
      labelTr: 'Dişli Tasarımı',
    });

    store.addRecent({
      id: 'bearings',
      href: '/bearings',
      labelEn: 'Bearing Life',
      labelTr: 'Rulman Ömrü',
    });

    const state = useFavoritesStore.getState();
    expect(state.recents.length).toBe(2);
    expect(state.recents[0].id).toBe('bearings'); // Latest is first
    expect(state.recents[1].id).toBe('gears');
  });

  it('clears recents properly', () => {
    const store = useFavoritesStore.getState();
    store.addRecent({
      id: 'gears',
      href: '/gears',
      labelEn: 'Gear Design',
      labelTr: 'Dişli Tasarımı',
    });

    expect(useFavoritesStore.getState().recents.length).toBe(1);
    store.clearRecents();
    expect(useFavoritesStore.getState().recents.length).toBe(0);
  });
});
