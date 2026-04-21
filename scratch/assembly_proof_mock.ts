import { calculationService } from "../src/lib/services/calculationService";
import { ExecutionTimeline } from "../src/lib/utils/timeline";

/**
 * Wave 3.2: Deterministic Assembly Proof (Mocked DB)
 * Proves the "Data Bus" logic without requiring a live PostgreSQL instance.
 */

async function runMockProof() {
    console.log(`\n🚀 STARTING DETERMINISTIC ASSEMBLY PROOF (Logic Verification)\n`);

    const timeline = new ExecutionTimeline();
    const projectId = "test-project-123";
    const userId = "user-1";

    // 1. PREPARE MOCK DATA (Simulating DB state)
    // We mock the 'findById' behavior by overriding it for this test if possible, 
    // or by manually testing the internal resolver logic.
    
    const mockGear = {
        id: "GEAR_001",
        project_id: projectId,
        type: "gears",
        input_json: { force: 5000, module: 2 },
        result_json: { stress: 125.5 }, // Simulated result
        engine_version: "v1.0"
    };

    const mockShaft = {
        id: "SHAFT_001",
        project_id: projectId,
        type: "shafts",
        input_json: { length: 500, force: { "$ref": "GEAR_001.force" } },
        result_json: { reactionA: 2500, reactionB: 2500 }, // Calculated from 5000N
        engine_version: "v1.0"
    };

    // 2. TEST RESOLVER: GEAR -> SHAFT
    console.log("--- TEST 1: Resolving Gear Reference for Shaft ---");
    
    // Manual Mock Injection: We override the repository findById for this test context
    const originalFind = (calculationService as any).calculationRepo?.findById;
    (calculationService as any).calculationRepo = {
        findById: async (id: string) => {
            if (id === "GEAR_001") return mockGear;
            if (id === "SHAFT_001") return mockShaft;
            return null;
        }
    };

    const shaftInput = { length: 500, force: { "$ref": "GEAR_001.force" } };
    const resolvedShaft = await calculationService.resolveDependencies(shaftInput, projectId, userId, timeline);

    console.log("Input:", JSON.stringify(shaftInput));
    console.log("Resolved:", JSON.stringify(resolvedShaft));

    if (resolvedShaft.force === 5000) {
        console.log("✅ SUCCESS: Gear Force (5000) correctly injected into Shaft input.\n");
    } else {
        throw new Error("FAILED: Gear Force resolution failed.");
    }

    // 3. TEST RESOLVER: SHAFT -> BEARING (Output-to-Input Linking)
    console.log("--- TEST 2: Resolving Shaft Result for Bearing ---");
    
    const bearingInput = { load: { "$ref": "SHAFT_001.reactionA" }, diameter: 40 };
    const resolvedBearing = await calculationService.resolveDependencies(bearingInput, projectId, userId, timeline);

    console.log("Input:", JSON.stringify(bearingInput));
    console.log("Resolved:", JSON.stringify(resolvedBearing));

    if (resolvedBearing.load === 2500) {
        console.log("✅ SUCCESS: Shaft ReactionA (2500) correctly injected into Bearing input.\n");
    } else {
        throw new Error("FAILED: Shaft Result resolution failed.");
    }

    console.log("🔍 Final Timeline Logs:", timeline.toClient("full").events.join(' -> '));
    console.log("\n✨ DETERMINISTIC ASSEMBLY PROOF: SUCCESS ✨");
}

runMockProof().catch(err => {
    console.error("\n❌ PROOF FAILED:", err.message);
    process.exit(1);
});
