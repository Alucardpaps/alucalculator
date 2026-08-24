import { EntityId, ConstraintId } from './types';

/**
 * Dependency Graph
 * 
 * Tracks dependencies between entities and constraints.
 * Used to optimize solver update cycles (only wake up relevant constraints).
 */
export class DependencyGraph {
    // Adjacency: Entity -> Constraints[]
    private entityToConstraints: Map<EntityId, ConstraintId[]> = new Map();

    // Adjacency: Constraint -> Entities[] (Redundant but fast)
    private constraintToEntities: Map<ConstraintId, EntityId[]> = new Map();

    constructor() { }

    public addDependency(entityId: EntityId, constraintId: ConstraintId) {
        // Entity -> Constraint
        const consts = this.entityToConstraints.get(entityId) || [];
        if (!consts.includes(constraintId)) {
            consts.push(constraintId);
            this.entityToConstraints.set(entityId, consts);
        }

        // Constraint -> Entity
        const ents = this.constraintToEntities.get(constraintId) || [];
        if (!ents.includes(entityId)) {
            ents.push(entityId);
            this.constraintToEntities.set(constraintId, ents);
        }
    }

    public removeConstraint(constraintId: ConstraintId) {
        // Remove from constraint map
        const entities = this.constraintToEntities.get(constraintId);
        if (entities) {
            // Remove reverse links
            for (const eid of entities) {
                const consts = this.entityToConstraints.get(eid);
                if (consts) {
                    this.entityToConstraints.set(eid, consts.filter(cid => cid !== constraintId));
                }
            }
        }
        this.constraintToEntities.delete(constraintId);
    }

    public getConstraintsForEntity(entityId: EntityId): ConstraintId[] {
        return this.entityToConstraints.get(entityId) || [];
    }

    public clear() {
        this.entityToConstraints.clear();
        this.constraintToEntities.clear();
    }
}
