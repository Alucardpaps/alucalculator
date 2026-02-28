'use client';

import { useState } from 'react';
import { Send, MessageSquare, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';

export default function FeedbackModule() {
    const [type, setType] = useState<'bug' | 'feature' | 'general'>('general');
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const subject = `[AluCalc Feedback] ${type.toUpperCase()}`;
        const body = `Type: ${type}\n\nMessage:\n${message}`;
        const mailtoUrl = `mailto:abdulsametyildiri95@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        window.location.href = mailtoUrl;

        setSent(true);
        setTimeout(() => {
            setSent(false);
            setMessage('');
            setType('general');
        }, 3000);
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-200 p-6 select-none">

            {/* Header */}
            <div className="mb-6 text-center border-b border-white/5 pb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                    <MessageSquare size={32} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">Contact & Feedback</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                    Direct line to the developer. Report bugs, request features, or just say hi.
                </p>
            </div>

            {sent ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center ring-1 ring-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                        <ThumbsUp size={40} className="text-green-400" />
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-green-400">Message Sent!</div>
                        <div className="text-sm text-slate-500 mt-1">Thanks for helping build AluCal.</div>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
                    {/* Type Selector */}
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            type="button"
                            onClick={() => setType('bug')}
                            className={`flex flex-col items-center p-3 rounded-xl border transition-all duration-200 group ${type === 'bug'
                                ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                                : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:border-white/10'
                                }`}
                        >
                            <AlertTriangle size={20} className="mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Report Bug</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setType('feature')}
                            className={`flex flex-col items-center p-3 rounded-xl border transition-all duration-200 group ${type === 'feature'
                                ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                                : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:border-white/10'
                                }`}
                        >
                            <ThumbsUp size={20} className="mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Request Feature</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setType('general')}
                            className={`flex flex-col items-center p-3 rounded-xl border transition-all duration-200 group ${type === 'general'
                                ? 'bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                                : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:border-white/10'
                                }`}
                        >
                            <MessageSquare size={20} className="mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Contact</span>
                        </button>
                    </div>

                    {/* Text Area */}
                    <div className="flex-1 flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Message</label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder={type === 'bug' ? "What went wrong? Steps to reproduce..." : type === 'feature' ? "I wish the system could..." : "Hey, just wanted to say..."}
                            className="w-full h-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white resize-none focus:outline-none focus:border-blue-500/50 focus:bg-black/40 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
                            required
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={!message.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
                    >
                        <Send size={16} />
                        <span>Send Message</span>
                    </button>
                </form>
            )}
        </div>
    );
}
