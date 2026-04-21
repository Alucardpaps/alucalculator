/**
 * AluCalculator Pro - Service Worker
 * Enables offline-first functionality for factory floor usage
 */

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `alucalc-static-${CACHE_VERSION}`;
const DATA_CACHE = `alucalc-data-${CACHE_VERSION}`;
const RUNTIME_CACHE = `alucalc-runtime-${CACHE_VERSION}`;

// Critical assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/offline.html',
    '/manifest.json'
];

// Assets to cache on first access
const CACHE_ON_DEMAND = [
    '/data/fasteners.json',
    '/data/materials.json'
];

/**
 * Install Event - Pre-cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Pre-caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            return name.startsWith('alucalc-') &&
                                name !== STATIC_CACHE &&
                                name !== DATA_CACHE &&
                                name !== RUNTIME_CACHE;
                        })
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

/**
 * Fetch Event - Network-first for API, Cache-first for static
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip external requests
    if (url.origin !== location.origin) return;

    // Handle API routes - Network first, cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request, RUNTIME_CACHE));
        return;
    }

    // Handle data files - Stale while revalidate
    if (url.pathname.startsWith('/data/')) {
        event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
        return;
    }

    // Handle static assets - Cache first
    event.respondWith(cacheFirst(request, STATIC_CACHE));
});

/**
 * Cache Strategies
 */

// Cache First: Try cache, fall back to network
async function cacheFirst(request, cacheName) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/offline.html');
        }
        throw error;
    }
}

// Network First: Try network, fall back to cache
async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        throw error;
    }
}

// Stale While Revalidate: Return cache immediately, update in background
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    });

    return cachedResponse || fetchPromise;
}

/**
 * Background Sync for future offline form submissions
 */
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-calculations') {
        console.log('[SW] Background sync triggered');
        // Future: sync saved calculations when back online
    }
});

/**
 * Push Notification handler (future feature)
 */
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();

        event.waitUntil(
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/badge-72x72.png'
            })
        );
    }
});

console.log('[SW] Service Worker loaded');
