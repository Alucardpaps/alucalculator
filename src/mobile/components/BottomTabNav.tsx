'use client';

import {
  LayoutGrid, Calculator, GraduationCap, Wrench, Settings,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AegisMascot } from '@/components/copilot/AegisMascot';
import { AluCalcLogo } from '@/components/ui/AluCalcLogo';
import type { MobileTab } from '@/mobile/store/mobileStore';
import type { MobileStrings } from '@/locales/mobileTranslations';
import { hapticMedium } from '@/mobile/services/haptics';
import { playClickSound } from '@/mobile/services/audioSynth';

function AegisTabIcon({ size = 18 }: { size?: number; className?: string }) {
  return <AegisMascot size={size + 2} variant="face" pose="auto" interactive={false} />;
}

function CadTabIcon({ size = 18 }: { size?: number; className?: string }) {
  return <AluCalcLogo size={size + 2} animate={false} />;
}

const TABS: { id: MobileTab; labelKey: keyof MobileStrings; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }[] = [
  { id: 'dashboard', labelKey: 'dashboard', icon: LayoutGrid },
  { id: 'solvers', labelKey: 'solvers', icon: Calculator },
  { id: 'academy', labelKey: 'academy', icon: GraduationCap },
  { id: 'cad', labelKey: 'cadWorkspace', icon: CadTabIcon },
  { id: 'fieldTools', labelKey: 'fieldTools', icon: Wrench },
  { id: 'aegis', labelKey: 'aegis', icon: AegisTabIcon },
  { id: 'settings', labelKey: 'settings', icon: Settings },
];

type Props = {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  m: MobileStrings;
  reduceMotion: boolean;
};

export function BottomTabNav({ activeTab, onTabChange, m, reduceMotion }: Props) {
  return (
    <nav className="flex-none fixed bottom-0 left-0 right-0 h-16 bg-slate-950/90 border-t border-cyan-950/50 backdrop-blur-xl flex items-center justify-around z-30 px-1 select-none safe-area-pb">
      {TABS.map((tab) => {
        const TabIcon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              hapticMedium();
              playClickSound();
              onTabChange(tab.id);
            }}
            className="flex flex-col items-center justify-center flex-1 h-full relative min-w-0"
          >
            <div
              className={`p-1 rounded-lg transition-all flex items-center justify-center ${
                isActive ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'text-slate-500'
              }`}
            >
              <TabIcon size={18} />
            </div>
            <span
              className={`text-[7.5px] font-mono uppercase font-black tracking-tighter mt-0.5 truncate max-w-full px-0.5 transition-colors ${
                isActive ? 'text-cyan-400' : 'text-slate-600'
              }`}
            >
              {m[tab.labelKey]}
            </span>
            {isActive && !reduceMotion && (
              <motion.div
                layoutId="mobile-tab-indicator"
                className="absolute bottom-0 w-8 h-0.5 bg-cyan-400 rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
