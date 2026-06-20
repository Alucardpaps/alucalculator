import { create } from 'zustand';

interface CopilotStoreState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  greetingText: string | null;
  setGreetingText: (text: string | null) => void;
  mousePos: { x: number; y: number };
  setMousePos: (pos: { x: number; y: number }) => void;
}

export const useCopilotStore = create<CopilotStoreState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  greetingText: null,
  setGreetingText: (greetingText) => set({ greetingText }),
  mousePos: { x: 0, y: 0 },
  setMousePos: (mousePos) => set({ mousePos }),
}));
