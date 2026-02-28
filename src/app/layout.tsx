import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
// Import Excalidraw styles globally to fix giant icons issue
import '@excalidraw/excalidraw/index.css';
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { DeploymentGuard } from "@/components/os/DeploymentGuard";
import { ThemeSettingsProvider } from "@/components/os/ThemeSettingsProvider";
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

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning={true} className={`${inter.variable} ${jetbrainsMono.variable}`}>
            <body className={`${inter.className} h-full w-full overflow-hidden bg-[#0a0e14]`} suppressHydrationWarning={true}>
                <ThemeSettingsProvider />
                <ServiceWorkerRegistration />
                <Script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2335208371281126"
                    crossOrigin="anonymous"
                    strategy="afterInteractive"
                />

                {children}

                {/* System Version Badge */}
                <div className="fixed bottom-2 right-2 z-[9999] bg-black/60 text-white/50 px-2 py-1 text-[10px] font-mono rounded pointer-events-none select-none backdrop-blur-sm">
                    v2.1.0 — BUILD {process.env.NEXT_PUBLIC_BUILD_TIMESTAMP?.split('T')[0] || 'DEV'}
                </div>
            </body>
        </html>
    );
}
