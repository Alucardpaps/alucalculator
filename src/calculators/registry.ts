/**
 * AluCalc OS — Calculator Registry
 * 
 * Central registry for all schema-driven calculators.
 * NOW UPDATED WITH PHASE 17 (V2) CALCULATORS.
 */

import type { CalculatorSchema, CalculatorRegistry } from '@/types/calculator-schema';

// V2 Schemas (Phase 17)
import beamDeflectionV2 from './schemas-v2/beam-deflection';
import bearingsV2 from './schemas-v2/bearings';
import boltStressV2 from './schemas-v2/bolt-stress';
import fastenersV2 from './schemas-v2/fasteners';
import fitsTolerancesV2 from './schemas-v2/fits-tolerances';
import fluidFlowV2 from './schemas-v2/fluid-flow';
import gearSpurV2 from './schemas-v2/gear-spur';
import ohmsLawV2 from './schemas-v2/ohms-law';
import profileWeightV2 from './schemas-v2/profile-weight';
import pumpsV2 from './schemas-v2/pumps';
import sheetMetalV2 from './schemas-v2/sheet-metal';
import strengthAnalysisV2 from './schemas-v2/strength-analysis';
import unitConverterV2 from './schemas-v2/unit-converter';
import voltageDropV2 from './schemas-v2/voltage-drop';
import weldingFilletV2 from './schemas-v2/welding-fillet';
import weldingHeatV2 from './schemas-v2/welding-heat';
import vatCalculatorV2 from './schemas-v2/vat-calculator';
import periodicElementV2 from './schemas-v2/periodic-element';
import gasLawsV2 from './schemas-v2/gas-laws';
import thermodynamicsV2 from './schemas-v2/thermodynamics';
import stoichiometryV2 from './schemas-v2/stoichiometry';
import areaMomentInertiaV2 from './schemas-v2/area-moment-inertia';
import { mohrsCircleSchema } from './schemas-v2/mohrs-circle';
import hookesLaw3dSchema from './schemas-v2/hookes-law-3d';
import sfdBmdAcademicSchema from './schemas-v2/sfd-bmd-academic';
import { threadGeometrySchema } from './schemas-v2/thread-geometry';
import goldenRatioSchema from './schemas-v2/golden-ratio';
import beltDriveSchema from './schemas-v2/belt-drive';
import brakesClutchesSchema from './schemas-v2/brakes-clutches';
import heatTransferSchema from './schemas-v2/heat-transfer';
import aerodynamicsSchema from './schemas-v2/aerodynamics';
import pressureVesselSchema from './schemas-v2/pressure-vessel';
import torsionNonCircularSchema from './schemas-v2/torsion-non-circular';
import castiglianoEnergySchema from './schemas-v2/castigliano-strain-energy';

// New V1 schemas
import { hydraulicCylinderSchema } from './schemas/hydraulic-cylinder';
import { springCalculatorSchema } from './schemas/spring-compression';

// Legacy V1 (Keep for backward compatibility if needed, but V2 takes precedence in semantics)
import { boltStressSchema } from './schemas/bolt-stress';

// ============================================
// Registry
// ============================================

import { columnBucklingSchema } from './schemas-v2/column-buckling';
import { torsionShaftSchema } from './schemas-v2/torsion-shaft';

import { machiningGrindingSchema } from './schemas-v2/machining-grinding';

