'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Sparkles, Check, ArrowRight, ShieldCheck, Key } from 'lucide-react';
import { useLicenseStore } from '@/store/licenseStore';
import { useI18nStore } from '@/store/i18nStore';
import { getChrome } from '@/locales/chromeTranslations';

export function UpgradeModal() {
  const { isUpgradeModalOpen, upgradeModalFeature, closeUpgradeModal, activate, plan } = useLicenseStore();
  const { language } = useI18nStore();
  const c = getChrome(language);

  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [activationMsg, setActivationMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!isUpgradeModalOpen) return null;

  const handleActivate = () => {
    if (!licenseKeyInput.trim()) return;
    const res = activate(licenseKeyInput);
    setActivationMsg({ ok: res.ok, text: res.message });
    if (res.ok) {
      setTimeout(() => {
        closeUpgradeModal();
      }, 1200);
    }
  };

  const featureText =
    upgradeModalFeature === 'pdf'
      ? { title: c.pdfTitle, desc: c.pdfDesc }
      : upgradeModalFeature === 'dxf'
        ? { title: c.dxfTitle, desc: c.dxfDesc }
        : upgradeModalFeature === 'step'
          ? { title: c.stepTitle, desc: c.stepDesc }
          : { title: c.limitTitle, desc: c.limitDesc };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0a0e1a] border border-cyan-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,229,255,0.15)] space-y-6 text-slate-200 font-sans">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeUpgradeModal}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Top Header Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">
              {featureText.title}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {featureText.desc}
            </p>
          </div>
        </div>

        {/* Pro Plan Feature Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 via-cyan-950/20 to-black/60 border border-cyan-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400 font-mono">
              {c.proUpgrade}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              $15.8 / mo
            </span>
          </div>

          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <Check size={14} className="text-emerald-400 shrink-0" />
              <span>{c.unlimitedExports}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} className="text-emerald-400 shrink-0" />
              <span>{c.unwatermarked}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} className="text-emerald-400 shrink-0" />
              <span>{c.unlimitedNesting}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} className="text-emerald-400 shrink-0" />
              <span>{c.localBom}</span>
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Link
            href="/pricing"
            onClick={closeUpgradeModal}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs uppercase tracking-wider hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)]"
          >
            <span>{c.explorePro}</span>
            <ArrowRight size={14} />
          </Link>

          {/* Quick License Key Activation */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <Key size={12} className="text-amber-400" />
              <span>{c.haveKey}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={licenseKeyInput}
                onChange={(e) => setLicenseKeyInput(e.target.value)}
                placeholder="ALU-PRO-XXXXXXXX"
                className="flex-1 rounded-xl bg-black/60 border border-white/15 px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={handleActivate}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold transition-all"
              >
                {c.activate}
              </button>
            </div>
            {activationMsg && (
              <p className={`text-[11px] font-mono ${activationMsg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                {activationMsg.text}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;
