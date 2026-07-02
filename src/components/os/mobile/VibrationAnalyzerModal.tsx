'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Activity, RefreshCw, AlertTriangle, Shield, Play, Square, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FieldToolsStrings } from '@/locales/fieldToolsTranslations';

interface VibrationAnalyzerModalProps {
    isOpen: boolean;
    onClose: () => void;
    ft: FieldToolsStrings;
    debugMode: boolean;
}

function evaluateVibrationSeverity(
    velocity: number,
    sizeClass: 'ClassI' | 'ClassII' | 'ClassIII',
    ft: FieldToolsStrings,
) {
    const zoneLabels = {
        A: ft.zoneGood,
        B: ft.zoneSatisfactory,
        C: ft.zoneUnsatisfactory,
        D: ft.zoneUnacceptable,
    };
    const color = {
        A: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5 bg-emerald-950/20',
        B: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5 bg-yellow-950/20',
        C: 'text-orange-400 border-orange-500/20 bg-orange-500/5 bg-orange-950/20',
        D: 'text-red-400 border-red-500/20 bg-red-500/5 bg-red-950/20',
    };
    const thresholds =
        sizeClass === 'ClassI'
            ? [0.71, 1.8, 4.5]
            : sizeClass === 'ClassII'
              ? [1.12, 2.8, 7.1]
              : [1.8, 4.5, 11.2];
    let zone: 'A' | 'B' | 'C' | 'D' = 'D';
    if (velocity < thresholds[0]) zone = 'A';
    else if (velocity < thresholds[1]) zone = 'B';
    else if (velocity < thresholds[2]) zone = 'C';
    return { zone, label: zoneLabels[zone], color: color[zone] };
}

