import React, { useState } from 'react';
import { useFileSystemStore, FileItem, selectFilesByParent } from '@/store/FileSystemStore';
import { useOSStore } from '@/store/osStore';
import { Folder, File, Image, Video, Music, FileText, ArrowLeft, Home, Search, ChevronRight } from 'lucide-react';

const FileIcon = ({ type }: { type: FileItem['type'] }) => {
    switch (type) {
        case 'folder': return <Folder className="w-12 h-12 text-yellow-500 fill-yellow-500/20" />;
        case 'image': return <Image className="w-10 h-10 text-purple-500" />;
        case 'video': return <Video className="w-10 h-10 text-red-500" />;
        case 'audio': return <Music className="w-10 h-10 text-pink-500" />;
        case 'pdf': return <FileText className="w-10 h-10 text-red-600" />;
        case 'spreadsheet': return <FileText className="w-10 h-10 text-green-600" />; // Todo: Table icon
        case 'text': return <FileText className="w-10 h-10 text-gray-500" />;
        default: return <File className="w-10 h-10 text-gray-400" />;
    }
};

export const FileExplorerModule: React.FC = () => {
    const { files, createFolder, currentPath } = useFileSystemStore();
    const { openWindow } = useOSStore();

    // Local state for navigation (simpler than storing in global store for now)
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]); // Stack of folder IDs

    // Get files in current folder
    // Note: We use a selector logic here directly because hooks need to be stable
    const currentFiles = files.filter(f => f.parentId === currentFolderId);

    // Get current folder name
    const currentFolder = files.find(f => f.id === currentFolderId);

    const handleNavigate = (folderId: string | null) => {
        setHistory(prev => [...prev, currentFolderId || 'root']);
        setCurrentFolderId(folderId);
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
            // Open appropriate window based on file type
            switch (file.type) {
                case 'image':
                    openWindow('image-viewer');
                    break;
                case 'video':
                case 'audio':
                    openWindow('media-player');
                    break;
                case 'pdf':
                    openWindow('pdf-viewer');
                    break;
                case 'spreadsheet':
                    openWindow('spreadsheet-viewer');
                    break;
                default:
                    // Default open with text viewer or maybe just browser? 
                    // For now, let's just log
                    console.log('Opening file:', file.name);
            }
        }
    };

    // Breadcrumbs
    const getBreadcrumbs = () => {
        const crumbs = [{ id: null, name: 'This PC' }];
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

    return (
        <div className="flex flex-col h-full bg-[var(--color-os-bg)] text-[var(--color-os-text)]">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-2 border-b border-[var(--color-os-border)] bg-[var(--color-os-header)]">
                <button
                    onClick={handleBack}
                    disabled={!currentFolderId}
                    className="p-1.5 hover:bg-[var(--color-os-hover)] rounded disabled:opacity-50"
                >
                    <ArrowLeft size={18} />
                </button>
                <button
                    onClick={() => { setCurrentFolderId(null); setHistory([]); }}
                    className="p-1.5 hover:bg-[var(--color-os-hover)] rounded"
                >
                    <Home size={18} />
                </button>

                {/* Address Bar */}
                <div className="flex-1 flex items-center px-3 py-1 bg-[var(--color-os-input-bg)] border border-[var(--color-os-border)] rounded text-sm">
                    {getBreadcrumbs().map((crumb, i, arr) => (
                        <React.Fragment key={crumb.id || 'root'}>
                            <span
                                className="cursor-pointer hover:underline"
                                onClick={() => {
                                    setCurrentFolderId(crumb.id);
                                    // ideally we'd slice history here but for simplicity we reset if jumping
                                    if (crumb.id === null) setHistory([]);
                                }}
                            >
                                {crumb.name}
                            </span>
                            {i < arr.length - 1 && <ChevronRight size={14} className="mx-1 text-gray-500" />}
                        </React.Fragment>
                    ))}
                </div>

                <div className="relative">
                    <Search className="absolute left-2 top-1.5 text-gray-400" size={14} />
                    <input
                        className="pl-8 pr-3 py-1 w-48 bg-[var(--color-os-input-bg)] border border-[var(--color-os-border)] rounded text-sm outline-none focus:border-[var(--color-os-primary)]"
                        placeholder="Search"
                    />
                </div>
            </div>

            {/* Sidebar + Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-48 border-r border-[var(--color-os-border)] bg-[var(--color-os-sidebar)] p-2 hidden sm:block">
                    <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Favorites</div>
                    <div className="space-y-1">
                        <button onClick={() => setCurrentFolderId(null)} className="w-full text-left px-2 py-1.5 rounded hover:bg-[var(--color-os-hover)] text-sm flex items-center gap-2">
                            <Home size={14} /> My Computer
                        </button>
                        <button className="w-full text-left px-2 py-1.5 rounded hover:bg-[var(--color-os-hover)] text-sm flex items-center gap-2">
                            <Folder size={14} /> Documents
                        </button>
                        <button className="w-full text-left px-2 py-1.5 rounded hover:bg-[var(--color-os-hover)] text-sm flex items-center gap-2">
                            <Video size={14} /> Videos
                        </button>
                    </div>
                </div>

                {/* Main View */}
                <div className="flex-1 overflow-y-auto p-4">
                    {currentFiles.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <Folder className="w-16 h-16 mb-4 opacity-20" />
                            <p>This folder is empty</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-4">
                            {currentFiles.map(file => (
                                <div
                                    key={file.id}
                                    className="group flex flex-col items-center p-2 rounded hover:bg-[var(--color-os-hover)] cursor-pointer border border-transparent hover:border-[var(--color-os-border)] transition-colors"
                                    onDoubleClick={() => handleOpen(file)}
                                >
                                    <div className="mb-2 transition-transform group-hover:scale-105">
                                        <FileIcon type={file.type} />
                                    </div>
                                    <span className="text-xs text-center break-words w-full line-clamp-2 px-1">
                                        {file.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="h-6 border-t border-[var(--color-os-border)] bg-[var(--color-os-header)] flex items-center px-3 text-xs text-gray-400">
                <span>{currentFiles.length} items</span>
            </div>
        </div>
    );
};
