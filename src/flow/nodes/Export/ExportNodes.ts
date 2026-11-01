import type { EngineeringNodeSchema, ValidationResult } from '@/flow/types/core';
import { buildEngineeringReportPdf } from '@/export/pdf/engineering-report';

/**
 * Export nodes consume validated geometry. They must not recompute math.
 */

interface DxfExportInput {
    geometry: string;
    validation_report?: {
        valid?: boolean;
        errors?: string[];
        warnings?: string[];
    };
}

interface DxfExportOutput {
    dxf_file: string;
    validation_report: {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
}

export const DxfExportNode: EngineeringNodeSchema<DxfExportInput, DxfExportOutput> = {
    id: 'export-dxf',
    version: '1.0.0',
    title: 'DXF Export (R12)',
    description: 'Passes through a validated DXF R12 payload. Blocked when the validation report is invalid.',
    category: 'export',
    deterministic: true,
    isoStandard: 'DXF R12',
    inputs: [
        { id: 'geometry', label: 'Geometry (DXF)', type: 'dxf_file', required: true },
        { id: 'validation_report', label: 'Validation', type: 'validation_report', required: false },
    ],
    outputs: [
        { id: 'dxf_file', label: 'DXF File', type: 'dxf_file' },
        { id: 'validation_report', label: 'Export Status', type: 'validation_report' },
    ],
    validate: (input): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];
        const report = input.validation_report;
        if (report && report.valid === false) {
            errors.push('Export blocked: upstream validation failed.');
            if (report.errors?.length) errors.push(...report.errors);
        }
        if (typeof input.geometry !== 'string' || input.geometry.length < 16) {
            errors.push('DXF payload is empty or too short.');
        } else if (!input.geometry.includes('SECTION')) {
            errors.push('DXF payload is not R12-compliant (missing SECTION).');
        }
        if (report?.warnings?.length) warnings.push(...report.warnings);
        return { valid: errors.length === 0, errors, warnings };
    },
    compute: (input) => ({
        dxf_file: input.geometry,
        validation_report: {
            valid: true,
            errors: [],
            warnings: input.validation_report?.warnings ?? [],
        },
    }),
};

interface SvgPreviewInput {
    geometry: unknown;
}

interface SvgPreviewOutput {
    svg_geometry: unknown;
}

interface PdfReportInput {
    validation_report?: {
        valid?: boolean;
        errors?: string[];
        warnings?: string[];
    };
    report_payload?: Record<string, unknown>;
    dxf_file?: string;
    title?: string;
    standard?: string;
    engine_version?: string;
    assumptions?: string;
    formula_trace?: string;
}

interface PdfReportOutput {
    pdf_file: string;
    validation_report: {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
}

export const PdfReportNode: EngineeringNodeSchema<PdfReportInput, PdfReportOutput> = {
    id: 'export-pdf-report',
    version: '1.0.0',
    title: 'PDF Engineering Report',
    description: 'Deterministic calculation report. Blocked when upstream validation fails. Does not recompute math.',
    category: 'export',
    deterministic: true,
    isoStandard: 'ISO 7200',
    inputs: [
        { id: 'validation_report', label: 'Validation', type: 'validation_report', required: true },
        { id: 'report_payload', label: 'Results', type: 'json', required: false },
        { id: 'dxf_file', label: 'DXF (optional)', type: 'dxf_file', required: false },
        { id: 'title', label: 'Title', type: 'string', required: false, defaultValue: 'Engineering Report' },
        { id: 'standard', label: 'Standard', type: 'string', required: false },
        { id: 'engine_version', label: 'Engine version', type: 'string', required: false, defaultValue: '1.0.0' },
    ],
    outputs: [
        { id: 'pdf_file', label: 'PDF Report', type: 'pdf_file' },
        { id: 'validation_report', label: 'Export Status', type: 'validation_report' },
    ],
    validate: (input): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];
        const report = input.validation_report;
        if (!report) {
            errors.push('Validation report is required.');
        } else if (report.valid === false) {
            errors.push('Export blocked: upstream validation failed.');
            if (report.errors?.length) errors.push(...report.errors);
        }
        if (report?.warnings?.length) warnings.push(...report.warnings);
        return { valid: errors.length === 0, errors, warnings };
    },
    compute: (input) => {
        const payload = input.report_payload && typeof input.report_payload === 'object' ? input.report_payload : {};
        const formulaTrace = Array.isArray(payload.formula_trace)
            ? (payload.formula_trace as string[])
            : typeof input.formula_trace === 'string'
                ? [input.formula_trace]
                : [];
        const assumptions = Array.isArray(payload.assumptions)
            ? (payload.assumptions as string[])
            : typeof input.assumptions === 'string'
                ? [input.assumptions]
                : [];
        const pdf_file = buildEngineeringReportPdf({
            title: input.title || 'Engineering Report',
            standard: input.standard || (typeof payload.standard === 'string' ? payload.standard : undefined),
            engineVersion: input.engine_version || '1.0.0',
            validation: {
                valid: true,
                errors: [],
                warnings: input.validation_report?.warnings ?? [],
            },
            results: payload,
            assumptions,
            formulaTrace,
            hasDxf: typeof input.dxf_file === 'string' && input.dxf_file.includes('SECTION'),
        });
        return {
            pdf_file,
            validation_report: {
                valid: true,
                errors: [],
                warnings: input.validation_report?.warnings ?? [],
            },
        };
    },
};

export const SvgDrawingNode: EngineeringNodeSchema<SvgPreviewInput, SvgPreviewOutput> = {
    id: 'viz-svg-drawing',
    version: '1.0.0',
    title: '2D Technical Drawing',
    description: 'Viewer wrapper. Does not compute geometry — passes svg_geometry through for the canvas.',
    category: 'visualizer',
    deterministic: true,
    inputs: [
        { id: 'geometry', label: 'Geometry', type: 'svg_geometry', required: true },
    ],
    outputs: [
        { id: 'svg_geometry', label: 'Drawing', type: 'svg_geometry' },
    ],
    validate: (input): ValidationResult => ({
        valid: input.geometry !== undefined && input.geometry !== null,
        errors: input.geometry !== undefined && input.geometry !== null ? [] : ['No geometry connected.'],
        warnings: [],
    }),
    compute: (input) => ({ svg_geometry: input.geometry }),
};
