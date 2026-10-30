/**
 * AluCAD Save Status Indicator & Local PC Disk Sync Toolbar
 * 
 * Provides live feedback on Auto-Save (IndexedDB) and Local PC File System Access.
 * Features quick-save (Ctrl+S), save as (Ctrl+Shift+S), and open (Ctrl+O).
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, HardDrive, CheckCircle2, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { autoSaveManager } from '../persistence/autoSaveManager';
import { AutoSaveState } from '../persistence/types';
import { isFileSystemAccessSupported } from '../persistence/localFileSystem';

/** compact: show only the status dot and the save button below the 2xl breakpoint */
export function SaveStatusIndicator({ compact = false }: { compact?: boolean } = {}) {
    const [saveState, setSaveState] = useState<AutoSaveState>(autoSaveManager.getState());
    const [showMenu, setShowMenu] = useState(false);
    const [recoveryNotice, setRecoveryNotice] = useState<{
        timestamp: number;
        entityCount: number;
        project: any;
    } | null>(null);

    useEffect(() => {
        const unsubscribe = autoSaveManager.subscribe(setSaveState);
        return () => unsubscribe();
    }, []);

    // Check for prior auto-saved session on initial load
    useEffect(() => {
        autoSaveManager.checkForRecoverySession().then((res) => {
            if (res.hasSession && res.project && res.timestamp && res.entityCount) {
                setRecoveryNotice({
                    timestamp: res.timestamp,
                    entityCount: res.entityCount,
                    project: res.project,
                });
            }
        });
    }, []);

    // Keyboard shortcuts (Ctrl+S, Ctrl+Shift+S, Ctrl+O)
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            // Check for Ctrl/Cmd
            if (e.ctrlKey || e.metaKey) {
                // Ctrl+S or Ctrl+Shift+S
                if (e.key.toLowerCase() === 's') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        // Save As... (force file picker)
                        await autoSaveManager.saveToLocalPc(true);
                    } else {
                        // Quick Save (direct to file handle or prompt if first time)
                        await autoSaveManager.saveToLocalPc(false);
                    }
                    return;
                }

                // Ctrl+O: Open from Local PC
                if (e.key.toLowerCase() === 'o') {
                    e.preventDefault();
                    await autoSaveManager.openFromLocalPc();
                    return;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleQuickSave = async () => {
        setShowMenu(false);
        await autoSaveManager.saveToLocalPc(false);
    };

    const handleSaveAs = async () => {
        setShowMenu(false);
        await autoSaveManager.saveToLocalPc(true);
    };

    const handleOpen = async () => {
        setShowMenu(false);
        await autoSaveManager.openFromLocalPc();
    };

    const handleRestoreRecovery = () => {
        if (recoveryNotice?.project) {
            autoSaveManager.loadProjectIntoCad(recoveryNotice.project);
        }
        setRecoveryNotice(null);
    };

    const handleDismissRecovery = () => {
        autoSaveManager.discardAutoSaveSession();
        setRecoveryNotice(null);
    };

    const formatTime = (ts: number | null) => {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const isPcFile = !!saveState.activeFileName;

    return (
        <div className="relative flex items-center gap-1.5 font-mono select-none">
            {/* Auto-Save & Disk Status Pill */}
            <div
                onClick={() => setShowMenu(!showMenu)}
                className={`group flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-s)] text-[10px] font-bold border transition cursor-pointer ${
                    saveState.status === 'saving'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : saveState.status === 'saved_pc_file'
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
                        : saveState.status === 'saved_local_storage'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                        : saveState.status === 'modified_unsaved'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
                title={
                    isPcFile
                        ? `Yerel PC Dosyası: ${saveState.activeFileName}\nSon senkronizasyon: ${formatTime(saveState.lastSavedTimestamp)}`
                        : `Tarayıcı Yerel Hafızasında Otomatik Kaydedildi (IndexedDB)\nSon kayıt: ${formatTime(saveState.lastSavedTimestamp)}`
                }
            >
                {/* Live Status Indicator Dot/Icon */}
                {saveState.status === 'saving' ? (
                    <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                ) : isPcFile ? (
                    <HardDrive className="w-3 h-3 text-cyan-400" />
                ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 " />
                )}

                {/* Status Text */}
                <span className={`truncate max-w-[120px] sm:max-w-[160px] ${compact ? 'hidden 2xl:inline' : ''}`}>
                    {saveState.status === 'saving'
                        ? 'Kaydediliyor...'
                        : isPcFile
                        ? saveState.activeFileName
                        : 'Oto-Kayıt: Güvende'}
                </span>

                <span className="text-[9px] text-slate-400 opacity-60 group-hover:opacity-100">▼</span>
            </div>

            {/* Quick Action Button: Save (Ctrl+S) */}
            <button
                type="button"
                onClick={handleQuickSave}
                className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-s)] bg-slate-800/80 hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 text-[10px] font-bold transition cursor-pointer"
                title="Yerel PC'ye Kaydet (Ctrl+S)"
            >
                <Save className="w-3 h-3" />
                <span className="hidden sm:inline">Kaydet</span>
            </button>

            {/* Dropdown Menu for Save As / Open / Disk Info */}
            {showMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute top-8 left-0 z-50 w-72 p-2 rounded-[var(--radius-m)] bg-[var(--bg-1)]/98 border border-[var(--line)] shadow-2xl text-white font-mono text-[11px] animate-in fade-in duration-100">
                        <div className="px-2 py-1.5 mb-1.5 border-b border-[var(--line)]">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--alu)]">
                                Çizim Kayıt & Güvenlik Durumu
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                                {isPcFile ? (
                                    <span className="text-cyan-300 font-semibold">📁 Yerel PC: {saveState.activeFileName}</span>
                                ) : (
                                    <span className="text-emerald-400 font-semibold">🛡️ Tarayıcı Güvenli Belleğinde (Kayıp Olmaz)</span>
                                )}
                            </div>
                            {saveState.lastSavedTimestamp && (
                                <div className="text-[9px] text-slate-500 mt-0.5">
                                    Son Kayıt: {formatTime(saveState.lastSavedTimestamp)}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <button
                                type="button"
                                onClick={handleQuickSave}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-slate-800 text-left transition cursor-pointer"
                            >
                                <span className="flex items-center gap-2">
                                    <Save className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>Kaydet</span>
                                </span>
                                <kbd className="text-[9px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400">Ctrl+S</kbd>
                            </button>

                            <button
                                type="button"
                                onClick={handleSaveAs}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-slate-800 text-left transition cursor-pointer"
                            >
                                <span className="flex items-center gap-2">
                                    <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Farklı Kaydet (Yerel PC)...</span>
                                </span>
                                <kbd className="text-[9px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400">Ctrl+Shift+S</kbd>
                            </button>

                            <button
                                type="button"
                                onClick={handleOpen}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-slate-800 text-left transition cursor-pointer"
                            >
                                <span className="flex items-center gap-2">
                                    <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Yerel PC'den Dosya Aç...</span>
                                </span>
                                <kbd className="text-[9px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400">Ctrl+O</kbd>
                            </button>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-[var(--line)] text-[9px] text-slate-500 px-1">
                            {isFileSystemAccessSupported() ? (
                                <span>⚡ Yerel Dosya Sistemi API'si aktif: Seçtiğiniz klasöre doğrudan yazar.</span>
                            ) : (
                                <span>📥 İndirme yöntemi ile yerel diske aktarılır.</span>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Crash / Previous Session Recovery Banner */}
            {recoveryNotice && (
                <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-[var(--radius-m)] bg-[var(--bg-2)]/95 border border-cyan-400/80 shadow-[0_10px_35px_rgba(0,229,255,0.25)] text-white font-mono text-xs animate-in slide-in-from-top-4 duration-200">
                    <div className="flex items-center gap-2">
                        <span className="text-base">🔄</span>
                        <div>
                            <span className="font-bold text-cyan-300">Önceki oturumunuz bulundu: </span>
                            <span className="text-slate-300">{recoveryNotice.entityCount} nesne ({formatTime(recoveryNotice.timestamp)})</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 ml-2">
                        <button
                            type="button"
                            onClick={handleRestoreRecovery}
                            className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] transition cursor-pointer shadow-sm"
                        >
                            Geri Yükle
                        </button>
                        <button
                            type="button"
                            onClick={handleDismissRecovery}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-[10px] transition cursor-pointer"
                        >
                            Yeni Başlat
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
