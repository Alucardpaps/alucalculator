'use client';

import { useEffect, useRef } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useFlowStore } from '@/store/flowStore';

/**
 * 🔄 FlowVariableManager
 * 
 * Invisible component that bridges ProjectStore (Global Variables) 
 * and FlowStore (Calculator Nodes).
 * 
 * It listens for changes in global variables and automatically updates
 * any calculator inputs that reference them via formulas (e.g. "=SafetyFactor").
 */
export const FlowVariableManager = () => {
    const variables = useProjectStore(state => state.variables);

    // We use a ref to track if we need to run the update logic
    // This prevents running on every render, but useEffect [variables] handles that too.

    useEffect(() => {
        const { nodes, updateCalculatorInputs } = useFlowStore.getState();

        // Iterate all nodes to find formulas
        nodes.forEach(node => {
            if (node.data.type === 'calculator') {
                const formulas = node.data.inputFormulas;
                if (!formulas || Object.keys(formulas).length === 0) return;

                let hasChanges = false;
                const newInputs = { ...node.data.inputs };

                // Check each formula
                Object.entries(formulas).forEach(([key, formula]) => {
                    if (typeof formula === 'string' && formula.startsWith('=')) {
                        const varName = formula.substring(1).trim();
                        const variable = variables.find(v => v.name === varName);

                        if (variable) {
                            // If value differs, update it
                            // valid check for NaN equality if needed, but usually strict equality is fine
                            if (newInputs[key] !== variable.value) {
                                console.log(`[FlowVariableManager] Updating ${node.id}.${key} from ${newInputs[key]} to ${variable.value} (${varName})`);
                                newInputs[key] = variable.value;
                                hasChanges = true;
                            }
                        }
                    }
                });

                if (hasChanges) {
                    updateCalculatorInputs(node.id, newInputs);
                }
            }
        });
    }, [variables]); // Only re-run when global variables change

    return null; // Render nothing
};
