'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useOSStore } from '@/store/osStore';
import { useI18nStore } from '@/store/i18nStore';
import { useProjectStore } from '@/store/projectStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { MODULE_REGISTRY, ModuleType } from '@/config/modules';
import { getLitePage, type LiteCategoryKey } from '@/locales/liteTranslations';
import { getMobileStrings } from '@/locales/mobileTranslations';
import { useMobileStore } from '@/mobile/store/mobileStore';
import { useMobileNavigation } from '@/mobile/hooks/useMobileNavigation';
import { useDeepLinks } from '@/mobile/hooks/useMobileNavigation';
import { useBiometricLock } from '@/mobile/hooks/useBiometricLock';
import { usePullToRefresh } from '@/mobile/hooks/usePullToRefresh';
import { MobileHeader } from '@/mobile/components/MobileHeader';
import { BottomTabNav } from '@/mobile/components/BottomTabNav';
import { MobileToast } from '@/mobile/components/MobileToast';
import { CalculatorSheet } from '@/mobile/components/CalculatorSheet';
import { BiometricGate } from '@/mobile/components/BiometricGate';
import { OnboardingSplash } from '@/mobile/components/OnboardingSplash';
import { DashboardScreen } from '@/mobile/screens/DashboardScreen';
import { SolversScreen } from '@/mobile/screens/SolversScreen';
import { AcademyScreen } from '@/mobile/screens/AcademyScreen';
import { CadScreen } from '@/mobile/screens/CadScreen';
import { FieldToolsScreen } from '@/mobile/screens/FieldToolsScreen';
import { AegisScreen } from '@/mobile/screens/AegisScreen';
import { SettingsScreen, AboutScreen } from '@/mobile/screens/SettingsScreen';
import { exportResultsJson, getLatestCalcResult } from '@/mobile/services/exportResults';
import { clearAppCache } from '@/mobile/services/cacheService';
import { getMobileThemeClasses, getFontSizeClass } from '@/mobile/theme/mobileTheme';
import { hapticSuccess } from '@/mobile/services/haptics';
import { playClickSound } from '@/mobile/services/audioSynth';

const KernelDevPanel = dynamic(
  () => import('@/components/os/KernelDevPanel').then((m) => m.KernelDevPanel),
  { ssr: false },
);

