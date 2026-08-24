'use client';

/**
 * AluCalc OS — Visualizer Node
 * 
 * Renders 2D/3D visualizations driven by incoming data connections.
 * Supports:
 * - Reactive 3D models (Gears, Shafts)
 * - 2D Engineering Plots (Beams, Welds, Profiles)
 * - Technical Drawing Previews
 */

import React, { memo, useMemo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { X, Maximize2, Settings, Eye, Send } from 'lucide-react';
import type { VisualizerNodeData } from '@/store/flowStore';
import { useFlowStore } from '@/store/flowStore';
import { useCadStore } from '@/cad/store/cadStore';

// Visualizers
import { ProfileVisualization } from '@/components/visualizers/ProfileVisualization';
import { GearVisualization } from '@/components/GearVisualization';
import WeldingVisualization, { WeldType } from '@/components/WeldingVisualization';
import { Interactive3DBox } from '@/components/visualizers/Interactive3DBox';

// Exporters
import { generateDXF } from '@/export/dxf/dxf-writer';
import { STEPWriter, addCartesianPoint, addVertexPoint, addDirection, addVector, addLine, addEdgeCurve } from '@/engines/export/step.writer';

// ============================================
// Styles
// ============================================

const styles = {
    node: `
        min-w-[320px] bg-[#05090e]/85 backdrop-blur-2xl
        border border-cyan-900/40 rounded-xl overflow-hidden
        shadow-[0_8px_32px_rgba(0,0,0,0.6)]
        transition-all duration-300 group
    `,
    nodeSelected: `
        ring-1 ring-[#00e5ff] shadow-[0_0_30px_rgba(0,229,255,0.2)]
    `,
    header: `
        flex items-center justify-between gap-2 px-4 py-3
        bg-black/40 border-b border-cyan-900/30 cursor-move relative
    `,
    headerTitle: `
        text-[11px] font-bold text-white uppercase tracking-[0.2em] drop-shadow-md
        flex items-center gap-2
    `,
    headerBtn: `
        p-1.5 rounded-full hover:bg-cyan-900/30 text-slate-600 hover:text-cyan-400 transition-colors cursor-pointer
    `,
    body: `
        p-0 bg-transparent relative min-h-[250px] flex items-center justify-center
    `,
    handle: `
        !w-5 !h-5 !bg-[#05090e] !border-2 !border-[#00e5ff] !rounded-[4px]
        hover:!bg-[#00e5ff]/20 transition-all !cursor-crosshair z-20
        !shadow-[0_0_12px_rgba(0,229,255,0.6),_inset_0_0_8px_rgba(0,229,255,0.4)]
    `,
    handleLabel: `
        absolute text-[10px] text-[#00e5ff] font-mono tracking-widest
        pointer-events-none whitespace-nowrap bg-[#05090e]/90 backdrop-blur px-2 py-0.5 rounded-sm border border-[#00e5ff]/40 shadow-[0_0_15px_rgba(0,229,255,0.2)]
        opacity-0 group-hover:opacity-100 transition-opacity duration-300
    `,
    exportBar: `
        flex items-center justify-end gap-2 p-2 px-4
        bg-black/20 border-t border-cyan-900/10 backdrop-blur-md
    `,
    exportBtn: `
        text-[9px] px-3 py-1.5 bg-[#0a0f16]/60 border border-cyan-900/50 rounded
        text-cyan-600 hover:text-[#00e5ff] hover:border-[#00e5ff]/50 font-bold uppercase tracking-widest
        transition-all flex items-center gap-2 hover:shadow-[0_0_10px_rgba(0,229,255,0.2)] cursor-pointer
    `
};

// ============================================
// Main Component
// ============================================

const VisualizerNode: React.FC<NodeProps<VisualizerNodeData>> = ({
    id,
    data,
    selected
}) => {
    const { removeNode } = useFlowStore();
    const addEntity = useCadStore(state => state.addEntity); // Existing CAD logic

    // ─────────────────────────────────────────
    // Helper Functions for File Export (Client-Side)
    // ─────────────────────────────────────────

    // Direct DXF Export
    const handleDownloadDXF = () => {
        if (data.vizType !== '3d-box') return;
        const w = Number(data.inputs?.width) || 100;
        const h = Number(data.inputs?.height) || 50;

        // Simulate creating simple flat entities for DXF based on the 3D footprint
        const entities: any[] = [
            { id: '1', geometry: { type: 'LINE', start: { x: 0, y: 0 }, end: { x: w, y: 0 } }, layerId: '0' },
            { id: '2', geometry: { type: 'LINE', start: { x: w, y: 0 }, end: { x: w, y: h } }, layerId: '0' },
            { id: '3', geometry: { type: 'LINE', start: { x: w, y: h }, end: { x: 0, y: h } }, layerId: '0' },
            { id: '4', geometry: { type: 'LINE', start: { x: 0, y: h }, end: { x: 0, y: 0 } }, layerId: '0' },
        ];

        try {
            const dxfString = generateDXF(entities, [{ id: '0', name: '0', color: '#FFFFFF', isVisible: true, isLocked: false }]);
            const blob = new Blob([dxfString], { type: 'application/dxf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `3d-box-2d-profile_${Date.now()}.dxf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('DXF generation failed', e);
            alert('Failed to generate DXF client-side.');
        }
    };

    // Direct STEP Export
    const handleDownloadSTEP = () => {
        if (data.vizType !== '3d-box') return;
        const w = Number(data.inputs?.width) || 100;
        const h = Number(data.inputs?.height) || 50;
        const t = Number(data.inputs?.thickness) || 30;

        try {
            const writer = new STEPWriter({ filename: '3D_Box_Export', author: 'AluCalc Node', description: 'Extruded Box Entity' });

            // Draw a basic face / boundary outline for demonstration purposes to prove the pipeline:
            const p1 = addCartesianPoint(writer, 0, 0, 0);
            const p2 = addCartesianPoint(writer, w, 0, 0);
            const v1 = addVertexPoint(writer, p1);
            const v2 = addVertexPoint(writer, p2);
            const dir = addDirection(writer, 1, 0, 0);
            const vec = addVector(writer, dir, w);
            const line = addLine(writer, p1, vec);
            addEdgeCurve(writer, v1, v2, line, true);

            const stepString = writer.generate();
            const blob = new Blob([stepString], { type: 'application/step' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `3d-box_${Date.now()}.step`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('STEP generation failed', e);
            alert('Failed to generate STEP client-side.');
        }
    };

    // ─────────────────────────────────────────
    // Handles & Operations
    // ─────────────────────────────────────────

    // Define input handles based on visualization type
    const handles = useMemo(() => {
        switch (data.vizType) {
            case 'gear':
                return [
                    { id: 'module', label: 'Module', top: 20 },
                    { id: 'pinionTeeth', label: 'Pinion Teeth', top: 40 },
                    { id: 'gearTeeth', label: 'Gear Teeth', top: 60 },
                    { id: 'pressureAngle', label: 'Pressure Angle', top: 80 },
                ];
            case 'welding':
                return [
                    { id: 'legSize', label: 'Leg Size (a)', top: 20 },
                    { id: 'thickness', label: 'Thickness (t)', top: 40 },
                ];
            case '3d-box':
                return [
                    { id: 'width', label: 'Width (X)', top: 20 },
                    { id: 'height', label: 'Height (Y)', top: 40 },
                    { id: 'thickness', label: 'Thickness (Z)', top: 60 },
                ];
            default:
                return [];
        }
    }, [data.vizType]);


    const renderContent = () => {
        if (data.vizType === '3d-box') {
            const w = Number(data.inputs?.width) || 100;
            const h = Number(data.inputs?.height) || 50;
            const t = Number(data.inputs?.thickness) || 30;

            return <Interactive3DBox width={w} height={h} thickness={t} />;
        }

        // Explicitly handle profile types
        if (data.vizType === 'profile' || data.vizType === 'box-profile' || data.vizType === 'details') {
            return (
                <ProfileVisualization
                    type={Number(data.inputs?.profileType) || 1 as any}
                    width={Number(data.inputs?.width) || 100}
                    height={Number(data.inputs?.height) || 50}
                    thickness={Number(data.inputs?.thickness) || 3}
                    webThickness={Number(data.inputs?.webThickness)}
                    className="w-full"
                />
            );
        }

        switch (data.vizType) {
            case 'gear':
                const pinion = {
                    module: Number(data.inputs?.module) || 2,
                    teeth: Number(data.inputs?.pinionTeeth) || 20,
                    pressureAngle: Number(data.inputs?.pressureAngle) || 20,
                    label: 'Driver'
                };
                const gear = {
                    module: Number(data.inputs?.module) || 2,
                    teeth: Number(data.inputs?.gearTeeth) || 40,
                    label: 'Driven'
                };
                return (
                    <div className="p-2 w-full h-full">
                        <GearVisualization
                            pinion={pinion}
                            gear={gear}
                            showAnnotations={true}
                            showMesh={true}
                            className="w-full"
                        />
                    </div>
                );

            case 'welding':
                const type: WeldType = (data.inputs?.type as WeldType) || 'fillet';
                const legSize = Number(data.inputs?.legSize) || 5;
                const thickness = Number(data.inputs?.thickness) || 10;

                return (
                    <div className="p-2 w-full h-full">
                        <WeldingVisualization
                            type={type}
                            legSize={legSize}
                            thickness={thickness}
                            className="w-full"
                        />
                    </div>
                );

            default:
                return (
                    <div className="text-gray-500 text-xs flex flex-col items-center gap-2 p-4">
                        <Eye size={24} />
                        <span>No visualization selected</span>
                        <div className="text-[10px] opacity-50">{data.vizType}</div>
                    </div>
                );
        }
    };

    return (
        <div className={`${styles.node} ${selected ? styles.nodeSelected : ''}`}>
            {/* Dynamic Input Handles */}
            {handles.map((h, i) => (
                <div key={h.id} style={{ position: 'absolute', left: 0, top: h.top + 30 }}>
                    <Handle
                        type="target"
                        position={Position.Left}
                        id={h.id}
                        className={styles.handle}
                    />
                    <span className={`${styles.handleLabel} left-4`}>
                        {h.label}
                    </span>
                </div>
            ))}

            {/* Header */}
            <div className={`${styles.header} draggable-handle`}>
                <div className={styles.headerTitle}>
                    <Eye size={14} className="text-[#00e5ff]" />
                    {data.title || 'Visualizer 3D'}
                </div>
                <div className="flex items-center gap-1">
                    <button className={styles.headerBtn}>
                        <Maximize2 size={12} />
                    </button>
                    <button className={styles.headerBtn}>
                        <Settings size={12} />
                    </button>
                    <button
                        className={styles.headerBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            removeNode(id);
                        }}
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className={styles.body}>
                {renderContent()}
            </div>

            {/* Export Bar specifically for 3D boxes */}
            {data.vizType === '3d-box' && (
                <div className={styles.exportBar}>
                    <button onClick={handleDownloadDXF} className={styles.exportBtn}>
                        DXF Export
                    </button>
                    <button onClick={handleDownloadSTEP} className={styles.exportBtn}>
                        STEP Export
                    </button>
                </div>
            )}
        </div>
    );
};

export default memo(VisualizerNode);
