'use client';

/**
 * 💰 FLOATING SHOULD-COST & CARBON FOOTPRINT HUD (V2)
 * Live calculation attached to the active 3D model mass, volume, and subtractive scrap factor.
 * Standards: ISO 14067 (Carbon Accounting), ISO 22400 (Manufacturing KPIs)
 */

import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Leaf,
  Clock,
  TrendingUp,
  Download,
  X,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useDesignStore } from '@/design-studio/designStore';
import { calculateAssemblyMassProperties } from '@/design-studio/materialsEngine';

interface CostOverlayHudProps {
  onClose?: () => void;
}

export function CostOverlayHud({ onClose }: CostOverlayHudProps) {
  const { language } = useI18nStore();
  const parts = useDesignStore((s) => s.parts);
  const selected = useDesignStore((s) => s.getSelected());

  const [batchSize, setBatchSize] = useState<number>(250);
  const [targetMarginPct, setTargetMarginPct] = useState<number>(30);
  const [machineHourRate, setMachineHourRate] = useState<number>(85); // $/hr

  // Calculate live mass properties from 3D parts
  const massProps = useMemo(() => {
    return calculateAssemblyMassProperties(parts);
  }, [parts]);

  const targetPartMass = selected ? (selected.params?.massKg || 1.8) : Math.max(0.2, massProps.massKg);
  const scrapFactor = 1.6; // Subtractive CNC milling billet multiplier
  const rawBilletMassKg = Number((targetPartMass * scrapFactor).toFixed(2));

  // Cycle time estimation based on part mass and complexity
  const cycleTimeMin = Number((8 + targetPartMass * 4.2).toFixed(1));

  // Should-cost breakdown
  const rawMatPricePerKg = 5.2; // $/kg 6061-T6
  const rawMaterialCost = Number((rawBilletMassKg * rawMatPricePerKg).toFixed(2));
  const machiningCost = Number(((cycleTimeMin / 60) * machineHourRate).toFixed(2));
  const toolingWearCost = 2.2;
  const energyKwh = Number(((cycleTimeMin / 60) * 14.5).toFixed(2));
  const energyCost = Number((energyKwh * 0.16).toFixed(2));
  const metrologyCost = 1.1;

  const unitCost = Number(
    (rawMaterialCost + machiningCost + toolingWearCost + energyCost + metrologyCost).toFixed(2)
  );
  const suggestedPrice = Number((unitCost * (1 + targetMarginPct / 100)).toFixed(2));
  const batchRevenue = Number((suggestedPrice * batchSize).toFixed(2));
  const batchProfit = Number(((suggestedPrice - unitCost) * batchSize).toFixed(2));

  // ISO 14067 Carbon footprint
  const matCarbonKg = Number((rawBilletMassKg * 9.8).toFixed(2)); // 9.8 kg CO2 / kg primary Al
  const energyCarbonKg = Number((energyKwh * 0.42).toFixed(2));
  const unitCarbonKg = Number((matCarbonKg + energyCarbonKg).toFixed(2));

  return (
    <div className="absolute top-3 right-4 z-30 w-80 max-w-[calc(100vw-2rem)] bg-[var(--bg-0)]/95 border border-[var(--line)] rounded-[var(--radius-m)] shadow-2xl font-mono text-[11px] text-[var(--ink)] animate-in slide-in-from-right-4 duration-200">
      {/* HUD Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--line)] bg-[var(--bg-1)] rounded-t-[var(--radius-m)]">
        <div className="flex items-center gap-1.5">
          <DollarSign size={14} className="text-emerald-400" />
          <span className="font-bold text-white text-[11px]">SHOULD-COST & ESG HUD</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[8px] px-1 py-0.2 rounded bg-black/40 text-emerald-400 font-bold border border-emerald-500/30">
            ISO 14067
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2.5">
        {/* Active Part Stats */}
        <div className="p-2 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] flex justify-between text-[10px]">
          <div>
            <span className="text-[var(--alu-dim)]">Part / Model:</span>
            <strong className="block text-white truncate max-w-[140px]">
              {selected ? selected.name : 'Full Assembly'}
            </strong>
          </div>
          <div className="text-right">
            <span className="text-[var(--alu-dim)]">Finished Mass:</span>
            <strong className="block text-cyan-400">{targetPartMass.toFixed(2)} kg</strong>
          </div>
        </div>

        {/* Cost Stack Breakdown */}
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between py-0.5 border-b border-white/5">
            <span className="text-[var(--alu-dim)]">Raw Billet ({rawBilletMassKg} kg @ $5.2):</span>
            <span className="text-white">${rawMaterialCost}</span>
          </div>
          <div className="flex justify-between py-0.5 border-b border-white/5">
            <span className="text-[var(--alu-dim)]">5-Axis CNC ({cycleTimeMin} min):</span>
            <span className="text-white">${machiningCost}</span>
          </div>
          <div className="flex justify-between py-0.5 border-b border-white/5">
            <span className="text-[var(--alu-dim)]">Tool Wear & Electricity:</span>
            <span className="text-white">${(toolingWearCost + energyCost).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-0.5 border-b border-white/5">
            <span className="text-[var(--alu-dim)]">Metrology & QC (CMM):</span>
            <span className="text-white">${metrologyCost}</span>
          </div>
        </div>

        {/* Totals Box */}
        <div className="p-2 rounded-[var(--radius-s)] bg-emerald-950/30 border border-emerald-500/40 space-y-1 text-[10px]">
          <div className="flex justify-between items-center">
            <span className="text-[var(--alu-dim)] font-bold">Unit Production Cost:</span>
            <span className="text-sm font-extrabold text-emerald-400">${unitCost}</span>
          </div>
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-[var(--alu-dim)]">Suggested Price (+{targetMarginPct}%):</span>
            <strong className="text-white">${suggestedPrice} / unit</strong>
          </div>
          <div className="flex justify-between items-center text-[9px] pt-1 border-t border-emerald-500/20">
            <span className="text-[var(--alu-dim)]">Batch Profit ({batchSize} pcs):</span>
            <strong className="text-emerald-300 font-bold">+${batchProfit.toLocaleString()}</strong>
          </div>
        </div>

        {/* ESG Carbon Footprint */}
        <div className="p-2 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-cyan-500/30 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1.5 text-cyan-300">
            <Leaf size={13} className="text-emerald-400" />
            <span>Carbon Footprint:</span>
          </div>
          <strong className="text-white">{unitCarbonKg} kg CO₂e / pc</strong>
        </div>
      </div>
    </div>
  );
}
