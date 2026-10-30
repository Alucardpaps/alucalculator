'use client';

/**
 * ⚡ ALUCAD OS — AEGIS MULTIMODAL TEXT / IMAGE / 2D PDF TO 3D CAD STUDIO MODAL
 * 
 * Connected to the user's active AI Provider (/ai-connect) + Local Deterministic B-Rep Kernel.
 * Allows engineers to type natural language prompts, upload part photos/sketches (PNG/JPG/WEBP),
 * or drop 2D technical drawing PDFs (.pdf) to synthesize custom 3D parametric solids & 2D contours,
 * inspect DFM machinability scores, and export ISO 10303-21 STEP / STL files.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  X,
  Download,
  Plus,
  AlertTriangle,
  Cpu,
  Wand2,
  Gauge,
  Box,
  Upload,
  FileText,
  Image as ImageIcon,
  Loader2,
  KeyRound,
  CheckCircle2,
  Trash2,
  GraduationCap,
} from 'lucide-react';
import { AegisCadTrainingModal } from './AegisCadTrainingModal';
import { useDesignStore, type DesignPart } from '@/design-studio/designStore';
import { triggerCameraView } from '@/design-studio/cadCameraDispatcher';
import {
  generateSolidFromPrompt,
  generateSolidWithAI,
  exportGeneratedSolidToStep,
  exportGeneratedSolidToStl,
  type GeneratedCadSolid,
} from '@/engines/cad/AegisGenerativeEngine';
import { downloadStepFile } from '@/engines/cad/StepBRepExporter';
import { downloadFile } from '@/design-studio/exporter';
import {
  PROVIDERS,
  readAttachmentFile,
  type AIFileAttachment,
} from '@/lib/ai/providers';
import { useAISettings, useAIReady } from '@/lib/ai/aiSettingsStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

interface AegisTextToCadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotification?: (msg: string) => void;
  /** Prompt handed over by the AeGiS chat; generation starts automatically. */
  initialPrompt?: string;
  /** Changes on every new AeGiS hand-over (re-triggers auto-run). */
  autoRunKey?: number;
}

interface CadPreset {
  labelTr: string;
  labelEn: string;
  icon: string;
  prompt: string;
  tag: string;
}

const CAD_PRESETS: CadPreset[] = [
  {
    labelTr: 'NEMA 23 Motor Montaj Braketi',
    labelEn: 'NEMA 23 Stepper Motor Mount',
    icon: '🤖',
    prompt: 'NEMA 23 step motor montaj plakası 8mm kalınlık 6061 alüminyum',
    tag: 'NEMA ICS',
  },
  {
    labelTr: 'DN50 PN16 Boru Flanşı',
    labelEn: 'DN50 PN16 Pipe Flange',
    icon: '⭕',
    prompt: 'DN50 PN16 boru flanşı 4xM16 PCD 125 paslanmaz çelik',
    tag: 'ISO 7005',
  },
  {
    labelTr: 'DIN 6885 Kamalı Transmisyon Mili',
    labelEn: 'DIN 6885 Keyway Drive Shaft',
    icon: '⚡',
    prompt: 'DIN 6885 kamalı transmisyon mili Ø35x180mm 4140 çelik',
    tag: 'DIN 6885',
  },
  {
    labelTr: 'L-Braket Şase Bağlantı Ayağı',
    labelEn: 'Structural L-Bracket Mount',
    icon: '📐',
    prompt: 'L-braket 100x100x50mm 8mm et kalınlığı 3 delikli M8',
    tag: 'DIN 1028',
  },
  {
    labelTr: 'Evolvent Düz Dişli Çark',
    labelEn: 'Involute Spur Gear',
    icon: '⚙️',
    prompt: 'Z28 M2.5 düz dişli çark 25mm genişlik 4140 çelik',
    tag: 'ISO 53',
  },
  {
    labelTr: 'CNC Fikstür Taban Plakası',
    labelEn: 'CNC Fixture Baseplate',
    icon: '🔲',
    prompt: '160x100x20mm plaka 4xM8 havşa petek hafifletme 7075-t6',
    tag: 'ISO 2768',
  },
  {
    labelTr: 'V-Kayış Tahrik Kasnağı',
    labelEn: 'V-Belt Drive Pulley',
    icon: '🎯',
    prompt: 'Ø120x35mm V-kasnak DIN 2211 kanal 6061 alüminyum',
    tag: 'DIN 2211',
  },
  {
    labelTr: 'Elektronik Muhafaza Kutusu',
    labelEn: 'Electronics Enclosure Chassis',
    icon: '📦',
    prompt: 'Elektronik muhafaza kutusu 140x90x45mm 3mm et kalınlığı',
    tag: 'IP54',
  },
  {
    labelTr: '40x40 Sigma T-Slot Profil',
    labelEn: '40x40 Sigma T-Slot Profile',
    icon: '📏',
    prompt: '40x40 sigma profil 350mm boy alüminyum 6061',
    tag: 'EN 12020',
  },
];

