'use client';

/**
 * ⚡ AEGIS 3D COMMAND BAR (SPOTLIGHT CONSOLE)
 * 
 * Natural Language & Multimodal (Text + Image + 2D PDF) Engineering Command Parser:
 * Connected to /ai-connect API provider + local deterministic modeling engine.
 * Triggered via Ctrl+K, Cmd+K, or Header button.
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Terminal,
  Sparkles,
  ArrowRight,
  X,
  CornerDownLeft,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Loader2,
  KeyRound,
  FileText,
  Trash2,
} from 'lucide-react';
import { useDesignStore, type DesignPart } from '@/design-studio/designStore';
import { triggerCameraView } from '@/design-studio/cadCameraDispatcher';
import {
  parseAegis3DCommand,
  applyCornerBoltPattern,
  applyCenterBore,
  applyLightweightIsogrid,
  applyCenterSlot,
} from '@/design-studio/directModelingEngine';
import {
  generateSolidFromPrompt,
  generateSolidWithAI,
  type GeneratedCadSolid,
} from '@/engines/cad/AegisGenerativeEngine';
import {
  PROVIDERS,
  readAttachmentFile,
  type AIFileAttachment,
} from '@/lib/ai/providers';
import { useAISettings, useAIReady } from '@/lib/ai/aiSettingsStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

interface Aegis3DCommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onNotification?: (msg: string) => void;
  onTriggerOperator?: (op: string) => void;
}

export function Aegis3DCommandBar({
  isOpen,
  onClose,
  onNotification,
  onTriggerOperator,
}: Aegis3DCommandBarProps) {
  const { language } = useI18nStore();
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<AIFileAttachment[]>([]);
  const [isAiBusy, setIsAiBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aiSettings = useAISettings();
  const isAiReady = useAIReady();
  const activeProviderMeta = PROVIDERS[aiSettings.provider];
  const activeModel = aiSettings.models[aiSettings.provider] || activeProviderMeta.defaultModel;

  const selectedPart = useDesignStore((s) => s.getSelected());
  const activeFace = useDesignStore((s) => s.activeFace) || 'top';

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setInput('');
      setAttachments([]);
      setIsAiBusy(false);
    }
  }, [isOpen]);

  const preview = parseAegis3DCommand(input, selectedPart);

  const quickChips = [
    { label: '🎯 S-Bar Kısayol Menüsü [S]', cmd: 's-bar' },
    { label: '⚡ Modal Taşı [G]', cmd: 'grab' },
    { label: '🔄 Modal Döndür [R]', cmd: 'rotate' },
    { label: '🔩 Montaj İlişkileri [J]', cmd: 'mate' },
    { label: '⚙️ Flanş PCD Cıvata Dairesi', cmd: 'pcd' },
    { label: '📊 Malzeme Listesi (BOM)', cmd: 'bom' },
    { label: '🛡️ Çakışma / Clash Kontrolü', cmd: 'clash' },
    { label: '🩺 Tasarım Doktoru & DFM', cmd: 'doctor' },
    { label: '🎓 CAD Akademisi & Eğitim', cmd: 'academy' },
    { label: '🤖 NEMA 23 Motor Braketi', cmd: 'NEMA 23 motor montaj plakası 8mm' },
    { label: '⭕ DN50 PN16 Boru Flanşı', cmd: 'DN50 PN16 boru flanşı 4xM16 PCD 125' },
    { label: '📐 L-Braket 80x80x40mm', cmd: 'L-braket 80x80x40 montaj ayağı' },
    { label: '⚡ Kamalı Mil Ø30x160mm', cmd: 'DIN 6885 kamalı transmisyon mili Ø30x160mm' },
    { label: '⚙️ Z28 M2.5 Düz Dişli', cmd: 'Z28 M2.5 düz dişli çark 25mm' },
    { label: '🔲 Fikstür Taban Plakası', cmd: '160x100x20mm plaka 4xM8 havşa petek hafiflet' },
    { label: '🕳️ Merkeze M8 Delik', cmd: 'merkeze M8 delik' },
    { label: '🔩 4 Köşeye Cıvata', cmd: '4 köşeye cıvata M6' },
    { label: '🐝 %35 Hafifletme', cmd: 'hafiflet isogrid' },
    { label: '💎 6061-T6 Alüminyum', cmd: 'alüminyum 6061' },
  ];

  const addGeneratedSolidToStore = (generated: GeneratedCadSolid) => {
    const store = useDesignStore.getState();
    store.pushHistory();

    if (generated.assemblyParts && generated.assemblyParts.length > 0) {
      const assemblyParts = generated.assemblyParts;
      useDesignStore.setState((s) => ({
        parts: [...s.parts, ...assemblyParts],
        selectedId: assemblyParts[0]?.id || null,
      }));
      if (generated.materialId) {
        store.setSelectedMaterialId(generated.materialId);
      }
      setTimeout(() => triggerCameraView('fit'), 100);
      onNotification?.(
        language === 'tr'
          ? `⚡ "${generated.name}" (${assemblyParts.length} parçalı montaj) 3B çalışma alanına eklendi!`
          : `⚡ "${generated.name}" (${assemblyParts.length} parts assembly) added to 3D scene!`
      );
      onClose();
      return;
    }

    const newPartId = `solid-${Date.now().toString(36)}`;
    const newPart: DesignPart = {
      id: newPartId,
      name: generated.name,
      kind: generated.kind,
      params: generated.params,
      outer: generated.outer,
      inner: generated.inner,
      solidOp: generated.solidOp,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: generated.color,
      visible: true,
      locked: false,
      parentId: null,
      holes: generated.holes || [],
      cuts: generated.cuts || [],
    };

    useDesignStore.setState((s) => ({
      parts: [...s.parts, newPart],
      selectedId: newPartId,
      holes: generated.holes || [],
      cuts: generated.cuts || [],
    }));

    if (generated.materialId) {
      store.setSelectedMaterialId(generated.materialId);
    }

    setTimeout(() => triggerCameraView('fit'), 100);

    const dfmNote = generated.dfm ? ` (DFM: %${generated.dfm.score})` : '';
    const massNote = generated.estimatedMassKg ? ` · ${generated.estimatedMassKg} kg` : '';
    onNotification?.(
      language === 'tr'
        ? `⚡ 3B Katı Model Üretildi: ${generated.name}${massNote}${dfmNote}`
        : `⚡ 3D Solid Model Generated: ${generated.name}${massNote}${dfmNote}`
    );
    onClose();
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const loaded: AIFileAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        loaded.push(await readAttachmentFile(files[i]));
      } catch (e) {
        console.error(e);
      }
    }
    if (loaded.length > 0) {
      setAttachments((prev) => [...prev, ...loaded]);
    }
  };

  const handleAiSynthesize = async () => {
    if (!input.trim() && attachments.length === 0) return;
    setIsAiBusy(true);
    try {
      const generated = await generateSolidWithAI(input, attachments);
      addGeneratedSolidToStore(generated);
    } catch (err: any) {
      onNotification?.(
        err?.message ||
          t12(
            language,
            'AI synthesis failed. Check /ai-connect settings.',
            'AI çizim sentezi başarısız oldu. /ai-connect ayarlarını kontrol edin.'
          )
      );
    } finally {
      setIsAiBusy(false);
    }
  };

  const handleExecute = async (cmdToRun?: string) => {
    const finalCmd = cmdToRun || input;
    if (!finalCmd.trim() && attachments.length === 0) return;

    // If files (Image or 2D PDF) are attached, always use AI synthesis
    if (attachments.length > 0 && !cmdToRun) {
      await handleAiSynthesize();
      return;
    }

    const store = useDesignStore.getState();
    const part = store.getSelected();
    const res = parseAegis3DCommand(finalCmd, part);

    const isCreationIntent =
      !part ||
      /yap|üret|tasarla|oluştur|çiz|ciz|yeni|plaka|flanş|flans|flange|braket|bracket|mil|shaft|dişli|disli|gear|somun|nut|cıvata|civata|bolt|nema|kutu|enclosure|profil|profile|tube|boru|create|make|generate|draw/i.test(
        finalCmd
      );

    // If command is not an in-place face modification OR creation intent is detected:
    if (!res.recognized || isCreationIntent) {
      try {
        const generated = generateSolidFromPrompt(finalCmd);
        if (generated) {
          addGeneratedSolidToStore(generated);
          return;
        }
      } catch (err) {
        console.error('Text-to-CAD synthesis failed:', err);
      }
    }

    if (!res.recognized) {
      onNotification?.(
        t12(
          language,
          `Command not recognized: "${finalCmd}"`,
          `Komut anlaşılamadı: "${finalCmd}"`
        )
      );
      return;
    }

    if (res.action === 'operator' && res.details?.operator) {
      onTriggerOperator?.(res.details.operator);
      onNotification?.(language === 'tr' ? res.messageTr : res.messageEn);
      onClose();
      return;
    }

    store.pushHistory();

    if (res.action === 'resize' && part && res.details) {
      const p = { ...(part.params || {}) };
      if (res.details.width) p.width = res.details.width;
      if (res.details.height) p.height = res.details.height;
      if (res.details.depth) p.depth = res.details.depth;
      if (res.details.diameter) p.diameter = res.details.diameter;
      if (res.details.length) p.length = res.details.length;

      let newName = part.name;
      if (p.width && p.height && p.depth) {
        newName = `${part.kind.toUpperCase()} ${p.width}x${p.height}x${p.depth}`;
      }
      store.updatePartParams(part.id, p);
      store.updatePart(part.id, { name: newName });
    } else if (res.action === 'hole' && part && res.details) {
      const dia = res.details.diameterMm || 10;
      const bore = applyCenterBore(part, activeFace, dia, 'clearance');
      const updatedHoles = [...(part.holes || []), bore];
      useDesignStore.setState({
        holes: updatedHoles,
        parts: store.parts.map((p) => (p.id === part.id ? { ...p, holes: updatedHoles } : p)),
      });
    } else if (res.action === 'bolts' && part && res.details) {
      const boltSize = res.details.boltSize || 'M6';
      const bolts = applyCornerBoltPattern(part, activeFace, boltSize);
      if (bolts.length > 0) {
        const updatedHoles = [...(part.holes || []), ...bolts];
        useDesignStore.setState({
          holes: updatedHoles,
          parts: store.parts.map((p) => (p.id === part.id ? { ...p, holes: updatedHoles } : p)),
        });
      }
    } else if (res.action === 'lightweight' && part) {
      const pockets = applyLightweightIsogrid(part, activeFace, 4, 5);
      if (pockets.length > 0) {
        const updatedCuts = [...(part.cuts || []), ...pockets];
        useDesignStore.setState({
          cuts: updatedCuts,
          parts: store.parts.map((p) => (p.id === part.id ? { ...p, cuts: updatedCuts } : p)),
        });
      }
    } else if (res.action === 'slot' && part && res.details) {
      const w = res.details.widthMm || 12;
      const l = res.details.lengthMm || 40;
      const slot = applyCenterSlot(part, activeFace, w, l, 5);
      const updatedCuts = [...(part.cuts || []), slot];
      useDesignStore.setState({
        cuts: updatedCuts,
        parts: store.parts.map((p) => (p.id === part.id ? { ...p, cuts: updatedCuts } : p)),
      });
    } else if (res.action === 'material' && part && res.details) {
      store.setSelectedMaterialId(res.details.materialId);
    } else if (res.action === 'duplicate' && part) {
      store.duplicateSelectedPart();
    }

    onNotification?.(language === 'tr' ? res.messageTr : res.messageEn);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 animate-in fade-in duration-100 font-mono select-none">
      <div className="w-full max-w-2xl rounded-[var(--radius-l)] bg-[var(--bg-0)] border border-[var(--cyan)]/50 shadow-2xl overflow-hidden flex flex-col text-[var(--ink)]">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[var(--line)] bg-[var(--bg-1)]">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--cyan)]">
            <Terminal size={14} />
            <span>{t12(language, 'AeGiS 3D NATURAL LANGUAGE & AI COMMAND CONSOLE', 'AeGiS 3D DOĞAL MÜHENDİSLİK & AI KOMUT PALETİ')}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[var(--alu-dim)]">
            <Link
              href="/ai-connect/"
              className={`flex items-center gap-1 px-2 py-0.5 rounded border font-bold ${
                isAiReady
                  ? 'bg-[var(--ok)]/15 border-[var(--ok)]/40 text-[var(--ok)]'
                  : 'bg-[var(--warn)]/15 border-[var(--warn)]/40 text-[var(--warn)]'
              }`}
              title="AI Sağlayıcı ve API Anahtarı Ayarları (/ai-connect)"
            >
              <KeyRound size={10} />
              <span>{isAiReady ? `${activeProviderMeta.name.split(' ')[0]} (${activeModel})` : 'API Bağla'}</span>
            </Link>
            <span className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)]">ESC: Çıkış</span>
            <button
              onClick={onClose}
              className="p-1 rounded text-[var(--alu-dim)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Input Field + Attach Image/PDF + Run/AI Buttons */}
        <div className="flex items-center gap-2 px-3.5 py-3 bg-[var(--bg-0)] border-b border-[var(--line)]">
          <Sparkles size={16} className="text-[var(--cyan)] shrink-0 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedPart
                ? t12(
                    language,
                    `Command for ${selectedPart.name} or attach 2D PDF / Image...`,
                    `${selectedPart.name} için komut yazın veya Görsel / 2D PDF ekleyin...`
                  )
                : t12(
                    language,
                    'Type command or attach Image/2D PDF (e.g. 120x80x15, M6 bolt)...',
                    'Komut yazın veya Görsel / 2D PDF ekleyin (Örn: 120x80x15, M6 civata)...'
                  )
            }
            className="w-full bg-transparent text-sm text-[var(--ink)] focus:outline-none placeholder:text-[var(--muted)] font-mono"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf,.pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:border-[var(--cyan)] border border-[var(--line)] text-[var(--ink)] font-bold text-[10.5px] flex items-center gap-1 cursor-pointer shrink-0"
            title={t12(language, 'Attach Image (PNG/JPG) or 2D PDF Drawing', 'Görsel (PNG/JPG) veya 2D PDF Teknik Resim Yükle')}
          >
            <Paperclip size={12} className="text-[var(--cyan)]" />
            <span className="hidden sm:inline">{t12(language, 'Image / PDF', 'Görsel / PDF')}</span>
          </button>

          <button
            type="button"
            onClick={handleAiSynthesize}
            disabled={isAiBusy || (!input.trim() && attachments.length === 0)}
            className="px-2.5 py-1.5 rounded-[var(--radius-s)] bg-[var(--cyan)]/20 hover:bg-[var(--cyan)]/30 border border-[var(--cyan)]/50 disabled:opacity-40 text-[var(--cyan)] font-extrabold text-[11px] flex items-center gap-1 cursor-pointer transition-all shrink-0"
            title={t12(language, 'Synthesize custom 3D part via connected AI API', 'Bağlı AI API anahtarı ile özel 3B parça çiz')}
          >
            {isAiBusy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            <span>{t12(language, 'AI Draw', 'AI ile Çiz')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleExecute()}
            disabled={isAiBusy || (!input.trim() && attachments.length === 0)}
            className="px-3 py-1.5 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:brightness-110 disabled:opacity-40 text-[var(--accent-ink)] font-extrabold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-md active:scale-95 shrink-0"
          >
            <span>{t12(language, 'Run', 'Uygula')}</span>
            <CornerDownLeft size={12} />
          </button>
        </div>

        {/* Attached Image / 2D PDF Strip */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 bg-[var(--bg-1)] border-b border-[var(--line)] flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-[var(--cyan)]">
              {t12(language, 'Attached:', 'Eklenen Çizimler:')}
            </span>
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[10.5px]"
              >
                {att.mimeType.startsWith('image/') ? (
                  <img src={att.dataUrl} alt={att.name} className="w-4 h-4 object-cover rounded" />
                ) : (
                  <FileText size={12} className="text-[var(--cyan)]" />
                )}
                <span className="font-bold text-[var(--ink)] truncate max-w-[150px]">{att.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-[var(--alu-dim)] hover:text-[var(--bad)] cursor-pointer"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Live Intent Preview */}
        {input.trim() && (
          <div
            className={`px-4 py-2 text-xs flex items-center gap-2 border-b border-[var(--line)] ${
              preview.recognized
                ? 'bg-[var(--ok)]/15 text-[var(--ok)]'
                : 'bg-[var(--warn)]/15 text-[var(--warn)]'
            }`}
          >
            {preview.recognized ? (
              <CheckCircle2 size={14} className="shrink-0 text-[var(--ok)]" />
            ) : (
              <AlertCircle size={14} className="shrink-0 text-[var(--warn)]" />
            )}
            <div className="flex-1 min-w-0">
              <span className="font-bold">
                {language === 'tr' ? preview.messageTr : preview.messageEn}
              </span>
            </div>
            {preview.recognized && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--ok)]/20 text-[var(--ok)] border border-[var(--ok)]/30 shrink-0 uppercase font-bold">
                {preview.action}
              </span>
            )}
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-[var(--bg-1)] flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-[var(--alu-dim)] font-bold mr-1">
            {t12(language, 'Quick Suggestions:', 'Hızlı Şablonlar:')}
          </span>
          {quickChips.map((chip) => (
            <button
              key={chip.cmd}
              type="button"
              onClick={() => {
                setInput(chip.cmd);
                handleExecute(chip.cmd);
              }}
              className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--cyan)]/20 border border-[var(--line)] hover:border-[var(--cyan)]/40 text-[10.5px] text-[var(--ink)] hover:text-[var(--cyan)] transition-all cursor-pointer flex items-center gap-1"
            >
              <span>{chip.label}</span>
              <ArrowRight size={10} className="opacity-50" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
