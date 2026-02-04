import { getDictionary } from "@/get-dictionary";
import FastenersPageClient from "@/components/FastenersPageClient";
import { i18n } from "../../../i18n-config";

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function FastenersPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return <FastenersPageClient lang={lang} dict={dict} />;
}
