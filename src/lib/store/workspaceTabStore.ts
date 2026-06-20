import { create } from 'zustand';

export type WorkspaceTab =
  | '3d-assembly'
  | 'machine-assembly'
  | 'cad-editor'
  | 'sketch-pad'
  | 'simulation-fea'
  | 'nesting-2d'
  | 'cutting-optimizer';

interface WorkspaceTabState {
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
}

export const useWorkspaceTabStore = create<WorkspaceTabState>((set) => ({
  activeTab: '3d-assembly',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
