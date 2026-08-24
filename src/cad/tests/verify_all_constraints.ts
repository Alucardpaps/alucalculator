
import { constraintSolver } from '../kernel/ConstraintSolver';
import { createLineEntity, createPointEntity, createCircleEntity, CadEntity } from '../kernel/types';
import { Constraint } from '../constraints/types';

/**
 * 📐 COMPREHENSIVE CAD SOLVER VERIFICATION
 * Tests all implemented constraint types.
 */
async function verifyAll() {
    console.log("=========================================");
    console.log("📐 Verifying ALL CAD Constraints");
    console.log("=========================================");

    // Helper to print check
    const check = (name: string, diff: number, tolerance = 0.1) => {
        if (diff < tolerance) console.log(`✅ ${name} PASS (diff: ${diff.toFixed(4)})`);
        else console.error(`❌ ${name} FAIL (diff: ${diff.toFixed(4)})`);
    };

    // ----------------------------------------------------------------
    // 1. LINEAR CONSTRAINTS
    // ----------------------------------------------------------------
    console.log("\n--- Testing Linear Constraints ---");
    constraintSolver.clearConstraints();

    const lineH = createLineEntity({ x: 0, y: 0 }, { x: 10, y: 5 }, '0', 'white', 'lineH');
    const lineV = createLineEntity({ x: 0, y: 0 }, { x: 5, y: 10 }, '0', 'white', 'lineV');

    // Horizontal
    constraintSolver.addConstraint({
        id: 'cH', type: 'HORIZONTAL', entityIds: [lineH.id], active: true
    });
    // Vertical
    constraintSolver.addConstraint({
        id: 'cV', type: 'VERTICAL', entityIds: [lineV.id], active: true
    });

    let solved = constraintSolver.solve([lineH, lineV]);

    let resH = solved.find(e => e.id === lineH.id)!;
    let resV = solved.find(e => e.id === lineV.id)!;

    check("Horizontal", Math.abs((resH.geometry as any).start.y - (resH.geometry as any).end.y));
    check("Vertical", Math.abs((resV.geometry as any).start.x - (resV.geometry as any).end.x));


    // ----------------------------------------------------------------
    // 2. PARALLEL & PERPENDICULAR
    // ----------------------------------------------------------------
    console.log("\n--- Testing Parallel/Perpendicular ---");
    constraintSolver.clearConstraints();

    const l1 = createLineEntity({ x: 0, y: 0 }, { x: 10, y: 0 }, '0', 'white', 'l1'); // Horizontal
    const l2 = createLineEntity({ x: 0, y: 10 }, { x: 10, y: 12 }, '0', 'white', 'l2'); // Slanted
    const l3 = createLineEntity({ x: 5, y: 5 }, { x: 10, y: 5 }, '0', 'white', 'l3'); // Horizontal

    // Make l2 Parallel to l1 (should become horizontal)
    constraintSolver.addConstraint({
        id: 'cPar', type: 'PARALLEL', entityIds: [l1.id, l2.id], active: true
    });

    // Make l3 Perpendicular to l1 (should become vertical)
    constraintSolver.addConstraint({
        id: 'cPerp', type: 'PERPENDICULAR', entityIds: [l1.id, l3.id], active: true
    });

    // Fix l1 so it doesn't move
    constraintSolver.addConstraint({
        id: 'cFixed', type: 'FIXED', entityIds: [l1.id], active: true
    });

    solved = constraintSolver.solve([l1, l2, l3]);
    const r1 = solved.find(e => e.id === 'l1')!;
    const r2 = solved.find(e => e.id === 'l2')!;
    const r3 = solved.find(e => e.id === 'l3')!;

    // Check Parallel (Cross product should be 0)
    const v1 = { x: (r1.geometry as any).end.x - (r1.geometry as any).start.x, y: (r1.geometry as any).end.y - (r1.geometry as any).start.y };
    const v2 = { x: (r2.geometry as any).end.x - (r2.geometry as any).start.x, y: (r2.geometry as any).end.y - (r2.geometry as any).start.y };

    // Normalize
    const len1 = Math.hypot(v1.x, v1.y);
    const len2 = Math.hypot(v2.x, v2.y);
    const n1 = { x: v1.x / len1, y: v1.y / len1 };
    const n2 = { x: v2.x / len2, y: v2.y / len2 };

    const crossPar = Math.abs(n1.x * n2.y - n1.y * n2.x);
    check("Parallel", crossPar);

    // Check Perpendicular (Dot product should be 0)
    const v3 = { x: (r3.geometry as any).end.x - (r3.geometry as any).start.x, y: (r3.geometry as any).end.y - (r3.geometry as any).start.y };
    const dotPerp = Math.abs(v1.x * v3.x + v1.y * v3.y);
    check("Perpendicular", dotPerp);

    // ----------------------------------------------------------------
    // 3. DISTANCE (Point-Point)
    // ----------------------------------------------------------------
    console.log("\n--- Testing Distance ---");
    constraintSolver.clearConstraints();

    const pA = createPointEntity(0, 0, '0', 'white', 'pA');
    const pB = createPointEntity(10, 0, '0', 'white', 'pB');

    // Make distance 20
    constraintSolver.addConstraint({
        id: 'cDist', type: 'DISTANCE', entityIds: [pA.id, pB.id], value: 20, active: true
    });

    solved = constraintSolver.solve([pA, pB]);
    const rA = solved.find(e => e.id === 'pA')!;
    const rB = solved.find(e => e.id === 'pB')!;

    const dist = Math.hypot((rA.geometry as any).x - (rB.geometry as any).x, (rA.geometry as any).y - (rB.geometry as any).y);
    check("Distance 20", Math.abs(dist - 20));


    // ----------------------------------------------------------------
    // 4. TANGENT (Line-Circle)
    // ----------------------------------------------------------------
    console.log("\n--- Testing Tangent ---");
    constraintSolver.clearConstraints();

    const tLine = createLineEntity({ x: 0, y: 0 }, { x: 10, y: 0 }, '0', 'white', 'tLine');
    // Circle at (5, 5) with radius 2. Distance to line is 5.
    // Tangent means distance should be radius (2).
    const tCirc = createCircleEntity({ x: 5, y: 5 }, 2, '0', 'white', 'tCirc');

    constraintSolver.addConstraint({
        id: 'cTan', type: 'TANGENT', entityIds: [tLine.id, tCirc.id], active: true
    });

    // Fix line
    constraintSolver.addConstraint({
        id: 'cFixL', type: 'FIXED', entityIds: [tLine.id], active: true
    });

    solved = constraintSolver.solve([tLine, tCirc]);
    const rCirc = solved.find(e => e.id === 'tCirc')!;

    // Center should have moved to y=2 (or -2)
    const cY = Math.abs((rCirc.geometry as any).center.y);
    const radius = (rCirc.geometry as any).radius;
    check("Tangent (Line-Circle)", Math.abs(cY - radius));

    // ----------------------------------------------------------------
    // 5. ANGLE
    // ----------------------------------------------------------------
    console.log("\n--- Testing Angle ---");
    constraintSolver.clearConstraints();

    const aL1 = createLineEntity({ x: 0, y: 0 }, { x: 10, y: 0 }, '0', 'white', 'aL1');
    const aL2 = createLineEntity({ x: 0, y: 0 }, { x: 10, y: 10 }, '0', 'white', 'aL2'); // 45 deg

    // Make angle 90 degrees
    constraintSolver.addConstraint({
        id: 'cAngle', type: 'ANGLE', entityIds: [aL1.id, aL2.id], value: 90, active: true
    });

    constraintSolver.addConstraint({
        id: 'cFixAng', type: 'FIXED', entityIds: [aL1.id], active: true
    });

    solved = constraintSolver.solve([aL1, aL2]);
    const raL1 = solved.find(e => e.id === 'aL1')!;
    const raL2 = solved.find(e => e.id === 'aL2')!;

    const va1 = { x: (raL1.geometry as any).end.x - (raL1.geometry as any).start.x, y: (raL1.geometry as any).end.y - (raL1.geometry as any).start.y };
    const va2 = { x: (raL2.geometry as any).end.x - (raL2.geometry as any).start.x, y: (raL2.geometry as any).end.y - (raL2.geometry as any).start.y };

    // Dot product for angle
    const mod1 = Math.hypot(va1.x, va1.y);
    const mod2 = Math.hypot(va2.x, va2.y);
    const dotAng = (va1.x * va2.x + va1.y * va2.y) / (mod1 * mod2);
    // acos(0) = 90 deg
    check("Angle 90 (Dot approx 0)", Math.abs(dotAng)); // cos(90) is 0

}

verifyAll().catch(console.error);
