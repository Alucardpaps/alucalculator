'use client';

/**
 * ⚡ ALUCAD OS — AEGIS AI FLOW & ENGINEERING PIPELINE STUDIO MODAL
 * 
 * Connected to the user's active AI Provider (/ai-connect) + Deterministic Flow Engine.
 * Translates engineering problem descriptions and calculation requests into complete,
 * fully-wired Node-RED style calculation graphs (ISO/DIN/EN), executes the math,
 * and bridges calculated dimensions directly to 2D drafting (AluCAD) and 3D CAD (Design Studio).
 */

import React, { useState, useRef, useEffect } from 'react';
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
  Play,
  Box,
  Compass,
} from 'lucide-react';
import { AegisCadTrainingModal } from '@/design-studio/v2/AegisCadTrainingModal';
import {
  generateFlowPipelineWithAI,
  generateFlowPipelineFromPrompt,
  loadFlowPipelineIntoStore,
  transferFlowPipelineToCad,
  type GeneratedFlowPipeline,
} from '@/flow/engine/AegisFlowEngine';
import {
  PROVIDERS,
  readAttachmentFile,
  type AIFileAttachment,
} from '@/lib/ai/providers';
import { useAISettings, useAIReady } from '@/lib/ai/aiSettingsStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useFlowStore } from '@/store/flowStore';

interface AegisFlowAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotification?: (msg: string) => void;
  /** Prompt handed over by the AeGiS chat; generation starts automatically. */
  initialPrompt?: string;
  /** Changes on every new AeGiS hand-over (re-triggers auto-run). */
  autoRunKey?: number;
}

interface FlowPreset {
  labelTr: string;
  labelEn: string;
  icon: string;
  prompt: string;
  tag: string;
}

const FLOW_PRESETS: FlowPreset[] = [
  {
    labelTr: '11 kW Motor-Redüktör-Mil-Rulman',
    labelEn: '11 kW Motor-Reducer-Shaft-Bearing',
    icon: '⚙️',
    prompt: '11 kW 1450 rpm motor, pinyon modül 3 z=18, çark z=54, çıkış mili DIN 743 burulma gerilmesi ve ISO 281 rulman ömrü hesap hattı oluştur.',
    tag: 'DIN 3960',
  },
  {
    labelTr: 'IPE 200 Kiriş Sehim & Gerilme',
    labelEn: 'IPE 200 Beam Deflection & Stress',
    icon: '🏗️',
    prompt: '4 metre açıklıkta 15 kN noktasal yük altındaki IPE 200 çelik kiriş profilinin sehim ve eğilme gerilmesi hesaplama akışı.',
    tag: 'EN 10034',
  },
  {
    labelTr: '16 Bar ASME Basınçlı Kap & Flanş',
    labelEn: '16 Bar ASME Pressure Vessel',
    icon: '🛢️',
    prompt: '16 bar iç basınç, 400mm yarıçap, AISI 1020 çelik için ASME Section VIII Div 1 et kalınlığı ve emniyet katsayısı hesabı.',
    tag: 'ASME VIII',
  },
  {
    labelTr: 'Helisel Dişli Çark Çifti (DIN 3960)',
    labelEn: 'Helical Gear Pair (DIN 3960)',
    icon: '⚡',
    prompt: 'Normal modül 3, helis açısı 15 derece, 20 ve 60 dişli helisel dişli çifti kuvvetleri Ft/Fr/Fa ve tork aktarımı grafiği.',
    tag: 'ISO 6336',
  },
  {
    labelTr: 'Hidrolik Silindir & Mil Burkulması',
    labelEn: 'Hydraulic Cylinder & Rod Buckling',
    icon: '🦾',
    prompt: '180 bar çalışma basıncında Ø80mm piston, Ø45mm mil için itme/çekme kuvvetleri ve Euler mil burkulma kontrolü.',
    tag: 'ISO 6020',
  },
  {
    labelTr: 'DIN 6885 Kamalı Bağlantı Hesabı',
    labelEn: 'DIN 6885 Feather Key Calculation',
    icon: '🔩',
    prompt: 'Ø45mm mil üzerine 250 Nm tork aktaran DIN 6885-1 Form A kama için yüzey ezilme ve kama kesme gerilmesi kontrolü.',
    tag: 'DIN 6885',
  },
];

