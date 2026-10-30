'use client';

import React from 'react';
import { PhysicsBody, TelemetryData } from './types';
import { ENGINEERING_MATERIALS } from './materials';
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  Gauge,
  Trash2,
  Anchor,
  Cpu,
  Zap,
  RotateCw,
  Move,
  Disc,
  Ship,
  Bot,
  Sliders,
} from 'lucide-react';

interface TelemetryPanelProps {
  telemetry: TelemetryData;
  selectedBody: PhysicsBody | null;
  allBodies?: PhysicsBody[];
  onUpdateBody: (updated: PhysicsBody) => void;
  onDeleteBody: (id: string) => void;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  telemetry,
  selectedBody,
  allBodies = [],
  onUpdateBody,
  onDeleteBody,
}) => {
  const getFosColor = (fos: number) => {
    if (fos >= 2.0) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (fos >= 1.2) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/20 animate-pulse';
  };

  const calculatedPowerKw =
    selectedBody?.isMotor && selectedBody.motorRpm && selectedBody.motorTorque
      ? ((selectedBody.motorTorque * 2 * Math.PI * selectedBody.motorRpm) / 60000).toFixed(2)
      : '0.00';

  return (
    <div className="w-84 h-full bg-[var(--bg-1)]/95 border-l border-white/10 flex flex-col justify-between p-3.5 text-xs text-slate-300 select-none overflow-y-auto z-20">
      {/* 1. Real-Time Telemetry Gauges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold tracking-wide">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>CANLI MÜHENDİSLİK TELEMETRİSİ</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
            {telemetry.fps} FPS
          </span>
        </div>

        {/* Factor of Safety (FoS) Card */}
        <div className={`p-3 rounded-xl border ${getFosColor(telemetry.minSafetyFactor)} transition-all`}>
          <div className="flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1">
              {telemetry.minSafetyFactor >= 1.2 ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              GÜVENLİK KATSAYISI (FoS)
            </span>
            <span className="text-base font-bold font-mono">
              {telemetry.minSafetyFactor >= 10 ? '10.0+' : telemetry.minSafetyFactor.toFixed(2)}
            </span>
          </div>
          <p className="text-[10px] opacity-80 mt-1">
            {telemetry.minSafetyFactor >= 1.5
              ? 'Standartlara uygun. Yapı stabil ve emniyetli.'
              : telemetry.minSafetyFactor >= 1.0
              ? 'Uyarı: Plastik deformasyon sınırına yakın!'
              : 'TEHLİKE: Yapısal akma/kırılma riski! (FoS < 1.0)'}
          </p>
        </div>

        {/* Max Stress Gauge */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              Maksimum Von Mises Gerilmesi:
            </span>
            <span className="font-mono font-bold text-cyan-300">{telemetry.maxStressMpa} MPa</span>
          </div>
          <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${
                telemetry.maxStressMpa > 250 ? 'bg-rose-500' : telemetry.maxStressMpa > 150 ? 'bg-amber-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, (telemetry.maxStressMpa / 400) * 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Kinetik Enerji</div>
            <div className="text-xs font-bold font-mono text-emerald-400">{telemetry.totalKineticEnergy} J</div>
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Potansiyel</div>
            <div className="text-xs font-bold font-mono text-sky-300">{telemetry.totalPotentialEnergy ?? 0} J</div>
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Temas</div>
            <div className="text-xs font-bold font-mono text-fuchsia-300">{telemetry.contactCount ?? 0}</div>
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Motor Gücü</div>
            <div className="text-xs font-bold font-mono text-amber-300">{telemetry.motorPowerKw ?? 0} kW</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
          <div>Kayma: {telemetry.maxSlip ?? 0} px/s</div>
          <div>Kopan mafsal: {telemetry.snappedJoints ?? 0}</div>
          <div>Gövde: {telemetry.bodyCount}</div>
          <div>Zaman: {telemetry.timeScale ?? 1}×</div>
        </div>
      </div>

      {/* 2. Selected Element Inspector & Powertrain Tuning */}
      <div className="pt-3 border-t border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Cpu className="w-3.5 h-3.5" />
            <span>ELEMAN &amp; MOTOR DENETLEYİCİSİ</span>
          </div>
          {selectedBody && (
            <button
              onClick={() => onDeleteBody(selectedBody.id)}
              className="px-2 py-0.5 text-[10px] text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded transition-colors flex items-center gap-1 cursor-pointer"
              title="Elemanı Sahneden Kaldır"
            >
              <Trash2 className="w-3 h-3" />
              <span>Sil</span>
            </button>
          )}
        </div>

        {selectedBody ? (
          <div className="space-y-3 bg-slate-900/60 p-3 rounded-xl border border-white/10 max-h-[48vh] overflow-y-auto">
            {/* Header info */}
            <div>
              <div className="font-semibold text-white text-xs">{selectedBody.name}</div>
              <div className="text-[10px] text-cyan-400 font-mono uppercase">
                {selectedBody.type} • ID: {selectedBody.id.slice(0, 10)}
              </div>
            </div>

            {/* ─── MOTOR & POWERTRAIN TUNING (YAKLAŞIP GÜÇ VERME) ─── */}
            {(selectedBody.type === 'gear' || selectedBody.isMotor || selectedBody.type === 'wheel') && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between text-amber-300 font-bold text-[11px]">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>MOTOR &amp; GÜÇ AKTARIMI</span>
                  </span>
                  <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!selectedBody.isMotor}
                      onChange={(e) =>
                        onUpdateBody({
                          ...selectedBody,
                          isMotor: e.target.checked,
                          motorRpm: selectedBody.motorRpm || 300,
                          motorTorque: selectedBody.motorTorque || 400,
                        })
                      }
                      className="accent-[var(--cyan)]"
                    />
                    <span>Motor Sürücüsü</span>
                  </label>
                </div>

                {selectedBody.isMotor && (
                  <div className="space-y-2 pt-1 border-t border-amber-500/20 text-[10px]">
                    {/* RPM Slider */}
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-slate-300">Motor Devri (RPM):</span>
                        <span className="font-mono font-bold text-amber-400">{selectedBody.motorRpm || 0} RPM</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1200"
                        step="20"
                        value={selectedBody.motorRpm || 0}
                        onChange={(e) =>
                          onUpdateBody({
                            ...selectedBody,
                            motorRpm: Number(e.target.value),
                          })
                        }
                        className="w-full accent-[var(--cyan)] cursor-pointer"
                      />
                    </div>

                    {/* Torque Slider */}
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-slate-300">Motor Torku (N·m):</span>
                        <span className="font-mono font-bold text-amber-400">{selectedBody.motorTorque || 0} N·m</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="1200"
                        step="20"
                        value={selectedBody.motorTorque || 20}
                        onChange={(e) =>
                          onUpdateBody({
                            ...selectedBody,
                            motorTorque: Number(e.target.value),
                          })
                        }
                        className="w-full accent-[var(--cyan)] cursor-pointer"
                      />
                    </div>

                    {/* Calculated Power */}
                    <div className="flex justify-between items-center px-2 py-1 bg-black/40 rounded border border-amber-500/30">
                      <span className="text-slate-300">Hesaplanan Güç:</span>
                      <span className="font-mono font-bold text-emerald-400">{calculatedPowerKw} kW</span>
                    </div>
                  </div>
                )}

                {/* Axle Coupling Dropdown */}
                <div className="pt-1 text-[10px]">
                  <span className="text-slate-400 block mb-0.5">Aks / Şaft Bağlantısı (Tork Aktarımı):</span>
                  <select
                    value={selectedBody.axleConnectedBodyId || ''}
                    onChange={(e) =>
                      onUpdateBody({
                        ...selectedBody,
                        axleConnectedBodyId: e.target.value || undefined,
                      })
                    }
                    className="w-full bg-black/60 border border-white/15 rounded px-1.5 py-1 text-xs text-amber-300"
                  >
                    <option value="">Bağlantı Yok</option>
                    {allBodies
                      .filter((b) => b.id !== selectedBody.id)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.type})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {/* ─── WHEEL SPECIFICS ─── */}
            {selectedBody.type === 'wheel' && (
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-1.5 text-[10px]">
                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Disc className="w-3.5 h-3.5" />
                  <span>YUVARLAK LASTİK TEKERLEK AYARLARI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Yarıçap (Radius):</span>
                  <span className="font-mono font-bold text-emerald-400">{selectedBody.radius || 24} px</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="60"
                  step="2"
                  value={selectedBody.radius || 24}
                  onChange={(e) =>
                    onUpdateBody({
                      ...selectedBody,
                      radius: Number(e.target.value),
                    })
                  }
                  className="w-full accent-[var(--cyan)] cursor-pointer"
                />

                <div className="flex justify-between">
                  <span className="text-slate-300">Yol Tutuşu / Sürtünme (μ):</span>
                  <span className="font-mono font-bold text-emerald-400">{selectedBody.friction?.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.05"
                  value={selectedBody.friction || 0.8}
                  onChange={(e) =>
                    onUpdateBody({
                      ...selectedBody,
                      friction: Number(e.target.value),
                    })
                  }
                  className="w-full accent-[var(--cyan)] cursor-pointer"
                />
              </div>
            )}

            {/* ─── ROBOT ARM / SERVO SPECIFICS ─── */}
            {(selectedBody.isServo || selectedBody.type === 'beam') && (
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 space-y-1.5 text-[10px]">
                <div className="flex items-center justify-between text-purple-300 font-bold">
                  <span className="flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" />
                    <span>ROBOTİK SERVO MAFSAL</span>
                  </span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!selectedBody.isServo}
                      onChange={(e) =>
                        onUpdateBody({
                          ...selectedBody,
                          isServo: e.target.checked,
                          servoTargetAngle: selectedBody.servoTargetAngle || 0,
                        })
                      }
                      className="accent-[var(--cyan)]"
                    />
                    <span>Servo Aktif</span>
                  </label>
                </div>

                {selectedBody.isServo && (
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate-300">Hedef Açı:</span>
                      <span className="font-mono font-bold text-purple-400">
                        {(((selectedBody.servoTargetAngle || 0) * 180) / Math.PI).toFixed(0)}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-3.14"
                      max="3.14"
                      step="0.05"
                      value={selectedBody.servoTargetAngle || 0}
                      onChange={(e) =>
                        onUpdateBody({
                          ...selectedBody,
                          servoTargetAngle: Number(e.target.value),
                        })
                      }
                      className="w-full accent-[var(--cyan)] cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ─── BOAT HYDRODYNAMICS SPECIFICS ─── */}
            {selectedBody.type === 'boat' && (
              <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 space-y-1.5 text-[10px]">
                <div className="flex items-center gap-1 text-sky-300 font-bold">
                  <Ship className="w-3.5 h-3.5" />
                  <span>TEKNE HİDRODİNAMİĞİ &amp; PERVANE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Pervane İtiş Gücü:</span>
                  <span className="font-mono font-bold text-sky-400">{selectedBody.thrustPower || 0} N</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1200"
                  step="50"
                  value={selectedBody.thrustPower || 0}
                  onChange={(e) =>
                    onUpdateBody({
                      ...selectedBody,
                      thrustPower: Number(e.target.value),
                    })
                  }
                  className="w-full accent-[var(--cyan)] cursor-pointer"
                />
              </div>
            )}

            {/* ─── POSITION & TAŞIMA KONTROLLERİ ─── */}
            <div className="space-y-1.5 text-[10px]">
              <div className="text-slate-400 flex items-center gap-1">
                <Move className="w-3 h-3 text-cyan-400" />
                <span>Konum &amp; Taşıma:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">X:</span>
                  <input
                    type="number"
                    value={Math.round(selectedBody.x)}
                    onChange={(e) =>
                      onUpdateBody({
                        ...selectedBody,
                        x: Number(e.target.value),
                      })
                    }
                    className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white"
                  />
                </div>
                <div>
                  <span className="text-slate-500">Y:</span>
                  <input
                    type="number"
                    value={Math.round(selectedBody.y)}
                    onChange={(e) =>
                      onUpdateBody({
                        ...selectedBody,
                        y: Number(e.target.value),
                      })
                    }
                    className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* ─── MASS & MATERIAL ─── */}
            <div className="space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Kütle (kg):</span>
                <span className="font-mono font-bold text-white">{selectedBody.mass} kg</span>
              </div>
              <input
                type="range"
                min="5"
                max="3000"
                step="5"
                value={selectedBody.mass}
                onChange={(e) =>
                  onUpdateBody({
                    ...selectedBody,
                    mass: Number(e.target.value),
                  })
                }
                className="w-full accent-[var(--cyan)] cursor-pointer"
              />

              <label className="text-slate-400 block pt-1">Alaşım / Malzeme:</label>
              <select
                value={selectedBody.material.id}
                onChange={(e) => {
                  const newMat = ENGINEERING_MATERIALS[e.target.value];
                  if (newMat) {
                    onUpdateBody({
                      ...selectedBody,
                      material: newMat,
                    });
                  }
                }}
                className="w-full bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-xs text-cyan-300"
              >
                {Object.values(ENGINEERING_MATERIALS).map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Static Anchor Button */}
            <button
              onClick={() => {
                onUpdateBody({
                  ...selectedBody,
                  isStatic: !selectedBody.isStatic,
                });
              }}
              className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                selectedBody.isStatic
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <Anchor className="w-3.5 h-3.5" />
              <span>{selectedBody.isStatic ? 'Sabitlenmiş Destek' : 'Serbest Hareketli Cisim'}</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-black/30 border border-dashed border-white/10 text-center text-slate-500 text-[11px]">
            Sahnedeki arabaya, dişliye, motora, robota veya tekneye tıklayarak devir, tork, güç ve konum ayarlarını yapın.
          </div>
        )}
      </div>
    </div>
  );
};

export default TelemetryPanel;
