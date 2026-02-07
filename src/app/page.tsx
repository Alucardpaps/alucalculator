'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
    const router = useRouter();

    useEffect(() => {
        // Simple language detection or default to 'en'
        // In a real app, strict negotiation is better, but this suffices for static export
        const lang = navigator.language.split('-')[0];
        const supported = ['en', 'tr', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'zh'];
        const targetLang = supported.includes(lang) ? lang : 'en';

        router.replace(`/${targetLang}/os`);
    }, [router]);

    return (
        <div className="w-screen h-screen bg-[#1e1e1e] flex items-center justify-center text-gray-500 font-mono text-sm">
            Booting AluCalc OS...
        </div>
    );
}
