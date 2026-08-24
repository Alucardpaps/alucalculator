'use client';

import React from 'react';
import { PersistentUtilityShell } from './PersistentUtilityShell';
import { useUtilityStore } from '@/store/utilityStore';
import { useI18nStore } from '@/store/i18nStore';
import ScientificCalculatorModule from '../modules/science/CalculatorModule';

import UnitConverterModule from '../modules/science/UnitConverterModule';
import dynamic from 'next/dynamic';
import { Calculator, ArrowLeftRight, Settings, MessageSquare, Globe } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const SettingsModule = dynamic(() => import('../modules/os/SettingsModule'), { ssr: false });
const FeedbackModule = dynamic(() => import('../modules/other/FeedbackModule'), { ssr: false });

export function GlobalUtilityLayer() {
    const {
        isCalcOpen, setCalcOpen, calcPosition, updateCalcPosition,
        isUnitOpen, setUnitOpen, unitPosition, updateUnitPosition,
        isSettingsOpen, setSettingsOpen, settingsPosition, updateSettingsPosition,
        isFeedbackOpen, setFeedbackOpen, feedbackPosition, updateFeedbackPosition,
    } = useUtilityStore();
    const { t } = useI18nStore();




    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            <AnimatePresence>
                {isCalcOpen && (
                    <PersistentUtilityShell
                        key="calculator"
                        id="calculator"
                        title={t.modules.calculator.title}

                        icon={<Calculator size={14} />}
                        isOpen={isCalcOpen}
                        onClose={() => setCalcOpen(false)}
                        position={calcPosition}
                        onPositionChange={updateCalcPosition}
                        width={320}
                    >
                        <div className="pointer-events-auto">
                            <ScientificCalculatorModule />
                        </div>
                    </PersistentUtilityShell>
                )}

                {isUnitOpen && (
                    <PersistentUtilityShell
                        key="unit-converter"
                        id="unit-converter"
                        title={t.modules['unit-converter'].title}

                        icon={<ArrowLeftRight size={14} />}
                        isOpen={isUnitOpen}
                        onClose={() => setUnitOpen(false)}
                        position={unitPosition}
                        onPositionChange={updateUnitPosition}
                        width={280}
                    >
                        <div className="pointer-events-auto">
                            <UnitConverterModule />
                        </div>
                    </PersistentUtilityShell>
                )}

                {isSettingsOpen && (
                    <PersistentUtilityShell
                        key="settings"
                        id="settings"
                        title={t.settings}

                        icon={<Settings size={14} />}
                        isOpen={isSettingsOpen}
                        onClose={() => setSettingsOpen(false)}
                        position={settingsPosition}
                        onPositionChange={updateSettingsPosition}
                        width={800}
                    >
                        <div className="pointer-events-auto h-[600px] overflow-hidden">
                            <SettingsModule />
                        </div>
                    </PersistentUtilityShell>
                )}

                {isFeedbackOpen && (
                    <PersistentUtilityShell
                        key="feedback"
                        id="feedback"
                        title={t.feedbackTitle || "Feedback"}

                        icon={<MessageSquare size={14} />}
                        isOpen={isFeedbackOpen}
                        onClose={() => setFeedbackOpen(false)}
                        position={feedbackPosition}
                        onPositionChange={updateFeedbackPosition}
                        width={340}
                    >
                        <div className="pointer-events-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                            <FeedbackModule />
                        </div>
                    </PersistentUtilityShell>
                )}


            </AnimatePresence>
        </div>
    );
}
