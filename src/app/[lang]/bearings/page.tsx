import { getDictionary } from "@/get-dictionary";
import BearingsPageClient from "@/components/BearingsPageClient";
import { i18n } from "../../../i18n-config";

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function BearingsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return <BearingsPageClient dict={dict} lang={lang} />;
}
