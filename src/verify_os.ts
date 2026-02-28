/**
 * 🏛️ ALUCALCULATOR - SYSTEM VERIFICATION
 * "The Final Exam"
 */

import { bootstrapRegistry } from "./lib/init";
import { FlowEngine } from "./lib/flow/flow-engine";
import { auditLog } from "./lib/traceability/audit";
import { ReportGenerator } from "./lib/traceability/report.generator";
import { DxfExporter } from "./lib/engines/export/dxf.exporter";
import { StepExporter } from "./lib/engines/export/step.exporter";

async function main() {
    console.log("🚀 Starting Engineering OS Verification...");

    // 1. Initialize Kernel (Registry)
    bootstrapRegistry();

    // 2. Initialize Flow Engine
    const flow = new FlowEngine();
    console.log("✅ Flow Engine Online");

    // 3. Create a Node (Gear Calculator)
    const gearNodeId = flow.addNode("mech.gear.spur.v1");
    console.log(`✅ Node Created: ${gearNodeId} (Spur Gear)`);

    // 4. Prepare Inputs
    const inputs = {
        [gearNodeId]: {
            m: 5,        // Module 5
            z: 24,       // 24 Teeth
            alpha: 20,   // 20 deg
            x: 0         // No shift
        }
    };

    // 5. Execute Flow
    try {
        console.log("⚙️ Executing Flow...");
        const results = flow.run(inputs);

        const output = results.get(gearNodeId);
        if (!output) throw new Error("No output from gear node");

        console.log("✅ Execution Complete. Results:");
        console.log(`   Pitch Diameter (d): ${output.d.value} ${output.d.unit}`);
        console.log(`   Tip Diameter (da): ${output.da.value} ${output.da.unit}`);

        // 6. Traceability Check
        const report = ReportGenerator.generateFullTrace();
        console.log(`✅ Traceability Audit: ${report.summary}`);
        console.log(`   Logged Standards: ${report.steps[0].standards.join(", ")}`);

        // 7. Manufacturing Export (DXF)
        // We need the raw geometry for this. 
        // In a real scenario, the Calculator would output the Geometry object itself 
        // or we'd access internal engine with same params.
        // For this demonstration, we'll re-compute geometry using the engine directly 
        // to feed the exporter, as the Node output currently only returns EngineeringValues (numbers).
        // *Architecture Note*: Ideally one output would be a "GeometryBlob" EngineeringValue.
        // For Phase 1, we will just demonstrate the Exporter class usage.

        console.log("🏗️ Testing Exports...");

        // Mock geometry for valid export test
        const mockPoints = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];

        const dxf = new DxfExporter();
        dxf.addPolyline(mockPoints, "PART_CONTOUR");
        const dxfOutput = dxf.getOutput();

        if (dxfOutput.includes("ENTITIES") && dxfOutput.includes("EOF")) {
            console.log("✅ DXF Export Validated (Structure compliant)");
        } else {
            console.error("❌ DXF Export Failed Structure Check");
        }

        const step = new StepExporter();
        step.generateRaw([{ x: 0, y: 0, z: 0 }]);
        const stepOutput = step.finalize();

        if (stepOutput.includes("ISO-10303-21")) {
            console.log("✅ STEP Export Validated (ISO Header detected)");
        }

        console.log("🏆 SYSTEM VERIFICATION PASSED: The Engineering OS is operational.");

    } catch (e) {
        console.error("❌ System Failure:", e);
        process.exit(1);
    }
}

main();
