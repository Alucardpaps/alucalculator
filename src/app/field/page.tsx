import { Metadata } from 'next';
import FieldClient from './FieldClient';

export const metadata: Metadata = {
  title: 'Field Engineering Suite',
  description:
    'Shop-floor tools: gyro level, ISO 10816 vibration, tap-drill charts, ISO 898 grades, thread ID, PCD, VDI torque screening.',
  alternates: {
    canonical: 'https://www.alucalculator.com/field/',
  },
  openGraph: {
    title: 'Field Engineering Suite',
    description:
      'Mobile and workshop engineering field tools for hardware technicians and mechanical engineers.',
    url: 'https://www.alucalculator.com/field/',
    type: 'website',
  },
};

export default function FieldPage() {
  return <FieldClient />;
}
