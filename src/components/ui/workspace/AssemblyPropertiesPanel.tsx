'use client';

import React from 'react';
import { useAssemblyStore } from '@/lib/store/assemblyStore';
import { 
  Info, 
  Plus, 
  Trash2, 
  Settings2, 
  Hammer, 
  Droplets, 
  Target, 
  Activity, 
  Zap,
  MousePointer,
  Square
} from 'lucide-react';
import type { MachiningModifier, MachiningType } from '@/lib/types/v5-types';
import { useBucklingAnalysis } from '@/hooks/engineering/useBucklingAnalysis';

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

  const [activeFace, setActiveFace] = React.useState<'top' | 'front' | 'side'>('top');
  const [activeTool, setActiveTool] = React.useState<'select' | 'HOLE' | 'THREADED' | 'RECT_CUT'>('select');
  const [selectedModId, setSelectedModId] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const svgRef = React.useRef<SVGSVGElement>(null);

  // Clear selections when selected component changes
  React.useEffect(() => {
    setSelectedModId(null);
    setActiveFace('top');
    setActiveTool('select');
  }, [selectedId]);

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

  const length = component.metadata.length ?? 200;
  const modifiers = component.modifiers || [];

  // Determine viewBox for SVG grid based on face and component dimensions
  let viewBox = `0 -8 ${length} 16`;
  if (activeFace === 'side') {
    viewBox = '-8 -8 16 16';
  }

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;

    // Check if clicked on a modifier element
    const target = e.target as SVGElement;
    const modId = target.getAttribute('data-mod-id');

    if (modId) {
      setSelectedModId(modId);
      if (activeTool === 'select') {
        setIsDragging(true);
        target.setPointerCapture(e.pointerId);
      }
      e.stopPropagation();
      return;
    }

    // Otherwise, if a placement tool is active, place a new modifier
    if (activeTool !== 'select') {
      const rect = svg.getBoundingClientRect();
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      
      if (svgP) {
        let newX = svgP.x;
        let newY = svgP.y;

        if (activeFace === 'side') {
          newX = Math.max(-8, Math.min(8, newX));
          newY = Math.max(-8, Math.min(8, newY));
        } else {
          newX = Math.max(0, Math.min(length, newX));
          newY = Math.max(-8, Math.min(8, newY));
        }

        newX = Math.round(newX);
        newY = Math.round(newY);

        addModifier(selectedId, activeTool, activeFace, newX, newY);
        setActiveTool('select'); // default back to select
      }
    } else {
      // Clicked on empty space -> deselect
      setSelectedModId(null);
    }
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || !selectedModId) return;

    const svg = svgRef.current;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    if (svgP) {
      let newX = svgP.x;
      let newY = svgP.y;

      if (activeFace === 'side') {
        newX = Math.max(-8, Math.min(8, newX));
        newY = Math.max(-8, Math.min(8, newY));
      } else {
        newX = Math.max(0, Math.min(length, newX));
        newY = Math.max(-8, Math.min(8, newY));
      }

      newX = Math.round(newX);
      newY = Math.round(newY);

      updateModifier(selectedId, selectedModId, { x: newX, y: newY });
    }
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDragging) {
      const target = e.target as SVGElement;
      try {
        target.releasePointerCapture(e.pointerId);
      } catch (err) {}
      setIsDragging(false);
    }
  };

  const selectedMod = modifiers.find((m) => m.id === selectedModId);

  return (
    <div className="flex flex-col h-full bg-transparent w-full overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-1 h-3 bg-[#00e5ff] rounded-full" />
          <span className="text-[10px] font-mono text-slate-200 uppercase tracking-[0.2em]">Part Specs</span>
        </div>
        <div className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
          <span className="text-[9px] text-[#00e5ff] font-mono tracking-tighter uppercase">{component.type}</span>
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
          {component.type === 'gear' && (
            <div className="grid grid-cols-2 gap-3 animate-slide-down">
              <PropInput 
                label="Module (m)" 
                value={component.metadata.module || 2} 
                onChange={(v) => updateMetadata(selectedId, { module: v })} 
                small
              />
              <PropInput 
                label="Teeth Count (N)" 
                value={component.metadata.teeth || 24} 
                onChange={(v) => updateMetadata(selectedId, { teeth: v })} 
                small
              />
              <div className="col-span-2">
                <PropInput 
                  label="Face Width (mm)" 
                  value={component.metadata.width || 20} 
                  onChange={(v) => updateMetadata(selectedId, { width: v })} 
                />
              </div>
            </div>
          )}
          {component.type === 'bearing' && (
            <div className="grid grid-cols-2 gap-3 animate-slide-down">
              <PropInput 
                label="Inner Dia (d) (mm)" 
                value={component.metadata.innerDia || 20} 
                onChange={(v) => updateMetadata(selectedId, { innerDia: v })} 
                small
              />
              <PropInput 
                label="Outer Dia (D) (mm)" 
                value={component.metadata.outerDia || 47} 
                onChange={(v) => updateMetadata(selectedId, { outerDia: v })} 
                small
              />
              <div className="col-span-2">
                <PropInput 
                  label="Width (B) (mm)" 
                  value={component.metadata.width || 14} 
                  onChange={(v) => updateMetadata(selectedId, { width: v })} 
                />
              </div>
            </div>
          )}
          {component.type === 'key' && (
            <div className="grid grid-cols-3 gap-2 animate-slide-down">
              <PropInput 
                label="Length (L)" 
                value={component.metadata.length || 20} 
                onChange={(v) => updateMetadata(selectedId, { length: v })} 
                small
              />
              <PropInput 
                label="Width (b)" 
                value={component.metadata.width || 6} 
                onChange={(v) => updateMetadata(selectedId, { width: v })} 
                small
              />
              <PropInput 
                label="Height (h)" 
                value={component.metadata.height || 6} 
                onChange={(v) => updateMetadata(selectedId, { height: v })} 
                small
              />
            </div>
          )}

          <div className="flex items-center justify-between px-1 mt-4 pt-2 border-t border-white/5">
            <span className="text-[10px] text-slate-500">Material</span>
            <span className="text-[10px] font-mono text-slate-300">{component.metadata.material}</span>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-slate-500">Weight</span>
            <span className="text-[10px] font-mono text-slate-300">{component.metadata.weight} kg</span>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-slate-500">Unit Cost</span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">${component.metadata.unitCost}</span>
          </div>
        </Section>

        {/* === ENGINEERING ANALYSIS === */}
        {component.type === 'profile' && (
          <AnalysisSection component={component} />
        )}

        {/* === 2D SKETCH BOARD === */}
        {component.type === 'profile' && (
          <Section title="Interactive Sketch & Cut">
            <div className="flex flex-col gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
              {/* Face Selection */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Active Face:</span>
                <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5">
                  {(['top', 'front', 'side'] as const).map((face) => (
                    <button
                      key={face}
                      onClick={() => {
                        setActiveFace(face);
                        setSelectedModId(null);
                      }}
                      className={`px-2 py-1 rounded text-[9px] font-mono uppercase tracking-widest transition-all ${
                        activeFace === face 
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold' 
                          : 'text-slate-400 border border-transparent hover:text-white'
                      }`}
                    >
                      {face}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tool Selection */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Sketch Tool:</span>
                <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5 gap-0.5">
                  <button
                    onClick={() => setActiveTool('select')}
                    className={`p-1.5 rounded transition-all flex items-center justify-center ${
                      activeTool === 'select'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 border border-transparent hover:text-white'
                    }`}
                    title="Select & Move Modifier"
                  >
                    <MousePointer size={12} />
                  </button>
                  <button
                    onClick={() => setActiveTool('HOLE')}
                    className={`p-1.5 rounded transition-all flex items-center justify-center ${
                      activeTool === 'HOLE'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 border border-transparent hover:text-white'
                    }`}
                    title="Drill Circular Hole"
                  >
                    <Target size={12} />
                  </button>
                  <button
                    onClick={() => setActiveTool('THREADED')}
                    className={`p-1.5 rounded transition-all flex items-center justify-center ${
                      activeTool === 'THREADED'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-slate-400 border border-transparent hover:text-white'
                    }`}
                    title="Add Threaded Tap"
                  >
                    <Hammer size={12} />
                  </button>
                  <button
                    onClick={() => setActiveTool('RECT_CUT')}
                    className={`p-1.5 rounded transition-all flex items-center justify-center ${
                      activeTool === 'RECT_CUT'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'text-slate-400 border border-transparent hover:text-white'
                    }`}
                    title="Mill Rectangular Pocket"
                  >
                    <Square size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* SVG Grid */}
            <div className="relative mt-3 select-none">
              <svg
                ref={svgRef}
                viewBox={viewBox}
                width="100%"
                height="100"
                className="bg-[#050811] border border-white/5 rounded-xl cursor-crosshair overflow-hidden touch-none"
                onPointerDown={handleSvgPointerDown}
                onPointerMove={handleSvgPointerMove}
                onPointerUp={handleSvgPointerUp}
              >
                <defs>
                  <pattern id="grid" width="20" height="4" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 4" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                  </pattern>
                </defs>

                {/* Grid Background */}
                <rect 
                  x={activeFace === 'side' ? -8 : 0} 
                  y={-8} 
                  width={activeFace === 'side' ? 16 : length} 
                  height={16} 
                  fill="url(#grid)" 
                />

                {/* Profile Outline */}
                <rect
                  x={activeFace === 'side' ? -8 : 0}
                  y={-8}
                  width={activeFace === 'side' ? 16 : length}
                  height={16}
                  fill="none"
                  stroke="#475569"
                  strokeWidth="0.5"
                />

                {/* Center Reference Line */}
                <line
                  x1={activeFace === 'side' ? -8 : 0}
                  y1={0}
                  x2={activeFace === 'side' ? 8 : length}
                  y2={0}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="0.5"
                  strokeDasharray="1,1"
                />

                {/* Modifier items on active face */}
                {modifiers
                  .filter((mod) => (mod.face || 'top') === activeFace)
                  .map((mod) => {
                    const isModSelected = mod.id === selectedModId;
                    const r = (mod.diameter || 8) / 2;

                    if (mod.type === 'HOLE' || mod.type === 'THREADED') {
                      return (
                        <circle
                          key={mod.id}
                          cx={mod.x}
                          cy={mod.y}
                          r={r}
                          data-mod-id={mod.id}
                          className="transition-all cursor-pointer"
                          fill={isModSelected ? 'rgba(0, 229, 255, 0.3)' : 'rgba(96, 165, 250, 0.1)'}
                          stroke={isModSelected ? '#00e5ff' : mod.type === 'THREADED' ? '#fbbf24' : '#60a5fa'}
                          strokeWidth="0.75"
                          strokeDasharray={mod.type === 'THREADED' ? '1,1' : undefined}
                        />
                      );
                    } else if (mod.type === 'RECT_CUT') {
                      const w = mod.width || 20;
                      const h = mod.height || 20;
                      return (
                        <rect
                          key={mod.id}
                          x={mod.x - w / 2}
                          y={mod.y - h / 2}
                          width={w}
                          height={h}
                          data-mod-id={mod.id}
                          className="transition-all cursor-pointer"
                          fill={isModSelected ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.1)'}
                          stroke={isModSelected ? '#00e5ff' : '#a855f7'}
                          strokeWidth="0.75"
                        />
                      );
                    }
                    return null;
                  })}
              </svg>
              {/* Ruler Labels */}
              <div className="flex justify-between text-[8px] font-mono text-slate-500 px-1 mt-1">
                <span>{activeFace === 'side' ? '-8mm' : '0mm'}</span>
                <span>{activeFace === 'side' ? '0mm' : `${length / 2}mm`}</span>
                <span>{activeFace === 'side' ? '8mm' : `${length}mm`}</span>
              </div>
            </div>
          </Section>
        )}

        {/* === SELECTED OPERATION PROPERTIES === */}
        {selectedMod && (
          <Section title="Selected Operation">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-blue-500/10 space-y-4 animate-slide-down">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    selectedMod.type === 'RECT_CUT' ? 'bg-purple-400' : selectedMod.type === 'THREADED' ? 'bg-amber-400' : 'bg-blue-400'
                  }`} />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                    {selectedMod.type === 'RECT_CUT' ? 'Pocket Cut' : selectedMod.type === 'THREADED' ? 'Threaded Tap' : 'Circular Hole'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    removeModifier(selectedId, selectedMod.id);
                    setSelectedModId(null);
                  }}
                  className="text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider bg-red-500/10 px-2 py-1 rounded"
                >
                  <Trash2 size={10} /> Delete
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <PropInput
                  label="X Position (mm)"
                  value={selectedMod.x}
                  onChange={(v) => updateModifier(selectedId, selectedMod.id, { x: v })}
                  small
                />
                <PropInput
                  label="Y Position (mm)"
                  value={selectedMod.y}
                  onChange={(v) => updateModifier(selectedId, selectedMod.id, { y: v })}
                  small
                />
                {(selectedMod.type === 'HOLE' || selectedMod.type === 'THREADED') && (
                  <PropInput
                    label="Diameter (mm)"
                    value={selectedMod.diameter || 8}
                    onChange={(v) => updateModifier(selectedId, selectedMod.id, { diameter: v })}
                    small
                  />
                )}
                {selectedMod.type === 'RECT_CUT' && (
                  <>
                    <PropInput
                      label="Width (mm)"
                      value={selectedMod.width || 20}
                      onChange={(v) => updateModifier(selectedId, selectedMod.id, { width: v })}
                      small
                    />
                    <PropInput
                      label="Height (mm)"
                      value={selectedMod.height || 20}
                      onChange={(v) => updateModifier(selectedId, selectedMod.id, { height: v })}
                      small
                    />
                  </>
                )}
                <PropInput
                  label="Depth (mm)"
                  value={selectedMod.depth || 10}
                  onChange={(v) => updateModifier(selectedId, selectedMod.id, { depth: v })}
                  small
                />
              </div>
            </div>
          </Section>
        )}

        {/* === MACHINING LIST (HISTORY) === */}
        {component.type === 'profile' && modifiers.length > 0 && (
          <Section title="Machining History">
            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
              {modifiers.map((mod) => {
                const isModSelected = mod.id === selectedModId;
                return (
                  <div
                    key={mod.id}
                    onClick={() => {
                      setSelectedModId(mod.id);
                      setActiveFace(mod.face || 'top');
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border transition-all ${
                      isModSelected
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-white/[0.01] border-transparent hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        mod.type === 'RECT_CUT' ? 'bg-purple-400' : mod.type === 'THREADED' ? 'bg-amber-400' : mod.type === 'HOLE' ? 'bg-blue-400' : 'bg-slate-400'
                      }`} />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-white font-mono uppercase tracking-wider">{mod.type}</span>
                        <span className="text-[8px] text-slate-500 font-mono">
                          Face: {mod.face || 'top'} • X: {mod.x}mm • Y: {mod.y}mm
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeModifier(selectedId, mod.id);
                        if (selectedModId === mod.id) setSelectedModId(null);
                      }}
                      className="text-slate-600 hover:text-red-400 p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* === CALCULATION RESULTS === */}
        {(component.metadata as any).calculationResult && (
          <Section title="Calculation Audit">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex flex-col gap-1.5">
              <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Verified Spec</span>
              <span className="text-xs font-mono text-white">{(component.metadata as any).calculationResult}</span>
            </div>
          </Section>
        )}

        {/* === ACTIONS === */}
        <Section title="Actions">
          <button 
            onClick={() => window.dispatchEvent(new Event('open-calculator-bridge'))}
            className="w-full px-4 py-3 bg-[#00e5ff]/10 border border-[#00e5ff]/30 rounded-xl text-[#00e5ff] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#00e5ff]/20 transition-all mb-2 cursor-pointer flex items-center justify-center gap-2 font-mono"
          >
            <Activity size={12} /> Run Calculation Check
          </button>

          <button 
            onClick={() => removeComponent(selectedId)}
            className="w-full px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500/20 transition-all cursor-pointer font-mono"
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
        className={`w-full bg-black/40 border border-white/10 rounded-lg ${small ? 'px-2 py-1.5' : 'px-3 py-2'} text-white text-[10px] font-mono focus:border-[#00e5ff]/50 outline-none transition-all`}
      />
    </div>
  );
}

function AnalysisSection({ component }: { component: any }) {
  const buckling = useBucklingAnalysis({
    length: component.metadata.length || 1000,
    area: 500, // Mock for demo
    inertia: 40000,
    elasticModulus: 69000, // Alu 6061-T6
    yieldStrength: 275
  });

  return (
    <Section title="Engineering Analysis">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-blue-500/20 pb-2">
          <Activity size={12} className="text-blue-400" />
          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold">Column Buckling</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase">Slenderness (λ)</span>
            <span className="text-[10px] font-mono text-slate-300">{buckling.slendernessRatio.toFixed(1)}</span>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-[9px] font-mono text-slate-500 uppercase">Buckling Mode</span>
            <span className="text-[10px] font-mono text-amber-400 font-bold">{buckling.mode}</span>
          </div>
          <div className="col-span-2 flex flex-col mt-1 pt-2 border-t border-blue-500/10">
            <span className="text-[9px] font-mono text-slate-500 uppercase">Critical Load (Pcr)</span>
            <span className="text-sm font-mono text-emerald-400 font-bold">{buckling.criticalLoadKg.toFixed(1)} kg</span>
          </div>
        </div>
      </div>
    </Section>
  );
}
