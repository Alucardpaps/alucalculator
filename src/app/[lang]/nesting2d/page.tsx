"use client";

import { Nesting2D } from "@/components/Nesting2D";
import { useEffect, useState } from "react";

export default function Nesting2DPage({ params }: { params: Promise<{ lang: string }> }) {
    const [lang, setLang] = useState("en");
    const [dict, setDict] = useState<Record<string, unknown> | null>(null);

    useEffect(() => {
        params.then(async (p) => {
            setLang(p.lang);
            const d = await import(`@/dictionaries/${p.lang}.json`);
            setDict(d.default);
        });
    }, [params]);

    if (!dict) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50/50 dark:bg-slate-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <Nesting2D dict={dict} lang={lang} />
            </div>
        </main>
    );
}
