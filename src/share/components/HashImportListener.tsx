'use client';

import React, { useEffect, useState } from 'react';
import { extractHashPayload } from '../channels';
import { importPackage } from '../import-package';
import { AluPackage } from '../schema';
import { ImportModal } from './ImportModal';

interface HashImportListenerProps {
  onApplyPackage?: (pkg: AluPackage) => void;
  onRecalculate?: (inputs: Record<string, string>) => Record<string, number>;
}

export const HashImportListener: React.FC<HashImportListenerProps> = ({
  onApplyPackage,
  onRecalculate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [importedPackage, setImportedPackage] = useState<AluPackage | null>(null);
  const [warning, setWarning] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handleHashCheck = async () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash;
      const payload = extractHashPayload(hash);
      if (payload) {
        const result = await importPackage(payload, { channel: 'hash' });
        if (result.success) {
          setImportedPackage(result.pkg);
          setWarning(result.warning);
          setIsOpen(true);
        }
      }
    };

    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    return () => window.removeEventListener('hashchange', handleHashCheck);
  }, []);

  if (!isOpen || !importedPackage) return null;

  return (
    <ImportModal
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false);
        // Clear hash cleanly without reload
        if (typeof window !== 'undefined' && window.location.hash.includes('#lz=')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }}
      initialPackage={importedPackage}
      initialWarning={warning}
      onApplyPackage={onApplyPackage}
      onRecalculate={onRecalculate}
    />
  );
};
