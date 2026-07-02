'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Square, Settings, RefreshCw } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { getFieldToolsStrings } from '@/locales/fieldToolsTranslations';
import { playClickSound, playWarningSound } from '@/mobile/services/audioSynth';
import { useWorkspaceStore } from '@/store/workspaceStore';

function evaluateNoiseSeverity(db: number, ft: any) {
    if (db < 80) {
        return {
            zone: 'SAFE',
            label: ft.safetyZoneSafe || 'Safe (<80 dB)',
            desc: ft.noiseLevelQuiet || 'Safe environment. No hearing damage risk.',
            color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5 bg-emerald-950/20'
        };
    } else if (db < 85) {
        return {
            zone: 'MODERATE',
            label: ft.safetyZoneModerate || 'Moderate (80-85 dB)',
            desc: ft.noiseLevelModerate || 'Safe for short terms. Watch out for prolonged exposure.',
            color: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5 bg-yellow-950/20'
        };
    } else if (db < 90) {
        return {
            zone: 'ACTION',
            label: ft.safetyZoneActionNeeded || 'Action Level (85-90 dB)',
            desc: ft.noiseLevelActionNeeded || 'OSHA Action Level. Hearing protection recommended for 8+ hour shifts.',
            color: 'text-orange-400 border-orange-500/20 bg-orange-500/5 bg-orange-950/20'
        };
    } else if (db < 100) {
        return {
            zone: 'DANGER',
            label: ft.safetyZoneDangerous || 'Dangerous (90-100 dB)',
            desc: ft.noiseLevelDangerous || 'Dangerous. OSHA Limit. Hearing protection mandatory for exposure.',
            color: 'text-red-400 border-red-500/20 bg-red-500/5 bg-red-950/20'
        };
    } else {
        return {
            zone: 'CRITICAL',
            label: ft.safetyZoneExtreme || 'Extreme (>100 dB)',
            desc: ft.noiseLevelExtreme || 'Extreme hazard. High risk of immediate hearing loss. Avoid entry.',
            color: 'text-rose-500 border-rose-500/30 bg-rose-500/5 bg-rose-950/30'
        };
    }
}

