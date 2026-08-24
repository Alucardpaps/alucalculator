---
name: phaser-react-integration
description: Best practices for integrating Phaser 3 with React 19 and Zustand in a Unified Desk Architecture.
---

# Phaser 3 + React 19 + Zustand Integration Bridge

This document details the architectural pattern for mounting Phaser 3 inside a React application, specifically tailored for the AluCalc OS environment where the game is treated as an OS module (`DraggableWindow`).

## 1. Single Instance Mounting (React `useEffect`)

Phaser WebGL contexts are heavy. If React hot-reloads or unmounts/remounts the component (e.g., when a user minimizes a window or drags it), we must ensure the Canvas is properly managed to prevent memory leaks or `WebGL context lost` errors.

```tsx
import React, { useEffect, useRef } from 'react';
import Phaser from 'new-phaser';
import { MainScene } from './MainScene';

export function AluForgeModule() {
    const parentEl = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!parentEl.current || gameRef.current) return;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: parentEl.current,
            width: '100%',
            height: '100%',
            scene: [MainScene],
            physics: {
                default: 'matter',
                matter: {
                    gravity: { x: 0, y: 1 },
                    debug: process.env.NODE_ENV === 'development'
                }
            },
            transparent: true // Blend with OS themes
        };

        gameRef.current = new Phaser.Game(config);

        return () => {
            // CRITICAL CLEANUP Phase
            if (gameRef.current) {
                gameRef.current.destroy(true, false);
                gameRef.current = null;
            }
        };
    }, []);

    return <div ref={parentEl} className="w-full h-full" />;
}
```

## 2. EventBridge (Zustand <-> Phaser)

To keep Phaser performant at 60 FPS, we **do not** pass React props directly into the Phaser game loop every frame. Instead, we use an event bus or read directly from Zustand in the Phaser `update()` loop.

*   **Read**: Phaser scenes can call `useAluForgeStore.getState()` to read global configuration or UI toggles when needed.
*   **Write/Dispatch**: When a game event occurs (e.g., player builds a bridge), Phaser emits a custom JavaScript event or calls a Zustand action to notify React to render UI overlays or trigger AluCalc modules.

```typescript
// EventBridge.ts
import { useAluForgeStore } from './useAluForgeStore';
import { useOSStore } from '@/store/osStore';

export class EventBridge {
    static triggerModule(moduleType: string) {
        // e.g., prompt user to calculate beam deflection
        const osState = useOSStore.getState();
        osState.openWindow(moduleType as any);
        
        // Notify local game store to pause
        useAluForgeStore.getState().setGameState('paused');
    }
}
```

## 3. WebWorker Offloading (The SBTD Approach)

For complex simulations (like Factorio-style conveyor belts or thousands of enemy AI agents):
1. Create `aluForgeWorker.ts`.
2. Do **not** pass DOM elements to the worker.
3. Post state arrays `[id, x, y, hp]` via `postMessage`.
4. Update Phaser sprites in `scene.update()` based on worker messages.

## 4. UI Overlays

Do **not** build complex UI (Inventories, Dialogs, Skill Trees) inside Phaser using `Graphics` or `Text`. Phaser UI is hard to scale and debug.
Instead, use **React + Framer Motion** layered `absolute`ly on top of the Phaser `<canvas>`. Let React handle CSS, DOM layout, and accessibility (A11y), while Phaser handles the raw 60 FPS viewport rendering.
