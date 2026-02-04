import { getDictionary } from "@/get-dictionary";
import SheetMetalPageClient from "@/components/SheetMetalPageClient";
import { i18n } from "../../../i18n-config";

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function SheetMetalPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return <SheetMetalPageClient dict={dict} lang={lang} />;
}
