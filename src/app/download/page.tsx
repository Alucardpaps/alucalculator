import React from 'react';
import { Metadata } from 'next';
import DownloadClientPage from './DownloadClientPage';

export const metadata: Metadata = {
  title: 'Download Apps',
  description: 'Download the official AluCAD OS Android APK and Wear OS Smartwatch APK. Installs the web app; listed solvers work offline once precached.',
  alternates: {
    canonical: 'https://www.alucalculator.com/download/',
  },
  openGraph: {
    title: 'Download Apps',
    description: 'Official APK downloads for Android Phones, Tablets, and Wear OS Smartwatches.',
    url: 'https://www.alucalculator.com/download/',
    type: 'website',
  },
};

export default function DownloadPage() {
  return <DownloadClientPage />;
}
