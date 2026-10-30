'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Wrench,
  Ruler,
  ArrowLeftRight,
  Flashlight,
  Timer,
  ExternalLink,
  RotateCcw,
  Check,
  Battery,
  Wifi,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { APP_RELEASE_NAME } from '@/config/app';

// Standard VDI 2230 metric bolt torque lookup table
const QUICK_TORQUES: Record<string, { grade88: number; grade109: number; grade129: number; tap: number }> = {
  M4: { grade88: 3.0, grade109: 4.4, grade129: 5.1, tap: 3.3 },
  M5: { grade88: 5.9, grade109: 8.7, grade129: 10.0, tap: 4.2 },
  M6: { grade88: 10.1, grade109: 14.9, grade129: 17.4, tap: 5.0 },
  M8: { grade88: 24.6, grade109: 36.1, grade129: 42.2, tap: 6.8 },
  M10: { grade88: 48.0, grade109: 71.0, grade129: 83.0, tap: 8.5 },
  M12: { grade88: 84.0, grade109: 123.0, grade129: 144.0, tap: 10.2 },
  M14: { grade88: 133.0, grade109: 195.0, grade129: 229.0, tap: 12.0 },
  M16: { grade88: 206.0, grade109: 302.0, grade129: 354.0, tap: 14.0 },
  M20: { grade88: 415.0, grade109: 608.0, grade129: 711.0, tap: 17.5 },
  M24: { grade88: 714.0, grade109: 1050.0, grade129: 1228.0, tap: 21.0 },
  M30: { grade88: 1428.0, grade109: 2100.0, grade129: 2457.0, tap: 26.5 },
};

