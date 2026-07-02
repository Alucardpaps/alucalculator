'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, Zap, Layers, Check, ShieldAlert, Sparkles, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '@/store/projectStore';
import type { FieldToolsStrings } from '@/locales/fieldToolsTranslations';
import { getQRScanCatalog } from '@/locales/qrScanCatalog';

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddPart: (item: any) => void;
    ft: FieldToolsStrings;
    language: string;
    debugMode: boolean;
}

export function QRScannerModal({ isOpen, onClose, onAddPart, ft, language, debugMode }: QRScannerModalProps) {
    const { items: scanDatabase, gradeFallback } = getQRScanCatalog(language);
    const { addItem } = useProjectStore();
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
    const [activeDeviceIdx, setActiveDeviceIdx] = useState<number>(0);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedItem, setScannedItem] = useState<any | null>(null);
    const [torchActive, setTorchActive] = useState(false);
    
    // Inputs for the scanned part
    const [partLength, setPartLength] = useState<number>(1000); // 1 meter default for profiles
    const [partQty, setPartQty] = useState<number>(1);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Play scanning success audio beep
    const playBeep = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // High pitch beep
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.12);
        } catch (e) {
            console.error('AudioContext beep failed:', e);
        }
    };

    // Trigger haptic vibration
    const triggerHaptics = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]); // Double quick pulse
        }
    };

    // Request camera permission and initialize stream
    const initCamera = async (deviceIndex: number = 0) => {
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            // If devices list is available, target specific camera
            if (cameraDevices.length > 0 && cameraDevices[deviceIndex]) {
                constraints.video = {
                    deviceId: { exact: cameraDevices[deviceIndex].deviceId }
                };
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            
            setHasCameraPermission(true);
            setIsScanning(true);
        } catch (error) {
            console.error('[Scanner] Camera access failed:', error);
            setHasCameraPermission(false);
        }
    };

    // Get list of video input devices
    const getDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(device => device.kind === 'videoinput');
            setCameraDevices(videoInputs);
        } catch (e) {
            console.error('[Scanner] Enumerate devices failed:', e);
        }
    };

    useEffect(() => {
        if (isOpen) {
            getDevices().then(() => initCamera(0));
        }

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            setIsScanning(false);
            setScannedItem(null);
            setTorchActive(false);
        };
    }, [isOpen]);

    // Handle cycling through cameras
    const handleSwitchCamera = () => {
        if (cameraDevices.length <= 1) return;
        const nextIdx = (activeDeviceIdx + 1) % cameraDevices.length;
        setActiveDeviceIdx(nextIdx);
        initCamera(nextIdx);
    };

    // Torch / Flashlight toggle
    const handleToggleTorch = async () => {
        if (!streamRef.current) return;
        const videoTrack = streamRef.current.getVideoTracks()[0];
        if (!videoTrack) return;
        
        try {
            const capabilities = videoTrack.getCapabilities() as any;
            if (capabilities && capabilities.torch) {
                const nextTorchState = !torchActive;
                await videoTrack.applyConstraints({
                    advanced: [{ torch: nextTorchState }]
                } as any);
                setTorchActive(nextTorchState);
            } else {
                // Torch not supported on this track/device
                if ('vibrate' in navigator) navigator.vibrate(50);
                alert(ft.torchNotSupportedCamera);
            }
        } catch (e) {
            console.error('[Scanner] Torch control error:', e);
        }
    };

    // Handle scanning result (simulated or real detection)
    const handleScannedCode = (code: string) => {
        const item = scanDatabase.find(x => x.code === code);
        if (item) {
            playBeep();
            triggerHaptics();
            setScannedItem(item);
            setIsScanning(false);
        }
    };

    // Handle adding scanned item to the project BOM
    const handleAddToBOM = () => {
        if (!scannedItem) return;
        
        // Calculate weight & cost based on length if profile
        const isProfile = scannedItem.type === 'profile';
        const finalWeight = isProfile 
            ? (scannedItem.mass * (partLength / 1000)) 
            : scannedItem.mass;
        const finalCost = isProfile 
            ? (scannedItem.costPerUnit * (partLength / 1000)) 
            : scannedItem.costPerUnit;

        addItem({
            name: isProfile 
                ? `${scannedItem.name} (${partLength}mm)` 
                : scannedItem.name,
            type: 'part',
            quantity: partQty,
            weightPerUnit: finalWeight,
            costPerUnit: finalCost,
            material: scannedItem.alloy || gradeFallback,
            category: scannedItem.category
        });

        // Haptic feedback & notify
        if ('vibrate' in navigator) navigator.vibrate(150);
        onAddPart(scannedItem);
        onClose();
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
                                    <Camera size={16} className="text-cyan-400" />
                                    {ft.barcodeScanner}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{ft.scanMaterials}</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white active:scale-95 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </header>

                        {/* Scanner View Area */}
                        <div className="flex-1 min-h-[300px] relative bg-black flex items-center justify-center overflow-hidden">
                            {isScanning && hasCameraPermission !== false ? (
                                <>
                                    <video 
                                        ref={videoRef}
                                        autoPlay 
                                        playsInline 
                                        muted
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Scanning laser and bounds grid overlay */}
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                        <div className="w-64 h-64 border-2 border-dashed border-cyan-500/50 rounded-2xl relative shadow-[0_0_50px_rgba(6,182,212,0.15)]">
                                            {/* Corner brackets */}
                                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-400 -mt-1 -ml-1 rounded-tl-md" />
                                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-400 -mt-1 -mr-1 rounded-tr-md" />
                                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-400 -mb-1 -ml-1 rounded-bl-md" />
                                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-400 -mb-1 -mr-1 rounded-br-md" />
                                            
                                            {/* Sweeping laser light */}
                                            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_10px_#ef4444] animate-pulse" style={{
                                                top: '50%',
                                                animation: 'sweep 2.5s infinite linear'
                                            }} />
                                        </div>
                                    </div>

                                    {/* Camera Action Buttons overlay */}
                                    <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-auto">
                                        <button
                                            onClick={handleToggleTorch}
                                            className={`p-3 rounded-full border backdrop-blur-md transition-all active:scale-95 ${torchActive ? 'bg-cyan-500 border-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-black/60 border-white/10 text-slate-400'}`}
                                        >
                                            <Zap size={18} className={torchActive ? 'fill-black' : ''} />
                                        </button>
                                        
                                        {cameraDevices.length > 1 && (
                                            <button
                                                onClick={handleSwitchCamera}
                                                className="p-3 rounded-full bg-black/60 border border-white/10 text-slate-400 active:scale-95 transition-all backdrop-blur-md"
                                            >
                                                <RefreshCw size={18} />
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 bg-[#04070c] p-6 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                                        <ShieldAlert size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-xs text-white">{ft.cameraDenied}</h4>
                                        <p className="text-[10px] text-slate-500 max-w-[240px] leading-relaxed">
                                            {ft.cameraDeniedDesc}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Scanner Spec Sheet / Sandbox Manual Database List */}
                        <div className="flex-none p-5 bg-slate-950/40 border-t border-white/5 space-y-4">
                            <AnimatePresence mode="wait">
                                {scannedItem ? (
                                    <motion.div
                                        key="spec"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 15 }}
                                        className="space-y-4"
                                    >
                                        {/* Tag Info Card */}
                                        <div className="p-4 bg-cyan-950/10 border border-cyan-500/20 rounded-2xl flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded uppercase">{scannedItem.category}</span>
                                                    <span className="text-[9px] font-mono text-slate-500">{scannedItem.code}</span>
                                                </div>
                                                <h4 className="font-bold text-sm text-white">{scannedItem.name}</h4>
                                                
                                                {/* Structural stats display */}
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 text-[10px] font-mono text-slate-400">
                                                    <div>{ft.alloy}: <span className="text-white">{scannedItem.alloy || ft.grade88SteelDefault}</span></div>
                                                    <div>{ft.densityWeight}: <span className="text-white">{scannedItem.mass} kg/m</span></div>
                                                    <div>{ft.yieldStrength}: <span className="text-white">{scannedItem.yieldStrength} MPa</span></div>
                                                    {scannedItem.h && <div>{ft.dimensions}: <span className="text-white">{scannedItem.h}x{scannedItem.b} mm</span></div>}
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-emerald-400 font-mono">${scannedItem.costPerUnit}</span>
                                        </div>

                                        {/* Length & Quantity selectors */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {scannedItem.type === 'profile' && (
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider">{ft.lengthMm}</label>
                                                    <input 
                                                        type="number"
                                                        value={partLength}
                                                        onChange={e => setPartLength(Math.max(10, Number(e.target.value)))}
                                                        className="w-full bg-[#03060a] border border-cyan-900/30 rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-cyan-500/70"
                                                    />
                                                </div>
                                            )}
                                            <div className={scannedItem.type === 'profile' ? 'space-y-1' : 'col-span-2 space-y-1'}>
                                                <label className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider">{ft.quantity}</label>
                                                <input 
                                                    type="number"
                                                    value={partQty}
                                                    onChange={e => setPartQty(Math.max(1, Number(e.target.value)))}
                                                    className="w-full bg-[#03060a] border border-cyan-900/30 rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-cyan-500/70"
                                                />
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={() => {
                                                    setScannedItem(null);
                                                    setIsScanning(true);
                                                    initCamera(activeDeviceIdx);
                                                }}
                                                className="flex-1 py-3.5 border border-white/5 hover:border-cyan-500/30 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95"
                                            >
                                                {ft.rescan}
                                            </button>
                                            <button
                                                onClick={handleAddToBOM}
                                                className="flex-1 py-3.5 bg-cyan-500 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-1.5 active:scale-95"
                                            >
                                                <Layers size={14} />
                                                {ft.addToBom}
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : debugMode ? (
                                    <motion.div
                                        key="sim"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-3"
                                    >
                                        <div className="flex items-center justify-between pb-1">
                                            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">{ft.simulateScanner}</span>
                                            <Sparkles size={12} className="text-cyan-400 animate-pulse" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto custom-scrollbar p-1 border border-white/5 rounded-xl bg-black/30">
                                            {scanDatabase.map(item => (
                                                <button
                                                    key={item.code}
                                                    onClick={() => handleScannedCode(item.code)}
                                                    className="p-2 text-left bg-slate-900/50 hover:bg-cyan-950/20 border border-white/5 hover:border-cyan-500/30 rounded-lg transition-colors flex items-center justify-between"
                                                >
                                                    <div className="flex flex-col truncate">
                                                        <span className="text-[10px] font-bold text-white truncate">{item.name}</span>
                                                        <span className="text-[8px] font-mono text-cyan-400/70">{item.code}</span>
                                                    </div>
                                                    <Play size={10} className="text-slate-600 fill-slate-600 group-hover:text-cyan-400 shrink-0 ml-1" />
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
