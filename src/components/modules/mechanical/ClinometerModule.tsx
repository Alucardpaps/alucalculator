'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Compass, Settings, Play, Square } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { getFieldToolsStrings } from '@/locales/fieldToolsTranslations';
import { playClickSound } from '@/mobile/services/audioSynth';
import { useWorkspaceStore } from '@/store/workspaceStore';

export default function ClinometerModule() {
    const { language } = useI18nStore();
    const ft = getFieldToolsStrings(language);
    const debugMode = useWorkspaceStore((s) => s.debugMode);

    const [isMeasuring, setIsMeasuring] = useState(false);
    const [pitch, setPitch] = useState(0);
    const [distance, setDistance] = useState(15); // Meters
    const [eyeHeight, setEyeHeight] = useState(1.6); // Meters
    const [sensorPermission, setSensorPermission] = useState<'default' | 'granted' | 'denied'>('default');
    const [isSimulated, setIsSimulated] = useState(true); // Default to true on desktop
    const [simPitch, setSimPitch] = useState(30); // Simulated slider angle

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        return () => stopMeasurement();
    }, []);

    const requestPermissionsAndStart = async () => {
        playClickSound();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsSimulated(false);
        } catch (e) {
            console.warn('[Clinometer] Camera stream blocked on desktop, fallback to mock sight:', e);
            setIsSimulated(true);
        }
        setIsMeasuring(true);
    };

    const stopMeasurement = () => {
        setIsMeasuring(false);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const activePitch = isSimulated ? simPitch : pitch;
    const pitchRad = (activePitch * Math.PI) / 180;
    const computedHeight = Math.max(0, distance * Math.tan(pitchRad) + eyeHeight);

    return (
        <div className="flex flex-col h-full bg-[#05090e] p-6 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/5 relative z-10">
                <div>
                    <h2 className="text-lg font-black italic tracking-wider uppercase flex items-center gap-2 text-white">
                        <Compass className="text-cyan-400 animate-spin-slow" size={20} />
                        {ft.clinometer || 'Clinometer / Height Finder'}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{ft.clinometerDesc || 'Trigonometric slope & height analyzer'}</p>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-6 mt-6 flex-1 min-h-0 relative z-10">
                {/* Left: Input parameters */}
                <div className="col-span-2 space-y-4 flex flex-col justify-between">
                    
                    {/* Calculated Height Card */}
                    <div className="p-5 bg-slate-950/40 border border-cyan-500/20 rounded-2xl text-center space-y-1 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent pointer-events-none" />
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">{ft.calculatedHeight || 'Calculated Height'}</span>
                        <span className="text-4xl font-black font-mono text-cyan-400 tracking-tighter block">
                            {computedHeight.toFixed(2)} <span className="text-base font-normal text-slate-400 font-sans">m</span>
                        </span>
                        <span className="text-[9px] text-slate-500 block font-mono">
                            {distance}m × tan({activePitch.toFixed(1)}°) + {eyeHeight}m
                        </span>
                    </div>

                    {/* Sizing Sliders */}
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-950/20 border border-white/5 rounded-xl space-y-2">
                            <div className="flex justify-between items-baseline font-mono text-xs">
                                <span className="text-slate-400">{ft.targetDistance || 'Distance to Object'}</span>
                                <span className="font-bold text-cyan-400">{distance.toFixed(1)} m</span>
                            </div>
                            <input 
                                type="range"
                                min="2"
                                max="100"
                                step="1"
                                value={distance}
                                onChange={e => {
                                    setDistance(Number(e.target.value));
                                    if (distance % 5 === 0) playClickSound();
                                }}
                                className="w-full h-1 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400 outline-none"
                            />
                        </div>

                        <div className="p-4 bg-slate-950/20 border border-white/5 rounded-xl space-y-2">
                            <div className="flex justify-between items-baseline font-mono text-xs">
                                <span className="text-slate-400">{ft.userHeight || 'User Eye Height'}</span>
                                <span className="font-bold text-cyan-400">{eyeHeight.toFixed(2)} m</span>
                            </div>
                            <input 
                                type="range"
                                min="0.5"
                                max="2.5"
                                step="0.05"
                                value={eyeHeight}
                                onChange={e => {
                                    setEyeHeight(Number(e.target.value));
                                    if (Math.floor(eyeHeight * 10) % 2 === 0) playClickSound();
                                }}
                                className="w-full h-1 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {!isMeasuring ? (
                            <button
                                onClick={requestPermissionsAndStart}
                                className="flex-1 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer"
                            >
                                <Play size={14} className="fill-black" />
                                {ft.enableGyroscope || 'Start Camera View'}
                            </button>
                        ) : (
                            <button
                                onClick={() => { playClickSound(); stopMeasurement(); }}
                                className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Square size={14} className="fill-white" />
                                {ft.stopSensorTelemetry || 'Stop Camera View'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: Camera HUD Sight / Blueprint Graph */}
                <div className="col-span-3 bg-black/45 border border-white/5 rounded-2xl overflow-hidden relative flex flex-col items-center justify-center">
                    {/* Video Sight feed */}
                    <video 
                        ref={videoRef}
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover scale-x-[-1]"
                    />

                    {/* Blueprint grid overlay fallback */}
                    {(!streamRef.current || isSimulated) && (
                        <div className="absolute inset-0 bg-slate-950/95 bg-[linear-gradient(rgba(0,229,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] flex items-center justify-center">
                            {/* Detailed blueprint drawing of trig height solver */}
                            <div className="relative w-[340px] h-[220px] border border-cyan-500/10 rounded-lg p-4 bg-slate-950/40">
                                {/* Building representation */}
                                <div className="absolute bottom-4 right-6 w-16 h-40 bg-slate-900/60 border border-cyan-500/30 rounded flex items-center justify-center text-xs font-mono text-cyan-400/40">
                                    OBJECT
                                </div>
                                {/* Ground Line */}
                                <div className="absolute bottom-4 left-6 right-6 h-0.5 border-t border-dashed border-cyan-400/40" />
                                {/* Tilt hypotenuse */}
                                <div 
                                    className="absolute bottom-4 left-6 h-0.5 border-t-2 border-cyan-400 origin-left shadow-[0_0_8px_rgba(0,229,255,0.4)]"
                                    style={{ 
                                        width: `${180 / Math.cos(pitchRad)}px`,
                                        transform: `rotate(${-activePitch}deg)`
                                    }}
                                />
                                {/* Height label */}
                                <div className="absolute bottom-4 right-22 h-40 w-0.5 border-r border-dashed border-cyan-500/20" />
                                
                                {/* Labels */}
                                <span className="absolute bottom-6 left-12 text-[9px] font-mono text-slate-500">baseline d = {distance}m</span>
                                <span className="absolute bottom-16 left-32 text-[10px] font-mono text-cyan-400">tilt θ = {activePitch.toFixed(0)}°</span>
                                <span className="absolute top-20 right-26 text-[10px] font-mono text-cyan-400 font-bold">h = {computedHeight.toFixed(2)}m</span>
                            </div>
                        </div>
                    )}

                    {/* Crosshair Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                        <div className="w-12 h-12 border border-cyan-500/30 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_#00e5ff]" />
                        </div>
                        <div className="absolute w-40 h-0.5 border-t border-cyan-500/20" />
                        <div className="absolute h-40 w-0.5 border-l border-cyan-500/20" />
                        
                        <div className="absolute right-6 top-6 bg-black/75 border border-cyan-400/20 px-4 py-2 rounded-xl text-center font-mono">
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest block">{ft.pitchAngle || 'Pitch Angle'}</span>
                            <span className="text-base font-black text-cyan-400">
                                {activePitch.toFixed(1)}°
                            </span>
                        </div>
                    </div>

                    {/* Angle simulator controls */}
                    {(isSimulated || sensorPermission === 'denied' || debugMode) && (
                        <div className="absolute bottom-4 left-4 right-4 p-4 bg-slate-950/80 border border-yellow-500/10 rounded-xl flex items-center justify-between gap-6 z-20">
                            <div className="flex items-center gap-2 shrink-0">
                                <Settings size={14} className="text-yellow-500 animate-spin-slow" />
                                <span className="text-[9px] font-mono font-bold text-yellow-500 uppercase tracking-wider">{ft.simulatedTiltSliders || 'Angle Sim'}</span>
                            </div>
                            <div className="flex-1 flex items-center gap-4">
                                <input 
                                    type="range"
                                    min="-25"
                                    max="85"
                                    step="1"
                                    value={simPitch}
                                    onChange={e => {
                                        setSimPitch(Number(e.target.value));
                                        if (simPitch % 5 === 0) playClickSound();
                                    }}
                                    className="flex-1 h-1 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-yellow-500 outline-none"
                                />
                                <span className="text-xs font-bold font-mono text-yellow-400 w-10 text-right">{simPitch}°</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
