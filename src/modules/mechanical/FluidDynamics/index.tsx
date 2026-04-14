import React, { useState, useEffect, useMemo } from 'react';
import { Droplets, Activity, Ruler, Cylinder } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { motion } from 'framer-motion';

// Common Fluid Properties (approximate at 20 C)
const FLUIDS = [
    { id: 'water', name: { en: 'Water', tr: 'Su' }, density: 998, dynViscosity: 0.001002 },
    { id: 'air', name: { en: 'Air', tr: 'Hava' }, density: 1.204, dynViscosity: 0.0000181 },
    { id: 'oil_iso32', name: { en: 'Hydraulic Oil ISO 32', tr: 'Hidrolik Yağ ISO 32' }, density: 870, dynViscosity: 0.027 },
    { id: 'gasoline', name: { en: 'Gasoline', tr: 'Benzin' }, density: 720, dynViscosity: 0.0006 },
    { id: 'honey', name: { en: 'Honey', tr: 'Bal' }, density: 1420, dynViscosity: 10.0 }
];

// Common Pipe Roughness (mm)
const PIPES = [
    { id: 'smooth', name: { en: 'Smooth Pipe (Glass/Plastic)', tr: 'Pürüzsüz (Cam/Plastik)' }, roughness: 0.0015 },
    { id: 'commercial_steel', name: { en: 'Commercial Steel', tr: 'Ticari Çelik' }, roughness: 0.045 },
    { id: 'cast_iron', name: { en: 'Cast Iron', tr: 'Dökme Demir' }, roughness: 0.26 },
    { id: 'concrete', name: { en: 'Concrete', tr: 'Beton' }, roughness: 1.0 }
];

