'use client';

/**
 * AluCalc OS — Context-Aware Media Panel
 * 
 * Displays relevant educational content (videos, PDFs, diagrams)
 * based on the active calculator or workflow context.
 */

import React, { useState, useMemo } from 'react';
import {
    Video,
    FileText,
    Image,
    ExternalLink,
    ChevronDown,
    ChevronRight,
    Play,
    X,
    Maximize2
} from 'lucide-react';
import type { CalculatorMedia } from '@/types/calculator-schema';

// ============================================
// Types
// ============================================

export interface MediaPanelProps {
    media: CalculatorMedia | null;
    calculatorTitle?: string;
    className?: string;
}

interface MediaItem {
    type: 'video' | 'pdf' | 'image';
    url: string;
    title: string;
    thumbnail?: string;
}

// ============================================
// Styles
// ============================================

const styles = {
    container: `
        bg-[#0f1419] border border-[#2a3a4a] rounded-lg overflow-hidden
    `,
    header: `
        flex items-center justify-between px-4 py-3 bg-[#1a2332] 
        border-b border-[#2a3a4a]
    `,
    title: `
        flex items-center gap-2 text-sm font-bold text-white
    `,
    content: `
        p-4 space-y-4
    `,
    section: `
        space-y-2
    `,
    sectionTitle: `
        flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase mb-2
    `,
    grid: `
        grid grid-cols-2 gap-3
    `,
    mediaCard: `
        relative bg-[#0a0e14] rounded-lg border border-[#2a3a4a] 
        overflow-hidden cursor-pointer hover:border-[#00e5ff]/50 
        transition-all group
    `,
    thumbnail: `
        aspect-video bg-[#1a2332] flex items-center justify-center relative
    `,
    playOverlay: `
        absolute inset-0 flex items-center justify-center 
        bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity
    `,
    mediaTitle: `
        p-2 text-xs text-gray-400 truncate
    `,
    modal: `
        fixed inset-0 z-50 flex items-center justify-center 
        bg-black/80 backdrop-blur-sm
    `,
    modalContent: `
        relative bg-[#0f1419] rounded-xl border border-[#2a3a4a] 
        overflow-hidden max-w-4xl w-full mx-4 max-h-[90vh]
    `,
    modalHeader: `
        flex items-center justify-between px-4 py-3 bg-[#1a2332] 
        border-b border-[#2a3a4a]
    `,
    modalBody: `
        aspect-video
    `,
    empty: `
        flex flex-col items-center justify-center py-8 text-gray-500
    `,
};

// ============================================
// Helper Functions
// ============================================

function getYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
}

function getYouTubeThumbnail(url: string): string {
    const id = getYouTubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : '';
}

// ============================================
// Sub Components
// ============================================

const MediaCard: React.FC<{
    item: MediaItem;
    onClick: () => void;
}> = ({ item, onClick }) => {
    const thumbnail = item.thumbnail || (
        item.type === 'video' ? getYouTubeThumbnail(item.url) : null
    );

    const getIcon = () => {
        switch (item.type) {
            case 'video': return <Play size={24} className="text-white" />;
            case 'pdf': return <FileText size={24} className="text-red-400" />;
            case 'image': return <Image size={24} className="text-green-400" />;
        }
    };

    return (
        <div className={styles.mediaCard} onClick={onClick}>
            <div className={styles.thumbnail}>
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    getIcon()
                )}
                <div className={styles.playOverlay}>
                    {item.type === 'video' ? (
                        <div className="w-12 h-12 rounded-full bg-[#00e5ff] flex items-center justify-center">
                            <Play size={20} className="text-black ml-0.5" />
                        </div>
                    ) : (
                        <Maximize2 size={24} className="text-white" />
                    )}
                </div>
            </div>
            <div className={styles.mediaTitle}>
                {item.title}
            </div>
        </div>
    );
};

