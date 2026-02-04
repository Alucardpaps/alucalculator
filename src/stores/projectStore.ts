/**
 * Project State Management with Variable Linking
 * 
 * This store manages:
 * - Multiple module instances within a project
 * - Reactive variable linking between modules (output → input)
 * - LocalStorage persistence for project data
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// Core Types
// ============================================================================

/** Unique identifier for module instances */
export type ModuleInstanceId = string;

/** Variable identifier within a module (e.g., "tangentialForce", "outputTorque") */
export type VariableId = string;

/** Supported module types in the workstation */
export type ModuleType =
    | 'aluminum-profile'
    | 'gear-calculator'
    | 'fit-calculator'
    | 'bearing-life'
    | 'welding-heat'
    | 'sheet-metal'
    | 'pump-calculator'
    | 'fastener-thread'
    | 'strength-mohr'
    | 'unit-converter';

/** A single variable (input or output) within a module */
export interface ModuleVariable {
    id: VariableId;
    name: string;           // Display name (localized key)
    value: number | null;
    unit: string;
    type: 'input' | 'output';
    linkedFrom?: VariableLink;  // For inputs: which output it's linked to
}

/** Link from one module's output to another's input */
export interface VariableLink {
    sourceModuleId: ModuleInstanceId;
    sourceVariableId: VariableId;
}

/** A single module instance in the project */
export interface ModuleInstance {
    id: ModuleInstanceId;
    type: ModuleType;
    name: string;           // User-editable name (e.g., "Pinion Gear")
    createdAt: number;
    inputs: Record<VariableId, ModuleVariable>;
    outputs: Record<VariableId, ModuleVariable>;
    /** Module-specific configuration/settings */
    config: Record<string, any>;
}

/** The complete project state */
export interface Project {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    modules: Record<ModuleInstanceId, ModuleInstance>;
    /** Ordered list of module IDs for UI display */
    moduleOrder: ModuleInstanceId[];
}

// ============================================================================
// Store State & Actions
// ============================================================================

interface ProjectState {
    // Current project
    currentProject: Project | null;

    // All saved projects (for project manager)
    savedProjects: Record<string, Project>;

    // Actions
    createProject: (name: string) => void;
    loadProject: (projectId: string) => void;
    saveCurrentProject: () => void;
    deleteProject: (projectId: string) => void;
    renameProject: (name: string) => void;

    // Module actions
    addModule: (type: ModuleType, name?: string) => ModuleInstanceId;
    removeModule: (moduleId: ModuleInstanceId) => void;
    renameModule: (moduleId: ModuleInstanceId, name: string) => void;
    reorderModules: (newOrder: ModuleInstanceId[]) => void;

    // Variable actions
    setInputValue: (moduleId: ModuleInstanceId, variableId: VariableId, value: number | null) => void;
    setOutputValue: (moduleId: ModuleInstanceId, variableId: VariableId, value: number | null) => void;

    // Linking actions
    linkVariable: (
        targetModuleId: ModuleInstanceId,
        targetVariableId: VariableId,
        sourceModuleId: ModuleInstanceId,
        sourceVariableId: VariableId
    ) => void;
    unlinkVariable: (moduleId: ModuleInstanceId, variableId: VariableId) => void;

    // Propagation
    propagateChanges: (sourceModuleId: ModuleInstanceId, sourceVariableId: VariableId) => void;
}

// ============================================================================
// Module Templates (Default inputs/outputs for each module type)
// ============================================================================

