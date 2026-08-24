# AluCalc OS - Optimization Audit Report

## 1) Optimization Summary

AluCalc OS is a sophisticated engineering application that handles complex state and 3D visualization. The current optimization health is **Fair**, with a well-structured codebase but significant "low-hanging fruit" in the rendering and state management domains.

### Top 3 Highest-Impact Improvements:
1.  **3D Geometry Memoization**: memoizing `EdgesGeometry` and `TubeGeometry` in `TechnicalDrawing3D.tsx` to stop massive memory allocations during parameter adjustments.
2.  **State Persistence Debouncing**: Throttling or debouncing the `persist` middleware in `useFlowStore` to prevent excessive localStorage serialization during node dragging.
3.  **Store Selector Optimization**: implementing granular selectors or `useShallow` to prevent full window/node array re-renders when only small properties change.

### Biggest Risk:
If no changes are made, the application will experience **significant frame drops and input lag** (jank) as the number of nodes in the Flow editor or the complexity of 3D models increases. Mobile users or those on lower-end hardware will likely experience crashes due to memory pressure from un-memoized geometries.

## 2) Findings (Prioritized)

### [Finding 1] Frequent Serialization of Large State in Persistence
*   **Title**: Excessive LocalStorage Serialization during Interaction
*   **Category**: I/O / Performance
*   **Severity**: High
*   **Impact**: Latency (Main thread blocking)
*   **Evidence**: `flowStore.ts` uses `persist` middleware without debouncing for the `nodes` array, which includes all node positions.
*   **Why it’s inefficient**: During `onNodesChange` (dragging), the entire `nodes` array is serialized to JSON and written to `localStorage` up to 60 times per second. `JSON.stringify` on a large node graph is expensive and happens on the main thread.
*   **Recommended fix**: Implement a `debounce` on the `persist` storage calls or exclude high-frequency fields (like temporary position) from immediate persistence.
*   **Tradeoffs / Risks**: Brief loss of state if the browser crashes exactly during a drag.
*   **Expected impact estimate**: 30-50% reduction in main-thread scripting time during drags.
*   **Removal Safety**: Safe
*   **Reuse Scope**: Store-wide

### [Finding 2] Excessive Geometry Allocations in 3D Render Path
*   **Title**: Non-Memoized `EdgesGeometry` in `StandardProfile`
*   **Category**: Memory / CPU
*   **Severity**: Critical
*   **Impact**: Memory Usage / Latency
*   **Evidence**: `TechnicalDrawing3D.tsx` line 362: `<edgesGeometry args={[new THREE.ExtrudeGeometry(profileShape, extrudeSettings)]} />`
*   **Why it’s inefficient**: A new `ExtrudeGeometry` and `EdgesGeometry` instance is created **every single frame** or whenever any prop changes. Geometry creation is the most expensive operation in Three.js and triggers GC pressure.
*   **Recommended fix**: Use `useMemo` to cache the geometry based on `profileShape` and `extrudeSettings`.
*   **Tradeoffs / Risks**: None.
*   **Expected impact estimate**: Massive reduction in heap growth; stable 60FPS during parameter changes.
*   **Removal Safety**: Safe
*   **Reuse Scope**: Component-local

### [Finding 3] O(N) Array Iteration in State Selectors
*   **Title**: Inefficient Store Mapping for Updates
*   **Category**: CPU / Algorithm
*   **Severity**: Medium
*   **Impact**: Throughput / Latency
*   **Evidence**: `flowStore.ts` (lines 539, 599, 639) and `osStore.ts` (lines 209, 222, 260) map over arrays for simple ID-based updates.
*   **Why it’s inefficient**: As the number of windows or nodes grows, every small update (like a window focus or input change) forces an O(N) scan.
*   **Recommended fix**: Consider normalized state (storing objects by ID) if N > 50, or at least ensure selectors are memoized to prevent downstream re-renders.
*   **Tradeoffs / Risks**: Refactoring to a Map-like structure requires updating all reference sites.
*   **Expected impact estimate**: Qualitative improvement in UI responsiveness for complex workspaces.
*   **Removal Safety**: Needs Verification
*   **Reuse Scope**: Service-wide

### [Finding 4] Redundant Calculation of Topological Order
*   **Title**: Unmemoized Graph Analysis
*   **Category**: Algorithm
*   **Severity**: Low
*   **Impact**: Latency
*   **Evidence**: `flowStore.ts` line 688 `getTopologicalOrder`.
*   **Why it’s inefficient**: Re-calculates the entire dependency graph from scratch every time it's called, even if nodes/edges haven't changed.
*   **Recommended fix**: Memoize the result of the topological sort and only invalidate when the `edges` array changes.
*   **Tradeoffs / Risks**: Complexity of cache invalidation.
*   **Expected impact estimate**: Minor (<5% total time) but prevents spikes on large graphs.
*   **Removal Safety**: Safe
*   **Reuse Scope**: Local module

## 3) Quick Wins (Do First)

1.  **Memoize geometries** in `TechnicalDrawing3D.tsx`. This is the easiest fix with the largest immediate benefit to perceived performance.
2.  **Remove `console.log`** in `flowStore.ts` propagation logic. Logging in hot paths slows down execution significantly.
3.  **Wrap state selectors** with `useShallow` from Zustand to prevent re-renders when array references change but contents are logically the same.

## 4) Deeper Optimizations (Do Next)

1.  **Normalization of State**: Move `nodes` and `windows` from arrays to objects keyed by ID (`Record<string, Node>`). This makes all updates O(1).
2.  **Worker-based Propagation**: Move the `propagateData` logic from `flowStore` to a Web Worker to handle complex dependency chains off the main thread.
3.  **Instanced Rendering**: If the number of nodes or 3D elements grows, use instanced meshes in Three.js for repeating elements like fasteners or rolling elements in bearings.

## 5) Validation Plan

### Benchmarks:
*   **CPU Profiling**: Use Chrome DevTools Performance tab to measure `Scripting` time during a "Node Drag" test (drag a node continuously for 10 seconds). Target: < 16ms per frame.
*   **Memory Profiling**: Use the `Memory` tab to take heap snapshots before and after interacting with the `TechnicalDrawing3D` component sliders. Target: No significant heap growth after stabilization.

### Metrics:
*   **FPS**: Measure with `stats.js` or DevTools during 3D model rotation and parameter adjustment.
*   **LocalStorage Write Count**: Monkey-patch `localStorage.setItem` to count writes per second during interaction. Target: < 2 writes/sec during continuous activity.

### 6) Optimized Code / Patch (Exemplar)

#### [MODIFY] [TechnicalDrawing3D.tsx](file:///c:/Users/apo_q/.gemini/antigravity/scratch/alucalculator/src/components/TechnicalDrawing3D.tsx)
```tsx
// Improvement: Memoize edges geometry
const edgesGeometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(profileShape, extrudeSettings);
    return new THREE.EdgesGeometry(geo);
}, [profileShape, extrudeSettings]);

return (
    <mesh castShadow receiveShadow material={material}>
        <extrudeGeometry args={[profileShape, extrudeSettings]} />
        <lineSegments geometry={edgesGeometry}>
            <lineBasicMaterial color="#64748b" linewidth={1} />
        </lineSegments>
    </mesh>
);
```

---
Report generated by AluCalc Senior Optimization Auditor.
