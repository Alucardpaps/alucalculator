import { useMemo } from 'react';
import { EngineeringGeometry } from '../geometry-types';

/**
 * useActiveGeometry - Workstation Adapter
 * 
 * In the new Window-Centric architecture, geometry is no longer 
 * tied to a "Selected Flow Node". Instead, it will be synchronized 
 * via the Project Vault or active module state.
 * 
 * TODO: Re-integrate with LinearEngineRenderer active step results.
 */
export function useActiveGeometry(): EngineeringGeometry | null {
    // Temporarily stubbed during Flow decommissioning to stabilize build.
    return useMemo(() => {
        return null;
    }, []);
}
