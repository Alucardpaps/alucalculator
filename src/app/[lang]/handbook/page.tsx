import { getDictionary } from "@/get-dictionary";
import HandbookPageClient from "@/components/HandbookPageClient";
import { i18n } from "../../../i18n-config";

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function HandbookPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return <HandbookPageClient lang={lang} dict={dict} />;
}
