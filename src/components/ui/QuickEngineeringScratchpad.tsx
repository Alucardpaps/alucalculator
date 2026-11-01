'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  FileText,
  ArrowLeftRight,
  X,
  Copy,
  Check,
  RotateCcw,
  Minimize2,
  Maximize2,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

const STORAGE_KEY_NOTES = 'alucalc_scratchpad_notes_v1';
const STORAGE_KEY_CALC_HISTORY = 'alucalc_quick_calc_history_v1';

export function QuickEngineeringScratchpad() {
  const { language } = useI18nStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'calc' | 'notes' | 'units'>('calc');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // Quick Calculator State
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState<string | null>(null);
  const [calcHistory, setCalcHistory] = useState<{ expr: string; res: string }[]>([]);

  // Quick Unit Converter State
  const [unitCategory, setUnitCategory] = useState<'length' | 'pressure' | 'torque' | 'power'>('length');
  const [unitVal1, setUnitVal1] = useState<number>(100);

  // Load saved notes and history
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem(STORAGE_KEY_NOTES);
      if (savedNotes) setNotes(savedNotes);

      const savedHist = localStorage.getItem(STORAGE_KEY_CALC_HISTORY);
      if (savedHist) setCalcHistory(JSON.parse(savedHist));
    } catch {}
  }, []);

  // Save notes
  const handleNotesChange = (val: string) => {
    setNotes(val);
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, val);
    } catch {}
  };

  // Keyboard shortcut: Ctrl+Shift+C or Alt+C
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') || (e.altKey && e.key.toLowerCase() === 'c')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Safe Math Evaluator
  const evaluateExpression = (expr: string) => {
    if (!expr.trim()) return;
    try {
      const sanitized = expr
        .replace(/\bpi\b/gi, String(Math.PI))
        .replace(/\be\b/gi, String(Math.E))
        .replace(/\bsqrt\(([^)]+)\)/gi, 'Math.sqrt($1)')
        .replace(/\bsin\(([^)]+)\)/gi, 'Math.sin($1)')
        .replace(/\bcos\(([^)]+)\)/gi, 'Math.cos($1)')
        .replace(/\btan\(([^)]+)\)/gi, 'Math.tan($1)')
        .replace(/\^/g, '**');

      // eslint-disable-next-line no-new-func
      const fn = new Function(`"use strict"; return (${sanitized});`);
      const val = fn();
      if (typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val)) {
        const formatted = Number.isInteger(val) ? val.toString() : Number(val.toFixed(6)).toString();
        setCalcResult(formatted);

        const newHist = [{ expr, res: formatted }, ...calcHistory.filter((h) => h.expr !== expr)].slice(0, 10);
        setCalcHistory(newHist);
        try {
          localStorage.setItem(STORAGE_KEY_CALC_HISTORY, JSON.stringify(newHist));
        } catch {}
      } else {
        setCalcResult('Error');
      }
    } catch {
      setCalcResult('Error');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  // Quick unit calculation
  const convertedUnits = useMemo(() => {
    const v = Number(unitVal1) || 0;
    switch (unitCategory) {
      case 'length':
        return [
          { label: 'Millimeters (mm)', val: (v).toFixed(2), unit: 'mm' },
          { label: 'Inches (in)', val: (v / 25.4).toFixed(4), unit: 'in' },
          { label: 'Meters (m)', val: (v / 1000).toFixed(4), unit: 'm' },
          { label: 'Feet (ft)', val: (v / 304.8).toFixed(4), unit: 'ft' },
        ];
      case 'pressure':
        return [
          { label: 'Megapascals (MPa)', val: (v).toFixed(3), unit: 'MPa' },
          { label: 'Bar', val: (v * 10).toFixed(2), unit: 'bar' },
          { label: 'Pounds / sq in (psi)', val: (v * 145.038).toFixed(2), unit: 'psi' },
          { label: 'N/mm²', val: (v).toFixed(3), unit: 'N/mm²' },
        ];
      case 'torque':
        return [
          { label: 'Newton-meters (N·m)', val: (v).toFixed(2), unit: 'N·m' },
          { label: 'Foot-pounds (lbf·ft)', val: (v * 0.737562).toFixed(2), unit: 'lbf·ft' },
          { label: 'Kilogram-meters (kgf·m)', val: (v / 9.80665).toFixed(2), unit: 'kgf·m' },
        ];
      case 'power':
        return [
          { label: 'Kilowatts (kW)', val: (v).toFixed(2), unit: 'kW' },
          { label: 'Horsepower (HP)', val: (v * 1.34102).toFixed(2), unit: 'HP' },
          { label: 'Watts (W)', val: (v * 1000).toFixed(0), unit: 'W' },
        ];
    }
  }, [unitCategory, unitVal1]);

  return (
    <div className="fixed bottom-4 right-4 z-[9990] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="mb-3 w-[360px] sm:w-[410px] rounded-2xl border border-cyan-500/30 bg-[var(--bg-0)]/95 shadow-2xl overflow-hidden flex flex-col font-mono text-white"
          >
            {/* Widget Top Bar */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-black/60 border-b border-cyan-900/30">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Calculator size={13} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  {t12(language, 'Engineering Scratchpad', 'Mühendislik Asistanı')}
                </span>
              </div>

              {/* Tabs */}
              <div className="flex items-center bg-cyan-950/50 rounded-lg p-0.5 border border-cyan-900/40 text-[10px]">
                <button
                  type="button"
                  onClick={() => setActiveTab('calc')}
                  className={`px-2 py-1 rounded transition-colors ${
                    activeTab === 'calc' ? 'bg-cyan-500/30 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t12(language, 'Calc', 'Hesap')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={`px-2 py-1 rounded transition-colors ${
                    activeTab === 'notes' ? 'bg-cyan-500/30 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t12(language, 'Notes', 'Notlar')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('units')}
                  className={`px-2 py-1 rounded transition-colors ${
                    activeTab === 'units' ? 'bg-cyan-500/30 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t12(language, 'Units', 'Birim')}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* TAB 1: QUICK CALCULATOR */}
            {activeTab === 'calc' && (
              <div className="p-3.5 space-y-3">
                {/* Result Display */}
                <div className="p-3 rounded-xl bg-black/60 border border-cyan-900/40 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-cyan-500/80 font-bold uppercase">
                      {calcInput || '0'}
                    </div>
                    <div className="text-xl font-black text-cyan-300 truncate">
                      {calcResult ?? '0'}
                    </div>
                  </div>
                  {calcResult && (
                    <button
                      type="button"
                      onClick={() => handleCopy(calcResult, 'calc-res')}
                      className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors shrink-0"
                      title="Copy result"
                    >
                      {copied === 'calc-res' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>

                {/* Expression Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    evaluateExpression(calcInput);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={calcInput}
                    onChange={(e) => setCalcInput(e.target.value)}
                    placeholder="e.g. 250*1.5 + sqrt(144)"
                    className="flex-1 bg-cyan-950/30 border border-cyan-900/40 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/60"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors"
                  >
                    =
                  </button>
                </form>

                {/* Quick Formula Keys */}
                <div className="grid grid-cols-6 gap-1 text-[11px]">
                  {['sqrt(', 'pi', '^2', 'sin(', 'cos(', 'tan(', '(', ')', '/', '*', '-', '+'].map((btn) => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => {
                        const next = calcInput + btn;
                        setCalcInput(next);
                      }}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-cyan-500/20 text-cyan-400 border border-white/5 hover:border-cyan-500/30 text-center transition-all font-mono font-bold"
                    >
                      {btn}
                    </button>
                  ))}
                </div>

                {/* Recent History */}
                {calcHistory.length > 0 && (
                  <div className="pt-2 border-t border-cyan-900/20">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5 flex justify-between items-center">
                      <span>{t12(language, 'Recent History', 'Son İşlemler')}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCalcHistory([]);
                          localStorage.removeItem(STORAGE_KEY_CALC_HISTORY);
                        }}
                        className="hover:text-red-400 transition-colors"
                      >
                        <RotateCcw size={10} />
                      </button>
                    </div>
                    <div className="max-h-24 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                      {calcHistory.slice(0, 4).map((h, i) => (
                        <div
                          key={`hist-${i}`}
                          onClick={() => {
                            setCalcInput(h.expr);
                            setCalcResult(h.res);
                          }}
                          className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-black/30 hover:bg-cyan-900/20 cursor-pointer text-slate-300 hover:text-cyan-200 transition-colors"
                        >
                          <span className="truncate text-slate-400">{h.expr}</span>
                          <span className="font-bold text-cyan-400 ml-2">= {h.res}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SCRATCHPAD PERSISTENT NOTES */}
            {activeTab === 'notes' && (
              <div className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-wider">
                    {t12(language, 'Persistent Scratch Notes (Auto-saved)', 'Kalıcı Karalama Notları (Otomatik Kayıt)')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(notes, 'notes-copy')}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors text-[10px]"
                  >
                    {copied === 'notes-copy' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied === 'notes-copy' ? (t12(language, 'Copied', 'Kopyalandı')) : (t12(language, 'Copy', 'Kopyala'))}</span>
                  </button>
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder={t12(language, 'Scratch temporary dimensions and numbers here. They persist across pages...', 'Geçici ölçüleri ve mühendislik notlarını buraya karalayın. Sayfalar arasında kaybolmaz...')}
                  rows={6}
                  className="w-full rounded-xl bg-black/60 border border-cyan-900/40 p-3 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500/60 custom-scrollbar resize-none font-mono"
                />

                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>{notes.length} {t12(language, 'characters', 'karakter')}</span>
                  <button
                    type="button"
                    onClick={() => handleNotesChange('')}
                    className="text-red-400/80 hover:text-red-400 transition-colors"
                  >
                    {t12(language, 'Clear Notes', 'Notları Temizle')}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: QUICK UNIT CONVERTER */}
            {activeTab === 'units' && (
              <div className="p-3.5 space-y-3">
                {/* Category Picker */}
                <div className="grid grid-cols-4 gap-1 text-[10px]">
                  {(['length', 'pressure', 'torque', 'power'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setUnitCategory(cat)}
                      className={`p-1.5 rounded-lg border uppercase font-bold transition-all text-center ${
                        unitCategory === cat
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'bg-white/[0.03] border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Input Value */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Value:</span>
                  <input
                    type="number"
                    value={unitVal1}
                    onChange={(e) => setUnitVal1(Number(e.target.value))}
                    className="flex-1 bg-black/60 border border-cyan-900/40 rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-bold outline-none focus:border-cyan-500/60"
                  />
                </div>

                {/* Conversion Grid */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                  {convertedUnits.map((u, i) => (
                    <div
                      key={`unit-${i}`}
                      onClick={() => handleCopy(u.val, `unit-${i}`)}
                      className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-cyan-900/20 hover:border-cyan-500/40 hover:bg-cyan-950/20 cursor-pointer transition-all group"
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-400 truncate">{u.label}</div>
                        <div className="text-sm font-bold text-white font-mono">{u.val} <span className="text-xs text-cyan-400">{u.unit}</span></div>
                      </div>
                      <div className="text-slate-600 group-hover:text-cyan-400 transition-colors">
                        {copied === `unit-${i}` ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full border border-cyan-500/40 bg-[var(--bg-1)]/90 hover:bg-[var(--bg-2)] text-cyan-300 shadow-xl hover:scale-105 transition-all group font-mono text-xs font-bold"
        title="Quick Engineering Tools (Ctrl+Shift+C)"
      >
        <Calculator size={15} className="text-cyan-400 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">
          {t12(language, 'Quick Tools', 'Hızlı Araçlar')}
        </span>
        <kbd className="hidden sm:inline px-1 py-0.5 rounded bg-cyan-950/80 text-[9px] text-cyan-400 border border-cyan-800/40">
          ⌘+Shift+C
        </kbd>
      </button>
    </div>
  );
}
