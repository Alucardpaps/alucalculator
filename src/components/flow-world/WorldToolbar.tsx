'use client';

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Move,
  Maximize2,
  Minimize2,
  Trash2,
  Cog,
  Zap,
  Box,
  Layers,
  Link,
  Volume2,
  VolumeX,
  Compass,
  Disc,
  Ship,
  Bot,
  Trash2 as TrashIcon,
  Cable,
  Sparkles,
  Globe,
} from 'lucide-react';
import { EditorTool, EngineeringMaterial } from './types';
import { ENGINEERING_MATERIALS } from './materials';

interface WorldToolbarProps {
  isPaused: boolean;
  isMotorRunning: boolean;
  groundSlopeDeg: number;
  terrainType: 'flat' | 'wavy' | 'hills';
  activeTool: EditorTool;
  currentMaterial: EngineeringMaterial;
  isMuted: boolean;
  gravityMode: 'earth' | 'moon' | 'zero';
  timeScale: number;
  windX: number;
  showDebug: boolean;
  quality: 'fast' | 'accurate';
  onTogglePlay: () => void;
  onToggleMotor: () => void;
  onChangeGroundSlope: (deg: number) => void;
  onChangeTerrainType: (t: 'flat' | 'wavy' | 'hills') => void;
  onStep: () => void;
  onReset: () => void;
  onClear: () => void;
  onToggleGravity: () => void;
  onSelectTool: (tool: EditorTool) => void;
  onSelectMaterial: (mat: EngineeringMaterial) => void;
  onToggleAudio: () => void;
  onResetCamera: () => void;
  onOpenChallenges: () => void;
  onSpawnPreset: (type: 'beam' | 'gear' | 'motor' | 'wheel' | 'boat' | 'robot_arm' | 'box' | 'circle' | 'anchor') => void;
  onChangeTimeScale: (scale: number) => void;
  onChangeWind: (wind: number) => void;
  onToggleDebug: () => void;
  onChangeQuality: (q: 'fast' | 'accurate') => void;
}

