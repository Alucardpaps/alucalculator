const MOBILE_CACHE_KEYS = [
  'alucalc-mobile-v2',
  'alucalc-i18n-storage',
  'alucalc-os-storage',
];

export async function clearAppCache(): Promise<number> {
  let cleared = 0;
  if (typeof window === 'undefined') return cleared;

  try {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
      cleared += names.length;
    }
  } catch {
    /* ignore */
  }

  try {
    for (const key of [...MOBILE_CACHE_KEYS]) {
      if (localStorage.getItem(key)) {
        /* preserve user prefs — only clear session caches */
      }
    }
    const sessionKeys = Object.keys(sessionStorage).filter(
      (k) => k.startsWith('alucalc_') || k.startsWith('calc_'),
    );
    sessionKeys.forEach((k) => sessionStorage.removeItem(k));
    cleared += sessionKeys.length;
  } catch {
    /* ignore */
  }

  if ('serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        await reg.update();
      }
    } catch {
      /* ignore */
    }
  }

  return cleared;
}
