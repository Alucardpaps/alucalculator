import { getDictionary } from "@/get-dictionary";
import GearsPageClient from "@/components/GearsPageClient";
import { i18n } from "../../../i18n-config";

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function GearsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    let dict = await getDictionary(lang);

    // ULTRATHINK PATCH: Force Turkish dictionary if lang is 'tr' but 'home' is 'Home' key which implies fallback occurred
    if (lang === 'tr') {
        const trDict = await import('../../../dictionaries/tr.json');
        dict = trDict.default;
    }

    return <GearsPageClient dict={dict} lang={lang} />;
}
