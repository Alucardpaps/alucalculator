'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  RefreshCw,
  CheckCircle2,
  FileText,
  Upload,
  ArrowRight,
  X,
  Scale,
} from 'lucide-react';
import { AluPackage } from '../schema';
import { ImportState, importPackage, checkRecalculationDrift } from '../import-package';
import { readPackageFile } from '../channels';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPackage?: (pkg: AluPackage) => void;
  onRecalculate?: (inputs: Record<string, string>) => Record<string, number>;
  initialPackage?: AluPackage | null;
  initialWarning?: string;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onApplyPackage,
  onRecalculate,
  initialPackage,
  initialWarning,
}) => {
  const [importState, setImportState] = useState<ImportState>(() => {
    if (initialPackage) {
      return {
        status: 'ready_static',
        pkg: initialPackage,
        warning: initialWarning,
      };
    }
    return { status: 'idle' };
  });

  const [inputHash, setInputHash] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleProcessHash = async () => {
    if (!inputHash.trim()) return;
    setIsProcessing(true);
    const result = await importPackage(inputHash.trim(), { channel: 'hash' });
    setIsProcessing(false);

    if (result.success) {
      setImportState({
        status: 'ready_static',
        pkg: result.pkg,
        warning: result.warning,
      });
    } else {
      setImportState({
        status: 'failed',
        reason: result.reason,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const fileText = await readPackageFile(file);
      const result = await importPackage(fileText, { channel: 'file' });
      setIsProcessing(false);

      if (result.success) {
        setImportState({
          status: 'ready_static',
          pkg: result.pkg,
          warning: result.warning,
        });
      } else {
        setImportState({
          status: 'failed',
          reason: result.reason,
        });
      }
    } catch (err: unknown) {
      setIsProcessing(false);
      setImportState({
        status: 'failed',
        reason: err instanceof Error ? err.message : 'Dosya okunamadı.',
      });
    }
  };

  const handleRunRecalculate = () => {
    if (importState.status !== 'ready_static' && importState.status !== 'ready_recalculated') {
      return;
    }
    const pkg = importState.pkg;
    if (onRecalculate) {
      const freshOutputs = onRecalculate(pkg.inputs);
      const driftData = checkRecalculationDrift(pkg, freshOutputs);
      setImportState({
        status: 'ready_recalculated',
        pkg,
        drift: driftData.drift,
        hasSignificantDrift: driftData.hasSignificantDrift,
      });
    }
  };

  const handleApply = () => {
    if (
      (importState.status === 'ready_static' || importState.status === 'ready_recalculated') &&
      onApplyPackage
    ) {
      onApplyPackage(importState.pkg);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide text-white flex items-center gap-2">
                <span>AluCalc İçe Aktarma</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono">
                  Fail-Closed Doğrulama
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Kanonik Checksum & Parametrik Bütünlük Kontrolü
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* State 1: IDLE */}
          {importState.status === 'idle' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Paylaşım Bağlantısı veya Hash (#lz=...)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="https://www.alucalculator.com/gear#lz=..."
                    value={inputHash}
                    onChange={(e) => setInputHash(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleProcessHash}
                    disabled={isProcessing || !inputHash.trim()}
                    className="shrink-0 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                  >
                    {isProcessing ? 'Çözülüyor...' : 'Doğrula'}
                  </button>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-800"></div>
                <span className="shrink mx-4 text-xs text-slate-500 font-medium">VEYA</span>
                <div className="grow border-t border-slate-800"></div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Paket Dosyası Yükle (.alucalc.json)
                </label>
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition">
                  <Upload className="w-8 h-8 text-cyan-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-200">
                    .alucalc.json dosyasını seçin veya buraya sürükleyin
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Maksimum 512 KB sıkıştırılmamış JSON
                  </span>
                  <input
                    type="file"
                    accept=".json,.alucalc"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* State 2: FAILED */}
          {importState.status === 'failed' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl flex items-start space-x-3 text-rose-200">
                <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-rose-300">İçe Aktarma Reddedildi (Fail-Closed)</h3>
                  <p className="text-xs text-rose-200/90 break-words">{importState.reason}</p>
                  <p className="text-[11px] text-rose-400/80 mt-2">
                    Güvenlik kuralı gereği bozuk veya doğrulanmamış paketlerin kısmi render edilmesine izin verilmez.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setImportState({ status: 'idle' })}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
                >
                  Yeniden Dene
                </button>
              </div>
            </div>
          )}

          {/* State 3 & 4: READY STATIC or READY RECALCULATED */}
          {(importState.status === 'ready_static' || importState.status === 'ready_recalculated') && (
            <div className="space-y-5">
              {/* Warning if solver build differed */}
              {importState.status === 'ready_static' && importState.warning && (
                <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-start space-x-2.5 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p>{importState.warning}</p>
                </div>
              )}

              {/* Drift notification */}
              {importState.status === 'ready_recalculated' && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start space-x-2.5 text-xs ${
                    importState.hasSignificantDrift
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                      : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  }`}
                >
                  {importState.hasSignificantDrift ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {importState.hasSignificantDrift
                        ? 'Yeniden Hesaplama Sapması (Drift) Tespit Edildi!'
                        : 'Yeniden Hesaplama Birebir Eşleşti.'}
                    </p>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {importState.hasSignificantDrift
                        ? 'Yerel solver sonuçları kayıtlı mühürlü çıktıdan farklılık gösteriyor.'
                        : 'Tüm sonuçlar paket toleransı dahilinde.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Package Metadata Badge */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">
                    {importState.pkg.meta.name || importState.pkg.module}
                  </span>
                  <span className="text-[11px] text-cyan-400 font-mono">
                    Modül: {importState.pkg.module}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 font-mono">
                  <span>Birim: {importState.pkg.meta.unit_system}</span>
                  <span>Build: {importState.pkg.solver_build}</span>
                  <span>Tarih: {importState.pkg.created_at}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 select-all break-all">
                  Checksum: {importState.pkg.checksum}
                </div>
              </div>

              {/* Verified Inputs */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Kayıtlı Girdiler (Inputs)</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-36 overflow-y-auto">
                  {Object.entries(importState.pkg.inputs).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs border-b border-slate-900 py-1">
                      <span className="text-slate-400 font-mono">{k}</span>
                      <span className="text-cyan-300 font-mono font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Outputs & Ground Truth */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mühürlü Çıktılar (Kaynak Gerçek)</span>
                  </h4>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    Doğrulandı
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-36 overflow-y-auto">
                  {Object.entries(importState.pkg.outputs).map(([k, v]) => {
                    const driftVal =
                      importState.status === 'ready_recalculated' ? importState.drift[k] : undefined;
                    const isDriftHigh =
                      driftVal !== undefined && driftVal > Number(importState.pkg.fp_tol);

                    return (
                      <div key={k} className="flex justify-between text-xs border-b border-slate-900 py-1">
                        <span className="text-slate-400 font-mono">{k}</span>
                        <div className="text-right">
                          <span
                            className={`font-mono font-bold ${
                              isDriftHigh ? 'text-rose-400' : 'text-emerald-300'
                            }`}
                          >
                            {v}
                          </span>
                          {driftVal !== undefined && (
                            <span
                              className={`block text-[10px] font-mono ${
                                isDriftHigh ? 'text-rose-400' : 'text-slate-500'
                              }`}
                            >
                              Δ: {driftVal.toFixed(6)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={() => setImportState({ status: 'idle' })}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
          >
            Farklı Paket Seç
          </button>

          {(importState.status === 'ready_static' || importState.status === 'ready_recalculated') && (
            <div className="flex items-center space-x-3">
              {onRecalculate && (
                <button
                  onClick={handleRunRecalculate}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Yeniden Hesapla</span>
                </button>
              )}
              {onApplyPackage && (
                <button
                  onClick={handleApply}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
                >
                  <span>Hesaplayıcıya Yükle</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
