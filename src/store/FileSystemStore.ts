import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FileType = 'folder' | 'image' | 'video' | 'audio' | 'pdf' | 'spreadsheet' | 'text' | 'unknown';

export interface FileItem {
    id: string;
    parentId: string | null; // null for root
    name: string;
    type: FileType;
    content?: string; // URL for media, text content for text files
    size?: string;
    dateModified: string;
}

interface FileSystemState {
    files: FileItem[];
    currentPath: string[]; // For UI navigation history if needed
}

interface FileSystemActions {
    createFile: (file: Omit<FileItem, 'id' | 'dateModified'>) => void;
    createFolder: (parentId: string | null, name: string) => void;
    deleteItem: (id: string) => void;
    renameItem: (id: string, newName: string) => void;
    moveItem: (id: string, newParentId: string | null) => void;
    InitializeDefaultFiles: () => void;
}

const INITIAL_FILES: FileItem[] = [
    // Root Folders
    { id: 'root-1', parentId: null, name: 'My Computer', type: 'folder', dateModified: new Date().toISOString() },
    { id: 'root-2', parentId: null, name: 'Documents', type: 'folder', dateModified: new Date().toISOString() },
    { id: 'root-3', parentId: null, name: 'Media', type: 'folder', dateModified: new Date().toISOString() },
    { id: 'root-4', parentId: null, name: 'Recycle Bin', type: 'folder', dateModified: new Date().toISOString() },

    // Inside Media
    { id: 'media-1', parentId: 'root-3', name: 'Demo Video.mp4', type: 'video', content: 'https://www.w3schools.com/html/mov_bbb.mp4', size: '15 MB', dateModified: new Date().toISOString() },
    { id: 'media-2', parentId: 'root-3', name: 'Ambient.mp3', type: 'audio', content: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', size: '5 MB', dateModified: new Date().toISOString() },
    { id: 'media-3', parentId: 'root-3', name: 'Blueprint.jpg', type: 'image', content: 'https://images.unsplash.com/photo-1581094794329-cd8119696f73?q=80&w=1000&auto=format&fit=crop', size: '2 MB', dateModified: new Date().toISOString() },

    // Inside Documents
    { id: 'doc-1', parentId: 'root-2', name: 'Project Specs.pdf', type: 'pdf', content: 'https://pdfobject.com/pdf/sample.pdf', size: '1.2 MB', dateModified: new Date().toISOString() },
    { id: 'doc-2', parentId: 'root-2', name: 'Budget.xlsx', type: 'spreadsheet', content: 'dummy-sheet-data', size: '45 KB', dateModified: new Date().toISOString() },
];

export const useFileSystemStore = create<FileSystemState & FileSystemActions>()(
    persist(
        (set, get) => ({
            files: INITIAL_FILES,
            currentPath: [],

            createFile: (file) => {
                const newFile: FileItem = {
                    ...file,
                    id: `file-${Date.now()}`,
                    dateModified: new Date().toISOString()
                };
                set(state => ({ files: [...state.files, newFile] }));
            },

            createFolder: (parentId, name) => {
                const newFolder: FileItem = {
                    id: `folder-${Date.now()}`,
                    parentId,
                    name,
                    type: 'folder',
                    dateModified: new Date().toISOString()
                };
                set(state => ({ files: [...state.files, newFolder] }));
            },

            deleteItem: (id) => {
                const deleteRecursive = (itemId: string, currentFiles: FileItem[]): FileItem[] => {
                    // Find children
                    const children = currentFiles.filter(f => f.parentId === itemId);
                    let remaining = currentFiles.filter(f => f.id !== itemId);

                    children.forEach(child => {
                        remaining = deleteRecursive(child.id, remaining);
                    });

                    return remaining;
                };

                set(state => ({ files: deleteRecursive(id, state.files) }));
            },

            renameItem: (id, newName) => {
                set(state => ({
                    files: state.files.map(f => f.id === id ? { ...f, name: newName, dateModified: new Date().toISOString() } : f)
                }));
            },

            moveItem: (id, newParentId) => {
                set(state => ({
                    files: state.files.map(f => f.id === id ? { ...f, parentId: newParentId, dateModified: new Date().toISOString() } : f)
                }));
            },

            InitializeDefaultFiles: () => {
                set({ files: INITIAL_FILES });
            }
        }),
        {
            name: 'alucalc-filesystem',
            partialize: (state) => ({ files: state.files })
        }
    )
);

// Selectors
export const selectFilesByParent = (state: FileSystemState, parentId: string | null) =>
    state.files.filter(f => f.parentId === parentId);

export const selectFileById = (state: FileSystemState, id: string) =>
    state.files.find(f => f.id === id);
