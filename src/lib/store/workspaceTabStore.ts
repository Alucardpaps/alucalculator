import { create } from 'zustand';

export type WorkspaceTab =
  | 'design-studio'
  | 'cad-editor'
  | '3d-assembly'
  | 'parametric-cad'
  | 'machine-assembly'
  | 'sketch-pad'
  | 'simulation-fea'
  | 'nesting-2d'
  | 'cutting-optimizer';

interface WorkspaceTabState {
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
}

export const useWorkspaceTabStore = create<WorkspaceTabState>((set) => ({
  activeTab: 'design-studio',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
