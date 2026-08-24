/**
 * AluCalc OS v5.0 — BOM Selectors
 *
 * Derived state computed from the assembly store.
 * Pure selector functions — zero side effects.
 * Use with: useAssemblyStore(selectBOM)
 */

import type {
  WorkspaceComponent,
  ComponentType,
  BOMEntry,
  BOMSummary,
  StructureHealth,
  ValidationMessage,
} from '@/lib/types/v5-types';

// ════════════════════════════════════════════
// Store State Shape (minimal — only what selectors need)
// ════════════════════════════════════════════

interface AssemblyStateSlice {
  components: Record<string, WorkspaceComponent>;
}

// ════════════════════════════════════════════
// BOM Selectors
// ════════════════════════════════════════════

/**
 * Compute the full Bill of Materials from current components.
 * Groups by type, sums weight and cost.
 */
export const selectBOM = (state: AssemblyStateSlice): BOMSummary => {
  const components = Object.values(state.components);

  if (components.length === 0) {
    return {
      entries: [],
      totalComponents: 0,
      totalWeight: 0,
      totalCost: 0,
    };
  }

  const groupMap = new Map<ComponentType, BOMEntry>();

  for (const comp of components) {
    const existing = groupMap.get(comp.type);

    if (existing) {
      existing.count += 1;
      existing.totalWeight += comp.metadata.weight ?? 0;
      existing.totalCost += comp.metadata.unitCost ?? 0;
    } else {
      groupMap.set(comp.type, {
        type: comp.type,
        count: 1,
        totalWeight: comp.metadata.weight ?? 0,
        totalCost: comp.metadata.unitCost ?? 0,
      });
    }
  }

  const entries = Array.from(groupMap.values());
  const totalComponents = components.length;
  const totalWeight = entries.reduce((sum, e) => sum + e.totalWeight, 0);
  const totalCost = entries.reduce((sum, e) => sum + e.totalCost, 0);

  return { entries, totalComponents, totalWeight, totalCost };
};

/**
 * Compute BOM as simple count map (lightweight version).
 * Output: { profile: 2, bracket: 4, bolt: 8 }
 */
export const selectBOMCounts = (
  state: AssemblyStateSlice
): Record<ComponentType, number> => {
  const result: Record<string, number> = {};

  for (const comp of Object.values(state.components)) {
    result[comp.type] = (result[comp.type] ?? 0) + 1;
  }

  return result as Record<ComponentType, number>;
};

// ════════════════════════════════════════════
// Structure Health Selectors
// ════════════════════════════════════════════

/**
 * Validate all components and return structural health report.
 */
export const selectStructureHealth = (
  state: AssemblyStateSlice
): StructureHealth => {
  const components = Object.values(state.components);

  if (components.length === 0) {
    return {
      isStable: true,
      warnings: [],
      errors: [],
      connectedRatio: 1,
    };
  }

  const warnings: ValidationMessage[] = [];
  const errors: ValidationMessage[] = [];
  let connectedCount = 0;

  for (const comp of components) {
    // Floating component (no connections)
    if (comp.connections.length === 0) {
      warnings.push({
        componentId: comp.id,
        severity: 'warning',
        message: `${capitalize(comp.type)} "${comp.id.slice(0, 8)}" is floating — not connected`,
      });
    } else {
      connectedCount++;
    }

    // Bolt-specific: should connect 2+ components
    if (comp.type === 'bolt' && comp.connections.length === 1) {
      warnings.push({
        componentId: comp.id,
        severity: 'warning',
        message: `Bolt "${comp.id.slice(0, 8)}" only connects 1 component — needs 2+`,
      });
    }

    // Any validation errors from the store
    for (const err of comp.validationErrors) {
      if (!warnings.some((w) => w.componentId === comp.id && w.message === err)) {
        errors.push({
          componentId: comp.id,
          severity: 'error',
          message: err,
        });
      }
    }
  }

  const connectedRatio = components.length > 0
    ? connectedCount / components.length
    : 1;

  return {
    isStable: errors.length === 0 && connectedRatio >= 0.5,
    warnings,
    errors,
    connectedRatio,
  };
};

// ════════════════════════════════════════════
// Utility
// ════════════════════════════════════════════

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
