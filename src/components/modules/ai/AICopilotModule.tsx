'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOSStore } from '@/store/osStore';
import { useLocalIntelligence } from '@/hooks/useLocalIntelligence';

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
                ? 'Merhaba! Ben AluCalc AI Asistanıyım. Mühendislik hesaplamaları, CAD çizimleri veya malzeme seçimi konusunda size nasıl yardımcı olabilirim?'
                : 'Hello! I am the AluCalc AI Assistant. How can I help you with engineering calculations, CAD drawings, or material selection?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

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

        // Send to Local Intelligence
        const response = await processQuery(input);

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

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-200">
            {/* Header */}
            <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
                <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-100">AI Co-Pilot</h3>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Online
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-cyan-600'
                            }`}>
                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>

                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
                            ? 'bg-slate-700 text-white rounded-tr-none'
                            : 'bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-tl-none'
                            }`}>
                            {msg.content}
                            <div className="text-[9px] text-slate-500 mt-1 opacity-50">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}

                {isProcessing && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center shrink-0">
                            <Bot size={14} />
                        </div>
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/30">
                <div className="relative flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-cyan-400 transition-colors">
                        <Terminal size={18} />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about calculations, standards, or general questions..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl h-10 w-10 shrink-0"
                        disabled={!input.trim() || isProcessing}
                    >
                        <Send size={16} />
                    </Button>
                </div>
                <div className="text-[10px] text-center text-slate-600 mt-2">
                    AI can make mistakes. Please verify important engineering calculations.
                </div>
            </div>
        </div>
    );
}

export default AICopilotModule;
