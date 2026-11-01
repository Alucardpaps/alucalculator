import { Command } from '../types';
import { useCadStore } from '../../store/cadStore';
import { useAnalysisStore } from '../../../lib/store/analysisStore';
import { Point } from '../../kernel/types';
import { largestRegion } from '../../geometry/contourAssembler';
import { circleSectionProperties, formatSectionPrompt } from '../../geometry/sectionProperties';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';

export class CrossSectionTool implements Command {
    id = 'CROSS_SECTION';
    name = 'Cross-Section Analysis';
    displayName = 'Cross-Section Analysis';

    start() {
        useCadStore.setState({
            commandState: 'AWAITING_POINT',
            commandPrompt: '⧖ Kesit Analizi: Kapalı bir profile tıklayın veya sağ panelden detayları inceleyin (ESC ile çıkış):',
        });
        this.runAnalysis();
    }

    public runAnalysis(): void {
        const { selectedIds, entities } = useCadStore.getState();
        const pool = selectedIds.length > 0
            ? entities.filter((e) => selectedIds.includes(e.id))
            : entities.filter((e) => e.isVisible !== false);

        if (pool.length === 0) {
            useCadStore.setState({
                commandPrompt: '⧖ Kesit Analizi: Çizimde profil bulunamadı. Kapalı bir şekil (Polyline, Dikdörtgen, Çember, T-Slot) çizin.',
            });
            return;
        }

        // Exact circle when the only selection is a single circle with no holes.
        if (pool.length === 1 && pool[0].geometry.type === 'CIRCLE') {
            const g = pool[0].geometry;
            const exact = circleSectionProperties(g.center.x, g.center.y, g.radius);
            useAnalysisStore.getState().setBucklingData({
                area: exact.area,
                inertia: exact.Ix,
            });
            useCadStore.setState({
                commandPrompt: `✅ Kesit Analizi (Tam Çember): ${formatSectionPrompt(exact)}. Detaylar sağ panelde.`,
            });
            return;
        }

        const region = largestRegion(pool);
        if (!region) {
            useCadStore.setState({
                commandPrompt: '⧖ Kapalı kontur bulunamadı. Lütfen kapalı bir geometri seçin veya çizin.',
            });
            return;
        }

        const s = region.section;
        useAnalysisStore.getState().setBucklingData({
            area: s.area,
            inertia: s.Ix,
        });

        const holeNote = region.holes.length > 0 ? ` (delik: ${region.holes.length})` : '';
        useCadStore.setState({
            commandPrompt: `✅ Kesit Analizi (Green/Shoelace): ${formatSectionPrompt(s)}${holeNote}. Detaylar sağ panelde.`,
        });
    }

    onMouseMove(_point: Point) {}
    onMouseDown(point: Point) {
        this.onPointInput(point);
    }

    onPointInput(point: Point) {
        const { entities } = useCadStore.getState();
        const zoom = useCadStore.getState().viewport?.zoom || 1;
        let hit = findEntityAtPoint(point, entities, zoom, 15);

        // Also check if point is inside closed circle or rectangle
        if (!hit) {
            for (const ent of entities) {
                if (!ent.isVisible) continue;
                if (ent.geometry.type === 'CIRCLE') {
                    const d = Math.hypot(point.x - ent.geometry.center.x, point.y - ent.geometry.center.y);
                    if (d <= ent.geometry.radius + 5) {
                        hit = ent;
                        break;
                    }
                } else if (ent.geometry.type === 'RECTANGLE') {
                    const rect = ent.geometry as any;
                    const hw = rect.width / 2 + 5;
                    const hh = rect.height / 2 + 5;
                    if (Math.abs(point.x - rect.center.x) <= hw && Math.abs(point.y - rect.center.y) <= hh) {
                        hit = ent;
                        break;
                    }
                }
            }
        }

        if (hit) {
            useCadStore.setState({ selectedIds: [hit.id] });
            this.runAnalysis();
        } else {
            this.runAnalysis();
        }
    }

    onValueInput(value: string) {
        const trimmed = value.trim().toUpperCase();
        if (trimmed === 'ALL' || trimmed === 'TUM') {
            useCadStore.setState({ selectedIds: [] });
            this.runAnalysis();
        } else if (trimmed === 'CALC' || trimmed === 'HESAPLA') {
            this.runAnalysis();
        }
    }

    onKeyInput(key: string) {
        if (key === 'Escape') this.cancel();
    }
    
    cancel() {
        useCadStore.setState({ commandState: 'IDLE' });
    }
    
    renderPreview(_ctx: CanvasRenderingContext2D, _transform: (p: Point) => Point) {}
}

