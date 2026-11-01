import type { Metadata, Viewport } from 'next';
// Self-hosted variable fonts (all subsets incl. latin-ext for Turkish ş ğ ı İ, cyrillic for RU).
// No build-time Google Fonts request; browsers fetch only the unicode ranges a page uses.
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/space-grotesk';
import './globals.css';

import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { GoogleAnalytics } from "@/components/os/GoogleAnalytics";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AICopilotOverlay } from "@/components/copilot/AICopilotOverlay";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { ThemeSettingsProvider } from "@/components/os/ThemeSettingsProvider";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { GlobalCommandPalette } from "@/components/os/GlobalCommandPalette";
import { KeyboardShortcutsModal } from "@/components/ui/KeyboardShortcutsModal";
import { EngineeringNavigatorModal } from "@/components/navigation/EngineeringNavigatorModal";
import { AiAgentGate } from "@/components/AiAgentGate";
import { THEME_INIT_SCRIPT, DEFAULT_THEME } from "@/lib/theme/themes";

export const viewport: Viewport = {
    themeColor: '#0c0e11',
    width: 'device-width',
    initialScale: 1,
};

export const metadata: Metadata = {
    metadataBase: new URL('https://www.alucalculator.com'),
    title: {
        default: "AluCAD OS — VDI/ISO/DIN mechanical engineering solvers & reports",
        template: "%s | AluCAD OS — VDI/ISO/DIN mechanical engineering solvers & reports"
    },
    description: "AluCAD OS is a deterministic engineering engine for mechanical designers. Design, calculate, and build inside a single browser environment. Featuring 3D assembly workspace, validated engineering solvers, and real-time BOM generation.",
    applicationName: "AluCAD OS",
    authors: [{ name: "AluCAD OS · alucalculator.com", url: "https://www.alucalculator.com" }],
    keywords: [
        "engineering calculator", "mechanical analysis", "aluminum profile",
        "3D assembly", "bill of materials", "BOM generator",
        "ISO 281", "bearing life", "bolt torque", "shaft design",
        "beam deflection", "gear calculator", "CAD browser"
    ],
    category: "Engineering / CAD",
    manifest: '/manifest.json',
    icons: {
        icon: [
            { url: '/branding/favicon.ico', sizes: 'any' },
            { url: '/branding/alucalculator-32.png', sizes: '32x32', type: 'image/png' },
            { url: '/branding/alucalculator-192.png', sizes: '192x192', type: 'image/png' },
        ],
        apple: [{ url: '/branding/alucalculator-180.png', sizes: '180x180' }],
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black',
        title: 'AluCAD OS',
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
        siteName: 'AluCAD OS',
        title: 'AluCAD OS — VDI/ISO/DIN mechanical engineering solvers & reports',
        description: 'Design, calculate, and build inside a single browser environment.',
        images: [{
            url: '/images/og-image.png',
            width: 1200,
            height: 630,
            alt: 'AluCAD OS — VDI/ISO/DIN mechanical engineering solvers & reports',
        }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'AluCAD OS — VDI/ISO/DIN mechanical engineering solvers & reports',
        description: 'Deterministic engineering engine in your browser.',
        images: ['/images/og-image.png'],
    },
    robots: {
        index: true,
        follow: true,
    },
};

import { UpgradeModal } from "@/components/license/UpgradeModal";
import { AluShareIntegration } from "@/share/components/AluShareIntegration";
import { MissionHUD } from "@/components/missions/MissionHUD";
import { InteractiveGameTour } from "@/components/tour/InteractiveGameTour";
import { WebMCPProvider } from "@/components/ai/WebMCPProvider";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark" data-theme={DEFAULT_THEME} suppressHydrationWarning>
            <head>
                {/* Applies the saved theme before first paint (no flash). */}
                <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
                {/* AI Agent & MCP Resource Discovery Links (RFC 8288 / SEP-1649) */}
                <link rel="alternate" type="text/plain" href="https://www.alucalculator.com/llms.txt" />
                <link rel="alternate" type="text/plain" href="https://www.alucalculator.com/llms-full.txt" />
                <link rel="alternate" type="text/markdown" href="https://www.alucalculator.com/index.md" />
                <link rel="service-desc" type="application/json" href="https://www.alucalculator.com/.well-known/mcp/server-card.json" />
            </head>
            <body
                className="font-sans h-full w-full bg-[var(--bg-0)] text-[var(--ink)]"
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

                {/* WebMCP In-Browser Tool Provider for Autonomous Agents */}
                <WebMCPProvider />

                {/* AluShare v1 URL Hash Listener & Feedback Engine */}
                <AluShareIntegration />

                {/* Omnipresent Agentic Copilot Overlay */}
                <AICopilotOverlay />

                {/* AI Agent Authorization & DOM Access Gate */}
                <AiAgentGate />

                {/* 🚀 Universal Command Palette, Keyboard Shortcuts & Engineering Navigator */}
                <GlobalCommandPalette />
                <KeyboardShortcutsModal />
                <EngineeringNavigatorModal />

                {/* Interactive In-App Engineering Mission Companion HUD */}
                <MissionHUD />

                {/* 🎮 PC-Game Style Guided Demo Tour HUD (Per-Page + Skippable) */}
                <InteractiveGameTour />

                {/* Global License Upgrade Guard Modal */}
                <UpgradeModal />

            </body>
        </html>
    );
}
