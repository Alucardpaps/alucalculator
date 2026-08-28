'use client';

import { create } from 'zustand';

interface ShareUiState {
  isImportModalOpen: boolean;
  isFeedbackModalOpen: boolean;
  openImportModal: () => void;
  closeImportModal: () => void;
  openFeedbackModal: () => void;
  closeFeedbackModal: () => void;
}

export const useShareUiStore = create<ShareUiState>((set) => ({
  isImportModalOpen: false,
  isFeedbackModalOpen: false,
  openImportModal: () => set({ isImportModalOpen: true }),
  closeImportModal: () => set({ isImportModalOpen: false }),
  openFeedbackModal: () => set({ isFeedbackModalOpen: true }),
  closeFeedbackModal: () => set({ isFeedbackModalOpen: false }),
}));
