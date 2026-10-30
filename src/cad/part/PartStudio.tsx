'use client';
/**
 * AluCAD Part Studio — sketch-based parametric part modelling
 * (Inventor / SolidWorks workflow):
 *
 *   1. New Sketch → pick Front / Top / Right plane or a planar face
 *   2. Draw (line chain, rectangle, circle, 3-point arc), snap to points / grid,
 *      H/V inferred automatically; Smart Dimension drives the geometry
 *   3. Finish Sketch → Extrude / Revolve dialog opens with the profile
 *   4. Everything stays editable: double-click a sketch or feature in the tree,
 *      change it, the solid regenerates.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import {
  MousePointer2, Slash, Square, Circle as CircleIcon, Spline, Ruler, Check, X, Undo2, Redo2, Trash2,
  PenLine, Box, RotateCw, Scissors, Eye, EyeOff, Download, Send, Plus, Pencil, AlertTriangle, ArrowLeftRight,
  Maximize2, Minus, CornerDownRight, Equal, GripHorizontal, GripVertical, HelpCircle, Layers,
  Sparkles, CircleDot, Disc, Grid, Repeat, FlipHorizontal, Target,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { usePartStore, activeSketchFeature, type SketchTool } from './partStore';
import { usePartHud } from './PartViewport';
import {
  regenerate, volumeOf, toBinarySTL, ORIGIN_PLANES, newSketchFeature,
  type Feature, type ExtrudeFeature, type RevolveFeature, type HoleFeature, type ThreadFeature,
  type LinearPatternFeature, type CircularPatternFeature, type MirrorFeature,
  type HoleType, type ThreadStandard, type SketchFeature, type Operation,
} from './features';
import { deleteEntities, remainingDof, solveSketch, skId, type SkConstraint } from './sketch';
import { detectProfiles } from './profiles';
import { DynamicBlockConfigurator } from '@/cad/components/DynamicBlockConfigurator';
import { useDesignStore } from '@/design-studio/designStore';
import { ISO_METRIC_HOLES } from '@/design-studio/holeStandards';

const PartViewport = dynamic(() => import('./PartViewport').then((m) => m.PartViewport), { ssr: false });

export interface PartStudioProps {
  /** close button (when embedded in the 3D studio) */
  onClose?: () => void;
  /** hand finished bodies to the host (e.g. add to assembly). Geometry in mm. */
  onSendBodies?: (bodies: { name: string; geometry: THREE.BufferGeometry }[], partName: string) => void;
}

const T = (isTr: boolean, tr: string, en: string) => (isTr ? tr : en);

function Btn({ icon, label, onClick, active, disabled, title, tone, kbd }: { icon: React.ReactNode; label?: string; onClick?: () => void; active?: boolean; disabled?: boolean; title?: string; tone?: 'ok' | 'bad' | 'accent'; kbd?: string }) {
  const toneCls = tone === 'ok' ? 'bg-[var(--ok)] text-[var(--accent-ink)] border-transparent' : tone === 'bad' ? 'text-[var(--bad)]' : tone === 'accent' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] border-transparent' : '';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={(title || label || '') + (kbd ? `  (${kbd})` : '')}
      className={`flex min-w-[44px] flex-col items-center gap-0.5 rounded-[var(--radius-s)] border px-1.5 py-1 text-[10px] leading-tight transition-colors disabled:opacity-35 ${
        active ? 'border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--cyan)]' : `border-transparent text-[var(--alu)] hover:bg-[var(--hover)] hover:text-[var(--ink)] ${toneCls}`
      }`}
    >
      <span className="flex h-4 items-center">{icon}</span>
      {label && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

function NumberField({ value, onChange, autoFocus, allowNegative = false }: { value: number; onChange: (v: number) => void; autoFocus?: boolean; allowNegative?: boolean }) {
  const apply = usePartStore((s) => s.applyFeature);
  const cancel = usePartStore((s) => s.cancelFeature);
  const [txt, setTxt] = useState(String(value));
  const last = useRef(value);
  useEffect(() => { if (value !== last.current) { setTxt(String(value)); last.current = value; } }, [value]);
  const commit = (t: string) => {
    const sanitized = t.trim().replace(',', '.');
    let n: number;
    try {
      n = /^[-+\d\s.*/()]+$/.test(sanitized) ? Number(Function(`"use strict";return (${sanitized})`)()) : Number(sanitized);
    } catch { n = NaN; }
    const valid = isFinite(n) && (allowNegative ? true : n > 0);
    if (valid) { last.current = n; onChange(n); }
  };
  return (
    <input
      value={txt}
      autoFocus={autoFocus}
      onFocus={(e) => e.target.select()}
      onChange={(e) => { setTxt(e.target.value); commit(e.target.value); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(txt); window.setTimeout(apply, 0); return; }
        if (e.key === 'Escape') { e.preventDefault(); cancel(); return; }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const n = Math.max(0.01, (Number(txt) || value) + (e.key === 'ArrowUp' ? step : -step));
          setTxt(String(n)); commit(String(n));
        }
      }}
      inputMode="decimal"
      className="w-full rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] px-1.5 py-1 font-mono text-[var(--ink)] outline-none focus:border-[var(--cyan)]"
    />
  );
}

const Sep = () => <div className="mx-1 h-9 w-px shrink-0 bg-[var(--line)]" />;

const ERR: Record<string, [string, string]> = {
  'no-profile': ['Kapalı profil yok', 'No closed profile'],
  'sketch-missing': ['Eskiz bulunamadı', 'Sketch missing'],
  'crosses-axis': ['Profil ekseni kesiyor', 'Profile crosses the axis'],
  axis: ['Eksen geçersiz', 'Invalid axis'],
  'nothing-to-cut': ['Kesilecek gövde yok', 'Nothing to cut'],
  'no-intersection': ['Gövdeyle kesişmiyor', 'Does not touch a body'],
  empty: ['Boş sonuç', 'Empty result'],
};

