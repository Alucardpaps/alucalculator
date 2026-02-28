'use client';

/**
 * Training Overlay — Spotlight + tooltip for tutorial steps.
 *
 * Renders a semi-transparent overlay with a spotlight cutout on the
 * target element and a descriptive tooltip next to it.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useTrainingStore } from './trainingStore';
import { X, ChevronRight, ChevronLeft, SkipForward } from 'lucide-react';

export function TrainingOverlay() {
    const { activeTutorial, activeStepIndex, nextStep, prevStep, skipTutorial } = useTrainingStore();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const currentStep = activeTutorial?.steps[activeStepIndex] ?? null;

    // Find and measure the target element
    const measureTarget = useCallback(() => {
        if (!currentStep) { setTargetRect(null); return; }
        const el = document.querySelector(currentStep.targetSelector);
        if (el) {
            setTargetRect(el.getBoundingClientRect());
        } else {
            setTargetRect(null);
        }
    }, [currentStep]);

    useEffect(() => {
        measureTarget();
        const resizeObs = new ResizeObserver(measureTarget);
        resizeObs.observe(document.body);
        return () => resizeObs.disconnect();
    }, [measureTarget]);

    if (!activeTutorial || !currentStep) return null;

    const totalSteps = activeTutorial.steps.length;
    const isLast = activeStepIndex === totalSteps - 1;

    // Tooltip position relative to spotlight
    const tooltipStyle: React.CSSProperties = {};
    const PAD = 16;
    if (targetRect) {
        switch (currentStep.position) {
            case 'right':
                tooltipStyle.left = targetRect.right + PAD;
                tooltipStyle.top = targetRect.top + targetRect.height / 2;
                tooltipStyle.transform = 'translateY(-50%)';
                break;
            case 'left':
                tooltipStyle.right = window.innerWidth - targetRect.left + PAD;
                tooltipStyle.top = targetRect.top + targetRect.height / 2;
                tooltipStyle.transform = 'translateY(-50%)';
                break;
            case 'top':
                tooltipStyle.left = targetRect.left + targetRect.width / 2;
                tooltipStyle.bottom = window.innerHeight - targetRect.top + PAD;
                tooltipStyle.transform = 'translateX(-50%)';
                break;
            case 'bottom':
            default:
                tooltipStyle.left = targetRect.left + targetRect.width / 2;
                tooltipStyle.top = targetRect.bottom + PAD;
                tooltipStyle.transform = 'translateX(-50%)';
                break;
        }
    } else {
        // Fallback center
        tooltipStyle.left = '50%';
        tooltipStyle.top = '50%';
        tooltipStyle.transform = 'translate(-50%, -50%)';
    }

    return (
        <div className="fixed inset-0 z-[10000] pointer-events-auto">
            {/* Dark overlay with spotlight cutout */}
            <div
                className="absolute inset-0 bg-black/60 transition-all duration-300"
                onClick={skipTutorial}
            />

            {/* Spotlight ring */}
            {targetRect && (
                <div
                    className="absolute border-2 border-cyan-400 rounded-lg shadow-[0_0_20px_rgba(0,229,255,0.3)] pointer-events-none transition-all duration-300"
                    style={{
                        left: targetRect.left - 4,
                        top: targetRect.top - 4,
                        width: targetRect.width + 8,
                        height: targetRect.height + 8,
                    }}
                />
            )}

            {/* Tooltip */}
            <div
                className="fixed max-w-xs bg-[#0d1117] border border-cyan-500/30 rounded-xl shadow-2xl p-4 z-[10001]"
                style={tooltipStyle}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-cyan-300">{currentStep.title}</h3>
                    <button onClick={skipTutorial} className="text-slate-500 hover:text-white transition-colors">
                        <X size={14} />
                    </button>
                </div>

                {/* Body */}
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {currentStep.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-600">{activeStepIndex + 1} / {totalSteps}</span>
                    <div className="flex gap-1.5">
                        {activeStepIndex > 0 && (
                            <button onClick={prevStep} className="px-2 py-1 text-[10px] rounded bg-white/5 text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                                <ChevronLeft size={10} /> Back
                            </button>
                        )}
                        <button onClick={skipTutorial} className="px-2 py-1 text-[10px] rounded bg-white/5 text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                            <SkipForward size={10} /> Skip
                        </button>
                        <button onClick={nextStep} className="px-2 py-1 text-[10px] rounded bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors flex items-center gap-1">
                            {isLast ? 'Finish' : 'Next'} <ChevronRight size={10} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TrainingOverlay;
