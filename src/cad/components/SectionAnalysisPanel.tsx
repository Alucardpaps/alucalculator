/**
 * AluCAD — Cross-Section Engineering & Inertia Analysis Panel
 * Computes exact 2D profile properties using Green's Theorem & Shoelace integration:
 * - Area (A), Centroid (cx, cy), Bounding Envelope
 * - Moments of Inertia (Ix, Iy, J, Ixy)
 * - Section Modulus (Wx, Wy)
 * - Radii of Gyration (rx, ry)
 * - Linear Profile Weight (Al 6061, Steel S235, Inox 304)
 * Cites: DIN EN 755-2 / ISO 6892-1 / VDI 2230
 */

'use client';

import React, { useMemo, useState } from 'react';
import { useCadStore } from '../store/cadStore';
import { assembleRegions, largestRegion } from '../geometry/contourAssembler';
import { Copy, Check, FileDown, Layers, Box, Cpu, AlertTriangle, RefreshCw } from 'lucide-react';
import { CrossSectionIcon } from './CadIcons';
import { CrossModuleBridge } from '@/system/crossModuleBridge';
import { useI18nStore } from '@/store/i18nStore';
import { getCadTranslations } from '@/locales/cadTranslations';
import { t12 } from '@/locales/t12';

export function SectionAnalysisPanel() {
  const { entities, selectedIds } = useCadStore();
  const language = useI18nStore((s) => s.language);
  const tCad = useMemo(() => getCadTranslations(language), [language]);
  const [copied, setCopied] = useState(false);

  // Compute regions from either selection or entire canvas
  const analysisTarget = useMemo(() => {
    const targetEntities = selectedIds.length > 0
      ? entities.filter((e) => selectedIds.includes(e.id))
      : entities;

    const regions = assembleRegions(targetEntities);
    const primary = largestRegion(targetEntities);

    return {
      regions,
      primary,
      isSelection: selectedIds.length > 0,
      entityCount: targetEntities.length,
    };
  }, [entities, selectedIds]);

  const sec = analysisTarget.primary?.section;

  // Mass calculations in kg/m: (Area mm² * Density g/cm³) / 1000
  const areaMm2 = sec?.area || 0;
  const areaCm2 = areaMm2 / 100;
  const massAlKgM = (areaMm2 * 2.70) / 1000;
  const massSteelKgM = (areaMm2 * 7.85) / 1000;
  const massInoxKgM = (areaMm2 * 8.00) / 1000;

  // Moments converted to cm⁴ and cm³
  const ixCm4 = (sec?.Ix || 0) / 1e4;
  const iyCm4 = (sec?.Iy || 0) / 1e4;
  const jCm4 = (sec?.J || 0) / 1e4;
  const ixyCm4 = (sec?.Ixy || 0) / 1e4;
  const wxCm3 = (sec?.Wx || 0) / 1e3;
  const wyCm3 = (sec?.Wy || 0) / 1e3;

  const widthMm = sec ? Math.abs(sec.xmax - sec.xmin) : 0;
  const heightMm = sec ? Math.abs(sec.ymax - sec.ymin) : 0;

  const handleCopyReport = () => {
    if (!sec) return;
    const report = `=== AluCAD Section Analysis Report (ISO/DIN) ===
Target: ${analysisTarget.isSelection ? 'Selected Entities' : 'Full Canvas'}
Contour Count: ${analysisTarget.regions.length}

[GEOMETRIC PROPERTIES]
Area (A): ${areaMm2.toFixed(2)} mm² (${areaCm2.toFixed(4)} cm²)
Perimeter (P): ${sec.perimeter.toFixed(2)} mm
Bounding Envelope: ${widthMm.toFixed(2)} mm × ${heightMm.toFixed(2)} mm
Centroid: X=${sec.cx.toFixed(3)} mm, Y=${sec.cy.toFixed(3)} mm

[SECOND MOMENT OF AREA (INERTIA)]
Ix: ${ixCm4.toFixed(4)} cm⁴ (${sec.Ix.toFixed(1)} mm⁴)
Iy: ${iyCm4.toFixed(4)} cm⁴ (${sec.Iy.toFixed(1)} mm⁴)
Polar Moment (J): ${jCm4.toFixed(4)} cm⁴
Product of Inertia (Ixy): ${ixyCm4.toFixed(4)} cm⁴

[SECTION MODULI (MUKAVEMET MOMENTİ)]
Wx (Elastic): ${wxCm3.toFixed(4)} cm³
Wy (Elastic): ${wyCm3.toFixed(4)} cm³

[RADII OF GYRATION (ATALET YARIÇAPI)]
rx: ${sec.rx.toFixed(3)} mm
ry: ${sec.ry.toFixed(3)} mm

[LINEAR MASS ESTIMATION]
Al 6061-T6 (2.70 g/cm³): ${massAlKgM.toFixed(4)} kg/m
Steel S235JR (7.85 g/cm³): ${massSteelKgM.toFixed(4)} kg/m
Inox AISI 304 (8.00 g/cm³): ${massInoxKgM.toFixed(4)} kg/m
=================================================`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    if (!sec) return;
    const csvRows = [
      'Property,Value,Unit,Standard',
      `Area,${areaMm2.toFixed(4)},mm2,ISO 6892`,
      `Area_cm2,${areaCm2.toFixed(6)},cm2,ISO 6892`,
      `Perimeter,${sec.perimeter.toFixed(4)},mm,ISO 2768`,
      `Width,${widthMm.toFixed(4)},mm,DIN 755`,
      `Height,${heightMm.toFixed(4)},mm,DIN 755`,
      `Centroid_X,${sec.cx.toFixed(4)},mm,ISO 2768`,
      `Centroid_Y,${sec.cy.toFixed(4)},mm,ISO 2768`,
      `Ix,${ixCm4.toFixed(6)},cm4,DIN EN 1993`,
      `Iy,${iyCm4.toFixed(6)},cm4,DIN EN 1993`,
      `J_Polar,${jCm4.toFixed(6)},cm4,DIN EN 1993`,
      `Wx,${wxCm3.toFixed(6)},cm3,DIN EN 1993`,
      `Wy,${wyCm3.toFixed(6)},cm3,DIN EN 1993`,
      `rx,${sec.rx.toFixed(4)},mm,DIN EN 1993`,
      `ry,${sec.ry.toFixed(4)},mm,DIN EN 1993`,
      `Mass_Al_6061,${massAlKgM.toFixed(6)},kg/m,DIN EN 755-2`,
      `Mass_Steel_S235,${massSteelKgM.toFixed(6)},kg/m,DIN EN 10025`,
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alucad_section_analysis_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-1)] text-[var(--alu)] text-xs font-mono select-none overflow-y-auto custom-scrollbar">
      {/* Panel Header */}
      <div className="p-3 border-b border-white/5 bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <CrossSectionIcon size={16} />
          <span className="uppercase tracking-wider">{tCad.sectionAnalysis.title}</span>
        </div>
        <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
          DIN / ISO
        </span>
      </div>

      {/* Target Status Banner */}
      <div className="px-3 py-2 bg-white/[0.02] border-b border-white/5 flex items-center justify-between text-[11px]">
        <span className="text-slate-400">
          {t12(language, 'Target: ', 'Hedef: ')}
          <strong className="text-white">
            {analysisTarget.isSelection
              ? `${t12(language, 'Selected', 'Seçili')} (${selectedIds.length})`
              : t12(language, 'Full Canvas', 'Tüm Çizim')}
          </strong>
        </span>
        <span className="text-cyan-400">
          {analysisTarget.regions.length} {analysisTarget.regions.length === 1 ? t12(language, 'Closed Loop', 'Kapalı Kontur') : t12(language, 'Closed Loops', 'Kapalı Kontur')}
        </span>
      </div>

      {!sec ? (
        <div className="flex-1 p-5 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)]">
            <AlertTriangle size={22} />
          </div>
          <div className="space-y-1 max-w-[220px]">
            <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">{tCad.sectionAnalysis.noClosedLoop}</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {t12(language, 'Draw a closed profile (Circle, Rectangle, Polygon, T-Slot, or joined lines) for inertia and cross-section analysis.', 'Atalet ve kesit hesabı için kapalı bir profil (Daire, Dikdörtgen, Poligon, T-Slot veya birleşen çizgiler) çizin.')}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3 space-y-3.5 flex-1">
          {/* Section Dimensions Card */}
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center justify-between">
              <span>{t12(language, 'Geometry & Dimensions', 'Geometri & Boyutlar')}</span>
              <span className="text-slate-500 font-normal">Shoelace/Green</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-slate-500 block text-[9px] uppercase">{tCad.sectionAnalysis.area}</span>
                <span className="text-white font-bold text-sm">{areaMm2.toFixed(1)}</span>
                <span className="text-slate-400 text-[9px] ml-1">mm²</span>
                <div className="text-[10px] text-cyan-400/80">{areaCm2.toFixed(3)} cm²</div>
              </div>

              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-slate-500 block text-[9px] uppercase">{tCad.sectionAnalysis.perimeter}</span>
                <span className="text-white font-bold text-sm">{sec.perimeter.toFixed(1)}</span>
                <span className="text-slate-400 text-[9px] ml-1">mm</span>
              </div>

              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-slate-500 block text-[9px] uppercase">{t12(language, 'Bounding Envelope (W × H)', 'Zarf (W × H)')}</span>
                <span className="text-white font-bold">{widthMm.toFixed(1)} × {heightMm.toFixed(1)}</span>
                <span className="text-slate-400 text-[9px] ml-1">mm</span>
              </div>

              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-slate-500 block text-[9px] uppercase">{tCad.sectionAnalysis.centroid}</span>
                <span className="text-white font-bold">{sec.cx.toFixed(1)}, {sec.cy.toFixed(1)}</span>
                <span className="text-slate-400 text-[9px] ml-1">mm</span>
              </div>
            </div>
          </div>

          {/* Second Moment of Area (Inertia) Card */}
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center justify-between">
              <span>{tCad.sectionAnalysis.momentOfInertia}</span>
              <span className="text-slate-500 font-normal">cm⁴</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-slate-500 block text-[9px] uppercase">{t12(language, 'Axis Ix', 'Eksen Ix')}</span>
                <span className="text-white font-bold text-sm">{ixCm4.toFixed(3)}</span>
                <span className="text-slate-400 text-[9px] ml-1">cm⁴</span>
              </div>

              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-slate-500 block text-[9px] uppercase">{t12(language, 'Axis Iy', 'Eksen Iy')}</span>
                <span className="text-white font-bold text-sm">{iyCm4.toFixed(3)}</span>
                <span className="text-slate-400 text-[9px] ml-1">cm⁴</span>
              </div>

              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-slate-500 block text-[9px] uppercase">{tCad.sectionAnalysis.polarMoment}</span>
                <span className="text-white font-bold">{jCm4.toFixed(3)}</span>
                <span className="text-slate-400 text-[9px] ml-1">cm⁴</span>
              </div>

              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-slate-500 block text-[9px] uppercase">{t12(language, 'Product of Inertia (Ixy)', 'Çarpım (Ixy)')}</span>
                <span className="text-white font-bold">{ixyCm4.toFixed(3)}</span>
                <span className="text-slate-400 text-[9px] ml-1">cm⁴</span>
              </div>
            </div>
          </div>

          {/* Section Modulus & Gyration Card */}
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center justify-between">
              <span>{tCad.sectionAnalysis.sectionModulus}</span>
              <span className="text-slate-500 font-normal">DIN EN 1993</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-slate-500 block text-[9px] uppercase">{t12(language, 'Section Modulus Wx', 'Mukavemet Wx')}</span>
                <span className="text-white font-bold">{wxCm3.toFixed(3)}</span>
                <span className="text-slate-400 text-[9px] ml-1">cm³</span>
              </div>

              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-slate-500 block text-[9px] uppercase">{t12(language, 'Section Modulus Wy', 'Mukavemet Wy')}</span>
                <span className="text-white font-bold">{wyCm3.toFixed(3)}</span>
                <span className="text-slate-400 text-[9px] ml-1">cm³</span>
              </div>

              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-slate-500 block text-[9px] uppercase">{t12(language, 'Radius of Gyration rx', 'Yarıçap rx')}</span>
                <span className="text-white font-bold">{sec.rx.toFixed(2)}</span>
                <span className="text-slate-400 text-[9px] ml-1">mm</span>
              </div>

              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-slate-500 block text-[9px] uppercase">{t12(language, 'Radius of Gyration ry', 'Yarıçap ry')}</span>
                <span className="text-white font-bold">{sec.ry.toFixed(2)}</span>
                <span className="text-slate-400 text-[9px] ml-1">mm</span>
              </div>
            </div>
          </div>

          {/* Linear Weight per Meter Card */}
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 space-y-2">
            <div className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest flex items-center justify-between">
              <span>{t12(language, 'Linear Profile Weight', 'Birim Metretül Ağırlığı')}</span>
              <span className="text-cyan-400 font-mono text-[9px]">kg/m</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-slate-300">Al 6061-T6 (2.70 g/cm³)</span>
                <strong className="text-cyan-300 font-bold">{massAlKgM.toFixed(3)} kg/m</strong>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-slate-300">{t12(language, 'Steel S235JR (7.85 g/cm³)', 'Çelik S235JR (7.85 g/cm³)')}</span>
                <strong className="text-slate-200 font-bold">{massSteelKgM.toFixed(3)} kg/m</strong>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-slate-300">{t12(language, 'Stainless Steel 304 (8.00 g/cm³)', 'Paslanmaz 304 (8.00 g/cm³)')}</span>
                <strong className="text-slate-200 font-bold">{massInoxKgM.toFixed(3)} kg/m</strong>
              </div>
            </div>
          </div>

          {/* Action Strip */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyReport}
              className="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 text-[10px] font-bold transition-all"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? t12(language, 'Copied!', 'Kopyalandı!') : t12(language, 'Copy Report', 'Raporu Kopyala')}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="py-2 px-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center gap-1.5 text-[10px] font-bold transition-all"
            >
              <FileDown size={13} />
              <span>{t12(language, 'Download CSV', 'CSV İndir')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
