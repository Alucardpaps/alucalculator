/**
 * Identity Map for Parametric Feature Graph
 *
 * Bridges 2D CAD Entities (cadStore) <-> FeatureId (DAG) <-> 3D Solids (designStore)
 * Preserves persistent topological identities across live rebuild cycles.
 */

export type FeatureId = string;

export type FeatureKind =
  | 'sketch'
  | 'region'
  | 'extrude'
  | 'revolve'
  | 'hole'
  | 'mate'
  | 'fastener';

export type ParamRole =
  | 'radius'
  | 'diameter'
  | 'length'
  | 'width'
  | 'height'
  | 'depth'
  | 'thickness'
  | 'extrude-depth'
  | 'distance'
  | 'angle'
  | 'offset'
  | 'count';

export interface ParamBinding {
  paramName: string;
  featureId: FeatureId;
  role: ParamRole;
  entityRef?: {
    store: 'cad' | 'studio';
    id: string;
    path?: string;
  };
}

export interface FeatureNode {
  id: FeatureId;
  name: string;
  kind: FeatureKind;
  inputs: FeatureId[];
  params: string[]; // ParameterTable keys
  frozen?: boolean; // DFM override / locked
  sourceId?: string; // 2D CAD entity ID or primitive ID
  targetId?: string; // 3D Design Part ID or Hole ID
  meta?: Record<string, any>;
}

export class IdentityMap {
  private features: Map<FeatureId, FeatureNode> = new Map();
  private cadToFeature: Map<string, FeatureId> = new Map();
  private partToFeature: Map<string, FeatureId> = new Map();
  private bindings: ParamBinding[] = [];

  /**
   * Registers or updates a feature node.
   */
  public registerFeature(node: FeatureNode): void {
    this.features.set(node.id, { ...node });
    if (node.sourceId) {
      this.cadToFeature.set(node.sourceId, node.id);
    }
    if (node.targetId) {
      this.partToFeature.set(node.targetId, node.id);
    }
  }

  public getFeature(id: FeatureId): FeatureNode | undefined {
    const f = this.features.get(id);
    return f ? { ...f } : undefined;
  }

  public getAllFeatures(): FeatureNode[] {
    return Array.from(this.features.values()).map((f) => ({ ...f }));
  }

  public getFeatureByCadId(cadId: string): FeatureNode | undefined {
    const featId = this.cadToFeature.get(cadId);
    return featId ? this.getFeature(featId) : undefined;
  }

  public getFeatureByPartId(partId: string): FeatureNode | undefined {
    const featId = this.partToFeature.get(partId);
    return featId ? this.getFeature(featId) : undefined;
  }

  public linkCadToPart(cadId: string, partId: string, featureId?: string): FeatureId {
    const fId = featureId || `feat_${cadId}_${partId}`;
    let node = this.features.get(fId);
    if (!node) {
      node = {
        id: fId,
        name: `Linked_${cadId}`,
        kind: 'extrude',
        inputs: [],
        params: [],
        sourceId: cadId,
        targetId: partId,
      };
      this.registerFeature(node);
    } else {
      node.sourceId = cadId;
      node.targetId = partId;
      this.registerFeature(node);
    }
    return fId;
  }

  /**
   * Associates a parameter name with a feature role.
   */
  public bindParam(binding: ParamBinding): void {
    // Remove duplicate binding if exists
    this.bindings = this.bindings.filter(
      (b) => !(b.paramName === binding.paramName && b.featureId === binding.featureId && b.role === binding.role)
    );
    this.bindings.push({ ...binding });

    const feat = this.features.get(binding.featureId);
    if (feat && !feat.params.includes(binding.paramName)) {
      feat.params.push(binding.paramName);
    }
  }

  public getBindingsForParam(paramName: string): ParamBinding[] {
    return this.bindings.filter((b) => b.paramName === paramName);
  }

  public getBindingsForFeature(featureId: FeatureId): ParamBinding[] {
    return this.bindings.filter((b) => b.featureId === featureId);
  }

  public clear(): void {
    this.features.clear();
    this.cadToFeature.clear();
    this.partToFeature.clear();
    this.bindings = [];
  }
}
