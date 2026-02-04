import { InteractiveHero3D } from "@/components/InteractiveHero3D";
import { ModuleGrid } from "@/components/ModuleGrid";
import { NewsSection } from "@/components/NewsSection";
// Removed invalid import
import { getDictionary } from "@/get-dictionary";
import { i18n } from "../../i18n-config";

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return (
        <main className="min-h-screen bg-slate-50/50 dark:bg-transparent">
            <InteractiveHero3D lang={lang} dict={dict} />

            <section className="max-w-7xl mx-auto px-6 pb-24 relative z-20 -mt-10">
                <div className="flex items-center justify-between mb-8 px-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                        {dict.nav.library}
                    </h2>

                </div>

                <ModuleGrid lang={lang} dict={dict} />
            </section>


        </main>
    );
}
