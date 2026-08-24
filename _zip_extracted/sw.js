/**
 * AluCalculator V2 — Service Worker
 * 
 * Offline-first caching strategy for Engineering Tool.
 * 
 * Caching Strategy:
 * - Static assets: Cache First
 * - API/Data: Network First with cache fallback
 * - Calculators: Stale-While-Revalidate
 */

const CACHE_NAME = 'alucalc-v2.0.0';
const STATIC_CACHE = 'alucalc-static-v2';
const DYNAMIC_CACHE = 'alucalc-dynamic-v2';

// Assets to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker v2...');

    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[SW] Precaching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );

    // Activate immediately
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker v2...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                    .map((name) => {
                        console.log(`[SW] Deleting old cache: ${name}`);
                        return caches.delete(name);
                    })
            );
        })
    );

    // Claim all clients immediately
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    let { request } = event;
    let url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip external requests
    if (url.origin !== location.origin) return;

    // Rewrite Next.js client dynamic route RSC payload fetch calls.
    // Next.js static export generates nested directory payloads like:
    // .../__next.calculators/$d$slug/
    // but the client-side router requests dot-separated files like:
    // .../__next.calculators.$d$slug.txt or .../__next.calculators.$d$slug.__PAGE__.txt
    // We rewrite the dot separator back to a slash.
    if (url.pathname.includes('__next.')) {
        let rewrittenPathname = url.pathname;
        if (rewrittenPathname.includes('.$d$slug')) {
            rewrittenPathname = rewrittenPathname.replace(/__next\.([a-zA-Z0-9_-]+)\.\$d\$slug/g, '__next.$1/$d$slug');
        }
        if (rewrittenPathname.includes('.__PAGE__')) {
            rewrittenPathname = rewrittenPathname.replace(/__next\.([a-zA-Z0-9_-]+)\.__PAGE__/g, '__next.$1/__PAGE__');
        }
        if (rewrittenPathname !== url.pathname) {
            console.log(`[SW] Rewriting RSC path: ${url.pathname} -> ${rewrittenPathname}`);
            const rewrittenUrl = new URL(url.href);
            rewrittenUrl.pathname = rewrittenPathname;
            request = new Request(rewrittenUrl.toString(), request);
            url = rewrittenUrl;
        }
    }

    // API requests: Network first
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Static assets: Cache first
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Everything else: Stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request));
});

// ============================================
// CACHING STRATEGIES
// ============================================

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        console.log('[SW] Cache-first fetch failed:', error);
        return new Response('Offline', { status: 503 });
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);

    // Revalidate in background
    const fetchPromise = fetch(request).then((response) => {
        cache.put(request, response.clone());
        return response;
    }).catch(() => null);

    // Return cached or fetch
    return cached || fetchPromise;
}

// ============================================
// HELPERS
// ============================================

function isStaticAsset(pathname) {
    return (
        pathname.endsWith('.js') ||
        pathname.endsWith('.css') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.woff2') ||
        pathname.endsWith('.ico')
    );
}

// ============================================
// INDEXEDDB STATE PERSISTENCE
// ============================================

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data.type === 'SAVE_STATE') {
        saveToIndexedDB(event.data.key, event.data.value);
    }

    if (event.data.type === 'GET_STATE') {
        getFromIndexedDB(event.data.key).then((value) => {
            event.source.postMessage({ type: 'STATE_RESPONSE', key: event.data.key, value });
        });
    }
});

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('AluCalcState', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('state')) {
                db.createObjectStore('state');
            }
            if (!db.objectStoreNames.contains('calculations')) {
                db.createObjectStore('calculations', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

async function saveToIndexedDB(key, value) {
    const db = await openDB();
    const tx = db.transaction('state', 'readwrite');
    tx.objectStore('state').put(value, key);
    return tx.complete;
}

async function getFromIndexedDB(key) {
    const db = await openDB();
    const tx = db.transaction('state', 'readonly');
    return tx.objectStore('state').get(key);
}
