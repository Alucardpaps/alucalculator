/**
 * Reverse Edit Handler for 3D -> 2D Parametric Synchronization
 *
 * Translates modifications made in the 3D Design Viewport / Inspector
 * back into ParameterTable and marks 2D CAD driving constraints for GCS solver update.
 */

import { FeatureGraph } from './FeatureGraph';
import { ParamRole } from './IdentityMap';

export interface ReverseEditResult {
  success: boolean;
  paramName?: string;
  oldValue?: number;
  newValue?: number;
  affectedCadEntityId?: string;
  error?: string;
}

export class ReverseEditHandler {
  private graph: FeatureGraph;

  constructor(graph: FeatureGraph) {
    this.graph = graph;
  }

  /**
   * Applies a parameter modification originated in 3D (e.g. via Inspector property input)
   * back to the central ParameterTable and identifies the corresponding 2D CAD entity.
   */
  public apply3DPropertyChange(
    partId: string,
    role: ParamRole,
    newValue: number,
    subEntityId?: string // e.g. specific hole ID
  ): ReverseEditResult {
    const map = this.graph.getMap();
    const table = this.graph.getTable();

    // Find feature associated with this 3D part
    const feat = map.getFeatureByPartId(partId);
    if (!feat) {
      return {
        success: false,
        error: `No parametric feature mapped to 3D Part '${partId}'`,
      };
    }

    // Find bindings matching the role
    const bindings = map.getBindingsForFeature(feat.id);
    const matchedBinding = bindings.find((b) => {
      if (b.role !== role) return false;
      if (subEntityId && b.entityRef?.id !== subEntityId) return false;
      return true;
    });

    if (!matchedBinding) {
      return {
        success: false,
        error: `No parametric binding found for part '${partId}' with role '${role}'`,
      };
    }

    const paramName = matchedBinding.paramName;
    const oldValue = table.getValue(paramName);

    try {
      table.setValue(paramName, newValue);

      return {
        success: true,
        paramName,
        oldValue,
        newValue,
        affectedCadEntityId: feat.sourceId,
      };
    } catch (err: any) {
      return {
        success: false,
        paramName,
        error: err.message,
      };
    }
  }
}
