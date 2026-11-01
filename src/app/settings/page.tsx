import type { Metadata } from 'next';
import SettingsPageClient from './SettingsPageClient';

export const metadata: Metadata = {
  title: 'Settings — theme, background & report branding',
  description: 'Theme, page background, company logo and the Designed / Checked / Approved block for PDF and print reports.',
  alternates: { canonical: 'https://www.alucalculator.com/settings/' },
  robots: { index: false, follow: true },
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
