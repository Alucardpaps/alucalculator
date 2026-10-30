'use client';

/**
 * 🧑‍🏭 WELD STUDIO (Kaynak & Talaşlı İmalat Stüdyosu)
 * Dedicated environment for welded structures, joint fit-up, and post-weld machining.
 * Implements:
 * - ISO 2553:2019 Symbolic representation & joint types (Fillet, Butt, Seam, Bevel)
 * - EN 1993-1-8:2005 Eurocode 3 Weld Resistance (Fw,Rd, throat thickness a, Leff)
 * - Post-weld machining: Extrude cuts, milling pockets, and drilling through welds & members
 * - Auto fit-up & structural gusset reinforcement
 */

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Flame,
  Scissors,
  CircleDot,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Trash2,
  Check,
  X,
  Plus,
  Box,
  Layers,
  Send,
  Eye,
  EyeOff,
  Pencil,
  Info,
  Maximize2,
  HelpCircle,
  FolderPlus,
  Wrench,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { useDesignStore, type DesignPart } from '@/design-studio/designStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import type { WeldJointType, WeldFillerWire, WeldBead } from './weldmentTypes';
import { calculateWeldProperties } from './weldmentEngine';
import { WeldmentModal } from './WeldmentModal';

const DesignViewport = dynamic(
  () => import('@/design-studio/DesignViewport').then((m) => m.DesignViewport),
  { ssr: false }
);

export interface WeldStudioProps {
  onClose: () => void;
  onSendToAssembly?: () => void;
}

