"use client";

import { Search } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const Hero = ({ lang }: { lang?: string }) => {
    const [query, setQuery] = useState('');
    const router = useRouter();
    // Default to 'tr' if undefined (though it should be passed)
    const currentLang = lang || 'tr';

    const handleSearch = () => {
        if (!query.trim()) return;
        const q = query.toLowerCase();

        let path = '';
        if (q.includes('bolt') || q.includes('fastener') || q.includes('civata') || q.includes('vida')) path = 'fasteners';
        else if (q.includes('gear') || q.includes('disli') || q.includes('dişli')) path = 'gears';
        else if (q.includes('pump') || q.includes('pompa')) path = 'pumps';
        else if (q.includes('weld') || q.includes('kaynak')) path = 'welding';
        else if (q.includes('alum') || q.includes('alü')) path = 'aluminum';
        else if (q.includes('beam') || q.includes('kiris') || q.includes('stress')) path = 'strength';
        else if (q.includes('bear') || q.includes('rulman')) path = 'bearings';
        else if (q.includes('conv') || q.includes('cevir') || q.includes('çevir')) path = 'converter';
        else if (q.includes('sheet') || q.includes('sac') || q.includes('metal')) path = 'sheet-metal';
        else if (q.includes('fit') || q.includes('tol')) path = 'fits';
        else return; // Shake animation or toast could go here

        router.push(`/${currentLang}/${path}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div className="relative w-full py-20 lg:py-32 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 bg-blueprint-grid opacity-50 z-0 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white dark:from-slate-950 via-transparent to-transparent z-0"></div>

            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wider uppercase animate-fadeIn">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    v4.0.0 Stable
                </div>

                <h1 className="text-4xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                    ENGINEERING <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">INTELLIGENCE</span>
                </h1>

                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                    The advanced toolkit for mechanical engineers. Compute weight, fits, gears, and thermodynamics with precision.
                </p>

                {/* Search Bar Visual */}
                <div className="relative max-w-md mx-auto w-full group">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                    <div className="relative flex items-center bg-white dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl rounded-full p-2 pl-6 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                        <Search className="text-slate-400 mr-3" size={20} />
                        <input
                            type="text"
                            placeholder="Search calculator (e.g. 'Bolt', 'Gear')..."
                            className="bg-transparent w-full outline-none text-slate-700 dark:text-slate-100 font-medium placeholder:text-slate-400"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-slate-900 dark:bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors active:scale-95 transform"
                        >
                            GO
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
