import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "@/app/globals.css";
import { i18n } from "../../i18n-config";

const inter = Inter({
    subsets: ["latin"],
    display: 'swap',
    variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    display: 'swap',
    variable: '--font-jetbrains-mono',
});

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

export const metadata: Metadata = {
    title: "Aluminum Weight Calculator | Pipe, Sheet, Bar & Profile (Metric/Imperial)",
    description: "Calculate weight for chemical, industrial and structural aluminum shapes.",
};

import { Navbar } from "@/components/Navbar";
import { MarketTicker } from "@/components/MarketTicker";
import { Footer } from "@/components/Footer";
import { ChunkErrorBoundary } from "@/components/ChunkErrorBoundary";

import { getDictionary } from "@/get-dictionary";

// ... existing imports

import Script from "next/script";

export default async function RootLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}>) {
    const { lang } = await params;
    const dict = await getDictionary(lang);

    return (
        <html lang={lang} className={`${inter.variable} ${jetbrainsMono.variable}`}>
            <body className={`${inter.className} bg-slate-50`}>
                <Script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2335208371281126"
                    crossOrigin="anonymous"
                    strategy="afterInteractive"
                />

                {/* Fixed Header Stack */}
                <div className="fixed top-0 left-0 w-full z-50 flex flex-col">
                    <MarketTicker dict={dict} lang={lang} />
                    <Navbar lang={lang} dict={dict} />
                </div>

                {/* Main Content Padding */}
                <ChunkErrorBoundary>
                    <div className="pt-32 min-h-screen">
                        {children}
                    </div>
                </ChunkErrorBoundary>

                <Footer lang={lang} dict={dict} />
            </body>
        </html>
    );
}
