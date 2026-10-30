"use client";

import { Search } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Meteors } from './magicui/Meteors';
import BlurFade from './magicui/BlurFade';
import { APP_VERSION, APP_MODULE_COUNT } from '@/config/app';

export const Hero = ({ lang }: { lang?: string }) => {
    const [query, setQuery] = useState('');
    const router = useRouter();
    // Default to 'tr' if undefined (though it should be passed)
    const currentLang = lang || 'tr';

    const handleSearch = () => {
        if (!query.trim()) return;
        const q = query.toLowerCase();

        let path = '';
        if (q.includes('bolt') || q.includes('fastener') || q.includes('civata') || q.includes('vida') || q.includes('tork')) path = 'bolt-torque';
        else if (q.includes('gear') || q.includes('disli') || q.includes('dişli')) path = 'gears';
        else if (q.includes('pump') || q.includes('pompa')) path = 'pumps';
        else if (q.includes('weld') || q.includes('kaynak')) path = 'welding';
        else if (q.includes('alum') || q.includes('alü')) path = 'aluminum';
        else if (q.includes('beam') || q.includes('kiris') || q.includes('stress')) path = 'strength';
        else if (q.includes('bear') || q.includes('rulman')) path = 'bearings';
        else if (q.includes('conv') || q.includes('cevir') || q.includes('çevir')) path = 'converter';
        else if (q.includes('sheet') || q.includes('sac') || q.includes('metal')) path = 'sheet-metal';
        else if (q.includes('fit') || q.includes('tol')) path = 'fits';
        else return;

        router.push(`/${path}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div className="relative w-full py-20 lg:py-32 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 bg-blueprint-grid opacity-50 z-0 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white dark:from-slate-950 via-transparent to-transparent z-0"></div>
            
            <Meteors number={30} className="opacity-20" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                <BlurFade delay={0.1} yOffset={10}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--cyan)]/30 text-[var(--cyan)] text-xs font-mono font-bold tracking-wider uppercase">
                        <span className="w-2 h-2 rounded-full bg-[var(--ok)] animate-pulse"></span>
                        v{APP_VERSION} Stable · {APP_MODULE_COUNT} Solvers
                    </div>
                </BlurFade>

                <BlurFade delay={0.25} yOffset={20}>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        ENGINEERING <br />
                        <span className="text-[var(--cyan)]">INTELLIGENCE</span>
                    </h1>
                </BlurFade>

                <BlurFade delay={0.4} yOffset={30}>
                    <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
                        Deterministic ISO / DIN / VDI mechanical engineering solvers and 3D parametric CAD.
                    </p>
                </BlurFade>

                {/* Search Bar Visual */}
                <BlurFade delay={0.55} yOffset={40}>
                    <div className="relative max-w-md mx-auto w-full group">
                        <div className="relative flex items-center bg-[var(--bg-2)] border border-[var(--line-strong)] shadow-xl rounded-[var(--radius-m)] p-2 pl-4 focus-within:ring-1 focus-within:ring-[var(--cyan)] transition-all">
                            <Search className="text-[var(--muted)] mr-3" size={18} />
                            <input
                                type="text"
                                placeholder="Search calculator (e.g. 'Bolt', 'Gear', 'Beam')..."
                                className="bg-transparent w-full outline-none text-[var(--ink)] font-mono text-sm placeholder:text-[var(--muted)]"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <button
                                onClick={handleSearch}
                                className="bg-[var(--cyan)] text-[var(--bg-0)] px-5 py-2 rounded-[var(--radius-s)] font-bold text-xs tracking-wider uppercase hover:bg-[var(--cyan)] transition-colors active:scale-95 transform"
                            >
                                GO
                            </button>
                        </div>
                    </div>
                </BlurFade>
            </div>
        </div>
    );
};
