import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "@/app/globals.css";
import { i18n } from "../../i18n-config";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { DeploymentGuard } from "@/components/os/DeploymentGuard";
import Script from "next/script";

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

export const viewport: Viewport = {
    themeColor: '#1e1e1e',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

export const metadata: Metadata = {
    title: "AluCalc OS | Engineering Workstation",
    description: "Browser-based engineering operating system with CAD-style interface.",
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'AluCalc OS',
    },
    formatDetection: {
        telephone: false,
    },
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className={`${inter.variable} ${jetbrainsMono.variable} h-full w-full`}>
            {/* Metadata and icons are handled by Next.js metadata API or root layout */}
            <div className={`${inter.className} h-full w-full`} style={{ overflow: 'hidden' }}>
                {/* Deployment Integrity Guard */}
                <DeploymentGuard />
                <ServiceWorkerRegistration />
                <Script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2335208371281126"
                    crossOrigin="anonymous"
                    strategy="afterInteractive"
                />
                {children}
            </div>
        </div>
    );
}

