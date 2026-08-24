'use client';

import React, { useState, useEffect } from 'react';
import { Compass, Settings } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { getFieldToolsStrings } from '@/locales/fieldToolsTranslations';
import { playClickSound, playSuccessSound } from '@/mobile/services/audioSynth';
import { useWorkspaceStore } from '@/store/workspaceStore';

export default function GPSSurveyorModule() {
    const { language } = useI18nStore();
    const ft = getFieldToolsStrings(language);
    const debugMode = useWorkspaceStore((s) => s.debugMode);

    const [coords, setCoords] = useState<{ lat: number; lon: number; alt: number | null; accuracy: number | null } | null>(null);
    const [heading, setHeading] = useState<number>(0);
    const [isTracking, setIsTracking] = useState(false);
    const [isSimulated, setIsSimulated] = useState(true); // Default to true on desktop

    // Simulation states
    const [simLat, setSimLat] = useState(41.0082); // Istanbul coordinates
    const [simLon, setSimLon] = useState(28.9784);
    const [simAlt, setSimAlt] = useState(34.2);
    const [simHeading, setSimHeading] = useState(45);

    useEffect(() => {
        // Geolocation tracking
        let watchId: number | null = null;
        
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
                },
                () => {
                    setIsSimulated(true);
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }

        // Compass orientation listener
        const handleOrientation = (e: DeviceOrientationEvent) => {
            const webkitHeading = (e as any).webkitCompassHeading;
            if (webkitHeading !== undefined) {
                setHeading(webkitHeading);
                setIsSimulated(false);
            } else if (e.alpha !== null) {
                setHeading(e.alpha);
                setIsSimulated(false);
            }
        };

        window.addEventListener('deviceorientation', handleOrientation, true);
        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    const activeLat = isSimulated ? simLat : (coords?.lat ?? 0);
    const activeLon = isSimulated ? simLon : (coords?.lon ?? 0);
    const activeAlt = isSimulated ? simAlt : (coords?.alt ?? 0);
    const activeAcc = isSimulated ? 3.0 : (coords?.accuracy ?? 999.0);
    const activeHeading = isSimulated ? simHeading : heading;

    return (
        <div className="flex flex-col h-full bg-[#05090e] p-6 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/5 relative z-10">
                <div>
                    <h2 className="text-lg font-black italic tracking-wider uppercase flex items-center gap-2 text-white">
                        <Compass className="text-cyan-400 animate-pulse" size={20} />
                        {ft.gpsSurveyor || 'GPS Surveyor & Compass'}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{ft.gpsSurveyorDesc || 'Real-time coordinates, altitude & heading'}</p>
                </div>
            </div>

            {/* Main Panel */}
            <div className="grid grid-cols-5 gap-6 mt-6 flex-1 min-h-0 relative z-10">
                
                {/* Left: Compass Ring */}
                <div className="col-span-2 flex flex-col items-center justify-center bg-black/45 border border-white/5 rounded-2xl p-6">
                    <div className="relative w-56 h-56 rounded-full border-2 border-cyan-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.05)]">
                        {/* Static cursor */}
                        <div className="absolute top-0 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-red-500 z-20 -mt-1.5" />
                        
                        {/* Rotating ring */}
                        <div 
                            className="w-full h-full rounded-full border border-dashed border-cyan-500/30 transition-transform duration-300 relative flex items-center justify-center"
                            style={{ transform: `rotate(${-activeHeading}deg)` }}
                        >
                            <span className="absolute top-3 font-mono font-black text-sm text-red-400">N</span>
                            <span className="absolute bottom-3 font-mono font-black text-sm text-cyan-400">S</span>
                            <span className="absolute right-3 font-mono font-black text-sm text-cyan-400">E</span>
                            <span className="absolute left-3 font-mono font-black text-sm text-cyan-400">W</span>
                            
                            <div className="absolute w-full h-0.5 border-t border-cyan-500/10" />
                            <div className="absolute h-full w-0.5 border-l border-cyan-500/10" />
                        </div>

                        {/* Dial center readout */}
                        <div className="absolute w-24 h-24 rounded-full bg-[#03060a] border border-cyan-500/10 flex flex-col items-center justify-center shadow-lg">
                            <span className="text-2xl font-black font-mono text-cyan-400 tracking-tighter">
                                {Math.round(activeHeading)}°
                            </span>
                            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">HEADING</span>
                        </div>
                    </div>
                </div>

                {/* Right: Data Readings & Simulation */}
                <div className="col-span-3 space-y-4 flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl text-center space-y-1">
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">{ft.latitude || 'Latitude'}</span>
                            <span className="text-lg font-black font-mono text-cyan-400">
                                {activeLat.toFixed(6)}°
                            </span>
                        </div>
                        <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl text-center space-y-1">
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">{ft.longitude || 'Longitude'}</span>
                            <span className="text-lg font-black font-mono text-cyan-400">
                                {activeLon.toFixed(6)}°
                            </span>
                        </div>
                        <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl text-center space-y-1">
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">{ft.altitude || 'Altitude'}</span>
                            <span className="text-lg font-black font-mono text-cyan-400">
                                {activeAlt !== null ? `${activeAlt.toFixed(1)} m` : 'N/A'}
                            </span>
                        </div>
                        <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl text-center space-y-1">
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">{ft.accuracy || 'Accuracy'}</span>
                            <span className="text-lg font-black font-mono text-cyan-400">
                                ±{activeAcc.toFixed(1)} m
                            </span>
                        </div>
                    </div>

                    {/* Simulation Panel */}
                    {(isSimulated || debugMode) && (
                        <div className="p-4 bg-slate-950/60 border border-yellow-500/10 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2">
                                <Settings size={14} className="text-yellow-500" />
                                <span className="text-[9px] font-mono font-bold text-yellow-500 uppercase tracking-wider">Simulator Controls</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                                        <span>Latitude</span>
                                        <span className="text-yellow-500">{simLat.toFixed(4)}°</span>
                                    </div>
                                    <input 
                                        type="range" min="36.0" max="42.0" step="0.001" value={simLat}
                                        onChange={e => { setSimLat(Number(e.target.value)); if (Math.floor(simLat * 100) % 5 === 0) playClickSound(); }}
                                        className="w-full h-1 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-yellow-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                                        <span>Longitude</span>
                                        <span className="text-yellow-500">{simLon.toFixed(4)}°</span>
                                    </div>
                                    <input 
                                        type="range" min="26.0" max="45.0" step="0.001" value={simLon}
                                        onChange={e => { setSimLon(Number(e.target.value)); if (Math.floor(simLon * 100) % 5 === 0) playClickSound(); }}
                                        className="w-full h-1 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-yellow-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                                        <span>Altitude</span>
                                        <span className="text-yellow-500">{simAlt} m</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="2500" step="10" value={simAlt}
                                        onChange={e => { setSimAlt(Number(e.target.value)); if (simAlt % 100 === 0) playClickSound(); }}
                                        className="w-full h-1 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-yellow-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                                        <span>Heading</span>
                                        <span className="text-yellow-500">{simHeading}°</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="360" step="1" value={simHeading}
                                        onChange={e => { setSimHeading(Number(e.target.value)); if (simHeading % 10 === 0) playClickSound(); }}
                                        className="w-full h-1 bg-slate-900 border border-white/5 rounded-lg appearance-none cursor-pointer accent-yellow-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
