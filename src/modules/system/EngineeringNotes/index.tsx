import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Check, PenTool } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { getEngineeringNotesStrings } from '@/locales/engineeringNotesTranslations';
import { formatDateTime } from '@/locales/localeFormat';

// Simple local state for notes. In a real system, this would be in Zustand with indexDB persistence.
interface Note {
    id: string;
    text: string;
    color: string;
    completed: boolean;
    timestamp: number;
}

const COLORS = [
    'bg-zinc-800/80',
    'bg-blue-900/40',
    'bg-emerald-900/40',
    'bg-purple-900/40',
    'bg-amber-900/40',
    'bg-rose-900/40'
];

const EngineeringNotesModule: React.FC = () => {
    const { language } = useI18nStore();
    const n = getEngineeringNotesStrings(language);

    const [notes, setNotes] = useState<Note[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('alucalc_scratchpad');
        if (saved) {
            try {
                setNotes(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse notes", e);
            }
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem('alucalc_scratchpad', JSON.stringify(notes));
    }, [notes]);

    const handleAddNote = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim()) return;

        const newNote: Note = {
            id: Math.random().toString(36).substr(2, 9),
            text: inputValue,
            color: selectedColor,
            completed: false,
            timestamp: Date.now()
        };

        setNotes([newNote, ...notes]);
        setInputValue('');
    };

    const toggleComplete = (id: string) => {
        setNotes(notes.map(n => n.id === id ? { ...n, completed: !n.completed } : n));
    };

    const deleteNote = (id: string) => {
        setNotes(notes.filter(n => n.id !== id));
    };

    return (
        <div className="flex flex-col w-full h-full bg-[#0a0a0c]/90 text-white backdrop-blur-xl">
            {/* Header & Input area */}
            <div className="p-4 border-b border-white/5 bg-[#111115]/50 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-white/70">
                    <FileText className="w-5 h-5 text-amber-500/80" />
                    <h2 className="text-sm font-medium">{n.title}</h2>
                </div>

                <form onSubmit={handleAddNote} className="flex flex-col gap-2">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={n.placeholder}
                        className="w-full bg-black/40 border border-white/10 rounded-md p-3 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-y min-h-[80px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddNote();
                            }
                        }}
                    />
                    <div className="flex items-center justify-between mt-1">
                        <div className="flex gap-1.5">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setSelectedColor(c)}
                                    className={`w-5 h-5 rounded-full ${c} border-2 transition-transform hover:scale-110 ${selectedColor === c ? 'border-amber-400 scale-110' : 'border-transparent'}`}
                                />
                            ))}
                        </div>
                        <button
                            type="submit"
                            disabled={!inputValue.trim()}
                            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border border-amber-500/30 px-4 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            {n.addNote}
                        </button>
                    </div>
                </form>
            </div>

            {/* Notes Grid */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                {notes.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-white/20 gap-3">
                        <PenTool className="w-12 h-12 opacity-20" />
                        <p className="text-sm">{n.noNotes}</p>
                    </div>
                ) : (
                    notes.map((note) => (
                        <div
                            key={note.id}
                            className={`p-4 rounded-lg border flex gap-3 group transition-all duration-200 ${note.color} ${note.completed ? 'opacity-50 border-white/5' : 'border-white/10 hover:border-white/20'}`}
                        >
                            <button
                                onClick={() => toggleComplete(note.id)}
                                className={`mt-0.5 w-5 h-5 rounded-full border flex flex-shrink-0 items-center justify-center transition-colors ${note.completed ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' : 'border-white/20 hover:border-amber-500/50 text-transparent'}`}
                            >
                                <Check className="w-3 h-3" />
                            </button>

                            <div className="flex-1 min-w-0">
                                <p className={`text-sm whitespace-pre-wrap ${note.completed ? 'line-through text-white/50' : 'text-white/90 font-medium'}`}>
                                    {note.text}
                                </p>
                                <p className="text-[10px] text-white/30 mt-2 font-mono">
                                    {formatDateTime(language, note.timestamp)}
                                </p>
                            </div>

                            <button
                                onClick={() => deleteNote(note.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-white/5 transition-all flex-shrink-0 self-start"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EngineeringNotesModule;
