/**
 * modules/software/AiCoPilot/index.tsx
 * 
 * Contextual AI Assistant that reads Engine Metadata to provide engineering insights.
 * Features an Avant-Garde UI styling.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Cpu, Activity, ArrowRight, Zap, User } from 'lucide-react';
import { useOSStore } from '@/store/osStore';

export default function AiCoPilotModule() {
    const { openWindow, setActiveSettingsTab } = useOSStore();

    const [messages, setMessages] = useState<{ role: 'user' | 'ai' | 'system', text: string, action?: { label: string, onClick: () => void } }[]>([
        { role: 'system', text: 'CONNECTION ESTABLISHED. NEURAL LINK ACTIVE.' },
        { role: 'ai', text: 'Hello Engineer. I am your specialized Copilot. I can analyze workflows, suggest design optimizations, or navigate you through the Engineering OS. How can I help you today? \n\n(Merhaba Mühendis. Ben sizin uzman Yardımcınızım. İş akışlarınızı analiz edebilir, tasarım optimizasyonları önerebilir veya İşletim Sistemi içinde sizi yönlendirebilirim. Bugün size nasıl yardımcı olabilirim?)' }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isThinking]);

    const handleSend = (text: string = input) => {
        if (!text.trim() || isThinking) return;

        const userMsg = text.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setIsThinking(true);

        // Simulate AI thinking and contextual response
        setTimeout(() => {
            let aiResponse = "";
            let actionItem = undefined;

            const lowerMsg = userMsg.toLowerCase();

            // Intent Parsing
            const isCost = /cost|fiyat|maliyet|ucuz/i.test(lowerMsg);
            const isWeight = /weight|mass|ağırlık|hafif/i.test(lowerMsg);
            const isMfg = /manufactur|readiness|üretim|imalat/i.test(lowerMsg);
            const isAccount = /hesap|hesab|account|profil|profile/i.test(lowerMsg);
            const isGreeting = /hello|hi|merhaba|selam|hey/i.test(lowerMsg);

            if (isAccount) {
                aiResponse = "Hesap ve profil ayarlarınıza erişmek istediğinizi görüyorum. Sizi hemen hesap yönetim sayfasına (Ayarlar) yönlendiriyorum. (I see you want to access your account/profile settings. Redirecting you now.)";
                actionItem = {
                    label: "Hesabıma Git / Open Account",
                    onClick: () => {
                        setActiveSettingsTab('account');
                        openWindow('settings');
                    }
                };
            } else if (isCost) {
                aiResponse = "Maliyet analizi yapıldı: Real-Time Cost Engine verilerine göre, mevcut üretim partisi ölçeklendirmeniz optimal değil. 5-eksenli fikstürlemeye geçiş yapmak kurulum süresini %14 azaltabilir ve birim maliyeti yaklaşık $24.50 düşürebilir.\n\n(Cost analysis complete: Based on the Real-Time Cost Engine, your batch scaling is suboptimal. Shifting to 5-axis fixturing could reduce setup by 14% and unit cost by $24.50.)";
            } else if (isWeight) {
                aiResponse = "Topoloji optimizasyonu algoritmalarım, merkezdeki kaburga (rib) yapısında boşaltma (pocketing) işleminin yapısal mukavemeti düşürmeden kütleyi %6 azaltabileceğini gösteriyor.\n\n(Topology optimization heuristics suggest that pocketing the central rib structure can eliminate 6% of the mass without sacrificing structural yield strength.)";
            } else if (isMfg) {
                aiResponse = "Üretilebilirlik (DFM) analizi: 3B Baskı (Additive) için Hazırlık Puanı 100. Ancak CNC 3-Eksen'e geçerseniz, 0.5mm'lik iç radyüsler takım çakışmasına (tooling conflict) yol açacaktır. Minimum 3.0mm'ye çıkarmanızı öneriyorum.\n\n(DFM Analysis: Readiness Score is 100 for 3D-PRINT. However, if you switch to CNC 3-Axis, minimum inner radii of 0.5mm will cause tooling conflicts. Recommend increasing to 3.0mm.)";
            } else if (isGreeting) {
                aiResponse = "Merhaba! Size malzeme seçimi, maliyet analizi veya sistem ayarları konularında nasıl asistanlık yapabilirim? (Hello! How can I assist you with material selection, cost analysis, or system settings today?)";
            } else {
                aiResponse = `Hımm, anladım. "${userMsg}" konusu üzerinde Mühendislik Veritabanını (Handbook) ve aktif proje metadatasını taradım. Genel toleranslar ve standartlar çerçevesinde şu an bir anomali görünmüyor. Daha spesifik bir geometri veya hesaplama mı sormak istersiniz?\n\n(I see. I have scanned the Engineering Handbook and active project metadata regarding that topic. Everything appears to be within standard tolerances. Would you like to ask about a specific geometry or calculation?)`;
            }

            setMessages(prev => [...prev, { role: 'ai', text: aiResponse, action: actionItem }]);
            setIsThinking(false);
        }, 1200 + Math.random() * 800); // Faster, more responsive simulated delay
    };

    const suggestions = [
        "How can I reduce CNC machining costs?",
        "Hesap sayfama gitmek istiyorum",
        "Analyze DFM for 3D printing",
        "Parçanın ağırlığını nasıl azaltırım?"
    ];

    return (
        <div className="flex flex-col h-full bg-[#0a0f16] text-slate-200 overflow-hidden font-sans relative">
            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 p-4 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                        <Cpu className="w-5 h-5 text-purple-400" />
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-100 tracking-tight flex items-center gap-2">
                            Copilot <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono border border-purple-500/30">v4.0</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono tracking-wider">
                            <Activity size={10} className="text-emerald-500" /> SYSTEM ONLINE
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => { setActiveSettingsTab('account'); openWindow('settings'); }}
                    className="p-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg text-slate-300 transition-colors flex items-center gap-2 text-xs"
                    title="Open Account Settings"
                >
                    <User size={14} /> <span className="hidden sm:inline">Account</span>
                </button>
            </div>

            {/* Chat Area */}
            <div className="relative z-10 flex-1 p-6 overflow-y-auto no-scrollbar space-y-6">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        {m.role === 'system' ? (
                            <div className="w-full text-center">
                                <span className="inline-block text-[10px] font-mono tracking-widest text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full uppercase">
                                    {m.text}
                                </span>
                            </div>
                        ) : (
                            <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                                {/* Avatar */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 border ${m.role === 'user' ? 'bg-blue-600/20 border-blue-500/30 text-blue-400' : 'bg-purple-600/20 border-purple-500/30 text-purple-400'}`}>
                                    {m.role === 'user' ? <span className="text-xs font-bold">U</span> : <Bot size={16} />}
                                </div>

                                {/* Message Bubble */}
                                <div className={`p-4 text-sm leading-relaxed shadow-lg relative flex flex-col gap-3 ${m.role === 'user'
                                        ? 'bg-blue-600/90 text-white rounded-2xl rounded-tr-sm border border-blue-500/50'
                                        : 'bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-2xl rounded-tl-sm text-slate-300'
                                    }`}>
                                    <div className="whitespace-pre-wrap">{m.text}</div>

                                    {/* OS Action Button rendered by AI */}
                                    {m.action && (
                                        <button
                                            onClick={m.action.onClick}
                                            className="px-4 py-2 mt-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium transition-colors w-fit flex items-center gap-2 shadow-lg shadow-purple-900/20"
                                        >
                                            <Sparkles size={14} />
                                            {m.action.label}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Thinking Indicator */}
                {isThinking && (
                    <div className="flex justify-start animate-in fade-in">
                        <div className="flex gap-3 max-w-[85%]">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mt-1">
                                <Bot size={16} />
                            </div>
                            <div className="p-4 bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-2xl rounded-tl-sm flex items-center gap-1.5 h-[52px]">
                                <span className="w-2 h-2 rounded-full bg-purple-500/50 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 rounded-full bg-purple-500/50 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 rounded-full bg-purple-500/50 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative z-10 p-4 bg-gradient-to-t from-[#0a0f16] via-[#0a0f16] to-transparent pt-12">

                {/* Suggestions */}
                {messages.length < 5 && !isThinking && (
                    <div className="flex gap-2 pb-3 overflow-x-auto no-scrollbar pl-1">
                        {suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(suggestion)}
                                className="whitespace-nowrap flex items-center gap-1.5 text-xs bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-400 hover:text-purple-300 px-3 py-1.5 rounded-full transition-all hover:bg-slate-800"
                            >
                                <Sparkles size={12} className="text-purple-500" /> {suggestion}
                            </button>
                        ))}
                    </div>
                )}

                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur transition-opacity opacity-50 group-focus-within:opacity-100"></div>
                    <div className="relative bg-slate-950/80 border border-slate-800 focus-within:border-purple-500/50 rounded-xl flex items-end p-2 transition-colors">
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Message Copilot / Copilot'a mesaj yaz (Press Enter to send)..."
                            className="flex-1 bg-transparent border-none text-sm text-slate-200 resize-none outline-none max-h-32 min-h-[40px] px-3 py-2 custom-scrollbar placeholder:text-slate-600"
                            rows={1}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isThinking}
                            className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-lg text-white transition-all flex items-center justify-center flex-shrink-0"
                        >
                            {isThinking ? <Activity className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-slate-600">Copilot AI is context-aware. It routes you to Settings or provides domain insights.</span>
                </div>
            </div>
        </div>
    );
}
