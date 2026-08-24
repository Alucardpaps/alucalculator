/**
 * 🛠️ AluDraw Tool System
 * 
 * State Machine for tool interaction.
 * Routes raw events to specific tool logic (Select, Rect, etc.)
 */

import { Camera } from '../core/Camera';
import { Pointer } from '../core/Pointer';
import { Scene } from '../core/Scene';
import { SelectionSystem } from './SelectionSystem';
import { TransformSystem } from './TransformSystem';
import { v4 as uuidv4 } from 'uuid';

export type ToolType = 'select' | 'hand' | 'rectangle' | 'circle';

export class ToolSystem {
    activeTool: ToolType = 'select';

    // Dependencies
    scene: Scene;
    camera: Camera;
    pointer: Pointer;
    selection: SelectionSystem;
    transform: TransformSystem;

    constructor(
        scene: Scene,
        camera: Camera,
        pointer: Pointer,
        selection: SelectionSystem,
        transform: TransformSystem
    ) {
        this.scene = scene;
        this.camera = camera;
        this.pointer = pointer;
        this.selection = selection;
        this.transform = transform;
    }

    setTool(tool: ToolType) {
        this.activeTool = tool;
        this.transform.endDrag();
        this.selection.clear();
    }

    // --- EVENT ROUTER ---

    onPointerDown() {
        if (this.activeTool === 'select') {
            this.handleSelectDown();
        } else if (this.activeTool === 'rectangle') {
            this.handleCreateDown('box');
        }
    }

    onPointerMove() {
        if (this.activeTool === 'select') {
            this.handleSelectMove();
        }
    }

    onPointerUp() {
        if (this.activeTool === 'select') {
            this.handleSelectUp();
        }
    }

    // --- TOOL LOGIC: SELECT ---

    private handleSelectDown() {
        // 1. Get World Coordinates
        const ptrWorld = this.camera.screenToWorld(this.pointer.x, this.pointer.y);

        // 2. Hit Test
        const hitShape = this.scene.hitTest(ptrWorld.x, ptrWorld.y);

        if (hitShape) {
            // Clicked a shape
            // If not holding shift/ctrl, clear others unless already selected
            if (!hitShape.selected) {
                this.selection.select(hitShape.id);
            }
            // Start Dragging
            this.transform.startDrag(ptrWorld.x, ptrWorld.y);
        } else {
            // Clicked empty space -> Start Brush
            this.selection.startBrush(ptrWorld.x, ptrWorld.y);
            this.selection.clear();
        }
    }

    private handleSelectMove() {
        const ptrWorld = this.camera.screenToWorld(this.pointer.x, this.pointer.y);

        if (this.transform.isDragging) {
            this.transform.updateDrag(ptrWorld.x, ptrWorld.y);
        } else if (this.selection.isBrushing) {
            this.selection.updateBrush(ptrWorld.x, ptrWorld.y);
        }
    }

    private handleSelectUp() {
        if (this.transform.isDragging) {
            this.transform.endDrag();
        }
        if (this.selection.isBrushing) {
            this.selection.endBrush();
        }
    }

    // --- TOOL LOGIC: CREATE ---

    private handleCreateDown(type: string) {
        const ptrWorld = this.camera.screenToWorld(this.pointer.x, this.pointer.y);

        const id = uuidv4();
        this.scene.addShape({
            id,
            type,
            x: ptrWorld.x, // Center it? Or top-left
            y: ptrWorld.y,
            width: 100,
            height: 100,
            selected: true
        });

        // Select the new shape
        this.selection.select(id);

        // Switch back to select
        this.setTool('select');
    }
}
