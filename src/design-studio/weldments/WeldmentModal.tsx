/**
 * ⚡ WELDMENT PROPERTY MANAGER & FABRICATION MODAL (ISO 2553 / EN 1993-1-8)
 *
 * Professional UI for creating, dimensioning, inspecting, and post-machining
 * structural weld beads in AluCAD OS CAD Mode 2.
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Flame,
  Check,
  Trash2,
  Scissors,
  CircleDot,
  Wrench,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useDesignStore } from '../designStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import type { WeldJointType, WeldFillerWire, WeldBead } from './weldmentTypes';
import { calculateWeldProperties } from './weldmentEngine';

interface WeldmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WeldmentModal({ isOpen, onClose }: WeldmentModalProps) {
  const { language } = useI18nStore();
  const parts = useDesignStore((s) => s.parts);
  const weldBeads = useDesignStore((s) => s.weldBeads);
  const selectedWeldId = useDesignStore((s) => s.selectedWeldId);
  const addWeldBead = useDesignStore((s) => s.addWeldBead);
  const updateWeldBead = useDesignStore((s) => s.updateWeldBead);
  const removeWeldBead = useDesignStore((s) => s.removeWeldBead);
  const cutWeldBead = useDesignStore((s) => s.cutWeldBead);
  const drillWeldBeadHole = useDesignStore((s) => s.drillWeldBeadHole);
  const autoWeldAdjacentParts = useDesignStore((s) => s.autoWeldAdjacentParts);

  const activeBead = useMemo(() => {
    return weldBeads.find((w) => w.id === selectedWeldId) || null;
  }, [weldBeads, selectedWeldId]);

  // Form State
  const [partAId, setPartAId] = useState<string>(activeBead?.partAId || (parts[0]?.id || ''));
  const [partBId, setPartBId] = useState<string>(activeBead?.partBId || (parts[1]?.id || parts[0]?.id || ''));
  const [type, setType] = useState<WeldJointType>(activeBead?.type || 'fillet');
  const [legSizeMm, setLegSizeMm] = useState<number>(activeBead?.legSizeMm || 6);
  const [lengthMm, setLengthMm] = useState<number>(activeBead?.lengthMm || 80);
  const [material, setMaterial] = useState<WeldFillerWire>(activeBead?.material || 'ER70S-6');
  const [intermittent, setIntermittent] = useState<boolean>(activeBead?.intermittent || false);
  const [segmentLengthMm, setSegmentLengthMm] = useState<number>(activeBead?.segmentLengthMm || 30);
  const [pitchMm, setPitchMm] = useState<number>(activeBead?.pitchMm || 60);

  // Live Eurocode 3 calculation report
  const report = useMemo(() => {
    const dummyBead: WeldBead = {
      id: 'preview',
      name: 'Preview',
      type,
      standard: 'ISO 2553',
      partAId,
      partBId,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      legSizeMm,
      lengthMm,
      intermittent,
      segmentLengthMm,
      pitchMm,
      material,
      createdAt: 0,
    };
    return calculateWeldProperties(dummyBead);
  }, [type, partAId, partBId, legSizeMm, lengthMm, intermittent, segmentLengthMm, pitchMm, material]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (activeBead) {
      updateWeldBead(activeBead.id, {
        partAId,
        partBId,
        type,
        legSizeMm,
        lengthMm,
        material,
        intermittent,
        segmentLengthMm,
        pitchMm,
      });
    } else {
      addWeldBead({
        partAId,
        partBId,
        type,
        standard: 'ISO 2553',
        name: `${type === 'fillet' ? 'Köşe Kaynağı' : 'Alın Kaynağı'} (a=${Math.round(legSizeMm * 0.707)}mm)`,
        position: { x: 0, y: 10, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        legSizeMm,
        lengthMm,
        material,
        intermittent,
        segmentLengthMm,
        pitchMm,
      });
    }
    onClose();
  };

  const handleAddMachinedHole = () => {
    if (!activeBead) return;
    drillWeldBeadHole(activeBead.id, {
      id: `hole-weld-${Date.now().toString(36)}`,
      size: 'M10',
      type: 'clearance',
      face: 'top',
      x: 0,
      y: 0,
      depth: 20,
      isThroughAll: true,
    });
  };

  const handleAddMachinedCut = () => {
    if (!activeBead) return;
    cutWeldBead(activeBead.id, {
      id: `cut-weld-${Date.now().toString(36)}`,
      type: 'slot',
      face: 'top',
      x: 0,
      y: 0,
      width: 14,
      length: 28,
      depth: 12,
      isThroughAll: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 font-mono select-none">
      <div className="flex flex-col w-full max-w-2xl max-h-[92vh] rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] bg-[var(--bg-0)]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[var(--radius-s)] bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Flame size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{t12(language, 'Weldment & Fabrication Manager', 'Kaynak ve Çatma Yöneticisi')}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ISO 2553 / EN 1993-1-8
                </span>
              </h2>
              <p className="text-[10px] text-[var(--alu-dim)]">
                {t12(language, 'Parametric structural weld beads with live post-weld machining', 'Kesilebilir katı kaynak dikişleri ve talaşlı işleme')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Fit-Up Auto Welder Banner */}
          {parts.length >= 2 && (
            <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-s)] bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400 shrink-0" />
                <span className="text-[10.5px] text-amber-200">
                  {t12(
                    language,
                    'Auto-detect contact seam between active parts and fit-up weld bead:',
                    'Parçalar arası temas kenarını otomatik tespit et ve çatma kaynağı ekle:'
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (parts[0] && parts[1]) {
                    autoWeldAdjacentParts(parts[0].id, parts[1].id, legSizeMm, type);
                    onClose();
                  }
                }}
                className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] transition shrink-0 cursor-pointer shadow"
              >
                {t12(language, '⚡ Auto-Weld Joint', '⚡ Otomatik Kaynat')}
              </button>
            </div>
          )}

          {/* Member Selection Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-300 block mb-1">
                {t12(language, 'Base Member (Part A):', '1. Parça (Ana Gövde):')}
              </label>
              <select
                value={partAId}
                onChange={(e) => setPartAId(e.target.value)}
                className="w-full bg-[var(--bg-0)] border border-[var(--line)] rounded px-2.5 py-1.5 text-white outline-none focus:border-amber-400"
              >
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-300 block mb-1">
                {t12(language, 'Welded Member (Part B):', '2. Parça (Eklenen Eleman):')}
              </label>
              <select
                value={partBId}
                onChange={(e) => setPartBId(e.target.value)}
                className="w-full bg-[var(--bg-0)] border border-[var(--line)] rounded px-2.5 py-1.5 text-white outline-none focus:border-amber-400"
              >
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Weld Joint Type & ISO 2553 Symbol Selection */}
          <div>
            <label className="text-[10px] font-bold text-slate-300 block mb-1.5">
              {t12(language, 'Weld Joint Type & ISO 2553 Symbol:', 'Kaynak Tipi ve ISO 2553 Sembolü:')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'fillet', nameTr: 'Köşe Kaynağı', nameEn: 'Fillet Weld', sym: '⊿' },
                { id: 'butt', nameTr: 'Alın Kaynağı', nameEn: 'Butt / Groove', sym: '⨝' },
                { id: 'seam', nameTr: 'Dikiş Kaynağı', nameEn: 'Seam Weld', sym: '○' },
                { id: 'bevel', nameTr: 'V-Ağızlı', nameEn: 'Bevel Groove', sym: '⊾' },
              ].map((jt) => (
                <button
                  key={jt.id}
                  type="button"
                  onClick={() => setType(jt.id as WeldJointType)}
                  className={`p-2 rounded border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                    type === jt.id
                      ? 'bg-amber-500/20 border-amber-400 text-white '
                      : 'bg-[var(--bg-0)] border-[var(--line)] text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-base font-black text-amber-400">{jt.sym}</span>
                  <span className="text-[10px] font-bold">{t12(language, jt.nameEn, jt.nameTr)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions Sliders: Leg Size & Length */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-300 font-bold">
                  {t12(language, 'Leg Size / Throat (z / a):', 'Boğaz / Bacak Kalınlığı (z / a):')}
                </span>
                <span className="text-amber-400 font-mono font-bold">
                  z = {legSizeMm} mm (a = {report.throatThicknessMm} mm)
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="25"
                step="1"
                value={legSizeMm}
                onChange={(e) => setLegSizeMm(Number(e.target.value))}
                className="w-full accent-[var(--cyan)] cursor-pointer"
              />
              <div className="flex justify-between text-[8.5px] text-slate-500 mt-0.5">
                <span>3 mm (İnce Sac)</span>
                <span>8 mm (Şasi)</span>
                <span>25 mm (Ağır İmalat)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-300 font-bold">
                  {t12(language, 'Weld Length (L):', 'Kaynak Boyu (L):')}
                </span>
                <span className="text-amber-400 font-mono font-bold">{lengthMm} mm</span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                step="10"
                value={lengthMm}
                onChange={(e) => setLengthMm(Number(e.target.value))}
                className="w-full accent-[var(--cyan)] cursor-pointer"
              />
              <div className="flex justify-between text-[8.5px] text-slate-500 mt-0.5">
                <span>20 mm</span>
                <span>250 mm</span>
                <span>500 mm</span>
              </div>
            </div>
          </div>

          {/* Filler Wire Material */}
          <div>
            <label className="text-[10px] font-bold text-slate-300 block mb-1">
              {t12(language, 'Welding Consumable / Filler Wire:', 'Kaynak Teli / Dolgu Malzemesi:')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ER70S-6', label: 'SG2 / ER70S-6 (Çelik MAG)' },
                { id: 'AlSi5_4043', label: 'AlSi5 / ER4043 (Alüminyum)' },
                { id: 'ER308L', label: '308L (Paslanmaz Çelik)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMaterial(m.id as WeldFillerWire)}
                  className={`px-2 py-1.5 rounded border text-left text-[10px] font-bold transition cursor-pointer ${
                    material === m.id
                      ? 'bg-amber-500/20 border-amber-400 text-white'
                      : 'bg-[var(--bg-0)] border-[var(--line)] text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Intermittent Welding Checkbox */}
          <div className="flex items-center gap-2 p-2 rounded bg-[var(--bg-0)] border border-[var(--line)]">
            <input
              type="checkbox"
              id="intermittent-cb"
              checked={intermittent}
              onChange={(e) => setIntermittent(e.target.checked)}
              className="accent-[var(--cyan)] cursor-pointer"
            />
            <label htmlFor="intermittent-cb" className="text-[10.5px] text-slate-300 cursor-pointer font-bold">
              {t12(language, 'Intermittent Weld (Kesintili Dikiş Kaynağı - Adım/Hatve)', 'Kesintili Dikiş Kaynağı (Adım ve Hatve)')}
            </label>
          </div>

          {/* EN 1993-1-8 Real-Time Engineering Readout Cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)] text-center">
              <span className="text-[9px] text-slate-400 block">{t12(language, 'Mass (kg)', 'Kaynak Kütlesi')}</span>
              <span className="text-xs font-bold text-amber-300">{report.weldMassKg} kg</span>
            </div>
            <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)] text-center">
              <span className="text-[9px] text-slate-400 block">{t12(language, 'Volume', 'Hacim')}</span>
              <span className="text-xs font-bold text-white">{report.weldVolumeCm3} cm³</span>
            </div>
            <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)] text-center">
              <span className="text-[9px] text-slate-400 block">{t12(language, 'Capacity Fw,Rd', 'Taşıma Gücü')}</span>
              <span className="text-xs font-bold text-emerald-400">{report.designResistanceKn} kN</span>
            </div>
            <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)] text-center">
              <span className="text-[9px] text-slate-400 block">{t12(language, 'Heat Input', 'Isı Girdisi')}</span>
              <span className="text-xs font-bold text-sky-400">{report.heatInputKjPerMm} kJ/mm</span>
            </div>
          </div>

          {/* KESİLEBİLİR KAYNAK & TALAŞLI İŞLEME CONTROLS */}
          {activeBead && (
            <div className="p-3 rounded-[var(--radius-s)] bg-rose-500/10 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-rose-300 font-bold text-[11px]">
                <Scissors size={13} />
                <span>{t12(language, 'Post-Weld Machining & Cuttable Weld Operations:', 'Kaynak Sonrası Talaşlı İşleme & Kaynak Kesme:')}</span>
              </div>
              <p className="text-[10px] text-slate-400">
                {t12(
                  language,
                  'Directly slice or bore through this solid weld bead via physical 3D CSG void subtraction:',
                  'Bu katı kaynak dikişini doğrudan CSG talaşlı işleme (delik delme veya yüzey frezeleme) ile kesin:'
                )}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAddMachinedHole}
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] flex items-center gap-1 transition cursor-pointer shadow active:scale-95"
                >
                  <CircleDot size={11} />
                  <span>{t12(language, 'Drill Hole Across Weld', 'Kaynağı Del (M10)')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddMachinedCut}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/40 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer shadow active:scale-95"
                >
                  <Scissors size={11} />
                  <span>{t12(language, 'Mill Pocket Across Weld', 'Kaynağı Frezele (Kanal Kes)')}</span>
                </button>
              </div>

              {(activeBead.cuts?.length || 0) + (activeBead.holes?.length || 0) > 0 && (
                <div className="text-[9.5px] text-amber-300 flex items-center gap-1 pt-1">
                  <Check size={11} />
                  <span>
                    {activeBead.cuts?.length || 0} {t12(language, 'Cuts', 'Kesim')} · {activeBead.holes?.length || 0} {t12(language, 'Holes currently cutting this weld', 'Delik bu kaynak dikişini kesiyor')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--line)] bg-[var(--bg-0)]">
          {activeBead ? (
            <button
              type="button"
              onClick={() => {
                removeWeldBead(activeBead.id);
                onClose();
              }}
              className="px-3 py-1.5 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-[10.5px] flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 size={12} />
              <span>{t12(language, 'Delete Weld', 'Kaynağı Sil')}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-[10.5px] transition cursor-pointer"
            >
              {t12(language, 'Cancel', 'İptal')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[10.5px] flex items-center gap-1.5 transition cursor-pointer shadow-lg active:scale-95"
            >
              <Check size={12} />
              <span>{activeBead ? t12(language, 'Update Weld Bead', 'Kaynağı Güncelle') : t12(language, 'Add Weld Bead', 'Kaynak Ekle')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