const MODULE_TEMPLATES: Record<ModuleType, { inputs: ModuleVariable[], outputs: ModuleVariable[] }> = {
    'gear-calculator': {
        inputs: [
            { id: 'module', name: 'gear.inputs.module', value: 2, unit: 'mm', type: 'input' },
            { id: 'pinionTeeth', name: 'gear.inputs.pinionTeeth', value: 20, unit: '', type: 'input' },
            { id: 'gearTeeth', name: 'gear.inputs.gearTeeth', value: 40, unit: '', type: 'input' },
            { id: 'faceWidth', name: 'gear.inputs.faceWidth', value: 20, unit: 'mm', type: 'input' },
            { id: 'power', name: 'gear.inputs.power', value: 5, unit: 'kW', type: 'input' },
            { id: 'rpm', name: 'gear.inputs.rpm', value: 1500, unit: 'rpm', type: 'input' },
        ],
        outputs: [
            { id: 'pitchDiameter1', name: 'gear.results.pitchDiameter', value: null, unit: 'mm', type: 'output' },
            { id: 'pitchDiameter2', name: 'gear.results.pitchDiameter', value: null, unit: 'mm', type: 'output' },
            { id: 'centerDistance', name: 'common.centerDist', value: null, unit: 'mm', type: 'output' },
            { id: 'transmissionRatio', name: 'gear.results.transmissionRatio', value: null, unit: '', type: 'output' },
            { id: 'torque', name: 'gear.results.calculatedTorque', value: null, unit: 'Nm', type: 'output' },
            { id: 'tangentialForce', name: 'safety.tangentialForce', value: null, unit: 'N', type: 'output' },
            { id: 'radialForce', name: 'safety.radialForce', value: null, unit: 'N', type: 'output' },
        ],
    },
    'bearing-life': {
        inputs: [
            { id: 'radialLoad', name: 'bearing.inputs.radialLoad', value: 5000, unit: 'N', type: 'input' },
            { id: 'axialLoad', name: 'bearing.inputs.axialLoad', value: 1000, unit: 'N', type: 'input' },
            { id: 'rpm', name: 'bearing.inputs.rpm', value: 1500, unit: 'rpm', type: 'input' },
        ],
        outputs: [
            { id: 'lifeHours', name: 'bearing.results.lifeHours', value: null, unit: 'h', type: 'output' },
            { id: 'equivalentLoad', name: 'bearing.results.equivalentLoad', value: null, unit: 'N', type: 'output' },
        ],
    },
    'aluminum-profile': {
        inputs: [
            { id: 'width', name: 'dimensions.width', value: 50, unit: 'mm', type: 'input' },
            { id: 'height', name: 'dimensions.height', value: 50, unit: 'mm', type: 'input' },
            { id: 'thickness', name: 'dimensions.thickness', value: 3, unit: 'mm', type: 'input' },
            { id: 'length', name: 'dimensions.length', value: 1000, unit: 'mm', type: 'input' },
        ],
        outputs: [
            { id: 'weight', name: 'common.totalWeight', value: null, unit: 'kg', type: 'output' },
            { id: 'surfaceArea', name: 'aluminum.engineering.surfaceArea', value: null, unit: 'm²', type: 'output' },
            { id: 'momentOfInertia', name: 'aluminum.engineering.inertia', value: null, unit: 'mm⁴', type: 'output' },
        ],
    },
    'fit-calculator': {
        inputs: [
            { id: 'nominalSize', name: 'fit.inputs.nominalSize', value: 50, unit: 'mm', type: 'input' },
            { id: 'fitLength', name: 'fit.inputs.fitLength', value: 30, unit: 'mm', type: 'input' },
        ],
        outputs: [
            { id: 'clearanceMin', name: 'fit.results.clearance', value: null, unit: 'μm', type: 'output' },
            { id: 'clearanceMax', name: 'fit.results.clearance', value: null, unit: 'μm', type: 'output' },
            { id: 'mountingForce', name: 'common.force', value: null, unit: 'kN', type: 'output' },
            { id: 'transmittableTorque', name: 'common.torque', value: null, unit: 'Nm', type: 'output' },
        ],
    },
    'welding-heat': {
        inputs: [
            { id: 'current', name: 'welding.inputs.current', value: 200, unit: 'A', type: 'input' },
            { id: 'voltage', name: 'welding.inputs.voltage', value: 25, unit: 'V', type: 'input' },
            { id: 'speed', name: 'welding.inputs.speed', value: 5, unit: 'mm/s', type: 'input' },
        ],
        outputs: [
            { id: 'heatInput', name: 'welding.results.heatInput', value: null, unit: 'kJ/mm', type: 'output' },
        ],
    },
    'sheet-metal': {
        inputs: [
            { id: 'thickness', name: 'sheetMetal.inputs.thickness', value: 2, unit: 'mm', type: 'input' },
            { id: 'length', name: 'sheetMetal.inputs.length', value: 1000, unit: 'mm', type: 'input' },
            { id: 'angle', name: 'sheetMetal.inputs.angle', value: 90, unit: '°', type: 'input' },
        ],
        outputs: [
            { id: 'bendForce', name: 'sheetMetal.results.force', value: null, unit: 'kN', type: 'output' },
            { id: 'flatLength', name: 'sheetMetal.results.flatLength', value: null, unit: 'mm', type: 'output' },
        ],
    },
    'pump-calculator': {
        inputs: [
            { id: 'flow', name: 'pump.inputs.flow', value: 100, unit: 'm³/h', type: 'input' },
            { id: 'head', name: 'pump.inputs.head', value: 30, unit: 'm', type: 'input' },
            { id: 'efficiency', name: 'pump.inputs.eff', value: 0.75, unit: '', type: 'input' },
        ],
        outputs: [
            { id: 'hydraulicPower', name: 'pump.results.hydPower', value: null, unit: 'kW', type: 'output' },
            { id: 'shaftPower', name: 'pump.results.shaftPower', value: null, unit: 'kW', type: 'output' },
        ],
    },
    'fastener-thread': {
        inputs: [
            { id: 'size', name: 'fastener.inputs.size', value: 10, unit: 'mm', type: 'input' },
            { id: 'pitch', name: 'fastener.inputs.pitch', value: 1.5, unit: 'mm', type: 'input' },
        ],
        outputs: [
            { id: 'tapDrill', name: 'fastener.results.tapDrill', value: null, unit: 'mm', type: 'output' },
            { id: 'minorDia', name: 'fastener.results.minorDia', value: null, unit: 'mm', type: 'output' },
            { id: 'tensileArea', name: 'fastener.results.tensileArea', value: null, unit: 'mm²', type: 'output' },
        ],
    },
    'strength-mohr': {
        inputs: [
            { id: 'sigmaX', name: 'strength.inputs.sigmaX', value: 100, unit: 'MPa', type: 'input' },
            { id: 'sigmaY', name: 'strength.inputs.sigmaY', value: 50, unit: 'MPa', type: 'input' },
            { id: 'tauXY', name: 'strength.inputs.tauXY', value: 30, unit: 'MPa', type: 'input' },
        ],
        outputs: [
            { id: 'sigma1', name: 'strength.results.principalStresses', value: null, unit: 'MPa', type: 'output' },
            { id: 'sigma2', name: 'strength.results.principalStresses', value: null, unit: 'MPa', type: 'output' },
            { id: 'tauMax', name: 'strength.results.maxShear', value: null, unit: 'MPa', type: 'output' },
            { id: 'vonMises', name: 'strength.results.vonMises', value: null, unit: 'MPa', type: 'output' },
        ],
    },
    'unit-converter': {
        inputs: [
            { id: 'inputValue', name: 'common.from', value: 1, unit: '', type: 'input' },
        ],
        outputs: [
            { id: 'outputValue', name: 'common.to', value: null, unit: '', type: 'output' },
        ],
    },
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createModuleInstance(type: ModuleType, name?: string): ModuleInstance {
    const template = MODULE_TEMPLATES[type];
    const inputs: Record<VariableId, ModuleVariable> = {};
    const outputs: Record<VariableId, ModuleVariable> = {};

    template.inputs.forEach(v => {
        inputs[v.id] = { ...v };
    });
    template.outputs.forEach(v => {
        outputs[v.id] = { ...v };
    });

    return {
        id: generateId(),
        type,
        name: name || type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        createdAt: Date.now(),
        inputs,
        outputs,
        config: {},
    };
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            currentProject: null,
            savedProjects: {},

            createProject: (name: string) => {
                const project: Project = {
                    id: generateId(),
                    name,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    modules: {},
                    moduleOrder: [],
                };
                set({ currentProject: project });
            },

            loadProject: (projectId: string) => {
                const { savedProjects } = get();
                const project = savedProjects[projectId];
                if (project) {
                    set({ currentProject: { ...project } });
                }
            },

            saveCurrentProject: () => {
                const { currentProject, savedProjects } = get();
                if (currentProject) {
                    const updated = { ...currentProject, updatedAt: Date.now() };
                    set({
                        currentProject: updated,
                        savedProjects: { ...savedProjects, [updated.id]: updated },
                    });
                }
            },

            deleteProject: (projectId: string) => {
                const { savedProjects, currentProject } = get();
                const { [projectId]: _, ...rest } = savedProjects;
                set({
                    savedProjects: rest,
                    currentProject: currentProject?.id === projectId ? null : currentProject,
                });
            },

            renameProject: (name: string) => {
                const { currentProject } = get();
                if (currentProject) {
                    set({ currentProject: { ...currentProject, name, updatedAt: Date.now() } });
                }
            },

            addModule: (type: ModuleType, name?: string) => {
                const { currentProject } = get();
                if (!currentProject) return '';

                const module = createModuleInstance(type, name);
                set({
                    currentProject: {
                        ...currentProject,
                        modules: { ...currentProject.modules, [module.id]: module },
                        moduleOrder: [...currentProject.moduleOrder, module.id],
                        updatedAt: Date.now(),
                    },
                });
                return module.id;
            },

            removeModule: (moduleId: ModuleInstanceId) => {
                const { currentProject } = get();
                if (!currentProject) return;

                const { [moduleId]: _, ...remainingModules } = currentProject.modules;

                // Remove any links pointing to this module
                Object.values(remainingModules).forEach(mod => {
                    Object.values(mod.inputs).forEach(input => {
                        if (input.linkedFrom?.sourceModuleId === moduleId) {
                            delete input.linkedFrom;
                        }
                    });
                });

                set({
                    currentProject: {
                        ...currentProject,
                        modules: remainingModules,
                        moduleOrder: currentProject.moduleOrder.filter(id => id !== moduleId),
                        updatedAt: Date.now(),
                    },
                });
            },

            renameModule: (moduleId: ModuleInstanceId, name: string) => {
                const { currentProject } = get();
                if (!currentProject || !currentProject.modules[moduleId]) return;

                set({
                    currentProject: {
                        ...currentProject,
                        modules: {
                            ...currentProject.modules,
                            [moduleId]: { ...currentProject.modules[moduleId], name },
                        },
                        updatedAt: Date.now(),
                    },
                });
            },

            reorderModules: (newOrder: ModuleInstanceId[]) => {
                const { currentProject } = get();
                if (!currentProject) return;

                set({
                    currentProject: {
                        ...currentProject,
                        moduleOrder: newOrder,
                        updatedAt: Date.now(),
                    },
                });
            },

            setInputValue: (moduleId, variableId, value) => {
                const { currentProject } = get();
                if (!currentProject || !currentProject.modules[moduleId]) return;

                const module = currentProject.modules[moduleId];
                if (!module.inputs[variableId]) return;

                set({
                    currentProject: {
                        ...currentProject,
                        modules: {
                            ...currentProject.modules,
                            [moduleId]: {
                                ...module,
                                inputs: {
                                    ...module.inputs,
                                    [variableId]: { ...module.inputs[variableId], value },
                                },
                            },
                        },
                        updatedAt: Date.now(),
                    },
                });
            },

            setOutputValue: (moduleId, variableId, value) => {
                const { currentProject, propagateChanges } = get();
                if (!currentProject || !currentProject.modules[moduleId]) return;

                const module = currentProject.modules[moduleId];
                if (!module.outputs[variableId]) return;

                set({
                    currentProject: {
                        ...currentProject,
                        modules: {
                            ...currentProject.modules,
                            [moduleId]: {
                                ...module,
                                outputs: {
                                    ...module.outputs,
                                    [variableId]: { ...module.outputs[variableId], value },
                                },
                            },
                        },
                        updatedAt: Date.now(),
                    },
                });

                // Propagate to linked inputs
                propagateChanges(moduleId, variableId);
            },

            linkVariable: (targetModuleId, targetVariableId, sourceModuleId, sourceVariableId) => {
                const { currentProject } = get();
                if (!currentProject) return;

                const targetModule = currentProject.modules[targetModuleId];
                const sourceModule = currentProject.modules[sourceModuleId];
                if (!targetModule || !sourceModule) return;
                if (!targetModule.inputs[targetVariableId]) return;
                if (!sourceModule.outputs[sourceVariableId]) return;

                // Create the link
                const link: VariableLink = { sourceModuleId, sourceVariableId };
                const sourceValue = sourceModule.outputs[sourceVariableId].value;

                set({
                    currentProject: {
                        ...currentProject,
                        modules: {
                            ...currentProject.modules,
                            [targetModuleId]: {
                                ...targetModule,
                                inputs: {
                                    ...targetModule.inputs,
                                    [targetVariableId]: {
                                        ...targetModule.inputs[targetVariableId],
                                        linkedFrom: link,
                                        value: sourceValue, // Sync value immediately
                                    },
                                },
                            },
                        },
                        updatedAt: Date.now(),
                    },
                });
            },

            unlinkVariable: (moduleId, variableId) => {
                const { currentProject } = get();
                if (!currentProject || !currentProject.modules[moduleId]) return;

                const module = currentProject.modules[moduleId];
                if (!module.inputs[variableId]) return;

                const { linkedFrom: _, ...inputWithoutLink } = module.inputs[variableId];

                set({
                    currentProject: {
                        ...currentProject,
                        modules: {
                            ...currentProject.modules,
                            [moduleId]: {
                                ...module,
                                inputs: {
                                    ...module.inputs,
                                    [variableId]: inputWithoutLink as ModuleVariable,
                                },
                            },
                        },
                        updatedAt: Date.now(),
                    },
                });
            },

            propagateChanges: (sourceModuleId, sourceVariableId) => {
                const { currentProject, setInputValue } = get();
                if (!currentProject) return;

                const sourceModule = currentProject.modules[sourceModuleId];
                if (!sourceModule) return;

                const sourceValue = sourceModule.outputs[sourceVariableId]?.value;
                if (sourceValue === undefined) return;

                // Find all inputs linked to this output and update them
                Object.values(currentProject.modules).forEach(mod => {
                    Object.entries(mod.inputs).forEach(([inputId, input]) => {
                        if (
                            input.linkedFrom?.sourceModuleId === sourceModuleId &&
                            input.linkedFrom?.sourceVariableId === sourceVariableId
                        ) {
                            setInputValue(mod.id, inputId, sourceValue);
                        }
                    });
                });
            },
        }),
        {
            name: 'engineering-workstation-projects',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                savedProjects: state.savedProjects,
            }),
        }
    )
);

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const selectCurrentProject = (state: ProjectState) => state.currentProject;
export const selectModules = (state: ProjectState) => state.currentProject?.modules ?? {};
export const selectModuleOrder = (state: ProjectState) => state.currentProject?.moduleOrder ?? [];
export const selectSavedProjects = (state: ProjectState) => state.savedProjects;

export const selectModuleById = (moduleId: ModuleInstanceId) =>
    (state: ProjectState) => state.currentProject?.modules[moduleId];

export const selectLinkedInputs = (moduleId: ModuleInstanceId) =>
    (state: ProjectState) => {
        const module = state.currentProject?.modules[moduleId];
        if (!module) return [];
        return Object.values(module.inputs).filter(input => input.linkedFrom);
    };
