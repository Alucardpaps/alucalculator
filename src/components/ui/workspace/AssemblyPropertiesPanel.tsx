'use client';

import React from 'react';
import { useAssemblyStore } from '@/lib/store/assemblyStore';
import { Info, Plus, Trash2, Settings2, Hammer, Droplets, Target } from 'lucide-react';
import type { MachiningModifier, MachiningType } from '@/lib/types/v5-types';

export function AssemblyPropertiesPanel() {
  const selectedId = useAssemblyStore((s) => s.selectedId);
  const component = useAssemblyStore((s) => s.selectedId ? s.components[s.selectedId] : null);
  const { 
    updateMetadata, 
    addModifier, 
    removeModifier, 
    updateModifier,
    removeComponent 
  } = useAssemblyStore();

  if (!component || !selectedId) {
    return (
      <div className="flex flex-col h-full bg-transparent w-full">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">Properties</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-20 text-center select-none pointer-events-none">
          <Settings2 size={32} className="mb-4 text-slate-400" strokeWidth={1} />
          <p className="text-[10px] uppercase tracking-[0.2em] leading-relaxed">Select a 3D part<br />to edit specifications</p>
        </div>
      </div>
    );
  }

  const modifiers = component.modifiers || [];

  return (
    <div className="flex flex-col h-full bg-transparent w-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-1 h-3 bg-blue-500/50 rounded-full" />
          <span className="text-[10px] font-mono text-slate-200 uppercase tracking-[0.2em]">Part Specs</span>
        </div>
        <div className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
          <span className="text-[9px] text-blue-400 font-mono tracking-tighter uppercase">{component.type}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* === BASE PARAMETERS === */}
        <Section title="Base Parameters">
          {component.type === 'profile' && (
            <PropInput 
              label="Length (mm)" 
              value={component.metadata.length || 0} 
              onChange={(v) => updateMetadata(selectedId, { length: v })} 
            />
          )}
          <div className="flex items-center justify-between px-1 mt-2">
            <span className="text-[10px] text-slate-500">Material</span>
            <span className="text-[10px] font-mono text-slate-300">{component.metadata.material}</span>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-slate-500">Weight</span>
            <span className="text-[10px] font-mono text-slate-300">{component.metadata.weight} kg</span>
          </div>
        </Section>

        {/* === MACHINING MODIFIERS === */}
        <Section title="Machining operations">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button 
              onClick={() => addModifier(selectedId, 'HOLE')}
              className="px-2 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-mono uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Target size={12} /> + Hole
            </button>
            <button 
              onClick={() => addModifier(selectedId, 'THREADED')}
              className="px-2 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-mono uppercase tracking-widest hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Hammer size={12} /> + Thread
            </button>
            <button 
              onClick={() => addModifier(selectedId, 'SURFACE_MILLED')}
              className="px-2 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-mono uppercase tracking-widest hover:bg-purple-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Droplets size={12} /> + Mill
            </button>
            <button 
              onClick={() => addModifier(selectedId, 'WELDED')}
              className="px-2 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-mono uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Zap size={12} /> + Weld
            </button>
          </div>

          <div className="space-y-2">
            {modifiers.length === 0 ? (
                <p className="text-[9px] text-slate-600 italic text-center py-4">No machining operations applied</p>
            ) : modifiers.map((mod) => (
              <div key={mod.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{mod.type}</span>
                  <button onClick={() => removeModifier(selectedId, mod.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <PropInput label="X Offset" value={mod.x} onChange={(v) => updateModifier(selectedId, mod.id, { x: v })} small />
                  <PropInput label="Y Offset" value={mod.y} onChange={(v) => updateModifier(selectedId, mod.id, { y: v })} small />
                  {(mod.type === 'HOLE' || mod.type === 'THREADED') && (
                    <PropInput label="Diameter" value={mod.diameter || 8} onChange={(v) => updateModifier(selectedId, mod.id, { diameter: v })} small />
                  )}
                  <PropInput label="Depth" value={mod.depth || 10} onChange={(v) => updateModifier(selectedId, mod.id, { depth: v })} small />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* === ACTIONS === */}
        <Section title="Actions">
          <button 
            onClick={() => removeComponent(selectedId)}
            className="w-full px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500/20 transition-all"
          >
            Delete Component
          </button>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 border-b border-white/5">
      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-4">{title}</div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function PropInput({ label, value, onChange, small }: { label: string; value: number; onChange: (v: number) => void; small?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">{label}</label>
      <input 
        type="number" 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)} 
        className={`w-full bg-black/40 border border-white/10 rounded-lg ${small ? 'px-2 py-1.5' : 'px-3 py-2'} text-white text-[10px] font-mono focus:border-blue-500/50 outline-none transition-all`}
      />
    </div>
  );
}

import { Zap } from 'lucide-react';
