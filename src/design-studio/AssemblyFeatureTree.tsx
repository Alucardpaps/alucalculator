'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Folder,
  FolderPlus,
  Pencil,
  Scissors,
  CircleDot,
  Box,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RotateCw,
  Trash2,
  Check,
  X,
  Search,
  Maximize2,
  Minimize2,
  FolderTree,
  CornerDownRight,
  MoreHorizontal,
  MoveRight,
  CornerUpLeft,
  ArrowUp,
  Link2,
  Disc,
  ArrowRightLeft,
  MoveHorizontal,
  Split,
  Plus,
  Flame,
} from 'lucide-react';
import { useDesignStore, type DesignPart, type SubAssembly } from './designStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import type { SurfaceCutItem, HoleItem } from './holeStandards';

interface AssemblyFeatureTreeProps {
  maximized?: boolean;
  onToggleMaximize?: () => void;
  onCollapse?: () => void;
  className?: string;
}

export function AssemblyFeatureTree({
  maximized = false,
  onToggleMaximize,
  onCollapse,
  className = '',
}: AssemblyFeatureTreeProps) {
  const { language } = useI18nStore();

  // Store state
  const parts = useDesignStore((s) => s.parts);
  const selectedId = useDesignStore((s) => s.selectedId);
  const isolatedPartId = useDesignStore((s) => s.isolatedPartId);
  const subAssemblies = useDesignStore((s) => s.subAssemblies);
  const expandedPartIds = useDesignStore((s) => s.expandedPartIds);
  const selectedFeature = useDesignStore((s) => s.selectedFeature);
  const editingPartId = useDesignStore((s) => s.editingPartId);
  const editingSubAssemblyId = useDesignStore((s) => s.editingSubAssemblyId);

  // Store actions
  const select = useDesignStore((s) => s.select);
  const toggleVisible = useDesignStore((s) => s.toggleVisible);
  const toggleLocked = useDesignStore((s) => s.toggleLocked);
  const togglePartGrounded = useDesignStore((s) => s.togglePartGrounded);
  const setIsolatedPartId = useDesignStore((s) => s.setIsolatedPartId);
  const setEditingPartId = useDesignStore((s) => s.setEditingPartId);
  const setEditingSubAssemblyId = useDesignStore((s) => s.setEditingSubAssemblyId);
  const demoteToSubAssembly = useDesignStore((s) => s.demoteToSubAssembly);
  const promotePart = useDesignStore((s) => s.promotePart);
  const showAllParts = useDesignStore((s) => s.showAllParts);
  const hideAllParts = useDesignStore((s) => s.hideAllParts);
  const clearScene = useDesignStore((s) => s.clearScene);

  const addSubAssembly = useDesignStore((s) => s.addSubAssembly);
  const pruneEmptySubAssemblies = useDesignStore((s) => s.pruneEmptySubAssemblies);
  const removeSubAssembly = useDesignStore((s) => s.removeSubAssembly);
  const renameSubAssembly = useDesignStore((s) => s.renameSubAssembly);
  const movePartToSubAssembly = useDesignStore((s) => s.movePartToSubAssembly);
  const toggleSubAssemblyVisible = useDesignStore((s) => s.toggleSubAssemblyVisible);
  const toggleSubAssemblyLocked = useDesignStore((s) => s.toggleSubAssemblyLocked);
  const toggleSubAssemblyExpanded = useDesignStore((s) => s.toggleSubAssemblyExpanded);

  const togglePartExpanded = useDesignStore((s) => s.togglePartExpanded);
  const expandAllParts = useDesignStore((s) => s.expandAllParts);
  const collapseAllParts = useDesignStore((s) => s.collapseAllParts);
  const startEditPartSketch = useDesignStore((s) => s.startEditPartSketch);
  const openPartStudioForPart = useDesignStore((s) => s.openPartStudioForPart);
  const setSelectedFeature = useDesignStore((s) => s.setSelectedFeature);
  const removeCut = useDesignStore((s) => s.removeCut);
  const removeHole = useDesignStore((s) => s.removeHole);

  // Mate store state & actions
  const mates = useDesignStore((s) => s.mates);
  const selectedMateId = useDesignStore((s) => s.selectedMateId);
  const setSelectedMateId = useDesignStore((s) => s.setSelectedMateId);
  const removeMate = useDesignStore((s) => s.removeMate);
  const toggleMateSuppressed = useDesignStore((s) => s.toggleMateSuppressed);
  const toggleMateFlip = useDesignStore((s) => s.toggleMateFlip);
  const openMateModal = useDesignStore((s) => s.openMateModal);

  // Weldments store state & actions (Mode 2)
  const cadMode = useDesignStore((s) => s.cadMode);
  const weldBeads = useDesignStore((s) => s.weldBeads);
  const selectedWeldId = useDesignStore((s) => s.selectedWeldId);
  const setSelectedWeldId = useDesignStore((s) => s.setSelectedWeldId);
  const removeWeldBead = useDesignStore((s) => s.removeWeldBead);
  const openWeldModal = useDesignStore((s) => s.openWeldModal);
  const [weldsExpanded, setWeldsExpanded] = useState(true);

  // Active in-place editing part
  const editingPart = useMemo(() => {
    return editingPartId ? parts.find((p) => p.id === editingPartId) || null : null;
  }, [editingPartId, parts]);

  // Local UI state
  const [filterText, setFilterText] = useState('');
  const [matesExpanded, setMatesExpanded] = useState(true);
  const [isAddingSubAssy, setIsAddingSubAssy] = useState(false);
  const [newSubAssyName, setNewSubAssyName] = useState('');
  const [editingSubAssyId, setEditingSubAssyId] = useState<string | null>(null);
  const [editingSubAssyName, setEditingSubAssyName] = useState('');
  const [movingPartId, setMovingPartId] = useState<string | null>(null);

  // Filtered lists
  const filteredParts = useMemo(() => {
    if (!filterText.trim()) return parts;
    const lower = filterText.toLowerCase();
    return parts.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.kind.toLowerCase().includes(lower) ||
        p.holes?.some((h) => h.size.toLowerCase().includes(lower)) ||
        p.cuts?.some((c) => c.type.toLowerCase().includes(lower))
    );
  }, [parts, filterText]);

  // Group parts by subAssemblyId
  const subAssyGroups = useMemo(() => {
    const map = new Map<string, DesignPart[]>();
    // initialize known sub-assemblies
    subAssemblies.forEach((sa) => map.set(sa.id, []));
    const rootParts: DesignPart[] = [];

    filteredParts.forEach((p) => {
      if (p.subAssemblyId && map.has(p.subAssemblyId)) {
        map.get(p.subAssemblyId)!.push(p);
      } else {
        rootParts.push(p);
      }
    });

    return { map, rootParts };
  }, [filteredParts, subAssemblies]);

  const handleCreateSubAssembly = () => {
    if (!newSubAssyName.trim()) {
      addSubAssembly(t12(language, `Sub-Assembly ${subAssemblies.length + 1}`, `Alt Montaj ${subAssemblies.length + 1}`));
    } else {
      addSubAssembly(newSubAssyName.trim());
    }
    setNewSubAssyName('');
    setIsAddingSubAssy(false);
  };

  const handleStartRename = (sa: SubAssembly) => {
    setEditingSubAssyId(sa.id);
    setEditingSubAssyName(sa.name);
  };

  const handleSaveRename = (id: string) => {
    if (editingSubAssyName.trim()) {
      renameSubAssembly(id, editingSubAssyName.trim());
    }
    setEditingSubAssyId(null);
  };

  return (
    <div className={`flex flex-col bg-[var(--bg-0)] font-mono select-none text-[10px] ${className}`}>
      {/* ─── TREE HEADER BAR ─── */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[var(--line)] bg-[var(--bg-1)]">
        <div className="flex items-center gap-1.5 min-w-0">
          <FolderTree size={12} className="text-[var(--cyan)] shrink-0" />
          <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-[var(--alu-dim)] truncate">
            // {t12(language, 'FEATURE & ASSEMBLY TREE', 'PARÇA & MONTAJ AĞACI')}
          </span>
          <span className="text-[7.5px] font-mono px-1 py-0.2 rounded bg-[var(--bg-2)] border border-[var(--line)] text-white font-bold shrink-0">
            {parts.length}
          </span>
          {subAssemblies.length > 0 && (
            <span className="text-[7.5px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold shrink-0">
              {subAssemblies.length} {t12(language, 'sub', 'alt')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Add Sub-Assembly Button */}
          <button
            type="button"
            onClick={() => setIsAddingSubAssy(true)}
            className="p-1 rounded text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all flex items-center gap-1 text-[8px] font-bold"
            title={t12(language, 'New Sub-Assembly', 'Yeni Alt Montaj Ekle')}
          >
            <FolderPlus size={10} />
            <span className="hidden sm:inline">{t12(language, '+ Sub', '+ Alt Montaj')}</span>
          </button>

          {/* Expand/Collapse All */}
          <button
            type="button"
            onClick={expandAllParts}
            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title={t12(language, 'Expand All', 'Tümünü Genişlet')}
          >
            <ChevronDown size={11} />
          </button>
          <button
            type="button"
            onClick={collapseAllParts}
            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title={t12(language, 'Collapse All', 'Tümünü Daralt')}
          >
            <ChevronRight size={11} />
          </button>

          {/* Maximize Toggle */}
          {onToggleMaximize && (
            <button
              type="button"
              onClick={onToggleMaximize}
              className="p-1 text-slate-400 hover:text-[var(--cyan)] hover:bg-white/10 rounded transition-colors"
              title={maximized ? t12(language, 'Minimize Tree', 'Ağacı Küçült') : t12(language, 'Maximize Tree', 'Ağacı Büyüt')}
            >
              {maximized ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
            </button>
          )}

          {/* Collapse Tree Sidebar */}
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              title={t12(language, 'Collapse Tree (HotKey: [)', 'Ağacı Gizle (Kısayol: [)')}
            >
              <ChevronLeft size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ─── AUTODESK INVENTOR IN-PLACE PART EDIT MODE BANNER ─── */}
      {editingPart && (
        <div className="px-2.5 py-1.5 bg-cyan-950/80 border-b border-cyan-400/50 flex items-center justify-between gap-1 shadow-inner animate-in fade-in">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <div className="min-w-0">
              <div className="text-[7.5px] uppercase tracking-wider text-cyan-400 font-bold">
                // {t12(language, 'INVENTOR PART EDIT', 'PARÇA DÜZENLEME MODU')}
              </div>
              <div className="text-[9.5px] font-bold text-white truncate">
                {editingPart.name}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditingPartId(null)}
            className="px-2 py-0.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[8px] flex items-center gap-1 shrink-0 transition shadow cursor-pointer active:scale-95"
            title={t12(language, 'Finish editing and return to assembly (Esc)', 'Düzenlemeyi bitir ve montaja dön (Esc)')}
          >
            <CornerUpLeft size={10} />
            <span>{t12(language, 'Return', 'Montaja Dön')}</span>
          </button>
        </div>
      )}

      {/* ─── QUICK CONTROLS & FILTER ─── */}
      <div className="px-2 py-1 border-b border-[var(--line)] bg-[var(--bg-0)] flex items-center justify-between gap-1.5">
        <div className="relative flex-1 min-w-0">
          <Search size={9} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={t12(language, 'Filter features & parts...', 'Unsurları ve parçaları filtrele...')}
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-5 py-0.5 text-[8.5px] text-white placeholder-slate-500 outline-none focus:border-[var(--cyan)] transition-colors"
          />
          {filterText && (
            <button
              type="button"
              onClick={() => setFilterText('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[8px]"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 shrink-0">
          <button
            type="button"
            onClick={showAllParts}
            className="hover:text-[var(--cyan)] transition"
          >
            {t12(language, 'Show', 'Göster')}
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={hideAllParts}
            className="hover:text-white transition"
          >
            {t12(language, 'Hide', 'Gizle')}
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => pruneEmptySubAssemblies()}
            className="text-amber-400 hover:text-amber-300 transition"
            title={t12(language, 'Remove all empty sub-assembly folders', 'Tüm boş alt montaj klasörlerini temizle')}
          >
            {t12(language, 'Prune Folders', 'Boşları Temizle')}
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => {
              if (confirm(t12(language, 'Clear entire scene?', 'Tüm sahne silinsin mi?'))) {
                clearScene();
              }
            }}
            className="text-rose-400 hover:text-rose-300 transition"
          >
            {t12(language, 'Clear', 'Temizle')}
          </button>
        </div>
      </div>

      {/* ─── INLINE NEW SUB-ASSEMBLY FORM ─── */}
      {isAddingSubAssy && (
        <div className="p-1.5 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center gap-1">
          <FolderPlus size={11} className="text-emerald-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder={t12(language, 'Sub-assembly name (e.g. Engine, Wheel Assembly)', 'Alt montaj adı (örn. Motor, Teker Grubu)')}
            value={newSubAssyName}
            onChange={(e) => setNewSubAssyName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateSubAssembly();
              if (e.key === 'Escape') setIsAddingSubAssy(false);
            }}
            className="flex-1 bg-black/60 border border-emerald-500/40 rounded px-1.5 py-0.5 text-[9px] text-white outline-none"
          />
          <button
            type="button"
            onClick={handleCreateSubAssembly}
            className="p-1 rounded bg-emerald-500 text-black hover:bg-emerald-400 font-bold"
            title={t12(language, 'Save', 'Kaydet')}
          >
            <Check size={10} />
          </button>
          <button
            type="button"
            onClick={() => setIsAddingSubAssy(false)}
            className="p-1 rounded bg-white/10 text-slate-300 hover:bg-white/20"
            title={t12(language, 'Cancel', 'İptal')}
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* ─── TREE CONTENT ─── */}
      <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar space-y-1">
        {parts.length === 0 ? (
          <div className="py-8 text-center text-slate-600 space-y-1">
            <Box size={20} className="mx-auto text-slate-700 opacity-60" />
            <p className="text-[9px] font-mono">{t12(language, 'No parts in assembly', 'Montajda henüz parça yok')}</p>
          </div>
        ) : (
          <>
            {/* 1. SUB-ASSEMBLIES */}
            {subAssemblies.map((sa) => {
              const groupParts = subAssyGroups.map.get(sa.id) || [];
              const isExpanded = sa.expanded !== false;

              return (
                <div
                  key={sa.id}
                  className="rounded-[var(--radius-s)] border border-emerald-500/30 bg-emerald-950/15 overflow-hidden transition-all"
                >
                  {/* Sub-Assembly Header Row */}
                  <div className="flex items-center justify-between gap-1 px-1.5 py-1 bg-emerald-950/30 border-b border-emerald-500/20">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleSubAssemblyExpanded(sa.id)}
                        className="p-0.5 text-emerald-400 hover:text-white rounded transition"
                      >
                        {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                      </button>

                      <Folder size={11} className="text-emerald-400 shrink-0" />

                      {editingSubAssyId === sa.id ? (
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            autoFocus
                            type="text"
                            value={editingSubAssyName}
                            onChange={(e) => setEditingSubAssyName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(sa.id);
                              if (e.key === 'Escape') setEditingSubAssyId(null);
                            }}
                            className="bg-black/80 border border-emerald-400 rounded px-1 py-0.2 text-[9px] text-white w-28"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(sa.id)}
                            className="text-emerald-300 hover:text-white"
                          >
                            <Check size={9} />
                          </button>
                        </div>
                      ) : (
                        <span
                          onDoubleClick={() => handleStartRename(sa)}
                          className="font-bold text-emerald-200 truncate cursor-pointer hover:underline text-[9.5px]"
                          title={t12(language, 'Double-click to rename', 'Yeniden adlandırmak için çift tıklayın')}
                        >
                          {sa.name}
                        </span>
                      )}

                      <span className="text-[7.5px] px-1 py-0.2 rounded bg-black/40 text-emerald-300 font-bold border border-emerald-500/30 shrink-0">
                        {groupParts.length}
                      </span>
                    </div>

                    {/* Sub-Assembly Actions */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {/* Focus / In-Place Sub-Assembly Edit (Autodesk Inventor) */}
                      <button
                        type="button"
                        onClick={() => setEditingSubAssemblyId(editingSubAssemblyId === sa.id ? null : sa.id)}
                        className={`p-1 rounded transition ${
                          editingSubAssemblyId === sa.id
                            ? 'text-emerald-300 bg-emerald-500/25 border border-emerald-400/40 font-bold'
                            : 'text-slate-400 hover:text-emerald-300 hover:bg-white/10'
                        }`}
                        title={
                          editingSubAssemblyId === sa.id
                            ? t12(language, 'Exit Sub-Assembly Focus', 'Alt Montaj Odaklamasından Çık')
                            : t12(language, 'Focus / Edit Sub-Assembly (Ghost others / Inventor)', 'Alt Montaja Odaklan (Diğerlerini Yarı Saydam Yap)')
                        }
                      >
                        <FolderTree size={10} />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleSubAssemblyVisible(sa.id)}
                        className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition"
                        title={sa.visible ? t12(language, 'Hide Sub-Assembly', 'Alt Montajı Gizle') : t12(language, 'Show Sub-Assembly', 'Alt Montajı Göster')}
                      >
                        {sa.visible ? <Eye size={10} /> : <EyeOff size={10} className="text-slate-600" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleSubAssemblyLocked(sa.id)}
                        className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition"
                        title={sa.locked ? t12(language, 'Unlock Sub-Assembly', 'Alt Montaj Kilidini Aç') : t12(language, 'Lock Sub-Assembly', 'Alt Montajı Kilitle')}
                      >
                        {sa.locked ? <Lock size={10} className="text-amber-400" /> : <Unlock size={10} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(t12(language, `Dissolve "${sa.name}"? (Child parts will move to Root)`, `"${sa.name}" alt montajı dağıtılsın mı? (Parçalar kök montaja taşınır)`))) {
                            removeSubAssembly(sa.id, true);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                        title={t12(language, 'Dissolve Sub-Assembly', 'Alt Montajı Dağıt (Parçaları Koru)')}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>

                  {/* Sub-Assembly Nested Parts */}
                  {isExpanded && (
                    <div className="p-1 space-y-1 border-l-2 border-emerald-500/40 ml-2.5 my-1">
                      {groupParts.length === 0 ? (
                        <div className="py-1 px-2 flex items-center justify-between text-[8px] text-slate-500 italic bg-black/30 rounded border border-white/5">
                          <span>{t12(language, 'Empty sub-assembly', 'Boş alt montaj')}</span>
                          <button
                            type="button"
                            onClick={() => removeSubAssembly(sa.id, false)}
                            className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 text-[7.5px] font-bold not-italic cursor-pointer transition"
                            title={t12(language, 'Delete empty folder', 'Boş klasörü sil')}
                          >
                            {t12(language, 'Delete', 'Sil')}
                          </button>
                        </div>
                      ) : (
                        groupParts.map((part) => (
                          <PartFeatureNode
                            key={part.id}
                            part={part}
                            selectedId={selectedId}
                            isolatedPartId={isolatedPartId}
                            isEditing={editingPartId === part.id}
                            isExpanded={expandedPartIds.includes(part.id)}
                            subAssemblies={subAssemblies}
                            movingPartId={movingPartId}
                            onSetMovingPartId={setMovingPartId}
                            onSelect={select}
                            onToggleExpanded={togglePartExpanded}
                            onToggleVisible={toggleVisible}
                            onToggleLocked={toggleLocked}
                            onToggleGrounded={togglePartGrounded}
                            onIsolate={setIsolatedPartId}
                            onEditInPlace={setEditingPartId}
                            onEditInPartStudio={openPartStudioForPart}
                            onPromote={promotePart}
                            onDemoteToNewSubAssy={(pId) => {
                              demoteToSubAssembly([pId], `${part.name} Sub-Assy`);
                            }}
                            onMoveToSubAssy={movePartToSubAssembly}
                            onEditSketch={startEditPartSketch}
                            onSelectFeature={setSelectedFeature}
                            onRemoveCut={removeCut}
                            onRemoveHole={removeHole}
                            selectedFeature={selectedFeature}
                            language={language}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 2. ROOT PARTS SECTION */}
            {subAssyGroups.rootParts.length > 0 && (
              <div className="space-y-1 pt-1">
                {subAssemblies.length > 0 && (
                  <div className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 border-t border-white/5 pt-1">
                    <Box size={9} className="text-[var(--cyan)]" />
                    <span>// {t12(language, 'ROOT ASSEMBLY PARTS', 'KÖK MONTAJ PARÇALARI')} ({subAssyGroups.rootParts.length})</span>
                  </div>
                )}
                {subAssyGroups.rootParts.map((part) => (
                  <PartFeatureNode
                    key={part.id}
                    part={part}
                    selectedId={selectedId}
                    isolatedPartId={isolatedPartId}
                    isEditing={editingPartId === part.id}
                    isExpanded={expandedPartIds.includes(part.id)}
                    subAssemblies={subAssemblies}
                    movingPartId={movingPartId}
                    onSetMovingPartId={setMovingPartId}
                    onSelect={select}
                    onToggleExpanded={togglePartExpanded}
                    onToggleVisible={toggleVisible}
                    onToggleLocked={toggleLocked}
                    onToggleGrounded={togglePartGrounded}
                    onIsolate={setIsolatedPartId}
                    onEditInPlace={setEditingPartId}
                    onEditInPartStudio={openPartStudioForPart}
                    onPromote={promotePart}
                    onDemoteToNewSubAssy={(pId) => {
                      demoteToSubAssembly([pId], `${part.name} Sub-Assy`);
                    }}
                    onMoveToSubAssy={movePartToSubAssembly}
                    onEditSketch={startEditPartSketch}
                    onSelectFeature={setSelectedFeature}
                    onRemoveCut={removeCut}
                    onRemoveHole={removeHole}
                    selectedFeature={selectedFeature}
                    language={language}
                  />
                ))}
              </div>
            )}

            {/* ─── WELDMENTS & FABRICATION WELD BEADS (KAYNAK DİKİŞLERİ) FOLDER ─── */}
            <div className="mt-2 rounded-[var(--radius-s)] border border-amber-500/30 bg-[var(--bg-1)] overflow-hidden shadow-xs">
              {/* Header */}
              <div
                onClick={() => setWeldsExpanded(!weldsExpanded)}
                className="flex items-center justify-between px-2 py-1.5 bg-amber-950/40 hover:bg-amber-950/60 border-b border-amber-500/20 cursor-pointer transition"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setWeldsExpanded(!weldsExpanded);
                    }}
                    className="p-0.5 text-amber-400 hover:text-white"
                  >
                    {weldsExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  </button>
                  <Flame size={12} className="text-amber-400 shrink-0" />
                  <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-amber-300 truncate">
                    // {t12(language, 'WELDS (KAYNAKLAR - ISO 2553)', 'KAYNAK DİKİŞLERİ (ISO 2553)')}
                  </span>
                  <span className="text-[7.5px] font-mono px-1 py-0.2 rounded bg-amber-500/20 border border-amber-500/30 text-amber-200 font-bold shrink-0">
                    {weldBeads.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openWeldModal();
                  }}
                  className="px-1.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[8px] flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                  title={t12(language, 'Add New Weld Bead (ISO 2553)', 'Yeni Kaynak Dikişi Ekle')}
                >
                  <Plus size={9} />
                  <span>{t12(language, '+ Weld', '+ Kaynak')}</span>
                </button>
              </div>

              {/* Welds Content */}
              {weldsExpanded && (
                <div className="p-1 space-y-1">
                  {weldBeads.length === 0 ? (
                    <div className="px-2 py-2 text-[8px] text-[var(--alu-dim)] italic text-center">
                      {t12(
                        language,
                        'No weld beads yet. Click "+ Weld" to join parts with physical cuttable welds.',
                        'Henüz kaynak dikişi eklenmedi. "+ Kaynak" ile parçaları kaynatın (kesilebilir kaynak).'
                      )}
                    </div>
                  ) : (
                    weldBeads.map((weld) => {
                      const isSelected = selectedWeldId === weld.id;
                      const partA = parts.find((p) => p.id === weld.partAId);
                      const partB = parts.find((p) => p.id === weld.partBId);
                      const cutsCount = (weld.cuts?.length || 0) + (weld.holes?.length || 0);

                      return (
                        <div
                          key={weld.id}
                          onClick={() => setSelectedWeldId(isSelected ? null : weld.id)}
                          className={`p-1.5 rounded-[var(--radius-s)] border transition flex items-center justify-between gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'border-amber-400 bg-amber-500/20 shadow-xs'
                              : 'border-[var(--line)] bg-[var(--bg-2)] hover:border-amber-500/40'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Flame size={11} className={isSelected ? 'text-amber-300' : 'text-amber-500'} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-bold text-white truncate">{weld.name}</span>
                                <span className="text-[7.5px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                  a={weld.throatThicknessA || Math.round(weld.legSizeMm * 0.707)}mm
                                </span>
                              </div>
                              <div className="text-[7.5px] text-slate-400 flex items-center gap-1">
                                <span>{partA?.name || 'P1'} ↔ {partB?.name || 'P2'}</span>
                                {cutsCount > 0 && (
                                  <span className="text-rose-400 font-bold">
                                    · ✂️ {cutsCount} {t12(language, 'cuts', 'kesi')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeWeldBead(weld.id);
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                              title={t12(language, 'Delete Weld', 'Kaynağı Sil')}
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* ─── SOLIDWORKS ASSEMBLY MATES (MONTAJ İLİŞKİLERİ) FOLDER ─── */}
            <div className="mt-2 rounded-[var(--radius-s)] border border-cyan-500/30 bg-[var(--bg-1)] overflow-hidden shadow-xs">
              {/* Header */}
              <div
                onClick={() => setMatesExpanded(!matesExpanded)}
                className="flex items-center justify-between px-2 py-1.5 bg-cyan-950/40 hover:bg-cyan-950/60 border-b border-cyan-500/20 cursor-pointer transition"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMatesExpanded(!matesExpanded);
                    }}
                    className="p-0.5 text-cyan-400 hover:text-white"
                  >
                    {matesExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  </button>
                  <Link2 size={12} className="text-[var(--cyan)] shrink-0" />
                  <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-cyan-300 truncate">
                    // {t12(language, 'MATES (MONTAJ İLİŞKİLERİ)', 'MONTAJ İLİŞKİLERİ')}
                  </span>
                  <span className="text-[7.5px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-200 font-bold shrink-0">
                    {mates.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openMateModal();
                  }}
                  className="px-1.5 py-0.5 rounded bg-[var(--cyan)] hover:bg-[var(--cyan)] text-black font-extrabold text-[8px] flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                  title={t12(language, 'Add New Assembly Mate (SolidWorks)', 'Yeni Montaj İlişkisi Ekle')}
                >
                  <Plus size={9} />
                  <span>{t12(language, '+ Mate', '+ İlişki')}</span>
                </button>
              </div>

              {/* Mates Content */}
              {matesExpanded && (
                <div className="p-1 space-y-1">
                  {mates.length === 0 ? (
                    <div className="px-2 py-2 text-[8px] text-[var(--alu-dim)] italic text-center">
                      {t12(
                        language,
                        'No mates defined yet. Click "+ Mate" to constrain parts.',
                        'Henüz montaj ilişkisi eklenmedi. "+ İlişki" ile parça bağlayın.'
                      )}
                    </div>
                  ) : (
                    mates.map((mate) => {
                      const isSelected = selectedMateId === mate.id;
                      const partA = parts.find((p) => p.id === mate.partAId);
                      const partB = parts.find((p) => p.id === mate.partBId);

                      return (
                        <div
                          key={mate.id}
                          onClick={() => setSelectedMateId(isSelected ? null : mate.id)}
                          className={`p-1.5 rounded-[var(--radius-s)] border transition flex items-center justify-between gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'border-[var(--cyan)] bg-[var(--cyan)]/20 shadow-xs'
                              : mate.suppressed
                              ? 'border-dashed border-slate-700 bg-[var(--bg-2)]/50 opacity-60'
                              : 'border-[var(--line)] bg-[var(--bg-2)] hover:border-[var(--line-strong)]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span
                              className="text-[var(--cyan)] shrink-0"
                              title={
                                mate.kind === 'concentric'
                                  ? 'Concentric (Eşmerkezli)'
                                  : mate.kind === 'coincident'
                                  ? 'Coincident (Çakışık)'
                                  : mate.kind === 'distance'
                                  ? 'Distance (Mesafe)'
                                  : mate.kind === 'parallel'
                                  ? 'Parallel (Paralel)'
                                  : mate.kind === 'perpendicular'
                                  ? 'Perpendicular (Dik)'
                                  : 'Mate'
                              }
                            >
                              {mate.kind === 'concentric' ? (
                                <Disc size={11} />
                              ) : mate.kind === 'coincident' ? (
                                <Layers size={11} />
                              ) : mate.kind === 'distance' ? (
                                <MoveHorizontal size={11} />
                              ) : mate.kind === 'parallel' ? (
                                <ArrowRightLeft size={11} />
                              ) : mate.kind === 'perpendicular' ? (
                                <Split size={11} />
                              ) : (
                                <Link2 size={11} />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-[8.5px] font-bold text-white truncate">
                                {mate.kind.toUpperCase()}
                                <span className="text-[var(--alu-dim)] font-normal ml-1">
                                  ({partA?.name || 'A'} ↔ {partB?.name || 'B'})
                                </span>
                              </div>
                              {mate.offset !== undefined && mate.offset !== 0 && (
                                <div className="text-[7.5px] text-[var(--cyan)] font-mono">
                                  offset: {mate.offset}mm {mate.flip ? '(flipped)' : ''}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Mate Actions */}
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {/* Suppress / Unsuppress */}
                            <button
                              type="button"
                              onClick={() => toggleMateSuppressed(mate.id)}
                              className={`p-0.5 rounded transition ${
                                mate.suppressed
                                  ? 'text-amber-400 hover:text-amber-300'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                              title={mate.suppressed ? t12(language, 'Unsuppress Mate', 'Etkinleştir') : t12(language, 'Suppress Mate', 'Pasifleştir')}
                            >
                              {mate.suppressed ? <EyeOff size={10} /> : <Eye size={10} />}
                            </button>

                            {/* Flip */}
                            <button
                              type="button"
                              onClick={() => toggleMateFlip(mate.id)}
                              className={`p-0.5 rounded transition ${
                                mate.flip ? 'text-amber-400' : 'text-slate-400 hover:text-white'
                              }`}
                              title={t12(language, 'Flip Alignment Direction', 'Hizalama Yönünü Ters Çevir')}
                            >
                              <ArrowRightLeft size={10} />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => removeMate(mate.id)}
                              className="p-0.5 text-slate-400 hover:text-rose-400 transition"
                              title={t12(language, 'Delete Mate', 'İlişkiyi Sil')}
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PART & SOLIDWORKS-STYLE NESTED FEATURES NODE
// ─────────────────────────────────────────────────────────────────────────────

interface PartFeatureNodeProps {
  part: DesignPart;
  selectedId: string | null;
  isolatedPartId: string | null;
  isEditing: boolean;
  isExpanded: boolean;
  subAssemblies: SubAssembly[];
  movingPartId: string | null;
  onSetMovingPartId: (id: string | null) => void;
  onSelect: (id: string) => void;
  onToggleExpanded: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onToggleGrounded: (id: string) => void;
  onIsolate: (id: string | null) => void;
  onEditInPlace: (id: string | null) => void;
  onEditInPartStudio: (partId: string, opts?: { featureId?: string; featureSubtype?: 'sketch' | 'feature' }) => void;
  onPromote: (id: string) => void;
  onDemoteToNewSubAssy: (partId: string) => void;
  onMoveToSubAssy: (partId: string, subAssyId: string | null) => void;
  onEditSketch: (partId: string) => void;
  onSelectFeature: (f: { type: 'sketch' | 'boss' | 'cut' | 'hole'; id?: string; partId?: string } | null) => void;
  onRemoveCut: (id: string) => void;
  onRemoveHole: (id: string) => void;
  selectedFeature: { type: 'sketch' | 'boss' | 'cut' | 'hole'; id?: string; partId?: string } | null;
  language: string;
}

function PartFeatureNode({
  part,
  selectedId,
  isolatedPartId,
  isEditing,
  isExpanded,
  subAssemblies,
  movingPartId,
  onSetMovingPartId,
  onSelect,
  onToggleExpanded,
  onToggleVisible,
  onToggleLocked,
  onToggleGrounded,
  onIsolate,
  onEditInPlace,
  onEditInPartStudio,
  onPromote,
  onDemoteToNewSubAssy,
  onMoveToSubAssy,
  onEditSketch,
  onSelectFeature,
  onRemoveCut,
  onRemoveHole,
  selectedFeature,
  language,
}: PartFeatureNodeProps) {
  const isSelected = selectedId === part.id;
  const isIsolated = isolatedPartId === part.id;

  const isParasolid = part.name.includes('(Parasolid)');
  const isStep = part.name.includes('(STEP)');
  const isStl = part.name.includes('(STL)');
  const cleanName = part.name.replace(/\s*\((Parasolid|STEP|STL|OBJ|GLTF)\)/i, '');
  const tag = isParasolid ? 'Parasolid' : isStep ? 'STEP' : isStl ? 'STL' : null;

  const hasCuts = part.cuts && part.cuts.length > 0;
  const hasHoles = part.holes && part.holes.length > 0;
  const hasFeatures = true; // Every solid has sketch/base + boss + optional cuts/holes

  return (
    <div
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEditInPartStudio(part.id);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onEditInPartStudio(part.id);
      }}
      className={`rounded-[var(--radius-s)] border transition-all ${
        isEditing
          ? 'border-cyan-400 bg-cyan-950/60 ring-1 ring-cyan-400/50'
          : isIsolated
          ? 'border-amber-500/70 bg-amber-500/15 shadow-sm'
          : isSelected
          ? 'border-[var(--cyan)] bg-[var(--cyan)]/15 shadow-sm'
          : 'border-[var(--line)] bg-[var(--bg-2)] hover:border-[var(--line-strong)]'
      }`}
    >
      {/* Part Main Header Row */}
      <div className="flex items-center justify-between gap-1 px-1.5 py-1">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {/* Feature Tree Expand/Collapse Chevron */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpanded(part.id);
            }}
            className="p-0.5 text-slate-400 hover:text-white rounded transition"
            title={isExpanded ? t12(language, 'Collapse Features', 'Unsurları Gizle') : t12(language, 'Expand Features', 'Unsurları Göster')}
          >
            {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>

          {/* Part Selection Button */}
          <button
            type="button"
            onClick={() => onSelect(part.id)}
            className="flex items-center gap-1.5 min-w-0 flex-1 text-left truncate cursor-pointer"
            title={t12(language, 'Click to select · Double-click to Edit in Place (Inventor)', 'Tıklayarak seçin · Çift tıklayarak Parça Modunda Düzenleyin (Inventor)')}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0 border border-white/20"
              style={{ backgroundColor: part.color || '#00e5ff' }}
            />
            <span className="truncate font-bold text-slate-100 text-[10px]">{cleanName}</span>
            {isEditing && (
              <span className="text-[7px] font-mono font-black px-1 py-0.2 rounded bg-cyan-400 text-black shrink-0 uppercase tracking-wider animate-pulse">
                EDIT
              </span>
            )}
            {tag && (
              <span className="text-[7px] font-mono font-bold px-1 py-0.2 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[var(--cyan)] shrink-0 uppercase">
                {tag}
              </span>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* In-Place Part Edit Button (Opens Part Studio) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditInPartStudio(part.id);
            }}
            className="p-1 rounded transition text-[8.5px] font-bold flex items-center gap-0.5 text-cyan-400 hover:text-white hover:bg-cyan-500/20"
            title={t12(language, 'Edit in Part Studio (Full parametric sketch & solid modeling)', 'Parça Stüdyosunda Düzenle (Parametrik eskiz ve katı modelleme)')}
          >
            <Pencil size={10} />
          </button>

          {/* Grounded Pin Toggle (Autodesk Inventor 📌 Grounded) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleGrounded(part.id);
            }}
            className={`p-1 rounded transition text-[8.5px] ${
              part.grounded
                ? 'text-amber-300 bg-amber-400/25 border border-amber-400/50 shadow-sm'
                : 'text-slate-500 hover:text-amber-300 hover:bg-white/10'
            }`}
            title={
              part.grounded
                ? t12(language, 'Grounded Component (Pinned in place / Inventor 📌) - Click to unpin', 'Sabit Bileşen (Inventor 📌 Grounded) - Tıklayarak serbest bırakın')
                : t12(language, 'Ground Component (Pin in place / Inventor 📌)', 'Bileşeni Sabitle (Inventor 📌 Ground)')
            }
          >
            📌
          </button>

          {/* Promote from Subassembly (Autodesk Inventor Promote) */}
          {part.subAssemblyId && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPromote(part.id);
              }}
              className="p-1 text-slate-400 hover:text-emerald-300 hover:bg-white/10 rounded transition"
              title={t12(language, 'Promote to Root/Parent Assembly (Inventor)', 'Üst / Kök Montaja Çıkar (Inventor Promote)')}
            >
              <ArrowUp size={10} />
            </button>
          )}

          {/* Move to Sub-Assembly Popover Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => onSetMovingPartId(movingPartId === part.id ? null : part.id)}
              className={`p-1 rounded transition text-[8px] font-bold ${
                movingPartId === part.id
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)]'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-white/10'
              }`}
              title={t12(language, 'Move to Sub-Assembly / Demote', 'Alt Montaja Taşı / Demote...')}
            >
              <Folder size={10} />
            </button>

            {/* Sub-Assembly Selection Menu */}
            {movingPartId === part.id && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--bg-1)] border border-emerald-500/40 rounded-lg shadow-2xl p-1 z-50 space-y-0.5 font-mono text-[8.5px]">
                <div className="px-1.5 py-1 text-emerald-400 font-bold border-b border-white/10 uppercase tracking-wider">
                  {t12(language, 'Move Part To:', 'Parçayı Taşı:')}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onMoveToSubAssy(part.id, null);
                    onSetMovingPartId(null);
                  }}
                  className={`w-full text-left px-1.5 py-1 rounded flex items-center justify-between hover:bg-white/10 ${
                    !part.subAssemblyId ? 'text-cyan-300 font-bold bg-cyan-500/10' : 'text-slate-300'
                  }`}
                >
                  <span>📦 {t12(language, 'Root (Main Assembly)', 'Kök (Ana Montaj)')}</span>
                  {!part.subAssemblyId && <span>✓</span>}
                </button>
                {subAssemblies.map((sa) => (
                  <button
                    key={sa.id}
                    type="button"
                    onClick={() => {
                      onMoveToSubAssy(part.id, sa.id);
                      onSetMovingPartId(null);
                    }}
                    className={`w-full text-left px-1.5 py-1 rounded flex items-center justify-between hover:bg-white/10 ${
                      part.subAssemblyId === sa.id ? 'text-emerald-300 font-bold bg-emerald-500/15' : 'text-slate-300'
                    }`}
                  >
                    <span className="truncate">📁 {sa.name}</span>
                    {part.subAssemblyId === sa.id && <span>✓</span>}
                  </button>
                ))}
                {/* Inventor Demote: Create new subassembly from this part */}
                <button
                  type="button"
                  onClick={() => {
                    onDemoteToNewSubAssy(part.id);
                    onSetMovingPartId(null);
                  }}
                  className="w-full text-left px-1.5 py-1 rounded flex items-center gap-1.5 text-emerald-300 hover:bg-emerald-500/20 border-t border-white/10 pt-1 font-bold"
                >
                  <FolderPlus size={10} />
                  <span>+ {t12(language, 'Create Sub-Assembly (Demote)', 'Yeni Alt Montaja Taşı (Demote)')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Isolate */}
          <button
            type="button"
            onClick={() => onIsolate(isIsolated ? null : part.id)}
            className={`p-1 rounded transition ${
              isIsolated ? 'text-amber-300 font-bold bg-amber-400/20' : 'text-slate-400 hover:text-amber-300 hover:bg-white/10'
            }`}
            title={isIsolated ? t12(language, 'Unisolate', 'İzolasyonu Kaldır') : t12(language, 'Isolate Part', 'Parçayı İzole Et')}
          >
            <span className="text-[10px] leading-none">🎯</span>
          </button>

          {/* Visible */}
          <button
            type="button"
            onClick={() => onToggleVisible(part.id)}
            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition"
            title={part.visible ? t12(language, 'Hide', 'Gizle') : t12(language, 'Show', 'Göster')}
          >
            {part.visible ? <Eye size={10} /> : <EyeOff size={10} className="text-slate-600" />}
          </button>

          {/* Lock */}
          <button
            type="button"
            onClick={() => onToggleLocked(part.id)}
            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition"
            title={part.locked ? t12(language, 'Unlock', 'Kilidi Aç') : t12(language, 'Lock', 'Kilitle')}
          >
            {part.locked ? <Lock size={10} className="text-amber-400" /> : <Unlock size={10} />}
          </button>
        </div>
      </div>

      {/* ─── SOLIDWORKS-STYLE EXPANDED FEATURES TREE ─── */}
      {isExpanded && (
        <div className="px-2 py-1.5 border-t border-white/5 bg-black/40 space-y-1.5 text-[8.5px] border-l-2 border-cyan-500/40 ml-2">
          {/* Dynamic Part Studio Features (Sketches, Extrusions, Revolves) */}
          {part.partDoc && Array.isArray(part.partDoc.features) && part.partDoc.features.length > 0 ? (
            part.partDoc.features.map((feat: any) => {
              const isSk = feat.type === 'sketch';
              const isEx = feat.type === 'extrude';
              const isRv = feat.type === 'revolve';
              return (
                <div
                  key={feat.id}
                  className="flex items-center justify-between p-1 rounded transition hover:bg-white/5 text-slate-300"
                >
                  <div
                    className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      onSelect(part.id);
                      onEditInPartStudio(part.id, { featureId: feat.id, featureSubtype: isSk ? 'sketch' : 'feature' });
                    }}
                  >
                    {isSk ? (
                      <Pencil size={10} className="text-cyan-400 shrink-0" />
                    ) : isRv ? (
                      <RotateCw size={10} className="text-amber-400 shrink-0" />
                    ) : (
                      <Box size={10} className="text-emerald-400 shrink-0" />
                    )}
                    <span className="font-bold truncate text-slate-100">{feat.name}</span>
                    <span className="text-[7.5px] text-slate-400">
                      {isSk ? `(${feat.planeLabel || 'Sketch'})` : isEx ? `${feat.distance}mm` : isRv ? `${feat.angle}°` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEditInPartStudio(part.id, { featureId: feat.id, featureSubtype: isSk ? 'sketch' : 'feature' })}
                    className="px-1.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/40 text-[8px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
                    title={t12(language, 'Edit in Part Studio', 'Parça Stüdyosunda Düzenle')}
                  >
                    <Pencil size={8} />
                    <span>{t12(language, 'Edit', 'Düzenle')}</span>
                  </button>
                </div>
              );
            })
          ) : (
            <>
              {/* 1. 📐 BASE SKETCH FEATURE */}
              <div
                className={`flex items-center justify-between p-1 rounded transition ${
                  selectedFeature?.type === 'sketch' && selectedFeature.partId === part.id
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                    : 'hover:bg-white/5 text-slate-300'
                }`}
              >
                <div
                  className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
                  onClick={() => {
                    onSelect(part.id);
                    onEditInPartStudio(part.id, { featureSubtype: 'sketch' });
                  }}
                >
                  <Pencil size={10} className="text-cyan-400 shrink-0" />
                  <span className="font-bold truncate">
                    {t12(language, 'Sketch 1 (Profile)', 'Çizim 1 (Taban Profili)')}
                  </span>
                  <span className="text-[7.5px] text-slate-500">
                    {part.outer ? `(${part.outer.length} pts)` : `(${part.kind})`}
                  </span>
                </div>

                {/* Edit Sketch in Part Studio Button */}
                <button
                  type="button"
                  onClick={() => onEditInPartStudio(part.id, { featureSubtype: 'sketch' })}
                  className="px-1.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/40 text-[8px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
                  title={t12(language, 'Edit 2D sketch profile in Part Studio', '2D taban profilini Parça Stüdyosunda düzenle')}
                >
                  <Pencil size={8} />
                  <span>{t12(language, 'Edit', 'Düzenle')}</span>
                </button>
              </div>

              {/* 2. 📦 SOLID BOSS/EXTRUDE FEATURE */}
              <div
                className={`flex items-center justify-between p-1 rounded transition cursor-pointer ${
                  selectedFeature?.type === 'boss' && selectedFeature.partId === part.id
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                    : 'hover:bg-white/5 text-slate-300'
                }`}
                onClick={() => {
                  onSelect(part.id);
                  onEditInPartStudio(part.id, { featureSubtype: 'feature' });
                }}
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <Box size={10} className="text-emerald-400 shrink-0" />
                  <span className="font-bold truncate">
                    {part.solidOp === 'revolve'
                      ? t12(language, 'Boss-Revolve', 'Katı-Döndürme')
                      : part.solidOp === 'loft'
                      ? t12(language, 'Boss-Loft', 'Katı-Loft')
                      : t12(language, 'Boss-Extrude', 'Katı-Ekstrüzyon')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-mono text-emerald-400 font-bold">
                    {part.params.extrudeDepth ? `${part.params.extrudeDepth}mm` : part.params.height ? `${part.params.height}mm` : '1:1'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditInPartStudio(part.id, { featureSubtype: 'feature' });
                    }}
                    className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40 text-[8px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
                    title={t12(language, 'Edit Extrude in Part Studio', 'Ekstrüzyonu Parça Stüdyosunda düzenle')}
                  >
                    <Pencil size={8} />
                    <span>{t12(language, 'Edit', 'Düzenle')}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* 3. ✂️ SURFACE CUTS & POCKETS FEATURES */}
          {hasCuts && (
            <div className="space-y-0.5 pt-0.5 border-t border-white/5">
              <div className="text-[7.5px] font-bold text-rose-400 uppercase tracking-wider px-1">
                // {t12(language, 'CUTS / POCKETS', 'KESİMLER & HAVUZLAR')} ({part.cuts!.length})
              </div>
              {part.cuts!.map((cut) => {
                const isCutSel = selectedFeature?.type === 'cut' && selectedFeature.id === cut.id;
                return (
                  <div
                    key={cut.id}
                    className={`flex items-center justify-between p-1 rounded transition ${
                      isCutSel
                        ? 'bg-rose-500/25 text-rose-200 border border-rose-500/40'
                        : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <div
                      className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        onSelect(part.id);
                        onSelectFeature({ type: 'cut', id: cut.id, partId: part.id });
                      }}
                    >
                      <Scissors size={9} className="text-rose-400 shrink-0" />
                      <span className="font-bold truncate">
                        {cut.type === 'rect' ? 'Havuz' : cut.type === 'circle' ? 'Dairesel' : 'Slot'}
                      </span>
                      <span className="text-[7.5px] text-slate-400">
                        ({cut.face} · d={cut.depth}mm)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveCut(cut.id)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition"
                      title={t12(language, 'Delete Cut', 'Kesimi Sil')}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. 🔘 METRIC HOLES FEATURES */}
          {hasHoles && (
            <div className="space-y-0.5 pt-0.5 border-t border-white/5">
              <div className="text-[7.5px] font-bold text-amber-400 uppercase tracking-wider px-1">
                // {t12(language, 'HOLES & THREADS', 'DELİKLER & VİDALAR')} ({part.holes!.length})
              </div>
              {part.holes!.map((hole) => {
                const isHoleSel = selectedFeature?.type === 'hole' && selectedFeature.id === hole.id;
                return (
                  <div
                    key={hole.id}
                    className={`flex items-center justify-between p-1 rounded transition ${
                      isHoleSel
                        ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40'
                        : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <div
                      className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        onSelect(part.id);
                        onSelectFeature({ type: 'hole', id: hole.id, partId: part.id });
                      }}
                    >
                      <CircleDot size={9} className="text-amber-400 shrink-0" />
                      <span className="font-bold truncate">
                        {hole.size} {hole.type === 'counterbore' ? 'İmbus' : hole.type === 'tap' ? 'Kılavuz' : 'Geçme'}
                      </span>
                      <span className="text-[7.5px] text-slate-400">
                        ({hole.face} · ({hole.x},{hole.y}))
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveHole(hole.id)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition"
                      title={t12(language, 'Delete Hole', 'Deliği Sil')}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default AssemblyFeatureTree;