export const CALCULATOR_REGISTRY: CalculatorRegistry = {
    // ... Existing
    'beam-deflection': beamDeflectionV2 as unknown as CalculatorSchema,
    'bearings': bearingsV2 as unknown as CalculatorSchema,
    'bolt-stress': boltStressV2 as unknown as CalculatorSchema,
    'fasteners': fastenersV2 as unknown as CalculatorSchema,
    'fits-tolerances': fitsTolerancesV2 as unknown as CalculatorSchema,
    'fluid-flow': fluidFlowV2 as unknown as CalculatorSchema,
    'gear-spur': gearSpurV2 as unknown as CalculatorSchema,
    'ohms-law': ohmsLawV2 as unknown as CalculatorSchema,
    'profile-weight': profileWeightV2 as unknown as CalculatorSchema,
    'pumps': pumpsV2 as unknown as CalculatorSchema,
    'sheet-metal': sheetMetalV2 as unknown as CalculatorSchema,
    'strength-analysis': strengthAnalysisV2 as unknown as CalculatorSchema,
    'unit-converter': unitConverterV2 as unknown as CalculatorSchema,
    'voltage-drop': voltageDropV2 as unknown as CalculatorSchema,
    'welding-fillet': weldingFilletV2 as unknown as CalculatorSchema,
    'welding-heat': weldingHeatV2 as unknown as CalculatorSchema,
    'vat-calculator': vatCalculatorV2 as unknown as CalculatorSchema,
    'chemistry-element': periodicElementV2 as unknown as CalculatorSchema,
    'gas-laws': gasLawsV2 as unknown as CalculatorSchema,
    'thermodynamics': thermodynamicsV2 as unknown as CalculatorSchema,
    'stoichiometry': stoichiometryV2 as unknown as CalculatorSchema,
    'area-moment-inertia': areaMomentInertiaV2 as unknown as CalculatorSchema,
    'mohrs-circle': mohrsCircleSchema as unknown as CalculatorSchema,
    'hookes-law-3d': hookesLaw3dSchema as unknown as CalculatorSchema,
    'sfd-bmd-academic': sfdBmdAcademicSchema as unknown as CalculatorSchema,
    'thread-geometry': threadGeometrySchema as unknown as CalculatorSchema,
    'column-buckling': columnBucklingSchema as unknown as CalculatorSchema,
    'torsion-shaft': torsionShaftSchema as unknown as CalculatorSchema,
    'machining-grinding': machiningGrindingSchema as unknown as CalculatorSchema,
    'golden-ratio': goldenRatioSchema as unknown as CalculatorSchema,
    'belt-drive': beltDriveSchema as unknown as CalculatorSchema,
    'brakes-clutches': brakesClutchesSchema as unknown as CalculatorSchema,
    'heat-transfer': heatTransferSchema as unknown as CalculatorSchema,
    'aerodynamics': aerodynamicsSchema as unknown as CalculatorSchema,
    'pressure-vessel': pressureVesselSchema as unknown as CalculatorSchema,
    'torsion-non-circular': torsionNonCircularSchema as unknown as CalculatorSchema,
    'castigliano-energy': castiglianoEnergySchema as unknown as CalculatorSchema,
    'hydraulic-cylinder': hydraulicCylinderSchema,
    'spring-compression': springCalculatorSchema,

    // ... Legacy
    'bolt-stress-v1': boltStressSchema,
};

// ============================================
// Registry Utilities
// ============================================

export function getAllCalculators(): CalculatorSchema[] {
    return Object.values(CALCULATOR_REGISTRY);
}

export function getCalculatorById(id: string): CalculatorSchema | undefined {
    return CALCULATOR_REGISTRY[id];
}

export function getCalculatorsByDomain(domain: CalculatorSchema['domain']): CalculatorSchema[] {
    return Object.values(CALCULATOR_REGISTRY).filter(calc => calc.domain === domain);
}

export function searchCalculators(query: string): CalculatorSchema[] {
    const lowerQuery = query.toLowerCase();
    return Object.values(CALCULATOR_REGISTRY).filter(calc => {
        if (calc.metadata.title.toLowerCase().includes(lowerQuery)) return true;
        if (calc.metadata.description.toLowerCase().includes(lowerQuery)) return true;
        if (calc.metadata.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;
        return false;
    });
}

// Domain Metadata
export const DOMAIN_INFO: Record<string, { label: string; color: string; icon: string }> = {
    mechanical: { label: 'Mechanical', color: '#00e5ff', icon: 'Wrench' },
    fabrication: { label: 'Fabrication', color: '#ff6b35', icon: 'Flame' },
    materials: { label: 'Materials', color: '#9c27b0', icon: 'Layers' },
    civil: { label: 'Civil / Structural', color: '#795548', icon: 'Building' },
    fluid: { label: 'Fluid Mechanics', color: '#2196f3', icon: 'Droplets' },
    electrical: { label: 'Electrical', color: '#ffeb3b', icon: 'Zap' },
    thermal: { label: 'Thermal', color: '#f44336', icon: 'Thermometer' },
    math: { label: 'Math / Utility', color: '#607d8b', icon: 'Calculator' },
    finance: { label: 'Finance', color: '#4caf50', icon: 'DollarSign' },
};