export function VibrationAnalyzerModal({ isOpen, onClose, ft, debugMode }: VibrationAnalyzerModalProps) {
    const [permissionState, setPermissionState] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [deviceSupported, setDeviceSupported] = useState(true);

    // Motor classifications for ISO 10816 standard
    const [motorClass, setMotorClass] = useState<'ClassI' | 'ClassII' | 'ClassIII'>('ClassI');
    
    // Telemetry states
    const [accelerationRMS, setAccelerationRMS] = useState(0); // m/s²
    const [velocityRMS, setVelocityRMS] = useState(0); // mm/s
    const [vibrationFrequency, setVibrationFrequency] = useState(0); // Hz
    const [diagnosticResult, setDiagnosticResult] = useState({ zone: 'A', label: ft.zoneGood, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' });

    // Simulator states (for testing / desktop)
    const [isSimulated, setIsSimulated] = useState(false);
    const [simRPM, setSimRPM] = useState<number>(3000);
    const [simVibeState, setSimVibeState] = useState<'healthy' | 'misaligned' | 'bearing_fault' | 'critical_unbalance'>('healthy');

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    
    // Waveform history buffer
    const historyRef = useRef<{x: number, y: number, z: number}[]>([]);
    const maxHistoryPoints = 150;

    // Check device motion support
    useEffect(() => {
        if (isOpen) {
            if ('DeviceMotionEvent' in window) {
                const DeviceMotion = (window as any).DeviceMotionEvent;
                if (typeof DeviceMotion.requestPermission === 'function') {
                    setPermissionState('default');
                } else {
                    setPermissionState('granted');
                }
            } else {
                setPermissionState('unsupported');
                setIsSimulated(true);
            }
        }

        return () => {
            stopMeasurement();
        };
    }, [isOpen]);

    // Request dynamic gyroscope permissions on iOS
    const requestPermission = async () => {
        const DeviceMotion = (window as any).DeviceMotionEvent;
        if (DeviceMotion && typeof DeviceMotion.requestPermission === 'function') {
            try {
                const response = await DeviceMotion.requestPermission();
                if (response === 'granted') {
                    setPermissionState('granted');
                    startMeasurement();
                } else {
                    setPermissionState('denied');
                    setIsSimulated(true);
                    startMeasurement();
                }
            } catch (e) {
                console.error('iOS Motion permission request failed:', e);
                setPermissionState('denied');
                setIsSimulated(true);
                startMeasurement();
            }
        } else {
            setPermissionState('granted');
            startMeasurement();
        }
    };

    // Calculate ISO 10816 severity zone — uses localized labels via ft
    const updateDiagnostic = (velocity: number, sizeClass: 'ClassI' | 'ClassII' | 'ClassIII') => {
        setDiagnosticResult(evaluateVibrationSeverity(velocity, sizeClass, ft));
    };

    // Device motion event handler
    const handleDeviceMotion = (e: DeviceMotionEvent) => {
        if (isSimulated) return;

        const acc = e.acceleration || e.accelerationIncludingGravity;
        if (!acc) return;

        let rawX = acc.x || 0;
        let rawY = acc.y || 0;
        let rawZ = acc.z || 0;

        // If including gravity, apply a simple high-pass filter to remove DC gravity
        if (e.accelerationIncludingGravity) {
            // Subtract approximate gravity component or AC filter
            // For simple demonstration, assume we filter out slowly changing orientation offset
        }

        // Add to rolling history buffer
        historyRef.current.push({ x: rawX, y: rawY, z: rawZ });
        if (historyRef.current.length > maxHistoryPoints) {
            historyRef.current.shift();
        }

        // Calculate math values
        calculateVibrationMetrics();
    };

    const calculateVibrationMetrics = () => {
        const samples = historyRef.current;
        if (samples.length === 0) return;

        // Compute RMS Acceleration
        let sumSq = 0;
        samples.forEach(s => {
            const mag = Math.sqrt(s.x*s.x + s.y*s.y + s.z*s.z);
            sumSq += mag * mag;
        });
        const rmsAcc = Math.sqrt(sumSq / samples.length);
        setAccelerationRMS(rmsAcc);

        // Estimate Frequency and RMS Velocity
        // In physical motor vibration, velocity (mm/s) = (rmsAcc / (2 * pi * f)) * 1000
        // We approximate frequency from crossing rate and map it
        let crossings = 0;
        for (let i = 1; i < samples.length; i++) {
            const prev = Math.sqrt(samples[i-1].x**2 + samples[i-1].y**2 + samples[i-1].z**2);
            const curr = Math.sqrt(samples[i].x**2 + samples[i].y**2 + samples[i].z**2);
            if ((prev - rmsAcc) * (curr - rmsAcc) < 0) {
                crossings++;
            }
        }
        const estFreq = Math.max(10, Math.min(120, (crossings / 2) * (60 / 2))); // 10Hz - 120Hz mapping
        setVibrationFrequency(estFreq);

        // RMS Velocity = (rmsAcc / (2 * pi * f)) * 1000 mm/s
        const estVel = (rmsAcc / (2 * Math.PI * estFreq)) * 1000;
        const cappedVel = Math.min(25, Math.max(0.1, estVel));
        setVelocityRMS(cappedVel);

        setDiagnosticResult(evaluateVibrationSeverity(cappedVel, motorClass, ft));
    };

    // Run simulation loop (for testing or desktop)
    const runSimulationLoop = () => {
        if (!isMeasuring) return;

        // Base parameters according to motor state
        let baseAmp = 0.5; // Healthy
        let noiseAmp = 0.2;
        let baseFreq = simRPM / 60; // e.g. 3000 RPM -> 50 Hz

        if (simVibeState === 'misaligned') {
            baseAmp = 2.4; // Satisfactory to Unsatisfactory
            noiseAmp = 0.6;
        } else if (simVibeState === 'bearing_fault') {
            baseAmp = 6.2; // Unsatisfactory
            noiseAmp = 1.8;
        } else if (simVibeState === 'critical_unbalance') {
            baseAmp = 14.5; // Unacceptable
            noiseAmp = 3.5;
        }

        const t = Date.now() / 1000;
        
        // Synthesize multi-component motor vibration signal (fundamental RPM + bearing noise)
        const xVal = baseAmp * Math.sin(2 * Math.PI * baseFreq * t) + noiseAmp * Math.sin(2 * Math.PI * baseFreq * 2.4 * t);
        const yVal = baseAmp * 0.7 * Math.cos(2 * Math.PI * baseFreq * t + Math.PI/4) + noiseAmp * 0.5 * Math.sin(2 * Math.PI * baseFreq * 1.8 * t);
        const zVal = baseAmp * 0.4 * Math.sin(2 * Math.PI * baseFreq * t + Math.PI/2) + noiseAmp * 0.9 * Math.cos(2 * Math.PI * baseFreq * 3.2 * t);

        historyRef.current.push({ x: xVal, y: yVal, z: zVal });
        if (historyRef.current.length > maxHistoryPoints) {
            historyRef.current.shift();
        }

        calculateVibrationMetrics();
        drawWaveform();

        animationFrameRef.current = requestAnimationFrame(runSimulationLoop);
    };

    // Draw lines on canvas
    const drawWaveform = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        // Background grid lines
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 30) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }
        for (let i = 0; i < height; i += 20) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
            ctx.stroke();
        }

        const samples = historyRef.current;
        if (samples.length < 2) return;

        const midY = height / 2;
        // Scale factor: map acceleration to pixels (max scale 20 m/s²)
        const maxScale = Math.max(10, accelerationRMS * 2);
        const scale = midY / maxScale;

        // Draw X-axis line (Red)
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        samples.forEach((s, idx) => {
            const xCoord = (idx / maxHistoryPoints) * width;
            const yCoord = midY - s.x * scale;
            if (idx === 0) ctx.moveTo(xCoord, yCoord);
            else ctx.lineTo(xCoord, yCoord);
        });
        ctx.stroke();

        // Draw Y-axis line (Green)
        ctx.strokeStyle = '#10b981';
        ctx.beginPath();
        samples.forEach((s, idx) => {
            const xCoord = (idx / maxHistoryPoints) * width;
            const yCoord = midY - s.y * scale;
            if (idx === 0) ctx.moveTo(xCoord, yCoord);
            else ctx.lineTo(xCoord, yCoord);
        });
        ctx.stroke();

        // Draw Z-axis line (Blue)
        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath();
        samples.forEach((s, idx) => {
            const xCoord = (idx / maxHistoryPoints) * width;
            const yCoord = midY - s.z * scale;
            if (idx === 0) ctx.moveTo(xCoord, yCoord);
            else ctx.lineTo(xCoord, yCoord);
        });
        ctx.stroke();
    };

    const startMeasurement = () => {
        setIsMeasuring(true);
        historyRef.current = [];
        
        if ('DeviceMotionEvent' in window && permissionState === 'granted' && !isSimulated) {
            window.addEventListener('devicemotion', handleDeviceMotion);
            // Draw trigger loop
            const drawLoop = () => {
                drawWaveform();
                animationFrameRef.current = requestAnimationFrame(drawLoop);
            };
            animationFrameRef.current = requestAnimationFrame(drawLoop);
        } else {
            // Run simulation mode
            setIsSimulated(true);
            setTimeout(() => {
                animationFrameRef.current = requestAnimationFrame(runSimulationLoop);
            }, 100);
        }
    };

    const stopMeasurement = () => {
        setIsMeasuring(false);
        window.removeEventListener('devicemotion', handleDeviceMotion);
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-[#020408]/90 backdrop-blur-md flex flex-col justify-end md:justify-center p-0 md:p-6"
                >
                    <div className="w-full max-w-lg mx-auto bg-[#070b12] border-t md:border border-cyan-900/30 rounded-t-[2.5rem] md:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-auto max-h-[85vh]">
                        {/* Header */}
                        <header className="flex-none p-5 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <div>
                                <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                                    <Activity size={16} className="text-cyan-400" />
                                    {ft.machineVibrationDiagnostics}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{ft.iso10816Analyzer}</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white active:scale-95 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </header>

                        {/* Scrolling Acceleration Waveform Graph */}
                        <div className="flex-none p-4 bg-black flex flex-col items-center justify-center relative">
                            <canvas 
                                ref={canvasRef}
                                width={480}
                                height={180}
                                className="w-full h-[160px] bg-slate-950/60 rounded-2xl border border-white/5 shadow-inner"
                            />
                            
                            {/* Graph Channels Legend overlay */}
                            <div className="absolute top-6 left-6 flex gap-3 text-[8px] font-mono select-none">
                                <span className="flex items-center gap-1"><div className="w-2 h-0.5 bg-[#ef4444]"></div>{ft.accXAxis}</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-0.5 bg-[#10b981]"></div>{ft.accYAxis}</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-0.5 bg-[#3b82f6]"></div>{ft.accZAxis}</span>
                            </div>

                            {/* Measurement Status badge */}
                            <div className="absolute top-6 right-6 select-none">
                                {isMeasuring ? (
                                    <span className="flex items-center gap-1 text-[8px] font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full animate-pulse">
                                        {ft.analyzing}
                                    </span>
                                ) : (
                                    <span className="text-[8px] font-mono font-bold text-slate-500 bg-slate-900 border border-white/5 px-2 py-0.5 rounded-full">
                                        {ft.standby}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Diagnostics & ISO severity indicators */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                            
                            {/* Class selector & diagnostics numbers */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 bg-slate-950/20 border border-white/5 rounded-xl text-center space-y-1 col-span-2">
                                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">{ft.rmsVibrationVelocity}</span>
                                    <span className={`text-xl font-bold font-mono tracking-tight ${velocityRMS > 4.5 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
                                        {velocityRMS.toFixed(2)} mm/s
                                    </span>
                                    <span className="text-[8px] text-slate-500 block">{ft.evaluatedIso10816}</span>
                                </div>
                                <div className="p-3 bg-slate-950/20 border border-white/5 rounded-xl text-center space-y-1">
                                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">{ft.freqPeak}</span>
                                    <span className="text-xl font-bold font-mono text-slate-300">
                                        {vibrationFrequency.toFixed(0)} Hz
                                    </span>
                                    <span className="text-[8px] text-slate-500 block">({(vibrationFrequency * 60).toFixed(0)} RPM)</span>
                                </div>
                            </div>

                            {/* Diagnostics ISO severity zone message */}
                            <div className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between ${diagnosticResult.color}`}>
                                <div className="space-y-1">
                                    <span className="text-[8px] font-mono font-bold block uppercase tracking-wider">{ft.iso10816Diagnosis}</span>
                                    <h4 className="font-extrabold text-sm text-white leading-tight">
                                        {diagnosticResult.label}
                                    </h4>
                                    <p className="text-[9px] text-slate-400 leading-snug">
                                        {diagnosticResult.zone === 'A' && ft.zoneADesc}
                                        {diagnosticResult.zone === 'B' && ft.zoneBDesc}
                                        {diagnosticResult.zone === 'C' && ft.zoneCDesc}
                                        {diagnosticResult.zone === 'D' && ft.zoneDDesc}
                                    </p>
                                </div>
                                <div className="p-2.5 rounded-full bg-black/40 border border-white/5 text-center font-mono font-bold text-sm shrink-0 w-10 h-10 flex items-center justify-center">
                                    {diagnosticResult.zone}
                                </div>
                            </div>

                            {/* Machine Class Selection */}
                            <div className="p-4 bg-slate-950/20 border border-white/5 rounded-2xl space-y-3">
                                <label className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider block">{ft.isoMachineClassification}</label>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'ClassI', label: ft.classI, desc: ft.classIDesc },
                                        { id: 'ClassII', label: ft.classII, desc: ft.classIIDesc },
                                        { id: 'ClassIII', label: ft.classIII, desc: ft.classIIIDesc }
                                    ].map(cls => (
                                        <button
                                            key={cls.id}
                                            onClick={() => {
                                                setMotorClass(cls.id as any);
                                                setDiagnosticResult(evaluateVibrationSeverity(velocityRMS, cls.id as any, ft));
                                                if ('vibrate' in navigator) navigator.vibrate(30);
                                            }}
                                            className={`flex-1 p-2 border rounded-xl text-center transition-all ${motorClass === cls.id ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400' : 'bg-transparent border-white/5 text-slate-400'}`}
                                        >
                                            <span className="block text-xs font-bold">{cls.label}</span>
                                            <span className="text-[7px] font-mono text-slate-500 block">{cls.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sensor permissions and developer simulation block */}
                            {debugMode && isSimulated && (
                                <div className="p-4 bg-slate-950/60 border border-yellow-500/10 rounded-2xl space-y-4">
                                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                                        <span className="text-[8px] font-mono font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-1">
                                            <Settings size={10} />
                                            {ft.motorSimulatorPanel}
                                        </span>
                                        <span className="text-[8px] font-mono text-slate-500">{ft.noGyroDetected}</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1 text-[10px] font-mono">
                                            <label className="text-slate-500 block text-[8px] uppercase tracking-wider">{ft.rpmSizing}</label>
                                            <select 
                                                value={simRPM} 
                                                onChange={e => setSimRPM(Number(e.target.value))}
                                                className="w-full bg-[#03060a] border border-cyan-900/30 rounded-lg p-2 text-white text-xs outline-none"
                                            >
                                                <option value={1500}>{ft.rpm1500}</option>
                                                <option value={3000}>{ft.rpm3000}</option>
                                                <option value={6000}>{ft.rpm6000}</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1 text-[10px] font-mono">
                                            <label className="text-slate-500 block text-[8px] uppercase tracking-wider">{ft.vibrationState}</label>
                                            <select 
                                                value={simVibeState} 
                                                onChange={e => setSimVibeState(e.target.value as any)}
                                                className="w-full bg-[#03060a] border border-cyan-900/30 rounded-lg p-2 text-white text-xs outline-none"
                                            >
                                                <option value="healthy">{ft.vibeHealthy}</option>
                                                <option value="misaligned">{ft.vibeMisaligned}</option>
                                                <option value="bearing_fault">{ft.vibeBearingFault}</option>
                                                <option value="critical_unbalance">{ft.vibeUnbalance}</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Modal Action Controls Footer */}
                        <div className="flex-none p-5 bg-slate-950/40 border-t border-white/5 flex gap-3">
                            {permissionState === 'default' && !isSimulated && (
                                <button
                                    onClick={requestPermission}
                                    className="flex-1 py-3.5 bg-yellow-500 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-yellow-400 transition-all active:scale-95 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                                >
                                    {ft.grantGyroPermissions}
                                </button>
                            )}

                            {isMeasuring ? (
                                <button
                                    onClick={stopMeasurement}
                                    className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                >
                                    <Square size={14} className="fill-white" />
                                    {ft.stopDiagnostics}
                                </button>
                            ) : (
                                <button
                                    onClick={startMeasurement}
                                    className="flex-1 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                                >
                                    <Play size={14} className="fill-black" />
                                    {ft.startDiagnostics}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
