'use client';

/**
 * AluCalc OS — Calculator Node
 * 
 * ReactFlow node wrapper that embeds UniversalCalcRenderer.
 * Dynamically generates input/output handles based on schema.
 */

import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { X, Minimize2, Maximize2, GripVertical } from 'lucide-react';
import type { CalculatorNodeData } from '@/store/flowStore';
import { useFlowStore } from '@/store/flowStore';
import { UniversalCalcRenderer } from '@/components/calculators/UniversalCalcRenderer';

// ============================================
// Styles
// ============================================

const styles = {
    node: `
        min-w-[380px] max-w-[450px] bg-[#0f1419] 
        rounded-lg shadow-2xl border border-[#2a3a4a]
        overflow-hidden
    `,
    nodeSelected: `
        border-[#00e5ff] ring-2 ring-[#00e5ff]/30
    `,
    header: `
        flex items-center justify-between gap-2 px-3 py-2
        bg-gradient-to-r from-[#1a2332] to-[#0f1419]
        border-b border-[#2a3a4a] cursor-move
    `,
    headerTitle: `
        text-xs font-bold text-[#00e5ff] uppercase tracking-wider
        flex items-center gap-2
    `,
    headerActions: `
        flex items-center gap-1
    `,
    headerBtn: `
        p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white
        transition-colors cursor-pointer
    `,
    body: `
        p-2
    `,
    handleContainer: `
        absolute flex flex-col gap-2
    `,
    handleLabel: `
        text-[10px] text-gray-500 whitespace-nowrap
    `,
    handleWrapper: `
        flex items-center gap-1
    `,
};

// ============================================
// Handle Component
// ============================================

interface PortHandleProps {
    type: 'source' | 'target';
    position: Position;
    id: string;
    label: string;
    unit: string;
}

const PortHandle: React.FC<PortHandleProps> = ({ type, position, id, label, unit }) => {
    const isLeft = position === Position.Left;

    return (
        <div className="relative flex items-center" style={{ height: 24 }}>
            <Handle
                type={type}
                position={position}
                id={id}
                className="!w-3 !h-3 !bg-[#00e5ff] !border-2 !border-[#0f1419]"
                style={{
                    [isLeft ? 'left' : 'right']: -6,
                    position: 'absolute',
                }}
            />
            <span
                className={styles.handleLabel}
                style={{
                    marginLeft: isLeft ? 12 : 0,
                    marginRight: isLeft ? 0 : 12,
                    textAlign: isLeft ? 'left' : 'right',
                }}
            >
                {label} <span className="text-gray-600">({unit})</span>
            </span>
        </div>
    );
};

// ============================================
// Main Component
// ============================================

const CalculatorNode: React.FC<NodeProps<CalculatorNodeData>> = ({
    id,
    data,
    selected
}) => {
    const { updateCalculatorInputs, updateCalculatorOutputs, removeNode } = useFlowStore();
    const [isMinimized, setIsMinimized] = React.useState(false);

    const { schema, inputs, outputs } = data;

    // Handle input changes from renderer
    const handleValuesChange = useCallback((newInputs: Record<string, number>) => {
        updateCalculatorInputs(id, newInputs);
    }, [id, updateCalculatorInputs]);

    // Handle output changes from renderer
    const handleOutputsChange = useCallback((newOutputs: Record<string, number>) => {
        updateCalculatorOutputs(id, newOutputs);
    }, [id, updateCalculatorOutputs]);

    // Close handler
    const handleClose = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        removeNode(id);
    }, [id, removeNode]);

    // Minimize handler
    const handleMinimize = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMinimized(prev => !prev);
    }, []);

    // Generate input handles (left side)
    const inputHandles = useMemo(() =>
        schema.inputs.map(input => (
            <PortHandle
                key={input.key}
                type="target"
                position={Position.Left}
                id={input.key}
                label={input.name}
                unit={input.unit}
            />
        )), [schema.inputs]
    );

    // Generate output handles (right side)
    const outputHandles = useMemo(() =>
        schema.outputs.map(output => (
            <PortHandle
                key={output.key}
                type="source"
                position={Position.Right}
                id={output.key}
                label={output.name}
                unit={output.unit}
            />
        )), [schema.outputs]
    );

    return (
        <div className={`${styles.node} ${selected ? styles.nodeSelected : ''}`}>
            {/* Header */}
            <div className={`${styles.header} draggable-handle`}>
                <div className={styles.headerTitle}>
                    <GripVertical size={14} className="text-gray-600" />
                    {schema.metadata.title}
                </div>
                <div className={styles.headerActions}>
                    <button
                        className={styles.headerBtn}
                        onClick={handleMinimize}
                        title={isMinimized ? 'Expand' : 'Minimize'}
                    >
                        {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                    </button>
                    <button
                        className={styles.headerBtn}
                        onClick={handleClose}
                        title="Remove"
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* Body */}
            {!isMinimized && (
                <div className={styles.body}>
                    <UniversalCalcRenderer
                        schema={schema}
                        initialValues={inputs}
                        onValuesChange={handleValuesChange}
                        onOutputsChange={handleOutputsChange}
                        compact={true}
                        showAssumptions={false}
                        showReferences={false}
                    />
                </div>
            )}

            {/* Handle Labels - Left (Inputs) */}
            <div
                className={styles.handleContainer}
                style={{ left: 0, top: 50 }}
            >
                {inputHandles}
            </div>

            {/* Handle Labels - Right (Outputs) */}
            <div
                className={styles.handleContainer}
                style={{ right: 0, top: 50, alignItems: 'flex-end' }}
            >
                {outputHandles}
            </div>
        </div>
    );
};

export default memo(CalculatorNode);
