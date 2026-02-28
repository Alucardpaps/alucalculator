'use client';

import React, { useMemo } from 'react';
import { generateBoltSVG } from '@/lib/visualizers/bolt-visualizer';
import { generateBeamSVG } from '@/lib/visualizers/beam-visualizer';
import { generatePipeSVG } from '@/lib/visualizers/pipe-visualizer';
import { generateGearSVG } from '@/lib/visualizers/gear-visualizer';
import type { CalculatorSchema } from '@/types/calculator-schema';
import { isSchemaV2 } from '@/types/calculator-schema-v2';

interface CalculatorVisualizerProps {
    schema: CalculatorSchema;
    inputs: Record<string, number | string>;
    outputs?: Record<string, number>;
}

export const CalculatorVisualizer: React.FC<CalculatorVisualizerProps> = ({
    schema,
    inputs,
    outputs = {},
}) => {
    // V2 Direct Render Support
    const isV2 = isSchemaV2(schema);
    // console.log('Visualizer Render:', { id: schema.id, isV2, hasRender: !!schema.visualization?.render });

    if (isV2 && schema.visualization?.render) {
        try {
            // Reconstruct a partial CalculationResultV2 for the visualizer
            // We map the simple Record<string, number> outputs back to ValidationEngineeringValue format if needed
            // But usually visualizers just need the numbers. 
            // The Schema render function expects CalculationResultV2.

            const mockResult: any = {
                outputs: Object.entries(outputs).reduce((acc, [k, v]) => ({
                    ...acc,
                    [k]: { value: v, unit: '-', type: 'derived' } // simplified
                }), {}),
                verified: true,
                warnings: [],
                timestamp: Date.now()
            };

            return (
                <div className="bg-[#0f1419] border border-[#1e2833] rounded-lg flex flex-col items-center justify-center overflow-hidden w-full h-full relative group">
                    <div className="absolute top-2 left-3 z-10 text-[10px] text-[#00e5ff]/50 uppercase tracking-widest font-bold">
                        VISUALIZATION
                    </div>

                    <div className="w-full h-full p-4 flex items-center justify-center">
                        {schema.visualization.render(
                            mockResult,
                            inputs as any
                        )}
                    </div>
                </div>
            );
        } catch (e) {
            console.error('V2 Visualizer error:', e);
            return null;
        }
    }

    // Legacy Support
    const visualizerContent = useMemo(() => {
        const id = schema.id;
        // ... (legacy logic)

        // Use imports we defined at top
        // Use imports we defined at top
        const VISUALIZERS: any = {
            generateBoltSVG,
            generateBeamSVG,
            generatePipeSVG,
            generateGearSVG,
        };

        try {
            // 1. Beam Deflection (Legacy ID check)
            if (id === 'beam-deflection-v1' || id === 'beam-deflection') {
                return generateBeamSVG({
                    span: (inputs as any).length || 1000,
                    loadMagnitude: (inputs as any).load || 1000,
                    loadType: 'point',
                    loadPosition: 0.5,
                    supportLeft: 'pinned',
                    supportRight: 'roller',
                    deflection: 0,
                    sectionType: 'i-beam'
                });
            }

            // 2. V2 Schema explicit routing
            if (id === 'gear-spur') {
                return generateGearSVG(inputs as any);
            }
            if (id === 'bolt-stress' || id === 'fasteners') {
                return generateBoltSVG(inputs as any);
            }
            if (id === 'fluid-flow' || id === 'pumps') {
                return generatePipeSVG(inputs as any);
            }

            // ... (rest of legacy logic trimmed for brevity as V2 replaces it mostly)
            // But let's keep the generic lookup for fallback

            // 7. Generic Fallback for Parametric Types
            // Check both V1 visualizer string and V2 visualization struct 
            const visType = (schema as any).visualizer || (schema as any).visualization?.type;

            // Note: V2 structural type is 'svg-parametric', but if we know the ID we routed it above.
            if (typeof visType === 'string' && VISUALIZERS[visType]) {
                return VISUALIZERS[visType](inputs as any);
            }

            return null;
        } catch (e) {
            console.error('Visualizer error:', e);
            return null;
        }
    }, [schema, inputs]);

    if (!visualizerContent) return null;

    return (
        <div className="bg-[#0f1419] border border-[#1e2833] rounded-lg p-4 flex flex-col items-center justify-center overflow-hidden">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2 w-full text-left flex justify-between">
                <span>VISUALIZATION</span>
                <span>LIVE PREVIEW</span>
            </div>

            <div className="relative w-full aspect-square max-h-[300px] flex items-center justify-center bg-[#1a2332]/50 rounded border border-[#2a3a4a]/50">
                <svg
                    viewBox={(() => {
                        const vb = visualizerContent.viewBox;
                        if (!vb || typeof vb !== 'string') return '0 0 100 100';
                        const parts = vb.split(' ').map(Number);
                        if (parts.some(p => !Number.isFinite(p))) {
                            // console.warn('Invalid viewBox detected:', vb);
                            return '0 0 100 100';
                        }
                        return vb;
                    })()}
                    className="w-full h-full max-h-[280px]"
                    style={{ maxHeight: '100%' }}
                    dangerouslySetInnerHTML={{ __html: visualizerContent.__html || visualizerContent.svg }}
                />
            </div>

            <div className="mt-2 text-[10px] text-gray-600 font-mono w-full text-center">
                {schema.id} · {visualizerContent.width}x{visualizerContent.height}px
            </div>
        </div>
    );
};
