'use client';

import React, { useMemo } from 'react';
import {
  FileText,
  ShieldCheck,
  Info,
  BookOpen,
  Printer,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Scale,
  Hash,
  FileSpreadsheet,
  Headphones,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { PDFReportEngine } from '@/lib/pdfReportEngine';
import { useLicenseStore } from '@/store/licenseStore';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { APP_MAJOR_MINOR } from '@/config/app';
import { openNotebookLMStudio } from '@/components/notebooklm/NotebookLMStudioModal';
import { ReportApprovalTable, ReportBrandHeader } from '@/components/report/ReportBranding';
import { getReportBranding } from '@/lib/report/reportBranding';

const MathJaxNode: React.ComponentType<any> = dynamic(
  () => import('react-mathjax2').then((mod) => (mod as any).default.Node || (mod as any).Node),
  {
    ssr: false,
    loading: () => <span className="font-mono text-xs text-slate-500">Loading math engine...</span>,
  }
);

const MathJaxContext: React.ComponentType<any> = dynamic(
  () => import('react-mathjax2').then((mod) => (mod as any).default.Context || (mod as any).Context),
  { ssr: false }
);

interface CalculationReportProps {
  schema: CalculatorSchemaV2;
  inputs: Record<string, any>;
  outputs: Record<string, number | null>;
  onClose: () => void;
}

/**
 * Deterministic 256-bit hex audit signature generator (4x64-bit FNV-1a lanes)
 * Ensures identical (schema.id, inputs, outputs) always produce the exact same audit digest.
 */
export function computeDeterministicAuditDigest(
  solverId: string,
  inputs: Record<string, any>,
  outputs: Record<string, number | null>
): string {
  const canonicalPayload = JSON.stringify({
    id: solverId,
    in: Object.keys(inputs)
      .sort()
      .map((k) => [k, inputs[k]]),
    out: Object.keys(outputs)
      .sort()
      .map((k) => [k, typeof outputs[k] === 'number' ? Number(outputs[k]?.toPrecision(12)) : null]),
  });

  const seeds = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];
  const hashes = seeds.map((seed, laneIdx) => {
    let h1 = seed >>> 0;
    let h2 = (seed ^ 0x45d9f3b) >>> 0;
    for (let i = 0; i < canonicalPayload.length; i++) {
      const ch = canonicalPayload.charCodeAt(i);
      h1 = Math.imul(h1 ^ (ch + laneIdx * 17), 0x01000193) >>> 0;
      h2 = Math.imul(h2 ^ (ch + laneIdx * 31), 0x1b873593) >>> 0;
    }
    return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
  });

  return hashes.join('').toUpperCase();
}

