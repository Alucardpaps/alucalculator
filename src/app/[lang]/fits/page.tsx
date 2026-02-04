import { getDictionary } from "@/get-dictionary";
import { CalculatorInput } from "@/components/CalculatorInput";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";
import { useFitCalculator, fitTypes } from "@/hooks/useFitCalculator";
import FitsPageClient from "./page-client";
import { i18n } from "../../../i18n-config";

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

// Server Component Wrapper for Data Fetching
export default async function FitsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return <FitsPageClient dict={dict} lang={lang} />;
}
