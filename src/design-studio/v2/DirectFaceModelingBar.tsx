'use client';

/**
 * 🚀 DIRECT FACE MODELING BAR (V2 DESIGN STUDIO — SHAPR3D / INSTANT3D GRADE)
 *
 * Provides frictionless direct 3D part & surface modeling controls right above the viewport:
 * 1. Direct Dimension Input + Push-Pull Extrude steppers along face normal (no modal dialogs)
 * 2. Configurable ISO Metric Hole Stamp (M3–M20, Clearance/Tap/Counterbore/Countersink, Center / 4x Corner / Click-on-Face)
 * 3. Configurable Pocket / Keyway Slot / Chamfer Stamp with live W × L × Depth inputs
 * 4. Quick Transform Switcher (Move W / Rotate E / Drop to Floor Y=0) + Normal-to Face View Alignment
 */

import React, { useState, useEffect } from 'react';
import {
  Eye,
  X,
  Zap,
  CircleDot,
  Grid3X3,
  Split,
  Sparkles,
  Move,
  RotateCw,
  ArrowDownToLine,
  Crosshair,
  Trash2,
  Sliders,
  Layers,
} from 'lucide-react';
import { useDesignStore, type DesignPart } from '@/design-studio/designStore';
import { type SurfaceFace } from '@/design-studio/holeStandards';

type HoleType = 'clearance' | 'tap' | 'counterbore' | 'countersink';
import {
  applyPushPull,
  applySynchronousMoveFace,
  applyDeleteFaceAndHeal,
  applyResizeHoleDirect,
  applyDraftAngleToPart,
  detectSynchronousCoplanarFaces,
  applyCornerBoltPattern,
  applyLightweightIsogrid,
  applyCenterSlot,
} from '@/design-studio/directModelingEngine';
import { triggerCameraView } from '@/design-studio/cadCameraDispatcher';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

interface DirectFaceModelingBarProps {
  activeFace: SurfaceFace | null;
  selectedPart: DesignPart | null;
  onNotification?: (msg: string) => void;
}

const METRIC_SIZES = ['M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12', 'M16', 'M20'] as const;

