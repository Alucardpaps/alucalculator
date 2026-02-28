'use client';

import React, { useState, useEffect } from 'react';

/**
 * ClientOnly
 * Renders children only on the client-side to prevent hydration mismatches.
 * Use this for components that use `window`, `document`, or heavy interactive 3D/Audio logic.
 */
export default function ClientOnly({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
