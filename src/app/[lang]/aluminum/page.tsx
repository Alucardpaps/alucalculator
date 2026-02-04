import AluminumPageClient from "@/components/AluminumPageClient";
import { getDictionary } from "@/get-dictionary";
import { i18n } from "../../../i18n-config";

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function AluminumPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang as any);
    return <AluminumPageClient lang={lang} dict={dict} />;
}
