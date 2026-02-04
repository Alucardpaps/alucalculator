import { getDictionary } from "@/get-dictionary";
import NewsPageClient from "@/components/NewsPageClient";

export async function generateStaticParams() {
    return [
        { lang: 'en' }, { lang: 'tr' }, { lang: 'de' }, { lang: 'es' }, { lang: 'fr' },
        { lang: 'it' }, { lang: 'pt' }, { lang: 'ru' }, { lang: 'zh' }, { lang: 'ja' }
    ];
}

export default async function NewsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return <NewsPageClient lang={lang} dict={dict} />;
}
