'use client';

/**
 * 🎓 ALUCAD OS — AEGIS CAD AI TRAINING & PROMPT ENGINEERING HUB MODAL
 * 
 * Allows engineers to inspect, copy, and download the exact training dataset,
 * coordinate axioms, and visual decomposition guidelines used by the CAD kernel,
 * enabling standard LLMs (GPT-4o, Claude, Gemini, DeepSeek, Puter, Ollama)
 * to reliably produce grounded, non-floating, fully articulated 3D CAD models.
 */

import React, { useState } from 'react';
import {
  GraduationCap,
  X,
  Copy,
  Check,
  Download,
  BookOpen,
  Sparkles,
  Layers,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import {
  MASTER_AI_CAD_TRAINING_PROMPT,
  CAD_COORDINATE_AXIOMS,
  IMAGE_VISUAL_DECOMPOSITION_PROTOCOL,
  FEW_SHOT_CAD_TRAINING_EXAMPLES,
  getAiCadTrainingDocumentation,
} from '@/engines/cad/training/AegisCadTrainingKnowledge';
import { MASTER_2D_CAD_TRAINING_PROMPT } from '@/engines/cad/Aegis2DCadEngine';
import { MASTER_FLOW_AI_TRAINING_PROMPT } from '@/flow/engine/AegisFlowEngine';
import { downloadFile } from '@/design-studio/exporter';
import { useI18nStore } from '@/store/i18nStore';

interface AegisCadTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: '3d' | '2d' | 'flow' | 'axioms' | 'examples';
}

