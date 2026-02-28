'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFileSystemStore, FileItem } from '@/store/FileSystemStore';
import { useOSStore } from '@/store/osStore';
import { Folder, File, Image as ImageIcon, Video, Music, FileText, ArrowLeft, Home, Search, ChevronRight, Table, MoreVertical, Plus, Trash2, Edit2, LayoutGrid, List, Clock, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FileIcon = ({ type, className = "w-10 h-10" }: { type: FileItem['type'], className?: string }) => {
    switch (type) {
        case 'folder': return <Folder className={`${className} text-yellow-500 fill-yellow-500/20`} />;
        case 'image': return <ImageIcon className={`${className} text-purple-500`} />;
        case 'video': return <Video className={`${className} text-red-500`} />;
        case 'audio': return <Music className={`${className} text-pink-500`} />;
        case 'pdf': return <FileText className={`${className} text-red-600`} />;
        case 'spreadsheet': return <Table className={`${className} text-green-600`} />;
        case 'text': return <FileText className={`${className} text-gray-500`} />;
        default: return <File className={`${className} text-gray-400`} />;
    }
};

export default function FileExplorerModule() {
    const { files, createFolder, deleteItem, renameItem } = useFileSystemStore();
    const { openWindow } = useOSStore();

    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');

    // Context Menu & Actions
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, file: FileItem | null } | null>(null);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameInput, setRenameInput] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    // Derived State
    const currentFiles = files.filter(f => f.parentId === currentFolderId && f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Close context menu on outside click
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleNavigate = (folderId: string | null) => {
        setHistory(prev => [...prev, currentFolderId || 'root']);
        setCurrentFolderId(folderId);
        setSearchQuery('');
    };

    const handleBack = () => {
        if (history.length === 0) return;
        const newHistory = [...history];
        const prevId = newHistory.pop();
        setHistory(newHistory);
        setCurrentFolderId(prevId === 'root' ? null : prevId || null);
    };

    const handleOpen = (file: FileItem) => {
        if (file.type === 'folder') {
            handleNavigate(file.id);
        } else {
            switch (file.type) {
                case 'image': openWindow('image-viewer'); break;
                case 'video':
                case 'audio': openWindow('media-player'); break;
                case 'pdf': openWindow('pdf-viewer'); break;
                case 'spreadsheet': openWindow('spreadsheet-viewer'); break;
                default: console.log('Opening file:', file.name);
            }
        }
    };

    const getBreadcrumbs = () => {
        const crumbs = [{ id: null as string | null, name: 'This PC' }];
        let tempId = currentFolderId;
        const path = [];
        while (tempId) {
            const folder = files.find(f => f.id === tempId);
            if (folder) {
                path.unshift({ id: folder.id, name: folder.name });
                tempId = folder.parentId;
            } else {
                break;
            }
        }
        return [...crumbs, ...path];
    };

    // --- ACTIONS ---
    const handleContextMenu = (e: React.MouseEvent, file: FileItem | null) => {
        e.preventDefault();
        e.stopPropagation();

        let x = e.clientX;
        let y = e.clientY;

        // Ensure menu doesn't go off-screen
        if (window.innerWidth - x < 150) x -= 150;
        if (window.innerHeight - y < 150) y -= 150;

        setContextMenu({ x, y, file });
    };

    const submitRename = (id: string) => {
        if (renameInput.trim()) {
            renameItem(id, renameInput.trim());
        }
        setRenamingId(null);
        setRenameInput('');
    };

    const submitNewFolder = () => {
        if (renameInput.trim()) {
            createFolder(currentFolderId, renameInput.trim());
        }
        setIsCreatingFolder(false);
        setRenameInput('');
    };

    // Format Date
    const formatDate = (isoString?: string) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <div
            className="flex flex-col h-full bg-[#0a0a0a] text-slate-200 select-none relative"
            onContextMenu={(e) => handleContextMenu(e, null)}
            onClick={() => {
                if (renamingId) submitRename(renamingId);
                if (isCreatingFolder) submitNewFolder();
            }}
        >
            {/* TOOLBAR */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-[#121212]">
                <div className="flex gap-1 mr-2">
                    <button onClick={handleBack} disabled={!currentFolderId} className="p-1.5 hover:bg-white/10 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent">
                        <ArrowLeft size={16} />
                    </button>
                    <button onClick={() => { setCurrentFolderId(null); setHistory([]); }} className="p-1.5 hover:bg-white/10 rounded-md transition-colors">
                        <Home size={16} />
                    </button>
                </div>

                {/* Breadcrumbs */}
                <div className="flex-1 flex items-center px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs hover:border-white/20 transition-colors cursor-text max-w-xl overflow-hidden">
                    {getBreadcrumbs().map((crumb, i, arr) => (
                        <React.Fragment key={crumb.id || 'root'}>
                            <span
                                className="cursor-pointer hover:text-white text-slate-400 transition-colors whitespace-nowrap"
                                onClick={() => {
                                    setCurrentFolderId(crumb.id);
                                    if (crumb.id === null) setHistory([]);
                                }}
                            >
                                {crumb.name}
                            </span>
                            {i < arr.length - 1 && <ChevronRight size={12} className="mx-1 text-slate-600 flex-shrink-0" />}
                        </React.Fragment>
                    ))}
                </div>

                <div className="relative ml-2">
                    <Search className="absolute left-2.5 top-2 text-slate-500" size={14} />
                    <input
                        className="pl-8 pr-3 py-1.5 w-48 bg-black/50 border border-white/10 rounded-lg text-xs outline-none focus:border-cyan-500/50 focus:bg-white/5 transition-all text-white placeholder-slate-600"
                        placeholder="Search current folder"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-1 ml-2 border-l border-white/10 pl-2">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}>
                        <LayoutGrid size={16} />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}>
                        <List size={16} />
                    </button>
                </div>
            </div>

            {/* SIDEBAR + MAIN */}
            <div className="flex flex-1 overflow-hidden" ref={containerRef}>
                {/* Sidebar */}
                <div className="w-48 border-r border-white/5 bg-[#0d0d0d] p-3 hidden md:flex md:flex-col gap-4">
                    <div>
                        <div className="text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-widest px-2">Quick Access</div>
                        <div className="space-y-0.5">
                            <button onClick={() => { setCurrentFolderId(null); setHistory([]); }} className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-2.5 transition-colors ${currentFolderId === null ? 'bg-cyan-500/10 text-cyan-400 font-medium' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'}`}>
                                <Home size={14} className={currentFolderId === null ? 'text-cyan-400' : ''} /> This PC
                            </button>
                            <button onClick={() => handleNavigate(files.find(f => f.name === 'Documents' && f.parentId === null)?.id || null)} className="w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-2.5 hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors">
                                <Folder size={14} /> Documents
                            </button>
                            <button onClick={() => handleNavigate(files.find(f => f.name === 'Media' && f.parentId === null)?.id || null)} className="w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-2.5 hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors">
                                <Video size={14} /> Media
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#050505]" onClick={() => setContextMenu(null)}>

                    {/* List Headers */}
                    {viewMode === 'list' && currentFiles.length > 0 && (
                        <div className="grid grid-cols-[auto_1fr_120px_120px] gap-4 px-3 mb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b border-white/5 pb-2">
                            <div className="w-6"></div>
                            <div>Name</div>
                            <div>Date Modified</div>
                            <div>Size</div>
                        </div>
                    )}

                    {currentFiles.length === 0 && !isCreatingFolder ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600">
                            <Folder className="w-16 h-16 mb-4 opacity-10" />
                            <p className="text-sm">This folder is empty</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsCreatingFolder(true); setRenameInput('New Folder'); }}
                                className="mt-4 px-4 py-1.5 border border-white/10 rounded-lg text-xs hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <Plus size={14} /> Create Folder
                            </button>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? "grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3" : "flex flex-col gap-1"}>

                            {/* NEW FOLDER INLINE INPUT */}
                            {isCreatingFolder && (
                                <div className={viewMode === 'grid' ? "flex flex-col items-center p-3 rounded-lg bg-white/5 border border-cyan-500/30" : "flex items-center gap-3 p-1.5 rounded-lg bg-white/5 border border-cyan-500/30"}>
                                    <FileIcon type="folder" className={viewMode === 'grid' ? "w-10 h-10 mb-2" : "w-6 h-6"} />
                                    <input
                                        autoFocus
                                        value={renameInput}
                                        onChange={e => setRenameInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') submitNewFolder();
                                            if (e.key === 'Escape') setIsCreatingFolder(false);
                                        }}
                                        onClick={e => e.stopPropagation()}
                                        onBlur={submitNewFolder}
                                        className="w-full bg-black/50 border border-cyan-500/50 rounded px-1.5 py-0.5 text-xs text-white text-center outline-none"
                                    />
                                </div>
                            )}

                            {/* FILE LIST */}
                            {currentFiles.map(file => (
                                <div
                                    key={file.id}
                                    className={`group cursor-pointer border transition-colors relative
                                        ${viewMode === 'grid'
                                            ? 'flex flex-col items-center p-3 rounded-xl border-transparent hover:bg-white/[0.03] hover:border-white/10'
                                            : 'grid grid-cols-[auto_1fr_120px_120px] gap-4 items-center p-1.5 rounded-lg border-transparent hover:bg-white/[0.03] hover:border-white/10'}`}
                                    onDoubleClick={() => handleOpen(file)}
                                    onContextMenu={(e) => handleContextMenu(e, file)}
                                >
                                    {/* Icon */}
                                    <div className={`${viewMode === 'grid' ? 'mb-2 transition-transform group-hover:scale-105 group-hover:-translate-y-1' : ''}`}>
                                        <FileIcon type={file.type} className={viewMode === 'list' ? "w-6 h-6" : undefined} />
                                    </div>

                                    {/* Name / Rename Input */}
                                    {renamingId === file.id ? (
                                        <input
                                            autoFocus
                                            value={renameInput}
                                            onChange={e => setRenameInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') submitRename(file.id);
                                                if (e.key === 'Escape') setRenamingId(null);
                                            }}
                                            onClick={e => e.stopPropagation()}
                                            // onBlur handles click outside
                                            className={`bg-black/80 border border-cyan-500/50 rounded px-1.5 py-0.5 text-xs text-white outline-none z-10 w-full ${viewMode === 'grid' ? 'text-center' : ''}`}
                                        />
                                    ) : (
                                        <span className={`text-xs text-slate-300 w-full px-1 ${viewMode === 'grid' ? 'text-center line-clamp-2' : 'truncate'}`}>
                                            {file.name}
                                        </span>
                                    )}

                                    {/* List Info columns */}
                                    {viewMode === 'list' && (
                                        <>
                                            <div className="text-[11px] text-slate-500 font-mono truncate">{formatDate(file.dateModified)}</div>
                                            <div className="text-[11px] text-slate-500 font-mono truncate">{file.size || '--'}</div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* STATUS BAR */}
            <div className="h-7 border-t border-white/5 bg-[#0a0a0a] flex items-center justify-between px-4 text-[10px] text-slate-500 font-mono">
                <span className="flex items-center gap-2">
                    <HardDrive size={12} className="text-slate-600" />
                    {currentFiles.length} item{currentFiles.length !== 1 ? 's' : ''}
                </span>
                <span>Right-click for options</span>
            </div>

            {/* CONTEXT MENU */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="fixed z-50 bg-[#121212]/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl py-1 w-48 overflow-hidden"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                        onClick={e => e.stopPropagation()}
                    >
                        {contextMenu.file ? (
                            <>
                                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 mb-1 truncate">
                                    {contextMenu.file.name}
                                </div>
                                <button className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-400 flex items-center gap-2 transition-colors"
                                    onClick={() => { handleOpen(contextMenu.file!); setContextMenu(null); }}
                                >
                                    <ArrowLeft size={14} className="rotate-[135deg]" /> Open
                                </button>
                                <button className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 flex items-center gap-2 transition-colors"
                                    onClick={() => { setRenamingId(contextMenu.file!.id); setRenameInput(contextMenu.file!.name); setContextMenu(null); }}
                                >
                                    <Edit2 size={14} /> Rename
                                </button>
                                <div className="h-px bg-white/5 my-1" />
                                <button className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 flex items-center gap-2 transition-colors"
                                    onClick={() => { deleteItem(contextMenu.file!.id); setContextMenu(null); }}
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/10 flex items-center gap-2 transition-colors"
                                    onClick={() => { setIsCreatingFolder(true); setRenameInput('New Folder'); setContextMenu(null); }}
                                >
                                    <Folder size={14} className="text-yellow-500" /> New Folder
                                </button>
                                <div className="h-px bg-white/5 my-1" />
                                <button className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/10 flex items-center gap-2 transition-colors"
                                    onClick={() => { setViewMode(viewMode === 'grid' ? 'list' : 'grid'); setContextMenu(null); }}
                                >
                                    {viewMode === 'grid' ? <List size={14} /> : <LayoutGrid size={14} />}
                                    View as {viewMode === 'grid' ? 'List' : 'Grid'}
                                </button>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