const MediaModal: React.FC<{
    item: MediaItem | null;
    onClose: () => void;
}> = ({ item, onClose }) => {
    if (!item) return null;

    const renderContent = () => {
        switch (item.type) {
            case 'video': {
                const videoId = getYouTubeId(item.url);
                return videoId ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <video src={item.url} controls className="w-full h-full" autoPlay />
                );
            }
            case 'pdf':
                return (
                    <iframe
                        src={item.url}
                        className="w-full h-full"
                        title={item.title}
                    />
                );
            case 'image':
                return (
                    <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-contain"
                    />
                );
        }
    };

    return (
        <div className={styles.modal} onClick={onClose}>
            <div
                className={styles.modalContent}
                onClick={e => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <span className="text-sm font-medium text-white">
                        {item.title}
                    </span>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                        <X size={18} className="text-gray-400" />
                    </button>
                </div>
                <div className={styles.modalBody}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

// ============================================
// Main Component
// ============================================

export const MediaPanel: React.FC<MediaPanelProps> = ({
    media,
    calculatorTitle,
    className = '',
}) => {
    const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);

    // Convert schema media to items
    const mediaItems = useMemo((): MediaItem[] => {
        if (!media) return [];

        const items: MediaItem[] = [];

        if (media.youtubeId) {
            items.push({
                type: 'video',
                url: `https://www.youtube.com/watch?v=${media.youtubeId}`,
                title: 'Educational Video',
            });
        }

        if (media.pdfUrl) {
            items.push({
                type: 'pdf',
                url: media.pdfUrl,
                title: 'Reference PDF',
            });
        }

        if (media.diagramUrl) {
            items.push({
                type: 'image',
                url: media.diagramUrl,
                title: 'Technical Diagram',
            });
        }

        return items;
    }, [media]);

    // Group by type
    const videos = mediaItems.filter(m => m.type === 'video');
    const documents = mediaItems.filter(m => m.type === 'pdf');
    const images = mediaItems.filter(m => m.type === 'image');

    return (
        <>
            <div className={`${styles.container} ${className}`}>
                {/* Header */}
                <div
                    className={styles.header}
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{ cursor: 'pointer' }}
                >
                    <span className={styles.title}>
                        <Video size={16} className="text-[#00e5ff]" />
                        Learning Resources
                        {calculatorTitle && (
                            <span className="text-gray-500 font-normal">
                                — {calculatorTitle}
                            </span>
                        )}
                    </span>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>

                {/* Content */}
                {isExpanded && (
                    <div className={styles.content}>
                        {mediaItems.length === 0 ? (
                            <div className={styles.empty}>
                                <Video size={32} className="mb-2 opacity-50" />
                                <span className="text-sm">No media available</span>
                                <span className="text-xs mt-1">
                                    Select a calculator to see related resources
                                </span>
                            </div>
                        ) : (
                            <>
                                {/* Videos */}
                                {videos.length > 0 && (
                                    <div className={styles.section}>
                                        <div className={styles.sectionTitle}>
                                            <Video size={14} />
                                            Videos
                                        </div>
                                        <div className={styles.grid}>
                                            {videos.map((item, i) => (
                                                <MediaCard
                                                    key={i}
                                                    item={item}
                                                    onClick={() => setSelectedMedia(item)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Documents */}
                                {documents.length > 0 && (
                                    <div className={styles.section}>
                                        <div className={styles.sectionTitle}>
                                            <FileText size={14} />
                                            Documents
                                        </div>
                                        <div className={styles.grid}>
                                            {documents.map((item, i) => (
                                                <MediaCard
                                                    key={i}
                                                    item={item}
                                                    onClick={() => setSelectedMedia(item)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Images */}
                                {images.length > 0 && (
                                    <div className={styles.section}>
                                        <div className={styles.sectionTitle}>
                                            <Image size={14} />
                                            Diagrams
                                        </div>
                                        <div className={styles.grid}>
                                            {images.map((item, i) => (
                                                <MediaCard
                                                    key={i}
                                                    item={item}
                                                    onClick={() => setSelectedMedia(item)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            <MediaModal
                item={selectedMedia}
                onClose={() => setSelectedMedia(null)}
            />
        </>
    );
};

export default MediaPanel;
