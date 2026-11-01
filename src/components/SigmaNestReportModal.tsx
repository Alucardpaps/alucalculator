"use client";

import React from 'react';
import { 
  FileText, Download, Printer, CheckCircle2, 
  X, Layers, Scissors, ShieldAlert, Cpu
} from 'lucide-react';
import type { SigmaNestReportData, RemnantSheet2D } from '@/types/nesting2d.types';

interface SigmaNestReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: SigmaNestReportData | null;
  onSaveRemnant?: (remnant: RemnantSheet2D) => void;
  onDownloadMpg?: () => void;
}

export function SigmaNestReportModal({
  isOpen,
  onClose,
  reportData,
  onSaveRemnant,
  onDownloadMpg
}: SigmaNestReportModalProps) {
  if (!isOpen || !reportData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[var(--bg-1)] border border-[var(--line)] rounded-lg shadow-2xl text-[var(--ink)] font-sans overflow-hidden print:border-none print:shadow-none print:max-h-full print:w-full print:text-black">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--bg-0)] print:border-b-2 print:border-black">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--cyan)]/10 text-[var(--cyan)] rounded border border-[var(--cyan)]/30 print:hidden">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wider text-[var(--ink)] print:text-black font-mono">
                {reportData.reportTitle} — Üretim İş Emri Raporu
              </h2>
              <p className="text-xs text-[var(--alu)] print:text-neutral-600 font-mono">
                CNC ESSI Kesim Programı ve Kalıntı Raporu • {reportData.dateFormatted}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded border border-[var(--line)] hover:border-[var(--alu)] bg-[var(--bg-2)] transition-colors"
              title="Yazdır / PDF Olarak Kaydet"
            >
              <Printer className="w-3.5 h-3.5" />
              Yazdır / PDF
            </button>

            {onDownloadMpg && (
              <button
                onClick={onDownloadMpg}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded bg-[var(--cyan)] text-[var(--bg-0)] hover:bg-[var(--cyan)] transition-colors"
                title="ESSI CNC Hareket Programı (.MPG) İndir"
              >
                <Download className="w-3.5 h-3.5" />
                .MPG İndir
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[var(--bg-2)] text-[var(--alu)] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* REPORT CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm print:overflow-visible print:p-2">
          
          {/* 1. TOP METADATA TILES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[var(--bg-0)] p-4 rounded border border-[var(--line)] print:bg-white print:border-neutral-300">
            <div>
              <span className="text-[11px] font-mono text-[var(--alu)] block uppercase">Makine</span>
              <span className="font-bold font-mono text-[var(--cyan)] print:text-black text-base">{reportData.machineName}</span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-[var(--alu)] block uppercase">Görev Adı</span>
              <span className="font-semibold font-mono text-sm">{reportData.taskName}</span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-[var(--alu)] block uppercase">Program Adı</span>
              <span className="font-semibold font-mono text-sm">{reportData.programName}</span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-[var(--alu)] block uppercase">Amperaj & Gaz</span>
              <span className="font-semibold font-mono text-sm">{reportData.amperage} A • O₂ / Plasma</span>
            </div>
          </div>

          {/* 2. PLATE & REMNANT DETAILED GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Ham Plaka (Raw Plate) */}
            <div className="bg-[var(--bg-2)] p-4 rounded border border-[var(--line)] space-y-2 print:bg-white print:border-neutral-300">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-2 print:border-neutral-300">
                <span className="font-mono text-xs uppercase font-bold text-[var(--alu)] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[var(--cyan)]" /> Ham Plaka (Raw)
                </span>
                <span className="text-xs font-mono font-bold bg-[var(--bg-0)] px-2 py-0.5 rounded border border-[var(--line)]">
                  {reportData.material}
                </span>
              </div>
              <div className="text-xs font-mono space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-[var(--alu)]">Kalınlık:</span>
                  <span className="font-bold">{reportData.thicknessMm.toFixed(1)} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--alu)]">Plaka Boyutu:</span>
                  <span className="font-bold">{reportData.sheetLengthMm.toLocaleString('tr-TR')} × {reportData.sheetWidthMm.toLocaleString('tr-TR')} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--alu)]">Ham Sac Ağırlığı:</span>
                  <span className="font-bold text-[var(--ink)]">{reportData.sheetWeightKg.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--alu)]">Plaka ID:</span>
                  <span className="font-bold">{reportData.sheetName}</span>
                </div>
              </div>
            </div>

            {/* Kullanılan Zarf (Used Envelope) */}
            <div className="bg-[var(--bg-2)] p-4 rounded border border-[var(--line)] space-y-2 print:bg-white print:border-neutral-300">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-2 print:border-neutral-300">
                <span className="font-mono text-xs uppercase font-bold text-[var(--alu)] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[var(--warn)]" /> Yerleşim Zarfı
                </span>
                <span className="text-xs font-mono font-bold text-[var(--ok)]">
                  {((reportData.partsWeightKg / reportData.sheetWeightKg) * 100).toFixed(1)}% Net
                </span>
              </div>
              <div className="text-xs font-mono space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-[var(--alu)]">Kull. Plaka Boyu:</span>
                  <span className="font-bold">{reportData.usedLengthMm.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--alu)]">Kull. Plaka Eni:</span>
                  <span className="font-bold">{reportData.usedWidthMm.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--alu)]">Toplam Parça Ağr.:</span>
                  <span className="font-bold text-[var(--ok)]">{reportData.partsWeightKg.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--alu)]">Kullanılan Alan Ağr.:</span>
                  <span className="font-bold">{reportData.usedWeightKg.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} kg</span>
                </div>
              </div>
            </div>

            {/* Kalıntı Sac & Hurda (Remnant & True Scrap) */}
            <div className="bg-[var(--bg-2)] p-4 rounded border border-[var(--line)] space-y-2 print:bg-white print:border-neutral-300">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-2 print:border-neutral-300">
                <span className="font-mono text-xs uppercase font-bold text-[var(--alu)] flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-[var(--cyan)]" /> Kalıntı & Hurda
                </span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${reportData.scrapPercent < 15 ? 'bg-[var(--ok)]/20 text-[var(--ok)]' : 'bg-[var(--warn)]/20 text-[var(--warn)]'}`}>
                  Hurda %{reportData.scrapPercent.toFixed(2)}
                </span>
              </div>
              <div className="text-xs font-mono space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-[var(--alu)]">Kalıntı Sac (Remnant):</span>
                  <span className="font-bold text-[var(--cyan)]">{reportData.remnantWeightKg.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--alu)]">Gerçek Hurda (Scrap):</span>
                  <span className="font-bold text-[var(--bad)]">{reportData.scrapWeightKg.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--alu)]">Toplam Kesim Süresi:</span>
                  <span className="font-bold text-[var(--ink)]">{reportData.totalCutTimeFormatted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--alu)]">Toplam Kesim Boyu:</span>
                  <span className="font-bold">{(reportData.totalCutLengthMm / 1000).toFixed(2)} m</span>
                </div>
              </div>
            </div>

          </div>

          {/* 3. KALINTI SAC RESMİ SERTİFİKASI (REMNANT CERTIFICATE BADGE) */}
          {reportData.remnantSheet && (
            <div className="p-4 bg-[var(--bg-0)] border border-[var(--cyan)]/40 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:border-black print:bg-neutral-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-[var(--cyan)]/20 text-[var(--cyan)] font-bold rounded border border-[var(--cyan)]/40">
                    Kalıntı Sac (Remnant Stock)
                  </span>
                  <span className="font-mono font-bold text-sm text-[var(--ink)]">{reportData.remnantSheet.id}</span>
                  <span className="text-xs font-mono text-[var(--alu)]">({reportData.remnantSheet.barcode})</span>
                </div>
                <p className="text-xs font-mono text-[var(--alu)]">
                  Ölçüler: <strong className="text-[var(--ink)]">{reportData.remnantSheet.width} × {reportData.remnantSheet.height} mm</strong> • 
                  Kalınlık: <strong className="text-[var(--ink)]">{reportData.remnantSheet.thickness} mm</strong> • 
                  Ağırlık: <strong className="text-[var(--cyan)]">{reportData.remnantSheet.weightKg.toLocaleString('tr-TR')} kg</strong> • 
                  Konum: X={reportData.remnantSheet.originX}mm
                </p>
              </div>

              {onSaveRemnant && (
                <button
                  onClick={() => onSaveRemnant(reportData.remnantSheet!)}
                  className="px-3 py-1.5 text-xs font-mono font-bold rounded bg-[var(--cyan)]/20 hover:bg-[var(--cyan)]/30 text-[var(--cyan)] border border-[var(--cyan)]/50 transition-colors flex items-center gap-1.5 print:hidden cursor-pointer whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Envantere Kaydet
                </button>
              )}
            </div>
          )}

          {/* 4. PARTS BREAKDOWN TABLE */}
          <div className="space-y-2">
            <h3 className="font-mono text-xs uppercase font-bold text-[var(--alu)] tracking-wider">
              Yerleşen Parçalar Listesi (Parts Table)
            </h3>

            <div className="overflow-x-auto border border-[var(--line)] rounded bg-[var(--bg-0)] print:border-neutral-300">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[var(--bg-2)] text-[var(--alu)] border-b border-[var(--line)] print:bg-neutral-100 print:text-black">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Parça Adı</th>
                    <th className="py-2.5 px-3 text-center">Gerk. Adet</th>
                    <th className="py-2.5 px-3 text-center">Yerlş. Adet</th>
                    <th className="py-2.5 px-3 text-right">Net Ağr. (kg)</th>
                    <th className="py-2.5 px-3 text-right">Dikd. Ağr. (kg)</th>
                    <th className="py-2.5 px-3 text-center">Parça X & Y (mm)</th>
                    <th className="py-2.5 px-3 text-center">İş Emri No</th>
                    <th className="py-2.5 px-3 text-right">Kesim Süresi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] print:divide-neutral-200">
                  {reportData.parts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-2)]/50 transition-colors">
                      <td className="py-2 px-3 text-[var(--alu)]">{p.id}</td>
                      <td className="py-2 px-3 font-semibold text-[var(--ink)] print:text-black">{p.name}</td>
                      <td className="py-2 px-3 text-center text-[var(--alu)]">{p.requiredQty}</td>
                      <td className="py-2 px-3 text-center font-bold text-[var(--cyan)] print:text-black">{p.nestedQty}</td>
                      <td className="py-2 px-3 text-right">{p.netWeightKg.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-[var(--alu)]">{p.rectWeightKg.toFixed(2)}</td>
                      <td className="py-2 px-3 text-center">{p.dimensions}</td>
                      <td className="py-2 px-3 text-center text-[var(--alu)]">{p.workOrder}</td>
                      <td className="py-2 px-3 text-right font-medium">{p.cutTimeFormatted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. OPERATOR SIGN-OFF FOOTER */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[var(--line)] text-xs font-mono text-[var(--alu)] print:pt-6 print:border-black">
            <div>
              <span className="block mb-1">Tarih & Saat:</span>
              <div className="border-b border-dashed border-[var(--line)] h-6 print:border-black"></div>
            </div>
            <div>
              <span className="block mb-1">Operatör Adı:</span>
              <div className="border-b border-dashed border-[var(--line)] h-6 print:border-black"></div>
            </div>
            <div>
              <span className="block mb-1">İmza:</span>
              <div className="border-b border-dashed border-[var(--line)] h-6 print:border-black"></div>
            </div>
            <div>
              <span className="block mb-1">Kalite Kontrol:</span>
              <div className="border-b border-dashed border-[var(--line)] h-6 print:border-black"></div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-[var(--alu)] text-right print:text-neutral-500">
            {reportData.workspacePath} • AluCAD OS CNC/CAM Subsystem
          </div>

        </div>

      </div>
    </div>
  );
}
