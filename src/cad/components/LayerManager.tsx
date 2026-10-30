'use client';

/**
 * AluCAD layer manager (AutoCAD-style layer properties).
 *
 * Current layer, on/off, freeze/thaw, lock/unlock, colour (objects drawn in the layer
 * colour follow it), linetype (drawn on the canvas and exported), rename by double-click,
 * delete (its objects move to layer 0, undoable).
 */

import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, Lock, Unlock, Snowflake, Sun, Check } from 'lucide-react';
import { useCadStore } from '../store/cadStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { LINETYPE_NAMES, linetypeName, type LinetypeName } from '../kernel/layers';

const LINETYPE_LABEL: Record<LinetypeName, [string, string]> = {
  CONTINUOUS: ['Continuous', 'Sürekli'],
  DASHED: ['Dashed', 'Kesikli'],
  HIDDEN: ['Hidden', 'Gizli'],
  CENTER: ['Center', 'Eksen'],
  PHANTOM: ['Phantom', 'Hayali'],
};

const iconBtn =
  'p-1 rounded-md transition-colors hover:bg-[var(--bg-3)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--cyan)]';

export function LayerManager() {
  const language = useI18nStore((s) => s.language);
  const {
    layers, entities, activeLayerId, setActiveLayer, addLayer, removeLayer, updateLayer,
    toggleLayerVisibility, toggleLayerFreeze, toggleLayerLock, setLayerColor,
  } = useCadStore();
  const [newLayerName, setNewLayerName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const t = (en: string, tr: string) => t12(language, en, tr);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entities) m.set(e.layerId, (m.get(e.layerId) ?? 0) + 1);
    return m;
  }, [entities]);

  const uniqueName = (base: string, ignoreId?: string) => {
    const taken = new Set(layers.filter((l) => l.id !== ignoreId).map((l) => l.name.toLowerCase()));
    let name = base;
    let i = 2;
    while (taken.has(name.toLowerCase())) name = `${base} (${i++})`;
    return name;
  };

  const handleAddLayer = () => {
    const base = newLayerName.trim() || `${t('Layer', 'Katman')} ${layers.length}`;
    addLayer(uniqueName(base), '#00e5ff');
    setNewLayerName('');
  };

  const commitRename = () => {
    if (editingId) {
      const name = draftName.trim();
      const layer = layers.find((l) => l.id === editingId);
      if (name && layer && layer.name !== '0' && name !== layer.name) updateLayer(editingId, { name: uniqueName(name, editingId) });
    }
    setEditingId(null);
  };

  return (
    <div className="flex h-full w-full select-none flex-col text-[var(--ink)]">
      {/* header + new layer */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--bg-1)] p-2.5">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--alu-dim)]">
          {t('Layers', 'Katmanlar')}
        </span>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddLayer()}
            placeholder={t('New layer', 'Yeni katman')}
            aria-label={t('New layer', 'Yeni katman')}
            className="w-24 rounded-md border border-[var(--line)] bg-[var(--bg-0)] px-2 py-1 font-mono text-[11px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--cyan)]"
          />
          <button
            type="button"
            onClick={handleAddLayer}
            title={t('Add layer', 'Katman ekle')}
            aria-label={t('Add layer', 'Katman ekle')}
            className="rounded-md border border-[var(--line)] bg-[var(--bg-2)] p-1 text-[var(--cyan)] transition-colors hover:border-[var(--cyan)]"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* layer table */}
      <div className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto p-1.5" role="listbox" aria-label={t('Layers', 'Katmanlar')}>
        {layers.map((layer) => {
          const isCurrent = activeLayerId === layer.id;
          const shown = layer.visible !== false && !layer.frozen;
          const lt = linetypeName(layer.lineType);
          return (
            <div
              key={layer.id}
              role="option"
              aria-selected={isCurrent}
              onClick={() => !layer.frozen && setActiveLayer(layer.id)}
              className={`group flex items-center gap-1 rounded-md border px-1.5 py-1 text-xs transition-colors ${
                isCurrent
                  ? 'border-[var(--cyan)] bg-[var(--bg-2)]'
                  : 'border-transparent hover:bg-[var(--bg-2)]'
              }`}
            >
              <span className="flex w-4 justify-center text-[var(--cyan)]" title={isCurrent ? t('Current layer', 'Geçerli katman') : ''}>
                {isCurrent && <Check size={12} strokeWidth={3} />}
              </span>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                className={`${iconBtn} ${layer.visible !== false ? 'text-[var(--ink)]' : 'text-[var(--muted)]'}`}
                title={layer.visible !== false ? t('Hide layer', 'Katmanı gizle') : t('Show layer', 'Katmanı göster')}
                aria-pressed={layer.visible !== false}
              >
                {layer.visible !== false ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleLayerFreeze(layer.id); }}
                disabled={isCurrent}
                className={`${iconBtn} ${layer.frozen ? 'text-[var(--cyan)]' : 'text-[var(--alu-dim)]'} disabled:opacity-30`}
                title={layer.frozen ? t('Thaw layer', 'Katmanı çöz') : t('Freeze layer', 'Katmanı dondur')}
                aria-pressed={Boolean(layer.frozen)}
              >
                {layer.frozen ? <Snowflake size={13} /> : <Sun size={13} />}
              </button>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleLayerLock(layer.id); }}
                className={`${iconBtn} ${layer.locked ? 'text-[var(--warn)]' : 'text-[var(--alu-dim)]'}`}
                title={layer.locked ? t('Unlock layer', 'Katman kilidini aç') : t('Lock layer', 'Katmanı kilitle')}
                aria-pressed={Boolean(layer.locked)}
              >
                {layer.locked ? <Lock size={13} /> : <Unlock size={13} />}
              </button>

              <label
                className="relative flex cursor-pointer items-center p-1"
                title={t('Layer colour', 'Katman rengi')}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="h-3.5 w-3.5 rounded-full border border-[var(--line-strong)]" style={{ backgroundColor: layer.color }} />
                <input
                  type="color"
                  value={/^#[0-9a-f]{6}$/i.test(layer.color) ? layer.color : '#ffffff'}
                  onChange={(e) => setLayerColor(layer.id, e.target.value)}
                  className="absolute h-0 w-0 opacity-0"
                  aria-label={t('Layer colour', 'Katman rengi')}
                />
              </label>

              <div className="min-w-0 flex-1" onDoubleClick={(e) => {
                e.stopPropagation();
                if (layer.name === '0') return;
                setEditingId(layer.id);
                setDraftName(layer.name);
              }}>
                {editingId === layer.id ? (
                  <input
                    autoFocus
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={t('Layer name', 'Katman adı')}
                    className="w-full rounded border border-[var(--cyan)] bg-[var(--bg-0)] px-1 font-mono text-[11px] text-[var(--ink)] outline-none"
                  />
                ) : (
                  <span
                    className={`block truncate font-mono text-[11px] ${isCurrent ? 'font-bold' : ''} ${shown ? 'text-[var(--ink)]' : 'text-[var(--muted)]'}`}
                    title={layer.name === '0' ? layer.name : `${layer.name} — ${t('Rename (double-click)', 'Yeniden adlandır (çift tıkla)')}`}
                  >
                    {layer.name}
                    <span className="ml-1 text-[10px] font-normal text-[var(--muted)]">{counts.get(layer.id) ?? 0}</span>
                  </span>
                )}
              </div>

              <select
                value={lt}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updateLayer(layer.id, { lineType: e.target.value })}
                title={t('Linetype', 'Çizgi tipi')}
                aria-label={t('Linetype', 'Çizgi tipi')}
                className="w-[74px] rounded border border-[var(--line)] bg-[var(--bg-0)] px-0.5 py-0.5 text-[10px] text-[var(--alu-dim)] outline-none focus:border-[var(--cyan)]"
              >
                {LINETYPE_NAMES.map((n) => (
                  <option key={n} value={n}>{t(...LINETYPE_LABEL[n])}</option>
                ))}
              </select>

              {layer.id !== 'layer-0' ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                  className={`${iconBtn} text-[var(--muted)] opacity-0 hover:text-[var(--bad)] group-hover:opacity-100 focus-visible:opacity-100`}
                  title={t('Delete layer (objects move to layer 0)', 'Katmanı sil (nesneler 0 katmanına taşınır)')}
                  aria-label={t('Delete layer (objects move to layer 0)', 'Katmanı sil (nesneler 0 katmanına taşınır)')}
                >
                  <Trash2 size={12} />
                </button>
              ) : (
                <span className="w-[22px]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
