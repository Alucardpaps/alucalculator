'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Terminal, Cpu, Command } from 'lucide-react';
import { useOSStore } from '@/store/osStore';
import { useLocalIntelligence } from '@/hooks/useLocalIntelligence';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function AICopilotModule() {
    const { currentLanguage } = useOSStore();
    const { processQuery, isProcessing } = useLocalIntelligence();

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: currentLanguage === 'tr'
                ? 'Merhaba! Ben AluCalc Özel AI Asistanıyım. Mühendislik, CAD ve malzeme seçiminde yanınızdayım. Nasıl yardımcı olabilirim?'
                : 'Welcome to AluCalc Intelligence. I am your engineering, CAD, and material selection copilot. How can I assist you today?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isProcessing]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Intelligence Processing
        const response = await processQuery(input);

        // Simple typing effect simulation for the output
        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.content,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // A very basic markdown parser to highlight `code` and **bold**
    const renderContent = (content: string) => {
        // Split by code blocks first
        const parts = content.split(/(```[\s\S]*?```)/g);

        return parts.map((part, index) => {
            if (part.startsWith('```') && part.endsWith('```')) {
                const code = part.slice(3, -3).replace(/^[\w-]+\n/, ''); // Remove language tag
                return (
                    <div key={index} className="my-3 rounded-lg overflow-hidden border border-cyan-500/20 bg-[#05070a]/80 backdrop-blur-md">
                        <div className="flex items-center px-4 py-1.5 bg-cyan-950/40 border-b border-cyan-500/20">
                            <Terminal size={12} className="text-cyan-500 mr-2" />
                            <span className="text-[10px] uppercase font-bold text-cyan-500 tracking-widest">Code Snippet</span>
                        </div>
                        <pre className="p-4 text-xs font-mono text-cyan-100 overflow-x-auto custom-scrollbar">
                            <code>{code}</code>
                        </pre>
                    </div>
                );
            }

            // Bold and inline code
            let htmlText = part
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-300 font-bold">$1</strong>')
                .replace(/`(.*?)`/g, '<code class="bg-cyan-500/10 text-cyan-300 px-1 py-0.5 rounded font-mono text-xs">$1</code>')
                .replace(/\n/g, '<br/>');

            return <span key={index} dangerouslySetInnerHTML={{ __html: htmlText }} className="leading-relaxed" />;
        });
    };

    return (
        <div className="flex flex-col h-full bg-[#05070a] text-slate-200 relative overflow-hidden font-sans">
            {/* Ambient Background Glow */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* HEADER */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5 bg-[#0a0e14]/60 backdrop-blur-xl z-20">
                <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500/50 blur-lg rounded-full animate-pulse"></div>
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[1px]">
                        <div className="w-full h-full rounded-xl bg-[#0a0e14] flex items-center justify-center">
                            <Cpu className="w-5 h-5 text-cyan-400" />
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-black text-white tracking-wider flex items-center gap-2">
                        ALU<span className="text-cyan-500">CALC</span> INTELLIGENCE
                    </h3>
                    <div className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest flex items-center gap-2 mt-0.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                        System Online & Ready
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                    <Sparkles size={12} className="text-purple-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">v2.4.0 Neural</span>
                </div>
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar z-10 scroll-smooth" ref={scrollRef}>
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                        >
                            {/* Avatar */}
                            <div className="shrink-0 mt-auto">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg
                                    ${msg.role === 'user'
                                        ? 'bg-slate-800 border-2 border-slate-700 text-slate-400'
                                        : 'bg-cyan-950 border-2 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                                    }`}>
                                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                </div>
                            </div>

                            {/* Bubble */}
                            <div className={`relative px-5 py-4 text-sm shadow-xl flex flex-col gap-1
                                ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-white rounded-[24px] rounded-br-[8px]'
                                    : 'bg-gradient-to-br from-[#0a1118] to-[#050a0f] border border-cyan-500/30 text-slate-300 rounded-[24px] rounded-bl-[8px]'
                                }`}
                            >
                                <div className={`text-[9px] font-mono uppercase tracking-[2px] mb-1 font-bold ${msg.role === 'user' ? 'text-slate-500 text-right' : 'text-cyan-500/60'}`}>
                                    {msg.role === 'user' ? 'You' : 'AluCalc AI'}
                                </div>
                                <div className="text-[13px] leading-relaxed">
                                    {renderContent(msg.content)}
                                </div>
                                <div className={`text-[9px] font-mono opacity-40 mt-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Processing Indicator */}
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4 max-w-[80%] mr-auto"
                    >
                        <div className="shrink-0 mt-auto">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-cyan-950 border-2 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                <Bot size={14} />
                            </div>
                        </div>
                        <div className="bg-[#0a1118] border border-cyan-500/30 rounded-[24px] rounded-bl-[8px] px-5 py-4 flex flex-col justify-center">
                            <div className="text-[9px] font-mono uppercase tracking-[2px] mb-2 font-bold text-cyan-500/60">
                                Processing
                            </div>
                            <div className="flex gap-1.5 items-center h-4">
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* INPUT AREA */}
            <div className="p-4 bg-[#0a0e14]/80 backdrop-blur-xl border-t border-white/5 z-20">
                <div className="relative flex items-center max-w-4xl mx-auto group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>

                    <div className="relative flex items-end w-full bg-[#05070a] border border-white/10 rounded-2xl shadow-inner overflow-hidden focus-within:border-cyan-500/50 transition-colors">
                        <div className="p-3 text-slate-500 shrink-0">
                            <Command size={18} className="text-cyan-500/50" />
                        </div>

                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type a message or command... (Shift+Enter for new line)"
                            className="flex-1 max-h-32 min-h-[44px] py-3 bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-none custom-scrollbar leading-relaxed"
                            rows={1}
                        />

                        <div className="p-2 shrink-0">
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isProcessing}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300
                                    ${!input.trim() || isProcessing
                                        ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                                        : 'bg-cyan-500 text-[#05070a] hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:scale-105 hover:-translate-y-0.5'
                                    }`}
                            >
                                <Send size={16} className={input.trim() && !isProcessing ? 'translate-x-0.5' : ''} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-3">
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                        AluCalc AI may produce inaccurate results. Verify critical engineering formulas.
                    </span>
                </div>
            </div>
        </div>
    );
}

export default AICopilotModule;
