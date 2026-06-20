import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { GoogleAnalytics } from "@/components/os/GoogleAnalytics";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AICopilotOverlay } from "@/components/copilot/AICopilotOverlay";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { ThemeSettingsProvider } from "@/components/os/ThemeSettingsProvider";
import { SiteChrome } from "@/components/layout/SiteChrome";

export const viewport: Viewport = {
    themeColor: '#020408',
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
    authors: [{ name: "Alucard", url: "https://www.alucalculator.com" }],
    keywords: [
        "engineering calculator", "mechanical analysis", "aluminum profile",
        "3D assembly", "bill of materials", "BOM generator",
        "ISO 281", "bearing life", "bolt torque", "shaft design",
        "beam deflection", "gear calculator", "CAD browser"
    ],
    category: "Engineering / CAD",
    manifest: '/manifest.json',
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

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body
                className="font-sans h-full w-full bg-[#020408] text-slate-200 selection:bg-blue-500/30"
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

                {/* Omnipresent Agentic Copilot Overlay */}
                <AICopilotOverlay />

                {/* System Version Badge */}
                <div className="fixed bottom-2 right-2 z-[9999] bg-black/60 text-white/50 px-2 py-1 text-[10px] font-mono rounded pointer-events-none select-none backdrop-blur-sm border border-white/5">
                    v5.0.0 — BUILD {process.env.NEXT_PUBLIC_BUILD_TIMESTAMP?.split('T')[0] || 'DEV'}
                </div>
            </body>
        </html>
    );
}
