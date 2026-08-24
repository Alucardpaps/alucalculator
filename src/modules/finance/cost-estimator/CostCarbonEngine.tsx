'use client';

import React from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { Factory, Leaf, DollarSign } from 'lucide-react';

export function CostCarbonEngine() {
    const { activeCostModel, activeCarbonModel, isSimulatingFactory, analyze3DGeometry } = useFinanceStore();

    return (
        <div className="flex flex-col gap-4 p-4 border border-slate-700 bg-slate-900 rounded-lg">
            <h3 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
                <Factory /> 3D-Driven Cost & Carbon Factory Engine
            </h3>
            <p className="text-sm text-slate-300">aPriori style Digital Factory Simulation (Should-Cost & CO2e)</p>

            <button
                onClick={() => analyze3DGeometry('node-xyz', 2.7)}
                disabled={isSimulatingFactory}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded self-start disabled:opacity-50"
            >
                {isSimulatingFactory ? 'Simulating Digital Factory...' : 'Analyze Component Cost & Carbon'}
            </button>

            {activeCostModel && activeCarbonModel && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="p-3 bg-slate-800 border border-slate-600 rounded">
                        <h4 className="flex items-center gap-2 text-green-400 font-bold mb-2">
                            <DollarSign className="w-4 h-4" /> Should-Cost Model
                        </h4>
                        <ul className="text-sm space-y-1">
                            <li>Material: {activeCostModel.materialCost.toFixed(2)} {activeCostModel.currency}</li>
                            <li>Mfg: {activeCostModel.manufacturingCost.toFixed(2)} {activeCostModel.currency}</li>
                            <li className="font-bold border-t border-slate-700 pt-1">
                                Total: {activeCostModel.totalCost.toFixed(2)} {activeCostModel.currency}
                            </li>
                        </ul>
                    </div>
                    <div className="p-3 bg-slate-800 border border-slate-600 rounded">
                        <h4 className="flex items-center gap-2 text-lime-400 font-bold mb-2">
                            <Leaf className="w-4 h-4" /> Carbon Footprint
                        </h4>
                        <ul className="text-sm space-y-1">
                            <li>Primary: {activeCarbonModel.primaryCO2.toFixed(2)} kg CO2e</li>
                            <li>Energy: {activeCarbonModel.energyCO2.toFixed(2)} kg CO2e</li>
                            <li className="font-bold border-t border-slate-700 pt-1">
                                Total: {activeCarbonModel.totalCO2.toFixed(2)} kg CO2e
                            </li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
