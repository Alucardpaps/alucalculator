import { calculationService } from "../src/lib/services/calculationService";
import { ExecutionTimeline } from "../src/lib/utils/timeline";
import { v4 as uuidv4 } from "uuid";

/**
 * Wave 3.2: End-to-End Assembly Test
 * Proves the "Gear -> Shaft -> Bearing" dependency chain.
 */

async function runAssemblyTest() {
    const userId = 1; // Simulated User
    const projectId = "00000000-0000-0000-0000-000000000001"; // Simulated Project
    const traceId = uuidv4();
    
    console.log(`\n🚀 STARTING ULTIMATE ASSEMBLY PROOF [Trace: ${traceId}]\n`);

    // --- STEP 1: GEARS ---
    console.log("--- STEP 1: GEAR CALCULATION ---");
    const gearTimeline = new ExecutionTimeline();
    const gearResult = await calculationService.handleComputeRequest(
        String(userId),
        {
            type: "gears",
            payload: { force: 5000, module: 2, faceWidth: 20, teethCount: 24 },
            projectId
        },
        traceId,
        gearTimeline,
        "full"
    );

    if (!gearResult.success) throw new Error("GEAR_CALC_FAILED");
    
    // Save Gear result to DB
    const savedGear = await calculationService.saveCalculation(
        String(userId),
        { projectId, type: "gears", inputJson: { force: 5000, module: 2, faceWidth: 20, teethCount: 24 }, engineVersion: "v1.0" },
        traceId,
        gearTimeline,
        "full"
    );
    const gearId = (savedGear.data as any).id;
    console.log(`✅ Gear Calculation OK. ID: ${gearId}. Stress: ${(gearResult.data as any).stress}\n`);

    // --- STEP 2: SHAFTS ---
    console.log("--- STEP 2: SHAFT CALCULATION (LINKED TO GEAR) ---");
    const shaftTimeline = new ExecutionTimeline();
    const shaftResult = await calculationService.handleComputeRequest(
        String(userId),
        {
            type: "shafts",
            payload: { 
                length: 500, 
                forcePos: 250, 
                // Pulling tangential_force from Gear input_json (as an example of linking)
                force: { "$ref": `${gearId}.force` } 
            },
            projectId
        },
        traceId,
        shaftTimeline,
        "full"
    );

    if (!shaftResult.success) {
        console.error("❌ SHAFT_CALC_FAILED:", (shaftResult.error as any).message);
        return;
    }

    const savedShaft = await calculationService.saveCalculation(
        String(userId),
        { 
            projectId, 
            type: "shafts", 
            inputJson: { length: 500, forcePos: 250, force: { "$ref": `${gearId}.force` } }, 
            engineVersion: "v1.0" 
        },
        traceId,
        shaftTimeline,
        "full"
    );
    const shaftId = (savedShaft.data as any).id;
    console.log(`✅ Shaft Calculation OK. ID: ${shaftId}. ReactionA: ${(shaftResult.data as any).reactionA}`);
    console.log(`🔍 Timeline: ${shaftResult.telemetry.events.join(' -> ')}\n`);

    // --- STEP 3: BEARINGS ---
    console.log("--- STEP 3: BEARING CALCULATION (LINKED TO SHAFT) ---");
    const bearingTimeline = new ExecutionTimeline();
    const bearingResult = await calculationService.handleComputeRequest(
        String(userId),
        {
            type: "bearings",
            payload: { 
                load: { "$ref": `${shaftId}.reactionA` }, 
                diameter: 40 
            },
            projectId
        },
        traceId,
        bearingTimeline,
        "full"
    );

    if (!bearingResult.success) {
        console.error("❌ BEARING_CALC_FAILED:", (bearingResult.error as any).message);
        return;
    }

    console.log(`✅ Bearing Calculation OK. Final Stress: ${(bearingResult.data as any).stress}`);
    console.log(`🔍 Timeline: ${bearingResult.telemetry.events.join(' -> ')}\n`);

    console.log("✨ ULTIMATE ASSEMBLY PROOF COMPLETED SUCCESSFULLY ✨");
}

runAssemblyTest().catch(console.error);
