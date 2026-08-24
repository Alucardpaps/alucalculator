import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignStore } from '@/design-studio/designStore';
import { useCadStore } from '@/cad/store/cadStore';
import { createPointEntity } from '@/cad/kernel/types';

describe('3D Design Studio Undo/Redo Engine', () => {
    beforeEach(() => {
        useDesignStore.setState({
            parts: [],
            selectedId: null,
            historyPast: [],
            historyFuture: []
        });
    });

    it('records history when a part is added and reverts on undo', () => {
        const id1 = useDesignStore.getState().addPart('box');
        expect(useDesignStore.getState().parts.length).toBe(1);
        expect(useDesignStore.getState().parts[0].id).toBe(id1);

        const id2 = useDesignStore.getState().addPart('cylinder');
        expect(useDesignStore.getState().parts.length).toBe(2);

        // Undo adding cylinder
        useDesignStore.getState().undo();
        expect(useDesignStore.getState().parts.length).toBe(1);
        expect(useDesignStore.getState().parts[0].id).toBe(id1);

        // Redo adding cylinder
        useDesignStore.getState().redo();
        expect(useDesignStore.getState().parts.length).toBe(2);
        expect(useDesignStore.getState().parts[1].id).toBe(id2);
    });

    it('records history on delete and recovers parts on undo', () => {
        const id = useDesignStore.getState().addPart('plate');
        useDesignStore.getState().select(id);
        expect(useDesignStore.getState().parts.length).toBe(1);

        useDesignStore.getState().deleteSelected();
        expect(useDesignStore.getState().parts.length).toBe(0);

        useDesignStore.getState().undo();
        expect(useDesignStore.getState().parts.length).toBe(1);
        expect(useDesignStore.getState().parts[0].id).toBe(id);
    });
});

describe('CAD Store Selection & Deletion', () => {
    beforeEach(() => {
        useCadStore.setState({
            entities: [],
            selectedIds: []
        });
    });

    it('deletes selected entities properly', () => {
        const e1 = createPointEntity({ x: 10, y: 20 }, '0');
        const e2 = createPointEntity({ x: 30, y: 40 }, '0');

        useCadStore.getState().addEntity(e1);
        useCadStore.getState().addEntity(e2);
        expect(useCadStore.getState().entities.length).toBe(2);

        useCadStore.getState().selectEntity(e1.id);
        expect(useCadStore.getState().selectedIds).toEqual([e1.id]);

        useCadStore.getState().deleteSelected();
        expect(useCadStore.getState().entities.length).toBe(1);
        expect(useCadStore.getState().entities[0].id).toBe(e2.id);
        expect(useCadStore.getState().selectedIds.length).toBe(0);
    });
});
