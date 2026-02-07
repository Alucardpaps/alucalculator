/**
 * CAD Canvas Store - Zustand state management for CAD drawing features
 * Handles shapes, dimensions, annotations, snap settings, and tools
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateDXF } from '@/lib/DXFGenerator';

// ============================================
// Types
// ============================================

export type Unit = 'mm' | 'cm' | 'inch' | 'm';
export type CADTool =
    | 'select'
    | 'line'
    | 'rectangle'
    | 'circle'
    | 'arc'
    | 'dimension-linear'
    | 'dimension-angular'
    | 'dimension-radius'
    | 'text'
    | 'leader'
    | 'pan'
    // OS 2.0 Tools
    | 'trim'
    | 'extend'
    | 'fillet'
    | 'chamfer'
    | 'smart-dimension';

export type SnapMode = 'grid' | 'endpoint' | 'midpoint' | 'intersection' | 'perpendicular';

export interface Point {
    x: number;
    y: number;
}

export interface CADShape {
    id: string;
    type: 'line' | 'rectangle' | 'circle' | 'arc' | 'polyline';
    points: Point[];
    style: ShapeStyle;
    locked: boolean;
    visible: boolean;
    layer: string;
}

export interface ShapeStyle {
    strokeColor: string;
    strokeWidth: number;
    strokeDasharray?: string;
    fillColor?: string;
    fillOpacity?: number;
}

export interface Dimension {
    id: string;
    type: 'linear' | 'angular' | 'radius' | 'diameter';
    startPoint: Point;
    endPoint: Point;
    offsetDistance: number; // Distance from the measured line
    value: number; // Calculated dimension value
    displayValue: string; // Formatted string (e.g., "150.00 mm")
    tolerance?: string; // e.g., "±0.05"
    textPosition: 'center' | 'above' | 'below';
    style: DimensionStyle;
}

export interface DimensionStyle {
    textColor: string;
    textSize: number;
    lineColor: string;
    arrowSize: number;
    extensionLineGap: number;
    extensionLineOvershoot: number;
}

export interface Annotation {
    id: string;
    type: 'text' | 'leader' | 'symbol' | 'note';
    position: Point;
    content: string;
    rotation: number;
    style: AnnotationStyle;
}

export interface AnnotationStyle {
    fontFamily: string;
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    color: string;
    backgroundColor?: string;
    padding?: number;
}

export interface SnapSettings {
    enabled: boolean;
    modes: SnapMode[];
    gridSize: number; // In current units
    snapRadius: number; // Pixel radius for snap detection
}

export interface CADViewport {
    zoom: number;
    panX: number;
    panY: number;
}

// ============================================
// Default Styles
// ============================================

const DEFAULT_SHAPE_STYLE: ShapeStyle = {
    strokeColor: '#00e5ff',
    strokeWidth: 2,
    strokeDasharray: undefined,
    fillColor: undefined,
    fillOpacity: 0,
};

const DEFAULT_DIMENSION_STYLE: DimensionStyle = {
    textColor: '#ffffff',
    textSize: 12,
    lineColor: '#00e5ff',
    arrowSize: 8,
    extensionLineGap: 2,
    extensionLineOvershoot: 2,
};

const DEFAULT_ANNOTATION_STYLE: AnnotationStyle = {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'normal',
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
};

// ============================================
// Store Interface
// ============================================

interface CADCanvasState {
    // Drawing Objects
    shapes: CADShape[];
    dimensions: Dimension[];
    annotations: Annotation[];

    // Tool State
    currentTool: CADTool;
    isDrawing: boolean;
    tempPoints: Point[]; // Points being drawn

    // Settings
    unit: Unit;
    precision: number; // Decimal places
    snapSettings: SnapSettings;
    showRulers: boolean;
    showGrid: boolean;
    gridSize: number; // Base grid size in mm

    // Viewport
    viewport: CADViewport;

    // Selection
    selectedIds: string[];

    // Default Styles
    currentShapeStyle: ShapeStyle;
    currentDimensionStyle: DimensionStyle;
    currentAnnotationStyle: AnnotationStyle;
}

interface CADCanvasActions {
    // Tool Actions
    setCurrentTool: (tool: CADTool) => void;
    setIsDrawing: (drawing: boolean) => void;
    addTempPoint: (point: Point) => void;
    clearTempPoints: () => void;

    // Shape Actions
    addShape: (shape: Omit<CADShape, 'id'>) => string;
    updateShape: (id: string, updates: Partial<CADShape>) => void;
    deleteShape: (id: string) => void;

    // Dimension Actions
    addDimension: (dimension: Omit<Dimension, 'id'>) => string;
    updateDimension: (id: string, updates: Partial<Dimension>) => void;
    deleteDimension: (id: string) => void;

    // Annotation Actions
    addAnnotation: (annotation: Omit<Annotation, 'id'>) => string;
    updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
    deleteAnnotation: (id: string) => void;

    // Settings Actions
    setUnit: (unit: Unit) => void;
    setPrecision: (precision: number) => void;
    setSnapSettings: (settings: Partial<SnapSettings>) => void;
    toggleSnap: () => void;
    toggleSnapMode: (mode: SnapMode) => void;
    setGridSize: (size: number) => void;
    toggleRulers: () => void;
    toggleGrid: () => void;

    // Viewport Actions
    setViewport: (viewport: Partial<CADViewport>) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetView: () => void;

    // Selection Actions
    selectShape: (id: string, addToSelection?: boolean) => void;
    deselectAll: () => void;
    deleteSelected: () => void;

    // Style Actions
    setCurrentShapeStyle: (style: Partial<ShapeStyle>) => void;
    setCurrentDimensionStyle: (style: Partial<DimensionStyle>) => void;
    setCurrentAnnotationStyle: (style: Partial<AnnotationStyle>) => void;

    // Utility
    clearCanvas: () => void;
    exportToJSON: () => string;
    importFromJSON: (json: string) => void;
    exportToDXF: () => string;
}

// ============================================
// Helper Functions
// ============================================

const generateId = () => `cad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const calculateDistance = (p1: Point, p2: Point): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const formatDimension = (value: number, unit: Unit, precision: number): string => {
    return `${value.toFixed(precision)} ${unit}`;
};

// ============================================
// Store Implementation
// ============================================

export const useCADCanvasStore = create<CADCanvasState & CADCanvasActions>()(
    persist(
        (set, get) => ({
            // Initial State
            shapes: [],
            dimensions: [],
            annotations: [],

            currentTool: 'select',
            isDrawing: false,
            tempPoints: [],

            unit: 'mm',
            precision: 2,
            snapSettings: {
                enabled: true,
                modes: ['grid', 'endpoint'],
                gridSize: 10,
                snapRadius: 10,
            },
            showRulers: true,
            showGrid: true,
            gridSize: 10,

            viewport: {
                zoom: 1,
                panX: 0,
                panY: 0,
            },

            selectedIds: [],

            currentShapeStyle: DEFAULT_SHAPE_STYLE,
            currentDimensionStyle: DEFAULT_DIMENSION_STYLE,
            currentAnnotationStyle: DEFAULT_ANNOTATION_STYLE,

            // Tool Actions
            setCurrentTool: (tool) => set({ currentTool: tool, isDrawing: false, tempPoints: [] }),
            setIsDrawing: (drawing) => set({ isDrawing: drawing }),
            addTempPoint: (point) => set(state => ({ tempPoints: [...state.tempPoints, point] })),
            clearTempPoints: () => set({ tempPoints: [], isDrawing: false }),

            // Shape Actions
            addShape: (shape) => {
                const id = generateId();
                set(state => ({
                    shapes: [...state.shapes, { ...shape, id }]
                }));
                return id;
            },

            updateShape: (id, updates) => {
                set(state => ({
                    shapes: state.shapes.map(s => s.id === id ? { ...s, ...updates } : s)
                }));
            },

            deleteShape: (id) => {
                set(state => ({
                    shapes: state.shapes.filter(s => s.id !== id),
                    selectedIds: state.selectedIds.filter(sid => sid !== id)
                }));
            },

            // Dimension Actions
            addDimension: (dimension) => {
                const id = generateId();
                set(state => ({
                    dimensions: [...state.dimensions, { ...dimension, id }]
                }));
                return id;
            },

            updateDimension: (id, updates) => {
                set(state => ({
                    dimensions: state.dimensions.map(d => d.id === id ? { ...d, ...updates } : d)
                }));
            },

            deleteDimension: (id) => {
                set(state => ({
                    dimensions: state.dimensions.filter(d => d.id !== id)
                }));
            },

            // Annotation Actions
            addAnnotation: (annotation) => {
                const id = generateId();
                set(state => ({
                    annotations: [...state.annotations, { ...annotation, id }]
                }));
                return id;
            },

            updateAnnotation: (id, updates) => {
                set(state => ({
                    annotations: state.annotations.map(a => a.id === id ? { ...a, ...updates } : a)
                }));
            },

            deleteAnnotation: (id) => {
                set(state => ({
                    annotations: state.annotations.filter(a => a.id !== id)
                }));
            },

            // Settings Actions
            setUnit: (unit) => set({ unit }),
            setPrecision: (precision) => set({ precision }),

            setSnapSettings: (settings) => {
                set(state => ({
                    snapSettings: { ...state.snapSettings, ...settings }
                }));
            },

            toggleSnap: () => {
                set(state => ({
                    snapSettings: { ...state.snapSettings, enabled: !state.snapSettings.enabled }
                }));
            },

            toggleSnapMode: (mode) => {
                set(state => {
                    const modes = state.snapSettings.modes.includes(mode)
                        ? state.snapSettings.modes.filter(m => m !== mode)
                        : [...state.snapSettings.modes, mode];
                    return { snapSettings: { ...state.snapSettings, modes } };
                });
            },

            setGridSize: (size) => set({ gridSize: size }),
            toggleRulers: () => set(state => ({ showRulers: !state.showRulers })),
            toggleGrid: () => set(state => ({ showGrid: !state.showGrid })),

            // Viewport Actions
            setViewport: (viewport) => {
                set(state => ({
                    viewport: { ...state.viewport, ...viewport }
                }));
            },

            zoomIn: () => {
                set(state => ({
                    viewport: { ...state.viewport, zoom: Math.min(state.viewport.zoom * 1.2, 10) }
                }));
            },

            zoomOut: () => {
                set(state => ({
                    viewport: { ...state.viewport, zoom: Math.max(state.viewport.zoom / 1.2, 0.1) }
                }));
            },

            resetView: () => {
                set({ viewport: { zoom: 1, panX: 0, panY: 0 } });
            },

            // Selection Actions
            selectShape: (id, addToSelection = false) => {
                set(state => ({
                    selectedIds: addToSelection
                        ? [...state.selectedIds, id]
                        : [id]
                }));
            },

            deselectAll: () => set({ selectedIds: [] }),

            deleteSelected: () => {
                const { selectedIds, shapes, dimensions, annotations } = get();
                set({
                    shapes: shapes.filter(s => !selectedIds.includes(s.id)),
                    dimensions: dimensions.filter(d => !selectedIds.includes(d.id)),
                    annotations: annotations.filter(a => !selectedIds.includes(a.id)),
                    selectedIds: []
                });
            },

            // Style Actions
            setCurrentShapeStyle: (style) => {
                set(state => ({
                    currentShapeStyle: { ...state.currentShapeStyle, ...style }
                }));
            },

            setCurrentDimensionStyle: (style) => {
                set(state => ({
                    currentDimensionStyle: { ...state.currentDimensionStyle, ...style }
                }));
            },

            setCurrentAnnotationStyle: (style) => {
                set(state => ({
                    currentAnnotationStyle: { ...state.currentAnnotationStyle, ...style }
                }));
            },

            // Utility
            clearCanvas: () => set({
                shapes: [],
                dimensions: [],
                annotations: [],
                selectedIds: [],
                tempPoints: [],
                isDrawing: false
            }),

            exportToJSON: () => {
                const { shapes, dimensions, annotations, unit, precision, gridSize } = get();
                return JSON.stringify({
                    version: '1.0',
                    unit,
                    precision,
                    gridSize,
                    shapes,
                    dimensions,
                    annotations
                }, null, 2);
            },

            importFromJSON: (json) => {
                try {
                    const data = JSON.parse(json);
                    if (data.version === '1.0') {
                        set({
                            shapes: data.shapes || [],
                            dimensions: data.dimensions || [],
                            annotations: data.annotations || [],
                            unit: data.unit || 'mm',
                            precision: data.precision || 2,
                            gridSize: data.gridSize || 10
                        });
                    }
                } catch (e) {
                    console.error('Failed to import CAD data:', e);
                }
            },

            exportToDXF: () => {
                const { shapes, dimensions, annotations } = get();
                return generateDXF(shapes, dimensions, annotations);
            }
        }),
        {
            name: 'alucalc-cad-canvas',
            partialize: (state) => ({
                shapes: state.shapes,
                dimensions: state.dimensions,
                annotations: state.annotations,
                unit: state.unit,
                precision: state.precision,
                snapSettings: state.snapSettings,
                showRulers: state.showRulers,
                showGrid: state.showGrid,
                gridSize: state.gridSize,
                currentShapeStyle: state.currentShapeStyle,
                currentDimensionStyle: state.currentDimensionStyle,
                currentAnnotationStyle: state.currentAnnotationStyle,
            })
        }
    )
);

// ============================================
// Selectors
// ============================================

export const selectVisibleShapes = (state: CADCanvasState) =>
    state.shapes.filter(s => s.visible);

export const selectSelectedShapes = (state: CADCanvasState) =>
    state.shapes.filter(s => state.selectedIds.includes(s.id));

export const selectShapesByLayer = (state: CADCanvasState, layer: string) =>
    state.shapes.filter(s => s.layer === layer);
