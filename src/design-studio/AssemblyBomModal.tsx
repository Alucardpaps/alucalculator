'use client';

/**
 * 📊 ASSEMBLY BILL OF MATERIALS (BOM) & SUSTAINABILITY AUDIT MODAL
 * Industrial-grade Assembly BOM, Should-Cost Estimation and Carbon Footprint (ISO 14067)
 */

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  X,
  Download,
  Copy,
  Check,
  Coins,
  Leaf,
  Scale,
  Layers,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  GripHorizontal,
  RotateCcw,
} from 'lucide-react';
import { useDesignStore, type DesignPart } from './designStore';
import { buildAssemblyBom, type BomLine } from './bom';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { ENGINEERING_MATERIALS } from './materialsEngine';
import { useDraggableDialog } from './useDraggableDialog';

interface AssemblyBomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Cradle-to-gate carbon emissions (kg CO₂e per kg material) - ISO 14067 / Ecoinvent 3.8
const CARBON_EMISSIONS_KG_CO2_PER_KG: Record<string, number> = {
  'al-6061-t6': 8.6,
  'al-6082-t6': 8.4,
  'al-7075-t6': 9.2,
  'steel-s235jr': 1.85,
  'steel-s355jr': 1.95,
  'steel-c45': 2.1,
  'steel-42crmo4': 2.35,
  'steel-100cr6': 2.5,
  'stainless-304': 4.8,
  'stainless-316': 5.4,
  'brass-ms58': 3.9,
  'bronze-cusn8': 4.2,
  'pom-c': 3.1,
  default: 2.5,
};

// Raw material base cost benchmark (€/kg) - European Metals Index 2026
const MATERIAL_COST_EUR_PER_KG: Record<string, number> = {
  'al-6061-t6': 5.2,
  'al-6082-t6': 5.4,
  'al-7075-t6': 8.5,
  'steel-s235jr': 1.65,
  'steel-s355jr': 1.85,
  'steel-c45': 2.2,
  'steel-42crmo4': 3.4,
  'steel-100cr6': 6.5,
  'stainless-304': 4.9,
  'stainless-316': 6.8,
  'brass-ms58': 7.2,
  'bronze-cusn8': 9.5,
  'pom-c': 6.0,
  default: 3.5,
};

