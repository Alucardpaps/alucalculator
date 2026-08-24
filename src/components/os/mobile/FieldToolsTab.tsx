'use client';

import React, { useState, useEffect } from 'react';
import { Camera, Smartphone, Zap, Database, Wrench, Activity, FileText } from 'lucide-react';
import { QRScannerModal } from './QRScannerModal';
import { BubbleLevelModal } from './BubbleLevelModal';
import { VoiceMemoModule } from './VoiceMemoModule';
import { VibrationAnalyzerModal } from './VibrationAnalyzerModal';
import { TapChartModal } from './TapChartModal';
import { useProjectStore } from '@/store/projectStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Copy, Trash2, Volume2, Compass, Layers } from 'lucide-react';
import type { MobileStrings } from '@/locales/mobileTranslations';
import type { FieldToolsStrings } from '@/locales/fieldToolsTranslations';
import { formatFieldToolsTemplate } from '@/locales/fieldToolsTranslations';
import { SoundMeterModal } from './SoundMeterModal';
import { ClinometerModal } from './ClinometerModal';
import { GPSSurveyorModal } from './GPSSurveyorModal';
import { HardnessConverterModal } from './HardnessConverterModal';

interface FieldToolsTabProps {
    t: MobileStrings;
    ft: FieldToolsStrings;
    language: string;
    triggerToast: (msg: string) => void;
}