export function AegisTextToCadModal({ isOpen, onClose, onNotification, initialPrompt, autoRunKey }: AegisTextToCadModalProps) {
  const { language } = useI18nStore();
  const [promptState, setPrompt] = useState('NEMA 23 step motor montaj plakası 8mm kalınlık 6061 alüminyum');
  const prompt = promptState;
  const [attachments, setAttachments] = useState<AIFileAttachment[]>([]);
  const [aiSolid, setAiSolid] = useState<GeneratedCadSolid | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiStatusText, setAiStatusText] = useState<string>('');
  const [trainingModalOpen, setTrainingModalOpen] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aiSettings = useAISettings();
  const isAiReady = useAIReady();
  const activeProviderMeta = PROVIDERS[aiSettings.provider];
  const activeModel = aiSettings.models[aiSettings.provider] || activeProviderMeta.defaultModel;

  // Deterministic local B-Rep fallback preview
  const localSolid = useMemo<GeneratedCadSolid | null>(() => {
    const combinedText = [
      promptState.trim(),
      ...attachments.map((a) => a.extractedText || ''),
    ]
      .filter(Boolean)
      .join(' ');
    if (!combinedText) return null;
    try {
      return generateSolidFromPrompt(combinedText);
    } catch (err) {
      console.error('Error synthesizing CAD solid:', err);
      return null;
    }
  }, [promptState, attachments]);

  const activeSolid = aiSolid || localSolid;

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

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setAiError(null);
    const loaded: AIFileAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
      const isImg = f.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|svg)$/i.test(f.name);
      if (!isPdf && !isImg) {
        setAiError(
          t12(
            language,
            'Only Image (PNG/JPG/WEBP) and 2D Technical Drawing PDF (.pdf) files are supported.',
            'Yalnızca Görsel (PNG/JPG/WEBP) ve 2D Teknik Resim PDF (.pdf) dosyaları desteklenir.'
          )
        );
        continue;
      }
      try {
        const att = await readAttachmentFile(f);
        loaded.push(att);
      } catch (e: any) {
        setAiError(e?.message || 'Dosya okunamadı');
      }
    }
    if (loaded.length > 0) {
      setAttachments((prev) => [...prev, ...loaded]);
      setAiSolid(null);
    }
  };

  const handleSynthesizeWithAI = async (override?: unknown) => {
    const prompt = typeof override === 'string' ? override : promptState;
    if (!prompt.trim() && attachments.length === 0) return;
    setIsAiLoading(true);
    setAiError(null);
    setAiStatusText(
      language === 'tr'
        ? `${activeProviderMeta.name} (${activeModel}) ile teknik resim/metin analiz ediliyor...`
        : `Analyzing drawing/prompt via ${activeProviderMeta.name} (${activeModel})...`
    );

    try {
      const result = await generateSolidWithAI(prompt, attachments, undefined, (delta) => {
        if (delta) {
          setAiStatusText(
            language === 'tr'
              ? `AI 3B katı model ve kontur koordinatlarını sentezliyor...`
              : `AI synthesizing 3D solid and contour coordinates...`
          );
        }
      });
      setAiSolid(result);
      setAiStatusText('');
      onNotification?.(
        language === 'tr'
          ? `✨ AI ile Özel 3B Model Üretildi: ${result.name}`
          : `✨ Custom 3D Solid Generated with AI: ${result.name}`
      );
    } catch (err: any) {
      setAiError(err?.message || String(err));
      setAiStatusText('');
    } finally {
      setIsAiLoading(false);
    }
  };

  autoRunRef.current = guardedRun;
  function guardedRun(p: string) {
    setAiSolid(null);
    // Local B-Rep preview appears instantly; AI auto-runs only for key-based providers
    // (Puter sign-in needs a user click for its popup).
    if (isAiReady && aiSettings.provider !== 'puter') void handleSynthesizeWithAI(p);
  }

  const handleAddToScene = () => {
    if (!activeSolid) return;

    const store = useDesignStore.getState();
    store.pushHistory();

    if (activeSolid.assemblyParts && activeSolid.assemblyParts.length > 0) {
      const assemblyParts = activeSolid.assemblyParts;
      useDesignStore.setState((s) => ({
        parts: [...s.parts, ...assemblyParts],
        selectedId: assemblyParts[0]?.id || null,
      }));
      if (activeSolid.materialId) {
        store.setSelectedMaterialId(activeSolid.materialId);
      }
      setTimeout(() => triggerCameraView('fit'), 100);
      onNotification?.(
        language === 'tr'
          ? `⚡ "${activeSolid.name}" (${assemblyParts.length} parçalı montaj) başarıyla 3B çalışma alanına eklendi!`
          : `⚡ "${activeSolid.name}" (${assemblyParts.length} parts assembly) added to 3D workspace!`
      );
      onClose();
      return;
    }

    const newPartId = `solid-${Date.now().toString(36)}`;
    const newPart: DesignPart = {
      id: newPartId,
      name: activeSolid.name,
      kind: activeSolid.kind,
      params: activeSolid.params,
      outer: activeSolid.outer,
      inner: activeSolid.inner,
      solidOp: activeSolid.solidOp,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: activeSolid.color,
      visible: true,
      locked: false,
      parentId: null,
      holes: activeSolid.holes || [],
      cuts: activeSolid.cuts || [],
    };

    useDesignStore.setState((s) => ({
      parts: [...s.parts, newPart],
      selectedId: newPartId,
      holes: activeSolid.holes || [],
      cuts: activeSolid.cuts || [],
    }));

    if (activeSolid.materialId) {
      store.setSelectedMaterialId(activeSolid.materialId);
    }

    setTimeout(() => triggerCameraView('fit'), 100);

    onNotification?.(
      language === 'tr'
        ? `⚡ "${activeSolid.name}" başarıyla 3B çalışma alanına eklendi!`
        : `⚡ "${activeSolid.name}" added to 3D workspace!`
    );
    onClose();
  };

  const handleDownloadStep = () => {
    if (!activeSolid) return;
    try {
      const stepContent = exportGeneratedSolidToStep(activeSolid, activeSolid.name);
      downloadStepFile(stepContent, `${activeSolid.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.step`);
      onNotification?.(
        language === 'tr'
          ? `📥 ISO 10303-21 STEP B-Rep dosyası indirildi: ${activeSolid.name}.step`
          : `📥 ISO 10303-21 STEP B-Rep file exported: ${activeSolid.name}.step`
      );
    } catch (err) {
      console.error('STEP export error:', err);
    }
  };

  const handleDownloadStl = () => {
    if (!activeSolid) return;
    try {
      const stlContent = exportGeneratedSolidToStl(activeSolid, activeSolid.name);
      downloadFile(stlContent, `${activeSolid.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.stl`, 'text/plain');
      onNotification?.(
        language === 'tr'
          ? `📥 3B STL Mesh dosyası indirildi: ${activeSolid.name}.stl`
          : `📥 3D STL Mesh file exported: ${activeSolid.name}.stl`
      );
    } catch (err) {
      console.error('STL export error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 font-mono select-none">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-[var(--bg-0)] border border-[var(--cyan)]/40 rounded-lg shadow-2xl overflow-hidden text-[var(--ink)]">
        
        {/* ─── Modal Header ─── */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 bg-[var(--bg-1)] border-b border-[var(--line)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--cyan)]/15 text-[var(--cyan)] border border-[var(--cyan)]/40">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-[var(--ink)] tracking-wide">
                  {t12(language, 'AeGiS Multimodal AI 3D CAD Studio', 'AeGiS Metin, Görsel & 2D PDF → 3B CAD Stüdyosu')}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--cyan)]/15 text-[var(--cyan)] border border-[var(--cyan)]/30">
                  TEXT + VISION + 2D PDF
                </span>
              </div>
              <p className="text-[11px] text-[var(--alu-dim)]">
                {t12(
                  language,
                  'Synthesize custom 3D parts from text prompts, part images, or 2D PDF drawings via your connected AI API.',
                  'Yazı, parça görseli veya 2D PDF teknik resim yükleyerek bağlı AI API anahtarınızla özel 3B parça çizin.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* AI CAD Training & Prompt Engineering Hub */}
            <button
              type="button"
              onClick={() => setTrainingModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10.5px] font-bold bg-[var(--cyan)]/15 border-[var(--cyan)]/40 text-[var(--cyan)] hover:bg-[var(--cyan)]/25 transition-colors cursor-pointer"
              title={t12(language, 'View AI CAD Training Dataset & Prompts', 'AI CAD Eğitim Dosyaları & Kılavuzu')}
            >
              <GraduationCap size={13} />
              <span className="hidden sm:inline">{t12(language, 'AI Training Guide', '🎓 AI Eğitim')}</span>
            </button>

            {/* Active AI Connection Badge (/ai-connect) */}
            <Link
              href="/ai-connect/"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10.5px] font-bold transition-colors ${
                isAiReady
                  ? 'bg-[var(--ok)]/15 border-[var(--ok)]/40 text-[var(--ok)] hover:bg-[var(--ok)]/25'
                  : 'bg-[var(--warn)]/15 border-[var(--warn)]/40 text-[var(--warn)] hover:bg-[var(--warn)]/25'
              }`}
              title={t12(language, 'Configure AI Provider & API Key', 'AI Sağlayıcı ve API Anahtarını Yönet (/ai-connect)')}
            >
              <KeyRound size={12} />
              <span>
                {isAiReady
                  ? `${activeProviderMeta.name.split(' ')[0]} · ${activeModel}`
                  : t12(language, 'Connect AI Key', 'API Anahtarı Bağla')}
              </span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ─── Modal Body ─── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* 1. Natural Language Prompt + Multimodal Upload Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Left 7 cols: Text Prompt */}
            <div className="md:col-span-7 space-y-1.5 flex flex-col">
              <label className="text-xs font-bold text-[var(--cyan)] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Wand2 size={13} />
                  <span>{t12(language, '1. Engineering Text Description:', '1. Doğal Dille Parça / Özel Çizim Tanımı:')}</span>
                </span>
                {prompt && (
                  <button
                    type="button"
                    onClick={() => {
                      setPrompt('');
                      setAiSolid(null);
                    }}
                    className="text-[10px] text-[var(--alu-dim)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    {t12(language, 'Clear', 'Temizle')}
                  </button>
                )}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setAiSolid(null);
                }}
                placeholder={t12(
                  language,
                  'Describe any custom part, dimensions, contour, holes or instructions for the uploaded image/2D PDF...',
                  'Örn: Yüklenen 2D PDF teknik resimdeki özel flanşı 15mm kalınlıkta 7075 alüminyumdan çiz, veya "150x90x20mm L-konturlu özel braket, 4x M8 imbus delik"...'
                )}
                rows={3}
                className="w-full flex-1 bg-[var(--bg-1)] border border-[var(--line)] focus:border-[var(--cyan)] rounded p-3 text-xs text-[var(--ink)] placeholder-[var(--muted)] outline-none transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Right 5 cols: Image & 2D PDF Technical Drawing Dropzone */}
            <div className="md:col-span-5 space-y-1.5 flex flex-col">
              <label className="text-xs font-bold text-[var(--cyan)] flex items-center gap-1.5">
                <Upload size={13} />
                <span>{t12(language, '2. Attach Image or 2D PDF Drawing:', '2. Görsel veya 2D PDF Teknik Resim Ekle:')}</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf,.pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(false);
                  handleFilesSelected(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 flex flex-col items-center justify-center p-3 rounded border border-dashed cursor-pointer transition-all text-center ${
                  isDraggingOver
                    ? 'border-[var(--cyan)] bg-[var(--cyan)]/10'
                    : 'border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--cyan)]/60'
                }`}
              >
                <div className="flex items-center gap-2 text-[var(--cyan)] mb-1">
                  <ImageIcon size={16} />
                  <FileText size={16} />
                </div>
                <span className="text-[11px] font-bold text-[var(--ink)]">
                  {t12(
                    language,
                    'Drop Image (PNG/JPG) or 2D PDF here',
                    'Görsel (PNG/JPG) veya 2D PDF Sürükleyin / Seçin'
                  )}
                </span>
                <span className="text-[9.5px] text-[var(--alu-dim)] mt-0.5">
                  {t12(
                    language,
                    'Technical drawings, sketches, part photos',
                    'Teknik resim PDF, kumpas ölçümü, parça fotoğrafı'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Attached Files Preview Strip */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded bg-[var(--bg-1)] border border-[var(--line)]">
              <span className="text-[10px] font-bold text-[var(--cyan)] uppercase">
                {t12(language, 'Attached Drawings:', 'Eklenen Dosyalar:')}
              </span>
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-2.5 py-1 rounded bg-[var(--bg-2)] border border-[var(--line)] text-xs"
                >
                  {att.mimeType.startsWith('image/') ? (
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="w-6 h-6 object-cover rounded border border-[var(--line)]"
                    />
                  ) : (
                    <FileText size={15} className="text-[var(--cyan)] shrink-0" />
                  )}
                  <div className="max-w-[180px]">
                    <div className="text-[10.5px] font-bold text-[var(--ink)] truncate">{att.name}</div>
                    <div className="text-[9px] text-[var(--alu-dim)]">
                      {att.mimeType === 'application/pdf'
                        ? att.extractedText
                          ? `2D PDF · ${att.extractedText.split('|').length} ölçü/etiket okundu`
                          : '2D PDF Teknik Resim'
                        : 'Görsel / Fotoğraf'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachments((prev) => prev.filter((_, i) => i !== idx));
                      setAiSolid(null);
                    }}
                    className="p-0.5 text-[var(--alu-dim)] hover:text-[var(--bad)] cursor-pointer"
                    title="Kaldır"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action Bar: Synthesize with Connected AI API */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-[var(--bg-1)] border border-[var(--cyan)]/35">
            <div className="flex items-center gap-2 min-w-0">
              <Cpu size={16} className="text-[var(--cyan)] shrink-0" />
              <div className="text-[11px]">
                <span className="font-bold text-[var(--ink)]">
                  {t12(
                    language,
                    'AI Custom CAD Synthesis (Connected to /ai-connect): ',
                    'AI Özel Çizim Motoru (/ai-connect API Bağlantılı): '
                  )}
                </span>
                <span className="text-[var(--alu-dim)]">
                  {aiStatusText ||
                    t12(
                      language,
                      'Analyzes text, images, and 2D PDFs via your API key to generate custom 3D profiles & parts.',
                      'Yazı, görsel ve 2D PDF teknik resimleri API anahtarınızla analiz ederek özel 3B katı model üretir.'
                    )}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSynthesizeWithAI}
              disabled={isAiLoading || (!prompt.trim() && attachments.length === 0)}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-[var(--cyan)] hover:brightness-110 text-[var(--accent-ink)] text-xs font-extrabold shadow-md transition-all disabled:opacity-40 cursor-pointer shrink-0"
            >
              {isAiLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{t12(language, 'Synthesizing with AI...', 'AI ile Çiziliyor...')}</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>
                    {t12(
                      language,
                      '✨ Custom Draw with AI (API)',
                      '✨ AI ile Özel Çiz / Üret (API)'
                    )}
                  </span>
                </>
              )}
            </button>
          </div>

          {aiError && (
            <div className="p-2.5 rounded bg-[var(--bad)]/15 border border-[var(--bad)]/40 text-xs text-[var(--bad)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{aiError}</span>
              </div>
              <Link
                href="/ai-connect/"
                className="px-2 py-1 rounded bg-[var(--bg-1)] border border-[var(--line)] text-[var(--ink)] text-[10px] font-bold shrink-0 hover:border-[var(--cyan)]"
              >
                /ai-connect →
              </Link>
            </div>
          )}

          {/* Industrial Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-[var(--alu-dim)]">
              {t12(language, 'Standard Engineering Presets:', 'Standart Endüstriyel Şablonlar:')}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CAD_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(p.prompt);
                    setAiSolid(null);
                  }}
                  className={`flex items-center gap-2 p-2 rounded border text-left transition-all cursor-pointer ${
                    prompt === p.prompt && !aiSolid
                      ? 'bg-[var(--cyan)]/15 border-[var(--cyan)] text-[var(--ink)]'
                      : 'bg-[var(--bg-1)] border-[var(--line)] hover:border-[var(--cyan)]/50 text-[var(--ink)]'
                  }`}
                >
                  <span className="text-base">{p.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold truncate">
                      {language === 'tr' ? p.labelTr : p.labelEn}
                    </div>
                    <span className="text-[9.5px] font-mono text-[var(--cyan)]">
                      {p.tag}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Reactive Engineering Dossier & DFM Analysis */}
          {activeSolid ? (
            <div className="p-4 rounded-lg bg-[var(--bg-1)] border border-[var(--line)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Box size={16} className="text-[var(--cyan)]" />
                  <span className="text-sm font-bold text-[var(--ink)]">{activeSolid.name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg-2)] text-[var(--alu)] border border-[var(--line)]">
                    {activeSolid.kind.toUpperCase()}
                  </span>
                  {activeSolid.aiSynthesized && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/40">
                      <CheckCircle2 size={11} />
                      <span>AI: {activeSolid.providerLabel}</span>
                    </span>
                  )}
                </div>

                {/* DFM Machinability Badge */}
                {activeSolid.dfm && (
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border ${
                      activeSolid.dfm.score >= 80
                        ? 'bg-[var(--ok)]/15 border-[var(--ok)]/40 text-[var(--ok)]'
                        : activeSolid.dfm.score >= 60
                        ? 'bg-[var(--warn)]/15 border-[var(--warn)]/40 text-[var(--warn)]'
                        : 'bg-[var(--bad)]/15 border-[var(--bad)]/40 text-[var(--bad)]'
                    }`}
                  >
                    <Gauge size={13} />
                    <span>DFM Skoru: %{activeSolid.dfm.score}</span>
                  </div>
                )}
              </div>

              {/* Parametric Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)]">
                  <span className="text-[10px] text-[var(--alu-dim)] block">Malzeme / Alaşım</span>
                  <span className="font-bold text-[var(--ink)]">{activeSolid.materialName || 'Al 6061-T6'}</span>
                </div>

                <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)]">
                  <span className="text-[10px] text-[var(--alu-dim)] block">Tahmini Ağırlık</span>
                  <span className="font-bold text-[var(--cyan)]">{activeSolid.estimatedMassKg ?? 0.25} kg</span>
                </div>

                <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)]">
                  <span className="text-[10px] text-[var(--alu-dim)] block">Delik / Kesit</span>
                  <span className="font-bold text-[var(--ink)]">
                    {activeSolid.holes?.length || 0} Delik
                    {activeSolid.outer ? ` · ${activeSolid.outer.length} Köşe Kontur` : ''}
                  </span>
                </div>

                <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--line)]">
                  <span className="text-[10px] text-[var(--alu-dim)] block">Kritik Et Kalınlığı</span>
                  <span className="font-bold text-[var(--ink)]">
                    {activeSolid.dfm?.minWallThicknessMm ?? 6} mm
                  </span>
                </div>
              </div>

              {/* Normative Standards Citations */}
              {activeSolid.standards && activeSolid.standards.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[var(--alu-dim)] font-bold">
                    {activeSolid.aiSynthesized ? 'AI Önerilen Standartlar:' : 'Normatif Standartlar:'}
                  </span>
                  {activeSolid.standards.map((std, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-2)] border border-[var(--line)] text-[var(--cyan)]"
                    >
                      {std}
                    </span>
                  ))}
                </div>
              )}

              {/* DFM Warnings / Recommendations */}
              {activeSolid.dfm && activeSolid.dfm.warnings.length > 0 && (
                <div className="p-2.5 rounded bg-[var(--warn)]/15 border border-[var(--warn)]/35 text-[11px] text-[var(--warn)] space-y-1">
                  <div className="flex items-center gap-1 font-bold">
                    <AlertTriangle size={13} />
                    <span>Üretilebilirlik (DFM) Uyarıları:</span>
                  </div>
                  {activeSolid.dfm.warnings.map((w, i) => (
                    <div key={i} className="pl-4 text-[10.5px] list-disc">
                      • {w}
                    </div>
                  ))}
                </div>
              )}

              {/* Methodology tier notice for AI output (AGENTS.md §6.1 — Heuristic Tier) */}
              {activeSolid.methodology?.tier === 'heuristic' && (
                <div className="p-2.5 rounded bg-[var(--warn)]/10 border border-[var(--warn)]/35 text-[10.5px] text-[var(--warn)] flex items-start gap-1.5">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  <span>
                    {t12(
                      language,
                      'Heuristic Tier: dimensions and standards were interpreted by AI from your text/image/PDF. Check them against the drawing before production.',
                      'Heuristik Seviye: ölçüler ve standartlar AI tarafından yazı/görsel/PDF\'ten yorumlandı. Üretimden önce teknik resimle karşılaştırıp doğrulayın.'
                    )}
                  </span>
                </div>
              )}

              {/* Engineering Explanation */}
              <div className="text-[11px] text-[var(--alu)] bg-[var(--bg-0)] p-2.5 rounded border border-[var(--line)] leading-relaxed">
                {language === 'tr' ? activeSolid.explanation.tr : activeSolid.explanation.en}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-[var(--alu-dim)] border border-dashed border-[var(--line)] rounded-lg">
              {t12(
                language,
                'Enter a CAD description or upload a 2D PDF / Image to synthesize 3D geometry...',
                '3B geometri sentezlemek için bir CAD tanımı yazın veya Görsel / 2D PDF teknik resim yükleyin...'
              )}
            </div>
          )}
        </div>

        {/* ─── Modal Actions Footer ─── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[var(--bg-1)] border-t border-[var(--line)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!activeSolid}
              onClick={handleDownloadStep}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--cyan)]/40 bg-[var(--cyan)]/10 hover:bg-[var(--cyan)]/20 text-[var(--cyan)] text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
              title="Download ISO 10303-21 STEP B-Rep file"
            >
              <Download size={13} />
              <span>STEP İndir (.step)</span>
            </button>

            <button
              type="button"
              disabled={!activeSolid}
              onClick={handleDownloadStl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--line)] bg-[var(--bg-2)] hover:border-[var(--cyan)]/50 text-[var(--ink)] text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
              title="Download 3D STL mesh file"
            >
              <Download size={13} />
              <span>STL İndir (.stl)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-[var(--line)] hover:bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--ink)] text-xs font-bold transition-colors cursor-pointer"
            >
              {t12(language, 'Cancel', 'İptal')}
            </button>

            <button
              type="button"
              disabled={!activeSolid}
              onClick={handleAddToScene}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[var(--cyan)] hover:brightness-110 text-[var(--accent-ink)] text-xs font-extrabold shadow-lg transition-all disabled:opacity-40 cursor-pointer"
            >
              <Plus size={14} />
              <span>{t12(language, 'Add to 3D Viewport', '3B Sahneye Ekle')}</span>
            </button>
          </div>
        </div>

        {/* AI CAD Training & Prompt Engineering Hub Modal */}
        <AegisCadTrainingModal
          isOpen={trainingModalOpen}
          onClose={() => setTrainingModalOpen(false)}
        />
      </div>
    </div>
  );
}
