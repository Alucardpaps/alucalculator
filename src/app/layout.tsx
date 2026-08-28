import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-jetbrains-mono',
});

import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { GoogleAnalytics } from "@/components/os/GoogleAnalytics";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AICopilotOverlay } from "@/components/copilot/AICopilotOverlay";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { ThemeSettingsProvider } from "@/components/os/ThemeSettingsProvider";
import { SiteChrome } from "@/components/layout/SiteChrome";

export const viewport: Viewport = {
    themeColor: '#07090c',
    width: 'device-width',
    initialScale: 1,
};

export const metadata: Metadata = {
    metadataBase: new URL('https://www.alucalculator.com'),
    title: {
        default: "AluCalc OS | Engineering Intelligence Platform",
        template: "%s | AluCalc OS"
    },
    description: "AluCalc OS is a deterministic engineering engine for mechanical designers. Design, calculate, and build inside a single browser environment. Featuring 3D assembly workspace, 100+ engineering calculators, and real-time BOM generation.",
    applicationName: "AluCalc OS",
    authors: [{ name: "AluCalc OS", url: "https://www.alucalculator.com" }],
    keywords: [
        "engineering calculator", "mechanical analysis", "aluminum profile",
        "3D assembly", "bill of materials", "BOM generator",
        "ISO 281", "bearing life", "bolt torque", "shaft design",
        "beam deflection", "gear calculator", "CAD browser"
    ],
    category: "Engineering / CAD",
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black',
        title: 'AluCalc OS',
    },
    other: {
        'mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'black',
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://www.alucalculator.com',
        siteName: 'AluCalc OS',
        title: 'AluCalc OS | Engineering Intelligence Platform',
        description: 'Design, calculate, and build inside a single browser environment.',
        images: [{
            url: '/images/og-image.png',
            width: 1200,
            height: 630,
            alt: 'AluCalc OS — Engineering Intelligence Platform',
        }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'AluCalc OS | Engineering Intelligence',
        description: 'Deterministic engineering engine in your browser.',
        images: ['/images/og-image.png'],
    },
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: 'https://www.alucalculator.com',
    },
};

import { UpgradeModal } from "@/components/license/UpgradeModal";
import { AluShareIntegration } from "@/share/components/AluShareIntegration";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body
                className={`${inter.variable} ${jetbrainsMono.variable} font-sans h-full w-full bg-[var(--bg-0)] text-[var(--ink)] selection:bg-[var(--cyan-glow)]`}
                suppressHydrationWarning
            >
                <ThemeSettingsProvider />
                <AmbientBackground />
                <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
                <ServiceWorkerRegistration />

                <AuthProvider>
                    <ErrorBoundary>
                        <SiteChrome>{children}</SiteChrome>
                    </ErrorBoundary>
                </AuthProvider>

                {/* AluShare v1 URL Hash Listener & Feedback Engine */}
                <AluShareIntegration />

                {/* Omnipresent Agentic Copilot Overlay */}
                <AICopilotOverlay />

                {/* Global License Upgrade Guard Modal */}
                <UpgradeModal />

            </body>
        </html>
    );
}
