'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, Trash2, Calendar, Clock, AlertTriangle, FileAudio } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import type { FieldToolsStrings } from '@/locales/fieldToolsTranslations';
import { formatFieldToolsTemplate } from '@/locales/fieldToolsTranslations';

interface VoiceMemo {
    id: string;
    title: string;
    date: string;
    duration: number; // in seconds
    audioData: string; // base64 string
}

export function VoiceMemoModule({ ft }: { ft: FieldToolsStrings }) {
    const [memos, setMemos] = useState<VoiceMemo[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [playingMemoId, setPlayingMemoId] = useState<string | null>(null);
    const [playbackState, setPlaybackState] = useState<'playing' | 'paused' | 'stopped'>('stopped');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    // Load memos on mount
    useEffect(() => {
        const saved = localStorage.getItem('alucalc_voice_memos');
        if (saved) {
            try {
                setMemos(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load voice memos:', e);
            }
        }

        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
            }
        };
    }, []);

    // Save memos to storage
    const saveMemos = (newMemos: VoiceMemo[]) => {
        setMemos(newMemos);
        localStorage.setItem('alucalc_voice_memos', JSON.stringify(newMemos));
    };

    // Format time (seconds to mm:ss)
    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Start recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunksRef.current = [];
            
            // Check MIME type support
            let options = { mimeType: 'audio/webm' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: 'audio/ogg' };
            }
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: '' }; // fallback to default
            }

            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                
                // Convert to base64
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result as string;
                    
                    const newMemo: VoiceMemo = {
                        id: Math.random().toString(36).substring(2, 9),
                        title: formatFieldToolsTemplate(ft.fieldMemoTitle, { n: memos.length + 1 }),
                        date: new Date().toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        }),
                        duration: recordingTime,
                        audioData: base64Audio
                    };
                    
                    saveMemos([newMemo, ...memos]);
                    setRecordingTime(0);
                };

                // Stop all tracks on the stream
                stream.getTracks().forEach(track => track.stop());
            };

            // Haptic indicator
            if ('vibrate' in navigator) navigator.vibrate(100);

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 180) { // Limit to 3 mins
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (error) {
            console.error('Microphone access failed:', error);
            alert(ft.micPermissionDenied);
        }
    };

    // Stop recording
    const stopRecording = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
        
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        mediaRecorderRef.current.stop();
        setIsRecording(false);
        if ('vibrate' in navigator) navigator.vibrate(150);
    };

    // Playback control
    const handlePlayMemo = (memo: VoiceMemo) => {
        if (playingMemoId === memo.id) {
            if (playbackState === 'playing') {
                audioPlayerRef.current?.pause();
                setPlaybackState('paused');
            } else {
                audioPlayerRef.current?.play();
                setPlaybackState('playing');
            }
        } else {
            // Stop current player
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
            }

            const audio = new Audio(memo.audioData);
            audioPlayerRef.current = audio;
            setPlayingMemoId(memo.id);
            setPlaybackState('playing');

            audio.play();

            audio.onended = () => {
                setPlayingMemoId(null);
                setPlaybackState('stopped');
            };
        }
    };

    // Delete Memo
    const handleDeleteMemo = (id: string) => {
        if (playingMemoId === id && audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            setPlayingMemoId(null);
            setPlaybackState('stopped');
        }
        const filtered = memos.filter(x => x.id !== id);
        saveMemos(filtered);
    };

    // Rename Memo title
    const handleRenameMemo = (id: string, newTitle: string) => {
        if (!newTitle.trim()) return;
        const updated = memos.map(x => x.id === id ? { ...x, title: newTitle } : x);
        saveMemos(updated);
    };

    return (
        <div className="space-y-6">
            {/* Recorder console panel */}
            <div className="p-5 bg-slate-950/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center space-y-4">
                <div className="flex flex-col items-center space-y-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">{ft.voiceRecorder}</span>
                    <span className="text-xl font-mono font-bold text-white">
                        {isRecording ? formatTime(recordingTime) : '00:00'}
                    </span>
                    {isRecording && (
                        <span className="text-[9px] text-red-400 font-mono flex items-center gap-1.5 animate-pulse">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            {ft.recordingLive}
                        </span>
                    )}
                </div>

                {/* Recorder Control Buttons */}
                <div className="flex items-center justify-center gap-6">
                    {isRecording ? (
                        <button
                            onClick={stopRecording}
                            className="w-14 h-14 rounded-full bg-red-500 text-black flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:bg-red-400 transition-all active:scale-95 cursor-pointer"
                        >
                            <Square size={20} className="fill-black" />
                        </button>
                    ) : (
                        <button
                            onClick={startRecording}
                            className="w-14 h-14 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:bg-cyan-400 transition-all active:scale-95 cursor-pointer"
                        >
                            <Mic size={22} className="fill-black" />
                        </button>
                    )}
                </div>
            </div>

            {/* List of Voice Memos */}
            <div className="space-y-3">
                <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{ft.storedVoiceMemos}</h4>
                
                {memos.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-white/5 rounded-2xl text-slate-600 text-xs">
                        {ft.noFieldRecordings}
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {memos.map(memo => (
                            <div 
                                key={memo.id}
                                className="p-3 bg-slate-950/20 border border-white/5 rounded-xl flex items-center justify-between transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <button
                                        onClick={() => handlePlayMemo(memo)}
                                        className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${playingMemoId === memo.id && playbackState === 'playing' ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400' : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'}`}
                                    >
                                        {playingMemoId === memo.id && playbackState === 'playing' ? (
                                            <Pause size={14} className="fill-cyan-400" />
                                        ) : (
                                            <Play size={14} className="fill-slate-400 ml-0.5" />
                                        )}
                                    </button>
                                    
                                    <div className="flex flex-col truncate">
                                        <input
                                            type="text"
                                            value={memo.title}
                                            onChange={e => handleRenameMemo(memo.id, e.target.value)}
                                            className="bg-transparent border-none text-xs font-bold text-slate-200 outline-none focus:bg-slate-900 px-1 py-0.5 rounded"
                                        />
                                        <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono mt-0.5 px-1">
                                            <span className="flex items-center gap-1"><Calendar size={8} />{memo.date}</span>
                                            <span className="flex items-center gap-1"><Clock size={8} />{formatTime(memo.duration)}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDeleteMemo(memo.id)}
                                    className="p-2 text-slate-600 hover:text-red-400 active:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
