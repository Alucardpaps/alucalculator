import { describe, it, expect, beforeEach } from 'vitest';
import { universalTrim, findAllIntersections } from '../cad/kernel/GeometryEngine';
import {
    createLineEntity,
    createCircleEntity,
    createArcEntity,
    createPolylineEntity,
    createRectangleEntity,
    createHexagonEntity
} from '../cad/kernel/types';
import { useCadStore } from '../cad/store/cadStore';
import { commandProcessor } from '../cad/commands/CommandProcessor';
import { BlockManager, STANDARD_BLOCKS } from '../cad/blocks/BlockManager';

describe('AutoCAD Universal Interoperability Suite (Trim, Extend, Join, Group, Block)', () => {
    beforeEach(() => {
        useCadStore.getState().clearEntities();
        useCadStore.getState().deselectAll();
        commandProcessor.setActiveCommand(null);
    });

    // ─────────────────────────────────────────────────────────────
    // 1. UNIVERSAL INTERSECTION & DECOMPOSITION
    // ─────────────────────────────────────────────────────────────
    describe('Universal Intersections across all Geometry Types', () => {
        it('should intersect a Line with an Arc', () => {
            // Arc center (0,0), radius 10, from 0 to PI (top semicircle)
            const arc = createArcEntity({ x: 0, y: 0 }, 10, 0, Math.PI, 'layer-0', '#fff');
            // Vertical line passing through (0, 10)
            const line = createLineEntity({ x: 0, y: 0 }, { x: 0, y: 20 }, 'layer-0', '#fff');

            const pts = findAllIntersections(line, arc);
            expect(pts.length).toBe(1);
            expect(pts[0].x).toBeCloseTo(0, 1);
            expect(pts[0].y).toBeCloseTo(10, 1);
        });

        it('should intersect a Line with a Rectangle boundary', () => {
            // Rectangle centered at (0,0), width 20, height 10 (-10 to 10 in x, -5 to 5 in y)
            const rect = createRectangleEntity({ x: 0, y: 0 }, 20, 10, 'layer-0', '#fff');
            // Horizontal line passing straight through (-15, 0) to (15, 0)
            const line = createLineEntity({ x: -15, y: 0 }, { x: 15, y: 0 }, 'layer-0', '#fff');

            const pts = findAllIntersections(line, rect);
            expect(pts.length).toBe(2);
            expect(pts.some(p => Math.abs(p.x - (-10)) < 0.1 && Math.abs(p.y) < 0.1)).toBe(true);
            expect(pts.some(p => Math.abs(p.x - 10) < 0.1 && Math.abs(p.y) < 0.1)).toBe(true);
        });

        it('should intersect a Line with a Polyline', () => {
            const poly = createPolylineEntity([
                { x: 0, y: 0 },
                { x: 10, y: 10 },
                { x: 20, y: 0 }
            ], false, 'layer-0', '#fff');
            const line = createLineEntity({ x: 5, y: -5 }, { x: 5, y: 15 }, 'layer-0', '#fff');

            const pts = findAllIntersections(line, poly);
            expect(pts.length).toBe(1);
            expect(pts[0].x).toBeCloseTo(5, 1);
            expect(pts[0].y).toBeCloseTo(5, 1);
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 2. UNIVERSAL TRIM
    // ─────────────────────────────────────────────────────────────
    describe('Universal Trim Engine', () => {
        it('should trim a Line cut by another Line', () => {
            // Main line from (0,0) to (20,0)
            const mainLine = createLineEntity({ x: 0, y: 0 }, { x: 20, y: 0 }, 'layer-0', '#fff');
            // Cutter line at x=10 from (10,-10) to (10,10)
            const cutter = createLineEntity({ x: 10, y: -10 }, { x: 10, y: 10 }, 'layer-0', '#fff');

            // Pick right side at (15, 0) to remove
            const trimmed = universalTrim(mainLine, [cutter], { x: 15, y: 0 });
            expect(trimmed).not.toBeNull();
            expect(trimmed!.length).toBe(1);
            const remaining = trimmed![0].geometry as { type: 'LINE'; start: any; end: any };
            expect(remaining.start.x).toBeCloseTo(0, 1);
            expect(remaining.end.x).toBeCloseTo(10, 1);
        });

        it('should trim a Rectangle picked side cut by a Line', () => {
            // Rectangle 20x10 centered at (0,0) -> top edge from (-10,5) to (10,5)
            const rect = createRectangleEntity({ x: 0, y: 0 }, 20, 10, 'layer-0', '#fff');
            // Vertical cutting line at x=0
            const cutter = createLineEntity({ x: 0, y: -10 }, { x: 0, y: 10 }, 'layer-0', '#fff');

            // Pick top right section at (5, 5)
            const trimmed = universalTrim(rect, [cutter], { x: 5, y: 5 });
            expect(trimmed).not.toBeNull();
            // Should decompose into remaining 3 sides + the untrimmed left half of top edge
            expect(trimmed!.length).toBe(4);
            expect(trimmed!.every(e => e.geometry.type === 'LINE')).toBe(true);
        });

        it('should trim a Polyline segment cut by a Line', () => {
            // Polyline: (0,0) -> (10,0) -> (10,10)
            const poly = createPolylineEntity([
                { x: 0, y: 0 },
                { x: 10, y: 0 },
                { x: 10, y: 10 }
            ], false, 'layer-0', '#fff');
            // Cutter line crossing first segment at x=5
            const cutter = createLineEntity({ x: 5, y: -5 }, { x: 5, y: 5 }, 'layer-0', '#fff');

            // Pick right part of first segment at (7, 0)
            const trimmed = universalTrim(poly, [cutter], { x: 7, y: 0 });
            expect(trimmed).not.toBeNull();
            expect(trimmed!.length).toBeGreaterThanOrEqual(2);
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 3. EXTEND TOOL (Mutual Interoperability)
    // ─────────────────────────────────────────────────────────────
    describe('Extend Tool Interoperability', () => {
        it('should extend a Line to meet a Rectangle wall', () => {
            const store = useCadStore.getState();
            // Wall: Rectangle centered at (20, 0), 10x20 -> left wall is at x=15
            const wall = createRectangleEntity({ x: 20, y: 0 }, 10, 20, 'layer-0', '#fff');
            // Line from (0,0) pointing to (10,0)
            const line = createLineEntity({ x: 0, y: 0 }, { x: 10, y: 0 }, 'layer-0', '#fff');

            store.addEntity(wall);
            store.addEntity(line);

            // Execute EXTEND
            commandProcessor.startCommand('EXTEND');
            // Press enter to select all boundaries
            commandProcessor.handleKeyInput('Enter');
            // Click line near end (9, 0)
            commandProcessor.handlePointInput({ x: 9, y: 0 });

            // The line should now extend to the rectangle wall at x=15
            const currentLines = useCadStore.getState().entities.filter(e => e.geometry.type === 'LINE');
            expect(currentLines.length).toBe(1);
            const extLine = currentLines[0].geometry as { type: 'LINE'; start: any; end: any };
            expect(extLine.start.x).toBeCloseTo(0, 1);
            expect(extLine.end.x).toBeCloseTo(15, 1);
        });

        it('should extend an Arc to meet a Line boundary', () => {
            const store = useCadStore.getState();
            // Arc center (0,0), radius 10, from 0 to PI/2 (0 to 90 degrees)
            const arc = createArcEntity({ x: 0, y: 0 }, 10, 0, Math.PI / 2, 'layer-0', '#fff');
            // Horizontal boundary line at y=0 extending to x=-15
            const boundaryLine = createLineEntity({ x: -15, y: 0 }, { x: -2, y: 0 }, 'layer-0', '#fff');

            store.addEntity(arc);
            store.addEntity(boundaryLine);

            commandProcessor.startCommand('EXTEND');
            commandProcessor.handleKeyInput('Enter');
            // Click arc near endAngle (at PI/2, point is (0, 10))
            commandProcessor.handlePointInput({ x: 0.5, y: 9.8 });

            const currentArcs = useCadStore.getState().entities.filter(e => e.geometry.type === 'ARC');
            expect(currentArcs.length).toBe(1);
            const extArc = currentArcs[0].geometry as { type: 'ARC'; startAngle: number; endAngle: number };
            // Arc should be extended counter-clockwise to PI (where it hits line at (-10, 0))
            expect(extArc.endAngle).toBeCloseTo(Math.PI, 1);
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 4. JOIN COMMAND (J / JOIN)
    // ─────────────────────────────────────────────────────────────
    describe('Join Tool (J / JOIN)', () => {
        it('should merge 2 collinear touching lines into 1 line', () => {
            const store = useCadStore.getState();
            const l1 = createLineEntity({ x: 0, y: 0 }, { x: 10, y: 0 }, 'layer-0', '#fff');
            const l2 = createLineEntity({ x: 10, y: 0 }, { x: 25, y: 0 }, 'layer-0', '#fff');
            store.addEntity(l1);
            store.addEntity(l2);

            store.selectAll();
            commandProcessor.startCommand('JOIN');

            const remaining = useCadStore.getState().entities;
            expect(remaining.length).toBe(1);
            expect(remaining[0].geometry.type).toBe('LINE');
            const merged = remaining[0].geometry as { type: 'LINE'; start: any; end: any };
            expect(merged.start.x).toBeCloseTo(0, 1);
            expect(merged.end.x).toBeCloseTo(25, 1);
        });

        it('should chain touching non-collinear lines into a unified Polyline', () => {
            const store = useCadStore.getState();
            const l1 = createLineEntity({ x: 0, y: 0 }, { x: 10, y: 0 }, 'layer-0', '#fff');
            const l2 = createLineEntity({ x: 10, y: 0 }, { x: 10, y: 15 }, 'layer-0', '#fff');
            const l3 = createLineEntity({ x: 10, y: 15 }, { x: 0, y: 15 }, 'layer-0', '#fff');
            store.addEntity(l1);
            store.addEntity(l2);
            store.addEntity(l3);

            store.selectAll();
            commandProcessor.startCommand('JOIN');

            const remaining = useCadStore.getState().entities;
            expect(remaining.length).toBe(1);
            expect(remaining[0].geometry.type).toBe('POLYLINE');
            const poly = remaining[0].geometry as { type: 'POLYLINE'; vertices: any[]; closed: boolean };
            expect(poly.vertices.length).toBe(4);
            expect(poly.closed).toBe(false);
        });

        it('should detect closed loop and set closed: true when joining 4 rectangle sides', () => {
            const store = useCadStore.getState();
            const s1 = createLineEntity({ x: 0, y: 0 }, { x: 10, y: 0 }, 'layer-0', '#fff');
            const s2 = createLineEntity({ x: 10, y: 0 }, { x: 10, y: 10 }, 'layer-0', '#fff');
            const s3 = createLineEntity({ x: 10, y: 10 }, { x: 0, y: 10 }, 'layer-0', '#fff');
            const s4 = createLineEntity({ x: 0, y: 10 }, { x: 0, y: 0 }, 'layer-0', '#fff');
            store.addEntity(s1);
            store.addEntity(s2);
            store.addEntity(s3);
            store.addEntity(s4);

            store.selectAll();
            commandProcessor.startCommand('JOIN');

            const remaining = useCadStore.getState().entities;
            expect(remaining.length).toBe(1);
            expect(remaining[0].geometry.type).toBe('POLYLINE');
            const poly = remaining[0].geometry as { type: 'POLYLINE'; vertices: any[]; closed: boolean };
            expect(poly.closed).toBe(true);
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 5. GROUP, UNGROUP & EXPLODE
    // ─────────────────────────────────────────────────────────────
    describe('Group, Ungroup & Explode Systems', () => {
        it('should group selected entities and select all when any member is clicked', () => {
            const store = useCadStore.getState();
            const e1 = createCircleEntity({ x: 0, y: 0 }, 5, 'layer-0', '#fff');
            const e2 = createLineEntity({ x: 10, y: 0 }, { x: 20, y: 0 }, 'layer-0', '#fff');
            store.addEntity(e1);
            store.addEntity(e2);

            store.selectAll();
            commandProcessor.startCommand('GROUP');

            // Both entities should now have the same groupId
            const ents = useCadStore.getState().entities;
            expect(ents[0].groupId).toBeDefined();
            expect(ents[0].groupId).toBe(ents[1].groupId);

            // Deselect all
            store.deselectAll();
            expect(useCadStore.getState().selectedIds.length).toBe(0);

            // Clicking just e1 should select BOTH e1 and e2 due to groupId
            store.selectEntity(e1.id, false);
            const selected = useCadStore.getState().selectedIds;
            expect(selected.length).toBe(2);
            expect(selected).toContain(e1.id);
            expect(selected).toContain(e2.id);
        });

        it('should ungroup entities with UNGROUP command', () => {
            const store = useCadStore.getState();
            const e1 = createCircleEntity({ x: 0, y: 0 }, 5, 'layer-0', '#fff');
            const e2 = createLineEntity({ x: 10, y: 0 }, { x: 20, y: 0 }, 'layer-0', '#fff');
            store.addEntity(e1);
            store.addEntity(e2);

            store.selectAll();
            store.groupSelectedEntities();

            // Run UNGROUP
            commandProcessor.startCommand('UNGROUP');

            const ents = useCadStore.getState().entities;
            expect(ents[0].groupId).toBeUndefined();
            expect(ents[1].groupId).toBeUndefined();
        });

        it('should explode a Polyline into individual Line entities', () => {
            const store = useCadStore.getState();
            const poly = createPolylineEntity([
                { x: 0, y: 0 },
                { x: 10, y: 0 },
                { x: 10, y: 10 },
                { x: 0, y: 10 }
            ], true, 'layer-0', '#fff');
            store.addEntity(poly);

            store.selectAll();
            commandProcessor.startCommand('EXPLODE');

            const ents = useCadStore.getState().entities;
            expect(ents.length).toBe(4);
            expect(ents.every(e => e.geometry.type === 'LINE')).toBe(true);
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 6. BLOCK & TEMPLATE MANAGEMENT SYSTEM
    // ─────────────────────────────────────────────────────────────
    describe('AutoCAD Block & Template Management System', () => {
        it('should provide pre-loaded standard mechanical engineering blocks', () => {
            const allBlocks = BlockManager.getAllBlocks();
            expect(allBlocks.length).toBeGreaterThanOrEqual(10);

            const m8Bolt = allBlocks.find(b => b.id === 'std_m8_bolt');
            expect(m8Bolt).toBeDefined();
            expect(m8Bolt!.category).toBe('Fasteners');

            const bracket2020 = allBlocks.find(b => b.id === 'std_2020_bracket' || b.id === 'std_bracket_2020');
            expect(bracket2020).toBeDefined();
            expect(bracket2020!.category).toBe('Profiles');

            const nema17 = allBlocks.find(b => b.id === 'std_nema17_faceplate' || b.id === 'std_nema17');
            expect(nema17).toBeDefined();
            expect(nema17!.category).toBe('Mounts');
        });

        it('should instantiate a block into drawing with transform and atomic grouping', () => {
            const m8Bolt = STANDARD_BLOCKS[0];
            const insertPoint = { x: 50, y: 100 };
            const instantiated = BlockManager.instantiateBlock(m8Bolt, insertPoint, 2, 0, 'layer-0');

            expect(instantiated.length).toBe(m8Bolt.entities.length);
            // All instantiated entities should share a common groupId and blockInstanceId
            const gid = instantiated[0].groupId;
            const bid = instantiated[0].blockInstanceId;
            expect(gid).toBeDefined();
            expect(bid).toBeDefined();
            expect(instantiated.every(e => e.groupId === gid)).toBe(true);
            expect(instantiated.every(e => e.blockInstanceId === bid)).toBe(true);

            // Scale check on first line
            const origLine = m8Bolt.entities[0].geometry as { type: 'LINE'; start: any; end: any };
            const newLine = instantiated[0].geometry as { type: 'LINE'; start: any; end: any };
            const origLength = Math.abs(origLine.end.x - origLine.start.x);
            const newLength = Math.abs(newLine.end.x - newLine.start.x);
            expect(newLength).toBeCloseTo(origLength * 2, 1);
        });

        it('should support creating custom block definition from entities and saving it', () => {
            const customEntities = [
                createCircleEntity({ x: 0, y: 0 }, 15, 'layer-0', '#fff'),
                createLineEntity({ x: -15, y: 0 }, { x: 15, y: 0 }, 'layer-0', '#fff')
            ];

            const savedBlock = BlockManager.saveBlock({
                name: 'Custom Dial Gage',
                description: 'Indicator dial symbol',
                category: 'Custom',
                basePoint: { x: 0, y: 0 },
                entities: customEntities
            });

            expect(savedBlock.id).toBeDefined();
            expect(savedBlock.name).toBe('Custom Dial Gage');
            expect(savedBlock.entities.length).toBe(2);

            const all = BlockManager.getAllBlocks();
            expect(all.some(b => b.id === savedBlock.id)).toBe(true);
        });
    });
});
