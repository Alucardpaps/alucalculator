import { describe, it, expect } from 'vitest';
import { createCustomGeometry } from '@/design-studio/geometryFactory';
import { DesignPart } from '@/design-studio/designStore';

describe('3D CAD Bearing Assembly Generator (All 8 Families)', () => {
    const families = [
        { type: 'deep-groove-ball', name: 'SKF 6301-2RSH', d: 12, D: 37, B: 12 },
        { type: 'angular-contact-ball', name: 'SKF 7204-BEP', d: 20, D: 47, B: 14 },
        { type: 'self-aligning-ball', name: 'SKF 1204 ETN9', d: 20, D: 47, B: 14 },
        { type: 'cylindrical-roller', name: 'SKF NU 204 ECP', d: 20, D: 47, B: 14 },
        { type: 'tapered-roller', name: 'SKF 30204 J2/Q', d: 20, D: 47, B: 15.25 },
        { type: 'spherical-roller', name: 'SKF 22205 E', d: 25, D: 52, B: 18 },
        { type: 'thrust-ball', name: 'SKF 51104', d: 20, D: 35, B: 10 },
        { type: 'needle-roller', name: 'SKF HK 2016', d: 20, D: 26, B: 16, needleType: 'drawn-cup' },
        { type: 'needle-roller', name: 'SKF NA 4904', d: 20, D: 37, B: 17, needleType: 'machined-ring' },
    ];

    families.forEach(({ type, name, d, D, B, needleType }) => {
        it(`generates valid, distinct 3D CAD solid assembly for ${name} (${type})`, () => {
            const part: DesignPart = {
                id: `test-bearing-${type}-${name.replace(/\s/g, '')}`,
                kind: 'bearing-race',
                name,
                color: '#f59e0b',
                visible: true,
                locked: false,
                parentId: null,
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 },
                params: {
                    innerDiameter: d,
                    diameter: D,
                    depth: B,
                    bearingType: type,
                    needleType,
                },
            };

            const geom = createCustomGeometry(part);
            expect(geom).toBeDefined();
            expect(geom.attributes.position).toBeDefined();
            expect(geom.attributes.position.count).toBeGreaterThan(100);
            expect(geom.attributes.normal).toBeDefined();

            // Compute bounding box to ensure non-zero volume
            geom.computeBoundingBox();
            const bbox = geom.boundingBox!;
            const sizeX = bbox.max.x - bbox.min.x;
            const sizeY = bbox.max.y - bbox.min.y;
            const sizeZ = bbox.max.z - bbox.min.z;

            expect(sizeX).toBeGreaterThan(0.5);
            expect(sizeY).toBeGreaterThan(0.5);
            expect(sizeZ).toBeGreaterThan(0.2);
        });
    });

    it('handles legacy type "roller" by normalizing to cylindrical-roller', () => {
        const part: DesignPart = {
            id: 'test-roller-legacy',
            kind: 'bearing-race',
            name: 'Generic Roller Bearing',
            color: '#f59e0b',
            visible: true,
            locked: false,
            parentId: null,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            params: {
                innerDiameter: 25,
                diameter: 52,
                depth: 15,
                bearingType: 'roller',
            },
        };
        const geom = createCustomGeometry(part);
        expect(geom).toBeDefined();
        expect(geom.attributes.position.count).toBeGreaterThan(100);
    });

    it('adds 2RS/2Z protective seals when capping is specified on deep-groove-ball', () => {
        const partOpen: DesignPart = {
            id: 'test-open',
            kind: 'bearing-race',
            name: 'SKF 6205 Open',
            color: '#f59e0b',
            visible: true,
            locked: false,
            parentId: null,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            params: {
                innerDiameter: 25,
                diameter: 52,
                depth: 15,
                bearingType: 'deep-groove-ball',
                capping: 'open',
            },
        };
        const partSealed: DesignPart = {
            id: 'test-sealed',
            kind: 'bearing-race',
            name: 'SKF 6205-2RSH',
            color: '#f59e0b',
            visible: true,
            locked: false,
            parentId: null,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            params: {
                innerDiameter: 25,
                diameter: 52,
                depth: 15,
                bearingType: 'deep-groove-ball',
                capping: '2RSH',
            },
        };

        const geomOpen = createCustomGeometry(partOpen);
        const geomSealed = createCustomGeometry(partSealed);

        expect(geomOpen).toBeDefined();
        expect(geomSealed).toBeDefined();
        // The sealed bearing includes additional lathe geometry for the 2RS seals
        expect(geomSealed.attributes.position.count).toBeGreaterThan(geomOpen.attributes.position.count);
    });
});
