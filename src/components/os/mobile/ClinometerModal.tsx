'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Smartphone, Play, Square, Settings, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FieldToolsStrings } from '@/locales/fieldToolsTranslations';
import { playClickSound, playWarningSound, playSuccessSound } from '@/mobile/services/audioSynth';

interface ClinometerModalProps {
    isOpen: boolean;
    onClose: () => void;
    ft: FieldToolsStrings;
    debugMode: boolean;
}

export function ClinometerModal({ isOpen, onClose, ft, debugMode }: ClinometerModalProps) {
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [pitch, setPitch] = useState(0); // Angle in degrees
    const [distance, setDistance] = useState(10); // Meters
    const [eyeHeight, setEyeHeight] = useState(1.6); // Meters
    const [sensorPermission, setSensorPermission] = useState<'default' | 'granted' | 'denied'>('default');
    const [isSimulated, setIsSimulated] = useState(false);
    const [simPitch, setSimPitch] = useState(25); // Simulated slider angle

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (!isOpen) {
            stopMeasurement();
        }
        return () => stopMeasurement();
    }, [isOpen]);

    const requestPermissionsAndStart = async () => {
        playClickSound();
        
        // 1. Gyroscope Orientation permission (especially iOS 13+)
        const DeviceOrientation = (window as any).DeviceOrientationEvent;
        if (DeviceOrientation && typeof DeviceOrientation.requestPermission === 'function') {
            try {
                const response = await DeviceOrientation.requestPermission();
                if (response === 'granted') {
                    setSensorPermission('granted');
                } else {
                    setSensorPermission('denied');
                    setIsSimulated(true);
                }
            } catch (e) {
                console.warn('[Clinometer] Gyro permission error, fallback to sim:', e);
                setSensorPermission('denied');
                setIsSimulated(true);
            }
        } else {
            setSensorPermission('granted');
        }

        // 2. Camera feed activation
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (e) {
            console.warn('[Clinometer] Camera stream blocked, drawing mock blueprint sight:', e);
            setIsSimulated(true);
        }

        startMeasurement();
    };

    const startMeasurement = () => {
        setIsMeasuring(true);
        if ('DeviceOrientationEvent' in window && !isSimulated && sensorPermission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
        }
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
        if (isSimulated) return;
        // Pitch represents rotation around X-axis (tilt back and forth)
        // Usually beta represents pitch (-180 to 180). We normalize to horizontal level
        let rawPitch = e.beta || 0;
        
        // When holding device in portrait, pointing along its top edge, pitch is approximately (90 - beta)
        // Adjust based on holding orientation: if holding vertically, beta is ~90 when level
        let angle = rawPitch - 90;
        if (angle < -90) angle = -90;
        if (angle > 90) angle = 90;
        
        setPitch(-angle); // Make upward tilt positive
    };

    const stopMeasurement = () => {
        setIsMeasuring(false);
        window.removeEventListener('deviceorientation', handleOrientation);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const activePitch = isSimulated ? simPitch : pitch;
    // Trig height: h = d * tan(theta) + h_eye
    // Angle converted to radians: rad = deg * PI / 180
    const pitchRad = (activePitch * Math.PI) / 180;
    const computedHeight = Math.max(0, distance * Math.tan(pitchRad) + eyeHeight);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-[#020408]/95 backdrop-blur-md flex flex-col justify-end md:justify-center p-0 md:p-6"
                >
                    <div className="w-full max-w-lg mx-auto bg-[#070b12] border-t md:border border-cyan-900/30 rounded-t-[2.5rem] md:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-auto max-h-[85vh]">
                        {/* Header */}
                        <header className="flex-none p-5 border-b border-white/5 flex items-center justify-between bg-black/20 z-10">
                            <div>
                                <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                                    <Compass size={16} className="text-cyan-400 animate-spin-slow" />
                                    {ft.clinometer || 'Clinometer / Height Finder'}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{ft.clinometerDesc || 'Measure height & slope via camera & tilt'}</p>
                            </div>
                            <button 
                                onClick={() => { playClickSound(); onClose(); }}
                                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white active:scale-95 transition-all cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </header>

                        {/* Camera HUD Sight Screen */}
                        <div className="flex-none p-0 bg-black flex flex-col items-center justify-center relative overflow-hidden h-[240px] border-b border-white/5">
                            {/* Video Feed */}
                            <video 
                                ref={videoRef}
                                autoPlay 
                                playsInline 
                                className="w-full h-full object-cover scale-x-[-1]"
                            />

                            {/* Blueprint grid overlay fallback when camera is not running */}
                            {(!streamRef.current || isSimulated) && (
                                <div className="absolute inset-0 bg-slate-950/90 bg-[linear-gradient(rgba(0,229,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] flex items-center justify-center">
                                    {/* Trig building visual graph */}
                                    <div className="absolute w-[200px] h-[120px] border border-cyan-500/20 bottom-10 left-10 rounded">
                                        {/* Building */}
                                        <div className="absolute bottom-0 right-4 w-12 h-20 bg-slate-900 border border-slate-700 rounded-sm flex items-center justify-center text-[8px] font-mono text-slate-500">
                                            OBJ
                                        </div>
                                        {/* Baseline */}
                                        <div className="absolute bottom-0 left-4 right-4 h-0.5 border-t border-dashed border-cyan-400/40" />
                                        {/* Hypotenuse line representation */}
                                        <div 
                                            className="absolute bottom-0 left-4 h-0.5 border-t-2 border-cyan-400 origin-left shadow-[0_0_8px_rgba(0,229,255,0.4)]"
                                            style={{ 
                                                width: `${100 / Math.cos(pitchRad)}px`,
                                                transform: `rotate(${-activePitch}deg)`
                                            }}
                                        />
                                        {/* Eye height offset */}
                                        <div className="absolute bottom-0 left-4 w-1 h-3 bg-red-400" />
                                        <span className="absolute bottom-1 left-7 text-[7px] font-mono text-cyan-400/60">d={distance}m</span>
                                        <span className="absolute bottom-6 right-20 text-[7px] font-mono text-cyan-400">θ={activePitch.toFixed(0)}°</span>
                                    </div>
                                </div>
                            )}

                            {/* Sight Crosshair Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                                <div className="w-10 h-10 border border-cyan-500/30 rounded-full flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#00e5ff]" />
                                </div>
                                <div className="absolute w-20 h-0.5 border-t border-cyan-500/20" />
                                <div className="absolute h-20 w-0.5 border-l border-cyan-500/20" />
                                
                                {/* Real-time Angle Box */}
                                <div className="absolute right-6 top-6 bg-black/60 border border-cyan-400/20 px-3 py-1.5 rounded-lg text-center font-mono">
                                    <span className="text-[7px] text-slate-500 uppercase tracking-widest block">{ft.pitchAngle || 'Pitch Angle'}</span>
                                    <span className="text-sm font-black text-cyan-400">
                                        {activePitch.toFixed(1)}°
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Trigonometric Sizing parameters */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                            
                            {/* Height Result card */}
                            <div className="p-4 bg-slate-950/30 border border-cyan-500/20 rounded-2xl text-center space-y-1 relative overflow-hidden group shadow-[0_0_20px_rgba(6,182,212,0.05)]">
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
                                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">{ft.calculatedHeight || 'Calculated Height'}</span>
                                <span className="text-3xl font-black font-mono text-cyan-400 tracking-tighter block">
                                    {computedHeight.toFixed(2)} <span className="text-xs font-normal text-slate-400 font-sans">m</span>
                                </span>
                                <span className="text-[8px] text-slate-500 block font-mono">
                                    {distance}m × tan({activePitch.toFixed(1)}°) + {eyeHeight}m
                                </span>
                            </div>

                            {/* Distance parameter slider */}
                            <div className="p-4 bg-slate-950/20 border border-white/5 rounded-2xl space-y-2">
                                <div className="flex justify-between items-baseline font-mono text-xs">
                                    <span className="text-slate-400">{ft.targetDistance || 'Distance to Object'}</span>
                                    <span className="font-bold text-cyan-400">{distance.toFixed(1)} m</span>
                                </div>
                                <input 
                                    type="range"
                                    min="2"
                                    max="80"
                                    step="0.5"
                                    value={distance}
                                    onChange={e => {
                                        setDistance(Number(e.target.value));
                                        if (Math.floor(distance) % 5 === 0) playClickSound();
                                    }}
                                    className="w-full h-1 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400 outline-none"
                                />
                            </div>

                            {/* Eye height parameter slider */}
                            <div className="p-4 bg-slate-950/20 border border-white/5 rounded-2xl space-y-2">
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

                            {/* Desktop Sandbox Sliders (simulation) */}
                            {(isSimulated || sensorPermission === 'denied' || debugMode) && (
                                <div className="p-4 bg-slate-950/60 border border-yellow-500/10 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                                        <span className="text-[8px] font-mono font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-1">
                                            <Settings size={10} />
                                            {ft.simulatedTiltSliders || 'Simulated Tilt Sliders'}
                                        </span>
                                        <span className="text-[8px] font-mono text-slate-500">SANDBOX</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between font-mono text-[10px]">
                                            <span className="text-slate-500">{ft.pitchAngle || 'Pitch Angle'}</span>
                                            <span className="font-bold text-yellow-400">{simPitch.toFixed(1)}°</span>
                                        </div>
                                        <input 
                                            type="range"
                                            min="-30"
                                            max="85"
                                            step="1"
                                            value={simPitch}
                                            onChange={e => {
                                                setSimPitch(Number(e.target.value));
                                                if (simPitch % 5 === 0) playClickSound();
                                            }}
                                            className="w-full h-1 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-yellow-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Actions */}
                        <div className="flex-none p-5 bg-slate-950/40 border-t border-white/5 flex gap-3">
                            {!isMeasuring ? (
                                <button
                                    onClick={requestPermissionsAndStart}
                                    className="flex-1 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer"
                                >
                                    <Play size={14} className="fill-black" />
                                    {ft.enableGyroscope || 'Enable Gyroscope'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => { playClickSound(); stopMeasurement(); }}
                                    className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <Square size={14} className="fill-white" />
                                    {ft.stopDiagnostics || 'Stop Sensor Telemetry'}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
