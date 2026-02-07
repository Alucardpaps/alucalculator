import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
    themeColor: '#1e1e1e',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export const metadata: Metadata = {
    title: "AluCalc OS | Engineering Workstation",
    description: "Browser-based engineering operating system. CAD-style interface with weight calculators, converters, and engineering tools.",
};

/**
 * OS Layout - Clean layout without legacy header/footer
 * Zero-scroll, full-viewport engineering workstation
 */
export default function OSLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
