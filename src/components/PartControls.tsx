'use client';

import React, { useState } from 'react';
import { usePartStore, ProfileType } from '@/store/usePartStore';
import { ENGINEERING_MATERIALS } from '@/lib/parametric/materials';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { useOSStore } from '@/store/osStore';

// UI icons
const IconBox = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const IconMaximize = ({ rotate = false }) => <svg width="14" height="14" className={rotate ? "rotate-90" : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>;
const IconLayers = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;
const IconCircleDot = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="1"></circle></svg>;
const IconDownload = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const IconGrid = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>;
const IconWeight = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>;
const IconArrowRight = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;

export function PartControls() {
    const {
        profileType, width, height, thickness, holeRadius,
        webHeight, flangeWidth, webThickness, flangeThickness, length, materialId,
        kerfLoss, meshRef,
        setDimensions
    } = usePartStore();

    const [isExporting2D, setIsExporting2D] = useState(false);
    const [isExporting3D, setIsExporting3D] = useState(false);

    const handleExport2D = async () => {
        setIsExporting2D(true);
        try {
            const bodyPayload = profileType === 'flat'
                ? { profileType, width, height, holeRadius, kerfLoss }
                : { profileType, webHeight, flangeWidth, webThickness, flangeThickness, length, kerfLoss };

            const response = await fetch('/api/export-dxf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload)
            });

            if (!response.ok) throw new Error('Failed to generate DXF exported file.');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = profileType === 'flat' ? `AluCalc_Plate_${width}x${height}.dxf` : `AluCalc_${profileType}_${flangeWidth}x${webHeight}.dxf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('DXF Export Error:', err);
            alert('DXF Export failed. Please check the console.');
        } finally {
            setIsExporting2D(false);
        }
    };

    const handleExport3D = async () => {
        setIsExporting3D(true);
        try {
            const body = profileType === 'flat'
                ? { profileType, width, height, thickness, holeRadius }
                : { profileType, webHeight, flangeWidth, webThickness, flangeThickness, length };

            const response = await fetch('/api/export-step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) throw new Error('Failed to generate STEP exported file.');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = profileType === 'flat' ? `AluCalc_Plate_${width}x${height}x${thickness}.step` : `AluCalc_${profileType}_${flangeWidth}x${webHeight}x${length}.step`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('STEP Export Error:', err);
            alert('STEP Export failed. Is CadQuery installed on the server?');
        } finally {
            setIsExporting3D(false);
        }
    };

    const handleExportSTL = () => {
        if (!meshRef) return alert('3D Mesh is not fully initialized yet.');

        try {
            const exporter = new STLExporter();
            const stlString = exporter.parse(meshRef);

            const blob = new Blob([stlString], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = profileType === 'flat'
                ? `AluCalc_Plate_${width}x${height}x${thickness}.stl`
                : `AluCalc_${profileType}_${flangeWidth}x${webHeight}x${length}.stl`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('STL Export Error:', err);
            alert('Failed to generate STL file from 3D canvas.');
        }
    };

    // --- MOD 2: Live Mass, Volume and Cost Engine ---
    const calculateMetrics = () => {
        let area = 0; // mm²
        if (profileType === 'flat') {
            area = width * height;
            if (holeRadius > 0) area -= Math.PI * holeRadius * holeRadius;
        } else if (profileType === 'L-bracket') {
            area = (flangeWidth * flangeThickness) + ((webHeight - flangeThickness) * webThickness);
        } else if (profileType === 'U-channel') {
            area = (flangeWidth * webThickness) + 2 * ((webHeight - webThickness) * flangeThickness);
        } else if (profileType === 'I-beam') {
            area = (webHeight * webThickness) + 2 * (flangeWidth * flangeThickness);
        }

        const extrudeLength = profileType === 'flat' ? thickness : length;
        const volumeMm3 = area * extrudeLength;
        const volumeCm3 = volumeMm3 / 1000;

        const selectedMaterial = ENGINEERING_MATERIALS.find(m => m.id === materialId) || ENGINEERING_MATERIALS[0];

        const massGrams = volumeCm3 * selectedMaterial.density;
        const massKg = massGrams / 1000;
        const cost = massKg * selectedMaterial.pricePerKg;

        return {
            volumeCm3: volumeCm3.toFixed(2),
            massKg: massKg.toFixed(3),
            cost: cost.toFixed(2),
            materialName: selectedMaterial.name,
            currency: '$',
            costUsd: cost
        };
    };

    const metrics = calculateMetrics();

    return (
        <div className="bg-[#0a0c10] border border-white/10 rounded-xl p-6 flex flex-col gap-6 text-slate-300 w-full max-w-sm shadow-2xl backdrop-blur-md overflow-y-auto max-h-full scrollbar-thin scrollbar-thumb-white/10">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <IconBox />
                </div>
                <div>
                    <h2 className="text-sm font-bold tracking-widest uppercase text-white">Parametric Controls</h2>
                    <p className="text-[10px] text-slate-500 font-mono">Hybrid CAD Engine v1.2</p>
                </div>
            </div>

            <div className="space-y-6 flex-1">
                {/* Material Selector (Mod 2) */}
                <div className="space-y-3">
                    <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                        <IconWeight /> Material
                    </div>
                    <select
                        value={materialId}
                        onChange={(e) => setDimensions({ materialId: e.target.value })}
                        className="w-full bg-[#1e293b] text-white text-sm border border-white/10 rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors cursor-pointer"
                    >
                        {ENGINEERING_MATERIALS.map(mat => (
                            <option key={mat.id} value={mat.id}>{mat.name} ({mat.density}g/cm³)</option>
                        ))}
                    </select>
                </div>

                {/* CNC/Laser Kerf Compensation Slider (Mod 3) */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-mono">
                        <span className="flex items-center gap-2 text-slate-400">Kerf Loss (Offset)</span>
                        <span className="text-white font-bold">{kerfLoss.toFixed(1)} mm</span>
                    </div>
                    <input
                        type="range" min="0" max="10" step="0.1" value={kerfLoss}
                        onChange={(e) => setDimensions({ kerfLoss: Number(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                </div>

                {/* Profile Type Selector */}
                <div className="space-y-3">
                    <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                        <IconGrid /> Profile Shape
                    </div>
                    <select
                        value={profileType}
                        onChange={(e) => setDimensions({ profileType: e.target.value as ProfileType })}
                        className="w-full bg-[#1e293b] text-white text-sm border border-white/10 rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors cursor-pointer"
                    >
                        <option value="flat">Standard Flat Plate</option>
                        <option value="L-bracket">L-Bracket Profile</option>
                        <option value="U-channel">U-Channel Profile</option>
                        <option value="I-beam">I-Beam Profile</option>
                    </select>
                </div>

                {/* Conditional Inputs based on Profile Type */}

                {profileType === 'flat' && (
                    <>
                        {/* Width */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="flex items-center gap-2 text-slate-400"><IconMaximize /> Width (X)</span>
                                <span className="text-white font-bold">{width} mm</span>
                            </div>
                            <input
                                type="range" min="10" max="1000" value={width}
                                onChange={(e) => setDimensions({ width: Number(e.target.value) })}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* Height */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="flex items-center gap-2 text-slate-400"><IconMaximize rotate /> Height (Y)</span>
                                <span className="text-white font-bold">{height} mm</span>
                            </div>
                            <input
                                type="range" min="10" max="1000" value={height}
                                onChange={(e) => setDimensions({ height: Number(e.target.value) })}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* Thickness */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="flex items-center gap-2 text-slate-400"><IconLayers /> Thickness (Z)</span>
                                <span className="text-white font-bold">{thickness} mm</span>
                            </div>
                            <input
                                type="range" min="1" max="100" value={thickness}
                                onChange={(e) => setDimensions({ thickness: Number(e.target.value) })}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* Hole Radius */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="flex items-center gap-2 text-slate-400"><IconCircleDot /> Hole Radius</span>
                                <span className="text-white font-bold">{holeRadius} mm</span>
                            </div>
                            <input
                                type="range" min="0" max={Math.min(width, height) / 2 - 2} value={holeRadius}
                                onChange={(e) => setDimensions({ holeRadius: Number(e.target.value) })}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    </>
                )}

                {profileType !== 'flat' && (
                    <>
                        {/* Flange Width */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="flex items-center gap-2 text-slate-400"><IconMaximize /> Flange W (X)</span>
                                <span className="text-white font-bold">{flangeWidth} mm</span>
                            </div>
                            <input
                                type="range" min="20" max="500" value={flangeWidth}
                                onChange={(e) => setDimensions({ flangeWidth: Number(e.target.value) })}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* Web Height */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="flex items-center gap-2 text-slate-400"><IconMaximize rotate /> Web H (Y)</span>
                                <span className="text-white font-bold">{webHeight} mm</span>
                            </div>
                            <input
                                type="range" min="20" max="500" value={webHeight}
                                onChange={(e) => setDimensions({ webHeight: Number(e.target.value) })}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* Flange Thickness */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="flex items-center gap-2 text-slate-400"><IconLayers /> Flange T (Z)</span>
                                <span className="text-white font-bold">{flangeThickness} mm</span>
                            </div>
                            <input
                                type="range" min="1" max="50" value={flangeThickness}
                                onChange={(e) => setDimensions({ flangeThickness: Number(e.target.value) })}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* Web Thickness */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="flex items-center gap-2 text-slate-400"><IconLayers /> Web T (Z)</span>
                                <span className="text-white font-bold">{webThickness} mm</span>
                            </div>
                            <input
                                type="range" min="1" max="50" value={webThickness}
                                onChange={(e) => setDimensions({ webThickness: Number(e.target.value) })}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* Extrusion Length */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="flex items-center gap-2 text-slate-400"><IconMaximize /> Extrude L</span>
                                <span className="text-white font-bold">{length} mm</span>
                            </div>
                            <input
                                type="range" min="50" max="2000" value={length} step={50}
                                onChange={(e) => setDimensions({ length: Number(e.target.value) })}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Live Mod 2 Metrics Head-Up Display */}
            <div className="bg-black/40 border border-white/5 rounded-lg p-4 grid grid-cols-2 gap-4 my-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[40px] rounded-full pointer-events-none" />

                <div>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">Volume</p>
                    <p className="text-sm font-bold text-white">{metrics.volumeCm3} <span className="text-xs text-slate-400 font-normal">cm³</span></p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">Est. Mass</p>
                    <p className="text-sm font-bold text-cyan-400">{metrics.massKg} <span className="text-xs text-slate-400 font-normal">kg</span></p>
                </div>
                <div className="col-span-2 border-t border-white/10 pt-3 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">Est. Cost</p>
                        <p className="text-sm font-bold text-amber-400">$ {(metrics.costUsd || 0).toFixed(2)}</p>
                    </div>
                    <button
                        onClick={() => useOSStore.getState().openWindow('cutting-optimizer')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-md text-[10px] text-blue-300 font-bold uppercase transition-all active:scale-95"
                    >
                        Optimize <IconArrowRight size={12} />
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
                {/* Export 2D DXF Button */}
                <button
                    onClick={handleExport2D}
                    disabled={isExporting2D || isExporting3D}
                    className="group relative w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-widest uppercase rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300" />
                    <span className={isExporting2D ? "animate-bounce" : ""}><IconDownload /></span>
                    <span>{isExporting2D ? 'Generating Profile...' : 'Export 2D DXF Cross-Section'}</span>
                </button>

                {/* Export 3D STEP Button */}
                <button
                    onClick={handleExport3D}
                    disabled={isExporting2D || isExporting3D}
                    className="group relative w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm tracking-widest uppercase rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(147,51,234,0.2)] hover:shadow-[0_0_25px_rgba(147,51,234,0.4)] overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300" />
                    <span className={isExporting3D ? "animate-bounce" : ""}><IconDownload /></span>
                    <span>{isExporting3D ? 'Running CadQuery...' : 'Export 3D STEP Solid'}</span>
                </button>

                {/* Export 3D STL Button (Mod 4) */}
                <button
                    onClick={handleExportSTL}
                    disabled={isExporting2D || isExporting3D || !meshRef}
                    className="group relative w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm tracking-widest uppercase rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300" />
                    <span><IconDownload /></span>
                    <span>Instant STL Export (3D Print)</span>
                </button>
            </div>
        </div>
    );
}
