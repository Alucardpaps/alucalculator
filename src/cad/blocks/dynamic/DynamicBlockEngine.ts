/**
 * ⚡ AluCAD Dynamic Block Engine
 * 
 * AutoCAD-Grade Dynamic Parameter & Action Engine:
 * - Instantiates 2D entities with translation, scale, and rotation
 * - Evaluates linear stretch, array actions, flip axes, and visibility subsets
 * - Evaluates 3D CAD parts for direct insertion into DesignStudio scene
 * - Binds entities to common blockInstanceId and tags them with dynamic metadata
 */

import { Point, CadEntity, BlockDefinition } from '../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from './types';
import { DynamicBlockRegistry } from './registry';

export class DynamicBlockEngine {
    /**
     * Instantiates a dynamic block into the 2D CAD canvas with transformed coordinates.
     */
    public static instantiate(
        blockDef: DynamicBlockDef,
        params: Record<string, any>,
        insertPoint: Point,
        scale = 1.0,
        rotationRad = 0,
        layerId = 'layer-0'
    ): CadEntity[] {
        const mergedParams = { ...blockDef.defaultValues, ...params };
        const rawEntities = blockDef.generate2D(mergedParams, { x: 0, y: 0 });

        const blockInstanceId = `dyn_inst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        const groupId = `grp_dyn_${Date.now().toString(36)}`;

        const cos = Math.cos(rotationRad);
        const sin = Math.sin(rotationRad);

        const transformPoint = (p: Point): Point => {
            const rx = p.x * scale;
            const ry = p.y * scale;
            return {
                x: insertPoint.x + rx * cos - ry * sin,
                y: insertPoint.y + rx * sin + ry * cos
            };
        };

        const transformedEntities: CadEntity[] = [];

        for (const entity of rawEntities) {
            const g = entity.geometry;
            let newGeometry = { ...g };

            switch (g.type) {
                case 'LINE':
                    newGeometry = {
                        type: 'LINE',
                        start: transformPoint(g.start),
                        end: transformPoint(g.end)
                    };
                    break;

                case 'CIRCLE':
                    newGeometry = {
                        type: 'CIRCLE',
                        center: transformPoint(g.center),
                        radius: g.radius * scale
                    };
                    break;

                case 'ARC':
                    newGeometry = {
                        type: 'ARC',
                        center: transformPoint(g.center),
                        radius: g.radius * scale,
                        startAngle: g.startAngle + rotationRad,
                        endAngle: g.endAngle + rotationRad
                    };
                    break;

                case 'RECTANGLE':
                    newGeometry = {
                        type: 'RECTANGLE',
                        center: transformPoint(g.center),
                        width: g.width * scale,
                        height: g.height * scale,
                        rotation: (g.rotation || 0) + rotationRad
                    };
                    break;

                case 'HEXAGON':
                    newGeometry = {
                        type: 'HEXAGON',
                        center: transformPoint(g.center),
                        radius: g.radius * scale,
                        rotation: (g.rotation || 0) + rotationRad
                    };
                    break;

                case 'POLYLINE':
                    newGeometry = {
                        type: 'POLYLINE',
                        vertices: g.vertices.map(v => transformPoint(v)),
                        closed: g.closed
                    };
                    break;

                case 'HATCH':
                    newGeometry = {
                        type: 'HATCH',
                        boundaryVertices: (g as any).boundaryVertices.map((v: Point) => transformPoint(v)),
                        holes: (g as any).holes ? (g as any).holes.map((hole: Point[]) => hole.map((v: Point) => transformPoint(v))) : undefined,
                        strokeBorder: (g as any).strokeBorder,
                        pattern: (g as any).pattern,
                        scale: ((g as any).scale || 1.0) * scale,
                        angle: ((g as any).angle || 45) + (rotationRad * 180 / Math.PI)
                    };
                    break;
            }

            transformedEntities.push({
                ...entity,
                id: crypto.randomUUID ? crypto.randomUUID() : `ent_${Math.random().toString(36).substring(2, 9)}`,
                layerId,
                groupId,
                blockInstanceId,
                isDynamic: true,
                dynamicBlockId: blockDef.id,
                dynamicParams: { ...mergedParams },
                dynamicBasePoint: insertPoint,
                dynamicScale: scale,
                dynamicRotationRad: rotationRad
            });
        }

        return transformedEntities;
    }

    /**
     * Converts a configured Dynamic Block into a standard BlockDefinition for compatibility with BlockManager.
     */
    public static toStandardBlockDefinition(
        blockDef: DynamicBlockDef,
        params?: Record<string, any>
    ): BlockDefinition {
        const mergedParams = { ...blockDef.defaultValues, ...params };
        const entities = blockDef.generate2D(mergedParams, { x: 0, y: 0 });

        return {
            id: `dyn_blk_${blockDef.id}`,
            name: `⚡ ${blockDef.nameTr} (${blockDef.name})`,
            description: blockDef.descriptionTr,
            category: (blockDef.category as any) || 'Dynamic',
            subcategory: blockDef.subcategoryTr,
            basePoint: { x: 0, y: 0 },
            entities,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isDynamic: true,
            dynamicBlockId: blockDef.id,
            dynamicParams: mergedParams
        };
    }

    /**
     * Gets interactive grips in world coordinates for a dynamic block instance.
     */
    public static getGripsWorld(
        blockDef: DynamicBlockDef,
        params: Record<string, any>,
        insertPoint: Point,
        scale = 1.0,
        rotationRad = 0
    ): DynamicGrip[] {
        const mergedParams = { ...blockDef.defaultValues, ...params };
        const rawGrips = blockDef.getGrips(mergedParams, { x: 0, y: 0 });

        const cos = Math.cos(rotationRad);
        const sin = Math.sin(rotationRad);

        const transformPoint = (p: Point): Point => {
            const rx = p.x * scale;
            const ry = p.y * scale;
            return {
                x: insertPoint.x + rx * cos - ry * sin,
                y: insertPoint.y + rx * sin + ry * cos
            };
        };

        const transformDirection = (d?: Point): Point | undefined => {
            if (!d) return undefined;
            const len = Math.hypot(d.x, d.y) || 1;
            const nx = d.x / len;
            const ny = d.y / len;
            return {
                x: nx * cos - ny * sin,
                y: nx * sin + ny * cos
            };
        };

        return rawGrips.map(g => {
            let dir = g.direction;
            if (!dir && (g.type === 'stretch' || g.type === 'linear')) {
                const lp = blockDef.linearParams?.find(p => p.id === g.paramId);
                if (lp?.axis === 'y') {
                    dir = { x: 0, y: 1 };
                } else if (lp?.axis === 'x') {
                    dir = { x: 1, y: 0 };
                } else {
                    const dx = g.position.x;
                    const dy = g.position.y;
                    if (Math.abs(dx) >= Math.abs(dy)) {
                        dir = { x: Math.sign(dx) || 1, y: 0 };
                    } else {
                        dir = { x: 0, y: Math.sign(dy) || 1 };
                    }
                }
            }

            return {
                ...g,
                position: transformPoint(g.position),
                direction: transformDirection(dir)
            };
        });
    }

    /**
     * Evaluates 3D components for insertion into 3D Design Studio.
     */
    public static generate3D(
        blockDef: DynamicBlockDef,
        params: Record<string, any>,
        basePos = { x: 0, y: 0, z: 0 }
    ): DynamicPart3DDef[] {
        const mergedParams = { ...blockDef.defaultValues, ...params };
        return blockDef.generate3D(mergedParams, basePos);
    }

    /**
     * Updates an existing dynamic block instance on the canvas with new parameters.
     * Preserves blockInstanceId, groupId, basePoint, scale, rotation, and layer.
     */
    public static updateInstance(
        existingEntities: CadEntity[],
        patchParams: Record<string, any>,
        newBasePoint?: Point
    ): CadEntity[] {
        if (!existingEntities.length) return [];
        const first = existingEntities[0];
        if (!first.dynamicBlockId) return existingEntities;

        const blockDef = DynamicBlockRegistry.getById(first.dynamicBlockId);
        if (!blockDef) return existingEntities;

        const mergedParams = {
            ...blockDef.defaultValues,
            ...(first.dynamicParams || {}),
            ...patchParams
        };

        const basePoint = newBasePoint || first.dynamicBasePoint || { x: 0, y: 0 };
        const scale = first.dynamicScale ?? 1.0;
        const rotationRad = first.dynamicRotationRad ?? 0;
        const layerId = first.layerId || 'layer-0';
        const blockInstanceId = first.blockInstanceId;
        const groupId = first.groupId;

        const rawEntities = blockDef.generate2D(mergedParams, { x: 0, y: 0 });

        const cos = Math.cos(rotationRad);
        const sin = Math.sin(rotationRad);

        const transformPoint = (p: Point): Point => {
            const rx = p.x * scale;
            const ry = p.y * scale;
            return {
                x: basePoint.x + rx * cos - ry * sin,
                y: basePoint.y + rx * sin + ry * cos
            };
        };

        const transformedEntities: CadEntity[] = [];

        for (const entity of rawEntities) {
            const g = entity.geometry;
            let newGeometry = { ...g };

            switch (g.type) {
                case 'LINE':
                    newGeometry = {
                        type: 'LINE',
                        start: transformPoint(g.start),
                        end: transformPoint(g.end)
                    };
                    break;

                case 'CIRCLE':
                    newGeometry = {
                        type: 'CIRCLE',
                        center: transformPoint(g.center),
                        radius: g.radius * scale
                    };
                    break;

                case 'ARC':
                    newGeometry = {
                        type: 'ARC',
                        center: transformPoint(g.center),
                        radius: g.radius * scale,
                        startAngle: g.startAngle + rotationRad,
                        endAngle: g.endAngle + rotationRad
                    };
                    break;

                case 'RECTANGLE':
                    newGeometry = {
                        type: 'RECTANGLE',
                        center: transformPoint(g.center),
                        width: g.width * scale,
                        height: g.height * scale,
                        rotation: (g.rotation || 0) + rotationRad
                    };
                    break;

                case 'HEXAGON':
                    newGeometry = {
                        type: 'HEXAGON',
                        center: transformPoint(g.center),
                        radius: g.radius * scale,
                        rotation: (g.rotation || 0) + rotationRad
                    };
                    break;

                case 'POLYLINE':
                    newGeometry = {
                        type: 'POLYLINE',
                        vertices: g.vertices.map(v => transformPoint(v)),
                        closed: g.closed
                    };
                    break;

                case 'HATCH':
                    newGeometry = {
                        type: 'HATCH',
                        boundaryVertices: (g as any).boundaryVertices.map((v: Point) => transformPoint(v)),
                        holes: (g as any).holes ? (g as any).holes.map((hole: Point[]) => hole.map((v: Point) => transformPoint(v))) : undefined,
                        strokeBorder: (g as any).strokeBorder,
                        pattern: (g as any).pattern,
                        scale: ((g as any).scale || 1.0) * scale,
                        angle: ((g as any).angle || 45) + (rotationRad * 180 / Math.PI)
                    };
                    break;
            }

            transformedEntities.push({
                ...entity,
                id: crypto.randomUUID ? crypto.randomUUID() : `ent_${Math.random().toString(36).substring(2, 9)}`,
                layerId,
                groupId,
                blockInstanceId,
                isDynamic: true,
                dynamicBlockId: blockDef.id,
                dynamicParams: { ...mergedParams },
                dynamicBasePoint: basePoint,
                dynamicScale: scale,
                dynamicRotationRad: rotationRad,
                isSelected: true
            });
        }

        return transformedEntities;
    }
}
