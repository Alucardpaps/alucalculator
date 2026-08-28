'use client';

import React, { useEffect } from 'react';
import { HashImportListener } from './HashImportListener';
import { ImportModal } from './ImportModal';
import { FeedbackModal } from '@/feedback/FeedbackModal';
import { ConsentBanner } from './ConsentBanner';
import { useShareUiStore } from '../shareUiStore';
import { usePathname } from 'next/navigation';

export const AluShareIntegration: React.FC = () => {
  const pathname = usePathname();
  const {
    isImportModalOpen,
    closeImportModal,
    isFeedbackModalOpen,
    closeFeedbackModal,
  } = useShareUiStore();

  useEffect(() => {
    // Only dynamically import and initialize telemetry when explicit consent ('1') is present
    if (typeof window !== 'undefined' && localStorage.getItem('alu_consent_telemetry') === '1') {
      import('@/telemetry/queue').then(({ telemetry }) => {
        telemetry.init('/api/telemetry');
      });
    }
  }, []);

  const currentModule = pathname ? pathname.replace(/^\//, '').replace(/\//g, '-') || 'general' : 'general';

  return (
    <>
      {/* Explicit KVKK 2-Box Privacy & Telemetry Consent Gate */}
      <ConsentBanner />

      {/* Reactive URL Hash listener for #lz= */}
      <HashImportListener />

      {/* Manual File/Hash Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={closeImportModal}
      />

      {/* User Feedback & Screenshot Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={closeFeedbackModal}
        defaultModule={currentModule}
      />
    </>
  );
};
