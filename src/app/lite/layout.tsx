import { Metadata } from 'next';
import { TOTAL_CALCULATORS_LABEL } from '@/config/modules';

export const metadata: Metadata = {
    title: 'Lite Engineering Calculators',
    description: `Simplified, mobile-optimized engineering calculators for quick access to bolt torque, bearing life, beam deflection, and ${TOTAL_CALCULATORS_LABEL} more precision tools — no desktop required.`,
    alternates: {
        canonical: 'https://www.alucalculator.com/lite/',
    },
    openGraph: {
        title: 'Lite Engineering Calculators | AluCalc OS',
        description: 'Quick-access engineering calculators optimized for mobile devices. Fast, clean, and browser-based.',
        type: 'website',
        url: 'https://www.alucalculator.com/lite/',
    },
};

export default function LiteLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full bg-[#020408] text-slate-200">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
                {children}
            </div>
        </div>
    );
}
