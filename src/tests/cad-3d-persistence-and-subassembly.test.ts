import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignStore, type DesignPart } from '@/design-studio/designStore';
import { autoSaveManager } from '@/cad/persistence/autoSaveManager';
import { isValidAluCadProject, AluCadProjectFile } from '@/cad/persistence/types';

describe('3D CAD Persistence & Sub-Assembly Folder Management', () => {
  beforeEach(() => {
    useDesignStore.getState().clearScene();
  });

  it('clearScene resets both parts and subAssemblies to empty arrays', () => {
    useDesignStore.getState().addSubAssembly('Test SubAssy');
    useDesignStore.getState().addPart('box');
    expect(useDesignStore.getState().subAssemblies.length).toBeGreaterThan(0);
    expect(useDesignStore.getState().parts.length).toBeGreaterThan(0);

    useDesignStore.getState().clearScene();
    expect(useDesignStore.getState().subAssemblies).toEqual([]);
    expect(useDesignStore.getState().parts).toEqual([]);
  });

  it('addDynamicBlock3D does not create empty sub-assembly folders for single parts or empty list', () => {
    // Empty list
    const resEmpty = useDesignStore.getState().addDynamicBlock3D([], 'Empty Block');
    expect(resEmpty).toEqual([]);
    expect(useDesignStore.getState().subAssemblies.length).toBe(0);

    // Single part without groupName
    const singlePart = [{ kind: 'cylinder' as const, name: 'Shaft 1' }];
    useDesignStore.getState().addDynamicBlock3D(singlePart);
    expect(useDesignStore.getState().subAssemblies.length).toBe(0);
    expect(useDesignStore.getState().parts.length).toBe(1);

    // Single part with groupName: should not pollute with single-item folder
    useDesignStore.getState().clearScene();
    useDesignStore.getState().addDynamicBlock3D(singlePart, 'Shaft Group');
    expect(useDesignStore.getState().subAssemblies.length).toBe(0);
    expect(useDesignStore.getState().parts.length).toBe(1);
  });

  it('addDynamicBlock3D creates sub-assembly only when multiple parts are provided', () => {
    const multiParts = [
      { kind: 'box' as const, name: 'Part A' },
      { kind: 'cylinder' as const, name: 'Part B' },
    ];
    useDesignStore.getState().addDynamicBlock3D(multiParts, 'Gearbox Assembly');
    expect(useDesignStore.getState().subAssemblies.length).toBe(1);
    expect(useDesignStore.getState().subAssemblies[0].name).toBe('Gearbox Assembly');
    expect(useDesignStore.getState().parts.length).toBe(2);
    expect(useDesignStore.getState().parts[0].subAssemblyId).toBe(useDesignStore.getState().subAssemblies[0].id);
  });

  it('pruneEmptySubAssemblies removes orphaned empty folders', () => {
    const sa1 = useDesignStore.getState().addSubAssembly('Empty Folder 1');
    const sa2 = useDesignStore.getState().addSubAssembly('Empty Folder 2');
    expect(useDesignStore.getState().subAssemblies.length).toBe(2);

    useDesignStore.getState().pruneEmptySubAssemblies();
    expect(useDesignStore.getState().subAssemblies.length).toBe(0);
  });

  it('createProjectSnapshot captures 3D parts and subAssemblies, validating as valid project', () => {
    useDesignStore.getState().setProjectName('Robot_Arm_3D');
    useDesignStore.getState().addDynamicBlock3D([
      { kind: 'box' as const, name: 'Arm 1' },
      { kind: 'cylinder' as const, name: 'Joint 1' },
    ], 'Linkage');

    const snapshot = autoSaveManager.createProjectSnapshot();
    expect(snapshot.metadata.name).toBe('Robot_Arm_3D');
    expect(isValidAluCadProject(snapshot)).toBe(true);
    expect(snapshot.design3d?.parts.length).toBe(2);
    expect(snapshot.design3d?.subAssemblies?.length).toBe(1);
  });

  it('loadProjectIntoCad restores 3D design parts, mates, and subAssemblies', () => {
    const mockProject: AluCadProjectFile = {
      fileType: 'ALUCAD_PROJECT',
      schemaVersion: 1,
      appName: 'AluCAD OS',
      id: 'proj_mock_3d',
      metadata: {
        id: 'proj_mock_3d',
        name: 'Restored_Assembly',
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        units: 'mm',
        entityCount: 0,
        bodyCount: 0,
        partCount: 1,
        appVersion: '5.2.0',
      },
      cad2d: {
        entities: [],
        layers: [],
        bodies: [],
        constraints: [],
        units: 'mm',
        viewport: { center: { x: 0, y: 0 }, zoom: 1 },
      },
      design3d: {
        projectName: 'Restored_Assembly',
        parts: [
          {
            id: 'p-1',
            kind: 'cylinder',
            name: 'Piston',
            color: '#34d399',
            visible: true,
            locked: false,
            parentId: null,
            position: { x: 10, y: 20, z: 30 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            params: { diameter: 50, length: 100 },
          } as DesignPart,
        ],
        mates: [],
        subAssemblies: [
          {
            id: 'sa-1',
            name: 'Hydraulics',
            visible: true,
            locked: false,
            expanded: true,
            parentId: null,
          },
        ],
      },
    };

    autoSaveManager.loadProjectIntoCad(mockProject);
    const state = useDesignStore.getState();
    expect(state.projectName).toBe('Restored_Assembly');
    expect(state.parts.length).toBe(1);
    expect(state.parts[0].name).toBe('Piston');
    expect(state.subAssemblies.length).toBe(1);
    expect(state.subAssemblies[0].name).toBe('Hydraulics');
  });
});
