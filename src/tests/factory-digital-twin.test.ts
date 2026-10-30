import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FACTORY_PLAN,
  type FactoryTwinSchema,
} from '@/engines/factory/FactoryTwinSchema';
import { DxfFactoryImporter } from '@/engines/factory/DxfFactoryImporter';
import { FactoryEngine } from '@/engines/factory/FactoryEngine';

describe('Factory Digital Twin Specification (FDTS v1.0) & Kinematics', () => {
  it('validates default factory plan structure, standard units and kinematics', () => {
    expect(DEFAULT_FACTORY_PLAN.grid.unit).toBe('mm');
    expect(DEFAULT_FACTORY_PLAN.grid.snapSizeMm).toBe(500);
    expect(DEFAULT_FACTORY_PLAN.components.length).toBeGreaterThan(5);

    const kukaRobot = DEFAULT_FACTORY_PLAN.components.find((c) => c.type === 'robot_6axis');
    expect(kukaRobot).toBeDefined();
    expect(kukaRobot?.kinematics?.robot?.dof).toBe(6);
    expect(kukaRobot?.kinematics?.robot?.reachRadiusMm).toBeGreaterThan(1500);

    const cncMachine = DEFAULT_FACTORY_PLAN.components.find((c) => c.type === 'cnc_5axis');
    expect(cncMachine).toBeDefined();
    expect(cncMachine?.kinematics?.spindle?.maxRpm).toBe(20000);
    expect(cncMachine?.kinematics?.door?.strokeMm).toBe(1200);
  });

  it('parses sample 2D AutoCAD DXF string into valid 3D factory schema', () => {
    const dxfText = DxfFactoryImporter.generateSampleFactoryDxf();
    const result = DxfFactoryImporter.parseDxfToFactorySchema(dxfText);

    expect(result.success).toBe(true);
    expect(result.schema).toBeDefined();
    expect(result.componentsGenerated).toBeGreaterThan(0);
    expect(result.layersFound).toContain('FACTORY_MACHINES');
    expect(result.layersFound).toContain('FACTORY_ROBOTS');
    expect(result.layersFound).toContain('FACTORY_CONVEYORS');

    const generatedSchema = result.schema as FactoryTwinSchema;
    const machines = generatedSchema.components.filter((c) => c.type === 'cnc_5axis');
    expect(machines.length).toBeGreaterThanOrEqual(4);
  });

  it('initializes Three.js 3D factory scene and manages dynamic transforms (Sims-style)', () => {
    const { sceneGroup, machines, animController, componentGroupMap } =
      FactoryEngine.createFactoryScene(DEFAULT_FACTORY_PLAN);

    expect(sceneGroup).toBeDefined();
    expect(machines.length).toBeGreaterThan(0);
    expect(componentGroupMap.size).toBeGreaterThan(0);

    // Test Sims-style repositioning
    const targetId = 'cnc-5axis-1';
    animController.updateComponentTransform(targetId, -15000, -8000, 90);

    const updatedTransform = animController.getComponentTransform(targetId);
    expect(updatedTransform?.xMm).toBe(-15000);
    expect(updatedTransform?.zMm).toBe(-8000);
    expect(updatedTransform?.rotYDeg).toBe(90);

    // Test Dual-Mode IoT telemetric application
    animController.setSimulationMode('live_iot_stream');
    animController.applyLiveIoTData({
      timestamp: Date.now(),
      machines: {
        'cnc-5axis-1': { spindleRpm: 18000, doorOpen: true, status: 'warning' },
      },
      robots: {
        'robot-kuka-1': { jointAngles: [45, -30, 90, 0, 15, 60] },
      },
      conveyors: {
        'conveyor-main': { speedMps: 1.5 },
      },
    });

    const updateFrame = animController.update(0.016, 1);
    expect(updateFrame.telemetry).toBeDefined();
    expect(updateFrame.telemetry.oeePercent).toBeGreaterThan(80);

    animController.dispose();
  });
});
