'use client';

import { useEffect, useState } from 'react';

/**
 * Service Worker Registration Component
 * Enables offline-first PWA functionality
 */
export function ServiceWorkerRegistration() {
    const [isRegistered, setIsRegistered] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            return;
        }

        const registerSW = async () => {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js', {
                    scope: '/'
                });

                setIsRegistered(true);
                console.log('[PWA] Service worker registered:', registration.scope);

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                setUpdateAvailable(true);
                                console.log('[PWA] New version available');
                            }
                        });
                    }
                });

                // Handle controller change (new SW activated)
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('[PWA] Controller changed, reloading...');
                    window.location.reload();
                });

            } catch (error) {
                console.error('[PWA] Service worker registration failed:', error);
            }
        };

        // Register after page load
        if (document.readyState === 'complete') {
            registerSW();
        } else {
            window.addEventListener('load', registerSW);
            return () => window.removeEventListener('load', registerSW);
        }
    }, []);

    const handleUpdate = () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
            });
        }
    };

    // Show update toast if available
    if (updateAvailable) {
        return (
            <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up">
                <span className="text-sm">New version available!</span>
                <button
                    onClick={handleUpdate}
                    className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                    Update
                </button>
            </div>
        );
    }

    return null;
}

/**
 * Hook to check if app is installed as PWA
 */
export function useIsPWA(): boolean {
    const [isPWA, setIsPWA] = useState(false);

    useEffect(() => {
        const checkPWA = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            const isIOSStandalone = (navigator as any).standalone === true;
            setIsPWA(isStandalone || isIOSStandalone);
        };

        checkPWA();
        window.matchMedia('(display-mode: standalone)').addEventListener('change', checkPWA);

        return () => {
            window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkPWA);
        };
    }, []);

    return isPWA;
}

/**
 * Hook to check online status
 */
export function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

export default ServiceWorkerRegistration;
