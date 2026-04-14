'use client';

import React from 'react';
import { useMechanicalStore } from '@/store/useMechanicalStore';
import { Activity, Settings } from 'lucide-react';

export function KinematicNVHAnalysis() {
    const { gearboxNVHData, runNVHAnalysis } = useMechanicalStore();

    return (
        <div className="flex flex-col gap-4 p-4 border border-slate-700 bg-slate-900 rounded-lg">
            <h3 className="text-xl font-bold flex items-center gap-2 text-amber-400">
                <Activity /> Kinematic NVH & Gearbox Analysis
            </h3>
            <p className="text-sm text-slate-300">KISSsoft style holistic transmission & frequency response (NVH) evaluation.</p>

            <button
                onClick={() => runNVHAnalysis({})}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded self-start flex items-center gap-2"
            >
                <Settings className="w-4 h-4" /> Run NVH Simulation
            </button>

            {gearboxNVHData && (
                <div className="mt-2 p-3 bg-slate-800 border-l-4 border-amber-500 rounded text-sm">
                    <h4 className="font-bold text-amber-300 mb-2">NVH Simulation Results</h4>
                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                        <div><span className="text-slate-500">Peak Frequency:</span> {gearboxNVHData.frequencyHz} Hz</div>
                        <div><span className="text-slate-500">Max Amplitude:</span> {gearboxNVHData.amplitude} mm/s</div>
                        <div className="col-span-2 mt-1">
                            <span className="text-slate-500">Critical Modes identified:</span>
                            <span className="text-rose-400 ml-2">{gearboxNVHData.criticalModes.join(', ')}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
