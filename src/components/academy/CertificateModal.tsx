'use client';

import React, { useState } from 'react';
import { Award, CheckCircle2, Download, ShieldCheck, X, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  completedCount: number;
  xp: number;
}

export function CertificateModal({ isOpen, onClose, completedCount, xp }: Props) {
  const [name, setName] = useState('Engineering Scholar');

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Background
    doc.setFillColor(10, 14, 23);
    doc.rect(0, 0, 297, 210, 'F');

    // Border
    doc.setDrawColor(0, 229, 255);
    doc.setLineWidth(2);
    doc.rect(10, 10, 277, 190);

    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.rect(14, 14, 269, 182);

    // Header
    doc.setTextColor(0, 229, 255);
    doc.setFontSize(26);
    doc.text('ALUCALC ENGINEERING ACADEMY', 148.5, 45, { align: 'center' });

    doc.setTextColor(200, 210, 230);
    doc.setFontSize(14);
    doc.text('CERTIFICATE OF TECHNICAL EXCELLENCE', 148.5, 58, { align: 'center' });

    // Recipient
    doc.setTextColor(150, 160, 180);
    doc.setFontSize(11);
    doc.text('This is proudly presented to', 148.5, 80, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text(name.toUpperCase(), 148.5, 96, { align: 'center' });

    // Body text
    doc.setTextColor(160, 175, 200);
    doc.setFontSize(11);
    doc.text(
      'for successfully mastering computational engineering fundamentals, ISO/DIN manufacturing standards,',
      148.5,
      115,
      { align: 'center' }
    );
    doc.text(
      'and machine element design equations with verified laboratory practice in AluCalc OS.',
      148.5,
      123,
      { align: 'center' }
    );

    // Stats
    doc.setTextColor(0, 229, 255);
    doc.setFontSize(12);
    doc.text(`Mastery Score: ${xp} XP   ·   Units Completed: ${Math.max(completedCount, 1)} / 113 Units   ·   Verified ISO/DIN Standard`, 148.5, 145, {
      align: 'center',
    });

    // Signatures
    doc.setTextColor(100, 115, 135);
    doc.setFontSize(9);
    doc.text('AEGIS COMPUTATIONAL ENGINE', 70, 175, { align: 'center' });
    doc.line(40, 170, 100, 170);

    doc.text('DIRECTOR OF ACADEMIC STANDARDS', 227, 175, { align: 'center' });
    doc.line(197, 170, 257, 170);

    doc.save(`AluCalc_Engineering_Certificate_${name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-cyan-500/30 bg-[#080d16] p-6 text-slate-200 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Award size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-wider text-white">
              Verified Engineering Certificate
            </h3>
            <p className="text-xs text-slate-400">
              AluCalc Academy · ISO / DIN Computational Mastery
            </p>
          </div>
        </div>

        {/* Certificate Preview Card */}
        <div className="rounded-2xl border border-white/10 bg-black/50 p-5 text-center space-y-3 my-4">
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 flex items-center justify-center gap-1">
            <Sparkles size={12} /> Certificate Preview <Sparkles size={12} />
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Recipient Name</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-xs mx-auto text-center font-bold text-lg text-white bg-white/5 border border-white/15 rounded-xl py-1 px-3 outline-none focus:border-cyan-400"
              placeholder="Your Full Name"
            />
          </div>

          <div className="flex items-center justify-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-white/5">
            <span>Score: <strong className="text-amber-400">{xp} XP</strong></span>
            <span>·</span>
            <span>Units: <strong className="text-cyan-400">{completedCount}/113</strong></span>
            <span>·</span>
            <span className="text-emerald-400 flex items-center gap-1 font-bold">
              <ShieldCheck size={13} /> Verified
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-black uppercase tracking-wider text-black hover:brightness-110 shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <Download size={14} /> Download Official PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default CertificateModal;
