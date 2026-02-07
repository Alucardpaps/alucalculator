"use client";

import { useEffect } from "react";
import { useChunkErrorFix } from "@/hooks/use-chunk-error-fix";

export function DeploymentGuard() {
    // 1. Activate ChunkLoadError self-healing
    useChunkErrorFix();

    // 2. Check Build ID Mismatch on Hydration
    useEffect(() => {
        const metaBuildId = document.querySelector('meta[name="build-id"]')?.getAttribute('content');
        const envBuildId = process.env.BUILD_ID;

        if (metaBuildId && envBuildId && metaBuildId !== envBuildId) {
            console.warn(`Build ID Mismatch: HTML=${metaBuildId} vs JS=${envBuildId}. Reloading...`);
            window.location.reload();
        }
    }, []);

    return null;
}
