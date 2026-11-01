import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
    getFlowCatalog,
    FLOW_CATEGORIES,
    getFlowItemsByCategory,
    spawnCatalogItem,
} from '@/flow/catalog/flowCatalog';
import { QuickAddModal } from '@/components/flow/QuickAddModal';
import { listNodes } from '@/flow/nodes/Registry';
import { useFlowStore } from '@/store/flowStore';

function renderClean(element: React.ReactElement): string {
    return renderToString(element).replace(/<!--.*?-->/g, '');
}

describe('Flow Top Ribbon, Unified Catalog & QuickAdd Modal', () => {
    it('provides a unified catalog covering every registered engine node', () => {
        const catalog = getFlowCatalog();
        // Derived from the registry instead of a hand-typed number (AGENTS.md §6.2):
        // every engineering node in the registry must appear exactly once, plus the 7 legacy items.
        const engineering = catalog.filter((i) => i.type === 'engineering');
        expect(engineering.length).toBe(listNodes().length);
        expect(catalog.length).toBe(listNodes().length + 7);
        expect(catalog.length).toBeGreaterThanOrEqual(102);

        // All IDs must be unique
        const idSet = new Set(catalog.map((i) => i.id));
        expect(idSet.size).toBe(catalog.length);
    });

    it('defines 11 distinct engineering categories with valid metadata', () => {
        expect(FLOW_CATEGORIES.length).toBe(11);
        const expectedCategories = [
            'input',
            'mechanical',
            'geometry',
            'physics',
            'chemical',
            'material',
            'utility',
            'validation',
            'visual',
            'export',
            'legacy',
        ];

        for (const catId of expectedCategories) {
            const found = FLOW_CATEGORIES.find((c) => c.id === catId);
            expect(found).toBeDefined();
            expect(found?.labelTr).toBeDefined();
            expect(found?.labelEn).toBeDefined();
            expect(found?.icon).toBeDefined();
            expect(found?.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        }
    });

    it('populates each category with matching items', () => {
        for (const cat of FLOW_CATEGORIES) {
            const items = getFlowItemsByCategory(cat.id);
            expect(items.length).toBeGreaterThan(0);
            for (const item of items) {
                expect(item.category).toBe(cat.id);
                expect(item.title).toBeDefined();
                expect(item.icon).toBeDefined();
            }
        }
    });

    it('correctly includes legacy calculators and visualizers in the catalog', () => {
        const catalog = getFlowCatalog();
        const sheetMetal = catalog.find((i) => i.id === 'legacy-sheet');
        expect(sheetMetal).toBeDefined();
        expect(sheetMetal?.type).toBe('calculator');
        expect(sheetMetal?.category).toBe('legacy');

        const nesting = catalog.find((i) => i.id === 'util-nesting');
        expect(nesting).toBeDefined();
        expect(nesting?.type).toBe('visualizer');
        expect(nesting?.category).toBe('visual');

        const note = catalog.find((i) => i.id === 'util-note');
        expect(note).toBeDefined();
        expect(note?.type).toBe('note');
    });

    it('spawns engineering nodes into the flow store', () => {
        const catalog = getFlowCatalog();
        const spurGearItem = catalog.find((i) => i.id === 'mech-gear-spur')!;
        expect(spurGearItem).toBeDefined();

        const nodeId = spawnCatalogItem(spurGearItem, { x: 500, y: 300 });
        expect(nodeId).toBeDefined();

        const state = useFlowStore.getState();
        const addedNode = state.nodes.find((n) => n.id === nodeId);
        expect(addedNode).toBeDefined();
        expect((addedNode?.data as any).schemaId).toBe('mech-gear-spur');
    });

    it('spawns legacy calculator nodes into the flow store', () => {
        const catalog = getFlowCatalog();
        const beamItem = catalog.find((i) => i.id === 'legacy-beam')!;
        expect(beamItem).toBeDefined();

        const nodeId = spawnCatalogItem(beamItem, { x: 600, y: 400 });
        expect(nodeId).toBeDefined();

        const state = useFlowStore.getState();
        const addedNode = state.nodes.find((n) => n.id === nodeId);
        expect(addedNode).toBeDefined();
        expect(addedNode?.type).toBe('calculator');
    });

    it('spawns visualizer and note nodes into the flow store', () => {
        const catalog = getFlowCatalog();
        const nestingItem = catalog.find((i) => i.id === 'util-nesting')!;
        const noteItem = catalog.find((i) => i.id === 'util-note')!;

        const vizNodeId = spawnCatalogItem(nestingItem, { x: 700, y: 500 });
        expect(vizNodeId).toBeDefined();

        const noteNodeId = spawnCatalogItem(noteItem, { x: 800, y: 600 });
        expect(noteNodeId).toBeDefined();

        const state = useFlowStore.getState();
        expect(state.nodes.some((n) => n.id === vizNodeId)).toBe(true);
        expect(state.nodes.some((n) => n.id === noteNodeId)).toBe(true);
    });

    it('renders QuickAddModal with category tabs and search input when open', () => {
        const html = renderClean(
            React.createElement(QuickAddModal, {
                isOpen: true,
                onClose: () => {},
                spawnPosition: { x: 200, y: 200 },
            })
        );

        // Header and search
        expect(html.includes('Quick Add Node') || html.includes('Hızlı Düğüm Ekle')).toBe(true);
        expect(html).toContain('102');

        // Category pills
        expect(html).toContain('102');
        expect(html.includes('Mechanical') || html.includes('Mekanik')).toBe(true);
        expect(html.includes('Geometry') || html.includes('Geometri')).toBe(true);
        expect(html.includes('Physics') || html.includes('Fizik')).toBe(true);
    });

    it('does not render QuickAddModal when closed', () => {
        const html = renderClean(
            React.createElement(QuickAddModal, {
                isOpen: false,
                onClose: () => {},
                spawnPosition: { x: 200, y: 200 },
            })
        );
        expect(html).toBe('');
    });
});