export function PartStudio({ onClose, onSendBodies }: PartStudioProps) {
  const language = useI18nStore((s) => s.language);
  const isTr = language === 'tr';
  const st = usePartStore();
  const hud = usePartHud();
  const { doc, mode, tool, draft, featureDraft } = st;
  const sketchFeature = activeSketchFeature(st);
  const [toast, setToast] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isDynModalOpen, setIsDynModalOpen] = useState(false);
  const [isSketchArrayModalOpen, setIsSketchArrayModalOpen] = useState(false);
  const [arrayTab, setArrayTab] = useState<'linear' | 'circular'>('linear');
  const [arrCountX, setArrCountX] = useState(3);
  const [arrStepX, setArrStepX] = useState(20);
  const [arrCountY, setArrCountY] = useState(1);
  const [arrStepY, setArrStepY] = useState(20);
  const [arrAngle, setArrAngle] = useState(0);
  const [arrCircCenterX, setArrCircCenterX] = useState(0);
  const [arrCircCenterY, setArrCircCenterY] = useState(0);
  const [arrCircCount, setArrCircCount] = useState(4);
  const [arrCircAngle, setArrCircAngle] = useState(360);
  const ping = (m: string) => { setToast(m); window.setTimeout(() => setToast((t) => (t === m ? null : t)), 2600); };

  // ── regeneration (committed doc) ──
  const regen = useMemo(() => regenerate(doc), [doc]);

  // ── feature preview (debounced) ──
  const [preview, setPreview] = useState<{ regen: ReturnType<typeof regenerate>; tool: THREE.BufferGeometry | null } | null>(null);
  useEffect(() => {
    if (mode !== 'feature' || !featureDraft) { setPreview(null); return; }
    const id = window.setTimeout(() => {
      const f = featureDraft.feature;
      const features = featureDraft.editingId ? doc.features.map((x) => (x.id === featureDraft.editingId ? f : x)) : [...doc.features, f];
      const r = regenerate({ ...doc, features });
      setPreview({ regen: r, tool: r.tools[f.id] ?? null });
    }, 120);
    return () => window.clearTimeout(id);
  }, [mode, featureDraft, doc]);

  const shownRegen = mode === 'feature' && preview ? preview.regen : regen;

  // ── keyboard ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt?.closest?.('input,textarea,select,[contenteditable=true]')) return;
      const s = usePartStore.getState();
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); if (s.mode === 'sketch') s.undoSketch(); else s.undoDoc(); return; }
      if ((e.ctrlKey || e.metaKey) && (k === 'y' || (e.shiftKey && k === 'z'))) { e.preventDefault(); if (s.mode === 'sketch') s.redoSketch(); else s.redoDoc(); return; }
      const plainKey = !e.ctrlKey && !e.metaKey && !e.altKey;
      if (s.mode === 'sketch') {
        if (k === 'enter' && (e.ctrlKey || e.metaKey)) { finish(); return; }
        if (!plainKey) return;
        if (k === 'escape') { if (s.tool !== 'select') s.setTool('select'); else s.setSelection([]); return; }
        if (k === 'l') s.setTool('line');
        else if (k === 'r') s.setTool('rect');
        else if (k === 'c') s.setTool('circle');
        else if (k === 'a') s.setTool('arc');
        else if (k === 'p') s.setTool('point');
        else if (k === 't') s.setTool('trim');
        else if (k === 'd') s.setTool('dimension');
        else if (k === 's') s.setTool('select');
        else if (k === 'x') toggleConstructionSel();
        else if (k === 'h') addRelation('horizontal');
        else if (k === 'v') addRelation('vertical');
        else if (k === 'delete' || k === 'backspace') deleteSelection();
        return;
      }
      if (s.mode === 'feature') {
        // preventDefault: a focused ribbon button would otherwise re-fire on Enter
        if (k === 'escape') { e.preventDefault(); s.cancelFeature(); }
        if (k === 'enter') { e.preventDefault(); (document.activeElement as HTMLElement | null)?.blur?.(); s.applyFeature(); }
        return;
      }
      if (s.mode === 'pickPlane' && k === 'escape') { usePartStore.setState({ mode: 'model' }); return; }
      if (s.mode === 'model' && plainKey) {
        if (k === 's') s.beginPickPlane();
        else if (k === 'e') s.openFeature('extrude');
        else if (k === 'f') s.requestView('fit');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── sketch actions ──
  const selEntities = () => {
    const s = usePartStore.getState();
    return s.selection.filter((x) => !x.startsWith('pt:') && !x.startsWith('cn:'));
  };
  function deleteSelection() {
    const s = usePartStore.getState();
    if (!s.draft || !s.selection.length) return;
    const ents = selEntities();
    let sk = s.draft;
    const pts = s.selection.filter((x) => x.startsWith('pt:')).map((x) => x.slice(3));
    if (pts.length) {
      const kill = sk.entities.filter((e) => (
        e.type === 'line' ? pts.includes(e.p1) || pts.includes(e.p2) :
        e.type === 'circle' ? pts.includes(e.c) :
        e.type === 'point' ? pts.includes(e.p) :
        pts.includes(e.c) || pts.includes(e.p1) || pts.includes(e.p2)
      )).map((e) => e.id);
      ents.push(...kill);
    }
    // If any entity or point belongs to a dynamic block, delete the whole block cleanly
    const blockIds = new Set<string>();
    for (const id of ents) {
      const e = sk.entities.find((x) => x.id === id);
      if (e?.blockInstanceId) blockIds.add(e.blockInstanceId);
    }
    for (const pid of pts) {
      const p = sk.points[pid];
      if (p?.blockInstanceId) blockIds.add(p.blockInstanceId);
    }
    if (blockIds.size > 0) {
      const allBlockEnts = sk.entities
        .filter((e) => e.blockInstanceId && blockIds.has(e.blockInstanceId))
        .map((e) => e.id);
      ents.push(...allBlockEnts);
    }
    sk = deleteEntities(sk, ents);
    s.commitDraft(sk, { solve: false });
    s.setSelection([]);
  }
  function toggleConstructionSel() {
    const s = usePartStore.getState();
    if (!s.draft) return;
    const ents = selEntities();
    if (!ents.length) { s.setConstruction(!s.construction); return; }
    s.commitDraft({ ...s.draft, entities: s.draft.entities.map((e) => (ents.includes(e.id) ? { ...e, construction: !e.construction } : e)) }, { solve: false });
  }
  function toggleCenterlineSel() {
    const s = usePartStore.getState();
    if (!s.draft) return;
    const ents = selEntities();
    if (!ents.length) { s.setCenterline(!s.centerline); return; }
    s.commitDraft({
      ...s.draft,
      entities: s.draft.entities.map((e) => {
        if (!ents.includes(e.id) || e.type !== 'line') return e;
        const nextCl = !e.centerline;
        return {
          ...e,
          centerline: nextCl,
          construction: nextCl ? true : e.construction,
        };
      }),
    }, { solve: false });
  }
  function addRelation(type: 'horizontal' | 'vertical' | 'equal' | 'perpendicular' | 'parallel') {
    const s = usePartStore.getState();
    if (!s.draft) return;
    const ents = selEntities();
    const lines = ents.filter((id) => s.draft!.entities.find((e) => e.id === id)?.type === 'line');
    const add: SkConstraint[] = [];
    if (type === 'horizontal' || type === 'vertical') {
      for (const l of lines) {
        if (s.draft.constraints.some((c) => (c.type === 'horizontal' || c.type === 'vertical') && c.line === l)) continue;
        add.push({ id: skId(type[0].toUpperCase()), type, line: l });
      }
    } else {
      const pool = type === 'equal' ? ents : lines;
      if (pool.length < 2) { ping(T(isTr, 'İki öğe seçin (Shift ile)', 'Select two items (Shift)')); return; }
      for (let i = 1; i < pool.length; i++) add.push({ id: skId('R'), type, a: pool[0], b: pool[i] } as SkConstraint);
    }
    if (!add.length) { ping(T(isTr, 'Önce bir çizgi seçin', 'Select a line first')); return; }
    s.commitDraft({ ...s.draft, constraints: [...s.draft.constraints, ...add] });
  }
  function finish() {
    const r = usePartStore.getState().finishSketch();
    if (!r) return;
    const d = usePartStore.getState().doc;
    const used = d.features.some((f) => 'sketchId' in f && f.sketchId === r.featureId);
    if (r.hasProfile && !used) {
      usePartStore.getState().openFeature('extrude', { sketchId: r.featureId });
      ping(T(isTr, 'Profil hazır: mesafeyi girip ✓ ile katı oluşturun', 'Profile ready: set the distance and press ✓'));
    } else if (!r.hasProfile) ping(T(isTr, 'Eskizde kapalı profil yok — katı için kapalı bir şekil çizin', 'No closed profile in this sketch'));
  }

  // ── output ──
  const totalVolume = regen.bodies.reduce((a, b) => a + volumeOf(b.geometry), 0);
  const downloadSTL = () => {
    if (!regen.bodies.length) return;
    const blob = new Blob([toBinarySTL(regen.bodies.map((b) => b.geometry))], { type: 'model/stl' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${doc.name || 'part'}.stl`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const prof = useMemo(() => (draft ? detectProfiles(draft) : null), [draft]);
  const dof = draft ? remainingDof(draft) : 0;
  const solveState = draft ? solveSketch(draft, { iterations: 1 }) : null;

  const sketches = doc.features.filter((f): f is SketchFeature => f.type === 'sketch');

  // ───────────────────────────── ribbon ─────────────────────────────
  const toolBtn = (t: SketchTool, icon: React.ReactNode, label: string, kbd: string) => (
    <Btn icon={icon} label={label} kbd={kbd} active={tool === t} onClick={() => st.setTool(t)} />
  );

  const dynBlockBtn = (
    <Btn
      icon={<Sparkles size={15} className="text-cyan-400" />}
      label={T(isTr, 'Dinamik Blok', 'Dyn Block')}
      onClick={() => setIsDynModalOpen(true)}
      title={T(
        isTr,
        'AutoCAD / 2D CAD Dinamik Blok Kütüphanesini Aç (Flanş, Dişli, Kasnak, Profil, Cıvata vb.)',
        'Open AutoCAD / 2D CAD Dynamic Blocks Library (Flanges, Gears, Pulleys, Profiles, Bolts, etc.)'
      )}
    />
  );

  const ribbon = mode === 'sketch' ? (
    <>
      {toolBtn('select', <MousePointer2 size={15} />, T(isTr, 'Seç', 'Select'), 'S')}
      <Sep />
      {toolBtn('point', <CircleDot size={15} />, T(isTr, 'Nokta', 'Point'), 'P')}
      {toolBtn('line', <Slash size={15} />, T(isTr, 'Çizgi', 'Line'), 'L')}
      {toolBtn('rect', <Square size={15} />, T(isTr, 'Dikdörtgen', 'Rectangle'), 'R')}
      {toolBtn('circle', <CircleIcon size={15} />, T(isTr, 'Daire', 'Circle'), 'C')}
      {toolBtn('arc', <Spline size={15} />, T(isTr, 'Yay (3 nk)', 'Arc 3-pt'), 'A')}
      <Btn icon={<CornerDownRight size={15} />} label={T(isTr, 'Yapı çizgisi', 'Construction')} kbd="X" active={st.construction} onClick={toggleConstructionSel} title={T(isTr, 'Seçili öğeleri yapı çizgisine çevir / yeni çizimleri yapı çizgisi yap', 'Toggle construction for selection / new geometry')} />
      <Btn
        icon={<span className="font-mono text-[12px] font-bold tracking-tighter text-[var(--cyan)]">⸺·⸺</span>}
        label={T(isTr, 'Eksen Çizgisi', 'Centerline')}
        active={st.centerline || (!!st.draft?.entities.some((e) => e.type === 'line' && (e as any).centerline && st.selection.includes(e.id)))}
        onClick={toggleCenterlineSel}
        title={T(isTr, 'Seçili çizgiyi Dönme Ekseni ve Çap Ölçüsü için Eksen Çizgisine dönüştür', 'Convert selected line to Centerline for Revolve Axis & Diametric Dimensions')}
      />
      <Sep />
      {toolBtn('trim', <Scissors size={15} />, T(isTr, 'Buda (Trim)', 'Trim'), 'T')}
      <div className="flex items-center gap-1">
        {toolBtn('fillet', <Spline size={15} className="rotate-90" />, T(isTr, 'Radius', 'Fillet'), '')}
        {tool === 'fillet' && (
          <div className="flex items-center gap-0.5 rounded border border-[var(--cyan)] bg-[var(--bg-2)] px-1.5 py-0.5 text-[11px]">
            <span className="font-mono font-bold text-[var(--cyan)]">R:</span>
            <input
              type="number"
              value={st.filletRadius}
              onChange={(e) => st.setFilletRadius(Number(e.target.value))}
              className="w-10 bg-transparent text-right font-mono text-[11px] text-[var(--ink)] outline-none"
              title={T(isTr, 'Radius yarıçapı (mm)', 'Fillet radius (mm)')}
            />
            <span className="text-[10px] text-[var(--muted)]">mm</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        {toolBtn('chamfer', <Slash size={15} className="rotate-45" />, T(isTr, 'Pah', 'Chamfer'), '')}
        {tool === 'chamfer' && (
          <div className="flex items-center gap-0.5 rounded border border-[var(--cyan)] bg-[var(--bg-2)] px-1.5 py-0.5 text-[11px]">
            <span className="font-mono font-bold text-[var(--cyan)]">d:</span>
            <input
              type="number"
              value={st.chamferDistance}
              onChange={(e) => st.setChamferDistance(Number(e.target.value))}
              className="w-10 bg-transparent text-right font-mono text-[11px] text-[var(--ink)] outline-none"
              title={T(isTr, 'Pah mesafesi (mm)', 'Chamfer distance (mm)')}
            />
            <span className="text-[10px] text-[var(--muted)]">mm</span>
          </div>
        )}
      </div>
      <Sep />
      {toolBtn('dimension', <Ruler size={15} />, T(isTr, 'Ölçü', 'Dimension'), 'D')}
      {dynBlockBtn}
      <Btn
        icon={<Grid size={15} />}
        label={T(isTr, 'Çoğalt (Array)', 'Array')}
        onClick={() => {
          if (!st.selection.length) {
            ping(T(isTr, 'Önce çoğaltılacak çizgileri/noktaları seçin', 'Select entities to pattern first'));
            return;
          }
          setIsSketchArrayModalOpen(true);
        }}
        title={T(isTr, '2D Çoğaltma: Doğrusal veya Dairesel Dizi', '2D Pattern: Linear or Circular Array')}
      />
      <Btn icon={<GripHorizontal size={15} />} label={T(isTr, 'Yatay', 'Horizontal')} kbd="H" onClick={() => addRelation('horizontal')} />
      <Btn icon={<GripVertical size={15} />} label={T(isTr, 'Dikey', 'Vertical')} kbd="V" onClick={() => addRelation('vertical')} />
      <Btn icon={<Equal size={15} />} label={T(isTr, 'Eşit', 'Equal')} onClick={() => addRelation('equal')} />
      <Btn icon={<span className="font-bold">⊥</span>} label={T(isTr, 'Dik', 'Perp.')} onClick={() => addRelation('perpendicular')} />
      <Btn icon={<span className="font-bold">∥</span>} label={T(isTr, 'Paralel', 'Parallel')} onClick={() => addRelation('parallel')} />
      <Sep />
      <Btn icon={<Trash2 size={15} />} label={T(isTr, 'Sil', 'Delete')} kbd="Del" onClick={deleteSelection} disabled={!st.selection.length} />
      <Btn icon={<Undo2 size={15} />} label={T(isTr, 'Geri', 'Undo')} kbd="Ctrl+Z" onClick={st.undoSketch} disabled={!st.draftPast.length} />
      <Btn icon={<Redo2 size={15} />} label={T(isTr, 'İleri', 'Redo')} kbd="Ctrl+Y" onClick={st.redoSketch} disabled={!st.draftFuture.length} />
      <Sep />
      <label className="flex flex-col items-center gap-0.5 px-1 text-[10px] text-[var(--muted)]">
        <select value={st.gridStep} onChange={(e) => st.setGridStep(Number(e.target.value))} className="rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] px-1 py-0.5 text-[11px] text-[var(--ink)]">
          {[0, 0.5, 1, 2, 5, 10].map((g) => <option key={g} value={g}>{g === 0 ? T(isTr, 'kapalı', 'off') : `${g} mm`}</option>)}
        </select>
        {T(isTr, 'Izgara', 'Grid snap')}
      </label>
      <Btn icon={<Maximize2 size={15} />} label={T(isTr, 'Normal bak', 'Look at')} onClick={() => st.requestView('normal')} />
      <div className="flex-1" />
      <Btn icon={<X size={15} />} label={T(isTr, 'Vazgeç', 'Cancel')} onClick={st.cancelSketch} tone="bad" />
      <Btn icon={<Check size={15} />} label={T(isTr, 'Eskizi bitir', 'Finish sketch')} kbd="Ctrl+Enter" onClick={finish} tone="ok" />
    </>
  ) : (
    <>
      <Btn icon={<PenLine size={15} />} label={T(isTr, 'Yeni eskiz', 'New sketch')} kbd="S" active={mode === 'pickPlane'} onClick={st.beginPickPlane} tone={regen.bodies.length === 0 && mode === 'model' ? 'accent' : undefined} />
      {dynBlockBtn}
      <Sep />
      <Btn icon={<Box size={15} />} label={T(isTr, 'Ekstrüzyon', 'Extrude')} kbd="E" disabled={!sketches.length} onClick={() => st.openFeature('extrude')} />
      <Btn icon={<Scissors size={15} />} label={T(isTr, 'Ekstrüzyon kes', 'Extrude cut')} disabled={!sketches.length || !regen.bodies.length} onClick={() => st.openFeature('extrude', { operation: 'cut' })} />
      <Btn icon={<RotateCw size={15} />} label={T(isTr, 'Döndür', 'Revolve')} disabled={!sketches.length} onClick={() => st.openFeature('revolve')} />
      <Btn icon={<CircleDot size={15} />} label={T(isTr, 'Delik Aç', 'Hole')} disabled={!regen.bodies.length} onClick={() => st.openFeature('hole')} />
      <Btn icon={<Disc size={15} />} label={T(isTr, 'Diş Aç', 'Thread')} disabled={!regen.bodies.length} onClick={() => st.openFeature('thread')} />
      <Sep />
      <Btn icon={<Grid size={15} />} label={T(isTr, 'Doğrusal Çoğalt', 'Linear Pattern')} disabled={!regen.bodies.length} onClick={() => st.openFeature('linearPattern')} />
      <Btn icon={<Repeat size={15} />} label={T(isTr, 'Dairesel Çoğalt', 'Circular Pattern')} disabled={!regen.bodies.length} onClick={() => st.openFeature('circularPattern')} />
      <Btn icon={<FlipHorizontal size={15} />} label={T(isTr, 'Aynala', 'Mirror')} disabled={!regen.bodies.length} onClick={() => st.openFeature('mirror')} />
      <Sep />
      <Btn icon={<Undo2 size={15} />} label={T(isTr, 'Geri', 'Undo')} kbd="Ctrl+Z" onClick={st.undoDoc} disabled={!st.docPast.length} />
      <Btn icon={<Redo2 size={15} />} label={T(isTr, 'İleri', 'Redo')} kbd="Ctrl+Y" onClick={st.redoDoc} disabled={!st.docFuture.length} />
      <Sep />
      <Btn icon={<span className="text-[11px] font-bold">ISO</span>} label={T(isTr, 'İzometrik', 'Iso')} onClick={() => st.requestView('iso')} />
      <Btn icon={<span className="text-[11px] font-bold">F</span>} label={T(isTr, 'Ön', 'Front')} onClick={() => st.requestView('front')} />
      <Btn icon={<span className="text-[11px] font-bold">T</span>} label={T(isTr, 'Üst', 'Top')} onClick={() => st.requestView('top')} />
      <Btn icon={<span className="text-[11px] font-bold">R</span>} label={T(isTr, 'Sağ', 'Right')} onClick={() => st.requestView('right')} />
      <Btn icon={<Maximize2 size={15} />} label={T(isTr, 'Sığdır', 'Fit')} kbd="F" onClick={() => st.requestView('fit')} />
      <div className="flex-1" />
      <Btn icon={<Download size={15} />} label="STL" onClick={downloadSTL} disabled={!regen.bodies.length} />
      {onSendBodies && (
        <Btn
          icon={<Send size={15} />}
          label={T(isTr, 'Montaja gönder', 'Send to assembly')}
          tone="accent"
          disabled={!regen.bodies.length}
          onClick={() => {
            onSendBodies(regen.bodies.map((b) => ({ name: b.name, geometry: b.geometry })), doc.name);
            ping(T(isTr, 'Parça 3D sahneye gönderildi', 'Part sent to the 3D scene'));
          }}
        />
      )}
      <Btn icon={<Plus size={15} />} label={T(isTr, 'Yeni parça', 'New part')} onClick={() => { if (!doc.features.length || window.confirm(T(isTr, 'Mevcut parça silinsin mi?', 'Discard the current part?'))) st.newPart(); }} />
      {onClose && <Btn icon={<X size={15} />} label={T(isTr, 'Kapat', 'Close')} onClick={onClose} />}
    </>
  );

  // ───────────────────────────── feature panel ─────────────────────────────
  const fdPanel = mode === 'feature' && featureDraft && (() => {
    const f = featureDraft.feature;
    const err = preview?.regen.errors[f.id];

    if (f.type === 'hole') {
      const hf = f as HoleFeature;
      const onStandardChange = (sz: string) => {
        if (sz === 'custom') {
          st.patchFeatureDraft({ standardSize: 'custom' });
          return;
        }
        const std = ISO_METRIC_HOLES.find((h) => h.size === sz);
        if (!std) return;
        const patch: Partial<HoleFeature> = { standardSize: sz };
        if (hf.holeType === 'tapped') {
          patch.diameter = std.tapDrillDiameter;
          patch.threadPitch = std.coarsePitch;
        } else if (hf.holeType === 'counterbore') {
          patch.diameter = std.clearanceMedium;
          patch.cboreDiameter = std.counterboreDiameter;
          patch.cboreDepth = std.counterboreDepth;
        } else if (hf.holeType === 'countersink') {
          patch.diameter = std.clearanceMedium;
          patch.csinkDiameter = std.countersinkDiameter;
          patch.csinkAngle = 90;
        } else {
          patch.diameter = std.clearanceMedium;
        }
        st.patchFeatureDraft(patch);
      };

      const onHoleTypeChange = (ht: HoleType) => {
        const patch: Partial<HoleFeature> = { holeType: ht };
        const std = ISO_METRIC_HOLES.find((h) => h.size === hf.standardSize);
        if (std) {
          if (ht === 'tapped') {
            patch.diameter = std.tapDrillDiameter;
            patch.threadPitch = std.coarsePitch;
          } else if (ht === 'counterbore') {
            patch.diameter = std.clearanceMedium;
            patch.cboreDiameter = std.counterboreDiameter;
            patch.cboreDepth = std.counterboreDepth;
          } else if (ht === 'countersink') {
            patch.diameter = std.clearanceMedium;
            patch.csinkDiameter = std.countersinkDiameter;
            patch.csinkAngle = 90;
          } else {
            patch.diameter = std.clearanceMedium;
          }
        }
        st.patchFeatureDraft(patch);
      };

      return (
        <div className="absolute right-3 top-3 z-20 w-80 max-h-[85vh] overflow-y-auto rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] p-3 text-[12px] text-[var(--ink)] shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold">
              <CircleDot size={15} className="text-[var(--cyan)]" />
              <span>{T(isTr, 'Delik Sihirbazı', 'Hole Wizard')}</span>
              <span className="font-mono text-[var(--muted)]">{f.name}</span>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={st.cancelFeature} title={T(isTr, 'Vazgeç (Esc)', 'Cancel (Esc)')} className="rounded-[var(--radius-s)] p-1 text-[var(--bad)] hover:bg-[var(--hover)]"><X size={15} /></button>
              <button type="button" onClick={st.applyFeature} disabled={!!err && !preview?.tool} title={T(isTr, 'Tamam (Enter)', 'OK (Enter)')} className="rounded-[var(--radius-s)] bg-[var(--ok)] p-1 text-[var(--accent-ink)] disabled:opacity-40"><Check size={15} /></button>
            </div>
          </div>

          {/* Hole Type selector */}
          <label className="mb-1 block text-[11px] text-[var(--muted)]">{T(isTr, 'Delik Tipi', 'Hole Type')}</label>
          <div className="mb-2 grid grid-cols-2 gap-1">
            {([
              { id: 'counterbore', label: T(isTr, 'İmbus / Havşalı', 'Counterbore') },
              { id: 'countersink', label: T(isTr, 'Konik Havşa', 'Countersink') },
              { id: 'tapped', label: T(isTr, 'Kılavuz / Dişli', 'Tapped Hole') },
              { id: 'simple', label: T(isTr, 'Basit Delik', 'Simple Hole') },
            ] as const).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onHoleTypeChange(t.id)}
                className={`rounded-[var(--radius-s)] border px-1.5 py-1 text-[11px] text-center font-medium ${hf.holeType === t.id ? 'border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--cyan)]' : 'border-[var(--line)] text-[var(--alu)] hover:bg-[var(--hover)]'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Standard & Size */}
          <label className="mb-1 block text-[11px] text-[var(--muted)]">{T(isTr, 'Standart Ebat (ISO Metrik)', 'Standard Size (ISO Metric)')}</label>
          <select
            value={hf.standardSize}
            onChange={(e) => onStandardChange(e.target.value)}
            className="mb-2 w-full rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] px-1.5 py-1 font-mono text-[11px] text-[var(--ink)]"
          >
            {ISO_METRIC_HOLES.map((h) => (
              <option key={h.size} value={h.size}>
                {h.size} (Nominal Ø{h.nominalDiameter} mm · {h.coarsePitch} mm pitch)
              </option>
            ))}
            <option value="custom">{T(isTr, 'Özel Boyut (Custom)', 'Custom Size')}</option>
          </select>

          {/* Dimensions */}
          <div className="mb-2 space-y-1.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] p-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Delik Çapı (mm)', 'Hole Diameter (mm)')}</span>
              <div className="w-24">
                <NumberField value={hf.diameter} onChange={(v) => st.patchFeatureDraft({ diameter: v })} />
              </div>
            </div>

            {hf.holeType === 'counterbore' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Havşa Çapı (dk, mm)', 'Cbore Dia (dk, mm)')}</span>
                  <div className="w-24">
                    <NumberField value={hf.cboreDiameter ?? (hf.diameter * 1.6)} onChange={(v) => st.patchFeatureDraft({ cboreDiameter: v })} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Havşa Derinliği (t, mm)', 'Cbore Depth (t, mm)')}</span>
                  <div className="w-24">
                    <NumberField value={hf.cboreDepth ?? (hf.diameter * 0.8)} onChange={(v) => st.patchFeatureDraft({ cboreDepth: v })} />
                  </div>
                </div>
              </>
            )}

            {hf.holeType === 'countersink' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Havşa Çapı (dk, mm)', 'Csink Dia (dk, mm)')}</span>
                  <div className="w-24">
                    <NumberField value={hf.csinkDiameter ?? (hf.diameter * 2.0)} onChange={(v) => st.patchFeatureDraft({ csinkDiameter: v })} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Havşa Açısı (°)', 'Csink Angle (°)')}</span>
                  <div className="w-24">
                    <NumberField value={hf.csinkAngle ?? 90} onChange={(v) => st.patchFeatureDraft({ csinkAngle: v })} />
                  </div>
                </div>
              </>
            )}

            {hf.holeType === 'tapped' && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Diş Adımı / Hatve (mm)', 'Thread Pitch (mm)')}</span>
                <div className="w-24">
                  <NumberField value={hf.threadPitch ?? 1.0} onChange={(v) => st.patchFeatureDraft({ threadPitch: v })} />
                </div>
              </div>
            )}
          </div>

          {/* End Condition / Depth */}
          <div className="mb-2 space-y-1.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] p-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[var(--ink)]">{T(isTr, 'Tümünden Geç', 'Through All')}</span>
              <input
                type="checkbox"
                checked={hf.isThroughAll}
                onChange={(e) => st.patchFeatureDraft({ isThroughAll: e.target.checked })}
                className="h-4 w-4 rounded accent-[var(--cyan)]"
              />
            </div>
            {!hf.isThroughAll && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Derinlik (mm)', 'Depth (mm)')}</span>
                <div className="w-24">
                  <NumberField value={hf.depth} onChange={(v) => st.patchFeatureDraft({ depth: v })} />
                </div>
              </div>
            )}
          </div>

          {/* Sketch-based Position & Points */}
          <div className="mb-2 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] p-2">
            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-[var(--ink)]">
              <span>{T(isTr, 'Çizim / Nokta ile Konumlandırma', 'Position with Sketch Points')}</span>
              {hf.sketchId && <span className="font-mono text-[10px] text-[var(--cyan)]">✓ {T(isTr, 'Eskiz Bağlı', 'Linked')}</span>}
            </div>
            <div className="mb-2 text-[10px] leading-tight text-[var(--muted)]">
              {T(
                isTr,
                'Eskiz açıp istediğiniz yerlere noktalar koyun ve ölçülendirin. Çizimdeki tüm noktalara delik açılacaktır.',
                'Open a sketch to place and dimension points. Holes will be drilled at all points.'
              )}
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  if (hf.sketchId) {
                    st.editSketch(hf.sketchId);
                    st.setTool('point');
                  } else {
                    const sk = newSketchFeature(doc, hf.plane, hf.planeLabel || 'Delik Eskizi', 'HolePoints');
                    st.setDoc({ ...doc, features: [...doc.features, sk] });
                    st.patchFeatureDraft({ sketchId: sk.id });
                    st.editSketch(sk.id);
                    st.setTool('point');
                  }
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-s)] border border-[var(--cyan)] bg-[var(--cyan)]/15 py-1.5 text-[11px] font-medium text-[var(--cyan)] hover:bg-[var(--cyan)]/25"
              >
                <Pencil size={13} />
                {hf.sketchId ? T(isTr, 'Konum Eskizini Düzenle', 'Edit Positions Sketch') : T(isTr, 'Çizim Aç & Noktaları Yerleştir', 'Open Sketch & Place Points')}
              </button>
              {hf.sketchId && (
                <button
                  type="button"
                  onClick={() => st.patchFeatureDraft({ sketchId: undefined })}
                  title={T(isTr, 'Eskiz bağlantısını kaldır', 'Unlink sketch')}
                  className="rounded-[var(--radius-s)] border border-[var(--line)] px-2 py-1 text-[11px] text-[var(--bad)] hover:bg-[var(--hover)]"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Plane & Placement */}
          <div className="mb-2 space-y-1.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] p-2">
            <div className="text-[11px] font-medium text-[var(--ink)]">{T(isTr, 'Konum & Düzlem', 'Location & Plane')}</div>
            <label className="block text-[10px] text-[var(--muted)]">{T(isTr, 'Düzlem', 'Plane')}</label>
            <select
              value={hf.planeLabel ?? 'Üst düzlem (XZ)'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'XZ') st.patchFeatureDraft({ plane: ORIGIN_PLANES.XZ, planeLabel: 'Üst düzlem (XZ)' });
                else if (val === 'XY') st.patchFeatureDraft({ plane: ORIGIN_PLANES.XY, planeLabel: 'Ön düzlem (XY)' });
                else if (val === 'YZ') st.patchFeatureDraft({ plane: ORIGIN_PLANES.YZ, planeLabel: 'Sağ düzlem (YZ)' });
              }}
              className="w-full rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] px-1.5 py-1 text-[11px]"
            >
              <option value="XZ">{T(isTr, 'Üst düzlem (XZ)', 'Top plane (XZ)')}</option>
              <option value="XY">{T(isTr, 'Ön düzlem (XY)', 'Front plane (XY)')}</option>
              <option value="YZ">{T(isTr, 'Sağ düzlem (YZ)', 'Right plane (YZ)')}</option>
              {hf.planeLabel && !['Üst düzlem (XZ)', 'Ön düzlem (XY)', 'Sağ düzlem (YZ)', 'Top plane (XZ)', 'Front plane (XY)', 'Right plane (YZ)'].includes(hf.planeLabel) && (
                <option value={hf.planeLabel}>{hf.planeLabel}</option>
              )}
            </select>
            <div className="text-[10px] text-[var(--muted)] leading-tight">
              {T(isTr, '💡 3D görünümde modelin herhangi bir yüzeyine tıklayarak deliği doğrudan o yüzeye oturtabilirsiniz.', '💡 Click any planar face on the 3D model to place the hole directly on that face.')}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <span className="text-[10px] text-[var(--muted)]">X (mm)</span>
                <NumberField value={hf.center.x} onChange={(v) => st.patchFeatureDraft({ center: { ...hf.center, x: v } })} />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-[var(--muted)]">Y (mm)</span>
                <NumberField value={hf.center.y} onChange={(v) => st.patchFeatureDraft({ center: { ...hf.center, y: v } })} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => st.patchFeatureDraft({ direction: hf.direction === 'normal' ? 'reverse' : 'normal' })}
              className="mt-1 flex w-full items-center justify-center gap-1 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] py-1 text-[11px] text-[var(--ink)] hover:bg-[var(--hover)]"
            >
              <ArrowLeftRight size={13} />
              {T(isTr, 'Delme Yönünü Çevir', 'Flip Drilling Direction')}
            </button>
          </div>

          {err && <div className="mt-2 flex items-center gap-1 text-[11px] text-[var(--bad)]"><AlertTriangle size={13} />{(ERR[err] || [err, err])[isTr ? 0 : 1]}</div>}
          {preview?.tool && <div className="mt-2 text-[11px] text-[var(--muted)]">{T(isTr, 'Araç hacmi', 'Tool volume')}: {(volumeOf(preview.tool) / 1000).toFixed(2)} cm³</div>}
        </div>
      );
    }

    if (f.type === 'thread') {
      const tf = f as ThreadFeature;
      const onStandardChange = (sz: string) => {
        if (sz === 'custom') {
          st.patchFeatureDraft({ size: 'custom' });
          return;
        }
        const std = ISO_METRIC_HOLES.find((h) => h.size === sz);
        if (!std) return;
        st.patchFeatureDraft({
          size: sz,
          nominalDiameter: std.nominalDiameter,
          pitch: std.coarsePitch,
        });
      };

      return (
        <div className="absolute right-3 top-3 z-20 w-80 max-h-[85vh] overflow-y-auto rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] p-3 text-[12px] text-[var(--ink)] shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold">
              <Disc size={15} className="text-[var(--cyan)]" />
              <span>{T(isTr, 'Diş Açma (Thread)', 'Thread Wizard')}</span>
              <span className="font-mono text-[var(--muted)]">{f.name}</span>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={st.cancelFeature} title={T(isTr, 'Vazgeç (Esc)', 'Cancel (Esc)')} className="rounded-[var(--radius-s)] p-1 text-[var(--bad)] hover:bg-[var(--hover)]"><X size={15} /></button>
              <button type="button" onClick={st.applyFeature} disabled={!!err && !preview?.tool} title={T(isTr, 'Tamam (Enter)', 'OK (Enter)')} className="rounded-[var(--radius-s)] bg-[var(--ok)] p-1 text-[var(--accent-ink)] disabled:opacity-40"><Check size={15} /></button>
            </div>
          </div>

          {/* Internal vs External */}
          <label className="mb-1 block text-[11px] text-[var(--muted)]">{T(isTr, 'Diş Tipi', 'Thread Type')}</label>
          <div className="mb-2 flex gap-1">
            <button
              type="button"
              onClick={() => st.patchFeatureDraft({ isInternal: true })}
              className={`flex-1 rounded-[var(--radius-s)] border px-1.5 py-1 text-[11px] font-medium ${tf.isInternal ? 'border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--cyan)]' : 'border-[var(--line)] text-[var(--alu)] hover:bg-[var(--hover)]'}`}
            >
              {T(isTr, 'İç Diş (Dişi / Delik)', 'Internal (Female)')}
            </button>
            <button
              type="button"
              onClick={() => st.patchFeatureDraft({ isInternal: false })}
              className={`flex-1 rounded-[var(--radius-s)] border px-1.5 py-1 text-[11px] font-medium ${!tf.isInternal ? 'border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--cyan)]' : 'border-[var(--line)] text-[var(--alu)] hover:bg-[var(--hover)]'}`}
            >
              {T(isTr, 'Dış Diş (Erkek / Mil)', 'External (Male)')}
            </button>
          </div>

          {/* Standard & Size */}
          <label className="mb-1 block text-[11px] text-[var(--muted)]">{T(isTr, 'Standart Ebat (ISO Metrik)', 'Standard Size (ISO Metric)')}</label>
          <select
            value={tf.size}
            onChange={(e) => onStandardChange(e.target.value)}
            className="mb-2 w-full rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] px-1.5 py-1 font-mono text-[11px] text-[var(--ink)]"
          >
            {ISO_METRIC_HOLES.map((h) => (
              <option key={h.size} value={h.size}>
                {h.size} (Nominal Ø{h.nominalDiameter} mm · {h.coarsePitch} mm)
              </option>
            ))}
            <option value="custom">{T(isTr, 'Özel Diş (Custom)', 'Custom Thread')}</option>
          </select>

          {/* Dimensions */}
          <div className="mb-2 space-y-1.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] p-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Anma Çapı (d, mm)', 'Nominal Dia (d, mm)')}</span>
              <div className="w-24">
                <NumberField value={tf.nominalDiameter} onChange={(v) => st.patchFeatureDraft({ nominalDiameter: v })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Diş Adımı / Hatve (P, mm)', 'Pitch (P, mm)')}</span>
              <div className="w-24">
                <NumberField value={tf.pitch} onChange={(v) => st.patchFeatureDraft({ pitch: v })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Diş Boyu (L, mm)', 'Thread Length (L, mm)')}</span>
              <div className="w-24">
                <NumberField value={tf.length} onChange={(v) => st.patchFeatureDraft({ length: v })} />
              </div>
            </div>
          </div>

          {/* Plane & Location */}
          <div className="mb-2 space-y-1.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] p-2">
            <div className="text-[11px] font-medium text-[var(--ink)]">{T(isTr, 'Konum & Düzlem', 'Location & Plane')}</div>
            <select
              value={tf.planeLabel ?? 'Üst düzlem (XZ)'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'XZ') st.patchFeatureDraft({ plane: ORIGIN_PLANES.XZ, planeLabel: 'Üst düzlem (XZ)' });
                else if (val === 'XY') st.patchFeatureDraft({ plane: ORIGIN_PLANES.XY, planeLabel: 'Ön düzlem (XY)' });
                else if (val === 'YZ') st.patchFeatureDraft({ plane: ORIGIN_PLANES.YZ, planeLabel: 'Sağ düzlem (YZ)' });
              }}
              className="w-full rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] px-1.5 py-1 text-[11px]"
            >
              <option value="XZ">{T(isTr, 'Üst düzlem (XZ)', 'Top plane (XZ)')}</option>
              <option value="XY">{T(isTr, 'Ön düzlem (XY)', 'Front plane (XY)')}</option>
              <option value="YZ">{T(isTr, 'Sağ düzlem (YZ)', 'Right plane (YZ)')}</option>
              {tf.planeLabel && !['Üst düzlem (XZ)', 'Ön düzlem (XY)', 'Sağ düzlem (YZ)', 'Top plane (XZ)', 'Front plane (XY)', 'Right plane (YZ)'].includes(tf.planeLabel) && (
                <option value={tf.planeLabel}>{tf.planeLabel}</option>
              )}
            </select>
            <div className="flex gap-2">
              <div className="flex-1">
                <span className="text-[10px] text-[var(--muted)]">X (mm)</span>
                <NumberField value={tf.center.x} onChange={(v) => st.patchFeatureDraft({ center: { ...tf.center, x: v } })} />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-[var(--muted)]">Y (mm)</span>
                <NumberField value={tf.center.y} onChange={(v) => st.patchFeatureDraft({ center: { ...tf.center, y: v } })} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => st.patchFeatureDraft({ direction: tf.direction === 'normal' ? 'reverse' : 'normal' })}
              className="mt-1 flex w-full items-center justify-center gap-1 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] py-1 text-[11px] text-[var(--ink)] hover:bg-[var(--hover)]"
            >
              <ArrowLeftRight size={13} />
              {T(isTr, 'Diş Yönünü Çevir', 'Flip Thread Direction')}
            </button>
          </div>

          {err && <div className="mt-2 flex items-center gap-1 text-[11px] text-[var(--bad)]"><AlertTriangle size={13} />{(ERR[err] || [err, err])[isTr ? 0 : 1]}</div>}
          {preview?.tool && <div className="mt-2 text-[11px] text-[var(--muted)]">{T(isTr, 'Araç hacmi', 'Tool volume')}: {(volumeOf(preview.tool) / 1000).toFixed(2)} cm³</div>}
        </div>
      );
    }

    const patternableFeatures = doc.features.filter((x) => x.type !== 'sketch' && x.id !== f.id);

    if (f.type === 'linearPattern') {
      const lp = f as LinearPatternFeature;
      return (
        <div className="absolute right-3 top-3 z-20 w-80 max-h-[85vh] overflow-y-auto rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] p-3 text-[12px] text-[var(--ink)] shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold">
              <Grid size={15} className="text-[var(--cyan)]" />
              <span>{T(isTr, 'Doğrusal Çoğaltma', 'Linear Pattern')}</span>
              <span className="font-mono text-[var(--muted)]">{f.name}</span>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={st.cancelFeature} title={T(isTr, 'Vazgeç (Esc)', 'Cancel (Esc)')} className="rounded-[var(--radius-s)] p-1 text-[var(--bad)] hover:bg-[var(--hover)]"><X size={15} /></button>
              <button type="button" onClick={st.applyFeature} disabled={!!err && !preview?.tool} title={T(isTr, 'Tamam (Enter)', 'OK (Enter)')} className="rounded-[var(--radius-s)] bg-[var(--ok)] p-1 text-[var(--accent-ink)] disabled:opacity-40"><Check size={15} /></button>
            </div>
          </div>

          <label className="mb-1 block text-[11px] text-[var(--muted)]">{T(isTr, 'Çoğaltılacak Unsur', 'Feature to Pattern')}</label>
          <select
            value={lp.targetFeatureId}
            onChange={(e) => st.patchFeatureDraft({ targetFeatureId: e.target.value })}
            className="mb-2 w-full rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] px-1.5 py-1 text-[11px]"
          >
            {patternableFeatures.map((pf) => (
              <option key={pf.id} value={pf.id}>{pf.name} ({pf.type})</option>
            ))}
          </select>

          <div className="mb-2 space-y-1.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] p-2">
            <div className="text-[11px] font-semibold text-[var(--ink)]">{T(isTr, 'Yön 1', 'Direction 1')}</div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Eksen', 'Axis')}</span>
              <select
                value={lp.dir1Axis}
                onChange={(e) => st.patchFeatureDraft({ dir1Axis: e.target.value as 'X' | 'Y' | 'Z' })}
                className="w-24 rounded border border-[var(--line)] bg-[var(--bg-1)] px-1.5 py-0.5 text-[11px]"
              >
                <option value="X">X {T(isTr, 'Ekseni', 'Axis')}</option>
                <option value="Y">Y {T(isTr, 'Ekseni', 'Axis')}</option>
                <option value="Z">Z {T(isTr, 'Ekseni', 'Axis')}</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Adet (n1)', 'Count (n1)')}</span>
              <div className="w-24">
                <NumberField value={lp.dir1Count} onChange={(v) => st.patchFeatureDraft({ dir1Count: Math.max(1, Math.round(v)) })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Aralık (d1, mm)', 'Spacing (d1, mm)')}</span>
              <div className="w-24">
                <NumberField value={lp.dir1Spacing} onChange={(v) => st.patchFeatureDraft({ dir1Spacing: v })} />
              </div>
            </div>
          </div>

          <div className="mb-2 space-y-1.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] p-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[var(--ink)]">{T(isTr, 'Yön 2 (İkinci Boyut)', 'Direction 2')}</span>
              <input
                type="checkbox"
                checked={!!lp.dir2Enabled}
                onChange={(e) => st.patchFeatureDraft({ dir2Enabled: e.target.checked })}
                className="h-4 w-4 rounded accent-[var(--cyan)]"
              />
            </div>
            {lp.dir2Enabled && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Eksen', 'Axis')}</span>
                  <select
                    value={lp.dir2Axis || (lp.dir1Axis === 'X' ? 'Y' : 'X')}
                    onChange={(e) => st.patchFeatureDraft({ dir2Axis: e.target.value as 'X' | 'Y' | 'Z' })}
                    className="w-24 rounded border border-[var(--line)] bg-[var(--bg-1)] px-1.5 py-0.5 text-[11px]"
                  >
                    <option value="X">X {T(isTr, 'Ekseni', 'Axis')}</option>
                    <option value="Y">Y {T(isTr, 'Ekseni', 'Axis')}</option>
                    <option value="Z">Z {T(isTr, 'Ekseni', 'Axis')}</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Adet (n2)', 'Count (n2)')}</span>
                  <div className="w-24">
                    <NumberField value={lp.dir2Count || 2} onChange={(v) => st.patchFeatureDraft({ dir2Count: Math.max(1, Math.round(v)) })} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Aralık (d2, mm)', 'Spacing (d2, mm)')}</span>
                  <div className="w-24">
                    <NumberField value={lp.dir2Spacing || 20} onChange={(v) => st.patchFeatureDraft({ dir2Spacing: v })} />
                  </div>
                </div>
              </>
            )}
          </div>

          {err && <div className="mt-2 flex items-center gap-1 text-[11px] text-[var(--bad)]"><AlertTriangle size={13} />{(ERR[err] || [err, err])[isTr ? 0 : 1]}</div>}
          {preview?.tool && <div className="mt-2 text-[11px] text-[var(--muted)]">{T(isTr, 'Araç hacmi', 'Tool volume')}: {(volumeOf(preview.tool) / 1000).toFixed(2)} cm³</div>}
        </div>
      );
    }

    if (f.type === 'circularPattern') {
      const cp = f as CircularPatternFeature;
      return (
        <div className="absolute right-3 top-3 z-20 w-80 max-h-[85vh] overflow-y-auto rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] p-3 text-[12px] text-[var(--ink)] shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold">
              <Repeat size={15} className="text-[var(--cyan)]" />
              <span>{T(isTr, 'Dairesel Çoğaltma', 'Circular Pattern')}</span>
              <span className="font-mono text-[var(--muted)]">{f.name}</span>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={st.cancelFeature} title={T(isTr, 'Vazgeç (Esc)', 'Cancel (Esc)')} className="rounded-[var(--radius-s)] p-1 text-[var(--bad)] hover:bg-[var(--hover)]"><X size={15} /></button>
              <button type="button" onClick={st.applyFeature} disabled={!!err && !preview?.tool} title={T(isTr, 'Tamam (Enter)', 'OK (Enter)')} className="rounded-[var(--radius-s)] bg-[var(--ok)] p-1 text-[var(--accent-ink)] disabled:opacity-40"><Check size={15} /></button>
            </div>
          </div>

          <label className="mb-1 block text-[11px] text-[var(--muted)]">{T(isTr, 'Çoğaltılacak Unsur', 'Feature to Pattern')}</label>
          <select
            value={cp.targetFeatureId}
            onChange={(e) => st.patchFeatureDraft({ targetFeatureId: e.target.value })}
            className="mb-2 w-full rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] px-1.5 py-1 text-[11px]"
          >
            {patternableFeatures.map((pf) => (
              <option key={pf.id} value={pf.id}>{pf.name} ({pf.type})</option>
            ))}
          </select>

          <div className="mb-2 space-y-1.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] p-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Dönme Ekseni', 'Rotation Axis')}</span>
              <select
                value={cp.axis}
                onChange={(e) => st.patchFeatureDraft({ axis: e.target.value as 'X' | 'Y' | 'Z' })}
                className="w-24 rounded border border-[var(--line)] bg-[var(--bg-1)] px-1.5 py-0.5 text-[11px]"
              >
                <option value="Y">Y {T(isTr, 'Ekseni (Dikey)', 'Axis (Vertical)')}</option>
                <option value="X">X {T(isTr, 'Ekseni', 'Axis')}</option>
                <option value="Z">Z {T(isTr, 'Ekseni', 'Axis')}</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Toplam Adet (n)', 'Total Count (n)')}</span>
              <div className="w-24">
                <NumberField value={cp.count} onChange={(v) => st.patchFeatureDraft({ count: Math.max(2, Math.round(v)) })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Toplam Açı (°)', 'Total Angle (°)')}</span>
              <div className="w-24">
                <NumberField value={cp.totalAngle} onChange={(v) => st.patchFeatureDraft({ totalAngle: v })} />
              </div>
            </div>
          </div>

          {err && <div className="mt-2 flex items-center gap-1 text-[11px] text-[var(--bad)]"><AlertTriangle size={13} />{(ERR[err] || [err, err])[isTr ? 0 : 1]}</div>}
          {preview?.tool && <div className="mt-2 text-[11px] text-[var(--muted)]">{T(isTr, 'Araç hacmi', 'Tool volume')}: {(volumeOf(preview.tool) / 1000).toFixed(2)} cm³</div>}
        </div>
      );
    }

    if (f.type === 'mirror') {
      const mr = f as MirrorFeature;
      return (
        <div className="absolute right-3 top-3 z-20 w-80 max-h-[85vh] overflow-y-auto rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] p-3 text-[12px] text-[var(--ink)] shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold">
              <FlipHorizontal size={15} className="text-[var(--cyan)]" />
              <span>{T(isTr, 'Aynalama', 'Mirror')}</span>
              <span className="font-mono text-[var(--muted)]">{f.name}</span>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={st.cancelFeature} title={T(isTr, 'Vazgeç (Esc)', 'Cancel (Esc)')} className="rounded-[var(--radius-s)] p-1 text-[var(--bad)] hover:bg-[var(--hover)]"><X size={15} /></button>
              <button type="button" onClick={st.applyFeature} disabled={!!err && !preview?.tool} title={T(isTr, 'Tamam (Enter)', 'OK (Enter)')} className="rounded-[var(--radius-s)] bg-[var(--ok)] p-1 text-[var(--accent-ink)] disabled:opacity-40"><Check size={15} /></button>
            </div>
          </div>

          <label className="mb-1 block text-[11px] text-[var(--muted)]">{T(isTr, 'Aynalanacak Unsur', 'Feature to Mirror')}</label>
          <select
            value={mr.targetFeatureId}
            onChange={(e) => st.patchFeatureDraft({ targetFeatureId: e.target.value })}
            className="mb-2 w-full rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] px-1.5 py-1 text-[11px]"
          >
            {patternableFeatures.map((pf) => (
              <option key={pf.id} value={pf.id}>{pf.name} ({pf.type})</option>
            ))}
          </select>

          <div className="mb-2 space-y-1.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] p-2">
            <label className="block text-[11px] text-[var(--muted)]">{T(isTr, 'Aynalama Düzlemi', 'Mirror Plane')}</label>
            <select
              value={mr.plane}
              onChange={(e) => st.patchFeatureDraft({ plane: e.target.value as 'XY' | 'XZ' | 'YZ' })}
              className="w-full rounded border border-[var(--line)] bg-[var(--bg-1)] px-1.5 py-1 text-[11px]"
            >
              <option value="YZ">{T(isTr, 'Sağ Düzlem (YZ)', 'Right Plane (YZ)')}</option>
              <option value="XZ">{T(isTr, 'Üst Düzlem (XZ)', 'Top Plane (XZ)')}</option>
              <option value="XY">{T(isTr, 'Ön Düzlem (XY)', 'Front Plane (XY)')}</option>
            </select>
          </div>

          {err && <div className="mt-2 flex items-center gap-1 text-[11px] text-[var(--bad)]"><AlertTriangle size={13} />{(ERR[err] || [err, err])[isTr ? 0 : 1]}</div>}
          {preview?.tool && <div className="mt-2 text-[11px] text-[var(--muted)]">{T(isTr, 'Araç hacmi', 'Tool volume')}: {(volumeOf(preview.tool) / 1000).toFixed(2)} cm³</div>}
        </div>
      );
    }

    const sketchId = 'sketchId' in f ? f.sketchId : undefined;
    const sk = sketchId ? (doc.features.find((x) => x.id === sketchId) as SketchFeature | undefined) : undefined;
    const lines = sk ? sk.sketch.entities.filter((e) => e.type === 'line') : [];
    const prof = sk ? detectProfiles(sk.sketch) : null;
    const availableRegions = prof?.regions || [];
    const opBtn = (op: Operation, label: string) => (
      <button type="button" onClick={() => st.patchFeatureDraft({ operation: op })} className={`flex-1 rounded-[var(--radius-s)] border px-1 py-1 text-[11px] ${f.operation === op ? 'border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--cyan)]' : 'border-[var(--line)] text-[var(--alu)] hover:bg-[var(--hover)]'}`}>{label}</button>
    );
    return (
      <div className="absolute right-3 top-3 z-20 w-72 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] p-3 text-[12px] text-[var(--ink)] shadow-xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-semibold">{f.type === 'extrude' ? (f.operation === 'cut' ? T(isTr, 'Ekstrüzyon kes', 'Extrude cut') : T(isTr, 'Ekstrüzyon', 'Extrude')) : T(isTr, 'Döndür', 'Revolve')} <span className="font-mono text-[var(--muted)]">{f.name}</span></div>
          <div className="flex gap-1">
            <button type="button" onClick={st.cancelFeature} title={T(isTr, 'Vazgeç (Esc)', 'Cancel (Esc)')} className="rounded-[var(--radius-s)] p-1 text-[var(--bad)] hover:bg-[var(--hover)]"><X size={15} /></button>
            <button type="button" onClick={st.applyFeature} disabled={!!err && !preview?.tool} title={T(isTr, 'Tamam (Enter)', 'OK (Enter)')} className="rounded-[var(--radius-s)] bg-[var(--ok)] p-1 text-[var(--accent-ink)] disabled:opacity-40"><Check size={15} /></button>
          </div>
        </div>

        <label className="mb-1 block text-[11px] text-[var(--muted)]">{T(isTr, 'Eskiz', 'Sketch')}</label>
        <select value={f.sketchId} onChange={(e) => st.patchFeatureDraft({ sketchId: e.target.value, regionKeys: [] })} className="mb-2 w-full rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] px-1.5 py-1">
          {sketches.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.planeLabel}</option>)}
        </select>

        {f.type === 'extrude' ? (
          <>
            <label className="mb-1 block text-[11px] text-[var(--muted)]">{T(isTr, 'Mesafe (mm)', 'Distance (mm)')}</label>
            <div className="mb-2 flex gap-1">
              <NumberField value={f.distance} onChange={(v) => st.patchFeatureDraft({ distance: v })} autoFocus />
              <button type="button" title={T(isTr, 'Yönü çevir', 'Flip direction')} onClick={() => st.patchFeatureDraft({ direction: f.direction === 'normal' ? 'reverse' : 'normal' })} className="rounded-[var(--radius-s)] border border-[var(--line)] px-2 hover:bg-[var(--hover)]"><ArrowLeftRight size={14} /></button>
            </div>
            <div className="mb-2 flex gap-1">
              {(['normal', 'reverse', 'symmetric'] as ExtrudeFeature['direction'][]).map((d) => (
                <button key={d} type="button" onClick={() => st.patchFeatureDraft({ direction: d })} className={`flex-1 rounded-[var(--radius-s)] border px-1 py-1 text-[11px] ${f.direction === d ? 'border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--cyan)]' : 'border-[var(--line)] text-[var(--alu)] hover:bg-[var(--hover)]'}`}>
                  {d === 'normal' ? T(isTr, 'Yön 1', 'Dir 1') : d === 'reverse' ? T(isTr, 'Ters', 'Reverse') : T(isTr, 'Simetrik', 'Mid-plane')}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <label className="mb-1 block text-[11px] text-[var(--muted)]">{T(isTr, 'Eksen', 'Axis')}</label>
            <select value={(f as RevolveFeature).axis} onChange={(e) => st.patchFeatureDraft({ axis: e.target.value })} className="mb-2 w-full rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] px-1.5 py-1">
              {lines.filter((l) => (l as any).centerline).map((l, i) => (
                <option key={l.id} value={l.id}>⭐ {T(isTr, `Eksen Çizgisi (Centerline) ${i + 1}`, `Centerline ${i + 1}`)}</option>
              ))}
              <option value="Y">{T(isTr, 'Eskiz dikey ekseni (V)', 'Sketch vertical axis (V)')}</option>
              <option value="X">{T(isTr, 'Eskiz yatay ekseni (U)', 'Sketch horizontal axis (U)')}</option>
              {lines.filter((l) => !(l as any).centerline).map((l, i) => (
                <option key={l.id} value={l.id}>{(l.construction ? T(isTr, 'Yapı çizgisi', 'Construction line') : T(isTr, 'Çizgi', 'Line')) + ` ${i + 1}`}</option>
              ))}
            </select>
            <label className="mb-1 block text-[11px] text-[var(--muted)]">{T(isTr, 'Açı (°)', 'Angle (°)')}</label>
            <div className="mb-2"><NumberField value={(f as RevolveFeature).angle} onChange={(v) => st.patchFeatureDraft({ angle: Math.min(360, v) })} /></div>
          </>
        )}

        <label className="mb-1 block text-[11px] text-[var(--muted)]">{T(isTr, 'İşlem', 'Operation')}</label>
        <div className="mb-2 flex gap-1">
          {opBtn('new', T(isTr, 'Yeni gövde', 'New body'))}
          {opBtn('join', T(isTr, 'Birleştir', 'Join'))}
          {opBtn('cut', T(isTr, 'Kes', 'Cut'))}
          {opBtn('intersect', T(isTr, 'Kesişim', 'Intersect'))}
        </div>

        {/* Selected Contours / Profiles */}
        <div className="mb-2 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] p-2">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-[var(--ink)]">
              {T(isTr, 'Seçili Konturlar / Profiller', 'Selected Contours / Profiles')}
            </span>
            <span className="font-mono text-[10px] text-[var(--muted)]">
              {availableRegions.length > 0
                ? `${f.regionKeys.length === 0 ? T(isTr, 'Tümü (Oto)', 'All (Auto)') : `${f.regionKeys.filter((k) => k !== '__none__').length}/${availableRegions.length}`} (${availableRegions.length} ${T(isTr, 'profil', 'prof')})`
                : T(isTr, 'Profil yok', 'No profile')}
            </span>
          </div>

          {/* Quick selection action buttons */}
          <div className="mb-2 flex gap-1">
            <button
              type="button"
              onClick={() => st.patchFeatureDraft({ regionKeys: availableRegions.map((r) => r.key) })}
              disabled={availableRegions.length === 0}
              className="flex-1 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] px-1.5 py-1 text-[10px] font-medium text-[var(--ink)] hover:border-[var(--cyan)] hover:text-[var(--cyan)] disabled:opacity-40"
              title={T(isTr, 'Tüm kapalı profilleri seç', 'Select all closed profiles')}
            >
              {T(isTr, 'Tümünü Seç', 'Select All')}
            </button>
            <button
              type="button"
              onClick={() => st.patchFeatureDraft({ regionKeys: [] })}
              className={`flex-1 rounded-[var(--radius-s)] border px-1.5 py-1 text-[10px] font-medium ${
                f.regionKeys.length === 0
                  ? 'border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--cyan)]'
                  : 'border-[var(--line)] bg-[var(--bg-1)] text-[var(--alu)] hover:bg-[var(--hover)]'
              }`}
              title={T(isTr, 'Tüm profilleri otomatik algıla', 'Detect all profiles automatically')}
            >
              {T(isTr, 'Otomatik', 'Auto')}
            </button>
            {f.regionKeys.length > 0 && (
              <button
                type="button"
                onClick={() => st.patchFeatureDraft({ regionKeys: ['__none__'] })}
                className="rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] px-1.5 py-1 text-[10px] text-[var(--bad)] hover:bg-[var(--hover)]"
                title={T(isTr, 'Seçimi temizle', 'Clear selection')}
              >
                {T(isTr, 'Temizle', 'Clear')}
              </button>
            )}
          </div>

          {/* Region item checklist */}
          {availableRegions.length > 0 ? (
            <div className="max-h-36 space-y-1 overflow-y-auto pr-0.5">
              {availableRegions.map((r, idx) => {
                const isChecked = f.regionKeys.length === 0 || f.regionKeys.includes(r.key);
                const toggle = () => {
                  if (f.regionKeys.length === 0) {
                    st.patchFeatureDraft({ regionKeys: [r.key] });
                  } else {
                    const activeKeys = f.regionKeys.filter((k) => k !== '__none__');
                    const next = activeKeys.includes(r.key)
                      ? activeKeys.filter((k) => k !== r.key)
                      : [...activeKeys, r.key];
                    st.patchFeatureDraft({ regionKeys: next.length === 0 ? ['__none__'] : next });
                  }
                };
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={toggle}
                    className={`flex w-full items-center justify-between rounded-[var(--radius-s)] border px-2 py-1 text-left text-[11px] transition-colors ${
                      isChecked
                        ? 'border-[var(--cyan)]/50 bg-[var(--cyan)]/10 text-[var(--ink)]'
                        : 'border-transparent bg-[var(--bg-1)]/60 text-[var(--muted)] hover:bg-[var(--hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <div
                        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border ${
                          isChecked
                            ? 'border-[var(--cyan)] bg-[var(--cyan)] text-[var(--accent-ink)]'
                            : 'border-[var(--muted)]/50'
                        }`}
                      >
                        {isChecked && <Check size={10} />}
                      </div>
                      <span className="truncate font-medium">{T(isTr, `Profil ${idx + 1}`, `Profile ${idx + 1}`)}</span>
                      {r.holes.length > 0 && (
                        <span className="text-[10px] text-[var(--muted)]">
                          ({r.holes.length} {T(isTr, 'delik', 'hole')})
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-[var(--muted)]">
                      {Math.round(r.area)} mm²
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-[11px] text-[var(--bad)]">
              {T(isTr, 'Kapalı profil yok (çizgiler kesişiyorsa uçları birleştirin)', 'No closed profile (connect line ends to form a loop)')}
            </div>
          )}
        </div>
        {err && <div className="mt-2 flex items-center gap-1 text-[11px] text-[var(--bad)]"><AlertTriangle size={13} />{(ERR[err] || [err, err])[isTr ? 0 : 1]}</div>}
        {preview?.tool && <div className="mt-2 text-[11px] text-[var(--muted)]">{T(isTr, 'Araç hacmi', 'Tool volume')}: {(volumeOf(preview.tool) / 1000).toFixed(2)} cm³</div>}
      </div>
    );
  })();

  // ───────────────────────────── tree ─────────────────────────────
  const iconOf = (f: Feature) => (
    f.type === 'sketch' ? <PenLine size={13} /> :
    f.type === 'revolve' ? <RotateCw size={13} /> :
    f.type === 'hole' ? <CircleDot size={13} /> :
    f.type === 'thread' ? <Disc size={13} /> :
    f.type === 'linearPattern' ? <Grid size={13} /> :
    f.type === 'circularPattern' ? <Repeat size={13} /> :
    f.type === 'mirror' ? <FlipHorizontal size={13} /> :
    f.operation === 'cut' ? <Scissors size={13} /> : <Box size={13} />
  );
  const tree = (
    <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--bg-1)] text-[12px]">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-2 py-1.5">
        <input value={doc.name} onChange={(e) => st.setDoc({ ...doc, name: e.target.value }, false)} className="w-full bg-transparent font-semibold text-[var(--ink)] outline-none" />
      </div>
      <div className="px-2 pt-2 text-[10px] uppercase tracking-wide text-[var(--muted)]">{T(isTr, 'Orijin', 'Origin')}</div>
      {(['XY', 'XZ', 'YZ'] as const).map((p) => (
        <button key={p} type="button" disabled={mode === 'sketch'} onClick={() => st.startSketch(ORIGIN_PLANES[p], p)}
          title={T(isTr, 'Bu düzlemde eskiz başlat', 'Start a sketch on this plane')}
          className="flex items-center gap-1.5 px-3 py-0.5 text-left text-[var(--alu)] hover:bg-[var(--hover)] disabled:opacity-50">
          <Layers size={12} className="text-[var(--muted)]" />
          {p === 'XY' ? T(isTr, 'Ön düzlem', 'Front plane') : p === 'XZ' ? T(isTr, 'Üst düzlem', 'Top plane') : T(isTr, 'Sağ düzlem', 'Right plane')} <span className="ml-auto font-mono text-[10px] text-[var(--muted)]">{p}</span>
        </button>
      ))}
      <div className="px-2 pt-2 text-[10px] uppercase tracking-wide text-[var(--muted)]">{T(isTr, 'Özellikler', 'Features')}</div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        {doc.features.length === 0 && (
          <div className="px-3 py-2 text-[11px] leading-snug text-[var(--muted)]">
            {T(isTr, '1) “Yeni eskiz” → bir düzlem seç  2) çiz + ölçülendir  3) “Eskizi bitir” → mesafe gir → ✓', '1) “New sketch” → pick a plane  2) draw + dimension  3) “Finish sketch” → distance → ✓')}
          </div>
        )}
        {doc.features.map((f) => {
          const sel = st.selectedFeatureId === f.id;
          const err = regen.errors[f.id];
          const editing = st.sketchFeatureId === f.id || featureDraft?.editingId === f.id;
          return (
            <div
              key={f.id}
              onClick={() => st.selectFeature(f.id)}
              onDoubleClick={() => (f.type === 'sketch' ? st.editSketch(f.id) : st.editFeature(f.id))}
              className={`group flex cursor-default items-center gap-1.5 px-2 py-1 ${sel ? 'bg-[var(--cyan)]/12 text-[var(--ink)]' : 'text-[var(--alu)] hover:bg-[var(--hover)]'} ${f.type !== 'sketch' && f.suppressed ? 'opacity-45' : ''} ${f.type !== 'sketch' ? 'pl-2' : ''}`}
              title={T(isTr, 'Çift tık: düzenle', 'Double-click: edit')}
            >
              <span className={err ? 'text-[var(--bad)]' : 'text-[var(--cyan)]'}>{err ? <AlertTriangle size={13} /> : iconOf(f)}</span>
              {renaming === f.id ? (
                <input autoFocus defaultValue={f.name} onBlur={(e) => { st.renameFeature(f.id, e.target.value || f.name); setRenaming(null); }} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setRenaming(null); }} className="w-full rounded-[var(--radius-s)] bg-[var(--bg-2)] px-1 outline-none" />
              ) : (
                <span className={`truncate ${editing ? 'font-semibold text-[var(--cyan)]' : ''}`} onDoubleClick={(e) => { if (e.altKey) { e.stopPropagation(); setRenaming(f.id); } }}>{f.name}</span>
              )}
              {f.type === 'sketch' && <span className="truncate font-mono text-[9px] text-[var(--muted)]">{f.planeLabel}</span>}
              <span className="ml-auto hidden items-center gap-0.5 group-hover:flex">
                <button type="button" title={T(isTr, 'Düzenle', 'Edit')} onClick={(e) => { e.stopPropagation(); f.type === 'sketch' ? st.editSketch(f.id) : st.editFeature(f.id); }} className="rounded p-0.5 hover:text-[var(--cyan)]"><Pencil size={11} /></button>
                {f.type === 'sketch' ? (
                  <button type="button" title={T(isTr, 'Göster/gizle', 'Show/hide')} onClick={(e) => { e.stopPropagation(); st.toggleSketchVisible(f.id); }} className="rounded p-0.5 hover:text-[var(--cyan)]">{f.visible ? <Eye size={11} /> : <EyeOff size={11} />}</button>
                ) : (
                  <button type="button" title={T(isTr, 'Bastır', 'Suppress')} onClick={(e) => { e.stopPropagation(); st.toggleSuppress(f.id); }} className="rounded p-0.5 hover:text-[var(--cyan)]">{f.suppressed ? <EyeOff size={11} /> : <Eye size={11} />}</button>
                )}
                <button type="button" title={T(isTr, 'Yeniden adlandır', 'Rename')} onClick={(e) => { e.stopPropagation(); setRenaming(f.id); }} className="rounded p-0.5 hover:text-[var(--cyan)]"><Minus size={11} /></button>
                <button type="button" title={T(isTr, 'Sil (bağlı özelliklerle)', 'Delete (with dependents)')} onClick={(e) => { e.stopPropagation(); st.deleteFeature(f.id); }} className="rounded p-0.5 hover:text-[var(--bad)]"><Trash2 size={11} /></button>
              </span>
            </div>
          );
        })}
        {mode === 'sketch' && st.pendingSketch && st.sketchFeatureId === st.pendingSketch.id && (
          <div className="flex items-center gap-1.5 px-2 py-1 font-semibold text-[var(--cyan)]"><PenLine size={13} />{st.pendingSketch.name} <span className="font-mono text-[9px] text-[var(--muted)]">{st.pendingSketch.planeLabel}</span></div>
        )}
      </div>
      <div className="border-t border-[var(--line)] px-2 py-1.5 text-[11px] text-[var(--muted)]">
        {regen.bodies.length} {T(isTr, 'gövde', 'bodies')} · {(totalVolume / 1000).toFixed(2)} cm³
      </div>
    </aside>
  );

  // ───────────────────────────── status / hint ─────────────────────────────
  const hint = (() => {
    if (mode === 'pickPlane') return T(isTr, 'Eskiz için bir düzleme veya gövdenin düz bir yüzeyine tıklayın · Esc: vazgeç', 'Click a plane or a planar face for the sketch · Esc: cancel');
    if (mode === 'feature') return T(isTr, 'Değerleri girin, önizleme anında güncellenir · Enter: tamam · Esc: vazgeç', 'Set values; preview updates live · Enter: OK · Esc: cancel');
    if (mode === 'sketch') {
      switch (tool) {
        case 'select': return T(isTr, 'Tıkla: seç (Shift çoklu) · Noktayı/çizgiyi sürükle: düzenle · Del: sil · Ölçüye tıkla: değer gir', 'Click: select (Shift = add) · Drag point/line to edit · Del: delete · Click a dimension to change it');
        case 'point': return T(isTr, 'Tıklayarak delik merkezi veya referans nokta ekleyin', 'Click to place a hole center or reference point');
        case 'line': return T(isTr, 'Tıkla-tıkla zincir çizgi · Var olan noktaya tıklayınca kapanır · Çift tık/Esc: bitir', 'Click-click to chain lines · Clicking an existing point closes · Double-click/Esc ends');
        case 'rect': return T(isTr, 'İki köşe noktasına tıklayın', 'Click two opposite corners');
        case 'circle': return T(isTr, 'Merkeze, sonra yarıçap noktasına tıklayın', 'Click the centre, then a point on the radius');
        case 'arc': return T(isTr, 'Başlangıç, bitiş, sonra yay üstünde bir nokta', 'Start, end, then a point on the arc');
        case 'trim': return T(isTr, 'Budamak istediğiniz çizgiye veya taşkın uca tıklayın (kesişimler arasını budar)', 'Click any line segment to trim between intersections');
        case 'fillet': return T(isTr, 'Radius için köşe noktasına veya sırayla 2 çizgiye tıklayın (kavis açar)', 'Click a corner vertex or two lines to create a fillet arc');
        case 'chamfer': return T(isTr, 'Pah için köşe noktasına veya sırayla 2 çizgiye tıklayın (pah kırar)', 'Click a corner vertex or two lines to create a chamfer');
        case 'dimension': return T(isTr, 'Çizgi: uzunluk · Daire: çap · Yay: yarıçap · İki nokta: yatay/dikey mesafe — değeri yazıp Enter', 'Line: length · Circle: Ø · Arc: R · Two points: horizontal/vertical distance — type value, Enter');
      }
    }
    return regen.bodies.length ? T(isTr, 'Ağaçta çift tık: düzenle · Sol tuş: döndür · Sağ/orta: kaydır · Tekerlek: yakınlaştır', 'Double-click in the tree to edit · Left: orbit · Right/middle: pan · Wheel: zoom') : T(isTr, 'Başlamak için “Yeni eskiz”e (S) basın', 'Press “New sketch” (S) to start');
  })();

  return (
    <div className="flex h-full w-full flex-col bg-[var(--bg-0)] text-[var(--ink)]">
      <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-[var(--line)] bg-[var(--bg-1)] px-2 py-1">
        <div className="mr-2 flex shrink-0 flex-col leading-tight">
          <span className="text-[12px] font-semibold text-[var(--ink)]">{T(isTr, 'Parça Stüdyosu', 'Part Studio')}</span>
          <span className="text-[10px] text-[var(--cyan)]">{mode === 'sketch' ? `✏️ ${sketchFeature?.name ?? ''} · ${sketchFeature?.planeLabel ?? ''}` : mode === 'feature' ? T(isTr, 'Özellik', 'Feature') : T(isTr, 'Model', 'Model')}</span>
        </div>
        <Sep />
        {ribbon}
        <Sep />
        <Btn icon={<HelpCircle size={15} />} label={T(isTr, 'Kısayollar', 'Shortcuts')} active={showHelp} onClick={() => setShowHelp((v) => !v)} />
      </div>

      <div className="flex min-h-0 flex-1">
        {tree}
        <div className="relative min-w-0 flex-1">
          <PartViewport doc={doc} regen={shownRegen} previewTool={preview?.tool ?? null} isTr={isTr} />
          {fdPanel}
          {mode === 'sketch' && hud.readout && (
            <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] px-2 py-0.5 font-mono text-[12px] text-[var(--ink)]">{hud.readout}</div>
          )}
          {toast && <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] px-3 py-1.5 text-[12px] text-[var(--ink)] shadow-lg">{toast}</div>}
          {showHelp && (
            <div className="absolute right-3 top-3 z-30 w-72 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] p-3 text-[11px] leading-relaxed text-[var(--alu)] shadow-xl">
              <div className="mb-1 font-semibold text-[var(--ink)]">{T(isTr, 'Kısayollar', 'Shortcuts')}</div>
              <div className="grid grid-cols-[70px_1fr] gap-x-2 font-mono">
                <span>S</span><span>{T(isTr, 'Yeni eskiz / Seç', 'New sketch / Select')}</span>
                <span>L R C A</span><span>{T(isTr, 'Çizgi, Dikdörtgen, Daire, Yay', 'Line, Rect, Circle, Arc')}</span>
                <span>T</span><span>{T(isTr, 'Buda (Trim)', 'Trim')}</span>
                <span>D</span><span>{T(isTr, 'Ölçü', 'Dimension')}</span>
                <span>H / V</span><span>{T(isTr, 'Seçiliye yatay/dikey', 'Horizontal/vertical')}</span>
                <span>X</span><span>{T(isTr, 'Yapı çizgisi', 'Construction')}</span>
                <span>Del</span><span>{T(isTr, 'Sil', 'Delete')}</span>
                <span>Ctrl+Z/Y</span><span>{T(isTr, 'Geri/İleri', 'Undo/Redo')}</span>
                <span>Ctrl+Enter</span><span>{T(isTr, 'Eskizi bitir', 'Finish sketch')}</span>
                <span>E</span><span>{T(isTr, 'Ekstrüzyon', 'Extrude')}</span>
                <span>F</span><span>{T(isTr, 'Sığdır', 'Fit')}</span>
                <span>{T(isTr, 'Fare', 'Mouse')}</span><span>{T(isTr, 'Eskizde: sağ = kaydır, orta = döndür', 'In sketch: right = pan, middle = orbit')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-[var(--line)] bg-[var(--bg-1)] px-3 py-1 text-[11px] text-[var(--muted)]">
        <span className="truncate">{hint}</span>
        <span className="ml-auto flex shrink-0 items-center gap-3 font-mono">
          {mode === 'sketch' && hud.cursor && <span>u {hud.cursor.x.toFixed(2)} · v {hud.cursor.y.toFixed(2)} mm</span>}
          {mode === 'sketch' && hud.snap && <span className="text-[var(--ok)]">{hud.snap}</span>}
          {mode === 'sketch' && draft && (
            <span className={solveState && !solveState.converged ? 'text-[var(--bad)]' : dof === 0 ? 'text-[var(--ok)]' : ''}>
              {solveState && !solveState.converged ? T(isTr, 'Aşırı/çelişkili kısıt', 'Over/conflicting constraints') : dof === 0 ? T(isTr, 'Tam tanımlı', 'Fully defined') : `${dof} ${T(isTr, 'serbestlik', 'DOF free')}`}
            </span>
          )}
          {mode === 'sketch' && prof && (
            <span className={prof.auto.length ? 'text-[var(--ok)]' : 'text-[var(--warn)]'}>
              {prof.auto.length ? `${prof.auto.length} ${T(isTr, 'kapalı profil', 'closed profile(s)')}` : T(isTr, 'kapalı profil yok', 'no closed profile')}
              {prof.openEdges > 0 && ` · ${prof.openEdges} ${T(isTr, 'açık kenar', 'open edges')}`}
            </span>
          )}
        </span>
      </div>

      {/* ─── 2D Sketch Pattern / Array Modal ─── */}
      {isSketchArrayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-[var(--radius-m)] border border-[var(--line-strong)] bg-[var(--bg-1)] p-4 shadow-2xl text-[12px] text-[var(--ink)]">
            <div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-2">
              <div className="flex items-center gap-1.5 font-semibold text-[var(--cyan)]">
                <Grid size={15} />
                <span>{T(isTr, '2D Eskiz Çoğaltma (Array)', '2D Sketch Array')}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSketchArrayModalOpen(false)}
                className="rounded p-1 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--hover)] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Pattern Type Tabs */}
            <div className="mb-3 flex rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] p-0.5">
              <button
                type="button"
                onClick={() => setArrayTab('linear')}
                className={`flex-1 rounded py-1 text-center font-medium ${arrayTab === 'linear' ? 'bg-[var(--bg-0)] text-[var(--cyan)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}
              >
                {T(isTr, 'Doğrusal Dizi', 'Linear')}
              </button>
              <button
                type="button"
                onClick={() => setArrayTab('circular')}
                className={`flex-1 rounded py-1 text-center font-medium ${arrayTab === 'circular' ? 'bg-[var(--bg-0)] text-[var(--cyan)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}
              >
                {T(isTr, 'Dairesel Dizi', 'Circular')}
              </button>
            </div>

            {arrayTab === 'linear' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'X Adedi (n1)', 'Count X (n1)')}</span>
                  <div className="w-24">
                    <NumberField value={arrCountX} onChange={(v) => setArrCountX(Math.max(1, Math.round(v)))} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'X Aralığı (mm)', 'Spacing X (mm)')}</span>
                  <div className="w-24">
                    <NumberField value={arrStepX} onChange={(v) => setArrStepX(v)} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Y Adedi (n2)', 'Count Y (n2)')}</span>
                  <div className="w-24">
                    <NumberField value={arrCountY} onChange={(v) => setArrCountY(Math.max(1, Math.round(v)))} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Y Aralığı (mm)', 'Spacing Y (mm)')}</span>
                  <div className="w-24">
                    <NumberField value={arrStepY} onChange={(v) => setArrStepY(v)} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Açı (°)', 'Angle (°)')}</span>
                  <div className="w-24">
                    <NumberField value={arrAngle} onChange={(v) => setArrAngle(v)} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Merkez X (mm)', 'Center X (mm)')}</span>
                  <div className="w-24">
                    <NumberField value={arrCircCenterX} onChange={(v) => setArrCircCenterX(v)} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Merkez Y (mm)', 'Center Y (mm)')}</span>
                  <div className="w-24">
                    <NumberField value={arrCircCenterY} onChange={(v) => setArrCircCenterY(v)} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Toplam Adet (n)', 'Total Count (n)')}</span>
                  <div className="w-24">
                    <NumberField value={arrCircCount} onChange={(v) => setArrCircCount(Math.max(2, Math.round(v)))} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--muted)]">{T(isTr, 'Toplam Açı (°)', 'Total Angle (°)')}</span>
                  <div className="w-24">
                    <NumberField value={arrCircAngle} onChange={(v) => setArrCircAngle(v)} />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setIsSketchArrayModalOpen(false)}
                className="flex-1 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] py-1.5 text-center font-medium text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--ink)] cursor-pointer"
              >
                {T(isTr, 'Vazgeç', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (arrayTab === 'linear') {
                    st.applySketchLinearPattern(arrCountX, arrStepX, arrCountY, arrStepY, arrAngle);
                  } else {
                    st.applySketchCircularPattern(arrCircCenterX, arrCircCenterY, arrCircCount, arrCircAngle);
                  }
                  setIsSketchArrayModalOpen(false);
                  ping(T(isTr, 'Çoğaltma uygulandı', 'Pattern applied'));
                }}
                className="flex-1 rounded-[var(--radius-s)] bg-[var(--cyan)] py-1.5 text-center font-semibold text-[var(--accent-ink)] hover:opacity-90 cursor-pointer"
              >
                {T(isTr, 'Uygula', 'Apply')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── AutoCAD / 2D CAD Dynamic Block Library Modal ─── */}
      {isDynModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-6xl h-[85vh] rounded-[var(--radius-m)] border border-[var(--line-strong)] bg-[var(--bg-0)] shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--bg-1)] border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-cyan-400" />
                <span className="text-xs font-bold text-[var(--cyan)] font-mono">
                  {T(isTr, 'ALUCAD DİNAMİK BLOK KÜTÜPHANESİ', 'ALUCAD DYNAMIC BLOCKS LIBRARY')}
                </span>
                <span className="text-[10px] text-[var(--muted)] font-mono">AutoCAD 2D CAD & Part Studio</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDynModalOpen(false)}
                className="p-1 text-[var(--muted)] hover:text-white rounded hover:bg-[var(--bg-2)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <DynamicBlockConfigurator
                onClose={() => setIsDynModalOpen(false)}
                onStampToSketch={(blockDef, params) => {
                  st.stampDynamicBlock(blockDef.id, { x: 0, y: 0 }, params);
                  setIsDynModalOpen(false);
                  ping(T(isTr, `${blockDef.nameTr || blockDef.name} eskize eklendi`, `Added ${blockDef.name} to sketch`));
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PartStudio;
