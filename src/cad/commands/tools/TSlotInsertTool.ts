/**
 * Insert a catalog T-slot 2D section (outer polyline + multi-bore circles)
 * at a picked point. Supports full Wellste catalog (20, 30, 40, 45, 50, 60, 80 Series).
 * DIN EN 12020 / EN 755 compliant modular aluminum profiles.
 */

import { BaseCommand } from '../BaseCommand';
import { Point } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { getTSlotSpec, tSlotToCadEntities, buildTSlotSection, TSLOT_CATALOG, type TSlotSpec } from '../../catalog/tSlotProfiles';

export class TSlotInsertTool extends BaseCommand {
    public id = 'TSLOT';
    public name = 'TSLOT';
    public displayName = 'T-Slot Profile';

    private specId = '4040';
    private currentPoint: Point | null = null;

    start(): void {
        this.specId = '4040';
        this.currentPoint = null;
        this.updatePrompt();
    }

    public getSpec(): TSlotSpec {
        return getTSlotSpec(this.specId);
    }

    public getSize(): number {
        return this.getSpec().size;
    }

    private updatePrompt(): void {
        const spec = this.getSpec();
        const boreInfo = `${spec.slotsX * spec.slotsY}× Ø${spec.bore} mm`;
        const newPrompt = `▥ ${spec.name} (${spec.width}×${spec.height} mm, Kanal ${spec.slot}, Delik ${boreInfo}) — Yerleştirmek için tıklayın (ESC ile çıkış):`;
        const current = useCadStore.getState();
        if (current.commandPrompt !== newPrompt || current.commandState !== 'AWAITING_POINT') {
            useCadStore.setState({
                commandState: 'AWAITING_POINT',
                commandPrompt: newPrompt,
            });
        }
    }

    public setParams(params: { specId?: string; size?: number | string }): void {
        const target = params.specId || params.size;
        if (target) {
            const spec = getTSlotSpec(target);
            this.specId = spec.id;
        }
        this.updatePrompt();
    }

    public placeNow(origin?: Point): void {
        const store = useCadStore.getState();
        const pt = origin || this.currentPoint || store.cursorWorld || store.viewport?.center || { x: 0, y: 0 };
        this.insertAt(pt);
    }

    onMouseMove(point: Point): void {
        this.currentPoint = point;
        const spec = this.getSpec();
        const { activeLayerId, setPreviewEntity } = useCadStore.getState();
        const ents = tSlotToCadEntities(spec, point, activeLayerId, 'rgba(58, 208, 230, 0.4)');
        if (ents.length > 0) {
            setPreviewEntity(ents[0]);
        }
    }

    onValueInput(value: string): void {
        const trimmed = value.trim().toUpperCase();
        if (trimmed === 'ORIGIN' || trimmed === '0,0' || trimmed === '0') {
            this.insertAt({ x: 0, y: 0 });
            return;
        }

        // Try to match profile by ID or size (e.g. 2040, 4080, 4590, 3030)
        const matched = TSLOT_CATALOG.find((s) => s.id.toUpperCase() === trimmed)
            || TSLOT_CATALOG.find((s) => s.id.toUpperCase().startsWith(trimmed))
            || getTSlotSpec(trimmed);

        if (matched) {
            this.specId = matched.id;
        }
        this.updatePrompt();
    }

    onPointInput(point: Point): void {
        this.insertAt(point);
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        const cur = this.currentPoint || useCadStore.getState().cursorWorld;
        if (!cur) return;
        const spec = this.getSpec();
        const geom = buildTSlotSection(spec, cur);

        ctx.save();
        ctx.strokeStyle = '#3ad0e6';
        ctx.fillStyle = 'rgba(58, 208, 230, 0.15)';
        ctx.lineWidth = 1.5;

        // Draw outer polygon
        if (geom.outer.length > 0) {
            ctx.beginPath();
            const p0 = transform(geom.outer[0]);
            ctx.moveTo(p0.x, p0.y);
            for (let i = 1; i < geom.outer.length; i++) {
                const pt = transform(geom.outer[i]);
                ctx.lineTo(pt.x, pt.y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        }

        // Draw all center bore holes
        for (const hole of geom.holes) {
            if (hole.length === 0) continue;
            ctx.beginPath();
            const p0 = transform(hole[0]);
            ctx.moveTo(p0.x, p0.y);
            for (let k = 1; k < hole.length; k++) {
                const pt = transform(hole[k]);
                ctx.lineTo(pt.x, pt.y);
            }
            ctx.closePath();
            ctx.stroke();
        }

        ctx.restore();
    }

    insertAt(origin: Point): void {
        const spec = this.getSpec();
        const { addEntity, activeLayerId } = useCadStore.getState();
        const ents = tSlotToCadEntities(spec, origin, activeLayerId, '#38bdf8');
        ents.forEach((e) => addEntity(e));
        useCadStore.setState({
            commandPrompt: `✅ Eklendi: ${spec.name} (${spec.width}×${spec.height} mm, ${ents.length - 1} delik) (${origin.x.toFixed(1)}, ${origin.y.toFixed(1)}). Yeni profil için tıklayın (ESC çıkış):`,
            commandState: 'AWAITING_POINT',
            selectedIds: ents.map((e) => e.id),
            previewEntity: null,
        });
    }

    cancel(): void {
        this.currentPoint = null;
        useCadStore.setState({ previewEntity: null });
        super.cancel();
    }
}

export function insertTSlotAtOrigin(sizeOrId: string | number = '4040'): void {
    const spec = getTSlotSpec(sizeOrId);
    const { addEntity, activeLayerId } = useCadStore.getState();
    const ents = tSlotToCadEntities(spec, { x: 0, y: 0 }, activeLayerId, '#38bdf8');
    ents.forEach((e) => addEntity(e));
    useCadStore.setState({
        commandPrompt: `Inserted ${spec.name} at origin. CROSS_SECTION or SYNC TO 3D to extrude.`,
        selectedIds: ents.map((e) => e.id),
    });
}
