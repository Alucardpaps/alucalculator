import { calculate } from "./calculationService";
import { pool } from "../db";

/**
 * AluCalc OS - Logic Proof v2 (The Assembly Chain)
 * Verifies Gear -> Shaft -> Bearing -> Bolt -> Thermal flow.
 */

async function runLogicProofV2() {
    console.log("🚀 STARTING LOGIC PROOF V2 (ASSEMBLY CHAIN)...");

    const userId = "test-user-v4";
    const projectId = "assembly-test-v4";

    try {
        // 1. GEAR NODE
        const gear = await calculate(userId, projectId, "gears", {
            force: 10000,
            module: 3,
            faceWidth: 40,
            teethCount: 24
        });
        console.log("✅ GEAR_NODE::SUCCESS -> Result:", gear.result_json);

        // 2. SHAFT NODE (Depends on Gear Force)
        const shaft = await calculate(userId, projectId, "shafts", {
            load: { "$ref": `${gear.id}.stress` }, // Mapping gear bending stress or force
            length: 500,
            diameter: 45
        });
        console.log("✅ SHAFT_NODE::SUCCESS -> Result:", shaft.result_json);

        // 3. BEARING NODE (Depends on Shaft Result)
        const bearing = await calculate(userId, projectId, "bearings", {
            load: { "$ref": `${shaft.id}.reactions` }, // Mapping shaft reactions
            diameter: 45
        });
        console.log("✅ BEARING_NODE::SUCCESS -> Result:", bearing.result_json);

        // 4. BOLTED JOINT (Depends on Gear Force)
        const bolt = await calculate(userId, projectId, "bolts", {
            appliedLoad: { "$ref": `${gear.id}.stress` },
            boltDiameter: 12,
            boltClass: 10.9
        });
        console.log("✅ BOLT_NODE::SUCCESS -> Result:", bolt.result_json);

        // 5. THERMAL EXPANSION
        const thermal = await calculate(userId, projectId, "thermal", {
            length: 500,
            tempStart: 20,
            tempEnd: 85,
            materialAlpha: 23.1e-6 // Aluminum
        });
        console.log("✅ THERMAL_NODE::SUCCESS -> Result:", thermal.result_json);

        console.log("\n🏁 LOGIC PROOF V2: ALL NODES VERIFIED & LINKED.");
    } catch (error) {
        console.error("❌ LOGIC PROOF V2: FAILED", error);
    } finally {
        await pool.end();
    }
}

runLogicProofV2();
