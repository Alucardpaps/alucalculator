'use client';

import React, { useState } from 'react';
import { Award, CheckCircle2, Download, ShieldCheck, X, Sparkles, Key } from 'lucide-react';
import jsPDF from 'jspdf';
import { useI18nStore } from '@/store/i18nStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  completedCount?: number;
  unitTitle?: string;
  unitStandard?: string;
  score?: number;
  xp?: number;
}

export function CertificateModal({
  isOpen,
  onClose,
  completedCount = 1,
  unitTitle = 'Comprehensive Computational Engineering',
  unitStandard = 'ISO / DIN / VDI Standards',
  score = 100,
  xp = 500,
}: Props) {
  const { language } = useI18nStore();
  const tr = language === 'tr';

  const [name, setName] = useState('Engineering Scholar');
  const dateStr = new Date().toISOString().slice(0, 10);
  
  // Generate deterministic verification code based on name + date + unitTitle
  const generateVerificationCode = () => {
    const raw = `${name}-${unitTitle}-${dateStr}-ALUCALC-V51`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `ACAD-V51-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
  };

  const verificationCode = generateVerificationCode();

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Dark Executive Background
    doc.setFillColor(8, 12, 20);
    doc.rect(0, 0, 297, 210, 'F');

    // Outer Cyan / Gold Tech Border
    doc.setDrawColor(0, 229, 255);
    doc.setLineWidth(1.8);
    doc.rect(10, 10, 277, 190);

    // Inner Subtle Frame
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.rect(14, 14, 269, 182);

    // Corner Tech Brackets
    doc.setDrawColor(0, 229, 255);
    doc.setLineWidth(1.2);
    // Top-left
    doc.line(10, 25, 25, 25);
    doc.line(25, 10, 25, 25);
    // Top-right
    doc.line(287, 25, 272, 25);
    doc.line(272, 10, 272, 25);
    // Bottom-left
    doc.line(10, 185, 25, 185);
    doc.line(25, 200, 25, 185);
    // Bottom-right
    doc.line(287, 185, 272, 185);
    doc.line(272, 200, 272, 185);

    // Header Title
    doc.setTextColor(0, 229, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ALUCALC ENGINEERING ACADEMY', 148.5, 38, { align: 'center' });

    doc.setTextColor(200, 215, 235);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATE OF TECHNICAL MASTERY', 148.5, 48, { align: 'center' });

    // Recipient Section
    doc.setTextColor(140, 160, 185);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('This official certificate is proudly awarded to', 148.5, 68, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(name.toUpperCase(), 148.5, 84, { align: 'center' });

    // Unit & Standard Details
    doc.setTextColor(0, 229, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Unit: ${unitTitle}`, 148.5, 102, { align: 'center' });

    doc.setTextColor(245, 158, 11);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Applied Standard: ${unitStandard}`, 148.5, 110, { align: 'center' });

    // Achievement Statement
    doc.setTextColor(170, 185, 205);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'for successfully mastering normative engineering formulas, practical calculations, and passing',
      148.5,
      124,
      { align: 'center' }
    );
    doc.text(
      `the technical validation examination with an evaluated accuracy score of ${score}%.`,
      148.5,
      131,
      { align: 'center' }
    );

    // Metadata Strip (Verification Code & Date)
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(30, 142, 237, 14, 2, 2, 'F');

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`VERIFICATION CODE: ${verificationCode}`, 40, 151);
    doc.text(`DATE ISSUED: ${dateStr}`, 148.5, 151, { align: 'center' });
    doc.text(`CURRICULUM PROGRESS: ${completedCount} / 15 UNITS`, 255, 151, { align: 'right' });

    // Signatures
    doc.setTextColor(100, 115, 135);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    doc.line(45, 178, 105, 178);
    doc.text('AEGIS COMPUTATIONAL ENGINE', 75, 183, { align: 'center' });

    doc.line(192, 178, 252, 178);
    doc.text('DIRECTOR OF ACADEMIC STANDARDS', 222, 183, { align: 'center' });

    doc.save(`AluCalc_Certificate_${name.replace(/\s+/g, '_')}_${unitTitle.replace(/\s+/g, '_').slice(0, 20)}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-cyan-500/30 bg-[#080d16] p-6 sm:p-8 text-slate-200 shadow-2xl font-sans space-y-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X size={18} />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Award size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">
              {tr ? 'Mühendislik Başarı Sertifikası' : 'Engineering Mastery Certificate'}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {unitTitle} · {unitStandard}
            </p>
          </div>
        </div>

        {/* Name Input */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-slate-300">
            {tr ? 'Sertifikada Görünecek İsim' : 'Recipient Name on Certificate'}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ad Soyad / Full Name"
            className="w-full rounded-xl bg-black/60 border border-white/15 px-4 py-2.5 text-sm text-white font-bold outline-none focus:border-cyan-400"
          />
        </div>

        {/* Verification Preview Card */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 font-mono text-xs text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-500">{tr ? 'Doğrulama Kodu:' : 'Verification Code:'}</span>
            <span className="text-cyan-400 font-bold">{verificationCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{tr ? 'Sınav Puanı:' : 'Score:'}</span>
            <span className="text-emerald-400 font-bold">{score}% (Başarılı)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{tr ? 'Müfredat İlerlemesi:' : 'Progress:'}</span>
            <span className="text-amber-400 font-bold">{completedCount} / 15 {tr ? 'Ünite' : 'Units'}</span>
          </div>
        </div>

        {/* Action Download Button */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/25"
          >
            <Download size={15} />
            <span>{tr ? 'Resmi PDF Sertifikasını İndir' : 'Download Verified PDF Certificate'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CertificateModal;
