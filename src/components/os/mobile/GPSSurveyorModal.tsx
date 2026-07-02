'use client';

import React, { useState, useEffect } from 'react';
import { X, Navigation, Compass, Settings, Check } from 'lucide-react';
import { playClickSound, playSuccessSound } from '@/mobile/services/audioSynth';
import { useMobileStore } from '@/mobile/store/mobileStore';

interface GPSSurveyorModalProps {
    isOpen: boolean;
    onClose: () => void;
    ft: any;
    debugMode?: boolean;
}

export function GPSSurveyorModal({ isOpen, onClose, ft, debugMode }: GPSSurveyorModalProps) {
    const soundEnabled = useMobileStore(s => s.soundEnabled);
    const [coords, setCoords] = useState<{ lat: number; lon: number; alt: number | null; accuracy: number | null } | null>(null);
    const [heading, setHeading] = useState<number>(0);
    const [isTracking, setIsTracking] = useState(false);
    const [isSimulated, setIsSimulated] = useState(true); // Default to true for desktops

    // Simulation states
    const [simLat, setSimLat] = useState(41.0082); // Istanbul coordinates
    const [simLon, setSimLon] = useState(28.9784);
    const [simAlt, setSimAlt] = useState(34.2);
    const [simHeading, setSimHeading] = useState(45);

    useEffect(() => {
        if (!isOpen) {
            stopTracking();
            return;
        }

        // Detect if geolocation is available and attempt to request permission
        if (navigator.geolocation) {
            startTracking();
        } else {
            setIsSimulated(true);
        }

        // Compass heading orientation listener
        const handleOrientation = (e: DeviceOrientationEvent) => {
            // Check for iOS webkitHeading
            const webkitHeading = (e as any).webkitCompassHeading;
            if (webkitHeading !== undefined) {
                setHeading(webkitHeading);
                setIsSimulated(false);
            } else if (e.alpha !== null) {
                // For Android / Chrome absolute orientation
                setHeading(e.alpha);
                setIsSimulated(false);
            }
        };

        window.addEventListener('deviceorientation', handleOrientation, true);
        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
            stopTracking();
        };
    }, [isOpen]);

    let watchId: number | null = null;

    const startTracking = () => {
        setIsTracking(true);
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    setCoords({
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                        alt: pos.coords.altitude,
                        accuracy: pos.coords.accuracy
                    });
                    setIsSimulated(false);
                    if (soundEnabled) playSuccessSound();
                },
                (err) => {
                    console.warn('[GPSSurveyor] GPS watch position error:', err);
                    setIsSimulated(true);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    };

    const stopTracking = () => {
        setIsTracking(false);
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }
    };

    const handleClose = () => {
        playClickSound();
        onClose();
    };

    const activeLat = isSimulated ? simLat : (coords?.lat ?? 0);
    const activeLon = isSimulated ? simLon : (coords?.lon ?? 0);
    const activeAlt = isSimulated ? simAlt : (coords?.alt ?? 0);
    const activeAcc = isSimulated ? 3.0 : (coords?.accuracy ?? 999.0);
    const activeHeading = isSimulated ? simHeading : heading;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#020408]/95 p-4 text-white overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Compass className="text-cyan-400 animate-pulse" size={20} />
                    <div>
                        <h3 className="text-sm font-black italic uppercase tracking-wider">{ft.gpsSurveyor || 'GPS Surveyor'}</h3>
                        <span className="text-[9px] text-slate-500 font-mono block leading-none">{ft.gpsSurveyorDesc}</span>
                    </div>
                </div>
                <button onClick={handleClose} className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5">
                    <X size={16} />
                </button>
            </div>

            {/* Content grid */}
            <div className="flex-1 flex flex-col justify-between mt-4 gap-4">
                
                {/* 1. Compass dial visualization */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-950/40 border border-white/5 rounded-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.05)_0%,transparent_75%)] pointer-events-none" />
                    
                    {/* Compass dial */}
                    <div className="relative w-44 h-44 rounded-full border-2 border-cyan-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.05)]">
                        {/* Static cursor */}
                        <div className="absolute top-0 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500 z-20 -mt-1" />
                        
                        {/* Rotating ring */}
                        <div 
                            className="w-full h-full rounded-full border border-dashed border-cyan-500/30 transition-transform duration-300 relative flex items-center justify-center"
                            style={{ transform: `rotate(${-activeHeading}deg)` }}
                        >
                            {/* Direction labels */}
                            <span className="absolute top-2 font-mono font-black text-xs text-red-400">N</span>
                            <span className="absolute bottom-2 font-mono font-black text-xs text-cyan-400">S</span>
                            <span className="absolute right-2 font-mono font-black text-xs text-cyan-400">E</span>
                            <span className="absolute left-2 font-mono font-black text-xs text-cyan-400">W</span>
                            
                            {/* Dial lines */}
                            <div className="absolute w-full h-0.5 border-t border-cyan-500/10" />
                            <div className="absolute h-full w-0.5 border-l border-cyan-500/10" />
                            
                            {/* Small ticks */}
                            {[30, 60, 120, 150, 210, 240, 300, 330].map(deg => (
                                <div 
                                    key={deg} 
                                    className="absolute w-full h-0.5 border-t border-cyan-500/5"
                                    style={{ transform: `rotate(${deg}deg)` }}
                                />
                            ))}
                        </div>

                        {/* Dial center readout */}
                        <div className="absolute w-20 h-20 rounded-full bg-[#03060a] border border-cyan-500/10 flex flex-col items-center justify-center shadow-lg">
                            <span className="text-xl font-black font-mono text-cyan-400 tracking-tighter">
                                {Math.round(activeHeading)}°
                            </span>
                            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">HEADING</span>
                        </div>
                    </div>
                </div>

                {/* 2. Geolocation Telemetry Readout */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-950/30 border border-white/5 rounded-2xl space-y-1 text-center">
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">{ft.latitude || 'Latitude'}</span>
                        <span className="text-base font-black font-mono text-cyan-400 tracking-tight block">
                            {activeLat.toFixed(6)}°
                        </span>
                    </div>

                    <div className="p-4 bg-slate-950/30 border border-white/5 rounded-2xl space-y-1 text-center">
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">{ft.longitude || 'Longitude'}</span>
                        <span className="text-base font-black font-mono text-cyan-400 tracking-tight block">
                            {activeLon.toFixed(6)}°
                        </span>
                    </div>

                    <div className="p-4 bg-slate-950/30 border border-white/5 rounded-2xl space-y-1 text-center">
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">{ft.altitude || 'Altitude'}</span>
                        <span className="text-base font-black font-mono text-cyan-400 tracking-tight block">
                            {activeAlt !== null ? `${activeAlt.toFixed(1)} m` : 'N/A'}
                        </span>
                    </div>

                    <div className="p-4 bg-slate-950/30 border border-white/5 rounded-2xl space-y-1 text-center">
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">{ft.accuracy || 'Accuracy'}</span>
                        <span className="text-base font-black font-mono text-cyan-400 tracking-tight block">
                            ±{activeAcc.toFixed(1)} m
                        </span>
                    </div>
                </div>

                {/* 3. Simulator / Debug controls */}
                {(isSimulated || debugMode) && (
                    <div className="p-4 bg-slate-950/60 border border-yellow-500/10 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2">
                            <Settings size={12} className="text-yellow-500" />
                            <span className="text-[9px] font-mono font-bold text-yellow-500 uppercase tracking-wider">{ft.noiseSimulator || 'Simulator Sandbox'}</span>
                        </div>

                        <div className="space-y-2">
                            {/* Lat/Lon simulation slider */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                                    <span>Latitude Sim</span>
                                    <span className="text-yellow-500 font-bold">{simLat.toFixed(4)}°</span>
                                </div>
                                <input 
                                    type="range"
                                    min="36.0"
                                    max="42.0"
                                    step="0.001"
                                    value={simLat}
                                    onChange={e => {
                                        setSimLat(Number(e.target.value));
                                        if (soundEnabled && Math.floor(simLat * 100) % 5 === 0) playClickSound();
                                    }}
                                    className="w-full h-1 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-yellow-500 outline-none"
                                />
                            </div>

                            {/* Altitude simulation slider */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                                    <span>Altitude Sim (m)</span>
                                    <span className="text-yellow-500 font-bold">{simAlt.toFixed(1)} m</span>
                                </div>
                                <input 
                                    type="range"
                                    min="0"
                                    max="1200"
                                    step="10"
                                    value={simAlt}
                                    onChange={e => {
                                        setSimAlt(Number(e.target.value));
                                        if (soundEnabled && simAlt % 50 === 0) playClickSound();
                                    }}
                                    className="w-full h-1 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-yellow-500 outline-none"
                                />
                            </div>

                            {/* Heading simulation slider */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                                    <span>Compass Heading</span>
                                    <span className="text-yellow-500 font-bold">{simHeading}°</span>
                                </div>
                                <input 
                                    type="range"
                                    min="0"
                                    max="360"
                                    step="1"
                                    value={simHeading}
                                    onChange={e => {
                                        setSimHeading(Number(e.target.value));
                                        if (soundEnabled && simHeading % 10 === 0) playClickSound();
                                    }}
                                    className="w-full h-1 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-yellow-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer status */}
                <div className="text-center font-mono text-[8px] text-slate-600 pb-1 mt-1">
                    {isSimulated ? 'RUNNING IN SIMULATION MODE (NO HARDWARE GPS LOCK)' : 'HARDWARE GEOLOCATION LOCK ESTABLISHED'}
                </div>
            </div>
        </div>
    );
}
