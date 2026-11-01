import { EngineeringNodeSchema, NodeCategory } from '../types/core';

export const NODE_REGISTRY = new Map<string, EngineeringNodeSchema>();

export function registerNode(schema: EngineeringNodeSchema) {
    if (NODE_REGISTRY.has(schema.id) && NODE_REGISTRY.get(schema.id) !== schema) {
        console.warn(`Duplicate node registration with different instance: ${schema.id}`);
    }
    NODE_REGISTRY.set(schema.id, schema);
}

export function getSchema(id: string): EngineeringNodeSchema | undefined {
    return NODE_REGISTRY.get(id);
}

export function listNodes(): EngineeringNodeSchema[] {
    return Array.from(NODE_REGISTRY.values());
}

export function listNodesByCategory(category: NodeCategory): EngineeringNodeSchema[] {
    return listNodes().filter((n) => n.category === category);
}

// ---------------------------------------------------------
// AUTO-REGISTRATION (Placeholder until dynamic import)
// ---------------------------------------------------------
// In a real app, we might scan the directory.
// Here we manually import known nodes to ensure they are registered.

import { SpurGearNode } from './Mechanical/mech-gear-spur';
import { HelicalGearNode } from './Mechanical/mech-gear-helical';
import { PowerTorqueNode } from './Mechanical/mech-power-torque';
import { PressureVesselCodeNode } from './Mechanical/mech-pressure-vessel';
import { ColumnBucklingNode } from './Mechanical/mech-column-buckling';
import { WeldJointNode } from './Mechanical/mech-weld-joint';
import { BeltDriveNode } from './Mechanical/mech-belt-drive';
import { ChainDriveNode } from './Mechanical/mech-chain-drive';
import { HydraulicCylinderNode } from './Mechanical/mech-hydraulic-cylinder';
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
import { PeriodicElementNode, GasLawsNode, ThermodynamicsNode, StoichiometryNode, SolutionConcentrationPHNode } from './Chemical/ChemistryNodes';
import { AddNode, MultiplyNode, SubtractNode, DivideNode, PowerNode, SqrtNode, SinNode, CosNode } from './StandardLibrary/Math';
import { Vector3DNode, VectorOperationsNode, Matrix3x3Node, NumericalCalculusNode, PolynomialRootsNode, StatisticsRegressionNode } from './StandardLibrary/AdvancedMathNodes';
import { IfNode, EqualNode, GreaterNode, LessNode, AndNode, OrNode, NotNode } from './StandardLibrary/Logic';
import { PointNode, LineNode, CircleNode, DistanceNode } from './StandardLibrary/Geometry';
import {
    IBeamProfileNode,
    RHSProfileNode,
    CHSProfileNode,
    LAngleProfileNode,
    CChannelProfileNode,
    SolidSectionNode,
    GeometryBridgeNode,
} from './Geometry/SectionProfileNodes';
import {
    KinematicsNode,
    DynamicsFrictionNode,
    WorkEnergyPowerNode,
    RotationalDynamicsNode,
    HarmonicVibrationNode,
    HeatTransferNode,
    ElectricalPowerImpedanceNode,
} from './Physics/PhysicsNodes';
import { UniversalMaterialNode, HeatTreatmentNode } from './Materials/MaterialAndHeatTreatmentNodes';

registerNode(SpurGearNode);
registerNode(HelicalGearNode);
registerNode(PowerTorqueNode);
registerNode(PressureVesselCodeNode);
registerNode(ColumnBucklingNode);
registerNode(WeldJointNode);
registerNode(BeltDriveNode);
registerNode(ChainDriveNode);
registerNode(HydraulicCylinderNode);
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

// Chemistry & Thermodynamics
registerNode(PeriodicElementNode);
registerNode(GasLawsNode);
registerNode(ThermodynamicsNode);
registerNode(StoichiometryNode);
registerNode(SolutionConcentrationPHNode);

// Materials & Metallurgy
registerNode(UniversalMaterialNode);
registerNode(HeatTreatmentNode);

// Geometry & Cross-Sections
registerNode(IBeamProfileNode);
registerNode(RHSProfileNode);
registerNode(CHSProfileNode);
registerNode(LAngleProfileNode);
registerNode(CChannelProfileNode);
registerNode(SolidSectionNode);
registerNode(GeometryBridgeNode);

// Physics & Dynamics
registerNode(KinematicsNode);
registerNode(DynamicsFrictionNode);
registerNode(WorkEnergyPowerNode);
registerNode(RotationalDynamicsNode);
registerNode(HarmonicVibrationNode);
registerNode(HeatTransferNode);
registerNode(ElectricalPowerImpedanceNode);

// Math
registerNode(AddNode);
registerNode(MultiplyNode);
registerNode(SubtractNode);
registerNode(DivideNode);
registerNode(PowerNode);
registerNode(SqrtNode);
registerNode(SinNode);
registerNode(CosNode);
registerNode(Vector3DNode);
registerNode(VectorOperationsNode);
registerNode(Matrix3x3Node);
registerNode(NumericalCalculusNode);
registerNode(PolynomialRootsNode);
registerNode(StatisticsRegressionNode);

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

// CAD Integration & Procedural Geometry Nodes (Blender / CATIA Knowledgeware)
import { ExposeParameterNode, UpdateGeometryNode } from './StandardLibrary/CADIntegration';
import {
    CadParametricShaftDriverNode,
    CadFlangePcdRuleNode,
    CadKnowledgewareRuleCheckNode,
    CadProceduralArrayDriverNode,
} from './StandardLibrary/CadGeometryNodes';
registerNode(ExposeParameterNode);
registerNode(UpdateGeometryNode);
registerNode(CadParametricShaftDriverNode);
registerNode(CadFlangePcdRuleNode);
registerNode(CadKnowledgewareRuleCheckNode);
registerNode(CadProceduralArrayDriverNode);

// Input
import {
    ConstantNode,
    ConstantLengthNode,
    ConstantModuleNode,
    ConstantTorqueNode,
    IsoSelectorNode,
    ConstantTeethNode,
    ConstantAngleNode,
    ConstantForceNode,
    ConstantPowerNode,
    ConstantRpmNode,
    ConstantRatioNode,
    ConstantHelixAngleNode,
    ConstantPressureNode,
    ConstantDiameterNode,
} from './Input/InputNodes';
registerNode(ConstantNode);
registerNode(ConstantLengthNode);
registerNode(ConstantModuleNode);
registerNode(ConstantTorqueNode);
registerNode(IsoSelectorNode);
registerNode(ConstantTeethNode);
registerNode(ConstantAngleNode);
registerNode(ConstantForceNode);
registerNode(ConstantPowerNode);
registerNode(ConstantRpmNode);
registerNode(ConstantRatioNode);
registerNode(ConstantHelixAngleNode);
registerNode(ConstantPressureNode);
registerNode(ConstantDiameterNode);

// Validation
import { SafetyFactorNode, UndercutDetectorNode, Iso6336PreliminaryNode } from './Validation/ValidationNodes';
registerNode(SafetyFactorNode);
registerNode(UndercutDetectorNode);
registerNode(Iso6336PreliminaryNode);

// Export / Viewer
import { DxfExportNode, PdfReportNode, SvgDrawingNode } from './Export/ExportNodes';
registerNode(DxfExportNode);
registerNode(PdfReportNode);
registerNode(SvgDrawingNode);