export const WorldToolbar: React.FC<WorldToolbarProps> = ({
  isPaused,
  isMotorRunning,
  groundSlopeDeg,
  terrainType,
  activeTool,
  currentMaterial,
  isMuted,
  gravityMode,
  timeScale,
  windX,
  showDebug,
  quality,
  onTogglePlay,
  onToggleMotor,
  onChangeGroundSlope,
  onChangeTerrainType,
  onStep,
  onReset,
  onClear,
  onToggleGravity,
  onSelectTool,
  onSelectMaterial,
  onToggleAudio,
  onResetCamera,
  onOpenChallenges,
  onSpawnPreset,
  onChangeTimeScale,
  onChangeWind,
  onToggleDebug,
  onChangeQuality,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-1)] border-b border-white/10 text-slate-200 select-none z-20 gap-2 flex-wrap">
      {/* 1. Simulation Playback Controls */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* A. ZAMANI BAŞLAT / DURDUR (Time Physics) */}
        <button
          onClick={onTogglePlay}
          title="Fizik simülasyonunu ve zaman akışını başlatır / duraklatır"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            isPaused
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-sm '
          }`}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
          <span>{isPaused ? 'ZAMANI BAŞLAT' : 'ZAMANI DURDUR'}</span>
        </button>

        {/* B. MOTORU ÇALIŞTIR / DURDUR (Motor Power Drive) */}
        <button
          onClick={onToggleMotor}
          title="Elektrik motoruna ve tahrik mekanizmalarına güç verir / keser"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            isMotorRunning
              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60 shadow-md animate-pulse'
              : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${isMotorRunning ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
          <span>{isMotorRunning ? 'MOTOR: AÇIK' : 'MOTOR: KAPALI'}</span>
        </button>

        {/* C. Frame Step */}
        <button
          onClick={onStep}
          disabled={!isPaused}
          title="Tek Adım İlerle (Frame Step)"
          className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 text-slate-300 cursor-pointer"
        >
          <StepForward className="w-4 h-4" />
        </button>

        {/* D. Reset Scene */}
        <button
          onClick={onReset}
          title="Sahneyi Sıfırla"
          className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* E. Clear All */}
        <button
          onClick={onClear}
          title="Tümünü Temizle (Boş Tuval)"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 text-rose-300 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Temizle</span>
        </button>

        {/* F. Gravity Toggle */}
        <button
          onClick={onToggleGravity}
          title="Yerçekimi Modu"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-purple-500/15 border border-purple-500/30 hover:bg-purple-500/25 text-purple-300 transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="font-mono text-[11px]">
            {gravityMode === 'earth' ? 'g: 9.81 m/s²' : gravityMode === 'moon' ? 'g: 1.62 m/s²' : 'g: 0'}
          </span>
        </button>

        <div className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono">
          <span className="text-slate-400">×t</span>
          {([0.25, 0.5, 1, 2] as const).map((s) => (
            <button
              key={s}
              onClick={() => onChangeTimeScale(s)}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                timeScale === s ? 'bg-cyan-500/30 text-cyan-200 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {s === 1 ? '1×' : `${s}×`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px]">
          <span className="text-slate-400 font-mono">Rüzgâr</span>
          <input
            type="range"
            min="-40"
            max="40"
            step="2"
            value={windX}
            onChange={(e) => onChangeWind(Number(e.target.value))}
            className="w-14 h-1.5 accent-[var(--cyan)] cursor-pointer"
            title={`Rüzgâr ${windX}`}
          />
          <span className="font-mono text-sky-300 w-6 text-right">{windX}</span>
        </div>

        <button
          onClick={onToggleDebug}
          title="Hız vektörleri, temas noktaları, kayma (D)"
          className={`px-2 py-1.5 rounded-lg text-[10px] font-mono border cursor-pointer ${
            showDebug
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-white/5 text-slate-400 border-white/10'
          }`}
        >
          DEBUG
        </button>

        <button
          onClick={() => onChangeQuality(quality === 'accurate' ? 'fast' : 'accurate')}
          title="Çözücü kalitesi: alt-adım + iterasyon"
          className="px-2 py-1.5 rounded-lg text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300 cursor-pointer"
        >
          {quality === 'accurate' ? 'HASAS' : 'HIZLI'}
        </button>

        {/* G. ZEMİN EĞİMİ & ARAZİ TİPİ (Slope & Terrain Contour) */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs">
          <span className="text-cyan-400 font-mono text-[11px] font-semibold whitespace-nowrap">📐 Eğim:</span>
          <input
            type="range"
            min="-30"
            max="30"
            step="1"
            value={groundSlopeDeg}
            onChange={(e) => onChangeGroundSlope(Number(e.target.value))}
            className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
            title={`Zemin Eğimi: ${groundSlopeDeg}°`}
          />
          <span className="font-mono text-[11px] w-8 text-right font-bold text-slate-200">
            {groundSlopeDeg > 0 ? `+${groundSlopeDeg}°` : `${groundSlopeDeg}°`}
          </span>

          <div className="h-3.5 w-px bg-white/10 mx-0.5" />

          {/* Terrain Contour Modes: Düz, Dalgalı, Tepeli */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onChangeTerrainType('flat')}
              title="Düz Zemin"
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                terrainType === 'flat'
                  ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Düz
            </button>
            <button
              onClick={() => onChangeTerrainType('wavy')}
              title="Dalgalı Zemin (Doğal Yol / Tümsekler)"
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                terrainType === 'wavy'
                  ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              〰️ Dalgalı
            </button>
            <button
              onClick={() => onChangeTerrainType('hills')}
              title="Tepeli / Dağlık Arazi"
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                terrainType === 'hills'
                  ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⛰️ Tepeli
            </button>
          </div>
        </div>

        <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

        {/* Preset Challenges */}
        <button
          onClick={onOpenChallenges}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-all cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>ŞABLONLAR</span>
        </button>
      </div>

      {/* 2. Interactive Tools Palette */}
      <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-[55vw]">
        <button
          onClick={() => onSelectTool('drag')}
          title="Çek & Fırlat (Kuvvet Uygula / Taşı)"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all ${
            activeTool === 'drag' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold shadow-lg ' : 'text-slate-300 hover:bg-white/10'
          }`}
        >
          <Move className="w-3.5 h-3.5" />
          <span>Taşı/Fırlat</span>
        </button>

        <button
          onClick={() => onSpawnPreset('wheel')}
          title="Yuvarlak Lastik Tekerlek Ekle (Kauçuk & Alaşım Jant)"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-300 hover:bg-white/10"
        >
          <Disc className="w-3.5 h-3.5 text-emerald-400" />
          <span>+ Tekerlek</span>
        </button>

        <button
          onClick={() => onSpawnPreset('gear')}
          title="Dişli Çark Ekle (Evolvent Profil)"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-300 hover:bg-white/10"
        >
          <Cog className="w-3.5 h-3.5 text-amber-400" />
          <span>+ Dişli</span>
        </button>

        <button
          onClick={() => onSpawnPreset('motor')}
          title="Elektrik Motoru Ekle (RPM & Tork)"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-300 hover:bg-white/10"
        >
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span>+ Motor</span>
        </button>

        <button
          onClick={() => onSpawnPreset('robot_arm')}
          title="Robot Kolu & Servo Mafsal Parçası Ekle"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-300 hover:bg-white/10"
        >
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          <span>+ Robot Kolu</span>
        </button>

        <button
          onClick={() => onSpawnPreset('boat')}
          title="Hidrodinamik Tekne Gövdesi Ekle (Archimedes Yüzer Blok)"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-300 hover:bg-white/10"
        >
          <Ship className="w-3.5 h-3.5 text-sky-400" />
          <span>+ Tekne</span>
        </button>

        <button
          onClick={() => onSpawnPreset('beam')}
          title="Alüminyum Mukavemet Kirişi Ekle"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-300 hover:bg-white/10"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>+ Kiriş</span>
        </button>

        <button
          onClick={() => onSpawnPreset('box')}
          title="Ağır Yük Bloğu Ekle"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-300 hover:bg-white/10"
        >
          <Box className="w-3.5 h-3.5 text-blue-400" />
          <span>+ Yük</span>
        </button>

        <button
          onClick={() => onSelectTool('joint_pin')}
          title="Dönen Pim Mafsalı (Revolute Pin)"
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
            activeTool === 'joint_pin' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold' : 'text-slate-300 hover:bg-white/10'
          }`}
        >
          <Link className="w-3.5 h-3.5 text-amber-400" />
          <span>Pim</span>
        </button>

        <button
          onClick={() => onSelectTool('joint_weld')}
          title="Rijit Kaynak Bağlantısı (Weld)"
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
            activeTool === 'joint_weld' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold' : 'text-slate-300 hover:bg-white/10'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Kaynak</span>
        </button>

        <button
          onClick={() => onSelectTool('joint_cable')}
          title="Çelik Halat (Cable)"
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
            activeTool === 'joint_cable' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold' : 'text-slate-300 hover:bg-white/10'
          }`}
        >
          <Cable className="w-3.5 h-3.5 text-blue-400" />
          <span>Halat</span>
        </button>

        <button
          onClick={() => onSelectTool('erase')}
          title="Eleman Silme Aracı"
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
            activeTool === 'erase' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold' : 'text-slate-300 hover:bg-white/10'
          }`}
        >
          <TrashIcon className="w-3.5 h-3.5 text-rose-400" />
          <span>Sil</span>
        </button>
      </div>

      {/* 3. Material Selector & Audio / Camera */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-400 font-mono">Alaşım:</span>
          <select
            value={currentMaterial.id}
            onChange={(e) => onSelectMaterial(ENGINEERING_MATERIALS[e.target.value])}
            className="bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-xs text-cyan-300 font-medium focus:outline-none focus:border-cyan-500"
          >
            {Object.values(ENGINEERING_MATERIALS).map((m) => (
              <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onToggleAudio}
          title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
          className={`p-1.5 rounded-lg border text-xs transition-all ${
            isMuted ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-cyan-400'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onResetCamera}
          title="Kamerayı Merkeze Al"
          className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
