import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles } from 'lucide-react';
import { useOSStore } from '@/store/osStore';
import { AegisIcon } from '@/components/copilot/AegisIcon';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isCode?: boolean;
}

export function AICopilotModule() {
    const { isChaosMode } = useOSStore();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "AeGiS online — Agentic Engineering Intelligence System initialized. I can assist with material selection, stress calculations, or workflow automation. What are we building today?",
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            // Check for fun chaos mode override
            if (isChaosMode && inputValue.toLowerCase().includes("design")) {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "WARNING: AVANT-GARDE LOGIC DETECTED. The optimal solution is geometric distortion. Let the structures fail gracefully to reveal their true form.", timestamp: new Date() }]);
                setIsTyping(false);
                return;
            }

            let res = await fetch('/api/ai/copilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: inputValue })
            }).catch(async (err) => {
                console.warn("[Copilot Module] Primary API route failed, trying PHP fallback:", err);
                return await fetch('/api/ai/copilot/index.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: inputValue })
                });
            });

            if (res.status === 404) {
                console.warn("[Copilot Module] Primary API route returned 404, trying PHP fallback.");
                res = await fetch('/api/ai/copilot/index.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: inputValue })
                });
            }

            const data = await res.json();
            
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.answer || "Blank response triggered.",
                timestamp: new Date()
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "[System Error]: Could not reach the Copilot Engine.",
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-cyan-50 font-sans relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(99,102,241,0.2),_transparent_50%)]"></div>
            </div>

            {/* Header */}
            <div className="z-10 px-4 py-3 border-b flex items-center justify-between bg-black/40 backdrop-blur-md border-indigo-500/30">
                <div className="flex items-center gap-3">
                    <AegisIcon size={36} mode="active" />
                    <div>
                        <h2 className="text-sm font-black tracking-widest text-[#00e5ff] uppercase">AeGiS</h2>
                        <p className="text-[10px] font-mono text-[#00e5ff]/50 tracking-widest">Agentic Engineering Intelligence</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <span className="text-[10px] font-mono uppercase text-indigo-400">Online</span>
                </div>
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 z-10 scrollbar-thin scrollbar-thumb-indigo-900/50" ref={scrollRef}>
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 shadow-lg ${msg.role === 'user'
                                ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-50 rounded-tr-sm'
                                : 'bg-[#111] border border-cyan-900/30 text-cyan-100 rounded-tl-sm'
                            }`}>
                            <div className="flex items-center gap-2 mb-1.5 opacity-60">
                                {msg.role === 'user' ? <User size={12} /> : <Sparkles size={12} className="text-indigo-400" />}
                                <span className="text-[10px] font-mono uppercase">{msg.role}</span>
                                <span className="text-[9px] font-mono ml-auto">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            {msg.isCode ? (
                                <pre className="p-3 bg-black/50 rounded border border-indigo-900/50 text-xs font-mono overflow-x-auto text-indigo-300 mt-2">
                                    <code>{msg.content}</code>
                                </pre>
                            ) : (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            )}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-[#111] border border-cyan-900/30 rounded-2xl rounded-tl-sm p-4 shadow-lg flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="z-10 p-4 border-t border-indigo-900/30 bg-[#0a0a0a]">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask AeGiS anything..."
                        className="w-full bg-[#111] border border-indigo-900/50 rounded-xl py-3 pl-4 pr-12 text-sm text-indigo-100 placeholder:text-indigo-900/70 focus:outline-none focus:border-indigo-500/50 transition-colors shadow-inner"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isTyping}
                        className="absolute right-2 p-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/40 hover:text-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
