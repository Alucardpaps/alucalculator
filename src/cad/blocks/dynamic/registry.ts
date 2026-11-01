/**
 * 🧱 AluCAD Dynamic Block Registry
 * 
 * Central registry of all parametric AutoCAD-grade Dynamic Blocks.
 */

import { DynamicBlockDef } from './types';
import { DYN_DOOR } from './definitions/door';
import { DYN_WINDOW } from './definitions/window';
import { DYN_TABLE_CHAIRS } from './definitions/tableChairs';
import { DYN_CABINET } from './definitions/cabinet';
import { DYN_SEATING } from './definitions/seating';
import { DYN_BED } from './definitions/bed';
import { DYN_STEEL_BEAM } from './definitions/steelBeam';
import { DYN_ROOF_TRUSS } from './definitions/roofTruss';
import { DYN_FASTENER } from './definitions/fastener';
import { DYN_INVOLUTE_GEAR } from './definitions/involuteGear';
import { DYN_ROLLER_CHAIN_SPROCKET } from './definitions/rollerSprocket';
import { DYN_TIMING_BELT_PULLEY } from './definitions/timingPulley';
import { DYN_PIPE_FLANGE } from './definitions/pipeFlange';
import { DYN_SLIDING_DOOR } from './definitions/slidingDoor';
import { DYN_STAIRS } from './definitions/stairs';
import { DYN_VANITY_SINK } from './definitions/vanitySink';
import { DYN_WC_TOILET } from './definitions/wcToilet';
import { DYN_VEHICLE_CAR } from './definitions/vehicleCar';
import { DYN_TREE_LANDSCAPE } from './definitions/treeLandscape';
import { DYN_PALLET_RACK } from './definitions/palletRack';
import { DYN_INDUSTRIAL_LADDER } from './definitions/industrialLadder';
import { DYN_LIGHTING_TROFFER } from './definitions/lightingTroffer';
import { DYN_FOUNDATION_COLUMN } from './definitions/foundationColumn';
import { DYN_KITCHEN_UNIT } from './definitions/kitchenUnit';
import { DYN_BATHTUB_SHOWER } from './definitions/bathtubShower';
import { DYN_ELEVATOR } from './definitions/elevator';
import { DYN_SKF_BEARING } from './definitions/skfBearing';
import { DYN_V_BELT_PULLEY } from './definitions/vBeltPulley';
import { DYN_ELECTRIC_MOTOR } from './definitions/electricMotor';
import { DYN_PARKING_BAY } from './definitions/parkingBay';
import { DYN_ANNOTATION_SYMBOLS } from './definitions/annotationSymbols';
import { DYN_TSLOT_PROFILE } from './definitions/tSlotProfile';
import { DYN_BOX_PROFILE } from './definitions/boxProfile';
import { DYN_ANGLE_PROFILE } from './definitions/angleProfile';
import { DYN_SHEET_METAL_PLATE } from './definitions/sheetMetalPlate';
import { DYN_GAMAK_MOTOR } from './definitions/gamakMotor';
import { DYN_YILMAZ_GEARBOX } from './definitions/yilmazGearbox';
import { DYN_ALUMINUM_PROFILE } from './definitions/aluminumProfile';
import { DYN_HYDRAULIC_CYLINDER } from './definitions/hydraulicCylinder';
import { DYN_LINEAR_GUIDE } from './definitions/linearGuideRail';
import { DYN_PILLOW_BLOCK } from './definitions/pillowBlockBearing';
import { DYN_SHAFT_COUPLING } from './definitions/shaftCoupling';
import { DYN_BALL_SCREW } from './definitions/ballScrewAssembly';
import { DYN_CONVEYOR_ROLLER } from './definitions/conveyorRoller';
import { DYN_PNEUMATIC_GRIPPER } from './definitions/pneumaticGripper';
import { DYN_INDUSTRIAL_VALVE } from './definitions/industrialValve';
import { DYN_CABLE_DRAG_CHAIN } from './definitions/cableDragChain';
import { DYN_HELICAL_SPRING } from './definitions/helicalSpring';
import { DYN_HEAVY_CASTER } from './definitions/heavyCasterWheel';

export const DYNAMIC_BLOCKS: DynamicBlockDef[] = [
    DYN_TSLOT_PROFILE,
    DYN_BOX_PROFILE,
    DYN_ANGLE_PROFILE,
    DYN_ALUMINUM_PROFILE,
    DYN_SHEET_METAL_PLATE,
    DYN_GAMAK_MOTOR,
    DYN_YILMAZ_GEARBOX,
    DYN_HYDRAULIC_CYLINDER,
    DYN_LINEAR_GUIDE,
    DYN_BALL_SCREW,
    DYN_PILLOW_BLOCK,
    DYN_SHAFT_COUPLING,
    DYN_CONVEYOR_ROLLER,
    DYN_PNEUMATIC_GRIPPER,
    DYN_INDUSTRIAL_VALVE,
    DYN_CABLE_DRAG_CHAIN,
    DYN_HELICAL_SPRING,
    DYN_HEAVY_CASTER,
    DYN_FASTENER,
    DYN_SKF_BEARING,
    DYN_INVOLUTE_GEAR,
    DYN_ROLLER_CHAIN_SPROCKET,
    DYN_TIMING_BELT_PULLEY,
    DYN_V_BELT_PULLEY,
    DYN_ELECTRIC_MOTOR,
    DYN_DOOR,
    DYN_WINDOW,
    DYN_SLIDING_DOOR,
    DYN_ELEVATOR,
    DYN_STAIRS,
    DYN_KITCHEN_UNIT,
    DYN_TABLE_CHAIRS,
    DYN_CABINET,
    DYN_SEATING,
    DYN_BED,
    DYN_VANITY_SINK,
    DYN_WC_TOILET,
    DYN_BATHTUB_SHOWER,
    DYN_STEEL_BEAM,
    DYN_ROOF_TRUSS,
    DYN_FOUNDATION_COLUMN,
    DYN_PIPE_FLANGE,
    DYN_INDUSTRIAL_LADDER,
    DYN_PALLET_RACK,
    DYN_LIGHTING_TROFFER,
    DYN_PARKING_BAY,
    DYN_VEHICLE_CAR,
    DYN_TREE_LANDSCAPE,
    DYN_ANNOTATION_SYMBOLS
];

export class DynamicBlockRegistry {
    private static blockMap = new Map<string, DynamicBlockDef>(
        DYNAMIC_BLOCKS.map(b => [b.id, b])
    );

    public static getAll(): DynamicBlockDef[] {
        return DYNAMIC_BLOCKS;
    }

    public static getById(id: string): DynamicBlockDef | undefined {
        return this.blockMap.get(id);
    }

    public static getByCategory(category: string): DynamicBlockDef[] {
        if (category === 'All') return DYNAMIC_BLOCKS;
        return DYNAMIC_BLOCKS.filter(b => b.category === category);
    }

    public static search(query: string): DynamicBlockDef[] {
        const q = query.toLowerCase().trim();
        if (!q) return DYNAMIC_BLOCKS;
        return DYNAMIC_BLOCKS.filter(b =>
            b.name.toLowerCase().includes(q) ||
            b.nameTr.toLowerCase().includes(q) ||
            b.description.toLowerCase().includes(q) ||
            b.descriptionTr.toLowerCase().includes(q) ||
            b.category.toLowerCase().includes(q) ||
            b.subcategory.toLowerCase().includes(q) ||
            b.subcategoryTr.toLowerCase().includes(q)
        );
    }
}
