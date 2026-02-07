'use client';

/**
 * AluCalc OS — Split Calculator View
 * 
 * Combines UniversalCalcRenderer with live visualization panel.
 * Dynamically generates SVG based on calculator outputs.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { PanelLeftClose, PanelRightClose, Eye, EyeOff } from 'lucide-react';
import type { CalculatorSchema } from '@/types/calculator-schema';
import { UniversalCalcRenderer } from './UniversalCalcRenderer';
import { VisualizationPanel } from './VisualizationPanel';

// Visualizer imports
import { generateBoltSVG, BoltVisualizerParams } from '@/lib/visualizers/bolt-visualizer';
import { generateBeamSVG, BeamVisualizerParams } from '@/lib/visualizers/beam-visualizer';
import { generatePipeSVG, PipeVisualizerParams } from '@/lib/visualizers/pipe-visualizer';

// ============================================
// Types
// ============================================

export interface SplitCalcViewProps {
    schema: CalculatorSchema;
    initialValues?: Record<string, number>;
    className?: string;
}

type VisualizerType = 'generateBoltSVG' | 'generateBeamSVG' | 'generatePipeSVG' | string;

// ============================================
// Styles
// ============================================

const styles = {
    container: `
        flex h-full bg-[#0a0e14] overflow-hidden
    `,
    calcPanel: `
        flex flex-col overflow-y-auto
    `,
    vizPanel: `
        flex flex-col flex-1 min-w-0
    `,
    resizer: `
        w-1 bg-[#2a3a4a] hover:bg-[#00e5ff] cursor-col-resize 
        transition-colors flex-shrink-0
    `,
    toggleBar: `
        flex items-center gap-1 px-2 py-1 bg-[#1a2332] border-b border-[#2a3a4a]
    `,
    toggleBtn: `
        p-1.5 rounded hover:bg-white/10 text-gray-500 hover:text-white
        transition-colors cursor-pointer
    `,
    toggleBtnActive: `
        !bg-[#00e5ff]/20 !text-[#00e5ff]
    `,
    noViz: `
        flex-1 flex items-center justify-center text-gray-600 text-sm
    `,
};

// ============================================
// Visualizer Mapping
// ============================================

function generateVisualization(
    visualizer: VisualizerType | undefined,
    inputs: Record<string, number>,
    outputs: Record<string, number>
): { svg: string; viewBox: string; width: number; height: number } | null {
    if (!visualizer) return null;

    switch (visualizer) {
        case 'generateBoltSVG': {
            const params: BoltVisualizerParams = {
                diameter: inputs.diameter || 10,
                pitch: inputs.pitch || 1.5,
                length: inputs.length || 50,
                threadLength: inputs.threadLength || (inputs.length || 50) * 0.7,
                headType: 'hex',
                showThreads: true,
                stressRatio: outputs.safetyFactor ? Math.max(0, 1 - outputs.safetyFactor / 3) : 0,
            };
            return generateBoltSVG(params);
        }

        case 'generateBeamSVG': {
            const params: BeamVisualizerParams = {
                span: inputs.span || 3000,
                loadMagnitude: inputs.load || 10000,
                loadType: 'uniform',
                supportLeft: 'pinned',
                supportRight: 'roller',
                deflection: outputs.deflection || 0,
                stressRatio: outputs.stressRatio || 0,
            };
            return generateBeamSVG(params);
        }

        case 'generatePipeSVG': {
            const params: PipeVisualizerParams = {
                diameter: inputs.diameter || 50,
                velocity: outputs.velocity || 1.5,
                reynoldsNumber: outputs.reynoldsNumber || 50000,
                pressureDrop: outputs.pressureDrop || 1000,
                showVelocityProfile: true,
            };
            return generatePipeSVG(params);
        }

        default:
            return null;
    }
}

// ============================================
// Main Component
// ============================================

export const SplitCalcView: React.FC<SplitCalcViewProps> = ({
    schema,
    initialValues,
    className = '',
}) => {
    const [inputValues, setInputValues] = useState<Record<string, number>>(() => {
        const defaults: Record<string, number> = {};
        schema.inputs.forEach(input => {
            defaults[input.key] = initialValues?.[input.key] ?? input.default;
        });
        return defaults;
    });

    const [outputValues, setOutputValues] = useState<Record<string, number>>({});
    const [showViz, setShowViz] = useState(true);
    const [calcWidth, setCalcWidth] = useState(400);
    const [isResizing, setIsResizing] = useState(false);

    // Handle values change
    const handleValuesChange = useCallback((values: Record<string, number>) => {
        setInputValues(values);
    }, []);

    // Handle outputs change
    const handleOutputsChange = useCallback((outputs: Record<string, number>) => {
        setOutputValues(outputs);
    }, []);

    // Generate visualization
    const vizData = useMemo(() => {
        return generateVisualization(schema.visualizer, inputValues, outputValues);
    }, [schema.visualizer, inputValues, outputValues]);

    // Resize handlers
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);

        const handleMove = (moveEvent: MouseEvent) => {
            setCalcWidth(Math.max(300, Math.min(600, moveEvent.clientX)));
        };

        const handleUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
    }, []);

    const hasVisualizer = !!schema.visualizer && !!vizData;

    return (
        <div className={`${styles.container} ${className}`}>
            {/* Calculator Panel */}
            <div
                className={styles.calcPanel}
                style={{ width: showViz && hasVisualizer ? calcWidth : '100%' }}
            >
                <div className={styles.toggleBar}>
                    {hasVisualizer && (
                        <button
                            className={`${styles.toggleBtn} ${showViz ? styles.toggleBtnActive : ''}`}
                            onClick={() => setShowViz(!showViz)}
                            title={showViz ? 'Hide Visualization' : 'Show Visualization'}
                        >
                            {showViz ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    <UniversalCalcRenderer
                        schema={schema}
                        initialValues={inputValues}
                        onValuesChange={handleValuesChange}
                        onOutputsChange={handleOutputsChange}
                        showAssumptions={true}
                        showReferences={true}
                    />
                </div>
            </div>

            {/* Visualization Panel */}
            {showViz && hasVisualizer && vizData && (
                <>
                    {/* Resizer */}
                    <div
                        className={styles.resizer}
                        onMouseDown={handleResizeStart}
                        style={{
                            backgroundColor: isResizing ? 'var(--color-cyan, #00e5ff)' : undefined
                        }}
                    />

                    {/* Viz Panel */}
                    <div className={styles.vizPanel}>
                        <VisualizationPanel
                            svg={vizData.svg}
                            viewBox={vizData.viewBox}
                            width={vizData.width}
                            height={vizData.height}
                            title={schema.metadata.title}
                            className="flex-1"
                        />
                    </div>
                </>
            )}

            {/* No visualizer message */}
            {showViz && !hasVisualizer && (
                <div className={styles.noViz}>
                    <span>No visualization available for this calculator</span>
                </div>
            )}
        </div>
    );
};

export default SplitCalcView;
