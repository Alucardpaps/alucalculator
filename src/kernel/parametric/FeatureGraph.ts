/**
 * Parametric Feature Graph (DAG Engine)
 *
 * Grounded in: "CAD IS TRUTH, UI must never influence math."
 * Coordinates topological rebuilds across:
 * Sketch -> Region -> Extrude -> Holes -> Mates -> Fasteners -> DFM Engine.
 *
 * Implements dirty-cluster propagation with a 16ms frame budget.
 */

import { ParameterTable } from './ParameterTable';
import { IdentityMap, FeatureId, FeatureNode } from './IdentityMap';
import type { DesignPart } from '@/design-studio/designStore';
import type { MateConstraint } from '@/design-studio/assembly/mateTypes';
import { solveAssemblyMates } from '@/design-studio/assembly/mateSolver';
import { evaluateAssemblyDfm } from '@/engines/dfm/dfmEvaluator';
import type { DfmReport } from '@/engines/dfm/dfmTypes';

export interface RebuildResult {
  success: boolean;
  rebuiltFeatures: FeatureId[];
  parts: DesignPart[];
  mates: MateConstraint[];
  dfmReport: DfmReport;
  durationMs: number;
  error?: string;
}

export class FeatureGraph {
  private parameterTable: ParameterTable;
  private identityMap: IdentityMap;
  private dirtySet: Set<FeatureId> = new Set();
  private parts: Map<string, DesignPart> = new Map();
  private mates: MateConstraint[] = [];
  private materialId: string = 'al-6061-t6';

  constructor(
    parameterTable?: ParameterTable,
    identityMap?: IdentityMap
  ) {
    this.parameterTable = parameterTable || new ParameterTable();
    this.identityMap = identityMap || new IdentityMap();

    // Hook parameter changes into dirty cluster propagation
    this.parameterTable.subscribe((paramName) => {
      this.markParamDirty(paramName);
    });
  }

  public getTable(): ParameterTable {
    return this.parameterTable;
  }

  public getMap(): IdentityMap {
    return this.identityMap;
  }

  public setParts(parts: DesignPart[]): void {
    this.parts.clear();
    for (const p of parts) {
      this.parts.set(p.id, { ...p });
    }
  }

  public getParts(): DesignPart[] {
    return Array.from(this.parts.values());
  }

  public setMates(mates: MateConstraint[]): void {
    this.mates = mates.map((m) => ({ ...m }));
  }

  public getMates(): MateConstraint[] {
    return this.mates.map((m) => ({ ...m }));
  }

  public setMaterialId(matId: string): void {
    if (this.materialId !== matId) {
      this.materialId = matId;
      // Material change marks all parts dirty for DFM evaluation
      for (const feat of this.identityMap.getAllFeatures()) {
        this.dirtySet.add(feat.id);
      }
    }
  }

