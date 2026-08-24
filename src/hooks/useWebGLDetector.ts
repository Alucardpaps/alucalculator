'use client';

import { useEffect } from 'react';
import { useOSStore } from '@/store/osStore';

export function useWebGLDetector() {
    const { setWebGLSupported } = useOSStore();

    useEffect(() => {
        const checkWebGL = () => {
            try {
                const canvas = document.createElement('canvas');
                const support = !!(
                    window.WebGLRenderingContext &&
                    (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
                );
                setWebGLSupported(support);
                return support;
            } catch (e) {
                setWebGLSupported(false);
                return false;
            }
        };

        checkWebGL();
    }, [setWebGLSupported]);
}
