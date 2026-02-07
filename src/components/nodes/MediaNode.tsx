'use client';

/**
 * AluCalc OS — Media Node
 * 
 * ReactFlow node for displaying educational media:
 * - YouTube embeds
 * - PDF previews
 * - Images
 */

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { X, ExternalLink, Play, FileText, Image } from 'lucide-react';
import type { MediaNodeData } from '@/store/flowStore';
import { useFlowStore } from '@/store/flowStore';

// ============================================
// Styles
// ============================================

const styles = {
    node: `
        min-w-[320px] bg-[#0f1419] 
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
        text-xs font-bold text-gray-400 uppercase tracking-wider
        flex items-center gap-2
    `,
    headerBtn: `
        p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white
        transition-colors cursor-pointer
    `,
    body: `
        p-2
    `,
    youtube: `
        aspect-video bg-black rounded overflow-hidden
    `,
    pdf: `
        aspect-[4/3] bg-gray-900 rounded flex items-center justify-center
        border border-dashed border-gray-700
    `,
    pdfIcon: `
        text-gray-500 flex flex-col items-center gap-2
    `,
    image: `
        max-h-[300px] rounded overflow-hidden
    `,
};

// ============================================
// Media Type Icons
// ============================================

const mediaIcons = {
    youtube: Play,
    pdf: FileText,
    image: Image,
};

// ============================================
// Main Component
// ============================================

const MediaNode: React.FC<NodeProps<MediaNodeData>> = ({
    id,
    data,
    selected
}) => {
    const { removeNode } = useFlowStore();

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        removeNode(id);
    };

    const Icon = mediaIcons[data.mediaType];

    const renderMedia = () => {
        switch (data.mediaType) {
            case 'youtube':
                // Extract video ID from URL or use directly
                const videoId = data.url.includes('youtube.com')
                    ? new URL(data.url).searchParams.get('v')
                    : data.url.includes('youtu.be')
                        ? data.url.split('/').pop()
                        : data.url;

                return (
                    <div className={styles.youtube}>
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title={data.title || 'YouTube Video'}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                );

            case 'pdf':
                return (
                    <div className={styles.pdf}>
                        <div className={styles.pdfIcon}>
                            <FileText size={48} />
                            <span className="text-xs">PDF Document</span>
                            <a
                                href={data.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#00e5ff] hover:underline flex items-center gap-1 text-xs"
                            >
                                Open <ExternalLink size={10} />
                            </a>
                        </div>
                    </div>
                );

            case 'image':
                return (
                    <div className={styles.image}>
                        <img
                            src={data.url}
                            alt={data.title || 'Image'}
                            className="w-full h-full object-contain"
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={`${styles.node} ${selected ? styles.nodeSelected : ''}`}>
            {/* Header */}
            <div className={`${styles.header} draggable-handle`}>
                <div className={styles.headerTitle}>
                    <Icon size={14} />
                    {data.title || data.mediaType.toUpperCase()}
                </div>
                <div className="flex items-center gap-1">
                    <a
                        href={data.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.headerBtn}
                    >
                        <ExternalLink size={12} />
                    </a>
                    <button
                        className={styles.headerBtn}
                        onClick={handleClose}
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className={styles.body}>
                {renderMedia()}
            </div>
        </div>
    );
};

export default memo(MediaNode);