export function FieldHomeScreenWidget({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const { language } = useI18nStore();
  const [activeTab, setActiveTab] = useState<'level' | 'torque' | 'converter' | 'tools'>('level');

  // 1. Gyro Spirit Level state
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [tarePitch, setTarePitch] = useState(0);
  const [tareRoll, setTareRoll] = useState(0);
  const [isGyroActive, setIsGyroActive] = useState(false);

  // 2. Quick Torque state
  const [boltSize, setBoltSize] = useState('M10');
  const [boltGrade, setBoltGrade] = useState<'88' | '109' | '129'>('88');

  // 3. Quick Unit Converter state
  const [convVal, setConvVal] = useState(25.4);
  const [convMode, setConvMode] = useState<'mm_in' | 'bar_psi' | 'nm_lbft'>('mm_in');

  // 4. Hardware status
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Haptic feedback trigger
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch {}
    }
  };

  useEffect(() => {
    // Battery
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((batt: any) => {
        setBatteryLevel(Math.round(batt.level * 100));
        batt.addEventListener('levelchange', () => setBatteryLevel(Math.round(batt.level * 100)));
      }).catch(() => {});
    }

    // Gyro
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta !== null && e.gamma !== null) {
        setPitch(Math.round(e.beta));
        setRoll(Math.round(e.gamma));
        setIsGyroActive(true);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  const effectivePitch = pitch - tarePitch;
  const effectiveRoll = roll - tareRoll;
  const isLevel = Math.abs(effectivePitch) <= 0.5 && Math.abs(effectiveRoll) <= 0.5;

  const toggleTorch = async () => {
    triggerHaptic();
    try {
      if (torchOn) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        setTorchOn(false);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        const imageCapture = (track as any).applyConstraints ? track : null;
        if (imageCapture) {
          await (track as any).applyConstraints({ advanced: [{ torch: true }] });
        }
        setTorchOn(true);
      }
    } catch {
      setTorchOn((prev) => !prev);
    }
  };

  const curBolt = QUICK_TORQUES[boltSize] || QUICK_TORQUES.M10;
  const targetTorque =
    boltGrade === '88' ? curBolt.grade88 : boltGrade === '109' ? curBolt.grade109 : curBolt.grade129;

  return (
    <div
      className={`w-full max-w-md mx-auto rounded-xl border border-slate-700 bg-[var(--bg-0)] text-white font-mono shadow-2xl overflow-hidden ${
        isEmbedded ? 'p-3' : 'p-4'
      }`}
    >
      {/* Widget Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider text-cyan-400 uppercase">
            AluCalc OS · Widget
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          {batteryLevel !== null && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Battery size={11} /> {batteryLevel}%
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              useI18nStore.getState().setLanguage(language === 'tr' ? 'en' : 'tr');
            }}
            className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-slate-800 text-cyan-400 font-bold uppercase hover:border-cyan-400"
            title="Toggle Language"
          >
            {language === 'tr' ? 'TR' : 'EN'}
          </button>
          <Link
            href="/field"
            onClick={triggerHaptic}
            className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-[var(--bg-2)] border border-slate-800 text-white hover:text-cyan-400"
          >
            <span>{t12(language, 'App', 'Uygulama')}</span>
            <ExternalLink size={10} />
          </Link>
        </div>
      </div>

      {/* Quick Nav Chips */}
      <div className="grid grid-cols-4 gap-1 mb-3">
        {[
          { id: 'level', labelEn: 'Level', labelTr: 'Terazi', icon: Smartphone },
          { id: 'torque', labelEn: 'Torque', labelTr: 'Tork', icon: Wrench },
          { id: 'converter', labelEn: 'Units', labelTr: 'Birim', icon: ArrowLeftRight },
          { id: 'tools', labelEn: 'Quick', labelTr: 'Hızlı', icon: Sparkles },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                triggerHaptic();
                setActiveTab(t.id as any);
              }}
              className={`py-2 px-1 rounded-md border flex flex-col items-center justify-center gap-1 text-[10px] transition ${
                active
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold border-cyan-400'
                  : 'bg-[var(--bg-1)] text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span>{t12(language, t.labelEn, t.labelTr)}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: SPIRIT LEVEL WIDGET ─── */}
      {activeTab === 'level' && (
        <div className="space-y-2.5">
          <div className="relative w-28 h-28 mx-auto rounded-full border-2 border-slate-700 bg-[var(--bg-1)] flex items-center justify-center overflow-hidden shadow-inner">
            {/* Crosshairs */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[var(--line)]" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-[var(--line)]" />
            {/* Center target circle */}
            <div
              className={`w-8 h-8 rounded-full border ${
                isLevel ? 'border-emerald-400 bg-emerald-500/10' : 'border-slate-800'
              }`}
            />

            {/* Bubble */}
            <div
              className={`absolute w-6 h-6 rounded-full shadow-lg transition-transform duration-75 flex items-center justify-center ${
                isLevel
                  ? 'bg-emerald-400 text-black'
                  : 'bg-cyan-400 text-black'
              }`}
              style={{
                transform: `translate(${Math.max(-42, Math.min(42, effectiveRoll * 2.2))}px, ${Math.max(
                  -42,
                  Math.min(42, effectivePitch * 2.2)
                )}px)`,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white opacity-85" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-1.5 rounded-md bg-[var(--bg-1)] border border-slate-800">
              <span className="text-[9px] text-slate-400 block">PITCH (X)</span>
              <span className="text-sm font-bold text-cyan-400">
                {effectivePitch > 0 ? `+${effectivePitch}` : effectivePitch}°
              </span>
            </div>
            <div className="p-1.5 rounded-md bg-[var(--bg-1)] border border-slate-800">
              <span className="text-[9px] text-slate-400 block">ROLL (Y)</span>
              <span className="text-sm font-bold text-cyan-400">
                {effectiveRoll > 0 ? `+${effectiveRoll}` : effectiveRoll}°
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setTarePitch(pitch);
                setTareRoll(roll);
              }}
              className="flex-1 h-9 rounded-md bg-[var(--bg-2)] border border-slate-800 text-xs text-white flex items-center justify-center gap-1.5 active:scale-98 font-bold"
            >
              <RotateCcw size={12} />
              <span>{t12(language, 'Tare / Zero', 'Sıfırla / Dara')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setTarePitch(0);
                setTareRoll(0);
              }}
              className="px-3 h-9 rounded-md bg-[var(--bg-2)] border border-slate-800 text-xs text-slate-400"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 2: BOLT TORQUE WIDGET ─── */}
      {activeTab === 'torque' && (
        <div className="space-y-3 text-xs">
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {Object.keys(QUICK_TORQUES).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setBoltSize(size);
                }}
                className={`px-2.5 py-1.5 rounded-md border font-bold text-xs whitespace-nowrap ${
                  boltSize === size
                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] border-cyan-400'
                    : 'bg-[var(--bg-1)] text-slate-300 border-slate-800'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: '88', label: '8.8' },
              { id: '109', label: '10.9' },
              { id: '129', label: '12.9' },
            ].map((gr) => (
              <button
                key={gr.id}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setBoltGrade(gr.id as any);
                }}
                className={`py-2 rounded-md border font-bold text-xs ${
                  boltGrade === gr.id
                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] border-amber-400'
                    : 'bg-[var(--bg-1)] text-slate-300 border-slate-800'
                }`}
              >
                {gr.label}
              </button>
            ))}
          </div>

          <div className="p-3 rounded-md bg-amber-950/20 border border-amber-500/30 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">
              VDI 2230 {boltSize} ({boltGrade === '88' ? '8.8' : boltGrade === '109' ? '10.9' : '12.9'})
            </span>
            <div className="text-2xl font-black text-amber-300 mt-0.5">
              {targetTorque} <span className="text-sm font-normal">N·m</span>
            </div>
            <div className="text-[10px] text-slate-300 mt-1">
              {t12(language, 'Tap drill bit:', 'Kılavuz matkabı:')}{' '}
              <span className="font-bold text-cyan-400">Ø{curBolt.tap} mm</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: QUICK UNIT CONVERTER WIDGET ─── */}
      {activeTab === 'converter' && (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'mm_in', label: 'mm ↔ in' },
              { id: 'bar_psi', label: 'bar ↔ psi' },
              { id: 'nm_lbft', label: 'N·m ↔ lbf·ft' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setConvMode(m.id as any);
                }}
                className={`py-1.5 rounded-md border font-bold text-[10px] ${
                  convMode === m.id
                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] border-cyan-400'
                    : 'bg-[var(--bg-1)] text-slate-300 border-slate-800'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <input
            type="number"
            value={convVal}
            onChange={(e) => setConvVal(Number(e.target.value))}
            className="w-full h-11 px-3 rounded-md bg-[var(--bg-1)] border border-slate-800 text-white text-center text-lg font-bold outline-none focus:border-cyan-400"
          />

          <div className="grid grid-cols-2 gap-2 text-center">
            {convMode === 'mm_in' && (
              <>
                <div className="p-2.5 rounded-md bg-[var(--bg-1)] border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">MILLIMETER</span>
                  <span className="text-sm font-bold text-cyan-400">{convVal} mm</span>
                </div>
                <div className="p-2.5 rounded-md bg-[var(--bg-1)] border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">INCH</span>
                  <span className="text-sm font-bold text-white">{(convVal / 25.4).toFixed(3)}″</span>
                </div>
              </>
            )}

            {convMode === 'bar_psi' && (
              <>
                <div className="p-2.5 rounded-md bg-[var(--bg-1)] border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">BAR</span>
                  <span className="text-sm font-bold text-cyan-400">{convVal} bar</span>
                </div>
                <div className="p-2.5 rounded-md bg-[var(--bg-1)] border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">PSI</span>
                  <span className="text-sm font-bold text-amber-300">{(convVal * 14.5038).toFixed(1)} psi</span>
                </div>
              </>
            )}

            {convMode === 'nm_lbft' && (
              <>
                <div className="p-2.5 rounded-md bg-[var(--bg-1)] border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">N·m</span>
                  <span className="text-sm font-bold text-cyan-400">{convVal} N·m</span>
                </div>
                <div className="p-2.5 rounded-md bg-[var(--bg-1)] border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">lbf·ft</span>
                  <span className="text-sm font-bold text-amber-300">{(convVal * 0.73756).toFixed(1)} ft·lb</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: QUICK ACTION BUTTONS WIDGET ─── */}
      {activeTab === 'tools' && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={toggleTorch}
            className={`h-16 rounded-md border flex flex-col items-center justify-center gap-1 font-bold transition ${
              torchOn
                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] border-yellow-300 '
                : 'bg-[var(--bg-1)] text-white border-slate-800'
            }`}
          >
            <Flashlight size={18} />
            <span>{torchOn ? t12(language, 'Torch ON', 'Fener AÇIK') : t12(language, 'Torch OFF', 'Fener KAPALI')}</span>
          </button>

          <Link
            href="/field"
            onClick={triggerHaptic}
            className="h-16 rounded-md bg-[var(--bg-1)] border border-slate-800 text-white flex flex-col items-center justify-center gap-1 font-bold hover:border-cyan-400 transition"
          >
            <Wrench size={18} className="text-cyan-400" />
            <span>{t12(language, 'Full Field Suite', 'Tüm Saha Araçları')}</span>
          </Link>
        </div>
      )}

      {/* Footer Link to Android APK */}
      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <span>{APP_RELEASE_NAME} · PWA & APK</span>
        <span className="text-cyan-400">Touch / Haptic Ready</span>
      </div>
    </div>
  );
}
