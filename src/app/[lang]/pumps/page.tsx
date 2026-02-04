import { getDictionary } from "@/get-dictionary";
import PumpsPageClient from "@/components/PumpsPageClient";
import { i18n } from "../../../i18n-config";

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function PumpsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return <PumpsPageClient dict={dict} lang={lang} />;
}
