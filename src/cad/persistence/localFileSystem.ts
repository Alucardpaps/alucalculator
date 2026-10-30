/**
 * AluCAD Local PC File System Access API Interface
 * 
 * Enables direct read/write access to user-selected folders and files on local PC.
 * Caches active FileSystemFileHandle for instant Ctrl+S disk synchronizations.
 */

import { AluCadProjectFile, ALUCAD_FILE_EXTENSION, isValidAluCadProject } from './types';

// In-memory reference to the currently open file handle on the user's PC
let currentFileHandle: FileSystemFileHandle | null = null;
let currentFileName: string | null = null;

export function getCurrentFileHandle(): FileSystemFileHandle | null {
    return currentFileHandle;
}

export function getCurrentFileName(): string | null {
    return currentFileName;
}

export function setCurrentFileHandle(handle: FileSystemFileHandle | null, name?: string | null): void {
    currentFileHandle = handle;
    currentFileName = name || (handle ? handle.name : null);
}

/**
 * Checks if browser supports the native File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
    return typeof window !== 'undefined' && 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
}

/**
 * Saves project to local PC using File System Access API.
 * If handle is provided, writes directly without showing dialog.
 * If handle is omitted or forcePrompt is true, opens native folder/file picker.
 */
export async function saveProjectToLocalPc(
    project: AluCadProjectFile,
    options: {
        handle?: FileSystemFileHandle | null;
        forcePrompt?: boolean;
        suggestedName?: string;
    } = {}
): Promise<{ success: boolean; handle?: FileSystemFileHandle; filename: string }> {
    const jsonString = JSON.stringify(project, null, 2);
    const filename = options.suggestedName || project.metadata.name || 'cizim';
    const cleanFilename = filename.endsWith(ALUCAD_FILE_EXTENSION) 
        ? filename 
        : `${filename}${ALUCAD_FILE_EXTENSION}`;

    // 1. Try writing to existing file handle (Quick Save Ctrl+S)
    const targetHandle = options.forcePrompt ? null : (options.handle || currentFileHandle);

    if (targetHandle && isFileSystemAccessSupported()) {
        try {
            const writable = await (targetHandle as any).createWritable();
            await writable.write(jsonString);
            await writable.close();
            setCurrentFileHandle(targetHandle, targetHandle.name);
            return { success: true, handle: targetHandle, filename: targetHandle.name };
        } catch (err) {
            console.warn('Direct file handle write failed, falling back to file picker:', err);
        }
    }

    // 2. Open native Save File Picker (Save As Ctrl+Shift+S)
    if (isFileSystemAccessSupported()) {
        try {
            const pickerOpts = {
                suggestedName: cleanFilename,
                types: [
                    {
                        description: 'AluCAD Industrial Drawing Project (*.alucad)',
                        accept: {
                            'application/json': ['.alucad', '.json'],
                        },
                    },
                ],
            };

            const newHandle = await (window as any).showSaveFilePicker(pickerOpts);
            const writable = await newHandle.createWritable();
            await writable.write(jsonString);
            await writable.close();

            setCurrentFileHandle(newHandle, newHandle.name);
            return { success: true, handle: newHandle, filename: newHandle.name };
        } catch (err: any) {
            // User cancelled file picker
            if (err?.name === 'AbortError') {
                return { success: false, filename: cleanFilename };
            }
            console.warn('Native SaveFilePicker error, falling back to download:', err);
        }
    }

    // 3. Fallback: Browser file download for non-Chromium or mobile browsers
    if (typeof document !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = cleanFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    setCurrentFileHandle(null, cleanFilename);
    return { success: true, filename: cleanFilename };
}

/**
 * Opens and loads an .alucad or .json project file from the user's local PC.
 */
export async function openProjectFromLocalPc(): Promise<{
    project: AluCadProjectFile;
    handle?: FileSystemFileHandle;
    filename: string;
} | null> {
    // 1. Native File System Access Picker
    if (isFileSystemAccessSupported()) {
        try {
            const pickerOpts = {
                types: [
                    {
                        description: 'AluCAD Industrial Projects (*.alucad, *.json)',
                        accept: {
                            'application/json': ['.alucad', '.json'],
                        },
                    },
                ],
                multiple: false,
            };

            const [fileHandle] = await (window as any).showOpenFilePicker(pickerOpts);
            const file = await fileHandle.getFile();
            const text = await file.text();
            const parsed = JSON.parse(text);

            if (isValidAluCadProject(parsed)) {
                setCurrentFileHandle(fileHandle, file.name);
                return { project: parsed, handle: fileHandle, filename: file.name };
            }

            // Legacy array or entities-only fallback
            const rawEntities = Array.isArray(parsed) ? parsed : parsed.entities;
            if (Array.isArray(rawEntities)) {
                const converted: AluCadProjectFile = {
                    fileType: 'ALUCAD_PROJECT',
                    schemaVersion: 1,
                    appName: 'AluCAD OS',
                    id: `proj_${Date.now()}`,
                    metadata: {
                        id: `proj_${Date.now()}`,
                        name: file.name.replace(/\.[^/.]+$/, ''),
                        createdAt: Date.now(),
                        modifiedAt: Date.now(),
                        units: 'mm',
                        entityCount: rawEntities.length,
                        bodyCount: 1,
                        appVersion: '5.2.0',
                    },
                    cad2d: {
                        entities: rawEntities,
                        layers: parsed.layers || [],
                        bodies: parsed.bodies || [],
                        constraints: parsed.constraints || [],
                        units: parsed.units || 'mm',
                    },
                };
                setCurrentFileHandle(fileHandle, file.name);
                return { project: converted, handle: fileHandle, filename: file.name };
            }

            throw new Error('Dosya geçerli bir AluCAD proje formatında değil.');
        } catch (err: any) {
            if (err?.name === 'AbortError') return null;
            console.warn('Native OpenFilePicker error, falling back to input:', err);
        }
    }

    // 2. Fallback: Hidden file input
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.alucad,.json';
        input.onchange = async (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
                resolve(null);
                return;
            }

            try {
                const text = await file.text();
                const parsed = JSON.parse(text);

                if (isValidAluCadProject(parsed)) {
                    setCurrentFileHandle(null, file.name);
                    resolve({ project: parsed, filename: file.name });
                    return;
                }

                const rawEntities = Array.isArray(parsed) ? parsed : parsed.entities;
                if (Array.isArray(rawEntities)) {
                    const converted: AluCadProjectFile = {
                        fileType: 'ALUCAD_PROJECT',
                        schemaVersion: 1,
                        appName: 'AluCAD OS',
                        id: `proj_${Date.now()}`,
                        metadata: {
                            id: `proj_${Date.now()}`,
                            name: file.name.replace(/\.[^/.]+$/, ''),
                            createdAt: Date.now(),
                            modifiedAt: Date.now(),
                            units: 'mm',
                            entityCount: rawEntities.length,
                            bodyCount: 1,
                            appVersion: '5.2.0',
                        },
                        cad2d: {
                            entities: rawEntities,
                            layers: parsed.layers || [],
                            bodies: parsed.bodies || [],
                            constraints: parsed.constraints || [],
                            units: parsed.units || 'mm',
                        },
                    };
                    setCurrentFileHandle(null, file.name);
                    resolve({ project: converted, filename: file.name });
                    return;
                }

                reject(new Error('Desteklenmeyen dosya yapısı.'));
            } catch (err) {
                reject(err);
            }
        };
        input.click();
    });
}