export function FieldToolsTab({ t, ft, language, triggerToast }: FieldToolsTabProps) {
    const { variables, removeVariable } = useProjectStore();
    const debugMode = useWorkspaceStore((s) => s.debugMode);

    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isLevelOpen, setIsLevelOpen] = useState(false);
    const [isVibrationOpen, setIsVibrationOpen] = useState(false);
    const [isTapChartOpen, setIsTapChartOpen] = useState(false);
    const [isSoundMeterOpen, setIsSoundMeterOpen] = useState(false);
    const [isClinometerOpen, setIsClinometerOpen] = useState(false);
    const [isGpsSurveyorOpen, setIsGpsSurveyorOpen] = useState(false);
    const [isHardnessConverterOpen, setIsHardnessConverterOpen] = useState(false);
    const [flashlightActive, setFlashlightActive] = useState(false);
    const [activeSection, setActiveSection] = useState<'hub' | 'voice' | 'vars'>('hub');

    useEffect(() => {
        return () => {
            const globalStream = (window as any).flashlightStream;
            if (globalStream) {
                globalStream.getTracks().forEach((track: any) => track.stop());
                (window as any).flashlightStream = null;
            }
        };
    }, []);

    const handleToggleFlashlight = async () => {
        const nextState = !flashlightActive;
        if ('vibrate' in navigator) navigator.vibrate(80);

        try {
            if (nextState) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                });
                (window as any).flashlightStream = stream;

                const track = stream.getVideoTracks()[0];
                if (track) {
                    const capabilities = track.getCapabilities() as any;
                    if (capabilities?.torch) {
                        await track.applyConstraints({ advanced: [{ torch: true }] } as any);
                        setFlashlightActive(true);
                        triggerToast(ft.flashlightActivated);
                    } else {
                        stream.getTracks().forEach((t) => t.stop());
                        (window as any).flashlightStream = null;
                        alert(ft.torchNotSupported);
                    }
                }
            } else {
                const stream = (window as any).flashlightStream;
                if (stream) {
                    stream.getTracks().forEach((track: any) => track.stop());
                    (window as any).flashlightStream = null;
                }
                setFlashlightActive(false);
                triggerToast(ft.flashlightDeactivated);
            }
        } catch (e) {
            console.error('[Flashlight] Toggle failed:', e);
            alert(ft.cameraFlashlightError);
        }
    };

    return (
        <div className="p-4 space-y-6">
            <div className="flex bg-slate-950/40 p-1 border border-white/5 rounded-xl">
                <button
                    onClick={() => setActiveSection('hub')}
                    className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase rounded-lg transition-all ${activeSection === 'hub' ? 'bg-cyan-500 text-black shadow-lg font-black' : 'text-slate-400'}`}
                >
                    {ft.hardwareTools}
                </button>
                <button
                    onClick={() => setActiveSection('voice')}
                    className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase rounded-lg transition-all ${activeSection === 'voice' ? 'bg-cyan-500 text-black shadow-lg font-black' : 'text-slate-400'}`}
                >
                    {ft.voiceNotes}
                </button>
                <button
                    onClick={() => setActiveSection('vars')}
                    className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase rounded-lg transition-all ${activeSection === 'vars' ? 'bg-cyan-500 text-black shadow-lg font-black' : 'text-slate-400'}`}
                >
                    {ft.variables}
                </button>
            </div>

            {activeSection === 'hub' && (
                <div className="space-y-6">
                    <div className="p-4 rounded-2xl border border-cyan-950/30 bg-slate-950/20 space-y-3">
                        <div className="flex items-center justify-between pb-1 border-b border-white/5">
                            <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Wrench size={10} />
                                {ft.fieldTelemetryStatus}
                            </span>
                            <span className="text-[8px] font-mono text-slate-500">{ft.androidApk}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                            <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                                <span>{ft.hapticsEngine}</span>
                                <span className="text-emerald-400 font-bold">{ft.ready}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                                <span>{ft.audioEngine}</span>
                                <span className="text-emerald-400 font-bold">{ft.ready}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg col-span-2">
                                <span>{ft.deviceOrientation}</span>
                                <span className="text-cyan-400">{ft.waitPermission}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(55);
                                setIsScannerOpen(true);
                            }}
                            className="flex flex-col items-center justify-center p-5 bg-slate-950/30 border border-white/5 rounded-2xl hover:border-cyan-500/30 active:scale-95 transition-all text-center space-y-2.5"
                        >
                            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <Camera size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="font-bold text-xs text-white">{ft.qrBarcode}</h4>
                                <p className="text-[8px] text-slate-500 font-mono">{ft.scanProfilesBolts}</p>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(55);
                                setIsLevelOpen(true);
                            }}
                            className="flex flex-col items-center justify-center p-5 bg-slate-950/30 border border-white/5 rounded-2xl hover:border-cyan-500/30 active:scale-95 transition-all text-center space-y-2.5"
                        >
                            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <Smartphone size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="font-bold text-xs text-white">{ft.spiritLevel}</h4>
                                <p className="text-[8px] text-slate-500 font-mono">{ft.tiltAlignFrames}</p>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(55);
                                setIsVibrationOpen(true);
                            }}
                            className="flex flex-col items-center justify-center p-5 bg-slate-950/30 border border-white/5 rounded-2xl hover:border-cyan-500/30 active:scale-95 transition-all text-center space-y-2.5"
                        >
                            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <Activity size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="font-bold text-xs text-white">{ft.vibeAnalyzer}</h4>
                                <p className="text-[8px] text-slate-500 font-mono">{ft.iso10816}</p>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(55);
                                setIsTapChartOpen(true);
                            }}
                            className="flex flex-col items-center justify-center p-5 bg-slate-950/30 border border-white/5 rounded-2xl hover:border-cyan-500/30 active:scale-95 transition-all text-center space-y-2.5"
                        >
                            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <FileText size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="font-bold text-xs text-white">{ft.tapDrill}</h4>
                                <p className="text-[8px] text-slate-500 font-mono">{ft.threadSizesTorque}</p>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(55);
                                setIsSoundMeterOpen(true);
                            }}
                            className="flex flex-col items-center justify-center p-5 bg-slate-950/30 border border-white/5 rounded-2xl hover:border-cyan-500/30 active:scale-95 transition-all text-center space-y-2.5"
                        >
                            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <Volume2 size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="font-bold text-xs text-white">{ft.soundMeter || 'Sound Meter'}</h4>
                                <p className="text-[8px] text-slate-500 font-mono">{ft.soundMeterDesc || 'Decibel & frequency'}</p>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(55);
                                setIsClinometerOpen(true);
                            }}
                            className="flex flex-col items-center justify-center p-5 bg-slate-950/30 border border-white/5 rounded-2xl hover:border-cyan-500/30 active:scale-95 transition-all text-center space-y-2.5"
                        >
                            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <Compass size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="font-bold text-xs text-white">{ft.clinometer || 'Clinometer'}</h4>
                                <p className="text-[8px] text-slate-500 font-mono">{ft.clinometerDesc || 'Camera slope & height'}</p>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(55);
                                setIsGpsSurveyorOpen(true);
                            }}
                            className="flex flex-col items-center justify-center p-5 bg-slate-950/30 border border-white/5 rounded-2xl hover:border-cyan-500/30 active:scale-95 transition-all text-center space-y-2.5"
                        >
                            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <Compass size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="font-bold text-xs text-white">{ft.gpsSurveyor || 'GPS Surveyor'}</h4>
                                <p className="text-[8px] text-slate-500 font-mono">{ft.gpsSurveyorDesc || 'Coordinates & Pusula'}</p>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(55);
                                setIsHardnessConverterOpen(true);
                            }}
                            className="flex flex-col items-center justify-center p-5 bg-slate-950/30 border border-white/5 rounded-2xl hover:border-cyan-500/30 active:scale-95 transition-all text-center space-y-2.5"
                        >
                            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <Layers size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="font-bold text-xs text-white">{ft.hardnessConverter || 'Sertlik Çevirici'}</h4>
                                <p className="text-[8px] text-slate-500 font-mono">{ft.hardnessConverterDesc || 'Metal hardness scales'}</p>
                            </div>
                        </button>
                    </div>

                    <button
                        onClick={handleToggleFlashlight}
                        className={`flex flex-col items-center justify-center p-6 border rounded-2xl active:scale-95 transition-all text-center col-span-2 space-y-3 w-full ${flashlightActive ? 'bg-cyan-500 border-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'bg-slate-950/30 border-white/5 text-white hover:border-cyan-500/30'}`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${flashlightActive ? 'bg-black/20 border-black/10 text-black' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
                            <Zap size={22} className={flashlightActive ? 'fill-black' : ''} />
                        </div>
                        <div className="space-y-0.5">
                            <h4 className="font-bold text-xs">{ft.deviceFlashlight}</h4>
                            <p className={`text-[8px] font-mono ${flashlightActive ? 'text-cyan-900 font-bold' : 'text-slate-500'}`}>
                                {flashlightActive ? ft.torchActive : ft.torchInactive}
                            </p>
                        </div>
                    </button>

                    <div className="p-4 border border-dashed border-cyan-950/30 rounded-2xl bg-cyan-950/5 text-center text-[10px] text-slate-500 leading-relaxed font-mono">
                        {ft.hardwareToolsFooter}
                    </div>
                </div>
            )}

            {activeSection === 'voice' && <VoiceMemoModule ft={ft} />}

            {activeSection === 'vars' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Database size={14} className="text-cyan-400" />
                            {ft.savedProjectVariables}
                        </h4>
                    </div>

                    <div className="space-y-2">
                        {variables.length === 0 ? (
                            <div className="text-center py-10 border border-dashed border-white/5 rounded-2xl text-slate-600 text-xs">
                                {ft.noSavedVariables}
                            </div>
                        ) : (
                            variables.map((v) => (
                                <div
                                    key={v.id}
                                    className="p-3 bg-slate-950/20 border border-white/5 rounded-xl flex items-center justify-between"
                                >
                                    <div className="space-y-0.5 min-w-0">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="font-mono text-xs font-bold text-cyan-300 truncate">{v.name}</span>
                                            {v.unit && <span className="text-[9px] text-slate-500 font-mono">({v.unit})</span>}
                                        </div>
                                        {v.description && <p className="text-[9px] text-slate-500 truncate">{v.description}</p>}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(String(v.value));
                                                triggerToast(ft.valueCopied);
                                            }}
                                            className="p-2 rounded bg-white/5 hover:bg-white/10 text-slate-400"
                                        >
                                            <Copy size={11} />
                                        </button>
                                        <div className="font-mono text-xs font-bold text-white bg-slate-900 border border-white/5 px-2 py-1.5 rounded-lg shadow-inner">
                                            {v.value}
                                        </div>
                                        <button
                                            onClick={() => removeVariable(v.id)}
                                            className="p-2 text-slate-600 hover:text-red-400"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <QRScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onAddPart={(item) => triggerToast(formatFieldToolsTemplate(ft.addedToBom, { name: item.name }))}
                ft={ft}
                language={language}
                debugMode={debugMode}
            />

            <BubbleLevelModal isOpen={isLevelOpen} onClose={() => setIsLevelOpen(false)} ft={ft} debugMode={debugMode} />

            <VibrationAnalyzerModal isOpen={isVibrationOpen} onClose={() => setIsVibrationOpen(false)} ft={ft} debugMode={debugMode} />

            <TapChartModal isOpen={isTapChartOpen} onClose={() => setIsTapChartOpen(false)} ft={ft} />

            <SoundMeterModal isOpen={isSoundMeterOpen} onClose={() => setIsSoundMeterOpen(false)} ft={ft} debugMode={debugMode} />

            <ClinometerModal isOpen={isClinometerOpen} onClose={() => setIsClinometerOpen(false)} ft={ft} debugMode={debugMode} />

            <GPSSurveyorModal isOpen={isGpsSurveyorOpen} onClose={() => setIsGpsSurveyorOpen(false)} ft={ft} debugMode={debugMode} />

            <HardnessConverterModal isOpen={isHardnessConverterOpen} onClose={() => setIsHardnessConverterOpen(false)} ft={ft} debugMode={debugMode} />
        </div>
    );
}
