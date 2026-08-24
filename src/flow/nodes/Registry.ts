import { EngineeringNodeSchema } from '../types/core';

// Registry Map
export const NODE_REGISTRY = new Map<string, EngineeringNodeSchema>();

// Helper to register nodes
export function registerNode(schema: EngineeringNodeSchema) {
    if (NODE_REGISTRY.has(schema.id)) {
        console.warn(`Duplicate node registration: ${schema.id}`);
    }
    NODE_REGISTRY.set(schema.id, schema);
}

// ---------------------------------------------------------
// AUTO-REGISTRATION (Placeholder until dynamic import)
// ---------------------------------------------------------
// In a real app, we might scan the directory.
// Here we manually import known nodes to ensure they are registered.

import { SpurGearNode } from './Mechanical/mech-gear-spur';
import {
    MaterialNode, BeamDeflectionNode, CombinedStressNode, TorsionNode, SheetMetalBendingNode, BoltStressNode, FitToleranceNode, MachiningMillingNode, MachiningGrindingNode,
    GoldenRatioNode,
    ShaftDesignNode,
    BearingLifeNode,
    SpringDesignNode,
    MohrCircle3DNode,
    PressureVesselNode,
    TorsionNonCircularNode,
    CastiglianoEnergyNode,
    AreaMomentNode
} from './Mechanical/EngineeringNodes';
import { PeriodicElementNode, GasLawsNode, ThermodynamicsNode, StoichiometryNode } from './Chemical/ChemistryNodes';
import { AddNode, MultiplyNode, SubtractNode, DivideNode, PowerNode, SqrtNode, SinNode, CosNode } from './StandardLibrary/Math';
import { IfNode, EqualNode, GreaterNode, LessNode, AndNode, OrNode, NotNode } from './StandardLibrary/Logic';
import { PointNode, LineNode, CircleNode, DistanceNode } from './StandardLibrary/Geometry';

registerNode(SpurGearNode);
registerNode(MaterialNode);
registerNode(BeamDeflectionNode);
registerNode(CombinedStressNode);
registerNode(TorsionNode);
registerNode(SheetMetalBendingNode);
registerNode(BoltStressNode);
registerNode(FitToleranceNode);
registerNode(MachiningMillingNode);
registerNode(MachiningGrindingNode);
registerNode(GoldenRatioNode);
registerNode(ShaftDesignNode);
registerNode(BearingLifeNode);
registerNode(SpringDesignNode);
registerNode(MohrCircle3DNode);
registerNode(PressureVesselNode);
registerNode(TorsionNonCircularNode);
registerNode(CastiglianoEnergyNode);
registerNode(AreaMomentNode);
registerNode(PeriodicElementNode);
registerNode(GasLawsNode);
registerNode(ThermodynamicsNode);
registerNode(StoichiometryNode);

// Math
registerNode(AddNode);
registerNode(MultiplyNode);
registerNode(SubtractNode);
registerNode(DivideNode);
registerNode(PowerNode);
registerNode(SqrtNode);
registerNode(SinNode);
registerNode(CosNode);

// Logic
registerNode(IfNode);
registerNode(EqualNode);
registerNode(GreaterNode);
registerNode(LessNode);
registerNode(AndNode);
registerNode(OrNode);
registerNode(NotNode);

// Geometry
registerNode(PointNode);
registerNode(LineNode);
registerNode(CircleNode);
registerNode(DistanceNode);

// CAD Integration
import { ExposeParameterNode, UpdateGeometryNode } from './StandardLibrary/CADIntegration';
registerNode(ExposeParameterNode);
registerNode(UpdateGeometryNode);

// Helper to get schema by ID
export const getSchema = (id: string): EngineeringNodeSchema | undefined => {
    return NODE_REGISTRY.get(id);
};