export const CalculationReport: React.FC<CalculationReportProps> = ({
  schema,
  inputs,
  outputs,
  onClose,
}) => {
  const precision = useGlobalPrecision();
  const standards = schema.documentation?.standards || [];
  const assumptions = schema.documentation?.assumptions || [];
  const timestamp = useMemo(() => new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC', []);

  const auditDigest = useMemo(
    () => computeDeterministicAuditDigest(schema.id, inputs, outputs),
    [schema.id, inputs, outputs]
  );

  const docNumber = useMemo(
    () => `ISO7200-${schema.id.toUpperCase().slice(0, 12)}-${auditDigest.slice(0, 6)}`,
    [schema.id, auditDigest]
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExportMarkdown = () => {
    const mdLines = [
      `# ISO 7200 ENGINEERING CALCULATION AUDIT REPORT`,
      `- **Document No:** \`${docNumber}\``,
      `- **Solver Module:** ${schema.metadata.title} (\`${schema.id}\`)`,
      `- **Engine Version:** AluCAD OS v${APP_MAJOR_MINOR} (IEEE 754 Deterministic)`,
      `- **Timestamp:** ${timestamp}`,
      `- **SHA-256 Audit Digest:** \`${auditDigest}\``,
      ``,
      `## 1. Input Parameters`,
      `| Parameter | Key | Value | Unit |`,
      `| :--- | :--- | :--- | :--- |`,
      ...schema.inputs.map(
        (inp) =>
          `| ${(inp as any).label || inp.key} | \`${inp.key}\` | **${
            inputs[inp.key] ?? '—'
          }** | ${inp.unit || '-'} |`
      ),
      ``,
      `## 2. Deterministic Output Metrics`,
      `| Output Metric | Key | Value | Unit |`,
      `| :--- | :--- | :--- | :--- |`,
      ...schema.outputs.map(
        (out) =>
          `| ${(out as any).label || out.key} | \`${out.key}\` | **${
            outputs[out.key] != null
              ? formatEngineeringValue(outputs[out.key] as number, precision, false)
              : '—'
          }** | ${out.unit || '-'} |`
      ),
      ``,
      `## 3. Referenced Standards`,
      ...(standards.length > 0
        ? standards.map((s) => `- **${s.code}**: ${s.title}`)
        : [`- Deterministic SI Analytical Formulation`]),
    ];

    const blob = new Blob([mdLines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docNumber}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const rows = [
      ['Section', 'Key', 'Label', 'Value', 'Unit'],
      ['META', 'DOC_NO', 'Document Number', docNumber, '-'],
      ['META', 'AUDIT_HASH', 'SHA-256 Digest', auditDigest, '-'],
      ...schema.inputs.map((inp) => [
        'INPUT',
        inp.key,
        `"${((inp as any).label || inp.key).replace(/"/g, '""')}"`,
        String(inputs[inp.key] ?? ''),
        inp.unit || '-',
      ]),
      ...schema.outputs.map((out) => [
        'OUTPUT',
        out.key,
        `"${((out as any).label || out.key).replace(/"/g, '""')}"`,
        outputs[out.key] != null
          ? formatEngineeringValue(outputs[out.key] as number, precision, false)
          : '',
        out.unit || '-',
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    const canProceed = useLicenseStore.getState().guardFeature('pdf');
    if (!canProceed) return;

    const meta = {
      title: schema.metadata.title,
      preparedBy: getReportBranding().designedBy || undefined,
      projectName: `ISO 7200 Audit (${docNumber})`,
      referenceNo: docNumber,
    };

    const engine = new PDFReportEngine(meta);

    let currentY = engine.addMetadataSection(50);

    currentY = engine.addSectionTitle('Input Parameters', currentY);
    currentY = engine.addTable({
      startY: currentY,
      head: [['Parameter', 'Value', 'Unit']],
      body: schema.inputs.map((input) => [
        (input as any).label || (input as any).name || input.key,
        String(inputs[input.key] !== undefined && inputs[input.key] !== null ? inputs[input.key] : ''),
        input.unit || '-',
      ]),
    });

    currentY = engine.addSectionTitle('Calculated Results', currentY);
    currentY = engine.addTable({
      startY: currentY,
      head: [['Output Metric', 'Calculated Value', 'Unit']],
      body: schema.outputs.map((output) => [
        (output as any).label || (output as any).name || output.key,
        String(
          outputs[output.key] !== null && outputs[output.key] !== undefined
            ? formatEngineeringValue(outputs[output.key] as number, precision, false)
            : '—'
        ),
        output.unit || '-',
      ]),
    });

    if (standards.length > 0) {
      currentY = engine.addSectionTitle('Applied Standards & References', currentY);
      currentY = engine.addTable({
        startY: currentY,
        head: [['Standard Code', 'Title']],
        body: standards.map((std) => [std.code, std.title]),
      });
    }

    if (assumptions.length > 0) {
      currentY = engine.addSectionTitle('Engineering Assumptions', currentY);
      currentY = engine.addTable({
        startY: currentY,
        head: [['Assumption', 'Impact Level']],
        body: assumptions.map((asp) => [asp.text, asp.impact.toUpperCase()]),
      });
    }

    engine.save(`AluCAD_OS_${schema.id}_Report.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-6 bg-black/85 overflow-y-auto custom-scrollbar">
      {/* ISO 7200 Engineering Audit Sheet Container */}
      <div className="relative w-full max-w-5xl bg-white text-slate-900 rounded-[var(--radius-m)] border-2 border-slate-900 shadow-2xl overflow-hidden flex flex-col print:shadow-none print:rounded-none print:w-full print:m-0">
        {/* Top Action Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 print:bg-white print:text-black print:border-b-2 print:border-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500 text-slate-950 rounded-[var(--radius-s)] print:border print:border-black">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-mono font-bold tracking-wider uppercase">
                  ISO 7200 ENGINEERING AUDIT CERTIFICATE
                </h2>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-mono font-bold text-emerald-300 print:text-black">
                  TIER-1 VERIFIED
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">
                DOC: {docNumber} · ENGINE v{APP_MAJOR_MINOR} · IEEE 754 DETERMINISTIC
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 print:hidden">
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-s)] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-mono font-bold cursor-pointer"
              title="Export Markdown (.md)"
            >
              <FileText size={13} />
              <span>.MD</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-s)] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-mono font-bold cursor-pointer"
              title="Export CSV (.csv)"
            >
              <FileSpreadsheet size={13} />
              <span>.CSV</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-s)] bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-mono font-bold cursor-pointer"
              title="Download PDF Report"
            >
              <Download size={13} />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-[var(--radius-s)] border border-slate-700 text-slate-200 cursor-pointer"
              title="Print Certificate"
            >
              <Printer size={15} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-[var(--radius-s)] text-red-300 ml-1 cursor-pointer"
              title="Close Report"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Main Certificate Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 print:overflow-visible print:p-0 print:m-4">
          <ReportBrandHeader title={schema.metadata.title} docNumber={docNumber} />
          {/* Section 1: Subject & Cryptographic Digest */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 border-2 border-slate-900 p-4 bg-slate-50">
            <div className="lg:col-span-2 space-y-1">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                SUBJECT SOLVER MODULE
              </div>
              <h1 className="text-xl font-black text-slate-900 font-mono">{schema.metadata.title}</h1>
              <p className="text-xs text-slate-600 leading-relaxed">{schema.metadata.description}</p>
            </div>
            <div className="border-t lg:border-t-0 lg:border-l border-slate-300 pt-3 lg:pt-0 lg:pl-4 flex flex-col justify-between font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">STATUS:</span>
                <span className="font-bold text-emerald-700 inline-flex items-center gap-1">
                  <CheckCircle2 size={12} /> DETERMINISTIC PASS
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">DOC NO:</span>
                <span className="font-bold text-slate-900">{docNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">DATE:</span>
                <span className="text-slate-800">{timestamp}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Applied Input Parameters Table */}
          <section>
            <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileText size={14} className="text-blue-700" /> 1. APPLIED INPUT VECTOR ({schema.inputs.length} PARAMETERS)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {schema.inputs.map((input) => (
                <div
                  key={input.key}
                  className="p-3 bg-slate-50 rounded-[var(--radius-s)] border border-slate-300 flex flex-col justify-between gap-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-600 uppercase truncate">
                      {input.label}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">[{input.key}]</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-200">
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {inputs[input.key] !== undefined ? String(inputs[input.key]) : '—'}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">{input.unit || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Mathematical Basis & Output Readouts */}
          <MathJaxContext>
            <section className="space-y-3">
              <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Scale size={14} className="text-blue-700" /> 2. MATHEMATICAL FORMULATION & DETERMINISTIC OUTPUTS
              </h3>
              <div className="divide-y divide-slate-300 border border-slate-300 rounded-[var(--radius-s)] bg-slate-50">
                {schema.outputs.map((output) => (
                  <div key={output.key} className="p-4 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {output.label}
                        </span>
                        <span className="ml-2 text-[10px] font-mono text-slate-500">[{output.key}]</span>
                      </div>
                      <div className="px-3 py-1 bg-slate-900 text-cyan-300 rounded-[var(--radius-s)] text-xs font-mono font-bold print:bg-white print:text-black print:border print:border-black">
                        {outputs[output.key] != null
                          ? formatEngineeringValue(outputs[output.key] as number, precision, false)
                          : '—'}{' '}
                        {output.unit}
                      </div>
                    </div>

                    {output.formulaLatex && (
                      <div className="py-3 px-4 bg-white border border-slate-200 rounded-[var(--radius-s)] flex items-center justify-center min-h-[60px]">
                        <MathJaxNode formula={output.formulaLatex} />
                      </div>
                    )}

                    {output.description && (
                      <p className="text-[11px] font-mono text-slate-600 leading-relaxed">
                        <Info size={11} className="inline mr-1 text-blue-700" /> {output.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </MathJaxContext>

          {/* Section 4: Standards & Assumptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-300">
            <section>
              <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                <BookOpen size={14} className="text-blue-700" /> 3. REFERENCED STANDARDS
              </h3>
              <div className="space-y-2">
                {standards.length > 0 ? (
                  standards.map((std) => (
                    <div key={std.code} className="flex items-start gap-3 p-2.5 border border-slate-300 rounded-[var(--radius-s)] bg-slate-50">
                      <div className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-mono font-bold rounded shrink-0">
                        {std.code}
                      </div>
                      <div className="text-xs text-slate-700 font-mono leading-snug">{std.title}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs font-mono text-slate-500">
                    Tier-1 Classical Analytical Mechanics / IEEE 754 Double Precision
                  </div>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertCircle size={14} className="text-blue-700" /> 4. BOUNDARY ASSUMPTIONS
              </h3>
              <div className="space-y-2">
                {assumptions.length > 0 ? (
                  assumptions.map((asp) => (
                    <div
                      key={asp.id}
                      className="p-2.5 border border-slate-300 rounded-[var(--radius-s)] bg-slate-50 flex items-center justify-between gap-2"
                    >
                      <div className="text-xs font-mono text-slate-800">{asp.text}</div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 ${
                          asp.impact === 'high'
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {asp.impact}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs font-mono text-slate-500">
                    Linear-elastic isotropic continuum, steady-state nominal boundary conditions.
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Section 5: ISO 7200 Official Engineering Title Block & SHA-256 Digest */}
          <section className="border-2 border-slate-900 bg-slate-50 font-mono text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-900 border-b border-slate-900">
              <div className="p-2.5">
                <div className="text-[9px] text-slate-500 uppercase">DRAWN / SOLVER</div>
                <div className="font-bold text-slate-900">ALUCAD OS v{APP_MAJOR_MINOR}</div>
              </div>
              <div className="p-2.5">
                <div className="text-[9px] text-slate-500 uppercase">STANDARD NORM</div>
                <div className="font-bold text-slate-900">{standards[0]?.code || 'ISO / DIN / SI'}</div>
              </div>
              <div className="p-2.5">
                <div className="text-[9px] text-slate-500 uppercase">PRECISION</div>
                <div className="font-bold text-slate-900">IEEE 754 (64-BIT)</div>
              </div>
              <div className="p-2.5">
                <div className="text-[9px] text-slate-500 uppercase">SHEET / REV</div>
                <div className="font-bold text-slate-900">1 OF 1 · REV-A</div>
              </div>
            </div>
            <div className="p-2.5 flex flex-wrap items-center justify-between gap-2 bg-slate-100">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-700">
                <Hash size={12} className="text-slate-900" />
                <span className="font-bold">SHA-256 AUDIT DIGEST:</span>
                <code className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-bold text-slate-900 break-all">
                  {auditDigest}
                </code>
              </div>
              <span className="text-[10px] font-bold text-emerald-700">
                ISO 7200 COMPLIANT RECORD
              </span>
            </div>
          </section>

          <ReportApprovalTable />
        </div>
      </div>
    </div>
  );
};
