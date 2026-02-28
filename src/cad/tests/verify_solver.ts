
import { constraintSolver } from '../kernel/ConstraintSolver';
import { createLineEntity, createPointEntity, Constraint } from '../kernel/types';

/**
 * START VERIFICATION
 */
async function verify() {
    console.log("📐 Verifying CAD Constraint Solver...");

    // 1. Setup
    constraintSolver.clearConstraints();

    // 2. Create Entities
    // Line 1: Horizontal-ish (0,0) -> (10, 1)
    const line1 = createLineEntity({ x: 0, y: 0 }, { x: 10, y: 1 }, '0', 'white');

    // Line 2: Random (10, 5) -> (20, 10)
    const line2 = createLineEntity({ x: 10, y: 5 }, { x: 20, y: 10 }, '0', 'white');

    const entities = [line1, line2];

    console.log("   Initial State:");
    console.log(`   L1: (${(line1.geometry as any).start.x}, ${(line1.geometry as any).start.y}) -> (${(line1.geometry as any).end.x}, ${(line1.geometry as any).end.y})`);
    console.log(`   L2: (${(line2.geometry as any).start.x}, ${(line2.geometry as any).start.y}) -> (${(line2.geometry as any).end.x}, ${(line2.geometry as any).end.y})`);

    // 3. Add Constraints

    // C1: Make L1 Horizontal
    const cHorizontal: Constraint = {
        id: 'c1',
        type: 'HORIZONTAL',
        entityIds: [line1.id],
        active: true,
        value: 0
    };
    constraintSolver.addConstraint(cHorizontal);

    // C2: Coincident L1.End and L2.Start
    // Note: The solver currently heuristic-matches closest endpoints.
    // L1.End is (10, 1). L2.Start is (10, 5). Dist = 4.
    const cCoincident: Constraint = {
        id: 'c2',
        type: 'COINCIDENT',
        entityIds: [line1.id, line2.id],
        active: true
    };
    constraintSolver.addConstraint(cCoincident);

    // 4. Solve
    console.log("   Solving...");
    const solved = constraintSolver.solve(entities);

    // 5. Check Results
    const sL1 = solved.find(e => e.id === line1.id)!;
    const sL2 = solved.find(e => e.id === line2.id)!;

    const l1Start = ((sL1 as any).geometry as any).start;
    const l1End = ((sL1 as any).geometry as any).end;
    const l2Start = ((sL2 as any).geometry as any).start;

    console.log("   Final State:");
    console.log(`   L1: (${l1Start.x.toFixed(3)}, ${l1Start.y.toFixed(3)}) -> (${l1End.x.toFixed(3)}, ${l1End.y.toFixed(3)})`);
    console.log(`   L2: (${l2Start.x.toFixed(3)}, ${l2Start.y.toFixed(3)}) -> ...`);

    // Assertions
    const dy = Math.abs(l1End.y - l1Start.y);
    const distCoincident = Math.hypot(l1End.x - l2Start.x, l1End.y - l2Start.y);

    if (dy < 0.1) console.log("✅ Horizontal Constraint Satisfied");
    else console.error(`❌ Horizontal Failed (dy=${dy})`);

    if (distCoincident < 0.1) console.log("✅ Coincident Constraint Satisfied");
    else console.error(`❌ Coincident Failed (dist=${distCoincident})`);

}

verify().catch(console.error);