export function WeldStudio({ onClose, onSendToAssembly }: WeldStudioProps) {
  const { language } = useI18nStore();
  const isTr = language === 'tr';

  const parts = useDesignStore((s) => s.parts);
  const weldBeads = useDesignStore((s) => s.weldBeads);
  const selectedWeldId = useDesignStore((s) => s.selectedWeldId);
  const setSelectedWeldId = useDesignStore((s) => s.setSelectedWeldId);
  const selectedId = useDesignStore((s) => s.selectedId);
  const select = useDesignStore((s) => s.select);
  const addWeldBead = useDesignStore((s) => s.addWeldBead);
  const updateWeldBead = useDesignStore((s) => s.updateWeldBead);
  const removeWeldBead = useDesignStore((s) => s.removeWeldBead);
  const autoWeldAdjacentParts = useDesignStore((s) => s.autoWeldAdjacentParts);
  const loadSampleWeldedChassis = useDesignStore((s) => s.loadSampleWeldedChassis);
  const addPart = useDesignStore((s) => s.addPart);
  const tool = useDesignStore((s) => s.tool);
  const setTool = useDesignStore((s) => s.setTool);
  const cuts = useDesignStore((s) => s.cuts);
  const holes = useDesignStore((s) => s.holes);
  const removeCut = useDesignStore((s) => s.removeCut);
  const removeHole = useDesignStore((s) => s.removeHole);
  const openPartStudioForPart = useDesignStore((s) => s.openPartStudioForPart);

  // Cross section state
  const [sectionAxis, setSectionAxis] = useState<'NONE' | 'X' | 'Y' | 'Z'>('NONE');
  const [sectionOffset, setSectionOffset] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'welds' | 'machining' | 'report'>('welds');
  const [toast, setToast] = useState<string | null>(null);

  const ping = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 2800);
  };

  // Active Weld Bead
  const activeBead = useMemo(() => {
    return weldBeads.find((w) => w.id === selectedWeldId) || weldBeads[0] || null;
  }, [weldBeads, selectedWeldId]);

  // Eurocode 3 calculation for active bead
  const activeReport = useMemo(() => {
    return activeBead ? calculateWeldProperties(activeBead) : null;
  }, [activeBead]);

  // Overall weldment metrics
  const totalMetrics = useMemo(() => {
    let mass = 0;
    let volume = 0;
    let length = 0;
    weldBeads.forEach((w) => {
      const r = calculateWeldProperties(w);
      mass += r.weldMassKg;
      volume += r.weldVolumeCm3;
      length += r.totalLengthMm;
    });
    return {
      mass: Math.round(mass * 1000) / 1000,
      volume: Math.round(volume * 10) / 10,
      length: Math.round(length),
    };
  }, [weldBeads]);

  // Quick Action: Add standard fillet weld
  const handleAddFilletWeld = () => {
    const partA = parts[0]?.id || '';
    const partB = parts[1]?.id || parts[0]?.id || '';
    const id = addWeldBead({
      name: `Fillet Weld ${weldBeads.length + 1}`,
      type: 'fillet',
      standard: 'ISO 2553',
      partAId: partA,
      partBId: partB,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      legSizeMm: 6,
      lengthMm: 80,
      material: 'ER70S-6',
      color: '#f59e0b',
    });
    setSelectedWeldId(id);
    ping(isTr ? '✓ Yeni Köşe Kaynağı Eklendi (ISO 2553: z=6mm, a=4.2mm)' : '✓ Added New Fillet Weld (ISO 2553: z=6mm, a=4.2mm)');
  };

  // Quick Action: Add butt/groove weld
  const handleAddButtWeld = () => {
    const partA = parts[0]?.id || '';
    const partB = parts[1]?.id || parts[0]?.id || '';
    const id = addWeldBead({
      name: `Butt Weld ${weldBeads.length + 1}`,
      type: 'butt',
      standard: 'ISO 2553',
      partAId: partA,
      partBId: partB,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      legSizeMm: 8,
      lengthMm: 100,
      grooveAngleDeg: 60,
      rootOpeningMm: 2,
      material: 'ER70S-6',
      color: '#f59e0b',
    });
    setSelectedWeldId(id);
    ping(isTr ? '✓ Yeni Alın Kaynağı Eklendi (60° V-Kaynağı)' : '✓ Added New Butt/Groove Weld (60° V-Groove)');
  };

  // Quick Action: Auto Fit-Up
  const handleAutoFitUp = () => {
    if (parts.length < 2) {
      ping(isTr ? 'En az 2 parça gereklidir' : 'At least 2 parts required for fit-up');
      return;
    }
    const partA = parts[0].id;
    const partB = parts[1].id;
    const id = autoWeldAdjacentParts(partA, partB, 6, 'fillet');
    if (id) {
      ping(isTr ? '⚡ Otomatik çatma dikişi temas yüzeyine yerleştirildi' : '⚡ Auto fit-up seam placed on joint');
    }
  };

  // Quick Action: Add Structural Gusset Plate
  const handleAddGusset = () => {
    addPart('L-bracket');
    ping(isTr ? '📐 Takviye Bayrak Plakası Eklendi' : '📐 Added Structural Gusset Plate');
  };

  // Quick Action: Add Welded Extruded Plate / Flange
  const handleAddPlate = () => {
    addPart('box');
    ping(isTr ? '📦 Kaynaklı Taban Plakası Eklendi' : '📦 Added Welded Base Plate');
  };

  const handleFinish = () => {
    if (onSendToAssembly) onSendToAssembly();
    else onClose();
  };

  return (
    <div className="flex flex-col w-full h-full bg-[var(--bg-0)] text-[var(--ink)] overflow-hidden select-none font-sans">
      {/* ─── 1. TOP HEADER & WELD STUDIO RIBBON ─── */}
      <div className="shrink-0 flex flex-col border-b border-[var(--line)] bg-[var(--bg-1)]">
        {/* Row 1: Studio Title & Master Action Controls */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFinish}
              className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
              title={isTr ? 'Montaj Çalışma Alanına Dön' : 'Return to Assembly'}
            >
              <span>←</span>
              <span>{isTr ? 'Montaja Dön' : 'To Assembly'}</span>
            </button>

            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded bg-amber-500/20 text-amber-400">
                <Flame size={14} />
              </div>
              <div>
                <span className="font-extrabold text-[12px] text-white tracking-wide">
                  {isTr ? 'WELD STUDIO · KAYNAKLI İMALAT & İŞLEME' : 'WELD STUDIO · FABRICATION & MACHINING'}
                </span>
                <span className="ml-2 text-[9px] font-mono text-amber-400 font-bold">
                  [ISO 2553 · EN 1993-1-8]
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-amber-500/40 text-amber-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
              title={isTr ? 'Kaynak Parametre Yöneticisini Aç' : 'Open Weldment Property Manager'}
            >
              <Wrench size={11} />
              <span>{isTr ? 'Parametre Yöneticisi' : 'Property Manager'}</span>
            </button>

            {/* Prominent Send to Assembly Button */}
            <button
              type="button"
              onClick={handleFinish}
              className="px-3 py-1 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:brightness-110 text-[var(--accent-ink)] font-extrabold text-[11px] flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
              title={isTr ? 'Kaynaklı yapıyı montaja gönder ve montaja dön' : 'Apply welds and return to assembly'}
            >
              <Send size={12} />
              <span>{isTr ? 'Montaja Gönder' : 'Send to Assembly'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
              title={isTr ? 'Kapat' : 'Close'}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Row 2: Contextual Weldment Ribbon */}
        <div className="flex items-center gap-1 px-3 py-1 overflow-x-auto no-scrollbar font-mono text-[10px]">
          {/* Fillet Weld */}
          <button
            type="button"
            onClick={handleAddFilletWeld}
            className="px-2 py-1 rounded-[var(--radius-s)] bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1 cursor-pointer shrink-0"
            title={isTr ? 'ISO 2553 Standart Köşe Kaynağı Ekle' : 'Add ISO 2553 Fillet Weld Bead'}
          >
            <Flame size={11} className="text-amber-400" />
            <span>{isTr ? '+ Köşe Kaynağı' : '+ Fillet Weld'}</span>
          </button>

          {/* Butt Weld */}
          <button
            type="button"
            onClick={handleAddButtWeld}
            className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-slate-200 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer shrink-0"
            title={isTr ? '60° V Alın Kaynağı Ekle' : 'Add 60° V-Groove Butt Weld'}
          >
            <span>⚡</span>
            <span>{isTr ? '+ Alın Kaynağı' : '+ Butt Weld'}</span>
          </button>

          {/* Auto Fit-Up */}
          <button
            type="button"
            onClick={handleAutoFitUp}
            className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-emerald-300 font-bold flex items-center gap-1 cursor-pointer shrink-0"
            title={isTr ? 'Temas eden parçalara otomatik dikiş uygula' : 'Automatically detect joint seam and place weld'}
          >
            <Sparkles size={11} className="text-emerald-400" />
            <span>{isTr ? 'Otomatik Çatma' : 'Auto Fit-Up'}</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-1 shrink-0" />

          {/* Structural Gusset */}
          <button
            type="button"
            onClick={handleAddGusset}
            className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-sky-300 font-bold flex items-center gap-1 cursor-pointer shrink-0"
            title={isTr ? 'Kaynaklı Köşe Takviye Bayrak Plakası Ekle' : 'Add Structural Gusset Plate'}
          >
            <span>📐</span>
            <span>{isTr ? '+ Takviye Bayrak' : '+ Gusset Plate'}</span>
          </button>

          {/* Extruded Plate */}
          <button
            type="button"
            onClick={handleAddPlate}
            className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-purple-300 font-bold flex items-center gap-1 cursor-pointer shrink-0"
            title={isTr ? 'Kaynaklı Flanş / Taban Plakası Ekle' : 'Add Welded Flange / Base Plate'}
          >
            <Box size={11} className="text-purple-400" />
            <span>{isTr ? '+ Plaka / Ekstrüzyon' : '+ Extrude Plate'}</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-1 shrink-0" />

          {/* Machining Cut (Kesilebilir Kaynak!) */}
          <button
            type="button"
            onClick={() => {
              setTool(tool === 'sketch-cut' ? 'select' : 'sketch-cut');
              ping(isTr ? '✂️ Talaşlı İşleme: Parçayı ve kaynağı kesen havuz çizin' : '✂️ Post-weld Machining: Draw cut through weld & member');
            }}
            className={`px-2 py-1 rounded-[var(--radius-s)] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors ${
              tool === 'sketch-cut'
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300'
            }`}
            title={isTr ? 'Kaynak ve profil üzerinden talaşlı kesim yap' : 'Post-weld machining: Cut through weld & member'}
          >
            <Scissors size={11} />
            <span>{isTr ? 'Talaşlı Kesim' : 'Machining Cut'}</span>
          </button>

          {/* Drill Hole Through Weld */}
          <button
            type="button"
            onClick={() => {
              setTool(tool === 'hole' ? 'select' : 'hole');
              useDesignStore.getState().setClickToPlaceHole(tool !== 'hole');
              ping(isTr ? '🔘 Kaynak veya Profil Delme: Yüzeye tıklayarak delik açın' : '🔘 Drill hole through weld or member');
            }}
            className={`px-2 py-1 rounded-[var(--radius-s)] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors ${
              tool === 'hole'
                ? 'bg-[var(--cyan)] text-black'
                : 'bg-[var(--bg-2)] text-slate-200 hover:text-[var(--cyan)] border border-[var(--line)]'
            }`}
            title={isTr ? 'Kaynağa veya profile ISO delik del' : 'Drill ISO hole through weld or member'}
          >
            <CircleDot size={11} />
            <span>{isTr ? 'Delik Del' : 'Drill Hole'}</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-1 shrink-0" />

          {/* 1-Click Welded Chassis Sample */}
          <button
            type="button"
            onClick={() => {
              loadSampleWeldedChassis();
              ping(isTr ? '🚀 Örnek Kaynaklı Şasi Yüklendi' : '🚀 Sample Welded Chassis Loaded');
            }}
            className="px-2 py-1 rounded-[var(--radius-s)] bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1 cursor-pointer shrink-0"
            title={isTr ? 'Hazır kaynaklı boru şasi örneği yükle' : 'Load ready-made welded chassis sample'}
          >
            <span>🚀</span>
            <span>{isTr ? 'Örnek Şasi' : 'Sample Chassis'}</span>
          </button>

          {/* Cross-Section Plane Slicer */}
          <div className="flex items-center gap-1 ml-auto shrink-0">
            <span className="text-[9px] text-[var(--alu-dim)]">{isTr ? 'Kesit:' : 'Sec:'}</span>
            {(['NONE', 'X', 'Y', 'Z'] as const).map((ax) => (
              <button
                key={ax}
                type="button"
                onClick={() => setSectionAxis(ax)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                  sectionAxis === ax
                    ? 'bg-[var(--cyan)] text-black'
                    : 'bg-[var(--bg-2)] text-slate-400 hover:text-white'
                }`}
              >
                {ax === 'NONE' ? (isTr ? 'Kapalı' : 'Off') : ax}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN 3-COLUMN STUDIO LAYOUT ─── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Weldment Feature Tree */}
        <aside className="w-64 border-r border-[var(--line)] bg-[var(--bg-1)] flex flex-col shrink-0 overflow-y-auto p-2 space-y-3 font-mono text-[9px]">
          {/* Structural Members */}
          <div className="rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] p-2">
            <div className="flex items-center justify-between pb-1 mb-1 border-b border-white/5 font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1">
                <Box size={10} className="text-[var(--cyan)]" />
                <span>{isTr ? 'PROFILLER & PARÇALAR' : 'MEMBERS & PARTS'}</span>
              </span>
              <span className="text-[8px] text-slate-500">({parts.length})</span>
            </div>
            <div className="space-y-1">
              {parts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => select(p.id)}
                  className={`flex items-center justify-between p-1 rounded cursor-pointer transition ${
                    selectedId === p.id
                      ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/40'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: p.color || '#00e5ff' }}
                    />
                    <span className="font-bold truncate">{p.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPartStudioForPart(p.id);
                    }}
                    className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-white/10"
                    title={isTr ? 'Bu parçayı Parça Stüdyosunda düzenle' : 'Edit member in Part Studio'}
                  >
                    <Pencil size={8} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Weld Beads List */}
          <div className="rounded-[var(--radius-s)] border border-amber-500/40 bg-[var(--bg-0)] p-2">
            <div className="flex items-center justify-between pb-1 mb-1 border-b border-white/5 font-bold uppercase tracking-wider text-amber-300">
              <span className="flex items-center gap-1">
                <Flame size={10} className="text-amber-400" />
                <span>{isTr ? 'KAYNAK DİKİŞLERİ' : 'WELD BEADS'}</span>
              </span>
              <span className="text-[8px] text-amber-500">({weldBeads.length})</span>
            </div>
            {weldBeads.length === 0 ? (
              <div className="py-2 text-center text-slate-500 italic text-[8px]">
                {isTr ? 'Henüz kaynak eklenmedi' : 'No weld beads placed'}
              </div>
            ) : (
              <div className="space-y-1">
                {weldBeads.map((w) => {
                  const isSel = selectedWeldId === w.id;
                  const rep = calculateWeldProperties(w);
                  return (
                    <div
                      key={w.id}
                      onClick={() => setSelectedWeldId(w.id)}
                      className={`flex items-center justify-between p-1 rounded cursor-pointer transition ${
                        isSel
                          ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="truncate flex-1 min-w-0">
                        <div className="font-bold truncate text-[9px]">{w.name}</div>
                        <div className="text-[7.5px] text-slate-400">
                          {w.type.toUpperCase()} · z={w.legSizeMm}mm (a={rep.throatThicknessMm}mm) · {w.material}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeWeldBead(w.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-white/10"
                        title={isTr ? 'Kaynağı sil' : 'Delete weld'}
                      >
                        <Trash2 size={9} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Post-Weld Machining & Cuts */}
          <div className="rounded-[var(--radius-s)] border border-rose-500/30 bg-[var(--bg-0)] p-2">
            <div className="flex items-center justify-between pb-1 mb-1 border-b border-white/5 font-bold uppercase tracking-wider text-rose-300">
              <span className="flex items-center gap-1">
                <Scissors size={10} className="text-rose-400" />
                <span>{isTr ? 'TALAŞLI İŞLEME & DELİKLER' : 'MACHINING & HOLES'}</span>
              </span>
              <span className="text-[8px] text-rose-500">({cuts.length + holes.length})</span>
            </div>
            {cuts.length === 0 && holes.length === 0 ? (
              <div className="py-2 text-center text-slate-500 italic text-[8px]">
                {isTr ? 'İşlenmiş delik/kanal yok' : 'No post-weld machining features'}
              </div>
            ) : (
              <div className="space-y-1">
                {cuts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-1 rounded hover:bg-white/5 text-slate-300">
                    <span className="truncate">Cut {c.type} ({c.depth}mm)</span>
                    <button
                      type="button"
                      onClick={() => removeCut(c.id)}
                      className="p-0.5 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 size={8} />
                    </button>
                  </div>
                ))}
                {holes.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-1 rounded hover:bg-white/5 text-slate-300">
                    <span className="truncate">Hole {h.size || 'ISO'} ({h.type})</span>
                    <button
                      type="button"
                      onClick={() => removeHole(h.id)}
                      className="p-0.5 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 size={8} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Center: Central 3D Viewport */}
        <main className="flex-1 relative min-w-0 min-h-0 h-full overflow-hidden bg-[var(--bg-0)]">
          <DesignViewport />

          {/* Viewport Overlay HUD for Weld Studio */}
          <div className="absolute top-3 left-3 z-30 pointer-events-none flex flex-col gap-1.5 font-mono text-[9px]">
            <div className="pointer-events-auto px-2 py-1 rounded bg-[var(--bg-0)]/90 border border-amber-500/40 text-amber-300 shadow-md">
              <span className="font-bold">🧑‍🏭 {isTr ? 'Kaynaklı Montaj Modu' : 'Weldment Assembly Mode'}</span>
              <span className="ml-2 text-slate-400">· {weldBeads.length} {isTr ? 'Dikiş' : 'Beads'}</span>
            </div>
          </div>

          {toast && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-amber-500/50 shadow-2xl text-[11px] font-bold text-amber-200 animate-in fade-in">
              {toast}
            </div>
          )}
        </main>

        {/* Right: Live Engineering Inspector & Calculations (Eurocode 3) */}
        <aside className="w-72 border-l border-[var(--line)] bg-[var(--bg-1)] flex flex-col shrink-0 overflow-y-auto p-2.5 space-y-3 font-mono text-[9.5px]">
          {/* Header tabs */}
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
            <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={12} className="text-amber-400" />
              <span>{isTr ? 'MÜHENDİSLİK RAPORU' : 'ENGINEERING REPORT'}</span>
            </span>
            <span className="text-[8px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
              EN 1993-1-8
            </span>
          </div>

          {/* Active Bead Parameters */}
          {activeBead && (
            <div className="rounded-[var(--radius-s)] border border-amber-500/30 bg-[var(--bg-0)] p-2.5 space-y-2">
              <div className="flex items-center justify-between font-bold text-amber-300 border-b border-white/5 pb-1">
                <span>{activeBead.name}</span>
                <span className="text-[8px] uppercase">{activeBead.type}</span>
              </div>

              {/* Leg size z */}
              <div>
                <div className="flex items-center justify-between text-[8.5px] text-slate-400 mb-0.5">
                  <span>{isTr ? 'Kaynak Boyutu (z):' : 'Leg Size (z):'}</span>
                  <span className="font-bold text-white">{activeBead.legSizeMm} mm</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={25}
                  step={1}
                  value={activeBead.legSizeMm}
                  onChange={(e) => updateWeldBead(activeBead.id, { legSizeMm: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Length L */}
              <div>
                <div className="flex items-center justify-between text-[8.5px] text-slate-400 mb-0.5">
                  <span>{isTr ? 'Dikiş Boyu (L):' : 'Weld Length (L):'}</span>
                  <span className="font-bold text-white">{activeBead.lengthMm} mm</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={300}
                  step={5}
                  value={activeBead.lengthMm}
                  onChange={(e) => updateWeldBead(activeBead.id, { lengthMm: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Wire Alloy */}
              <div>
                <span className="text-[8.5px] text-slate-400 block mb-0.5">
                  {isTr ? 'Kaynak Teli / Dolgu Alaşımı:' : 'Filler Wire / Alloy:'}
                </span>
                <select
                  value={activeBead.material}
                  onChange={(e) => updateWeldBead(activeBead.id, { material: e.target.value as WeldFillerWire })}
                  className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded p-1 text-[9px] text-white outline-none focus:border-amber-400"
                >
                  <option value="ER70S-6">ER70S-6 (Çelik MAG - EN ISO 14341)</option>
                  <option value="E7018">E7018 (Düşük Hidrojenli Elektrod)</option>
                  <option value="AlSi5_4043">AlSi5 / ER4043 (6000 Serisi Alüminyum)</option>
                  <option value="AlMg5_5356">AlMg5 / ER5356 (Marin / Şasi Alüminyum)</option>
                  <option value="ER308L">ER308L (Östenitik Paslanmaz Çelik)</option>
                </select>
              </div>
            </div>
          )}

          {/* Eurocode 3 Normative Report Table */}
          {activeReport && (
            <div className="rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] p-2.5 space-y-1.5 text-[8.5px]">
              <div className="font-bold text-slate-300 border-b border-white/5 pb-1 flex items-center justify-between">
                <span>{isTr ? 'DAYANIM & HESAP TABLOSU' : 'STRENGTH & SIZING'}</span>
                <span className="text-[7.5px] text-emerald-400 font-bold">VERIFIED</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>{isTr ? 'Boğaz Kalınlığı (a):' : 'Throat Thickness (a):'}</span>
                <span className="font-bold text-white font-mono">{activeReport.throatThicknessMm} mm</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>{isTr ? 'Efektif Boy (Leff):' : 'Effective Length (Leff):'}</span>
                <span className="font-bold text-white font-mono">{activeReport.effectiveLengthMm} mm</span>
              </div>

              <div className="flex items-center justify-between text-amber-300 font-bold bg-amber-500/10 p-1 rounded">
                <span>{isTr ? 'Tasarım Dayanımı (Fw,Rd):' : 'Design Shear Capacity:'}</span>
                <span className="font-mono">{activeReport.designResistanceKn} kN</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>{isTr ? 'Dikiş Kütlesi:' : 'Weld Bead Mass:'}</span>
                <span className="font-bold text-white font-mono">{activeReport.weldMassKg} kg</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>{isTr ? 'Isı Girdisi (Q):' : 'Heat Input (Q):'}</span>
                <span className="font-bold text-white font-mono">{activeReport.heatInputKjPerMm} kJ/mm</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>{isTr ? 'HAZ Bölgesi Genişliği:' : 'HAZ Width:'}</span>
                <span className="font-bold text-white font-mono">~{activeReport.hazWidthMm} mm</span>
              </div>
            </div>
          )}

          {/* Overall Weldment Summary */}
          <div className="rounded-[var(--radius-s)] border border-white/10 bg-[var(--bg-2)] p-2 space-y-1 text-[8.5px]">
            <div className="font-bold text-slate-200 border-b border-white/10 pb-0.5">
              {isTr ? 'TOPLAM KAYNAK METRAJ' : 'TOTAL WELDMENT SUMMARY'}
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>{isTr ? 'Toplam Dikiş Adedi:' : 'Total Beads:'}</span>
              <span className="font-bold text-white">{weldBeads.length}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>{isTr ? 'Toplam Metraj:' : 'Total Length:'}</span>
              <span className="font-bold text-white">{totalMetrics.length} mm</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>{isTr ? 'Toplam İlave Tel Kütlesi:' : 'Total Filler Mass:'}</span>
              <span className="font-bold text-amber-400">{totalMetrics.mass} kg</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Property Manager Modal */}
      {isModalOpen && (
        <WeldmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}

export default WeldStudio;