export function MobileApp() {
  const { language, setLanguage, t: osT } = useI18nStore();
  const m = getMobileStrings(language);
  const { theme, setTheme, unitSystem, setUnitSystem } = useOSStore();
  const debugMode = useWorkspaceStore((s) => s.debugMode);
  const toggleDebugMode = useWorkspaceStore((s) => s.toggleDebugMode);
  const { projectName, items, clearProject, getTotalWeight, getTotalCost } = useProjectStore();

  const {
    hasCompletedOnboarding,
    completeOnboarding,
    recentModules,
    favoriteModules,
    reduceMotion,
    setReduceMotion,
    biometricLockEnabled,
    setBiometricLockEnabled,
    mobileFontSize,
    setMobileFontSize,
    trackModuleOpen,
    toggleFavorite,
    isFavorite,
    markRefreshed,
    soundEnabled,
    setSoundEnabled,
  } = useMobileStore();

  const { activeTab, setActiveTab, onTouchStart, onTouchEnd } = useMobileNavigation('dashboard');
  const { isLocked, isChecking, isAvailable, unlock } = useBiometricLock();

  const [activeModule, setActiveModule] = useState<ModuleType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LiteCategoryKey | 'all'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => setIsHydrated(true), []);

  const tLite = getLitePage(language);
  const isLight = theme === 'light';

  const getModuleTitle = useCallback(
    (type: ModuleType | string) =>
      osT?.modules?.[type as string]?.title ??
      MODULE_REGISTRY[type as ModuleType]?.title ??
      String(type),
    [osT],
  );

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const handleLaunchModule = useCallback(
    (type: ModuleType) => {
      setActiveModule(type);
      trackModuleOpen(type, getModuleTitle(type));
      hapticSuccess();
    },
    [trackModuleOpen, getModuleTitle],
  );

  useDeepLinks(
    useCallback(
      (slug) => {
        if (MODULE_REGISTRY[slug as ModuleType]) {
          handleLaunchModule(slug as ModuleType);
          triggerToast(m.deepLinkOpened);
        }
      },
      [handleLaunchModule, m.deepLinkOpened, triggerToast],
    ),
  );

  const handleRefresh = useCallback(async () => {
    markRefreshed();
    await new Promise((r) => setTimeout(r, 600));
    triggerToast(m.pullRefreshed);
  }, [markRefreshed, m.pullRefreshed, triggerToast]);

  const ptr = usePullToRefresh(handleRefresh);

  const handleShare = () => {
    if (!activeModule) return;
    const url = `${window.location.origin}/workspace?solver=${activeModule}`;
    if (navigator.share) {
      navigator.share({ title: getModuleTitle(activeModule), url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      triggerToast(m.copied);
    }
  };

  const handleExportJson = async () => {
    if (!activeModule) return;
    const latest = getLatestCalcResult(activeModule);
    await exportResultsJson({
      moduleType: activeModule,
      moduleTitle: getModuleTitle(activeModule),
      inputs: latest?.inputs,
      result: latest?.result,
      unitSystem,
    });
    triggerToast(m.exportSuccess);
  };

  const handleClearCache = async () => {
    if (!confirm(m.confirmClearCache)) return;
    await clearAppCache();
    triggerToast(m.cacheCleared);
  };

  const handleClearProject = () => {
    if (confirm(m.confirmClear)) {
      clearProject();
      triggerToast(m.projectCleared);
    }
  };

  const handleToggleBiometric = () => {
    setBiometricLockEnabled(!biometricLockEnabled);
    triggerToast(biometricLockEnabled ? m.biometricDisabled : m.biometricEnabled);
  };

  const handleToggleSound = () => {
    setSoundEnabled(!soundEnabled);
    // play click sound immediately if we are enabling sound, to give tactile feedback
    if (!soundEnabled) {
      setTimeout(() => playClickSound(), 50);
    }
    triggerToast(!soundEnabled ? (language === 'tr' ? 'Ses Sentezleyici Etkin' : 'Sound Synth Enabled') : (language === 'tr' ? 'Ses Sentezleyici Kapatıldı' : 'Sound Synth Disabled'));
  };

  if (!isHydrated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#020408]">
        <div className="w-8 h-8 border-2 border-t-cyan-400 border-white/10 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 flex flex-col overflow-hidden select-none font-sans ${getMobileThemeClasses(theme, isLight)} ${getFontSizeClass(mobileFontSize)}`}
    >
      <AnimatePresence>
        {!hasCompletedOnboarding && (
          <OnboardingSplash
            m={m}
            onComplete={completeOnboarding}
            onSkip={completeOnboarding}
          />
        )}
      </AnimatePresence>

      {isLocked && <BiometricGate m={m} onUnlock={unlock} isChecking={isChecking} />}

      <MobileHeader
        m={m}
        language={language}
        projectName={projectName}
        onLanguagePress={() => setActiveTab('settings')}
      />

      <main
        ref={ptr.containerRef}
        className="flex-1 overflow-y-auto pb-20 relative custom-scrollbar"
        onTouchStart={(e) => {
          ptr.onTouchStart(e);
          onTouchStart(e);
        }}
        onTouchMove={ptr.onTouchMove}
        onTouchEnd={(e) => {
          ptr.onTouchEnd();
          onTouchEnd(e, reduceMotion);
        }}
      >
        {ptr.pullDistance > 0 && (
          <div
            className="absolute top-0 left-0 right-0 flex justify-center py-2 text-[10px] font-mono text-cyan-400 z-10"
            style={{ transform: `translateY(${ptr.pullDistance - 40}px)` }}
          >
            {ptr.isRefreshing ? m.loading : m.pullToRefresh}
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <DashboardScreen
              key="dashboard"
              m={m}
              projectName={projectName}
              bomCount={items.length}
              totalWeight={getTotalWeight()}
              totalCost={getTotalCost()}
              recentModules={recentModules}
              favoriteModules={favoriteModules}
              getModuleTitle={getModuleTitle}
              onLaunch={handleLaunchModule}
            />
          )}
          {activeTab === 'solvers' && (
            <SolversScreen
              key="solvers"
              m={m}
              language={language}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              getModuleTitle={getModuleTitle}
              onLaunch={handleLaunchModule}
            />
          )}
          {activeTab === 'academy' && <AcademyScreen key="academy" m={m} language={language} />}
          {activeTab === 'cad' && <CadScreen key="cad" m={m} />}
          {activeTab === 'fieldTools' && (
            <FieldToolsScreen key="fieldTools" m={m} language={language} triggerToast={triggerToast} />
          )}
          {activeTab === 'aegis' && <AegisScreen key="aegis" />}
          {activeTab === 'settings' && (
            <SettingsScreen
              key="settings"
              m={m}
              osT={osT}
              language={language}
              setLanguage={setLanguage}
              theme={theme}
              setTheme={setTheme}
              unitSystem={unitSystem}
              setUnitSystem={setUnitSystem}
              fontSize={mobileFontSize}
              setFontSize={setMobileFontSize}
              reduceMotion={reduceMotion}
              setReduceMotion={setReduceMotion}
              biometricEnabled={biometricLockEnabled}
              biometricAvailable={isAvailable}
              onToggleBiometric={handleToggleBiometric}
              debugMode={debugMode}
              toggleDebugMode={toggleDebugMode}
              onClearCache={handleClearCache}
              onClearProject={handleClearProject}
              onShowAbout={() => setShowAbout(true)}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
            />
          )}
        </AnimatePresence>
      </main>

      <BottomTabNav activeTab={activeTab} onTabChange={setActiveTab} m={m} reduceMotion={reduceMotion} />

      {activeModule && (
        <CalculatorSheet
          activeModule={activeModule}
          moduleTitle={getModuleTitle(activeModule)}
          categoryLabel={tLite.categories[MODULE_REGISTRY[activeModule].category as LiteCategoryKey] || MODULE_REGISTRY[activeModule].category}
          m={m}
          isFavorite={isFavorite(activeModule)}
          onClose={() => setActiveModule(null)}
          onShare={handleShare}
          onExportJson={handleExportJson}
          onToggleFavorite={() => {
            toggleFavorite(activeModule);
            triggerToast(isFavorite(activeModule) ? m.unfavorited : m.favorited);
          }}
          onPdf={() => triggerToast(m.pdfGeneratedSim)}
        />
      )}

      {showAbout && <AboutScreen m={m} onClose={() => setShowAbout(false)} />}
      <MobileToast message={toastMessage} />
      {debugMode && <KernelDevPanel />}
    </div>
  );
}
