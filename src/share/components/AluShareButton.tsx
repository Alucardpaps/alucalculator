'use client';

import React, { useState } from 'react';
import { Share2, RefreshCw } from 'lucide-react';
import { exportPackage, CreatePackageOptions, ExportResult } from '../export-package';
import { ShareModal } from './ShareModal';
import { SCALE_REGISTRY } from '../scale-registry';

interface AluShareButtonProps {
  module: string;
  moduleTitle?: string;
  getPackageData: () => {
    inputs: Record<string, number>;
    outputs: Record<string, number>;
    name?: string;
    unit_system?: 'metric' | 'imperial';
    fp_tol?: number;
  };
  className?: string;
}

export const AluShareButton: React.FC<AluShareButtonProps> = ({
  module,
  moduleTitle,
  getPackageData,
  className = '',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenShare = async () => {
    setIsExporting(true);
    try {
      const data = getPackageData();

      // Verify all keys exist in SCALE_REGISTRY before attempting export
      const missingKeys: string[] = [];
      for (const k of Object.keys(data.inputs)) {
        if (SCALE_REGISTRY[k] === undefined) missingKeys.push(`input:${k}`);
      }
      for (const k of Object.keys(data.outputs)) {
        if (SCALE_REGISTRY[k] === undefined) missingKeys.push(`output:${k}`);
      }

      if (missingKeys.length > 0) {
        throw new Error(
          `Bu solver alanları henüz SCALE_REGISTRY'de eşlenmemiştir: ${missingKeys.join(', ')}`,
        );
      }

      const options: CreatePackageOptions = {
        module,
        meta: {
          unit_system: data.unit_system || 'metric',
          name: data.name || moduleTitle || module,
        },
        inputs: data.inputs,
        outputs: data.outputs,
        fp_tol: data.fp_tol,
      };

      const result = await exportPackage(options);
      setExportResult(result);
      setIsModalOpen(true);

      // Only track if telemetry consent is active ('1') via dynamic import
      if (typeof window !== 'undefined' && localStorage.getItem('alu_consent_telemetry') === '1') {
        import('@/telemetry/queue').then(({ trackEvent }) => {
          trackEvent(`${module}.share`, 'export_package');
        });
      }
    } catch (err) {
      console.error('AluShare export failed:', err);
      alert(err instanceof Error ? err.message : 'Paket dışa aktarılamadı.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenShare}
        disabled={isExporting}
        className={`px-3 py-1.5 bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer ${className}`}
        title="AluShare v1 Local Paketi Olarak Dışa Aktar"
      >
        {isExporting ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Share2 className="w-3.5 h-3.5" />
        )}
        <span>Paylaş (AluShare)</span>
      </button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        exportData={exportResult}
        moduleTitle={moduleTitle || module}
      />
    </>
  );
};