export function AegisCadTrainingModal({ isOpen, onClose, initialTab = '3d' }: AegisCadTrainingModalProps) {
  const { language } = useI18nStore();
  const isTr = language === 'tr';
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'3d' | '2d' | 'flow' | 'axioms' | 'examples'>(initialTab);

  if (!isOpen) return null;

  const getActivePromptContent = () => {
    if (activeTab === '2d') return MASTER_2D_CAD_TRAINING_PROMPT;
    if (activeTab === 'flow') return MASTER_FLOW_AI_TRAINING_PROMPT;
    return MASTER_AI_CAD_TRAINING_PROMPT;
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(getActivePromptContent());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadTrainingDoc = () => {
    const doc = getAiCadTrainingDocumentation();
    downloadFile(doc, 'AluCAD_AI_CAD_Training_Knowledge_Base.md', 'text/markdown');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in select-none">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] shadow-2xl overflow-hidden font-mono text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] bg-[var(--bg-2)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[var(--radius-s)] bg-[var(--cyan)]/20 border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)]">
              <GraduationCap size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                <span>{isTr ? 'AI CAD Eğitim & Sistem Kılavuzu' : 'AI CAD Training & System Guide'}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {isTr ? 'Eğitim Modu Aktif' : 'Trained Mode Active'}
                </span>
              </h2>
              <p className="text-[11px] text-[var(--muted)]">
                {isTr
                  ? 'Standart AI API\'lerinin 3B CAD koordinatlarını ve montaj mantığını anlamasını sağlayan eğitim veri seti'
                  : 'In-context CAD training dataset ensuring standard LLM APIs produce physically grounded 3D geometry'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[var(--radius-s)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-3)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation & Action Bar */}
        <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-[var(--line)] bg-[var(--bg-0)] gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setActiveTab('3d')}
              className={`px-2.5 py-1.5 rounded-[var(--radius-s)] text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === '3d'
                  ? 'bg-[var(--cyan)] text-black'
                  : 'bg-[var(--bg-2)] text-[var(--ink)] hover:bg-[var(--bg-3)]'
              }`}
            >
              <Cpu size={13} />
              <span>{isTr ? '3B CAD Eğitimi' : '3D CAD Training'}</span>
            </button>
            <button
              onClick={() => setActiveTab('2d')}
              className={`px-2.5 py-1.5 rounded-[var(--radius-s)] text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === '2d'
                  ? 'bg-cyan-400 text-black'
                  : 'bg-[var(--bg-2)] text-[var(--ink)] hover:bg-[var(--bg-3)]'
              }`}
            >
              <Cpu size={13} />
              <span>{isTr ? '2B Çizim Eğitimi' : '2D CAD Training'}</span>
            </button>
            <button
              onClick={() => setActiveTab('flow')}
              className={`px-2.5 py-1.5 rounded-[var(--radius-s)] text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'flow'
                  ? 'bg-amber-400 text-black'
                  : 'bg-[var(--bg-2)] text-[var(--ink)] hover:bg-[var(--bg-3)]'
              }`}
            >
              <Cpu size={13} />
              <span>{isTr ? 'Flow Hesap Eğitimi' : 'Flow Training'}</span>
            </button>
            <button
              onClick={() => setActiveTab('axioms')}
              className={`px-2.5 py-1.5 rounded-[var(--radius-s)] text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'axioms'
                  ? 'bg-[var(--cyan)] text-black'
                  : 'bg-[var(--bg-2)] text-[var(--ink)] hover:bg-[var(--bg-3)]'
              }`}
            >
              <Layers size={13} />
              <span>{isTr ? 'Koordinat Kuralları' : 'Axioms'}</span>
            </button>
            <button
              onClick={() => setActiveTab('examples')}
              className={`px-2.5 py-1.5 rounded-[var(--radius-s)] text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'examples'
                  ? 'bg-[var(--cyan)] text-black'
                  : 'bg-[var(--bg-2)] text-[var(--ink)] hover:bg-[var(--bg-3)]'
              }`}
            >
              <Sparkles size={13} />
              <span>{isTr ? 'Örnekler' : 'Exemplars'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPrompt}
              className="px-2.5 py-1.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-[var(--ink)] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isTr ? 'Aktif Sekmedeki Prompt Metnini Kopyala (OpenAI GPT, Claude veya Ollama için)' : 'Copy active prompt to clipboard'}
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? (isTr ? 'Kopyalandı!' : 'Copied!') : (isTr ? 'Promptu Kopyala' : 'Copy Prompt')}</span>
            </button>
            <button
              onClick={handleDownloadTrainingDoc}
              className="px-2.5 py-1.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-[var(--cyan)] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isTr ? 'Eğitim Dosyasını İndir (.md)' : 'Download training knowledge base (.md)'}
            >
              <Download size={13} />
              <span>{isTr ? 'Dosyayı İndir (.md)' : 'Download (.md)'}</span>
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px]">
          {activeTab === '3d' && (
            <div className="space-y-3">
              <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--muted)] leading-relaxed">
                <span className="text-[var(--cyan)] font-bold">ℹ️ {isTr ? '3B CAD Sistemi Nasıl Çalışır?' : 'How 3D CAD Works:'}</span>{' '}
                {isTr
                  ? 'Aşağıdaki sistem promptu, AluCAD OS üzerindeki her 3B CAD API çağrısına otomatik olarak entegre edilmiştir. Bu sayede genel amaçlı yapay zeka modelleri parçaları havada asılı bırakmaz; Zemin Y=0 seviyesinden başlayarak ayakları, tablaları, bölücü panelleri ve monitörleri tam matematiksel koordinatlarıyla çizer.'
                  : 'The master training prompt below is automatically prepended to every 3D CAD synthesis API call, instructing LLMs on floor-grounding (Y=0), bounding-box centers, stacking heights, and assembly symmetry.'}
              </div>
              <pre className="p-3 rounded-[var(--radius-s)] bg-black/60 border border-[var(--line)] text-slate-200 overflow-x-auto text-[10.5px] whitespace-pre-wrap leading-relaxed">
                {MASTER_AI_CAD_TRAINING_PROMPT}
              </pre>
            </div>
          )}

          {activeTab === '2d' && (
            <div className="space-y-3">
              <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--muted)] leading-relaxed">
                <span className="text-cyan-400 font-bold">ℹ️ {isTr ? '2B CAD Teknik Çizim Motoru Nasıl Çalışır?' : 'How 2D CAD Works:'}</span>{' '}
                {isTr
                  ? 'Aşağıdaki sistem promptu, 2B teknik çizim ve plan oluştururken ISO 128 ve DIN 2768 standartlarına göre eksen çizgileri (CENTER kırmızı), ana konturlar (#00e5ff), ve ölçülendirmeleri (DIMENSIONS sarı) tam koordinatlarıyla üretir.'
                  : 'This prompt instructs LLMs on ISO 128 / DIN 2768 technical drafting standards, centerlines, main contours, and dimension entities.'}
              </div>
              <pre className="p-3 rounded-[var(--radius-s)] bg-black/60 border border-[var(--line)] text-cyan-200 overflow-x-auto text-[10.5px] whitespace-pre-wrap leading-relaxed">
                {MASTER_2D_CAD_TRAINING_PROMPT}
              </pre>
            </div>
          )}

          {activeTab === 'flow' && (
            <div className="space-y-3">
              <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--muted)] leading-relaxed">
                <span className="text-amber-400 font-bold">ℹ️ {isTr ? 'Flow Hesap & Akış Motoru Nasıl Çalışır?' : 'How Flow Engine Works:'}</span>{' '}
                {isTr
                  ? 'Aşağıdaki sistem promptu, mühendislik gereksinimlerini DIN 3960, DIN 743, ISO 281 ve Eurocode standartlarına uygun tam bağlı bir hesaplama grafiğine dönüştürür ve hesaplanan boyutları 2B/3B CAD ortamına aktarır.'
                  : 'This prompt trains LLMs to construct deterministic engineering calculation pipelines (Flow Engine) connecting motor, gear, shaft, bearing, beam and pressure vessel equations.'}
              </div>
              <pre className="p-3 rounded-[var(--radius-s)] bg-black/60 border border-[var(--line)] text-amber-200 overflow-x-auto text-[10.5px] whitespace-pre-wrap leading-relaxed">
                {MASTER_FLOW_AI_TRAINING_PROMPT}
              </pre>
            </div>
          )}

          {activeTab === 'axioms' && (
            <div className="space-y-4">
              <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-2">
                <h3 className="font-bold text-[var(--cyan)] flex items-center gap-1.5 text-xs">
                  <CheckCircle2 size={14} />
                  <span>{isTr ? 'Temel CAD Geometri & Yerçekimi Kuralları' : 'Core CAD Geometry Axioms'}</span>
                </h3>
                <pre className="text-slate-300 text-[10.5px] whitespace-pre-wrap leading-relaxed">
                  {CAD_COORDINATE_AXIOMS}
                </pre>
              </div>

              <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-2">
                <h3 className="font-bold text-[var(--cyan)] flex items-center gap-1.5 text-xs">
                  <BookOpen size={14} />
                  <span>{isTr ? 'Görsel Analiz & CAD Ayrıştırma Protokolü' : 'Image-to-CAD Protocol'}</span>
                </h3>
                <pre className="text-slate-300 text-[10.5px] whitespace-pre-wrap leading-relaxed">
                  {IMAGE_VISUAL_DECOMPOSITION_PROTOCOL}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'examples' && (
            <div className="space-y-3">
              <div className="text-[var(--muted)] text-[11px]">
                {isTr
                  ? 'Aşağıda sisteme öğretilmiş ground-truth CAD montaj eğitim örnekleri listelenmektedir. Yüklediğiniz 4\'lü ofis masası görseli de bu standartlar dahilinde eğitilmiştir.'
                  : 'Ground-truth CAD training exemplars trained into the system, including 4-person cross workstation pod and 6-axis industrial robots:'}
              </div>

              {FEW_SHOT_CAD_TRAINING_EXAMPLES.map((ex, i) => (
                <div key={i} className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-2">
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                    <span className="font-bold text-[var(--ink)]">
                      {i + 1}. {ex.prompt}
                    </span>
                    <span className="text-[10px] text-[var(--cyan)] font-bold">
                      {ex.output.parts
                        ? `${ex.output.parts.length} ${isTr ? 'Parçalı Montaj' : 'Parts Assembly'}`
                        : (isTr ? 'Tekil Katı Parça' : 'Single Solid')}
                    </span>
                  </div>
                  <pre className="p-2.5 rounded bg-black/50 text-slate-300 text-[10px] overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(ex.output, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--line)] bg-[var(--bg-2)] shrink-0 text-[11px] text-[var(--muted)]">
          <span>{isTr ? 'AluCAD OS · AeGiS Generative In-Context Training System' : 'AluCAD OS · Generative CAD Kernel'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:brightness-110 text-black font-bold transition-all"
          >
            {isTr ? 'Anladım & Kapat' : 'Got it & Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
