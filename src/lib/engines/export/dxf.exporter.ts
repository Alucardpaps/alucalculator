/**
 * Adapter around the canonical R12 DxfWriter.
 * Kept for verify_os and older kernel call sites.
 */

import { DxfWriter, type DxfLayerName } from '@/export/dxf/dxf-writer';
import { Point } from '../math/involute';

export class DxfExporter {
    private writer = new DxfWriter();

    addPolyline(points: Point[], layer: string = 'PART_CONTOUR') {
        this.writer.addPolyline(points, true, layer as DxfLayerName);
    }

    addLine(p1: Point, p2: Point, layer: string = '0') {
        this.writer.addLine(p1.x, p1.y, p2.x, p2.y, layer);
    }

    addPolylineSmart(points: Point[], layer: string) {
        this.addPolyline(points, layer);
    }

    getOutput(): string {
        return this.writer.end();
    }

    build(): string {
        return this.writer.end();
    }
}
