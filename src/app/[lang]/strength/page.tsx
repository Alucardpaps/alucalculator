import { getDictionary } from "@/get-dictionary";
import StrengthPageClient from "@/components/StrengthPageClient";
import { i18n } from "../../../i18n-config";

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function StrengthPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return <StrengthPageClient dict={dict} lang={lang} />;
}
