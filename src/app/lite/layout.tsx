import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Solvers Library',
    description: 'Quick-access directory of verified engineering solvers, calculators, and tools across VDI, ISO, and DIN standards.',
    alternates: {
        canonical: 'https://www.alucalculator.com/lite',
    },
};

export default function LiteLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
