---
name: phaser-react-integration
description: Pattern for mounting a Phaser 3 game inside AluCalc OS as a draggable OS-window module with React 19 and Zustand. Use when creating or modifying a Phaser scene/module (e.g. AluForge), wiring Phaser events to Zustand or OS windows, offloading simulation to a Web Worker, or building game UI overlays.
---

# Phaser 3 + React 19 + Zustand Integration

The game runs as an OS module inside a `DraggableWindow`. Phaser owns the 60 FPS viewport; React owns UI, layout and accessibility.

## Rules
1. **Mount exactly one `Phaser.Game` per module instance and destroy it on unmount.** Minimizing or dragging a window can unmount/remount the component; a leaked WebGL context causes `WebGL context lost`. Guard with a ref and call `game.destroy(true, false)` in the effect cleanup. → `references/mount-example.tsx`
2. **Never push React props into the game loop every frame.** Phaser reads global state with `useXStore.getState()` when needed, and writes by emitting an event or calling a Zustand action. Opening an AluCalc module from the game goes through an `EventBridge`. → `references/event-bridge.ts`
3. **Heavy simulation goes to a Web Worker** (conveyor belts, thousands of agents). No DOM objects in the worker; post flat state arrays (`[id, x, y, hp]`) and update sprites in `scene.update()`. → `references/worker-offload.md`
4. **No complex UI inside Phaser** (inventories, dialogs, skill trees). Layer React (+ Framer Motion) absolutely over the `<canvas>`.
5. **Bundle isolation:** load the game module with `dynamic(() => import(...), { ssr: false })`, consistent with the heavy-engine rule in `AGENTS.md` §4, so `/` and `/lite` don't pull Phaser.

## Done-check
Open the window, minimize, restore, drag, close — confirm one canvas, no console errors, no `WebGL context lost`. Report per `.agents/skills/qa-verification-protocol/`.