  /**
   * Marks a specific feature dirty and cascades to downstream dependents.
   */
  public markFeatureDirty(featureId: FeatureId): void {
    const queue = [featureId];
    const visited = new Set<FeatureId>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      this.dirtySet.add(current);

      // Find all features that take 'current' as input
      for (const feat of this.identityMap.getAllFeatures()) {
        if (feat.inputs.includes(current) && !visited.has(feat.id)) {
          queue.push(feat.id);
        }
      }
    }
  }

  /**
   * Marks all features bound to this parameter as dirty.
   */
  public markParamDirty(paramName: string): void {
    const bindings = this.identityMap.getBindingsForParam(paramName);
    for (const b of bindings) {
      this.markFeatureDirty(b.featureId);
    }
  }

  /**
   * Computes topological sorting of the Feature DAG using Kahn's algorithm.
   */
  public topologicalSort(): FeatureId[] {
    const all = this.identityMap.getAllFeatures();
    const inDegree: Map<FeatureId, number> = new Map();
    const adj: Map<FeatureId, FeatureId[]> = new Map();

    for (const feat of all) {
      inDegree.set(feat.id, 0);
      adj.set(feat.id, []);
    }

    for (const feat of all) {
      for (const inId of feat.inputs) {
        if (adj.has(inId)) {
          adj.get(inId)!.push(feat.id);
          inDegree.set(feat.id, (inDegree.get(feat.id) || 0) + 1);
        }
      }
    }

    const queue: FeatureId[] = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(id);
    }

    const sorted: FeatureId[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      sorted.push(u);

      for (const v of adj.get(u) || []) {
        inDegree.set(v, inDegree.get(v)! - 1);
        if (inDegree.get(v) === 0) {
          queue.push(v);
        }
      }
    }

    if (sorted.length < all.length) {
      throw new Error('Cyclic dependency detected in Parametric Feature Graph DAG');
    }

    return sorted;
  }

  /**
   * Executes a topological rebuild on all dirty features.
   */
  public rebuild(): RebuildResult {
    const t0 = performance.now();
    const rebuilt: FeatureId[] = [];

    try {
      const order = this.topologicalSort();
      const toProcess = order.filter((id) => this.dirtySet.has(id));

      for (const featId of toProcess) {
        const feat = this.identityMap.getFeature(featId);
        if (!feat || feat.frozen) continue;

        this.applyFeatureUpdate(feat);
        rebuilt.push(feat.id);
      }

      // Re-solve kinematic mates if any parts or mates were dirty
      let activeParts = this.getParts();
      if (this.mates.length > 0) {
        const mateRes = solveAssemblyMates(activeParts, this.mates);
        activeParts = mateRes.parts;
        // Update stored parts with new poses
        this.setParts(activeParts);
      }

      // Run DFM Quality Gate evaluation
      const dfmReport = evaluateAssemblyDfm(activeParts, this.mates, this.materialId);

      // Clear dirty set upon successful rebuild
      this.dirtySet.clear();

      const durationMs = performance.now() - t0;

      return {
        success: true,
        rebuiltFeatures: rebuilt,
        parts: activeParts,
        mates: this.mates,
        dfmReport,
        durationMs,
      };
    } catch (err: any) {
      const durationMs = performance.now() - t0;
      return {
        success: false,
        rebuiltFeatures: rebuilt,
        parts: this.getParts(),
        mates: this.mates,
        dfmReport: evaluateAssemblyDfm(this.getParts(), this.mates, this.materialId),
        durationMs,
        error: err.message,
      };
    }
  }

  /**
   * Dispatches parametric updates from ParameterTable to 3D Part params/holes.
   */
  private applyFeatureUpdate(feat: FeatureNode): void {
    const targetPartId = feat.targetId;
    if (!targetPartId) return;

    const part = this.parts.get(targetPartId);
    if (!part) return;

    const bindings = this.identityMap.getBindingsForFeature(feat.id);
    let partMutated = false;

    for (const b of bindings) {
      const val = this.parameterTable.getValue(b.paramName);
      if (val === undefined) continue;

      if (b.role === 'extrude-depth' || b.role === 'depth' || b.role === 'length') {
        part.params = { ...part.params, depth: val, length: val };
        partMutated = true;
      } else if (b.role === 'width') {
        part.params = { ...part.params, width: val };
        partMutated = true;
      } else if (b.role === 'height') {
        part.params = { ...part.params, height: val };
        partMutated = true;
      } else if (b.role === 'diameter') {
        part.params = { ...part.params, diameter: val };
        partMutated = true;
      } else if (b.role === 'radius') {
        // If it's a hole feature, update the hole diameter
        if (feat.kind === 'hole' && b.entityRef?.id) {
          const holeId = b.entityRef.id;
          if (part.holes) {
            const h = part.holes.find((item) => item.id === holeId);
            if (h) {
              h.diameter = val * 2;
              partMutated = true;
            }
          }
        } else {
          part.params = { ...part.params, diameter: val * 2 };
          partMutated = true;
        }
      }
    }

    if (partMutated) {
      this.parts.set(part.id, { ...part });
    }
  }
}
