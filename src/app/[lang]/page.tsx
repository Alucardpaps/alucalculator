import { redirect } from 'next/navigation';
import { getDictionary } from "@/get-dictionary";
import { i18n } from "../../i18n-config";

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

/**
 * Home Page - Redirects to OS
 * The OS is now the main landing experience
 */
export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    redirect(`/${lang}/os`);
}
