'use client';

/**
 * 📊 Industrial Project & Manufacturing Lifecycle Simulator
 * Standards: ISO 14067 (Carbon footprint), ISO 22400 (Manufacturing KPIs), aPriori should-cost methodology
 */

import React, { useState } from 'react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import {
  DollarSign,
  Clock,
  Leaf,
  TrendingUp,
  Download,
  PieChart,
  ShieldCheck,
  BarChart3,
  Factory,
  Layers,
  Cpu,
  FileSpreadsheet,
} from 'lucide-react';

export function ProjectSimulator() {
  const { language } = useI18nStore();

  const [batchSize, setBatchSize] = useState<number>(500);
  const [materialType, setMaterialType] = useState<'al_7075' | 'al_6061' | 'steel_42crmo4' | 'recycled_al'>('al_6061');
  const [partMassKg, setPartMassKg] = useState<number>(2.4);
  const [targetMarginPct, setTargetMarginPct] = useState<number>(35);
  const [machineHourRate, setMachineHourRate] = useState<number>(85); // $/hour
  const [cycleTimeMin, setCycleTimeMin] = useState<number>(14.5); // Minutes per part

  // Material rates & carbon intensity (ISO 14067)
  const materialPrices: Record<string, { name: string; pricePerKg: number; co2PerKg: number }> = {
    al_7075: { name: 'Aluminium 7075-T6 (Aerospace)', pricePerKg: 7.2, co2PerKg: 11.5 },
    al_6061: { name: 'Aluminium 6061-T6 (Industrial)', pricePerKg: 4.8, co2PerKg: 9.8 },
    steel_42crmo4: { name: '42CrMo4 Alloy Steel (DIN 1.7225)', pricePerKg: 3.2, co2PerKg: 2.7 },
    recycled_al: { name: 'Circular Recycled Low-Carbon Al', pricePerKg: 5.1, co2PerKg: 2.1 },
  };

  const matInfo = materialPrices[materialType];

  // Billet calculation (Scrap factor ~ 1.55 for CNC subtractive milling)
  const scrapFactor = 1.55;
  const rawBilletMassKg = Number((partMassKg * scrapFactor).toFixed(2));

  // Should-cost breakdown
  const rawMaterialCost = Number((rawBilletMassKg * matInfo.pricePerKg).toFixed(2));
  const machiningCost = Number(((cycleTimeMin / 60) * machineHourRate).toFixed(2));
  const toolingWearCost = 2.5;
  const energyKwhPerPart = Number(((cycleTimeMin / 60) * 16.5).toFixed(2)); // 16.5 kW average spindle power
  const energyCost = Number((energyKwhPerPart * 0.16).toFixed(2)); // $0.16 / kWh
  const qualityInspectionCost = 1.2;

  const unitProductionCost = Number(
    (rawMaterialCost + machiningCost + toolingWearCost + energyCost + qualityInspectionCost).toFixed(2)
  );
  const suggestedSellingPrice = Number((unitProductionCost * (1 + targetMarginPct / 100)).toFixed(2));
  const totalProjectRevenue = Number((suggestedSellingPrice * batchSize).toFixed(2));
  const totalProjectCost = Number((unitProductionCost * batchSize).toFixed(2));
  const totalProjectProfit = Number((totalProjectRevenue - totalProjectCost).toFixed(2));

  // Scheduling & Lead Time
  const totalMachiningHours = Number(((cycleTimeMin * batchSize) / 60).toFixed(1));
  const factoryProductionDays = Number((totalMachiningHours / 20).toFixed(1)); // 20 hours/day active production

  // Carbon Accounting (ISO 14067)
  const materialCarbonKg = Number((rawBilletMassKg * matInfo.co2PerKg).toFixed(2));
  const energyCarbonKg = Number((energyKwhPerPart * 0.42).toFixed(2)); // 0.42 kg CO2 / kWh
  const unitCarbonKg = Number((materialCarbonKg + energyCarbonKg).toFixed(2));
  const totalBatchCarbonTons = Number(((unitCarbonKg * batchSize) / 1000).toFixed(2));

  const handleExportReport = () => {
    const report = `
================================================================================
                    ALUCAD OS — INDUSTRIAL PROJECT SIMULATION REPORT
================================================================================
Project:                 AluCAD Manufacturing Feasibility & Should-Cost Study
Batch Size:              ${batchSize} Units
Selected Material:       ${matInfo.name}
Finished Part Mass:      ${partMassKg} kg (Raw Billet Mass: ${rawBilletMassKg} kg)
Standard:                ISO 22400 (KPIs) · ISO 14067 (Carbon Accounting)

1. SHOULD-COST BREAKDOWN (PER UNIT)
--------------------------------------------------------------------------------
- Raw Material:          $${rawMaterialCost} / unit
- 5-Axis CNC Machining:  $${machiningCost} / unit (${cycleTimeMin} min @ $${machineHourRate}/hr)
- Tooling Wear:          $${toolingWearCost} / unit
- Electricity (Energy):  $${energyCost} / unit (${energyKwhPerPart} kWh)
- Quality & Metrology:   $${qualityInspectionCost} / unit
--------------------------------------------------------------------------------
UNIT MANUFACTURING COST: $${unitProductionCost}
TARGET MARGIN (%):       ${targetMarginPct}%
SUGGESTED SELLING PRICE: $${suggestedSellingPrice}
TOTAL PROJECT REVENUE:   $${totalProjectRevenue.toLocaleString()}
TOTAL PROJECT PROFIT:    $${totalProjectProfit.toLocaleString()}

2. PRODUCTION SCHEDULING (FACTORY CAPACITY)
--------------------------------------------------------------------------------
Total Machine Hours:     ${totalMachiningHours} Hours
Estimated Lead Time:     ${factoryProductionDays} Days (20 hrs/day operating rate)
Bottleneck Station:      5-Axis CNC Roughing Pocket Cycle

3. ISO 14067 CARBON FOOTPRINT (ESG METRICS)
--------------------------------------------------------------------------------
Material Extraction CO2: ${materialCarbonKg} kg CO2e / unit
Machining Energy CO2:    ${energyCarbonKg} kg CO2e / unit
Unit Carbon Footprint:   ${unitCarbonKg} kg CO2e / unit
Total Batch Carbon:      ${totalBatchCarbonTons} Tons CO2e
================================================================================
Report Generated by AluCAD OS (https://www.alucalculator.com)
    `.trim();

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AluCAD_Project_Simulation_${batchSize}_units.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-0)] text-[var(--ink)] font-mono select-none overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* ─── HEADER BAR ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              {t12(language, 'Project Lifecycle & Should-Cost Simulator', 'Proje Yaşam Döngüsü & Maliyet Simülatörü')}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-[var(--cyan)]/10 text-[var(--cyan)] border border-[var(--cyan)]/30">
              ISO 14067 · ISO 22400
            </span>
          </div>
          <p className="text-[11px] text-[var(--alu-dim)] mt-0.5">
            {t12(
              language,
              'Simulate manufacturing should-cost, factory capacity lead-time, and carbon emissions for CNC & robotic production batches.',
              'CNC ve robotik imalat partileri için birim maliyeti, fabrika kapasitesine bağlı teslim süresini ve karbon salımını simüle edin.'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportReport}
          className="px-3 py-1.5 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:bg-[var(--cyan-dim)] text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Download size={13} />
          <span>{t12(language, 'Export Report (.TXT)', 'Raporu İndir (.TXT)')}</span>
        </button>
      </div>

      {/* ─── TOP KPI SUMMARY CARDS ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[var(--alu-dim)]">
            <span>{t12(language, 'UNIT COST', 'BİRİM MALİYET')}</span>
            <DollarSign size={13} className="text-[var(--cyan)]" />
          </div>
          <div className="text-xl font-bold text-white font-mono">${unitProductionCost}</div>
          <div className="text-[9px] text-[var(--alu-dim)]">
            {t12(language, 'Target Price:', 'Hedef Satış:')} <span className="text-emerald-400 font-bold">${suggestedSellingPrice}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[var(--alu-dim)]">
            <span>{t12(language, 'TOTAL PROFIT', 'TOPLAM KÂR')}</span>
            <TrendingUp size={13} className="text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">${totalProjectProfit.toLocaleString()}</div>
          <div className="text-[9px] text-[var(--alu-dim)]">
            {t12(language, 'Margin:', 'Kâr Marjı:')} <span className="font-bold text-white">%{targetMarginPct}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[var(--alu-dim)]">
            <span>{t12(language, 'FACTORY LEAD TIME', 'ÜRETİM SÜRESİ')}</span>
            <Clock size={13} className="text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300 font-mono">{factoryProductionDays} {t12(language, 'Days', 'Gün')}</div>
          <div className="text-[9px] text-[var(--alu-dim)]">
            {totalMachiningHours} {t12(language, 'machine hours', 'tezgâh saati')}
          </div>
        </div>

        <div className="p-3.5 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[var(--alu-dim)]">
            <span>{t12(language, 'CARBON FOOTPRINT', 'KARBON AYAK İZİ')}</span>
            <Leaf size={13} className="text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-300 font-mono">{totalBatchCarbonTons} t CO₂e</div>
          <div className="text-[9px] text-[var(--alu-dim)]">
            {unitCarbonKg} kg / {t12(language, 'part', 'adet')} (ISO 14067)
          </div>
        </div>
      </div>

      {/* ─── SIMULATION PARAMETERS INPUT GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Card: Production & Batch Parameters */}
        <div className="p-4 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase border-b border-[var(--line)] pb-2">
            <Factory size={14} className="text-[var(--cyan)]" />
            <span>{t12(language, 'Batch & Production Parameters', 'Parti & Üretim Parametreleri')}</span>
          </div>

          <div className="space-y-3 text-[11px]">
            {/* Batch Size */}
            <div className="flex items-center justify-between">
              <span className="text-[var(--alu-dim)]">{t12(language, 'Batch Size (Units):', 'Parti Adedi (Adet):')}</span>
              <input
                type="number"
                min={10}
                max={50000}
                step={50}
                value={batchSize}
                onChange={(e) => setBatchSize(Math.max(1, Number(e.target.value)))}
                className="w-28 bg-[var(--bg-0)] border border-[var(--line)] text-white text-right font-bold px-2 py-1 rounded outline-none focus:border-[var(--cyan)]"
              />
            </div>

            {/* Material Selector */}
            <div className="flex items-center justify-between">
              <span className="text-[var(--alu-dim)]">{t12(language, 'Material Alloy:', 'Malzeme Alaşımı:')}</span>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value as any)}
                className="w-48 bg-[var(--bg-0)] border border-[var(--line)] text-white font-bold px-2 py-1 rounded outline-none focus:border-[var(--cyan)] text-[10px]"
              >
                {Object.entries(materialPrices).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Finished Part Mass */}
            <div className="flex items-center justify-between">
              <span className="text-[var(--alu-dim)]">{t12(language, 'Finished Part Mass (kg):', 'İşlenmiş Parça Ağırlığı (kg):')}</span>
              <input
                type="number"
                step={0.1}
                min={0.1}
                value={partMassKg}
                onChange={(e) => setPartMassKg(Math.max(0.05, Number(e.target.value)))}
                className="w-28 bg-[var(--bg-0)] border border-[var(--line)] text-white text-right font-bold px-2 py-1 rounded outline-none focus:border-[var(--cyan)]"
              />
            </div>

            {/* Cycle Time Per Part */}
            <div className="flex items-center justify-between">
              <span className="text-[var(--alu-dim)]">{t12(language, '5-Axis CNC Cycle Time (min):', '5-Eksen CNC Çevrim Süresi (dk):')}</span>
              <input
                type="number"
                step={0.5}
                min={1}
                value={cycleTimeMin}
                onChange={(e) => setCycleTimeMin(Math.max(0.5, Number(e.target.value)))}
                className="w-28 bg-[var(--bg-0)] border border-[var(--line)] text-white text-right font-bold px-2 py-1 rounded outline-none focus:border-[var(--cyan)]"
              />
            </div>
          </div>
        </div>

        {/* Right Card: Financial & Rate Parameters */}
        <div className="p-4 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase border-b border-[var(--line)] pb-2">
            <DollarSign size={14} className="text-emerald-400" />
            <span>{t12(language, 'Financial Rates & Margin', 'Maliyet Oranları & Kâr')}</span>
          </div>

          <div className="space-y-3 text-[11px]">
            {/* Machine Hour Rate */}
            <div className="flex items-center justify-between">
              <span className="text-[var(--alu-dim)]">{t12(language, 'CNC Machine Hourly Rate ($/hr):', 'CNC Tezgâh Saat Ücreti ($/saat):')}</span>
              <input
                type="number"
                min={20}
                max={500}
                step={5}
                value={machineHourRate}
                onChange={(e) => setMachineHourRate(Math.max(1, Number(e.target.value)))}
                className="w-28 bg-[var(--bg-0)] border border-[var(--line)] text-white text-right font-bold px-2 py-1 rounded outline-none focus:border-[var(--cyan)]"
              />
            </div>

            {/* Target Profit Margin */}
            <div className="flex items-center justify-between">
              <span className="text-[var(--alu-dim)]">{t12(language, 'Target Profit Margin (%):', 'Hedef Kâr Marjı (%):')}</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={5}
                  max={80}
                  value={targetMarginPct}
                  onChange={(e) => setTargetMarginPct(Number(e.target.value))}
                  className="w-24 accent-[var(--cyan)]"
                />
                <span className="w-12 text-right font-bold text-emerald-400">%{targetMarginPct}</span>
              </div>
            </div>

            {/* Billet Stock Mass Calculated */}
            <div className="flex items-center justify-between text-[10px] pt-1">
              <span className="text-[var(--alu-dim)]">{t12(language, 'Calculated Billet Mass:', 'Hesaplanan Kütük Ağırlığı:')}</span>
              <span className="font-bold text-slate-300">{rawBilletMassKg} kg ({scrapFactor}x scrap)</span>
            </div>

            {/* Energy Per Part */}
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[var(--alu-dim)]">{t12(language, 'Energy Consumed Per Part:', 'Parça Başı Elektrik Tüketimi:')}</span>
              <span className="font-bold text-slate-300">{energyKwhPerPart} kWh (${energyCost})</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DETAILED COST BREAKDOWN TABLE ─── */}
      <div className="p-4 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-3">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2 text-xs font-bold text-white uppercase">
          <div className="flex items-center gap-2">
            <PieChart size={14} className="text-[var(--cyan)]" />
            <span>{t12(language, 'Detailed Unit Cost Stack (Should-Cost)', 'Detaylı Birim Maliyet Kırılımı')}</span>
          </div>
          <span className="text-[10px] text-[var(--alu-dim)]">ISO 22400 · VDI 2230</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-white/5 text-[9.5px] text-[var(--alu-dim)] uppercase">
                <th className="py-2">{t12(language, 'Cost Center', 'Maliyet Kalemi')}</th>
                <th className="py-2">{t12(language, 'Basis / Metric', 'Dayanak / Metrik')}</th>
                <th className="py-2 text-right">{t12(language, 'Unit Cost ($)', 'Birim Tutar ($)')}</th>
                <th className="py-2 text-right">{t12(language, 'Batch Total ($)', 'Parti Toplamı ($)')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[10.5px]">
              <tr>
                <td className="py-2 font-bold text-white">{t12(language, 'Raw Billet Material', 'Ham Kütük Malzeme')}</td>
                <td className="py-2 text-[var(--alu-dim)]">{rawBilletMassKg} kg @ ${matInfo.pricePerKg}/kg</td>
                <td className="py-2 text-right font-mono">${rawMaterialCost}</td>
                <td className="py-2 text-right font-mono">${(rawMaterialCost * batchSize).toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-2 font-bold text-white">{t12(language, '5-Axis CNC Machining', '5-Eksen CNC İşleme')}</td>
                <td className="py-2 text-[var(--alu-dim)]">{cycleTimeMin} min @ ${machineHourRate}/hr</td>
                <td className="py-2 text-right font-mono">${machiningCost}</td>
                <td className="py-2 text-right font-mono">${(machiningCost * batchSize).toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-2 font-bold text-white">{t12(language, 'Tooling Wear & Carbide Inserts', 'Kesici Takım Aşınması')}</td>
                <td className="py-2 text-[var(--alu-dim)]">End-mill / ball nose depreciation</td>
                <td className="py-2 text-right font-mono">${toolingWearCost}</td>
                <td className="py-2 text-right font-mono">${(toolingWearCost * batchSize).toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-2 font-bold text-white">{t12(language, 'Electricity & Factory Power', 'Elektrik Tüketimi')}</td>
                <td className="py-2 text-[var(--alu-dim)]">{energyKwhPerPart} kWh @ $0.16/kWh</td>
                <td className="py-2 text-right font-mono">${energyCost}</td>
                <td className="py-2 text-right font-mono">${(energyCost * batchSize).toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-2 font-bold text-white">{t12(language, 'CMM Metrology & Inspection', 'CMM Kalite Kontrol')}</td>
                <td className="py-2 text-[var(--alu-dim)]">Coordinate measuring / probe check</td>
                <td className="py-2 text-right font-mono">${qualityInspectionCost}</td>
                <td className="py-2 text-right font-mono">${(qualityInspectionCost * batchSize).toLocaleString()}</td>
              </tr>
              <tr className="border-t-2 border-[var(--cyan)]/40 font-bold text-[11.5px]">
                <td className="py-2.5 text-[var(--cyan)]">{t12(language, 'TOTAL UNIT SHOULD-COST', 'TOPLAM BİRİM İMALAT MALİYETİ')}</td>
                <td className="py-2.5 text-[var(--alu-dim)]">—</td>
                <td className="py-2.5 text-right font-mono text-white">${unitProductionCost}</td>
                <td className="py-2.5 text-right font-mono text-white">${totalProjectCost.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ProjectSimulator;
