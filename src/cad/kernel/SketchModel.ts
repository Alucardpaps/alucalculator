import { v4 as uuidv4 } from 'uuid';
import {
    SketchPoint, SketchLine, SketchCircle, Constraint,
    Variable, EntityId, ConstraintId, ConstraintType,
    BaseEntity
} from './types';

/**
 * SketchModel
 * 
 * The single source of truth for the CAD sketch state.
 * Manages entities, variables, and passes data to the solver.
 */
export class SketchModel {
    // Registry
    variables: Map<string, Variable> = new Map();
    points: Map<EntityId, SketchPoint> = new Map();
    lines: Map<EntityId, SketchLine> = new Map();
    circles: Map<EntityId, SketchCircle> = new Map();
    constraints: Map<ConstraintId, Constraint> = new Map();

    constructor() {
        // Initialize origin
        this.addPoint(0, 0, true);
    }

    // -----------------------------------------------------
    // Entity Creation
    // -----------------------------------------------------

    addPoint(x: number, y: number, fixed = false): SketchPoint {
        const id = uuidv4();
        const varX = this.createVariable(x, fixed);
        const varY = this.createVariable(y, fixed);

        const point: SketchPoint = {
            id,
            type: 'point',
            visible: true,
            x: varX,
            y: varY
        };

        this.points.set(id, point);
        return point;
    }

    addLine(p1Id: EntityId, p2Id: EntityId): SketchLine {
        const id = uuidv4();
        const line: SketchLine = {
            id,
            type: 'line',
            visible: true,
            p1: p1Id,
            p2: p2Id
        };
        this.lines.set(id, line);
        return line;
    }

    addCircle(centerId: EntityId, radius: number, fixedRadius = false): SketchCircle {
        const id = uuidv4();
        const varRadius = this.createVariable(radius, fixedRadius);
        const circle: SketchCircle = {
            id,
            type: 'circle',
            visible: true,
            center: centerId,
            radius: varRadius
        };
        this.circles.set(id, circle);
        return circle;
    }

    // -----------------------------------------------------
    // Variable Management
    // -----------------------------------------------------

    private createVariable(value: number, isFixed: boolean): Variable {
        const id = uuidv4();
        const v: Variable = { id, value, isFixed };
        this.variables.set(id, v);
        return v;
    }

    updateVariable(id: string, value: number) {
        const v = this.variables.get(id);
        if (v && !v.isFixed) {
            v.value = value;
        }
    }

    // -----------------------------------------------------
    // Constraints
    // -----------------------------------------------------

    addConstraint(type: ConstraintType, entities: EntityId[], value?: number): Constraint {
        const id = uuidv4();
        const constraint: Constraint = {
            id,
            type,
            entityIds: entities, // Map param to property
            value,
            active: true
        };
        this.constraints.set(id, constraint);
        return constraint;
    }

    // -----------------------------------------------------
    // Queries
    // -----------------------------------------------------

    getEntity(id: EntityId): BaseEntity | undefined {
        return this.points.get(id) || this.lines.get(id) || this.circles.get(id);
    }

    getPoint(id: EntityId): SketchPoint | undefined {
        return this.points.get(id);
    }

    getVariableValue(varId: string): number {
        return this.variables.get(varId)?.value ?? 0;
    }
}
