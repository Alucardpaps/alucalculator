'use client';

import React, { useState, useMemo } from 'react';
import { Settings, Wind, Users, Monitor, ThermometerSun } from 'lucide-react';

export default function HvacLoadModule() {
    // Envelope Parameters
    const [wallArea, setWallArea] = useState<number>(120); // m^2
    const [wallU, setWallU] = useState<number>(0.3); // W/m^2K
    const [windowArea, setWindowArea] = useState<number>(20); // m^2
    const [windowU, setWindowU] = useState<number>(1.5); // W/m^2K
    const [roofArea, setRoofArea] = useState<number>(100); // m^2
    const [roofU, setRoofU] = useState<number>(0.2); // W/m^2K

    // Environment
    const [tOutside, setTOutside] = useState<number>(35); // °C
    const [tInside, setTInside] = useState<number>(22); // °C
    const [airChanges, setAirChanges] = useState<number>(1.5); // ACH (Air Changes per Hour)
    const [roomVolume, setRoomVolume] = useState<number>(300); // m^3 (100m2 * 3m)

    // Internal Loads
    const [occupants, setOccupants] = useState<number>(10);
    const [heatPerPerson, setHeatPerPerson] = useState<number>(130); // W (Sensible + Latent)
    const [equipmentLoad, setEquipmentLoad] = useState<number>(1500); // W

    const results = useMemo(() => {
        const dT = tOutside - tInside; // Positive means Cooling Load needed
        
        // 1. Transmission Loads (Q = U * A * dT)
        const qWall = wallArea * wallU * dT;
        const qWindow = windowArea * windowU * dT;
        const qRoof = roofArea * roofU * dT;
        const transmissionLoad = qWall + qWindow + qRoof;

        // 2. Ventilation/Infiltration Load
        // Q = (ACH * Volume / 3600) * rho * Cp * dT
        // rho ~ 1.2 kg/m3, Cp ~ 1006 J/kgK
        // Simplified: Q = 0.33 * ACH * Volume * dT (W)
        const ventilationLoad = 0.33 * airChanges * roomVolume * dT;

        // 3. Internal Loads
        const internalLoad = (occupants * heatPerPerson) + equipmentLoad;

        // Total Load (Watts)
        const totalLoadW = Math.abs(transmissionLoad) + Math.abs(ventilationLoad) + internalLoad;
        const totalLoadKW = totalLoadW / 1000;
        const totalLoadBTU = totalLoadW * 3.412; // BTU/hr

        // Cooling capacity in Tons (1 Ton = 12000 BTU/hr)
        const requiredTons = totalLoadBTU / 12000;

        const isHeating = dT < 0;

        return {
            transmissionLoad,
            ventilationLoad,
            internalLoad,
            totalLoadKW,
            requiredTons,
            isHeating,
            dT
        };
    }, [wallArea, wallU, windowArea, windowU, roofArea, roofU, tOutside, tInside, airChanges, roomVolume, occupants, heatPerPerson, equipmentLoad]);

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[#03060a] text-white overflow-hidden">
            <div className="w-full lg:w-[450px] shrink-0 flex flex-col bg-[#05080f]/90 border-r border-white/5 overflow-y-auto custom-scrollbar">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-sky-500/10 to-transparent">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                            <Wind size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase">HVAC Load</h1>
                            <p className="text-[10px] text-sky-500/60 font-mono tracking-widest uppercase">Cooling & Heating Est.</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Environment */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <ThermometerSun size={12} /> Temperature & Airflow
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">T_outside (°C)</label>
                                <input type="number" value={tOutside} onChange={e => setTOutside(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">T_inside (°C)</label>
                                <input type="number" value={tInside} onChange={e => setTInside(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Room Vol (m³)</label>
                                <input type="number" value={roomVolume} onChange={e => setRoomVolume(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Air Changes (ACH)</label>
                                <input type="number" step="0.5" value={airChanges} onChange={e => setAirChanges(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5 my-2" />

                    {/* Envelope */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Settings size={12} /> Building Envelope
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Wall Area (m²)</label>
                                <input type="number" value={wallArea} onChange={e => setWallArea(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Wall U (W/m²K)</label>
                                <input type="number" step="0.1" value={wallU} onChange={e => setWallU(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Window Area (m²)</label>
                                <input type="number" value={windowArea} onChange={e => setWindowArea(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Window U (W/m²K)</label>
                                <input type="number" step="0.1" value={windowU} onChange={e => setWindowU(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Roof Area (m²)</label>
                                <input type="number" value={roofArea} onChange={e => setRoofArea(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Roof U (W/m²K)</label>
                                <input type="number" step="0.1" value={roofU} onChange={e => setRoofU(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5 my-2" />

                    {/* Internal Loads */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Users size={12} /> Internal Heat Gains
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Occupants</label>
                                <input type="number" value={occupants} onChange={e => setOccupants(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Eq. Load (W)</label>
                                <input type="number" value={equipmentLoad} onChange={e => setEquipmentLoad(Number(e.target.value))} className="w-full bg-[#1a2230] border border-white/10 rounded text-sm p-2 outline-none mt-1 font-mono" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col p-8 lg:p-12 relative overflow-y-auto">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none transition-colors duration-1000 ${results.isHeating ? 'bg-orange-500/10' : 'bg-sky-500/10'}`} />
                
                <div className="relative z-10 flex flex-col items-center justify-center min-h-[300px] bg-black/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-8 shadow-2xl mb-8 overflow-hidden">
                    <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${results.isHeating ? 'text-orange-400' : 'text-sky-400'}`}>Total Required Capacity</div>
                    <div className="text-7xl font-mono font-black tracking-tighter text-white">
                        {results.totalLoadKW.toFixed(2)}<span className="text-3xl text-gray-500 font-sans ml-2">kW</span>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${results.isHeating ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'bg-sky-500/20 border-sky-500/40 text-sky-400'}`}>
                            {results.isHeating ? 'Heating Mode' : 'Cooling Mode'} (ΔT: {Math.abs(results.dT)}°C)
                        </div>
                        <div className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border bg-white/5 border-white/10 text-gray-300">
                            {results.requiredTons.toFixed(1)} Refrigeration Tons
                        </div>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-2">Transmission</div>
                        <div className="text-3xl font-mono font-black text-white">
                            {Math.abs(results.transmissionLoad / 1000).toFixed(2)} <span className="text-sm font-sans text-sky-400">kW</span>
                        </div>
                    </div>

                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-2">Ventilation</div>
                        <div className="text-3xl font-mono font-black text-white">
                            {Math.abs(results.ventilationLoad / 1000).toFixed(2)} <span className="text-sm font-sans text-sky-400">kW</span>
                        </div>
                    </div>

                    <div className="bg-[#080d14]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03]"><Monitor /></div>
                        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 mb-2">Internal Gains</div>
                        <div className="text-3xl font-mono font-black text-amber-400">
                            {(results.internalLoad / 1000).toFixed(2)} <span className="text-sm font-sans text-amber-400/50">kW</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
