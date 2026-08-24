import { Command } from '../types';
import { useCadStore } from '../../store/cadStore';
import { useAnalysisStore } from '../../../lib/store/analysisStore';
import { Point } from '../../kernel/types';
import { v4 as uuidv4 } from 'uuid';

export class MohrsCircleTool implements Command {
    id = 'MOHR';
    name = "Mohr's Circle";
    displayName = "Mohr's Circle Analysis";

    start() {
        const { mohrData } = useAnalysisStore.getState();
        const sx = mohrData.sigmaX;
        const sy = mohrData.sigmaY;
        const txy = mohrData.tauXY;

        // Calculate Mohr's Circle parameters
        const center = (sx + sy) / 2;
        const radius = Math.sqrt(Math.pow((sx - sy) / 2, 2) + Math.pow(txy, 2));
        const sigma1 = center + radius;
        const sigma2 = center - radius;

        const store = useCadStore.getState();

        // Ensure Analysis layer exists
        let analysisLayer = store.layers.find(l => l.name === 'Analysis');
        if (!analysisLayer) {
            store.addLayer('Analysis', '#f59e0b');
            // Re-fetch to get the assigned ID
            analysisLayer = useCadStore.getState().layers.find(l => l.name === 'Analysis');
            
            // Lock the newly created layer
            if (analysisLayer) {
                store.updateLayer(analysisLayer.id, { locked: true, lineWeight: 1 });
            }
        }

        if (!analysisLayer) return; // Fallback in case of failure

        const scale = 1; // 1 unit = 1 MPa for drafting

        const entities = [];

        // 1. Draw the Circle
        entities.push({
            id: uuidv4(),
            layerId: analysisLayer.id,
            color: analysisLayer.color,
            isVisible: true,
            isSelected: false,
            geometry: {
                type: 'CIRCLE',
                center: { x: center * scale, y: 0 },
                radius: radius * scale
            }
        });

        // 2. Draw the Horizontal Axis (Normal Stress)
        entities.push({
            id: uuidv4(),
            layerId: analysisLayer.id,
            color: analysisLayer.color,
            isVisible: true,
            isSelected: false,
            geometry: {
                type: 'LINE',
                start: { x: (sigma2 - radius * 0.5) * scale, y: 0 },
                end: { x: (sigma1 + radius * 0.5) * scale, y: 0 }
            }
        });

        // 3. Draw the Vertical Axis (Shear Stress)
        entities.push({
            id: uuidv4(),
            layerId: analysisLayer.id,
            color: analysisLayer.color,
            isVisible: true,
            isSelected: false,
            geometry: {
                type: 'LINE',
                start: { x: 0, y: -radius * 1.5 * scale },
                end: { x: 0, y: radius * 1.5 * scale }
            }
        });

        // 4. Draw the State of Stress Line (from (sx, -txy) to (sy, txy))
        entities.push({
            id: uuidv4(),
            layerId: analysisLayer.id,
            color: analysisLayer.color,
            isVisible: true,
            isSelected: false,
            geometry: {
                type: 'LINE',
                start: { x: sx * scale, y: -txy * scale },
                end: { x: sy * scale, y: txy * scale }
            }
        });

        // Add to store
        entities.forEach(ent => store.addEntity(ent as any));

        useCadStore.setState({ 
            commandState: 'IDLE', 
            commandPrompt: `Mohr's Circle drawn (Center: ${center.toFixed(1)}, Radius: ${radius.toFixed(1)})` 
        });

        this.cancel(); // Finish command
    }

    onMouseMove(point: Point) {}
    onMouseDown(point: Point) {}
    onPointInput(point: Point) {}
    onValueInput(value: string) {}
    onKeyInput(key: string) {}
    
    cancel() {
        useCadStore.getState().commandState = 'IDLE';
    }
    
    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point) {}
}
