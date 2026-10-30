'use client';

/**
 * ⚡ ALUCAD OS — AEGIS MULTIMODAL 2D CAD DRAFTING STUDIO MODAL
 * 
 * Connected to the user's active AI Provider (/ai-connect) + Deterministic 2D CAD Engine.
 * Translates natural language prompts, sketches, part photos, or 2D technical drawing PDFs
 * directly into mathematically exact 2D CAD entities (Lines, Arcs, Circles, Polylines,
 * Dimensions, Centerlines) conforming to ISO 128 / DIN 2768.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  X,
  Plus,
  AlertTriangle,
  Cpu,
  Wand2,
  Upload,
  FileText,
  Image as ImageIcon,
  Loader2,
  KeyRound,
  CheckCircle2,
  Trash2,
  GraduationCap,
  Layers,
  ArrowRight,
  Maximize2,
} from 'lucide-react';
import { AegisCadTrainingModal } from '@/design-studio/v2/AegisCadTrainingModal';
import {
  generate2DCadWithAI,
  generate2DCadFromPrompt,
  addGenerated2DCadToStore,
  type Generated2DCadDrawing,
} from '@/engines/cad/Aegis2DCadEngine';
import {
  PROVIDERS,
  readAttachmentFile,
  type AIFileAttachment,
} from '@/lib/ai/providers';
import { useAISettings, useAIReady } from '@/lib/ai/aiSettingsStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useCadStore } from '@/cad/store/cadStore';

interface Aegis2DCadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotification?: (msg: string) => void;
  /** Prompt handed over by the AeGiS chat; generation starts automatically. */
  initialPrompt?: string;
  /** Changes on every new AeGiS hand-over (re-triggers auto-run). */
  autoRunKey?: number;
}

interface Cad2DPreset {
  labelTr: string;
  labelEn: string;
  icon: string;
  prompt: string;
  tag: string;
}

const CAD_2D_PRESETS: Cad2DPreset[] = [
  {
    labelTr: 'DN50 PN16 Boru Flanşı (ISO 7005)',
    labelEn: 'DN50 PN16 Pipe Flange (ISO 7005)',
    icon: '⭕',
    prompt: 'DN50 PN16 boru flanşı: dış çap 165mm, iç çap 60.3mm, 4 adet Ø18 cıvata deliği PCD 125mm, eksen çizgileri ve ISO 128 ölçülendirme',
    tag: 'ISO 7005',
  },
  {
    labelTr: 'L-Braket 80x80x10mm 4 Delikli',
    labelEn: 'L-Bracket 80x80x10mm 4 Holes',
    icon: '📐',
    prompt: 'L-braket 80x80mm, 10mm et kalınlığı, genişlik 50mm, tabanda ve dikey yüzde 2şer adet Ø9mm montaj deliği ve ölçüler',
    tag: 'DIN 1028',
  },
  {
    labelTr: 'NEMA 23 Step Motor Plakası',
    labelEn: 'NEMA 23 Stepper Motor Plate',
    icon: '🤖',
    prompt: 'NEMA 23 step motor montaj plakası 60x60mm, merkez delik Ø38.1mm, 4x Ø5.2mm delik 47.14mm PCD kare merkezinde, eksen çizgileri',
    tag: 'NEMA ICS',
  },
  {
    labelTr: 'DIN 6885 Kamalı Mil Kesiti',
    labelEn: 'DIN 6885 Keyed Shaft Section',
    icon: '⚡',
    prompt: 'DIN 6885 kamalı mil 2B kesiti: mil çapı Ø40mm, kama kanalı genişliği 12mm, derinliği 5mm, merkez eksenleri ve tolerans ölçüsü',
    tag: 'DIN 6885',
  },
  {
    labelTr: 'IPE 200 Kiriş Kesiti (EN 10034)',
    labelEn: 'IPE 200 Beam Cross-Section',
    icon: '🏗️',
    prompt: 'IPE 200 çelik profil kesiti: yükseklik 200mm, flanş genişliği 100mm, gövde 5.6mm, flanş 8.5mm, köşe radyüsleri 12mm',
    tag: 'EN 10034',
  },
  {
    labelTr: '4 Kişilik Açık Ofis Masası Planı',
    labelEn: '4-Person Open Office Desk Plan',
    icon: '🏢',
    prompt: '4 kişilik açık ofis çalışma masası yerleşim planı 2B: 2800x1400mm ortak masa, ortada 40mm kablo bölücü panel, 4 adet çalışma alanı ve sandalyeler',
    tag: 'MİMARİ / OFİS',
  },
];

