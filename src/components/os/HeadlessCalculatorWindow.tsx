'use client';
import React, { useState } from 'react';
import { Bot, Play, Zap, Info, Loader2 } from 'lucide-react';

interface HeadlessWindowProps {
    calculatorConfig: {
        id: string;
        title: string;
        seo: {
            intro: string;
            formula: string;
            variables: Record<string, string>;
            example: string;
        };
    };
}

export const HeadlessCalculatorWindow: React.FC<HeadlessWindowProps> = ({ calculatorConfig }) => {
    const [inputQuery, setInputQuery] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCompute = async () => {
        if (!inputQuery.trim()) return;
        setIsLoading(true);

        try {
            // Forward the query + the theoretical context to the Gemini RAG endpoint
            let res = await fetch('/api/ai/copilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: inputQuery,
                    context: `Calculate using this tool: ${calculatorConfig.title}. Formula: ${calculatorConfig.seo.formula}. Variables context: ${JSON.stringify(calculatorConfig.seo.variables)}. User input: ${inputQuery}`
                })
            }).catch(async (err) => {
                console.warn("[Headless Window] Primary API route failed, trying PHP fallback:", err);
                return await fetch('/api/ai/copilot/index.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: inputQuery,
                        context: `Calculate using this tool: ${calculatorConfig.title}. Formula: ${calculatorConfig.seo.formula}. Variables context: ${JSON.stringify(calculatorConfig.seo.variables)}. User input: ${inputQuery}`
                    })
                });
            });

            if (res.status === 404) {
                console.warn("[Headless Window] Primary API route returned 404, trying PHP fallback.");
                res = await fetch('/api/ai/copilot/index.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: inputQuery,
                        context: `Calculate using this tool: ${calculatorConfig.title}. Formula: ${calculatorConfig.seo.formula}. Variables context: ${JSON.stringify(calculatorConfig.seo.variables)}. User input: ${inputQuery}`
                    })
                });
            }

            const data = await res.json();
            setResult(data.answer || "Calculation failed. The Oracle is confused.");
        } catch (e) {
            setResult("Error reaching the calculation engine.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0f18] text-slate-200 p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-cyan-900/30">
                <div className="p-3 bg-cyan-950/40 border border-cyan-800/50 rounded-xl shadow-inner shadow-cyan-900/20">
                    <Zap className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-widest uppercase">{calculatorConfig.title}</h1>
                    <p className="text-sm text-slate-400 font-mono tracking-widest mt-1">{calculatorConfig.id}</p>
                </div>
            </div>

            {/* Theory / Data Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#111620] border border-slate-800 rounded-xl p-5 shadow-lg">
                    <div className="flex items-center gap-2 mb-4 text-cyan-500 font-mono text-xs uppercase">
                        <Info size={14} /> Theory & Logic
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed mb-4">{calculatorConfig.seo.intro}</p>
                    <div className="bg-black/50 p-4 border border-cyan-900/30 rounded font-serif text-center text-lg text-cyan-100 italic">
                        {calculatorConfig.seo.formula}
                    </div>
                </div>

                <div className="bg-[#111620] border border-slate-800 rounded-xl p-5 shadow-lg">
                    <div className="flex items-center gap-2 mb-4 text-emerald-500 font-mono text-xs uppercase">
                        <Bot size={14} /> Known Variables
                    </div>
                    <ul className="space-y-2 text-sm">
                        {Object.entries(calculatorConfig.seo.variables).map(([key, val]) => (
                            <li key={key} className="flex justify-between items-center px-3 py-2 bg-black/30 rounded">
                                <span className="font-mono text-emerald-400">{key}</span>
                                <span className="text-slate-400">{val}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Headless NLP Input Section */}
            <div className="flex-1 flex flex-col">
                <div className="mb-2 text-xs font-mono uppercase tracking-widest text-slate-500">
                    Natural Language Parameter Input
                </div>
                <textarea
                    className="w-full bg-[#111620] border border-cyan-900/50 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono min-h-[100px] shadow-inner"
                    placeholder="Enter your parameters... e.g. Calculate for a force of 500N with length 200mm"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                />

                <button
                    onClick={handleCompute}
                    disabled={isLoading || !inputQuery.trim()}
                    className="mt-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                    {isLoading ? "PROCESSING IN NEURAL NET..." : "EXECUTE HEADLESS CALCULATION"}
                </button>

                {result && (
                    <div className="mt-8 p-6 bg-emerald-950/20 border border-emerald-900/50 rounded-xl">
                        <div className="text-xs font-mono text-emerald-500 mb-3 tracking-widest uppercase flex items-center gap-2">
                            <Zap size={14} /> Calculation Output
                        </div>
                        <div className="text-white whitespace-pre-wrap leading-relaxed font-mono">
                            {result}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
