'use client';

/**
 * AluCalc OS — Media Node
 * 
 * ReactFlow node for displaying educational media:
 * - YouTube embeds
 * - Music embeds (Spotify, SoundCloud, Apple Music, Deezer)
 * - PDF previews
 * - Images
 */

import React, { memo } from 'react';
import { NodeProps, NodeToolbar, Position } from 'reactflow';
import { X, ExternalLink, Play, FileText, Image, Music, FileSpreadsheet, Presentation, File, Settings, Link, FolderOpen, Check } from 'lucide-react';
import { useState } from 'react';
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
    music: Music,
    excel: FileSpreadsheet,
    word: FileText,
    powerpoint: Presentation,
};

// ============================================
// Helper: Get Embed URL
// ============================================

const getMusicEmbedUrl = (url: string): string | null => {
    try {
        const u = new URL(url);

        // Spotify
        if (u.hostname.includes('spotify.com')) {
            if (u.pathname.includes('/embed')) return url;
            return url.replace('open.spotify.com', 'open.spotify.com/embed');
        }

        // SoundCloud
        if (u.hostname.includes('soundcloud.com')) {
            // SoundCloud requires a special widget URL structure
            // We use the visual player widget
            return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%2300e5ff&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
        }

        // Apple Music
        if (u.hostname.includes('music.apple.com')) {
            return url.replace('music.apple.com', 'embed.music.apple.com');
        }

        // Deezer
        if (u.hostname.includes('deezer.com')) {
            // Basic replacement, might need more specific ID parsing
            // Deezer generally uses widget.deezer.com/widget/dark/playlist/...
            // But let's try generic replacement or assume user might paste widget link?
            // Actually, Deezer provides distinct widget codes. 
            // Let's try to convert simple album/track links.
            // https://www.deezer.com/en/album/123 -> https://widget.deezer.com/widget/dark/album/123
            const parts = u.pathname.split('/').filter(p => p);
            const type = parts.find(p => ['album', 'track', 'playlist', 'artist'].includes(p));
            const id = parts[parts.length - 1]; // Assume ID is last

            if (type && id) {
                return `https://widget.deezer.com/widget/dark/${type}/${id}`;
            }
        }

        // YouTube Music (treat as YouTube embed)
        if (u.hostname.includes('music.youtube.com') || u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
            const v = u.searchParams.get('v');
            const list = u.searchParams.get('list');

            if (list) {
                return `https://www.youtube.com/embed/videoseries?list=${list}`;
            }
            if (v) {
                return `https://www.youtube.com/embed/${v}`;
            }
            // Short URL
            if (u.hostname.includes('youtu.be')) {
                const id = u.pathname.substring(1);
                return `https://www.youtube.com/embed/${id}`;
            }
        }

        return url; // Return original as fallback
    } catch (e) {
        return null;
    }
};

// ============================================
// Main Component
// ============================================