export function Aegis2DCadModal({
  isOpen,
  onClose,
  onNotification, initialPrompt, autoRunKey,
}: Aegis2DCadModalProps) {
  const { language } = useI18nStore();
  const isTr = language === 'tr';
  const aiSettings = useAISettings();
  const aiReady = useAIReady();
  const providerMeta = PROVIDERS[aiSettings.provider];
  const activeModel = aiSettings.models[aiSettings.provider] || providerMeta?.defaultModel || '';

  const [promptState, setPrompt] = useState('');
  const prompt = promptState;
  const [attachments, setAttachments] = useState<AIFileAttachment[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [lastGenerated, setLastGenerated] = useState<Generated2DCadDrawing | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTrainingModal, setShowTrainingModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentEntCount = useCadStore((s) => s.entities.length);

  // AeGiS chat hand-over: fill the prompt and run the generator once per request.
  const autoRunRef = useRef<((p: string) => void) | null>(null);
  useEffect(() => {
    if (!isOpen || !initialPrompt) return;
    setPrompt(initialPrompt);
    const id = window.setTimeout(() => autoRunRef.current?.(initialPrompt), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, autoRunKey]);

  if (!isOpen) return null;

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);

    const newAttachments: AIFileAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const att = await readAttachmentFile(file);
        newAttachments.push(att);
      } catch (err: any) {
        setErrorMessage(
          isTr
            ? `Dosya okuma hatası: ${err?.message || file.name}`
            : `File read error: ${err?.message || file.name}`
        );
      }
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleSynthesize = async (override?: unknown, forceLocal = false) => {
    const prompt = typeof override === 'string' ? override : promptState;
    if (!prompt.trim() && attachments.length === 0) {
      setErrorMessage(
        isTr
          ? 'Lütfen bir 2B çizim açıklaması yazın veya bir eskiz/teknik resim PDF yükleyin.'
          : 'Please enter a 2D drawing description or upload a sketch/technical drawing PDF.'
      );
      return;
    }

    setIsSynthesizing(true);
    setErrorMessage(null);
    setStreamingText('');
    setLastGenerated(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      let drawing: Generated2DCadDrawing;
      if (aiReady && !forceLocal) {
        drawing = await generate2DCadWithAI(
          prompt,
          attachments,
          abortController.signal,
          (delta) => {
            setStreamingText((prev) => prev + delta);
          }
        );
      } else {
        // Fallback local generator
        drawing = generate2DCadFromPrompt(prompt);
      }

      setLastGenerated(drawing);
      if (onNotification) {
        onNotification(
          isTr
            ? `✨ ${drawing.entities.length} adet 2B CAD varlığı üretildi!`
            : `✨ ${drawing.entities.length} 2D CAD entities synthesized!`
        );
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setErrorMessage(
          err?.message ||
            (isTr ? '2B CAD sentezleme sırasında bir hata oluştu.' : 'Error during 2D CAD synthesis.')
        );
      }
    } finally {
      setIsSynthesizing(false);
      abortControllerRef.current = null;
    }
  };

  autoRunRef.current = guardedRun;
  function guardedRun(p: string) {
    // Puter needs a sign-in popup, which browsers only allow from a click → run locally;
    // the user can re-run with AI from the button.
    void handleSynthesize(p, aiSettings.provider === 'puter');
  }

  const handleInsertToCanvas = () => {
    if (!lastGenerated) return;
    addGenerated2DCadToStore(lastGenerated);
    if (onNotification) {
      onNotification(
        isTr
          ? `✓ ${lastGenerated.entities.length} varlık çizim alanına aktarıldı ve ekrana sığdırıldı.`
          : `✓ ${lastGenerated.entities.length} entities inserted into canvas and zoomed to fit.`
      );
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in select-none">
        <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] shadow-2xl overflow-hidden font-mono text-xs">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] bg-[var(--bg-2)] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[var(--radius-s)] bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center text-cyan-400">
                <Wand2 size={16} />
              </div>
              <div>
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <span>AluCAD · AeGiS AI 2D Drafter</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    ISO 128 / DIN 2768
                  </span>
                </h2>
                <p className="text-[11px] text-[var(--muted)]">
                  {isTr
                    ? 'Doğal dil, eskiz fotoğrafı veya 2B PDF teknik resimden tam ölçülü 2D CAD teknik çizimi üretir'
                    : 'Synthesizes dimensioned 2D CAD technical drawings from text prompts, sketches, or 2D PDFs'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTrainingModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-s)] text-[11px] font-bold border border-purple-500/40 bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 transition-colors"
                title={isTr ? 'AI CAD Eğitim Veri Seti & Kılavuzu' : 'AI CAD Training Knowledge & Prompt'}
              >
                <GraduationCap size={13} />
                <span className="hidden sm:inline">{isTr ? 'Eğitim & Veri' : 'Training'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-[var(--radius-s)] text-[var(--muted)] hover:text-white hover:bg-[var(--bg-3)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* AI Connection Status Banner */}
          <div className="px-4 py-2 border-b border-[var(--line)] bg-[var(--bg-0)]/60 flex items-center justify-between text-[11px] shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[var(--muted)]">{isTr ? 'Aktif Motor:' : 'Active Engine:'}</span>
              {aiReady ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 size={13} />
                  <span>{providerMeta?.name || 'Connected AI'}</span>
                  <span className="text-emerald-500/70 font-normal">({activeModel})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle size={13} />
                  <span>{isTr ? 'Yerel Kural Tabanlı Çizim Motoru (API Bağlı Değil)' : 'Local Heuristic Engine (No API)'}</span>
                </div>
              )}
            </div>
            <Link
              href="/ai-connect"
              target="_blank"
              className="flex items-center gap-1 text-[var(--cyan)] hover:underline text-[10px]"
            >
              <KeyRound size={11} />
              <span>{isTr ? 'API Ayarları / Model Seç' : 'Configure AI API'}</span>
            </Link>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Quick Presets */}
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--muted)] mb-1.5 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400" />
                <span>{isTr ? 'Hızlı 2B Çizim Şablonları' : 'Quick 2D Drafting Presets'}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CAD_2D_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(preset.prompt);
                    }}
                    className="p-2 text-left rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{preset.icon}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-white/5 text-[var(--muted)] font-mono">
                        {preset.tag}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-white group-hover:text-cyan-300 line-clamp-1">
                      {isTr ? preset.labelTr : preset.labelEn}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-bold text-[var(--muted)]">
                  {isTr ? 'Çizim İstemi / Parça Tanımı' : 'Drawing Prompt / Part Specification'}
                </label>
                <span className="text-[10px] text-[var(--muted)]">
                  {prompt.length} {isTr ? 'karakter' : 'chars'}
                </span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder={
                  isTr
                    ? 'Örn: DN50 PN16 flanş 4 delikli Ø18 PCD 125, eksenler ve ölçüler ile çiz...'
                    : 'e.g. Draw a DN50 PN16 pipe flange with 4x M16 bolt holes PCD 125, centerlines, and ISO dimensions...'
                }
                className="w-full p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-600 transition-colors"
              />
            </div>

            {/* File Attachments (Sketches, photos, 2D PDFs) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] uppercase font-bold text-[var(--muted)] flex items-center gap-1.5">
                  <Upload size={12} className="text-cyan-400" />
                  <span>{isTr ? 'Eskiz Görseli veya 2B Teknik Resim PDF Ekleyin' : 'Attach Sketch Image or 2D Drawing PDF'}</span>
                </label>
                <span className="text-[10px] text-[var(--muted)]">
                  {attachments.length} {isTr ? 'dosya yüklendi' : 'files attached'}
                </span>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--line)] hover:border-cyan-500/50 rounded-[var(--radius-s)] p-3 text-center cursor-pointer bg-[var(--bg-0)]/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-1 text-[var(--muted)]">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <ImageIcon size={16} />
                    <FileText size={16} />
                  </div>
                  <span className="text-[11px] text-slate-300">
                    {isTr
                      ? 'Eskiz fotoğrafı (PNG, JPG) veya 2B Teknik Resim PDF sürükleyin ya da tıklayın'
                      : 'Drop sketch photo (PNG, JPG) or 2D Technical Drawing PDF, or click to browse'}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {isTr
                      ? 'AI görseldeki tüm konturları, delikleri ve ölçüleri tanıyıp doğrudan 2B CAD varlıklarına dönüştürür'
                      : 'AI will recognize contours, holes, centerlines, and dimensions directly into 2D CAD entities'}
                  </span>
                </div>
              </div>

              {/* Uploaded attachments list */}
              {attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[11px]"
                    >
                      {att.mimeType.includes('pdf') ? (
                        <FileText size={12} className="text-rose-400" />
                      ) : (
                        <ImageIcon size={12} className="text-cyan-400" />
                      )}
                      <span className="text-slate-300 max-w-[150px] truncate">{att.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setAttachments((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-slate-500 hover:text-rose-400 ml-1"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-2.5 rounded-[var(--radius-s)] bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span className="text-[11px]">{errorMessage}</span>
              </div>
            )}

            {/* Streaming Output / Synthesis Progress */}
            {isSynthesizing && (
              <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between text-cyan-400">
                  <div className="flex items-center gap-2">
                    <Loader2 size={13} className="animate-spin" />
                    <span className="font-bold text-[11px]">
                      {isTr ? '2B CAD Varlıkları Matematiksel Olarak Üretiliyor...' : 'Synthesizing 2D CAD Entities...'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => abortControllerRef.current?.abort()}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    {isTr ? 'İptal Et' : 'Cancel'}
                  </button>
                </div>
                {streamingText && (
                  <pre className="text-[10px] text-slate-400 max-h-24 overflow-y-auto whitespace-pre-wrap font-mono p-2 rounded bg-black/40">
                    {streamingText.slice(-300)}
                  </pre>
                )}
              </div>
            )}

            {/* Generated Result Card */}
            {lastGenerated && (
              <div className="p-3.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-emerald-500/40 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-400" />
                      <h3 className="text-sm font-bold text-white">{lastGenerated.name}</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isTr ? lastGenerated.explanation.tr : lastGenerated.explanation.en}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 shrink-0">
                    {lastGenerated.entities.length} {isTr ? 'Varlık' : 'Entities'}
                  </span>
                </div>

                {/* Features & Standards */}
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {lastGenerated.standards.map((std, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                      {std}
                    </span>
                  ))}
                  {lastGenerated.features.map((feat, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                      {feat}
                    </span>
                  ))}
                </div>

                {/* Action button: Insert into AluCAD Store */}
                <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
                  <span className="text-[10px] text-[var(--muted)]">
                    {isTr
                      ? `Mevcut Çizim Alanı: ${currentEntCount} varlık`
                      : `Current Canvas: ${currentEntCount} entities`}
                  </span>
                  <button
                    type="button"
                    onClick={handleInsertToCanvas}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-s)] bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
                  >
                    <span>{isTr ? 'Çizimi AluCAD’e Aktar & Odakla' : 'Insert to Canvas & Zoom Extents'}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-4 py-3 border-t border-[var(--line)] bg-[var(--bg-2)] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-[var(--radius-s)] text-[var(--muted)] hover:text-white transition-colors"
            >
              {isTr ? 'Kapat' : 'Close'}
            </button>

            <button
              type="button"
              onClick={handleSynthesize}
              disabled={isSynthesizing}
              className="flex items-center gap-2 px-5 py-2 rounded-[var(--radius-s)] bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {isSynthesizing ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>{isTr ? 'Üretiliyor...' : 'Synthesizing...'}</span>
                </>
              ) : (
                <>
                  <Wand2 size={13} />
                  <span>{isTr ? '2B CAD Çizimini Üret' : 'Synthesize 2D CAD'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Embedded In-Context Training Modal */}
      <AegisCadTrainingModal
        isOpen={showTrainingModal}
        onClose={() => setShowTrainingModal(false)}
      />
    </>
  );
}
