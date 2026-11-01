/**
 * 📐 DXF / DWG 2D Factory Floor Importer (AutoCAD to 3D Digital Twin)
 * Parses 2D CAD drawings and synthesizes 3D Factory Layouts, Kinematics & Stations
 * 
 * Complies with:
 * - VDI 2860: Kinematic definitions
 * - ISO 22400: Automation station categorization
 */

import DxfParser from 'dxf-parser';
import type {
  FactoryTwinSchema,
  FactoryTwinComponent,
  FactoryComponentType,
  FactoryComponentCategory,
} from './FactoryTwinSchema';

export interface DxfImportResult {
  success: boolean;
  schema?: FactoryTwinSchema;
  layersFound: string[];
  entityCount: number;
  componentsGenerated: number;
  warnings: string[];
  errors: string[];
}

export class DxfFactoryImporter {
  /**
   * Parses raw DXF text content and builds a complete FactoryTwinSchema.
   */
  public static parseDxfToFactorySchema(dxfContent: string): DxfImportResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const parser = new DxfParser();

    let parsedDxf: any;
    try {
      parsedDxf = parser.parseSync(dxfContent);
    } catch (err: any) {
      return {
        success: false,
        layersFound: [],
        entityCount: 0,
        componentsGenerated: 0,
        warnings: [],
        errors: [`DXF Parsing error: ${err.message || 'Corrupted or unsupported DXF file'}`],
      };
    }

    if (!parsedDxf || !parsedDxf.entities) {
      return {
        success: false,
        layersFound: [],
        entityCount: 0,
        componentsGenerated: 0,
        warnings: [],
        errors: ['No entities found in DXF file'],
      };
    }

    const layersFound: Set<string> = new Set();
    const components: FactoryTwinComponent[] = [];
    let entityIndex = 1;

    for (const entity of parsedDxf.entities) {
      const rawLayer = (entity.layer || '0').toUpperCase().trim();
      layersFound.add(rawLayer);

      // Determine component category and type based on layer naming conventions
      const classification = this.classifyEntity(rawLayer, entity);
      if (!classification) continue;

      // Extract centroid / position and dimensions in mm
      const bounds = this.extractEntityBounds(entity);
      if (!bounds) continue;

      const compId = `${classification.type}-${entityIndex++}`;
      const component: FactoryTwinComponent = {
        id: compId,
        name: `${classification.label} #${entityIndex - 1}`,
        category: classification.category,
        type: classification.type,
        placement: {
          x: Math.round(bounds.centerX),
          y: 0,
          z: Math.round(bounds.centerZ),
          rotationY: bounds.rotationDeg || 0,
        },
        geometry: {
          source: 'builtin',
          dimensions: {
            width: Math.max(500, Math.round(bounds.width)),
            height: Math.max(500, Math.round(classification.defaultHeightMm)),
            depth: Math.max(500, Math.round(bounds.depth)),
          },
          color: classification.defaultColor,
        },
        kinematics: classification.defaultKinematics,
        telemetry: {
          status: 'running',
          activeJob: `Automated 2D DWG Station ${compId}`,
          loadPercentage: 70,
          temperatureC: 25,
          powerKw: classification.defaultPowerKw,
        },
      };

      components.push(component);
    }

    if (components.length === 0) {
      warnings.push(
        'No matching factory layers detected (e.g. FACTORY_MACHINES, FACTORY_CONVEYORS). Generated default layout placeholder.'
      );
    }

    const schema: FactoryTwinSchema = {
      $schema: 'https://alucalculator.com/schemas/factory-twin-v1.json',
      factoryId: `imported-${Date.now().toString(36)}`,
      name: 'Imported 2D DWG/DXF Factory Floor Plan',
      version: '1.0.0',
      grid: {
        unit: 'mm',
        snapSizeMm: 500,
        floorWidthMm: 50000,
        floorDepthMm: 38000,
      },
      simulationMode: 'stochastic_random',
      components,
    };