const MediaNode: React.FC<NodeProps<MediaNodeData>> = ({
    id,
    data,
    selected
}) => {
    const { removeNode, updateNodeData } = useFlowStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editUrl, setEditUrl] = useState(data.url);
    const [editPath, setEditPath] = useState(data.filePath || '');
    const [editTitle, setEditTitle] = useState(data.title || '');

    const handleSave = () => {
        updateNodeData(id, {
            url: editUrl,
            filePath: editPath,
            title: editTitle
        });
        setIsEditing(false);
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        removeNode(id);
    };

    const Icon = mediaIcons[data.mediaType] || File;

    return (
        <>
            <NodeToolbar isVisible={selected} position={Position.Top} className="flex flex-col gap-2 bg-[#1a2332] p-2 rounded-lg border border-[#2a3a4a] shadow-xl min-w-[250px]">
                <div className="flex items-center justify-between border-b border-[#2a3a4a] pb-1 mb-1">
                    <span className="text-xs font-bold text-gray-400 uppercase">Settings</span>
                    <button onClick={() => setIsEditing(!isEditing)} className={`p-1 rounded ${isEditing ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/10 text-gray-400'}`}>
                        {isEditing ? <Check size={14} onClick={handleSave} /> : <Settings size={14} />}
                    </button>
                    <button onClick={() => removeNode(id)} className="p-1 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded ml-1">
                        <X size={14} />
                    </button>
                </div>

                {isEditing && (
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-gray-500 uppercase">Title</label>
                            <input
                                className="bg-[#0f1419] border border-[#2a3a4a] rounded px-2 py-1 text-xs text-white focus:border-[#00e5ff] outline-none"
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                placeholder="Title..."
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-gray-500 uppercase flex items-center gap-1"><Link size={10} /> URL</label>
                            <input
                                className="bg-[#0f1419] border border-[#2a3a4a] rounded px-2 py-1 text-xs text-white focus:border-[#00e5ff] outline-none"
                                value={editUrl}
                                onChange={e => setEditUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-gray-500 uppercase flex items-center gap-1"><FolderOpen size={10} /> File Path</label>
                            <input
                                className="bg-[#0f1419] border border-[#2a3a4a] rounded px-2 py-1 text-xs text-white focus:border-[#00e5ff] outline-none"
                                value={editPath}
                                onChange={e => setEditPath(e.target.value)}
                                placeholder="C:\Projects\..."
                            />
                        </div>
                        <button onClick={handleSave} className="bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 text-[#00e5ff] py-1 rounded text-xs font-bold mt-1">
                            Save Changes
                        </button>
                    </div>
                )}
            </NodeToolbar>

            <div className={`${styles.node} ${selected ? styles.nodeSelected : ''}`}>
                {/* Header used to be here, but using NodeToolbar instead to save space, or keep it? 
                   The original code had a header. I should preserve the node structure but wrap the content. 
               */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <Icon size={14} className="text-[#00e5ff]" />
                        {data.title || (data.mediaType === 'music' ? 'MUSIC PLAYER' : data.mediaType.toUpperCase())}
                    </div>
                    {/* Removed close button from header as it's in toolbar now, or keep both? Keep for consistency? */}
                </div>

                <div className={styles.body}>
                    {renderMedia()}
                </div>
            </div>
        </>
    );

    function renderMedia() {
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

            case 'music':
                const embedUrl = getMusicEmbedUrl(data.url);
                if (!embedUrl) return <div className="p-4 text-red-400 text-xs">Invalid URL</div>;

                return (
                    <div className="w-full bg-[#1a2332] rounded overflow-hidden">
                        <iframe
                            src={embedUrl}
                            width="100%"
                            height={embedUrl.includes('soundcloud') ? '300' : '352'}
                            frameBorder="0"
                            allowFullScreen
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            style={{ borderRadius: '12px' }}
                        />
                    </div>
                );

            case 'excel':
            case 'word':
            case 'powerpoint':
                const isExcel = data.mediaType === 'excel';
                const isPpt = data.mediaType === 'powerpoint';
                const bgColor = isExcel ? 'bg-emerald-900/20' : isPpt ? 'bg-orange-900/20' : 'bg-blue-900/20';
                const borderColor = isExcel ? 'border-emerald-900/50' : isPpt ? 'border-orange-900/50' : 'border-blue-900/50';
                const textColor = isExcel ? 'text-emerald-400' : isPpt ? 'text-orange-400' : 'text-blue-400';
                const IconComp = isExcel ? FileSpreadsheet : isPpt ? Presentation : FileText;

                return (
                    <div className={`aspect-[4/3] rounded flex flex-col items-center justify-center border border-dashed ${bgColor} ${borderColor} p-4`}>
                        <IconComp size={48} className={`mb-3 ${textColor}`} />
                        <span className={`text-xs font-bold uppercase tracking-wider mb-2 ${textColor}`}>{data.mediaType}</span>

                        <div className="text-center w-full mb-3">
                            <div className="text-sm text-white font-medium truncate w-full" title={data.title || data.url}>
                                {data.title || 'Untitled File'}
                            </div>
                            {data.filePath && (
                                <div className="text-[10px] text-gray-500 truncate w-full mt-1 font-mono opacity-60" title={data.filePath}>
                                    {data.filePath}
                                </div>
                            )}
                        </div>

                        <a
                            href={data.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-3 py-1.5 rounded text-xs font-medium bg-[#0f1419] border border-[#2a3a4a] hover:bg-[#2a3a4a] transition-colors flex items-center gap-2 ${textColor}`}
                            onClick={(e) => {
                                if (data.filePath && !data.url) {
                                    e.preventDefault();
                                    // In a real desktop app, this would open the file.
                                    // Here we just show the path.
                                    alert(`File Path: ${data.filePath}`);
                                }
                            }}
                        >
                            {data.filePath ? 'View Info' : 'Download'} <ExternalLink size={10} />
                        </a>
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
                    {Icon && <Icon size={14} />}
                    {data.title || (data.mediaType === 'music' ? 'MUSIC PLAYER' : data.mediaType.toUpperCase())}
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
