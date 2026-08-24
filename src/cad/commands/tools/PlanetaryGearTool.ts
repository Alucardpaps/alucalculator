/**
 * AluCAD — Planetary Gearbox Tool (v2)
 * 
 * Generates a full sun-planet-ring gear assembly with setParams support.
 */

import { Command } from '../types';
import { Point, createPlanetaryGearEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';

interface PlanetaryParams {
    module: number;
    sunTeeth: number;
    planetTeeth: number;
}

export class PlanetaryGearTool implements Command {
    id = 'PLANETARY_GEAR';
    name = 'Planetary Gearbox';
    displayName = 'Planetary';

    private center: Point | null = null;
    private params: PlanetaryParams = { module: 2, sunTeeth: 20, planetTeeth: 20 };
    private step: 'CENTER' | 'MODULE' | 'SUN_Z' | 'PLANET_Z' = 'CENTER';

    start(): void {
        this.step = 'CENTER';
        useCadStore.setState({
            commandState: 'AWAITING_POINT',
            commandPrompt: 'Click for gearbox center:',
        });
    }

    /**
     * Pre-configure parameters from ToolPropertyPanel.
     */
    setParams(params: Partial<PlanetaryParams>): void {
        if (params.module !== undefined && params.module > 0) this.params.module = params.module;
        if (params.sunTeeth !== undefined && params.sunTeeth >= 6) this.params.sunTeeth = Math.round(params.sunTeeth);
        if (params.planetTeeth !== undefined && params.planetTeeth >= 6) this.params.planetTeeth = Math.round(params.planetTeeth);

        // Transition to placement
        this.step = 'CENTER';
        useCadStore.setState({
            commandState: 'AWAITING_POINT',
            commandPrompt: `m=${this.params.module}, sun=${this.params.sunTeeth}, planet=${this.params.planetTeeth} — Click for center:`,
        });
    }

    onPointInput(point: Point): void {
        if (this.step === 'CENTER') {
            this.center = point;
            this.generate();
        }
    }

    onValueInput(value: string): void {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
            useCadStore.setState({ commandPrompt: 'Invalid value. Enter a positive number:' });
            return;
        }

        if (this.step === 'MODULE') {
            this.params.module = num;
            this.step = 'SUN_Z';
            useCadStore.setState({ commandPrompt: `Sun Teeth (current: ${this.params.sunTeeth}):` });
        } else if (this.step === 'SUN_Z') {
            this.params.sunTeeth = Math.round(num);
            this.step = 'PLANET_Z';
            useCadStore.setState({ commandPrompt: `Planet Teeth (current: ${this.params.planetTeeth}):` });
        } else if (this.step === 'PLANET_Z') {
            this.params.planetTeeth = Math.round(num);
            this.step = 'CENTER';
            useCadStore.setState({
                commandState: 'AWAITING_POINT',
                commandPrompt: 'Click for gearbox center:',
            });
        }
    }

    onMouseMove(point: Point): void {
        if (this.step !== 'CENTER') return;
        
        const store = useCadStore.getState();
        const preview = createPlanetaryGearEntity(
            point, 
            this.params.module, 
            this.params.sunTeeth, 
            this.params.planetTeeth, 
            store.activeLayerId, 
            'rgba(0, 229, 255, 0.3)'
        );
        store.setPreviewEntity(preview);
    }

    onKeyInput(key: string): void {
        if (key === 'Escape') this.cancel();
    }

    cancel(): void {
        this.center = null;
        useCadStore.setState({ previewEntity: null });
    }

    renderPreview(): void { }

    private generate(): void {
        if (!this.center) return;
        const store = useCadStore.getState();
        store.pushHistory('Planetary Gearbox');

        const entity = createPlanetaryGearEntity(
            this.center, 
            this.params.module, 
            this.params.sunTeeth, 
            this.params.planetTeeth,
            store.activeLayerId, 
            store.layers.find(l => l.id === store.activeLayerId)?.color || '#ffffff'
        );

        store.addEntity(entity);
        useCadStore.setState({ 
            previewEntity: null, 
            commandState: 'AWAITING_POINT', 
            commandPrompt: 'Planetary gearbox created. Click for next or ESC:' 
        });
        this.center = null;
    }
}
