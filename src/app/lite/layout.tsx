import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AluCalc Lite | Mobile-Friendly Engineering Calculators',
    description: 'Simplified, mobile-optimized engineering calculators for quick access to bolt torque, bearing life, beam deflection, and 40+ more precision tools — no desktop required.',
    alternates: {
        canonical: 'https://www.alucalculator.com/lite',
    },
    openGraph: {
        title: 'AluCalc Lite | Mobile Engineering Calculators',
        description: 'Quick-access engineering calculators optimized for mobile devices. Fast, clean, and browser-based.',
        type: 'website',
        url: 'https://www.alucalculator.com/lite',
    },
};

export default function LiteLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0e14] text-slate-900 dark:text-slate-100 font-sans">
            <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-[#12161e]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                    <polyline points="9 22 9 12 15 12 15 22"/>
                                </svg>
                            </div>
                            <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">AluCalc <span className="text-cyan-500 font-medium">Lite</span></span>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Return to OS button */}
                            <a href="/" className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 py-1.5 px-3 rounded-full">
                                Go to Workstation
                            </a>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
                {children}
            </main>

            {/* Mobile Bottom Navigation could go here later if needed */}
        </div>
    );
}
