'use client';

import React, { useState } from 'react';
import { X, FileText, Check, Copy, Share2, Mail, MessageSquare } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

interface FieldWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type VerdictType = 'PASS' | 'FAIL' | 'INSPECT';

export function FieldWorkOrderModal({ isOpen, onClose }: FieldWorkOrderModalProps) {
  const { language } = useI18nStore();

  const [jobId, setJobId] = useState<string>('WO-' + new Date().toISOString().slice(2, 10).replace(/-/g, ''));
  const [station, setStation] = useState<string>(t12(language, 'Assembly Line - Station 4', 'Montaj Hattı - İstasyon 4'));
  const [technician, setTechnician] = useState<string>('');
  const [verdict, setVerdict] = useState<VerdictType>('PASS');
  const [notes, setNotes] = useState<string>(
    t12(language, 'Bolt torque, keyway fit, and O-ring gland verified according to technical drawing.', 'Cıvata torku, kama bağlantısı ve O-ring montajı teknik resme uygun tamamlandı.')
  );
  const [copied, setCopied] = useState(false);

  const timestamp = new Date().toLocaleString();

  const formattedReport = `========================================
ALUCALC FIELD | WORK ORDER NOTE
========================================
Job ID:     ${jobId || 'N/A'}
Timestamp:  ${timestamp}
Station:    ${station || 'N/A'}
Technician: ${technician || 'Technician'}
VERDICT:    [${verdict}]
----------------------------------------
Notes & Observations:
${notes}
----------------------------------------
Verified with AluCalc Engineering Platform
https://www.alucalculator.com
========================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedReport).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(formattedReport)}`;
    window.open(url, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`[AluCalc Field] ${jobId} - ${verdict}`);
    const body = encodeURIComponent(formattedReport);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl border border-emerald-500/30 bg-[var(--bg-0)] p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm sm:text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 text-[var(--cyan)]">
              <FileText size={18} />
            </div>
            <div>
              <span className="font-mono">{t12(language, 'Field Work Order & Engineering Note', 'Saha İş Emri & Mühendislik Raporu')}</span>
              <span className="block text-[10px] text-slate-400 font-normal">Export & Share Work Order Summary</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-slate-400 text-[11px]">{t12(language, 'Work Order / Job ID', 'İş Emri No / Job ID')}</label>
            <input
              type="text"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
              placeholder="WO-2026-..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 text-[11px]">{t12(language, 'Technician / Engineer', 'Teknisyen / Mühendis')}</label>
            <input
              type="text"
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
              placeholder={t12(language, 'Name Surname', 'Ad Soyad')}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-slate-400 text-[11px]">{t12(language, 'Station / Machine / Location', 'İstasyon / Makine / Konum')}</label>
            <input
              type="text"
              value={station}
              onChange={(e) => setStation(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
              placeholder={t12(language, 'Line No, Machine ID', 'Hat No, Makine Kodu')}
            />
          </div>
        </div>

        {/* Verdict Chips */}
        <div className="space-y-1.5 font-mono">
          <label className="text-[11px] text-slate-400 uppercase tracking-wider">
            {t12(language, 'Inspection Verdict', 'Saha Muayene Kararı')}
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { id: 'PASS', labelTr: 'UYGUN (PASS)', labelEn: 'PASS', color: 'emerald' },
              { id: 'INSPECT', labelTr: 'İNCELE (INSPECT)', labelEn: 'INSPECT', color: 'amber' },
              { id: 'FAIL', labelTr: 'RED (FAIL)', labelEn: 'FAIL', color: 'red' },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVerdict(v.id as VerdictType)}
                className={`py-2 px-2 rounded-xl border font-black transition min-h-[44px] flex items-center justify-center ${
                  verdict === v.id
                    ? v.id === 'PASS'
                      ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                      : v.id === 'INSPECT'
                      ? 'bg-[var(--cyan)] text-[var(--accent-ink)] border-amber-400 shadow-md'
                      : 'bg-red-500 text-white border-red-400 shadow-md'
                    : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {t12(language, v.labelEn, v.labelTr)}
              </button>
            ))}
          </div>
        </div>

        {/* Notes Textarea */}
        <div className="space-y-1 font-mono text-xs">
          <label className="text-slate-400 text-[11px]">{t12(language, 'Notes & Observations', 'Notlar ve Tespitler')}</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-emerald-400 custom-scrollbar"
            placeholder={t12(language, 'Torque, fits and assembly details...', 'Montaj torku, boşluk ve kontrol detayları...')}
          />
        </div>

        {/* Preview Code Box */}
        <div className="p-3 rounded-2xl bg-black/60 border border-white/10 text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre leading-relaxed select-all">
          {formattedReport}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
          <button
            type="button"
            onClick={handleCopy}
            className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition flex items-center justify-center gap-1.5 min-h-[44px] shadow-lg"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? (t12(language, 'Copied!', 'Kopyalandı!')) : (t12(language, 'Copy Report', 'Panoya Kopyala'))}</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="py-2.5 px-3 rounded-xl bg-[var(--ok)]/20 hover:bg-[var(--ok)]/30 border border-[var(--ok)]/50 text-[var(--ok)] font-bold transition flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <MessageSquare size={14} />
            <span>{t12(language, 'WhatsApp', 'WhatsApp Paylaş')}</span>
          </button>

          <button
            type="button"
            onClick={handleEmail}
            className="py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 font-bold transition flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <Mail size={14} />
            <span>{t12(language, 'Email Note', 'E-Posta Gönder')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default FieldWorkOrderModal;
