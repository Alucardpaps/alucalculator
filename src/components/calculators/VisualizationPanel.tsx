'use client';

/**
 * AluCalc OS — Visualization Panel
 * 
 * Renders SVG visualizations for calculator outputs.
 * Supports zoom, pan, and export controls.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move, Download, Maximize2, RefreshCw } from 'lucide-react';

// ============================================
// Types
// ============================================

export interface VisualizationPanelProps {
    svg: string;
    viewBox: string;
    width: number;
    height: number;
    title?: string;
    onExportSVG?: () => void;
    onExportPNG?: () => void;
    className?: string;
}

// ============================================
// Styles
// ============================================

const styles = {
    container: `
        flex flex-col bg-[#0a0e14] border border-[#2a3a4a] rounded-lg overflow-hidden
    `,
    header: `
        flex items-center justify-between px-3 py-2 bg-[#1a2332] border-b border-[#2a3a4a]
    `,
    title: `
        text-xs font-bold text-gray-400 uppercase tracking-wider
    `,
    controls: `
        flex items-center gap-1
    `,
    btn: `
        p-1.5 rounded hover:bg-white/10 text-gray-500 hover:text-white
        transition-colors cursor-pointer
    `,
    btnActive: `
        !bg-[#00e5ff]/20 !text-[#00e5ff]
    `,
    viewport: `
        flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing
    `,
    svgContainer: `
        absolute inset-0 flex items-center justify-center
    `,
    zoomInfo: `
        absolute bottom-2 right-2 px-2 py-1 bg-[#0f1419]/90 
        rounded text-xs text-gray-500 tabular-nums
    `,
};

// ============================================
// Main Component
// ============================================

export const VisualizationPanel: React.FC<VisualizationPanelProps> = ({
    svg,
    viewBox,
    width,
    height,
    title = 'Visualization',
    onExportSVG,
    onExportPNG,
    className = '',
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // Zoom controls
    const handleZoomIn = useCallback(() => {
        setZoom(z => Math.min(z * 1.2, 5));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom(z => Math.max(z / 1.2, 0.1));
    }, []);

    const handleResetView = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);

    // Mouse wheel zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(z => Math.max(0.1, Math.min(5, z * delta)));
    }, []);

    // Pan handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }, [pan]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isPanning) return;
        setPan({
            x: e.clientX - panStart.x,
            y: e.clientY - panStart.y,
        });
    }, [isPanning, panStart]);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    // Export handlers
    const handleExportSVG = useCallback(() => {
        if (onExportSVG) {
            onExportSVG();
            return;
        }

        // Default SVG export
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    }, [svg, title, onExportSVG]);

    const handleExportPNG = useCallback(() => {
        if (onExportPNG) {
            onExportPNG();
            return;
        }

        // Canvas-based PNG export
        const canvas = document.createElement('canvas');
        const scale = 2; // 2x for retina
        canvas.width = width * scale;
        canvas.height = height * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        img.onload = () => {
            ctx.fillStyle = '#0a0e14';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const pngUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.png`;
            a.click();
            URL.revokeObjectURL(url);
        };

        img.src = url;
    }, [svg, width, height, title, onExportPNG]);

    // Transform style
    const transformStyle = useMemo(() => ({
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: 'center center',
        transition: isPanning ? 'none' : 'transform 0.1s ease-out',
    }), [zoom, pan, isPanning]);

    return (
        <div className={`${styles.container} ${className}`}>
            {/* Header */}
            <div className={styles.header}>
                <span className={styles.title}>{title}</span>
                <div className={styles.controls}>
                    <button
                        className={styles.btn}
                        onClick={handleZoomOut}
                        title="Zoom Out"
                    >
                        <ZoomOut size={14} />
                    </button>
                    <button
                        className={styles.btn}
                        onClick={handleZoomIn}
                        title="Zoom In"
                    >
                        <ZoomIn size={14} />
                    </button>
                    <button
                        className={styles.btn}
                        onClick={handleResetView}
                        title="Reset View"
                    >
                        <RefreshCw size={14} />
                    </button>
                    <div className="w-px h-4 bg-[#2a3a4a] mx-1" />
                    <button
                        className={styles.btn}
                        onClick={handleExportSVG}
                        title="Export SVG"
                    >
                        <Download size={14} />
                    </button>
                    <button
                        className={styles.btn}
                        onClick={handleExportPNG}
                        title="Export PNG"
                    >
                        <Maximize2 size={14} />
                    </button>
                </div>
            </div>

            {/* Viewport */}
            <div
                ref={containerRef}
                className={styles.viewport}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ minHeight: 200 }}
            >
                <div
                    className={styles.svgContainer}
                    style={transformStyle}
                    dangerouslySetInnerHTML={{ __html: svg }}
                />

                {/* Zoom indicator */}
                <div className={styles.zoomInfo}>
                    {Math.round(zoom * 100)}%
                </div>
            </div>
        </div>
    );
};

export default VisualizationPanel;
