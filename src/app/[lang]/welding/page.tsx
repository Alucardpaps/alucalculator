import { getDictionary } from "@/get-dictionary";
import WeldingPageClient from "@/components/WeldingPageClient";
import { i18n } from "../../../i18n-config";

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function WeldingPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return <WeldingPageClient dict={dict} lang={lang} />;
}
