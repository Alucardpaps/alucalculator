import React from 'react';
import { Metadata } from 'next';
import DownloadClientPage from './DownloadClientPage';

export const metadata: Metadata = {
  title: 'AluCalc OS Apps | Download Android & Wear OS APK',
  description: 'Download the official AluCalc OS Android APK and Wear OS Smartwatch APK for offline engineering calculation, 2D AluCAD, and 3D design workstation.',
  alternates: {
    canonical: 'https://www.alucalculator.com/download',
  },
  openGraph: {
    title: 'Download AluCalc OS Android & Wear OS APK',
    description: 'Official APK downloads for Android Phones, Tablets, and Wear OS Smartwatches.',
    url: 'https://www.alucalculator.com/download',
    type: 'website',
  },
};

export default function DownloadPage() {
  return <DownloadClientPage />;
}
