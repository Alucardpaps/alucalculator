'use client';

import React, { useState } from 'react';
import { useCadStore } from '../store/cadStore';
import { Plus, Trash2, Eye, EyeOff, Check } from 'lucide-react';

export function LayerManager() {
  const { layers, activeLayerId, setActiveLayer, addLayer, removeLayer, toggleLayerVisibility, setLayerColor } = useCadStore();
  const [newLayerName, setNewLayerName] = useState('');

  const handleAddLayer = () => {
    if (!newLayerName.trim()) return;
    addLayer(newLayerName.trim(), '#00e5ff');
    setNewLayerName('');
  };

  return (
    <div className="flex flex-col h-full bg-transparent w-full text-slate-300 font-sans select-none">
      {/* Header & Add Layer */}
      <div className="p-3 border-b border-white/5 flex items-center justify-between gap-2 bg-white/[0.02]">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">Layers</span>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            className="bg-black/50 text-[11px] text-white px-2 py-1 rounded-lg w-24 border border-white/10 outline-none focus:border-cyan-500/50 font-mono placeholder:text-slate-600"
            placeholder="New Layer"
            onKeyDown={(e) => e.key === 'Enter' && handleAddLayer()}
          />
          <button
            type="button"
            onClick={handleAddLayer}
            className="p-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 transition-all active:scale-95"
            title="Add Layer"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs group cursor-pointer transition-all ${
              activeLayerId === layer.id
                ? 'bg-blue-600/20 border border-blue-500/30 text-white shadow-sm'
                : 'hover:bg-white/5 text-slate-400 border border-transparent'
            }`}
            onClick={() => setActiveLayer(layer.id)}
          >
            {/* Active Checkmark */}
            <div className="w-3.5 flex justify-center text-cyan-400">
              {activeLayerId === layer.id && <Check size={12} strokeWidth={3} />}
            </div>

            {/* Visibility Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleLayerVisibility(layer.id);
              }}
              className={`p-1 rounded-lg hover:bg-white/10 transition-colors ${
                layer.visible ? 'text-cyan-400' : 'text-slate-600'
              }`}
              title={layer.visible ? 'Hide Layer' : 'Show Layer'}
            >
              {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>

            {/* Color Circle Picker */}
            <div className="relative flex items-center">
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/20 cursor-pointer shadow-sm transition-transform hover:scale-110"
                style={{ backgroundColor: layer.color }}
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById(`color-picker-${layer.id}`)?.click();
                }}
              />
              <input
                id={`color-picker-${layer.id}`}
                type="color"
                value={layer.color}
                onChange={(e) => setLayerColor(layer.id, e.target.value)}
                className="absolute opacity-0 w-0 h-0"
              />
            </div>

            {/* Layer Name */}
            <span className={`flex-1 truncate font-mono text-[11px] ${activeLayerId === layer.id ? 'text-white font-bold' : 'text-slate-300'}`}>
              {layer.name}
            </span>

            {/* Delete Layer (prevent default layer-0) */}
            {layer.id !== 'layer-0' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeLayer(layer.id);
                }}
                className="p-1 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete Layer"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
