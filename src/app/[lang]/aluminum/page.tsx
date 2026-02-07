import AluminumPageClient from "@/components/AluminumPageClient";
import { getDictionary } from "@/get-dictionary";
import { i18n } from "../../../i18n-config";

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

import { Suspense } from 'react';

export default async function AluminumPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang as any);
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Loading Calculator...</div>}>
            <AluminumPageClient lang={lang} dict={dict} />
        </Suspense>
    );
}