export function AegisFlowAiModal({
  isOpen,
  onClose,
  onNotification, initialPrompt, autoRunKey,
}: AegisFlowAiModalProps) {
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
  const [lastGenerated, setLastGenerated] = useState<GeneratedFlowPipeline | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTrainingModal, setShowTrainingModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentNodesCount = useFlowStore((s) => s.nodes.length);
  const currentEdgesCount = useFlowStore((s) => s.edges.length);

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
          ? 'Lütfen bir hesaplama hattı açıklaması yazın veya bir eskiz/doküman ekleyin.'
          : 'Please enter a calculation pipeline description or attach a sketch/document.'
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
      let pipeline: GeneratedFlowPipeline;
      if (aiReady && !forceLocal) {
        pipeline = await generateFlowPipelineWithAI(
          prompt,
          attachments,
          abortController.signal,
          (delta) => {
            setStreamingText((prev) => prev + delta);
          }
        );
      } else {
        pipeline = generateFlowPipelineFromPrompt(prompt);
      }

      setLastGenerated(pipeline);
      if (onNotification) {
        onNotification(
          isTr
            ? `✨ ${pipeline.nodes.length} düğümlü hesaplama akışı sentezlendi!`
            : `✨ ${pipeline.nodes.length}-node calculation graph synthesized!`
        );
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setErrorMessage(
          err?.message ||
            (isTr ? 'Akış sentezleme sırasında bir hata oluştu.' : 'Error during Flow pipeline synthesis.')
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

  const handleLoadIntoFlow = () => {
    if (!lastGenerated) return;
    loadFlowPipelineIntoStore(lastGenerated);
    if (onNotification) {
      onNotification(
        isTr
          ? `✓ ${lastGenerated.nodes.length} düğüm Flow alanına yüklendi ve grafik matematiksel olarak çözümlendi.`
          : `✓ ${lastGenerated.nodes.length} nodes loaded into Flow canvas and executed.`
      );
    }
    onClose();
  };

  const handleTransferToCad = (target: '2D' | '3D') => {
    if (!lastGenerated) return;
    const res = transferFlowPipelineToCad(lastGenerated, target);
    if (onNotification) {
      onNotification(res.message);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in select-none">
        <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] shadow-2xl overflow-hidden font-mono text-xs">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] bg-[var(--bg-2)] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[var(--radius-s)] bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400">
                <Wand2 size={16} />
              </div>
              <div>
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Flow Studio · AeGiS AI Hesap & Akış Motoru</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    ISO / DIN / VDI
                  </span>
                </h2>
                <p className="text-[11px] text-[var(--muted)]">
                  {isTr
                    ? 'Mühendislik hesaplama gereksinimlerini doğrudan tam bağlı düğüm grafiğine (Flow Engine) dönüştürür'
                    : 'Translates engineering calculation requirements into fully wired computation graphs'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTrainingModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-s)] text-[11px] font-bold border border-purple-500/40 bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 transition-colors"
                title={isTr ? 'AI Flow Eğitim Veri Seti & Prompt' : 'AI Flow Training Knowledge & Prompt'}
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
              <span className="text-[var(--muted)]">{isTr ? 'Aktif AI Motoru:' : 'Active AI Engine:'}</span>
              {aiReady ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 size={13} />
                  <span>{providerMeta?.name || 'Connected AI'}</span>
                  <span className="text-emerald-500/70 font-normal">({activeModel})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle size={13} />
                  <span>{isTr ? 'Yerel Mühendislik Çözücüsü (API Bağlı Değil)' : 'Local Heuristic Solver (No API)'}</span>
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
                <span>{isTr ? 'Hazır Mühendislik Hesaplama Şablonları' : 'Engineering Calculation Presets'}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FLOW_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(preset.prompt);
                    }}
                    className="p-2 text-left rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] hover:border-amber-500/50 hover:bg-amber-500/10 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{preset.icon}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-white/5 text-[var(--muted)] font-mono">
                        {preset.tag}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-white group-hover:text-amber-300 line-clamp-1">
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
                  {isTr ? 'Hesaplama İstemi / Mühendislik Senaryosu' : 'Calculation Request / Problem Specification'}
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
                    ? 'Örn: 15 kW 1450 rpm motor ile 1:4 oranlı redüktör, çıkış mil çapı ve rulman ömrünü hesaplayan tam akışı kur...'
                    : 'e.g. Build a calculation graph for a 15 kW motor driving a 1:4 reducer, sizing output shaft and checking bearing life...'
                }
                className="w-full p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-600 transition-colors"
              />
            </div>

            {/* File Attachments (Sketches, notes, tables) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] uppercase font-bold text-[var(--muted)] flex items-center gap-1.5">
                  <Upload size={12} className="text-amber-400" />
                  <span>{isTr ? 'Hesap Notu, Eskiz veya PDF Ekleyin' : 'Attach Calculation Note, Sketch or PDF'}</span>
                </label>
                <span className="text-[10px] text-[var(--muted)]">
                  {attachments.length} {isTr ? 'dosya yüklendi' : 'files attached'}
                </span>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--line)] hover:border-amber-500/50 rounded-[var(--radius-s)] p-3 text-center cursor-pointer bg-[var(--bg-0)]/50 transition-colors"
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
                  <div className="flex items-center gap-2 text-amber-400">
                    <ImageIcon size={16} />
                    <FileText size={16} />
                  </div>
                  <span className="text-[11px] text-slate-300">
                    {isTr
                      ? 'Makine şeması, hesap notu fotoğrafı veya PDF sürükleyin ya da tıklayın'
                      : 'Drop machine schematic, calculation photo or PDF, or click to browse'}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {isTr
                      ? 'AI dokümandaki formül ve parametreleri analiz ederek uygun düğümleri ve bağlantıları otomatik oluşturur'
                      : 'AI will extract formulas and parameters to automatically construct node wires'}
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
                        <ImageIcon size={12} className="text-amber-400" />
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
              <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between text-amber-400">
                  <div className="flex items-center gap-2">
                    <Loader2 size={13} className="animate-spin" />
                    <span className="font-bold text-[11px]">
                      {isTr ? 'Hesaplama Düğümleri & Hatları Sentezleniyor...' : 'Synthesizing Flow Nodes & Wires...'}
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
                      <h3 className="text-sm font-bold text-white">{lastGenerated.title}</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isTr ? lastGenerated.description.tr : lastGenerated.description.en}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/30">
                      {lastGenerated.nodes.length} {isTr ? 'Düğüm' : 'Nodes'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                      {lastGenerated.edges.length} {isTr ? 'Bağlantı' : 'Wires'}
                    </span>
                  </div>
                </div>

                {/* Features & Standards */}
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {lastGenerated.standards.map((std, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                      {std}
                    </span>
                  ))}
                </div>

                {/* CAD Bridge Highlights */}
                <div className="p-2.5 rounded bg-[var(--bg-0)] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Compass size={13} />
                      <span>{isTr ? 'CAD Aktarım Köprüsü (2B / 3B Entegrasyonu):' : 'CAD Bridge Integration:'}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {lastGenerated.cadBridge.suggestedParts.length} {isTr ? 'parça hazır' : 'parts ready'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {isTr ? lastGenerated.cadBridge.summaryTr : lastGenerated.cadBridge.summaryEn}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleTransferToCad('2D')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-[10px] transition-all"
                    >
                      <span>📐 {isTr ? '2B CAD’e Aktar (AluCAD)' : 'Transfer to 2D CAD'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTransferToCad('3D')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold text-[10px] transition-all"
                    >
                      <Box size={12} />
                      <span>{isTr ? '3B CAD’e Aktar (Design Studio)' : 'Transfer to 3D CAD'}</span>
                    </button>
                  </div>
                </div>

                {/* Primary Action: Load into Flow Store */}
                <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
                  <span className="text-[10px] text-[var(--muted)]">
                    {isTr
                      ? `Mevcut Akış: ${currentNodesCount} düğüm, ${currentEdgesCount} hat`
                      : `Current Graph: ${currentNodesCount} nodes, ${currentEdgesCount} edges`}
                  </span>
                  <button
                    type="button"
                    onClick={handleLoadIntoFlow}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-s)] bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
                  >
                    <Play size={13} fill="currentColor" />
                    <span>{isTr ? 'Grafiği Flow’a Yükle & Çözümle' : 'Load Graph to Flow & Execute'}</span>
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
              className="flex items-center gap-2 px-5 py-2 rounded-[var(--radius-s)] bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {isSynthesizing ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>{isTr ? 'Üretiliyor...' : 'Synthesizing...'}</span>
                </>
              ) : (
                <>
                  <Wand2 size={13} />
                  <span>{isTr ? 'Hesaplama Akışını Üret' : 'Synthesize Flow Pipeline'}</span>
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