const FluidDynamicsModule: React.FC = () => {
    const { language } = useI18nStore();
    const isTr = language === 'tr';

    // State
    const [fluidId, setFluidId] = useState('water');
    const [pipeId, setPipeId] = useState('commercial_steel');
    const [diameter, setDiameter] = useState<number>(0.1); // m
    const [length, setLength] = useState<number>(100); // m
    const [velocity, setVelocity] = useState<number>(2.0); // m/s
    const [elevation, setElevation] = useState<number>(0); // m

    const fluid = useMemo(() => FLUIDS.find(f => f.id === fluidId) || FLUIDS[0], [fluidId]);
    const pipe = useMemo(() => PIPES.find(p => p.id === pipeId) || PIPES[0], [pipeId]);

    // Calculations
    const results = useMemo(() => {
        const area = Math.PI * Math.pow(diameter / 2, 2);
        const flowRate = area * velocity; // m3/s

        // Reynolds Number: Re = (density * velocity * diameter) / dynamicViscosity
        const reynolds = (fluid.density * velocity * diameter) / fluid.dynViscosity;

        let frictionFactor = 0;
        let flowType = 'Laminar';

        // Friction Factor using Colebrook-White or Haaland approximation
        if (reynolds < 2300) {
            frictionFactor = 64 / reynolds;
            flowType = 'Laminar';
        } else if (reynolds > 4000) {
            flowType = 'Turbulent';
            // Haaland approximation for Darcy friction factor
            const relRoughness = (pipe.roughness / 1000) / diameter;
            const arg = Math.pow(relRoughness / 3.7, 1.11) + (6.9 / reynolds);
            frictionFactor = Math.pow(-1.8 * Math.log10(arg), -2);
        } else {
            flowType = 'Transitional';
            // Linear interpolation for transitional (simplified)
            const fLam = 64 / 2300;
            const relRoughness = (pipe.roughness / 1000) / diameter;
            const arg = Math.pow(relRoughness / 3.7, 1.11) + (6.9 / 4000);
            const fTurb = Math.pow(-1.8 * Math.log10(arg), -2);
            frictionFactor = fLam + (fTurb - fLam) * ((reynolds - 2300) / (4000 - 2300));
        }

        // Pressure Drop (Darcy-Weisbach): dP = f * (L/D) * (rho * v^2 / 2)
        const dpFriction = frictionFactor * (length / diameter) * (fluid.density * Math.pow(velocity, 2) / 2); // Pascals

        // Hydrostatic Pressure Drop: dP = rho * g * dz
        const dpElevation = fluid.density * 9.81 * elevation;

        const totalPressureDrop = dpFriction + dpElevation; // Pascals

        return {
            flowRate: (flowRate * 3600).toFixed(2), // m3/h
            reynolds: reynolds.toFixed(0),
            flowType: isTr ? (flowType === 'Laminar' ? 'Laminer' : flowType === 'Turbulent' ? 'Türbülanslı' : 'Geçiş') : flowType,
            frictionFactor: frictionFactor.toFixed(5),
            dpFriction: (dpFriction / 100000).toFixed(4), // bar
            dpElevation: (dpElevation / 100000).toFixed(4), // bar
            totalPressureDrop: (totalPressureDrop / 100000).toFixed(4), // bar
            kineticPower: ((totalPressureDrop * flowRate) / 1000).toFixed(2) // kW to overcome
        };
    }, [fluid, pipe, diameter, length, velocity, elevation, isTr]);

    return (
        <div className="flex w-full h-full bg-[#0a0a0c] text-white">
            {/* Left Column: Inputs */}
            <div className="w-[400px] border-r border-white/10 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

                <h2 className="text-xl font-medium text-white/90 flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-400" />
                    {isTr ? 'Akışkanlar Dinamiği' : 'Fluid Dynamics'}
                </h2>

                <div className="space-y-4">
                    {/* Fluid Selection */}
                    <div>
                        <label className="block text-xs font-medium text-white/50 mb-1">
                            {isTr ? 'Akışkan Türü' : 'Fluid Type'}
                        </label>
                        <select
                            value={fluidId}
                            onChange={(e) => setFluidId(e.target.value)}
                            className="w-full bg-[#151518] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                        >
                            {FLUIDS.map(f => (
                                <option key={f.id} value={f.id}>{isTr ? f.name.tr : f.name.en}</option>
                            ))}
                        </select>
                        <div className="flex justify-between mt-1 text-[10px] text-white/40">
                            <span>ρ: {fluid.density} kg/m³</span>
                            <span>μ: {fluid.dynViscosity} Pa·s</span>
                        </div>
                    </div>

                    {/* Pipe Material */}
                    <div>
                        <label className="block text-xs font-medium text-white/50 mb-1">
                            {isTr ? 'Boru Malzemesi' : 'Pipe Material'}
                        </label>
                        <select
                            value={pipeId}
                            onChange={(e) => setPipeId(e.target.value)}
                            className="w-full bg-[#151518] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                        >
                            {PIPES.map(p => (
                                <option key={p.id} value={p.id}>{isTr ? p.name.tr : p.name.en}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-[10px] text-white/40">ε: {pipe.roughness} mm</p>
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    {/* Geometry */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-white/50 mb-1">
                                {isTr ? 'İç Çap (m)' : 'Inner Diameter (m)'}
                            </label>
                            <input
                                type="number"
                                value={diameter}
                                onChange={(e) => setDiameter(parseFloat(e.target.value) || 0)}
                                step="0.01"
                                className="w-full bg-[#151518] border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-white/50 mb-1">
                                {isTr ? 'Uzunluk (m)' : 'Length (m)'}
                            </label>
                            <input
                                type="number"
                                value={length}
                                onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                                step="10"
                                className="w-full bg-[#151518] border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-white/50 mb-1">
                                {isTr ? 'Akış Hızı (m/s)' : 'Flow Velocity (m/s)'}
                            </label>
                            <input
                                type="number"
                                value={velocity}
                                onChange={(e) => setVelocity(parseFloat(e.target.value) || 0)}
                                step="0.1"
                                className="w-full bg-[#151518] border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-white/50 mb-1">
                                {isTr ? 'Yükseklik Farkı (m)' : 'Elevation Diff (m)'}
                            </label>
                            <input
                                type="number"
                                value={elevation}
                                onChange={(e) => setElevation(parseFloat(e.target.value) || 0)}
                                className="w-full bg-[#151518] border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Visualization & Results */}
            <div className="flex-1 p-8 flex flex-col gap-8">

                {/* Result Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#111115] border border-white/5 rounded-xl p-5 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
                        <h3 className="text-xs text-white/40 mb-1 uppercase tracking-wider">{isTr ? 'Reynolds Sayısı' : 'Reynolds Number'}</h3>
                        <div className="text-3xl font-light text-blue-400">
                            {results.reynolds}
                        </div>
                        <p className="text-sm mt-2 font-medium" style={{
                            color: results.flowType === (isTr ? 'Laminer' : 'Laminar') ? '#4ade80' :
                                results.flowType === (isTr ? 'Türbülanslı' : 'Turbulent') ? '#f87171' : '#facc15'
                        }}>
                            {results.flowType}
                        </p>
                    </div>

                    <div className="bg-[#111115] border border-white/5 rounded-xl p-5 relative overflow-hidden group shadow-lg shadow-black/50">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
                        <h3 className="text-xs text-white/40 mb-1 uppercase tracking-wider">{isTr ? 'Basınç Düşümü' : 'Pressure Drop'}</h3>
                        <div className="text-3xl font-light text-purple-400">
                            {results.totalPressureDrop} <span className="text-sm text-purple-400/50">bar</span>
                        </div>
                        <p className="text-sm mt-2 font-medium text-white/50">
                            Friction: {results.dpFriction} bar
                        </p>
                    </div>

                    <div className="bg-[#111115] border border-white/5 rounded-xl p-5 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
                        <h3 className="text-xs text-white/40 mb-1 uppercase tracking-wider">{isTr ? 'Gerekli Pompa Gücü' : 'Req. Pump Power'}</h3>
                        <div className="text-3xl font-light text-emerald-400">
                            {results.kineticPower} <span className="text-sm text-emerald-400/50">kW</span>
                        </div>
                        <p className="text-sm mt-2 font-medium text-white/50">
                            {results.flowRate} m³/h
                        </p>
                    </div>
                </div>

                {/* Flow Visualizer */}
                <div className="flex-1 bg-[#111115] border border-white/5 rounded-xl p-6 relative flex flex-col">
                    <h3 className="text-sm font-medium text-white/60 mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        {isTr ? 'Akış Simülasyonu' : 'Flow Simulation'}
                    </h3>

                    <div className="flex-1 flex items-center justify-center relative w-full h-full max-h-[300px]">
                        {/* Pipe Body */}
                        <div className="w-full h-32 border-y-4 border-white/20 relative overflow-hidden bg-gradient-to-b from-white/5 to-transparent">

                            {/* Fluid Flow Particles Animation */}
                            {[...Array(40)].map((_, i) => {
                                // For Laminar: Straight lines. For Turbulent: Random waves
                                const isTurbulent = parseFloat(results.reynolds) > 4000;
                                const speed = Math.max(0.2, (10 - velocity) * 0.5); // Faster velocity = smaller duration

                                return (
                                    <motion.div
                                        key={i}
                                        className="absolute h-1 rounded-full bg-blue-500/60"
                                        style={{
                                            width: isTurbulent ? Math.random() * 40 + 10 : Math.random() * 100 + 50,
                                            top: `${Math.random() * 80 + 10}%`,
                                            left: '-10%'
                                        }}
                                        animate={{
                                            x: ['0vw', '110vw'],
                                            y: isTurbulent ? [0, Math.random() * 20 - 10, 0, Math.random() * -20 + 10, 0] : 0
                                        }}
                                        transition={{
                                            duration: speed + Math.random(),
                                            repeat: Infinity,
                                            ease: 'linear',
                                            delay: Math.random() * 2
                                        }}
                                    />
                                );
                            })}
                        </div>

                        {/* Labels */}
                        <div className="absolute top-1/2 -mt-4 left-0 w-full flex justify-between px-4 opacity-50 text-xs">
                            <div className="flex flex-col items-center">
                                <span>P1</span>
                                <span className="font-mono">{velocity} m/s</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span>P2</span>
                                <span className="font-mono text-purple-400">ΔP = {results.totalPressureDrop} bar</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FluidDynamicsModule;
