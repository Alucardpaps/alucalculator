"use client";

import { useEffect } from "react";

export function useChunkErrorFix() {
    useEffect(() => {
        const originalError = console.error;
        console.error = (...args) => {
            if (
                typeof args[0] === "string" &&
                (args[0].includes("Loading chunk") || args[0].includes("ChunkLoadError"))
            ) {
                window.location.reload();
            }
            originalError.apply(console, args);
        };

        const handler = (event: ErrorEvent) => {
            if (
                event.message &&
                (event.message.includes("Loading chunk") ||
                    event.message.includes("ChunkLoadError"))
            ) {
                window.location.reload();
            }
        };

        window.addEventListener("error", handler);
        return () => {
            console.error = originalError;
            window.removeEventListener("error", handler);
        };
    }, []);
}
