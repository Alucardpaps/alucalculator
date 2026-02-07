'use client';

import React from 'react';

interface CostEstimatorModuleProps {
    lang: string;
    dict: any;
}

export default function CostEstimatorModule({ lang, dict }: CostEstimatorModuleProps) {
    return (
        <div className="flex flex-col gap-4 p-4 bg-[#1e1e1e] h-full text-slate-200">
            <div className="text-gray-400 italic text-xs text-center mt-2">
                Waiting for mass input from other modules...
            </div>

            {/* Simulation of connected data */}
            <div className="mt-auto border-t border-[#333] pt-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Material Cost</span>
                    <span className="font-mono text-gray-300">$0.00</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Labor Estimate</span>
                    <span className="font-mono text-gray-300">$0.00</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#333] border-dashed">
                    <span className="font-bold text-white">Total Estimated Cost</span>
                    <span className="text-xl font-bold text-green-400 font-mono">$0.00</span>
                </div>
            </div>
        </div>
    );
}
