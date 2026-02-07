'use client';

import { useState } from 'react';
import { Send, MessageSquare, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';

export default function FeedbackModule() {
    const [type, setType] = useState<'bug' | 'feature' | 'general'>('general');
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would send to an API
        console.log({ type, message });
        setSent(true);
        setTimeout(() => {
            setSent(false);
            setMessage('');
            setType('general');
        }, 3000);
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-200 p-4 select-none">
            <div className="mb-4 text-center">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-400">
                    <MessageSquare size={24} />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Feedback</h3>
                <p className="text-[10px] text-slate-500">Help us improve the Operating System</p>
            </div>

            {sent ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-3 animate-in fade-in zoom-in">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                        <ThumbsUp size={32} />
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-green-400">Feedback Received!</div>
                        <div className="text-xs text-slate-500">Thank you for your contribution.</div>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3">
                    {/* Type Selector */}
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => setType('bug')}
                            className={`flex flex-col items-center p-2 rounded border transition-all ${type === 'bug' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'}`}
                        >
                            <AlertTriangle size={16} className="mb-1" />
                            <span className="text-[9px] font-bold uppercase">Bug</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('feature')}
                            className={`flex flex-col items-center p-2 rounded border transition-all ${type === 'feature' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'}`}
                        >
                            <ThumbsUp size={16} className="mb-1" />
                            <span className="text-[9px] font-bold uppercase">Feature</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('general')}
                            className={`flex flex-col items-center p-2 rounded border transition-all ${type === 'general' ? 'bg-slate-600/20 border-slate-500 text-slate-300' : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'}`}
                        >
                            <MessageSquare size={16} className="mb-1" />
                            <span className="text-[9px] font-bold uppercase">General</span>
                        </button>
                    </div>

                    {/* Text Area */}
                    <div className="flex-1">
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Describe your issue or idea..."
                            className="w-full h-full bg-black/20 border border-slate-700 rounded p-3 text-xs text-white resize-none focus:outline-none focus:border-blue-500 transition-colors"
                            required
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                        <Send size={14} />
                        Send Report
                    </button>
                </form>
            )}
        </div>
    );
}
