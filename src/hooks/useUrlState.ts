import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

export function useUrlState() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Helper to get initial values on mount
    const getInitialState = () => {
        const params = new URLSearchParams(searchParams.toString());
        const state: any = {};
        for (const [key, value] of params.entries()) {
            state[key] = value;
        }
        return state;
    };

    // Debounced update function
    const updateUrl = useCallback((newState: Record<string, string | number>) => {
        const params = new URLSearchParams(searchParams.toString());

        // Update params
        Object.entries(newState).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') {
                params.delete(key);
            } else {
                params.set(key, String(value));
            }
        });

        // Construct new URL
        const queryString = params.toString();
        const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

        // Replace history to avoid back-button spam
        router.replace(newUrl, { scroll: false });
    }, [pathname, router, searchParams]);

    return { updateUrl, getInitialState, searchParams };
}