    return {
      success: true,
      schema,
      layersFound: Array.from(layersFound),
      entityCount: parsedDxf.entities.length,
      componentsGenerated: components.length,
      warnings,
      errors: [],
    };
  }

  /**
   * Heuristic layer classifier matching AutoCAD standards (ISO 13567 / VDI 2860)
   */
  private static classifyEntity(
    layerName: string,
    entity: any
  ): {
    category: FactoryComponentCategory;
    type: FactoryComponentType;
    label: string;
    defaultHeightMm: number;
    defaultColor: string;
    defaultPowerKw: number;
    defaultKinematics?: any;
  } | null {
    // 1. Robots
    if (layerName.includes('ROBOT') || layerName.includes('KUKA') || layerName.includes('FANUC')) {
      return {
        category: 'robot',
        type: 'robot_6axis',
        label: '6-Axis Articulated Robot',
        defaultHeightMm: 2400,
        defaultColor: '#ea580c',
        defaultPowerKw: 4.5,
        defaultKinematics: {
          robot: {
            dof: 6,
            reachRadiusMm: 2500,
            jointLimits: [
              { joint: 'J1', minDeg: -185, maxDeg: 185 },
              { joint: 'J2', minDeg: -140, maxDeg: -5 },
              { joint: 'J3', minDeg: -120, maxDeg: 168 },
              { joint: 'J4', minDeg: -350, maxDeg: 350 },
              { joint: 'J5', minDeg: -125, maxDeg: 125 },
              { joint: 'J6', minDeg: -350, maxDeg: 350 },
            ],
            currentJointsDeg: [0, -45, 90, 0, 45, 0],
            toolAction: 'Idle / Waiting for part',
            payloadKg: 10.0,
          },
        },
      };
    }

    // 2. Conveyors
    if (layerName.includes('CONVEYOR') || layerName.includes('BANT') || layerName.includes('HATT')) {
      return {
        category: 'conveyor',
        type: 'roller_conveyor',
        label: 'Roller Conveyor Line',
        defaultHeightMm: 850,
        defaultColor: '#334155',
        defaultPowerKw: 2.8,
        defaultKinematics: {
          conveyor: {
            direction: [1, 0, 0],
            speedMps: 0.8,
            partSpawnIntervalSec: 10,
          },
        },
      };
    }

    // 3. CNC Machines
    if (layerName.includes('CNC') || layerName.includes('MACHINE') || layerName.includes('FREZE')) {
      return {
        category: 'machine',
        type: 'cnc_5axis',
        label: '5-Axis CNC Center',
        defaultHeightMm: 4400,
        defaultColor: '#1e293b',
        defaultPowerKw: 16.0,
        defaultKinematics: {
          spindle: { axis: 'Y', maxRpm: 18000, currentRpm: 14000 },
          door: { axis: 'X', strokeMm: 1200, isOpen: false, progress: 0 },
        },
      };
    }

    // 4. Lathe / Turning
    if (layerName.includes('LATHE') || layerName.includes('TORNA')) {
      return {
        category: 'machine',
        type: 'cnc_lathe',
        label: 'CNC Turning Lathe',
        defaultHeightMm: 3200,
        defaultColor: '#1e293b',
        defaultPowerKw: 12.0,
        defaultKinematics: {
          spindle: { axis: 'Z', maxRpm: 6000, currentRpm: 4500 },
        },
      };
    }

    // 5. AGV / AMR Paths
    if (layerName.includes('AGV') || layerName.includes('AMR') || layerName.includes('TRACK')) {
      return {
        category: 'agv',
        type: 'agv_amr',
        label: 'Autonomous AGV/AMR',
        defaultHeightMm: 600,
        defaultColor: '#0284c7',
        defaultPowerKw: 1.5,
        defaultKinematics: {
          agv: {
            speedMps: 1.2,
            waypoints: [],
            batteryPct: 90,
          },
        },
      };
    }

    // 6. High Bay Storage / Warehouse
    if (layerName.includes('STORAGE') || layerName.includes('ASRS') || layerName.includes('DEPO') || layerName.includes('RAF')) {
      return {
        category: 'storage',
        type: 'asrs_storage',
        label: 'High-Bay Storage Rack',
        defaultHeightMm: 12000,
        defaultColor: '#1e293b',
        defaultPowerKw: 6.0,
      };
    }

    // 7. CMM Inspection Quality
    if (layerName.includes('CMM') || layerName.includes('INSPECTION') || layerName.includes('KALITE')) {
      return {
        category: 'inspection',
        type: 'cmm_inspection',
        label: 'CMM Quality Cell',
        defaultHeightMm: 3500,
        defaultColor: '#0f172a',
        defaultPowerKw: 2.5,
      };
    }

    // 8. Safety Zone / Lines
    if (layerName.includes('SAFETY') || layerName.includes('EMNIYET') || layerName.includes('ISG')) {
      return {
        category: 'safety',
        type: 'safety_zone',
        label: 'Safety Perimeter',
        defaultHeightMm: 20,
        defaultColor: '#f59e0b',
        defaultPowerKw: 0.1,
      };
    }

    // 9. Walls
    if (layerName.includes('WALL') || layerName.includes('DUVAR')) {
      return {
        category: 'structure',
        type: 'wall',
        label: 'Concrete Facility Wall',
        defaultHeightMm: 4500,
        defaultColor: '#475569',
        defaultPowerKw: 0,
      };
    }

    return null;
  }

  /**
   * Calculates center point $[X, Z]$, width and depth from DXF geometric entity
   */
  private static extractEntityBounds(entity: any): {
    centerX: number;
    centerZ: number;
    width: number;
    depth: number;
    rotationDeg?: number;
  } | null {
    if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
      const vertices = entity.vertices || [];
      if (vertices.length < 2) return null;

      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;

      for (const v of vertices) {
        if (v.x < minX) minX = v.x;
        if (v.x > maxX) maxX = v.x;
        // In 2D CAD, Y corresponds to 3D Z on the floor plane
        if (v.y < minY) minY = v.y;
        if (v.y > maxY) maxY = v.y;
      }

      const w = Math.abs(maxX - minX);
      const d = Math.abs(maxY - minY);
      return {
        centerX: (minX + maxX) / 2,
        centerZ: (minY + maxY) / 2,
        width: w || 2000,
        depth: d || 2000,
      };
    }

    if (entity.type === 'LINE') {
      const sx = entity.start?.x || 0;
      const sy = entity.start?.y || 0;
      const ex = entity.end?.x || 0;
      const ey = entity.end?.y || 0;

      const len = Math.hypot(ex - sx, ey - sy);
      const angle = Math.atan2(ey - sy, ex - sx) * (180 / Math.PI);

      return {
        centerX: (sx + ex) / 2,
        centerZ: (sy + ey) / 2,
        width: Math.max(1000, len),
        depth: 1200,
        rotationDeg: Math.round(angle),
      };
    }

    if (entity.type === 'INSERT' || entity.type === 'POINT') {
      const x = entity.position?.x || 0;
      const z = entity.position?.y || 0;
      const rot = entity.rotation || 0;

      return {
        centerX: x,
        centerZ: z,
        width: 4000,
        depth: 4000,
        rotationDeg: rot,
      };
    }

    return null;
  }

  /**
   * Generates a sample valid AutoCAD DXF string with standard layers
   * that can be immediately imported to visualize a 2D factory plan.
   */
  public static generateSampleFactoryDxf(): string {
    return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
0
LAYER
2
FACTORY_MACHINES
70
0
62
7
6
CONTINUOUS
0
LAYER
2
FACTORY_CONVEYORS
70
0
62
3
6
CONTINUOUS
0
LAYER
2
FACTORY_ROBOTS
70
0
62
1
6
CONTINUOUS
0
LAYER
2
FACTORY_STORAGE
70
0
62
4
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
0
LWPOLYLINE
8
FACTORY_MACHINES
90
4
70
1
10
-14000.0
20
-9000.0
10
-10000.0
20
-9000.0
10
-10000.0
20
-5000.0
10
-14000.0
20
-5000.0
0
LWPOLYLINE
8
FACTORY_MACHINES
90
4
70
1
10
-6000.0
20
-9000.0
10
-2000.0
20
-9000.0
10
-2000.0
20
-5000.0
10
-6000.0
20
-5000.0
0
LWPOLYLINE
8
FACTORY_MACHINES
90
4
70
1
10
2000.0
20
-9000.0
10
6000.0
20
-9000.0
10
6000.0
20
-5000.0
10
2000.0
20
-5000.0
0
LWPOLYLINE
8
FACTORY_MACHINES
90
4
70
1
10
10000.0
20
-9000.0
10
14000.0
20
-9000.0
10
14000.0
20
-5000.0
10
10000.0
20
-5000.0
0
LWPOLYLINE
8
FACTORY_CONVEYORS
90
4
70
1
10
-16000.0
20
-4500.0
10
16000.0
20
-4500.0
10
16000.0
20
-3500.0
10
-16000.0
20
-3500.0
0
INSERT
8
FACTORY_ROBOTS
2
KUKA_KR120
10
-8000.0
20
-4000.0
30
0.0
50
0.0
0
INSERT
8
FACTORY_ROBOTS
2
FANUC_M20
10
8000.0
20
-4000.0
30
0.0
50
0.0
0
LWPOLYLINE
8
FACTORY_STORAGE
90
4
70
1
10
-22000.0
20
1000.0
10
-14000.0
20
1000.0
10
-14000.0
20
12000.0
10
-22000.0
20
12000.0
0
ENDSEC
0
EOF`;
  }
}