export default function SoundMeterModule() {
    const { language } = useI18nStore();
    const ft = getFieldToolsStrings(language);
    const debugMode = useWorkspaceStore((s) => s.debugMode);

    const [isMeasuring, setIsMeasuring] = useState(false);
    const [currentDb, setCurrentDb] = useState(30);
    const [peakDb, setPeakDb] = useState(30);
    const [isSimulated, setIsSimulated] = useState(false);
    const [simSource, setSimSource] = useState<'office' | 'traffic' | 'factory' | 'pneumatic' | 'jet'>('office');
    const [micPermission, setMicPermission] = useState<'default' | 'granted' | 'denied'>('default');

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const dbHistoryRef = useRef<number[]>([]);
    const maxHistoryPoints = 150;

    useEffect(() => {
        return () => stopMeasurement();
    }, []);

    const requestPermissionAndStart = async () => {
        playClickSound();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            setMicPermission('granted');
            setIsSimulated(false);
            startAudioAnalysis(stream);
        } catch (err) {
            console.warn('[SoundMeter] Mic permission denied, switching to simulator:', err);
            setMicPermission('denied');
            setIsSimulated(true);
            startSimulatedAnalysis();
        }
    };

    const startAudioAnalysis = (stream: MediaStream) => {
        setIsMeasuring(true);
        dbHistoryRef.current = [];
        
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass();
            audioCtxRef.current = ctx;

            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;
            source.connect(analyser);

            const bufferLength = analyser.fftSize;
            const dataArray = new Uint8Array(bufferLength);
            const freqData = new Uint8Array(analyser.frequencyBinCount);

            const drawLoop = () => {
                if (!analyserRef.current) return;
                
                analyser.getByteTimeDomainData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const val = (dataArray[i] - 128) / 128;
                    sum += val * val;
                }
                const rms = Math.sqrt(sum / bufferLength);
                let db = rms > 0.0001 ? 20 * Math.log10(rms) + 110 : 30;
                db = Math.max(30, Math.min(125, db));
                
                setCurrentDb(db);
                setPeakDb(p => {
                    if (db > p) {
                        if (db > 85 && p <= 85) playWarningSound();
                        return db;
                    }
                    return p;
                });

                dbHistoryRef.current.push(db);
                if (dbHistoryRef.current.length > maxHistoryPoints) {
                    dbHistoryRef.current.shift();
                }

                analyser.getByteFrequencyData(freqData);
                drawSpectrum(freqData);

                animationRef.current = requestAnimationFrame(drawLoop);
            };

            animationRef.current = requestAnimationFrame(drawLoop);
        } catch (e) {
            console.error('[SoundMeter] Failed to build Web Audio nodes:', e);
            setIsSimulated(true);
            startSimulatedAnalysis();
        }
    };

    const startSimulatedAnalysis = () => {
        setIsMeasuring(true);
        dbHistoryRef.current = [];

        const simLoop = () => {
            let baseDb = 40;
            let variation = 3;
            if (simSource === 'traffic') { baseDb = 75; variation = 5; }
            else if (simSource === 'factory') { baseDb = 88; variation = 4; }
            else if (simSource === 'pneumatic') { baseDb = 100; variation = 6; }
            else if (simSource === 'jet') { baseDb = 115; variation = 3; }

            const db = baseDb + (Math.random() - 0.5) * variation;
            setCurrentDb(db);
            setPeakDb(p => {
                const nextPeak = Math.max(p, db);
                if (nextPeak > 85 && p <= 85) playWarningSound();
                return nextPeak;
            });

            dbHistoryRef.current.push(db);
            if (dbHistoryRef.current.length > maxHistoryPoints) {
                dbHistoryRef.current.shift();
            }

            const freqData = new Uint8Array(128);
            const time = Date.now() / 1000;
            for (let i = 0; i < 128; i++) {
                let factor = 0;
                if (simSource === 'office') {
                    factor = 20 * Math.sin(i / 10) + 15 * Math.sin(i / 3) + 30;
                } else if (simSource === 'traffic') {
                    factor = 50 * Math.sin(i / 20) + 40 * Math.sin(i / 5) + 60;
                } else if (simSource === 'factory') {
                    factor = 80 * Math.sin(i / 15 + time) + 30 * Math.cos(i / 2) + 90;
                } else if (simSource === 'pneumatic') {
                    factor = 100 * Math.sin(i / 8) + 60 * Math.cos(i / 1.5 + time * 5) + 120;
                } else {
                    factor = 120 * Math.sin(i / 40) + 50 * Math.sin(i / 4 + time * 10) + 140;
                }
                freqData[i] = Math.max(10, Math.min(255, factor + (Math.random() - 0.5) * 20));
            }
            drawSpectrum(freqData);

            animationRef.current = requestAnimationFrame(simLoop);
        };

        animationRef.current = requestAnimationFrame(simLoop);
    };

    const drawSpectrum = (freqData: Uint8Array) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }
        for (let j = 0; j < height; j += 25) {
            ctx.beginPath();
            ctx.moveTo(0, j);
            ctx.lineTo(width, j);
            ctx.stroke();
        }

        // Draw frequency bars
        const barWidth = (width / freqData.length) * 1.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < freqData.length; i++) {
            barHeight = (freqData[i] / 255) * height * 0.85;
            const intensity = freqData[i] / 255;
            let barColor = '#00e5ff';
            if (intensity > 0.8) barColor = '#ec4899';
            else if (intensity > 0.5) barColor = '#eab308';

            ctx.fillStyle = barColor;
            ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
            x += barWidth;
        }

        // Draw history line
        if (dbHistoryRef.current.length > 1) {
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            dbHistoryRef.current.forEach((dbVal, idx) => {
                const xCoord = (idx / maxHistoryPoints) * width;
                const yCoord = height - ((dbVal - 30) / 90) * height * 0.7 - 10;
                if (idx === 0) ctx.moveTo(xCoord, yCoord);
                else ctx.lineTo(xCoord, yCoord);
            });
            ctx.stroke();
        }
    };

    const stopMeasurement = () => {
        setIsMeasuring(false);
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close();
            audioCtxRef.current = null;
        }
        analyserRef.current = null;
    };

    const handleResetPeak = () => {
        playClickSound();
        setPeakDb(currentDb);
    };

    const severity = evaluateNoiseSeverity(currentDb, ft);

    return (
        <div className="flex flex-col h-full bg-[#05090e] p-6 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/5 relative z-10">
                <div>
                    <h2 className="text-lg font-black italic tracking-wider uppercase flex items-center gap-2 text-white">
                        <Volume2 className="text-cyan-400 animate-pulse" size={20} />
                        {ft.soundMeter || 'Sound Decibel Meter'}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{ft.soundMeterDesc || 'Real-time noise and audio frequency spectrum analyzer'}</p>
                </div>
            </div>

            {/* Visualizer Grid */}
            <div className="grid grid-cols-3 gap-6 mt-6 flex-1 min-h-0 relative z-10">
                {/* Left: Gauges & Compliance */}
                <div className="space-y-4 flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl text-center space-y-1 relative">
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">{ft.soundIntensityDb || 'Sound Intensity'}</span>
                            <span className={`text-3xl font-black font-mono tracking-tighter ${currentDb > 85 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
                                {currentDb.toFixed(1)} <span className="text-xs font-normal text-slate-400 font-sans">dB</span>
                            </span>
                        </div>
                        <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl text-center space-y-1 relative">
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">{ft.peakDb || 'Peak level'}</span>
                            <div className="flex items-baseline justify-center gap-2">
                                <span className="text-3xl font-black font-mono text-slate-300 tracking-tighter">
                                    {peakDb.toFixed(1)} <span className="text-xs font-normal text-slate-400 font-sans">dB</span>
                                </span>
                                <button onClick={handleResetPeak} className="p-1 rounded bg-white/5 text-slate-500 hover:text-white transition-all cursor-pointer">
                                    <RefreshCw size={10} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={`p-5 rounded-2xl border transition-all duration-300 flex-1 flex flex-col justify-center ${severity.color}`}>
                        <span className="text-[9px] font-mono font-bold block uppercase tracking-wider mb-1">{ft.noiseSeverityOSHA || 'OSHA Noise Compliance'}</span>
                        <h4 className="font-extrabold text-base text-white leading-tight">
                            {severity.label}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed mt-2">
                            {severity.desc}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        {micPermission === 'default' && !isSimulated && (
                            <button
                                onClick={requestPermissionAndStart}
                                className="flex-1 py-3 bg-yellow-500 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-yellow-400 transition-all active:scale-95 shadow-[0_0_15px_rgba(234,179,8,0.2)] cursor-pointer"
                            >
                                {ft.enableMicrophone || 'Enable Microphone'}
                            </button>
                        )}
                        {(micPermission !== 'default' || isSimulated) && (
                            isMeasuring ? (
                                <button
                                    onClick={() => { playClickSound(); stopMeasurement(); }}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <Square size={14} className="fill-white" />
                                    {ft.stopAnalysis || 'Stop Analysis'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        playClickSound();
                                        if (isSimulated) startSimulatedAnalysis();
                                        else if (streamRef.current) startAudioAnalysis(streamRef.current);
                                        else requestPermissionAndStart();
                                    }}
                                    className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer"
                                >
                                    <Play size={14} className="fill-black" />
                                    {ft.startAnalysis || 'Start Analysis'}
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* Center & Right: Real-time FFT canvas */}
                <div className="col-span-2 flex flex-col bg-black/45 border border-white/5 rounded-2xl overflow-hidden p-4">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">FFT Frequency Response (Hz)</span>
                        <span className="text-[9px] font-mono text-slate-500">128 Frequency Bands</span>
                    </div>
                    <canvas 
                        ref={canvasRef}
                        width={600}
                        height={260}
                        className="w-full flex-1 bg-slate-950/60 rounded-xl border border-white/5 shadow-inner"
                    />

                    {/* Developer simulator */}
                    {(isSimulated || micPermission === 'denied' || debugMode) && (
                        <div className="mt-4 p-4 bg-slate-950/60 border border-yellow-500/10 rounded-xl flex items-center justify-between gap-6">
                            <div className="flex items-center gap-2 shrink-0">
                                <Settings size={14} className="text-yellow-500" />
                                <span className="text-[9px] font-mono font-bold text-yellow-500 uppercase tracking-wider">{ft.noiseSimulator || 'Simulator'}</span>
                            </div>
                            <div className="flex-1 flex items-center gap-4">
                                <span className="text-[10px] font-mono text-slate-400 shrink-0">{ft.noiseSource || 'Source'}:</span>
                                <select 
                                    value={simSource} 
                                    onChange={e => {
                                        playClickSound();
                                        setSimSource(e.target.value as any);
                                    }}
                                    className="flex-1 bg-[#03060a] border border-cyan-900/30 rounded-lg p-2 text-white text-xs outline-none focus:border-cyan-500 cursor-pointer"
                                >
                                    <option value="office">{ft.sourceOffice || 'Quiet Office (40 dB)'}</option>
                                    <option value="traffic">{ft.sourceTraffic || 'Heavy Traffic (75 dB)'}</option>
                                    <option value="factory">{ft.sourceFactory || 'Factory Machinery (88 dB)'}</option>
                                    <option value="pneumatic">{ft.sourcePneumatic || 'Pneumatic Hammer (100 dB)'}</option>
                                    <option value="jet">{ft.sourceJet || 'Jet Engine (115 dB)'}</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
