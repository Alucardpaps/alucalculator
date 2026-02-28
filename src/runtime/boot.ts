/**
 * Engineering Runtime Boot Loader
 * 
 * Strict isolation layer that prevents Server-Side Rendering (SSR) contamination.
 * Guarantees that the Kernel spins up only in a valid Browser environment.
 */

export function bootEngineeringOS() {
    if (typeof window === 'undefined') {
        throw new Error('CRITICAL: Engineering OS attempted to boot in Server Environment. SSR Firewall breached.');
    }

    // Prevent double-boot
    if ((window as any).__ALUCALC_OS__) {
        console.warn('Engineering OS Kernel already active.');
        return;
    }

    // Initialize Runtime Kernel
    (window as any).__ALUCALC_OS__ = {
        version: '5.0.0-RC1',
        architecture: 'x86_64-wasm-bridge', // Future proooofing
        mode: 'client-engineering-runtime',
        bootTime: Date.now(),
        kernelState: 'MOUNTED',
        security: {
            ssr: 'BLOCKED',
            hydration: 'BYPASSED'
        }
    };

    console.log(
        '%c 🏛 ALUCALC ENGINEERING OS v5.0 %c KERNEL BOOT SEQUENCE STARTED ',
        'background: #000; color: #fff; padding: 4px; border-radius: 4px; font-weight: bold;',
        'color: #00e5ff; font-family: monospace;'
    );
}
