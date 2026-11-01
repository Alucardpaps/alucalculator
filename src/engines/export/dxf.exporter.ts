/**
 * AluCalculator Engineering Kernel — CNC-Grade DXF Exporter
 *
 * Delegates to the canonical R12 writer (`src/export/dxf/dxf-writer.ts`).
 * POLYLINE + VERTEX + SEQEND only. No LWPOLYLINE.
 */

import type { Point2D, GearGeometry, ValidationResult } from '../math/involute';
import { DxfWriter, DXF_LAYER_TABLE, type DxfLayerName } from '@/export/dxf/dxf-writer';

export interface DXFExportOptions {
    filename: string;
    units: 'mm' | 'inch';
    precision: number;
    layerPrefix?: string;
    includeConstructionLines?: boolean;
    includeDimensions?: boolean;
    colorByLayer?: boolean;
}

export interface DXFLayer {
    name: string;
    color: number;
    lineType: 'CONTINUOUS' | 'DASHED' | 'CENTER' | 'PHANTOM';
}

export interface ExportResult {
    success: boolean;
    dxfContent: string;
    filename: string;
    pointCount: number;
    warnings: string[];
    errors: string[];
}

export const STANDARD_LAYERS: DXFLayer[] = (Object.entries(DXF_LAYER_TABLE) as [DxfLayerName, (typeof DXF_LAYER_TABLE)[DxfLayerName]][])
    .filter(([name]) => name !== '0')
    .map(([name, def]) => ({
        name,
        color: def.color,
        lineType: def.lineType,
    }));

export function exportGearToDXF(
    geometry: GearGeometry,
    validation: ValidationResult,
    options: DXFExportOptions
): ExportResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (!validation.canExport) {
        errors.push('Export blocked due to validation errors');
        validation.errors.forEach((e) => errors.push(e));
        return {
            success: false,
            dxfContent: '',
            filename: options.filename,
            pointCount: 0,
            warnings,
            errors,
        };
    }

    validation.warnings.forEach((w) => warnings.push(w));

    if (geometry.fullGearContour.length < 10) {
        errors.push('Insufficient geometry points for export');
        return {
            success: false,
            dxfContent: '',
            filename: options.filename,
            pointCount: 0,
            warnings,
            errors,
        };
    }

    const writer = new DxfWriter({ units: options.units, precision: options.precision });
    writer.addPolyline(geometry.fullGearContour, true, 'PART_CONTOUR');

    if (options.includeConstructionLines) {
        writer.addCircle(0, 0, geometry.pitchRadius, 'PITCH_CIRCLE');
        writer.addCircle(0, 0, geometry.baseRadius, 'BASE_CIRCLE');
        writer.addCircle(0, 0, geometry.addendumRadius, 'ADDENDUM_CIRCLE');
        writer.addCircle(0, 0, geometry.dedendumRadius, 'DEDENDUM_CIRCLE');
        const crossSize = geometry.addendumRadius * 0.1;
        writer.addLine(-crossSize, 0, crossSize, 0, 'REFERENCE');
        writer.addLine(0, -crossSize, 0, crossSize, 'REFERENCE');
    }

    if (options.includeDimensions) {
        const textHeight = geometry.pitchRadius * 0.05;
        const textOffset = geometry.addendumRadius * 1.15;
        writer.addText(textOffset, textOffset, textHeight, `Da=${(geometry.addendumRadius * 2).toFixed(2)}`, 'DIMENSIONS');
        writer.addText(textOffset, textOffset - textHeight * 1.5, textHeight, `d=${(geometry.pitchRadius * 2).toFixed(2)}`, 'DIMENSIONS');
        writer.addText(textOffset, textOffset - textHeight * 3, textHeight, `Df=${(geometry.dedendumRadius * 2).toFixed(2)}`, 'DIMENSIONS');
    }

    if (geometry.undercutRisk) {
        warnings.push('UNDERCUT RISK: Geometry may require profile grinding');
    }

    return {
        success: true,
        dxfContent: writer.end(),
        filename: options.filename.endsWith('.dxf') ? options.filename : `${options.filename}.dxf`,
        pointCount: geometry.fullGearContour.length,
        warnings,
        errors,
    };
}

export function exportPolylineToDXF(
    points: Point2D[],
    options: DXFExportOptions & { layerName?: string }
): ExportResult {
    if (points.length < 3) {
        return {
            success: false,
            dxfContent: '',
            filename: options.filename,
            pointCount: 0,
            warnings: [],
            errors: ['Minimum 3 points required for polyline'],
        };
    }

    const writer = new DxfWriter({ units: options.units, precision: options.precision });
    writer.addPolyline(points, true, options.layerName || 'PART_CONTOUR');

    return {
        success: true,
        dxfContent: writer.end(),
        filename: options.filename.endsWith('.dxf') ? options.filename : `${options.filename}.dxf`,
        pointCount: points.length,
        warnings: [],
        errors: [],
    };
}

export function downloadDXF(result: ExportResult): void {
    if (!result.success) {
        console.error('DXF export failed:', result.errors);
        return;
    }

    const blob = new Blob([result.dxfContent], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

export const DEFAULT_DXF_OPTIONS: DXFExportOptions = {
    filename: 'gear_export',
    units: 'mm',
    precision: 4,
    includeConstructionLines: true,
    includeDimensions: true,
    colorByLayer: true,
};