export function DirectFaceModelingBar({
  activeFace,
  selectedPart,
  onNotification,
}: DirectFaceModelingBarProps) {
  const { language } = useI18nStore();
  const tool = useDesignStore((s) => s.tool);
  const clickToPlaceHole = useDesignStore((s) => s.clickToPlaceHole);

  const [selectedBolt, setSelectedBolt] = useState<string>('M6');
  const [selectedHoleType, setSelectedHoleType] = useState<HoleType>('counterbore');
  const [showBoltMenu, setShowBoltMenu] = useState(false);
  const [showHoleMenu, setShowHoleMenu] = useState(false);
  const [showSlotMenu, setShowSlotMenu] = useState(false);
  const [showFaceMenu, setShowFaceMenu] = useState(false);

  // Slot / Pocket inline dimensions
  const [cutKind, setCutKind] = useState<'slot' | 'rect' | 'circle' | 'chamfer'>('slot');
  const [slotW, setSlotW] = useState<number>(12);
  const [slotL, setSlotL] = useState<number>(35);
  const [slotD, setSlotD] = useState<number>(5);

  const effectiveFace: SurfaceFace = activeFace || 'top';

  // Determine the active dimension key along the selected face normal
  const getFaceAxisInfo = (part: DesignPart, face: SurfaceFace) => {
    const p = part.params || {};
    if (part.kind === 'cylinder' || part.kind === 'tube' || part.kind === 'cone' || part.kind === 'hex-prism') {
      if (face === 'top' || face === 'bottom') {
        return { key: 'length', label: 'Boy (L)', val: Number(p.length || 60) };
      }
      return { key: 'diameter', label: 'Çap (Ø)', val: Number(p.diameter || 40) };
    }
    if (face === 'top' || face === 'bottom') {
      const k = p.extrudeDepth !== undefined ? 'extrudeDepth' : 'height';
      return { key: k, label: 'Yükseklik (H)', val: Number(p[k] || 40) };
    }
    if (face === 'left' || face === 'right') {
      return { key: 'width', label: 'Genişlik (W)', val: Number(p.width || 60) };
    }
    return { key: 'depth', label: 'Derinlik (D)', val: Number(p.depth || 60) };
  };

  const axisInfo = selectedPart ? getFaceAxisInfo(selectedPart, effectiveFace) : { key: 'height', label: 'H', val: 40 };
  const [directDimInput, setDirectDimInput] = useState<string>(String(axisInfo.val));

  useEffect(() => {
    setDirectDimInput(String(axisInfo.val));
  }, [axisInfo.val, selectedPart?.id, effectiveFace]);

  if (!selectedPart) return null;

  const faceLabelTr: Record<SurfaceFace, string> = {
    top: 'ÜST (TOP)',
    bottom: 'ALT (BOTTOM)',
    front: 'ÖN (FRONT)',
    back: 'ARKA (BACK)',
    left: 'SOL (LEFT)',
    right: 'SAĞ (RIGHT)',
  };

  const handlePushPull = (deltaMm: number) => {
    const store = useDesignStore.getState();
    store.pushHistory();

    const res = applyPushPull(selectedPart, effectiveFace, deltaMm);
    store.updatePartParams(selectedPart.id, res.updatedParams);
    store.updatePart(selectedPart.id, { name: res.updatedName });

    onNotification?.(
      t12(
        language,
        `Direct Push-Pull: ${res.axisKey} ${deltaMm > 0 ? '+' : ''}${deltaMm}mm (${res.newVal}mm)`,
        `Doğrudan Yüzey Çekme/İtme: ${res.axisKey} ${deltaMm > 0 ? '+' : ''}${deltaMm}mm (${res.newVal}mm)`
      )
    );
  };

  const handleDirectDimensionCommit = () => {
    const targetVal = parseFloat(directDimInput);
    if (!Number.isFinite(targetVal) || targetVal < 1) {
      setDirectDimInput(String(axisInfo.val));
      return;
    }
    const delta = Math.round((targetVal - axisInfo.val) * 10) / 10;
    if (Math.abs(delta) < 0.05) return;
    handlePushPull(delta);
  };

  const handleCornerBolts = (boltSize: string) => {
    const store = useDesignStore.getState();
    store.pushHistory();

    const bolts = applyCornerBoltPattern(selectedPart, effectiveFace, boltSize);
    if (bolts.length === 0) {
      onNotification?.(t12(language, 'Face is too small for 4x bolts!', 'Yüzey 4x cıvata paterni için çok küçük!'));
      return;
    }

    const currentHoles = selectedPart.holes || [];
    const updatedHoles = [...currentHoles, ...bolts];
    useDesignStore.setState({
      holes: updatedHoles,
      parts: store.parts.map((p) => (p.id === selectedPart.id ? { ...p, holes: updatedHoles } : p)),
    });

    setShowBoltMenu(false);
    onNotification?.(
      t12(
        language,
        `Stamped 4x ${boltSize} ISO Bolt Pattern (DIN 912)`,
        `4x ${boltSize} ISO Cıvata Paterni Eklendi (DIN 912)`
      )
    );
  };

  const handleAddCenterHole = (sizeStr = selectedBolt, hType: HoleType = selectedHoleType) => {
    const store = useDesignStore.getState();
    store.addHole(selectedPart.id, {
      size: sizeStr as any,
      type: hType,
      face: effectiveFace,
      x: 0,
      y: 0,
      depth: 20,
      throughAll: true,
    });
    setShowHoleMenu(false);
    onNotification?.(
      t12(
        language,
        `Drilled centered ${sizeStr} (${hType}) hole on ${effectiveFace.toUpperCase()}`,
        `${faceLabelTr[effectiveFace]} merkezine ${sizeStr} (${hType}) delik açıldı`
      )
    );
  };

  const handleToggleClickToDrill = () => {
    const store = useDesignStore.getState();
    const next = !store.clickToPlaceHole;
    store.setActiveHoleConfig({ size: selectedBolt as any, type: selectedHoleType });
    store.setClickToPlaceHole(next);
    store.setTool(next ? 'hole' : 'select');
    setShowHoleMenu(false);
    onNotification?.(
      next
        ? t12(
            language,
            `Click-to-Drill ACTIVE (${selectedBolt} ${selectedHoleType}): Click any point on the 3D part surface!`,
            `Tıkla-Del AKTİF (${selectedBolt} ${selectedHoleType}): 3B parça yüzeyinde istediğiniz noktaya tıklayın!`
          )
        : t12(language, 'Click-to-Drill mode exited', 'Tıkla-Del modundan çıkıldı')
    );
  };

  const handleIsogrid = () => {
    const store = useDesignStore.getState();
    store.pushHistory();

    const pockets = applyLightweightIsogrid(selectedPart, effectiveFace, 4, 5);
    if (pockets.length === 0) {
      onNotification?.(t12(language, 'Face is too small for pocket grid!', 'Yüzey hafifletme cepleri için çok küçük!'));
      return;
    }

    const currentCuts = selectedPart.cuts || [];
    const updatedCuts = [...currentCuts, ...pockets];

    useDesignStore.setState({
      cuts: updatedCuts,
      parts: store.parts.map((p) => (p.id === selectedPart.id ? { ...p, cuts: updatedCuts } : p)),
    });

    onNotification?.(
      t12(
        language,
        `Generated ${pockets.length} Isogrid Lightweight Pockets (~35% Mass Saved)`,
        `${pockets.length} Adet Isogrid Hafifletme Cebi Açıldı (~%35 Kütle Tasarrufu)`
      )
    );
  };

  const handleApplyCutOrSlot = () => {
    const store = useDesignStore.getState();
    if (cutKind === 'slot') {
      store.pushHistory();
      const slot = applyCenterSlot(selectedPart, effectiveFace, slotW, slotL, slotD);
      const currentCuts = selectedPart.cuts || [];
      const updatedCuts = [...currentCuts, slot];
      useDesignStore.setState({
        cuts: updatedCuts,
        parts: store.parts.map((p) => (p.id === selectedPart.id ? { ...p, cuts: updatedCuts } : p)),
      });
    } else {
      store.addCut(selectedPart.id, {
        type: cutKind,
        face: effectiveFace,
        width: slotW,
        length: slotL,
        depth: slotD,
        x: 0,
        y: 0,
      });
    }
    setShowSlotMenu(false);
    onNotification?.(
      t12(
        language,
        `Cut ${cutKind.toUpperCase()} (${slotW}×${slotL}×${slotD}mm) on ${effectiveFace.toUpperCase()}`,
        `${faceLabelTr[effectiveFace]} yüzeyine ${cutKind.toUpperCase()} (${slotW}×${slotL}×${slotD}mm) açıldı`
      )
    );
  };

  const handleDropToFloor = () => {
    const store = useDesignStore.getState();
    store.pushHistory();
    const h = Number(selectedPart.params?.height || selectedPart.params?.diameter || 20);
    const halfH = (h / 10) * selectedPart.scale.y * 0.5;
    store.updateSelectedTransform({
      position: {
        ...selectedPart.position,
        y: Math.round(halfH * 100) / 100,
      },
    });
    onNotification?.(t12(language, 'Part dropped flush to floor (Y=0)', 'Parça zemine (Y=0) oturtuldu'));
  };

  const handleNormalToView = () => {
    triggerCameraView({ type: 'focus-face', partId: selectedPart.id, face: effectiveFace });
  };

  const faceHoles = (selectedPart.holes || []).filter((h) => h.face === effectiveFace);
  const hasHolesOnFace = faceHoles.length > 0;
  const faceCuts = (selectedPart.cuts || []).filter((c) => c.face === effectiveFace);
  const hasFeaturesOnFace = hasHolesOnFace || faceCuts.length > 0;

  const handleDeleteAndHeal = () => {
    const store = useDesignStore.getState();
    store.pushHistory();

    const res = applyDeleteFaceAndHeal(selectedPart, effectiveFace);
    if (!res.success) {
      onNotification?.(t12(language, res.messageEn, res.messageTr));
      return;
    }

    useDesignStore.setState({
      holes: res.updatedHoles,
      cuts: res.updatedCuts,
      parts: store.parts.map((p) =>
        p.id === selectedPart.id ? { ...p, holes: res.updatedHoles, cuts: res.updatedCuts } : p
      ),
    });

    onNotification?.(t12(language, res.messageEn, res.messageTr));
  };

  const handleResizeHoleDirect = (newSize: string) => {
    const store = useDesignStore.getState();
    store.pushHistory();

    const res = applyResizeHoleDirect(selectedPart, effectiveFace, newSize);
    if (!res.success) {
      onNotification?.(t12(language, res.messageEn, res.messageTr));
      return;
    }

    useDesignStore.setState({
      holes: res.updatedHoles,
      parts: store.parts.map((p) => (p.id === selectedPart.id ? { ...p, holes: res.updatedHoles } : p)),
    });

    onNotification?.(t12(language, res.messageEn, res.messageTr));
  };

  const handleToggleDraftAngle = (deg = 3) => {
    const store = useDesignStore.getState();
    store.pushHistory();

    const curDraft = Number(selectedPart.params?.draftAngle || 0);
    const newDraft = curDraft > 0 ? 0 : deg;
    const res = applyDraftAngleToPart(selectedPart, newDraft, 'inward');

    store.updatePartParams(selectedPart.id, res.updatedParams);
    onNotification?.(t12(language, res.messageEn, res.messageTr));
  };

  const handleDetectCoplanar = () => {
    const store = useDesignStore.getState();
    const matches = detectSynchronousCoplanarFaces(selectedPart, effectiveFace, store.parts);
    if (matches.length === 0) {
      onNotification?.(
        t12(
          language,
          `NX Live Rules: No coplanar faces found in assembly for ${effectiveFace.toUpperCase()}`,
          `NX Senkron Kurallar: ${faceLabelTr[effectiveFace]} ile eş düzlemli başka yüzey bulunamadı`
        )
      );
    } else {
      onNotification?.(
        t12(
          language,
          `NX Live Rules: Found ${matches.length} coplanar face(s)! (e.g. ${matches[0].partName})`,
          `NX Senkron Kurallar: ${matches.length} adet eş düzlemli yüzey bulundu! (örn: ${matches[0].partName})`
        )
      );
    }
  };

  return (
    <div
      data-tour="ds-direct-bar"
      className="absolute bottom-14 left-1/2 -translate-x-1/2 z-30 flex w-max max-w-[calc(100%-24px)] flex-wrap items-center justify-center whitespace-nowrap gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-m)] bg-[var(--bg-0)] border border-[var(--cyan)]/50 shadow-2xl font-mono text-[11px] text-white animate-in slide-in-from-bottom-2 duration-150 select-none"
    >
      {/* Quick Transform Mode Switcher (Select / Move / Rotate / Drop to Floor) */}
      <div className="flex items-center gap-0.5 bg-[var(--bg-1)] p-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
        <button
          type="button"
          onClick={() => useDesignStore.getState().setTool(tool === 'move' ? 'select' : 'move')}
          className={`px-1.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
            tool === 'move'
              ? 'bg-[var(--cyan)] text-slate-950'
              : 'text-slate-300 hover:bg-[var(--bg-2)] hover:text-white'
          }`}
          title={t12(language, 'Toggle 3D Move Arrows (W)', '3B Taşıma Oklarını Aç/Kapat (W)')}
        >
          <Move size={11} />
          <span className="hidden md:inline">{t12(language, 'Move', 'Taşı')}</span>
        </button>
        <button
          type="button"
          onClick={() => useDesignStore.getState().setTool(tool === 'rotate' ? 'select' : 'rotate')}
          className={`px-1.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
            tool === 'rotate'
              ? 'bg-[var(--cyan)] text-slate-950'
              : 'text-slate-300 hover:bg-[var(--bg-2)] hover:text-white'
          }`}
          title={t12(language, 'Toggle 3D Rotate Rings (E)', '3B Döndürme Halkalarını Aç/Kapat (E)')}
        >
          <RotateCw size={11} />
          <span className="hidden md:inline">{t12(language, 'Rotate', 'Döndür')}</span>
        </button>
        <button
          type="button"
          onClick={handleDropToFloor}
          className="px-1.5 py-1 rounded text-[10px] text-emerald-300 hover:bg-emerald-500/20 font-bold flex items-center gap-1 cursor-pointer transition-colors"
          title={t12(language, 'Drop Part Flush to Floor (Y=0)', 'Parçayı Tabana Oturt (Y=0)')}
        >
          <ArrowDownToLine size={11} />
          <span className="hidden lg:inline">Y=0</span>
        </button>
      </div>

      <div className="w-[1px] h-4 bg-[var(--line)]" />

      {/* Active Face Switcher Pill */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowFaceMenu(!showFaceMenu)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-s)] bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 border border-[var(--cyan)]/40 text-[var(--cyan)] font-extrabold text-[10.5px] cursor-pointer transition-colors"
          title={t12(language, 'Click to switch active face', 'Çalışma yüzeyini değiştirmek için tıkla')}
        >
          <Sparkles size={12} className="animate-pulse" />
          <span>{faceLabelTr[effectiveFace]}</span>
          <span className="text-[9px] opacity-70">▾</span>
        </button>

        {showFaceMenu && (
          <div className="absolute bottom-full mb-1 left-0 z-40 bg-[var(--bg-1)] border border-[var(--line)] rounded shadow-2xl p-1 flex flex-col gap-0.5 min-w-[130px]">
            {(['top', 'front', 'right', 'left', 'bottom', 'back'] as SurfaceFace[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  useDesignStore.getState().setActiveFace(f);
                  setShowFaceMenu(false);
                }}
                className={`px-2 py-1 text-left text-[10px] rounded hover:bg-[var(--bg-2)] cursor-pointer flex items-center justify-between ${
                  effectiveFace === f ? 'text-[var(--cyan)] font-bold bg-[var(--cyan)]/10' : 'text-slate-300'
                }`}
              >
                <span>{faceLabelTr[f]}</span>
                {effectiveFace === f && <span className="text-[9px] text-[var(--cyan)]">●</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Normal-To Camera View */}
      <button
        type="button"
        onClick={handleNormalToView}
        className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
        title={t12(language, 'Align Camera Normal to Active Face', 'Kamerayı Seçili Yüze Dik Hizala')}
      >
        <Eye size={12} className="text-[var(--cyan)]" />
        <span className="hidden sm:inline">{t12(language, 'Normal To', 'Dik Bak')}</span>
      </button>

      <div className="w-[1px] h-4 bg-[var(--line)]" />

      {/* Direct Dimension Input + Push-Pull Extrude Steppers */}
      <div className="flex items-center gap-1 bg-[var(--bg-1)] px-1.5 py-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
        <span className="text-[9px] text-[var(--cyan)] font-bold">
          {axisInfo.label}:
        </span>
        <input
          type="number"
          value={directDimInput}
          onChange={(e) => setDirectDimInput(e.target.value)}
          onBlur={handleDirectDimensionCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleDirectDimensionCommit();
          }}
          className="w-14 px-1 py-0.5 rounded bg-[var(--bg-0)] border border-[var(--cyan)]/40 text-[var(--cyan)] font-extrabold text-[10.5px] text-center focus:outline-none focus:border-[var(--cyan)]"
          title={t12(language, 'Type exact dimension in mm and press Enter', 'Tam ölçüyü (mm) yazıp Enter tuşuna basın')}
        />
        <span className="text-[9px] text-slate-500">mm</span>
        <button
          type="button"
          onClick={() => handlePushPull(-10)}
          className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] hover:bg-rose-500/20 text-rose-300 font-bold text-[10px] cursor-pointer"
          title="-10 mm"
        >
          -10
        </button>
        <button
          type="button"
          onClick={() => handlePushPull(-2)}
          className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] hover:bg-rose-500/20 text-rose-300 font-bold text-[10px] cursor-pointer"
          title="-2 mm"
        >
          -2
        </button>
        <button
          type="button"
          onClick={() => handlePushPull(2)}
          className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] hover:bg-emerald-500/20 text-emerald-300 font-bold text-[10px] cursor-pointer"
          title="+2 mm"
        >
          +2
        </button>
        <button
          type="button"
          onClick={() => handlePushPull(10)}
          className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] hover:bg-emerald-500/20 text-emerald-300 font-bold text-[10px] cursor-pointer"
          title="+10 mm"
        >
          +10
        </button>
      </div>

      <div className="w-[1px] h-4 bg-[var(--line)]" />

      {/* 1-Click & Configurable Feature Stamps */}
      <div className="flex items-center gap-1.5 relative">
        {/* 4x Corner Bolts */}
        <div className="inline-flex items-stretch relative">
          <button
            type="button"
            onClick={() => handleCornerBolts(selectedBolt)}
            className="px-2 py-1 rounded-l-[var(--radius-s)] bg-amber-500/15 hover:bg-amber-500/25 border-y border-l border-amber-500/40 text-amber-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
            title={t12(language, `Add 4x ${selectedBolt} corner bolts`, `4 Köşeye ${selectedBolt} cıvata ekle`)}
          >
            <Zap size={11} className="text-amber-400 shrink-0" />
            <span>4x {selectedBolt}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowBoltMenu(!showBoltMenu);
              setShowHoleMenu(false);
              setShowSlotMenu(false);
            }}
            className="px-1.5 py-1 rounded-r-[var(--radius-s)] bg-amber-500/15 hover:bg-amber-500/25 border border-l-0 border-amber-500/40 text-amber-300 font-bold text-[10px] cursor-pointer flex items-center justify-center shrink-0"
            title={t12(language, 'Select bolt size', 'Cıvata ölçüsü seç')}
          >
            ▾
          </button>

          {showBoltMenu && (
            <div className="absolute bottom-full mb-1 left-0 z-40 bg-[var(--bg-1)] border border-[var(--line)] rounded shadow-xl p-1 grid grid-cols-3 gap-1 min-w-[130px]">
              {METRIC_SIZES.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    setSelectedBolt(b);
                    handleCornerBolts(b);
                  }}
                  className={`px-2 py-1 text-center text-[10px] rounded hover:bg-[var(--bg-2)] cursor-pointer ${
                    selectedBolt === b ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-slate-300'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Configurable Hole & Click-to-Drill Popover */}
        <div className="inline-flex items-stretch relative">
          <button
            type="button"
            onClick={() => handleAddCenterHole(selectedBolt, selectedHoleType)}
            className={`px-2 py-1 rounded-l-[var(--radius-s)] border-y border-l font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors ${
              clickToPlaceHole
                ? 'bg-[var(--cyan)] text-slate-950 border-[var(--cyan)]'
                : 'bg-sky-500/15 hover:bg-sky-500/25 border-sky-500/40 text-sky-300'
            }`}
            title={t12(language, `Drill ${selectedBolt} hole at face center`, `Yüzey merkezine ${selectedBolt} delik aç`)}
          >
            <CircleDot size={11} className={clickToPlaceHole ? 'text-slate-950' : 'text-sky-400'} />
            <span>{t12(language, `Hole ${selectedBolt}`, `Delik ${selectedBolt}`)}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowHoleMenu(!showHoleMenu);
              setShowBoltMenu(false);
              setShowSlotMenu(false);
            }}
            className="px-1.5 py-1 rounded-r-[var(--radius-s)] bg-sky-500/15 hover:bg-sky-500/25 border border-l-0 border-sky-500/40 text-sky-300 font-bold text-[10px] cursor-pointer"
            title={t12(language, 'Configure ISO Hole Size, Type & Click-to-Drill', 'Delik Çapı, Tipi ve Tıkla-Del Seçenekleri')}
          >
            ▾
          </button>

          {showHoleMenu && (
            <div className="absolute bottom-full mb-1.5 left-0 z-50 bg-[var(--bg-1)] border border-[var(--cyan)]/40 rounded-[var(--radius-m)] shadow-2xl p-2.5 flex flex-col gap-2 min-w-[230px]">
              <div className="text-[10px] font-bold text-[var(--cyan)] uppercase tracking-wider flex items-center justify-between">
                <span>{t12(language, 'ISO 273 / DIN 912 Hole Wizard', 'ISO Delik Sihirbazı')}</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {METRIC_SIZES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedBolt(m)}
                    className={`py-1 rounded text-[10px] font-bold cursor-pointer border ${
                      selectedBolt === m
                        ? 'bg-[var(--cyan)]/20 border-[var(--cyan)] text-[var(--cyan)]'
                        : 'bg-[var(--bg-2)] border-[var(--line)] text-slate-300 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1">
                {(
                  [
                    { id: 'clearance', label: 'Serbest (Clearance)' },
                    { id: 'tap', label: 'Kılavuz Diş (Tap)' },
                    { id: 'counterbore', label: 'İmbus Yuvalı (CBore)' },
                    { id: 'countersink', label: 'Havşa Başlı (CSink)' },
                  ] as const
                ).map((ht) => (
                  <button
                    key={ht.id}
                    type="button"
                    onClick={() => setSelectedHoleType(ht.id)}
                    className={`px-1.5 py-1 rounded text-[9.5px] font-bold cursor-pointer border text-left ${
                      selectedHoleType === ht.id
                        ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                        : 'bg-[var(--bg-2)] border-[var(--line)] text-slate-400 hover:text-white'
                    }`}
                  >
                    {ht.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 pt-1 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => handleAddCenterHole(selectedBolt, selectedHoleType)}
                  className="flex-1 py-1.5 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/50 text-sky-200 font-bold text-[10px] cursor-pointer"
                >
                  {t12(language, '+ Center Hole', '+ Merkeze Del')}
                </button>
                <button
                  type="button"
                  onClick={handleToggleClickToDrill}
                  className={`flex-1 py-1.5 rounded border font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer ${
                    clickToPlaceHole
                      ? 'bg-[var(--cyan)] text-slate-950 border-[var(--cyan)]'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/50 text-emerald-200'
                  }`}
                >
                  <Crosshair size={11} />
                  <span>{t12(language, 'Click on 3D Face', 'Yüzeye Tıkla Del')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Configurable Pocket / Slot / Chamfer Stamp */}
        <div className="inline-flex items-stretch relative">
          <button
            type="button"
            onClick={handleApplyCutOrSlot}
            className="px-2 py-1 rounded-l-[var(--radius-s)] bg-amber-500/10 hover:bg-amber-500/20 border-y border-l border-amber-400/40 text-amber-200 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
            title={t12(language, 'Cut slot/pocket at face center', 'Yüzey merkezine kanal/cep aç')}
          >
            <Split size={11} className="text-amber-400" />
            <span className="hidden sm:inline">{t12(language, 'Slot / Pocket', 'Kanal / Cep')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowSlotMenu(!showSlotMenu);
              setShowHoleMenu(false);
              setShowBoltMenu(false);
            }}
            className="px-1.5 py-1 rounded-r-[var(--radius-s)] bg-amber-500/10 hover:bg-amber-500/20 border border-l-0 border-amber-400/40 text-amber-200 font-bold text-[10px] cursor-pointer"
            title={t12(language, 'Configure Pocket / Slot / Chamfer Dimensions', 'Kanal / Cep / Pah Ölçülerini Ayarla')}
          >
            ▾
          </button>

          {showSlotMenu && (
            <div className="absolute bottom-full mb-1.5 right-0 z-50 bg-[var(--bg-1)] border border-[var(--cyan)]/40 rounded-[var(--radius-m)] shadow-2xl p-2.5 flex flex-col gap-2 min-w-[230px]">
              <div className="text-[10px] font-bold text-[var(--cyan)] uppercase tracking-wider">
                {t12(language, 'CNC Pocket / Slot / Chamfer', 'CNC Kanal / Cep / Pah Aç')}
              </div>
              <div className="grid grid-cols-2 gap-1">
                {(
                  [
                    { id: 'slot', label: 'Kama Kanalı (Slot)' },
                    { id: 'rect', label: 'Dikdörtgen Cep' },
                    { id: 'circle', label: 'Dairesel Cep' },
                    { id: 'chamfer', label: 'Kenar Pahı (Chamfer)' },
                  ] as const
                ).map((ck) => (
                  <button
                    key={ck.id}
                    type="button"
                    onClick={() => setCutKind(ck.id)}
                    className={`px-1.5 py-1 rounded text-[9.5px] font-bold cursor-pointer border text-left ${
                      cutKind === ck.id
                        ? 'bg-[var(--cyan)]/20 border-[var(--cyan)] text-[var(--cyan)]'
                        : 'bg-[var(--bg-2)] border-[var(--line)] text-slate-400 hover:text-white'
                    }`}
                  >
                    {ck.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <label className="flex flex-col gap-0.5 text-[9px] text-slate-400">
                  <span>Genişlik W</span>
                  <input
                    type="number"
                    value={slotW}
                    onChange={(e) => setSlotW(Math.max(1, Number(e.target.value) || 1))}
                    className="px-1.5 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-white font-bold text-[10px]"
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-[9px] text-slate-400">
                  <span>Boy L</span>
                  <input
                    type="number"
                    value={slotL}
                    onChange={(e) => setSlotL(Math.max(1, Number(e.target.value) || 1))}
                    className="px-1.5 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-white font-bold text-[10px]"
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-[9px] text-slate-400">
                  <span>Derinlik D</span>
                  <input
                    type="number"
                    value={slotD}
                    onChange={(e) => setSlotD(Math.max(0.5, Number(e.target.value) || 1))}
                    className="px-1.5 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-white font-bold text-[10px]"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={handleApplyCutOrSlot}
                className="w-full py-1.5 rounded bg-[var(--cyan)] hover:opacity-90 text-slate-950 font-extrabold text-[10px] cursor-pointer"
              >
                {t12(language, 'Apply CNC Cut to Face', 'Seçili Yüzeye Uygula')}
              </button>
            </div>
          )}
        </div>

        {/* Isogrid Lightweighting */}
        <button
          type="button"
          onClick={handleIsogrid}
          className="px-2 py-1 rounded-[var(--radius-s)] bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
          title={t12(language, 'Generate lightweight isogrid pocketing (-35% mass)', 'Kütle azaltıcı isogrid cepler aç (-%35)')}
        >
          <Grid3X3 size={11} className="text-emerald-400" />
          <span className="hidden xl:inline">{t12(language, 'Lightweight', 'Hafiflet')}</span>
        </button>

        {/* ─── SIEMENS NX SYNCHRONOUS MODELING ACTIONS ─── */}
        <div className="w-[1px] h-4 bg-[var(--line)]" />

        {/* Delete Face & Heal */}
        <button
          type="button"
          onClick={handleDeleteAndHeal}
          className={`px-2 py-1 rounded-[var(--radius-s)] border font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors ${
            hasFeaturesOnFace
              ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-300'
              : 'bg-[var(--bg-2)] border-[var(--line)] text-slate-500 hover:text-slate-300'
          }`}
          title={t12(language, 'Siemens NX Delete Face & Auto-Heal', 'Siemens NX Yüzey Sil ve Otomatik Onar')}
        >
          <Trash2 size={11} className={hasFeaturesOnFace ? 'text-rose-400' : 'text-slate-500'} />
          <span className="hidden lg:inline">{t12(language, 'Del & Heal', 'Sil & Onar')}</span>
        </button>

        {/* Direct Resize Hole (if holes exist on face) */}
        {hasHolesOnFace && (
          <div className="flex items-center gap-1 bg-[var(--bg-1)] px-1 py-0.5 rounded border border-[var(--line)]">
            <span className="text-[9px] text-[var(--alu)]">Ø:</span>
            <select
              value={faceHoles[faceHoles.length - 1]?.size || 'M6'}
              onChange={(e) => handleResizeHoleDirect(e.target.value)}
              className="bg-[var(--bg-0)] text-white text-[9.5px] font-bold rounded px-1 py-0.5 border border-[var(--line)] focus:outline-none focus:border-[var(--cyan)] cursor-pointer"
            >
              {METRIC_SIZES.map((sz) => (
                <option key={sz} value={sz}>{sz}</option>
              ))}
            </select>
          </div>
        )}

        {/* Draft Angle (Mold Release Taper) */}
        <button
          type="button"
          onClick={() => handleToggleDraftAngle(3)}
          className={`px-2 py-1 rounded-[var(--radius-s)] border font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors ${
            selectedPart.params?.draftAngle && selectedPart.params.draftAngle > 0
              ? 'bg-[var(--cyan)] text-slate-950 border-[var(--cyan)]'
              : 'bg-[var(--bg-2)] border-[var(--line)] text-slate-400 hover:text-white'
          }`}
          title={t12(language, 'Toggle 3° Mold Release Draft Angle', '3° Kalıp Çıkma Açısı (Draft) Aç/Kapat')}
        >
          <Sliders size={11} />
          <span className="hidden xl:inline">{t12(language, 'Draft 3°', 'Kalıp 3°')}</span>
        </button>

        {/* NX Live Rules: Detect Coplanar */}
        <button
          type="button"
          onClick={handleDetectCoplanar}
          className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--cyan)]/20 border border-[var(--line)] hover:border-[var(--cyan)]/50 text-slate-300 hover:text-[var(--cyan)] font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
          title={t12(language, 'NX Live Rules: Detect Coplanar Faces in Assembly', 'NX Senkron Kurallar: Montajdaki Eş Düzlemli Yüzeyleri Algıla')}
        >
          <Layers size={11} />
          <span className="hidden 2xl:inline">{t12(language, 'Coplanar Rules', 'Eş Düzlemli')}</span>
        </button>
      </div>

      {/* Dismiss / Close Active Face Selection */}
      <button
        type="button"
        onClick={() => {
          useDesignStore.getState().setActiveFace(null);
          useDesignStore.getState().setClickToPlaceHole(false);
        }}
        className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer ml-0.5"
        title={t12(language, 'Deselect Face (Esc)', 'Yüzey Seçimini Kapat')}
      >
        <X size={12} />
      </button>
    </div>
  );
}
