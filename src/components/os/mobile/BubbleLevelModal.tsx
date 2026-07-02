'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, X, HelpCircle, RefreshCw, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FieldToolsStrings } from '@/locales/fieldToolsTranslations';

interface BubbleLevelModalProps {
    isOpen: boolean;
    onClose: () => void;
    ft: FieldToolsStrings;
    debugMode: boolean;
}

export function BubbleLevelModal({ isOpen, onClose, ft, debugMode }: BubbleLevelModalProps) {
    const [tilt, setTilt] = useState({ x: 0, y: 0 }); // In degrees
    const [offsets, setOffsets] = useState({ x: 0, y: 0 }); // Calibration offsets
    const [permissionState, setPermissionState] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
    const [isLevel, setIsLevel] = useState(false);
    
    // Fallback manual slider state for desktop/testing
    const [isSimulated, setIsSimulated] = useState(false);

    // Audio beep context for level indicator
    const lastVibeRef = useRef<number>(0);

    const playLevelFeedback = () => {
        const now = Date.now();
        if (now - lastVibeRef.current < 2000) return; // limit to once every 2 seconds
        lastVibeRef.current = now;

        // Sound Beep
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Standard beep
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
        } catch (e) {}

        // Vibrate
        if ('vibrate' in navigator) {
            navigator.vibrate(80);
        }
    };

    // Request permissions dynamically
    const requestPermission = async () => {
        const DeviceOrientation = (window as any).DeviceOrientationEvent;
        
        if (DeviceOrientation && typeof DeviceOrientation.requestPermission === 'function') {
            try {
                const response = await DeviceOrientation.requestPermission();
                if (response === 'granted') {
                    setPermissionState('granted');
                    startListening();
                } else {
                    setPermissionState('denied');
                    setIsSimulated(true);
                }
            } catch (e) {
                console.error('iOS Sensor permission request failed:', e);
                setPermissionState('denied');
                setIsSimulated(true);
            }
        } else {
            // Android or Desktop (no permission needed, or unsupported)
            if ('DeviceOrientationEvent' in window) {
                setPermissionState('granted');
                startListening();
            } else {
                setPermissionState('unsupported');
                setIsSimulated(true);
            }
        }
    };

    const startListening = () => {
        window.addEventListener('deviceorientation', handleOrientation);
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
        // gamma is left-to-right tilt (-90 to 90)
        // beta is front-to-back tilt (-180 to 180)
        const roll = e.gamma || 0;
        const pitch = e.beta || 0;
        
        setTilt({ x: roll, y: pitch });
        setIsSimulated(false);
    };

    useEffect(() => {
        if (isOpen) {
            // Check if browser supports orientation
            if ('DeviceOrientationEvent' in window) {
                // If it is iOS, it requires user interaction to request permission
                const DeviceOrientation = (window as any).DeviceOrientationEvent;
                if (typeof DeviceOrientation.requestPermission === 'function') {
                    setPermissionState('default');
                } else {
                    // Android/Standard Chrome PWA
                    setPermissionState('granted');
                    startListening();
                }
            } else {
                setPermissionState('unsupported');
                setIsSimulated(true);
            }
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, [isOpen]);

    // Calculate calibrated tilt
    const currentX = Number((tilt.x - offsets.x).toFixed(1));
    const currentY = Number((tilt.y - offsets.y).toFixed(1));

    // Check if level
    useEffect(() => {
        const level = Math.abs(currentX) <= 0.4 && Math.abs(currentY) <= 0.4;
        setIsLevel(level);
        if (level && isOpen) {
            playLevelFeedback();
        }
    }, [currentX, currentY, isOpen]);

    // Calibrate / Tare active position
    const handleCalibrate = () => {
        setOffsets({ x: tilt.x, y: tilt.y });
        if ('vibrate' in navigator) navigator.vibrate(50);
    };

    const handleResetCalibration = () => {
        setOffsets({ x: 0, y: 0 });
        if ('vibrate' in navigator) navigator.vibrate(50);
    };

    // Calculate bubble position in pixels
    // Max displacement is bounded to the size of the container (160px container -> max radius 70px)
    const containerRadius = 110;
    const maxAngle = 15; // 15 degrees max tilt visual displacement
    const bubbleX = Math.max(-containerRadius, Math.min(containerRadius, (currentX / maxAngle) * containerRadius));
    const bubbleY = Math.max(-containerRadius, Math.min(containerRadius, (currentY / maxAngle) * containerRadius));

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-[#020408]/90 backdrop-blur-md flex flex-col justify-end md:justify-center p-0 md:p-6"
                >
                    <div className="w-full max-w-md mx-auto bg-[#070b12] border-t md:border border-cyan-900/30 rounded-t-[2.5rem] md:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] md:h-auto">
                        
                        {/* Header */}
                        <header className="flex-none p-5 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <div>
                                <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                                    <Smartphone size={16} className="text-cyan-400" />
                                    {ft.engineeringSpiritLevel}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{ft.gyroscopeTool}</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white active:scale-95 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </header>

                        {/* Spirit Level Viewport */}
                        <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-8 min-h-[350px]">
                            {permissionState === 'default' && (
                                <div className="absolute inset-0 bg-[#070b12] p-8 flex flex-col items-center justify-center text-center space-y-6 z-20">
                                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                        <Smartphone size={32} />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-bold text-sm text-white">{ft.motionPermissionRequired}</h4>
                                        <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                                            {ft.motionPermissionDesc}
                                        </p>
                                    </div>
                                    <button
                                        onClick={requestPermission}
                                        className="px-6 py-3 bg-cyan-500 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:bg-cyan-400 transition-all active:scale-95"
                                    >
                                        {ft.enableGyroscope}
                                    </button>
                                </div>
                            )}

                            {/* Bubble Level concentric circles */}
                            <div className="relative w-64 h-64 rounded-full border border-cyan-900/30 bg-[#03060a] flex items-center justify-center shadow-inner overflow-hidden">
                                {/* Crosshair axes */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-full h-[1px] bg-cyan-900/15" />
                                    <div className="h-full w-[1px] bg-cyan-900/15" />
                                </div>
                                
                                {/* Inner concentric circles representing angle intervals */}
                                <div className="absolute w-48 h-48 rounded-full border border-cyan-900/10 pointer-events-none" />
                                <div className="absolute w-32 h-32 rounded-full border border-cyan-900/20 pointer-events-none" />
                                <div className="absolute w-16 h-16 rounded-full border border-cyan-500/20 pointer-events-none flex items-center justify-center">
                                    {/* Perfect target level center */}
                                    <div className={`w-3 h-3 rounded-full border border-cyan-400/50 ${isLevel ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_10px_#10b981]' : ''} transition-colors duration-150`} />
                                </div>

                                {/* Floating bubble */}
                                <motion.div
                                    animate={{ x: bubbleX, y: bubbleY }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                                    className={`absolute w-8 h-8 rounded-full shadow-[0_0_15px_rgba(0,229,255,0.4)] border flex items-center justify-center ${isLevel ? 'bg-emerald-400 border-emerald-300' : 'bg-cyan-400 border-cyan-300'}`}
                                >
                                    {/* Liquid bubble sheen */}
                                    <div className="w-2.5 h-2.5 bg-white/40 rounded-full absolute top-1 left-1.5" />
                                </motion.div>
                            </div>

                            {/* Numeric Angle Telemetry HUD */}
                            <div className="w-full grid grid-cols-2 gap-4">
                                <div className={`p-4 rounded-2xl border text-center transition-colors ${Math.abs(currentX) <= 0.4 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-950/40 border-white/5'}`}>
                                    <span className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider">{ft.xAxisRoll}</span>
                                    <span className={`text-xl font-mono font-bold ${Math.abs(currentX) <= 0.4 ? 'text-emerald-400' : 'text-white'}`}>{currentX > 0 ? `+${currentX}` : currentX}°</span>
                                </div>
                                <div className={`p-4 rounded-2xl border text-center transition-colors ${Math.abs(currentY) <= 0.4 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-950/40 border-white/5'}`}>
                                    <span className="block text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider">{ft.yAxisPitch}</span>
                                    <span className={`text-xl font-mono font-bold ${Math.abs(currentY) <= 0.4 ? 'text-emerald-400' : 'text-white'}`}>{currentY > 0 ? `+${currentY}` : currentY}°</span>
                                </div>
                            </div>
                        </div>

                        {/* Controls & Sim Mode Footer */}
                        <div className="flex-none p-5 bg-slate-950/40 border-t border-white/5 space-y-4">
                            <div className="flex justify-between items-center gap-3">
                                <button
                                    onClick={handleCalibrate}
                                    className="flex-1 py-3.5 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95"
                                >
                                    {ft.calibrateTare}
                                </button>
                                <button
                                    onClick={handleResetCalibration}
                                    className="px-4 py-3.5 border border-white/5 text-slate-500 hover:text-white rounded-xl transition-all active:scale-95"
                                    title={ft.resetCalibration}
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </div>

                            {/* Testing fallback slider simulator */}
                            {debugMode && isSimulated && (
                                <div className="p-4 bg-slate-950/60 border border-yellow-500/10 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-mono font-bold text-yellow-500 uppercase tracking-wider">{ft.simulatedTiltSliders}</span>
                                        <HelpCircle size={10} className="text-yellow-500/60" />
                                    </div>
                                    <div className="space-y-2 text-[10px] font-mono">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[9px] text-slate-400">
                                                <span>{ft.xAxisShift}</span>
                                                <span>{tilt.x}°</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="-15" 
                                                max="15" 
                                                step="0.1" 
                                                value={tilt.x} 
                                                onChange={e => setTilt(prev => ({ ...prev, x: Number(e.target.value) }))}
                                                className="w-full accent-cyan-500 h-1 bg-cyan-950 rounded-lg outline-none cursor-pointer"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[9px] text-slate-400">
                                                <span>{ft.yAxisShift}</span>
                                                <span>{tilt.y}°</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="-15" 
                                                max="15" 
                                                step="0.1" 
                                                value={tilt.y} 
                                                onChange={e => setTilt(prev => ({ ...prev, y: Number(e.target.value) }))}
                                                className="w-full accent-cyan-500 h-1 bg-cyan-950 rounded-lg outline-none cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