export function AssemblyBomModal({ isOpen, onClose }: AssemblyBomModalProps) {
  const { language } = useI18nStore();
  const parts = useDesignStore((s) => s.parts);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  // Compute BOM
  const bomData = useMemo(() => {
    return buildAssemblyBom(parts);
  }, [parts]);

  // Filtered lines
  const filteredLines = useMemo(() => {
    if (!search.trim()) return bomData.lines;
    const q = search.toLowerCase();
    return bomData.lines.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.kind.toLowerCase().includes(q) ||
        l.material.toLowerCase().includes(q)
    );
  }, [bomData.lines, search]);

  // Carbon & Should-Cost Analytics
  const analytics = useMemo(() => {
    let totalCarbonKg = 0;
    let totalMaterialCostEur = 0;
    let totalMachiningCostEur = 0;

    for (const line of bomData.lines) {
      // Find matching part to extract materialId & processing ops
      const part = parts.find((p) => p.id === line.id || p.name === line.name);
      const matId = part?.materialId || 'al-6061-t6';

      const co2Factor = CARBON_EMISSIONS_KG_CO2_PER_KG[matId] || CARBON_EMISSIONS_KG_CO2_PER_KG.default;
      const eurFactor = MATERIAL_COST_EUR_PER_KG[matId] || MATERIAL_COST_EUR_PER_KG.default;

      totalCarbonKg += line.massKg * co2Factor;
      totalMaterialCostEur += line.massKg * eurFactor;

      // Estimated machining/preparation cost based on holes, cuts, and component type
      const nFeatures = (part?.holes?.length || 0) + (part?.cuts?.length || 0);
      const baseComponentProcessCost = line.kind === 'gear-blank' ? 12 : line.kind === 'bearing-race' ? 4 : 2;
      totalMachiningCostEur += (baseComponentProcessCost + nFeatures * 1.5) * line.qty;
    }

    const totalShouldCostEur = totalMaterialCostEur + totalMachiningCostEur;

    return {
      totalCarbonKg: Number(totalCarbonKg.toFixed(2)),
      totalMaterialCostEur: Number(totalMaterialCostEur.toFixed(2)),
      totalMachiningCostEur: Number(totalMachiningCostEur.toFixed(2)),
      totalShouldCostEur: Number(totalShouldCostEur.toFixed(2)),
      totalItemsCount: bomData.lines.reduce((acc, l) => acc + l.qty, 0),
    };
  }, [bomData.lines, parts]);

  const { position, resetPosition, isDragging, elementRef, dragHandleProps } = useDraggableDialog({
    initialPosition: () => {
      if (typeof window === 'undefined') return { x: 100, y: 50 };
      const isDesktop = window.innerWidth >= 768;
      const modalWidth = Math.min(1024, window.innerWidth - 32);
      return {
        x: isDesktop ? Math.max(16, (window.innerWidth - modalWidth) / 2) : 16,
        y: 40,
      };
    },
  });

  if (!isOpen) return null;

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Item No',
      'Name',
      'Kind',
      'Quantity',
      'Material',
      'Length (mm)',
      'Section',
      'Unit Mass (kg)',
      'Total Mass (kg)',
      'Est. CO2e (kg)',
      'Est. Cost (EUR)',
    ];

    const rows = bomData.lines.map((l) => {
      const part = parts.find((p) => p.id === l.id || p.name === l.name);
      const matId = part?.materialId || 'al-6061-t6';
      const co2Factor = CARBON_EMISSIONS_KG_CO2_PER_KG[matId] || CARBON_EMISSIONS_KG_CO2_PER_KG.default;
      const eurFactor = MATERIAL_COST_EUR_PER_KG[matId] || MATERIAL_COST_EUR_PER_KG.default;

      const co2 = (l.massKg * co2Factor).toFixed(2);
      const cost = (l.massKg * eurFactor).toFixed(2);
      const unitMass = (l.massKg / l.qty).toFixed(3);

      return [
        l.itemNo,
        `"${l.name.replace(/"/g, '""')}"`,
        l.kind,
        l.qty,
        `"${l.material.replace(/"/g, '""')}"`,
        l.lengthMm || '',
        l.section || '',
        unitMass,
        l.massKg.toFixed(3),
        co2,
        cost,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AluCAD_Assembly_BOM_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Summary Table to Clipboard
  const handleCopySummary = () => {
    const text = [
      `=== AluCAD OS Assembly BOM ===`,
      `Total Parts: ${analytics.totalItemsCount} pcs (${bomData.lines.length} unique items)`,
      `Total Mass: ${bomData.totalMassKg.toFixed(2)} kg`,
      `Est. Should-Cost: €${analytics.totalShouldCostEur.toFixed(2)} (Material: €${analytics.totalMaterialCostEur.toFixed(2)}, Mfg: €${analytics.totalMachiningCostEur.toFixed(2)})`,
      `Carbon Footprint: ${analytics.totalCarbonKg.toFixed(2)} kg CO₂e (ISO 14067)`,
      `----------------------------------------`,
      ...bomData.lines.map(
        (l) => `#${l.itemNo} | ${l.name} | Qty: ${l.qty} | ${l.material} | ${l.massKg.toFixed(2)} kg`
      ),
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 select-none"
        onClick={onClose}
      />

      <div
        ref={elementRef}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        className={`fixed z-50 w-[calc(100vw-2rem)] max-w-5xl max-h-[92vh] flex flex-col rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--bg-1)] shadow-2xl overflow-hidden font-mono text-xs select-none transition-shadow ${
          isDragging ? 'ring-2 ring-[var(--cyan)] shadow-[0_25px_70px_rgba(58,208,230,0.4)]' : ''
        }`}
      >
        {/* Header */}
        <div
          {...dragHandleProps}
          onDoubleClick={resetPosition}
          title={t12(language, 'Drag to Move · Double Click to Reset', 'Sürükleyip Taşı · Sıfırlamak İçin Çift Tıkla')}
          className="group flex items-center justify-between px-5 py-3.5 border-b border-[var(--line)] bg-[var(--bg-2)] shrink-0 cursor-grab active:cursor-grabbing hover:bg-[var(--bg-2)]/80 transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-[var(--radius-s)] bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 text-[var(--cyan)] shrink-0">
              <FileSpreadsheet size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold tracking-wider text-white flex items-center gap-2 truncate">
                <span className="truncate">{t12(language, 'ASSEMBLY BILL OF MATERIALS', 'MONTAJ ÜRÜN AĞACI (BOM)')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-3)] border border-[var(--line)] text-[var(--cyan)] shrink-0">
                  ISO 14067
                </span>
              </h2>
              <p className="text-[10px] text-[var(--alu-dim)] flex items-center gap-1">
                <GripHorizontal size={11} className="text-slate-500 group-hover:text-cyan-400 shrink-0" />
                <span className="truncate">
                  {t12(
                    language,
                    'Deterministic mass rollup & carbon audit (Drag to reposition)',
                    'Deterministik kütle & karbon denetimi (Taşımak için sürükleyin)'
                  )}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={resetPosition}
              className="p-1.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] hover:bg-[var(--bg-3)] text-[var(--alu-dim)] hover:text-cyan-400 transition-colors cursor-pointer"
              title={t12(language, 'Reset Position', 'Konumu Sıfırla')}
            >
              <RotateCcw size={13} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] hover:bg-[var(--bg-3)] text-[var(--alu-dim)] hover:text-white transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Top KPI Cards (Mass, Cost, Carbon, Quantity) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 border-b border-[var(--line)] bg-[var(--bg-0)] shrink-0">
          <div className="p-3 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-2)] flex items-center gap-3">
            <div className="p-2 rounded-[var(--radius-s)] bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Scale size={18} />
            </div>
            <div>
              <div className="text-[10px] text-[var(--alu-dim)] uppercase tracking-wider">
                {t12(language, 'Total Mass', 'Toplam Kütle')}
              </div>
              <div className="text-base font-extrabold text-white">
                {bomData.totalMassKg.toFixed(2)} <span className="text-xs text-[var(--alu-dim)]">kg</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-2)] flex items-center gap-3">
            <div className="p-2 rounded-[var(--radius-s)] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Coins size={18} />
            </div>
            <div>
              <div className="text-[10px] text-[var(--alu-dim)] uppercase tracking-wider">
                {t12(language, 'Should-Cost', 'Tahmini Maliyet')}
              </div>
              <div className="text-base font-extrabold text-emerald-400">
                €{analytics.totalShouldCostEur.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-2)] flex items-center gap-3">
            <div className="p-2 rounded-[var(--radius-s)] bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Leaf size={18} />
            </div>
            <div>
              <div className="text-[10px] text-[var(--alu-dim)] uppercase tracking-wider">
                {t12(language, 'Carbon Footprint', 'Karbon Ayak İzi')}
              </div>
              <div className="text-base font-extrabold text-teal-400">
                {analytics.totalCarbonKg.toFixed(2)}{' '}
                <span className="text-[10px] text-[var(--alu-dim)]">kg CO₂e</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-2)] flex items-center gap-3">
            <div className="p-2 rounded-[var(--radius-s)] bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers size={18} />
            </div>
            <div>
              <div className="text-[10px] text-[var(--alu-dim)] uppercase tracking-wider">
                {t12(language, 'Components', 'Komponent Adedi')}
              </div>
              <div className="text-base font-extrabold text-amber-300">
                {analytics.totalItemsCount}{' '}
                <span className="text-[10px] text-[var(--alu-dim)]">({bomData.lines.length} kalem)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: Search & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 border-b border-[var(--line)] bg-[var(--bg-1)] shrink-0">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--alu-dim)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t12(language, 'Filter by part name, material or kind...', 'Parça adı, malzeme veya tür ara...')}
              className="w-full pl-8 pr-3 py-1.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] text-white placeholder-[var(--alu-dim)] text-[11px] focus:outline-none focus:border-[var(--cyan)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-white font-bold text-[11px] transition-colors cursor-pointer"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? t12(language, 'Copied!', 'Kopyalandı!') : t12(language, 'Copy Summary', 'Özeti Kopyala')}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:bg-[var(--cyan)]/90 text-black font-extrabold text-[11px] transition-all cursor-pointer"
            >
              <Download size={13} />
              <span>{t12(language, 'Export CSV', 'CSV İndir')}</span>
            </button>
          </div>
        </div>

        {/* BOM Table */}
        <div className="flex-1 overflow-auto custom-scrollbar p-0">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead className="sticky top-0 bg-[var(--bg-2)] border-b border-[var(--line)] text-[var(--alu-dim)] uppercase tracking-wider text-[10px] z-10">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">{t12(language, 'Part Name', 'Parça Adı')}</th>
                <th className="py-2.5 px-3">{t12(language, 'Kind', 'Tür')}</th>
                <th className="py-2.5 px-3 text-center">{t12(language, 'Qty', 'Adet')}</th>
                <th className="py-2.5 px-3">{t12(language, 'Material', 'Malzeme')}</th>
                <th className="py-2.5 px-3 text-right">{t12(language, 'Unit Mass', 'Birim Kütle')}</th>
                <th className="py-2.5 px-3 text-right">{t12(language, 'Total Mass', 'Top. Kütle')}</th>
                <th className="py-2.5 px-3 text-right">{t12(language, 'Est. CO₂e', 'ISO 14067 CO₂')}</th>
                <th className="py-2.5 px-3 text-right">{t12(language, 'Est. Cost', 'Maliyet')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] text-white">
              {filteredLines.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[var(--alu-dim)] italic">
                    {t12(language, 'No parts match the filter or assembly is empty.', 'Filtreye uygun parça bulunamadı veya montaj boş.')}
                  </td>
                </tr>
              ) : (
                filteredLines.map((line) => {
                  const part = parts.find((p) => p.id === line.id || p.name === line.name);
                  const matId = part?.materialId || 'al-6061-t6';
                  const co2Factor = CARBON_EMISSIONS_KG_CO2_PER_KG[matId] || CARBON_EMISSIONS_KG_CO2_PER_KG.default;
                  const eurFactor = MATERIAL_COST_EUR_PER_KG[matId] || MATERIAL_COST_EUR_PER_KG.default;
                  const itemCo2 = line.massKg * co2Factor;
                  const itemCost = line.massKg * eurFactor + (line.kind === 'gear-blank' ? 12 : 2) * line.qty;

                  return (
                    <tr key={`${line.id}-${line.itemNo}`} className="hover:bg-[var(--bg-2)]/60 transition-colors">
                      <td className="py-2.5 px-3 text-center text-[var(--alu-dim)] font-mono">{line.itemNo}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">
                        <div className="flex flex-col">
                          <span>{line.name}</span>
                          {line.section && <span className="text-[9.5px] text-[var(--alu-dim)]">{line.section}</span>}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded-[var(--radius-s)] bg-[var(--bg-3)] border border-[var(--line)] text-[10px] text-[var(--alu-dim)]">
                          {line.kind}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-amber-300">{line.qty}</td>
                      <td className="py-2.5 px-3 text-[var(--alu-dim)]">{line.material}</td>
                      <td className="py-2.5 px-3 text-right text-[var(--alu-dim)]">
                        {(line.massKg / line.qty).toFixed(3)} kg
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">{line.massKg.toFixed(3)} kg</td>
                      <td className="py-2.5 px-3 text-right font-mono text-teal-400">
                        {itemCo2.toFixed(2)} kg
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                        €{itemCost.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Audit Standards Note */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--line)] bg-[var(--bg-2)] text-[9.5px] text-[var(--alu-dim)] shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>ISO 14067:2018 Product Carbon Footprint · Ecoinvent 3.8 Database Rollup</span>
          </div>
          <div>AluCAD OS Deterministic CAD Engine</div>
        </div>
      </div>
    </>
  );
}
