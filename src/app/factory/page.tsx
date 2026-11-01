import { Metadata } from 'next';
import { FactoryClient } from './FactoryClient';

export const metadata: Metadata = {
  title: 'Industrial Factory Digital Twin Simulation (ISO 22400)',
  description:
    '3D real-time simulation of industrial CNC machine cells, articulated robotic arms (VDI 2860), automated guided vehicles (AGV), and production line OEE telemetry.',
  alternates: {
    canonical: 'https://www.alucalculator.com/factory/',
  },
};

export default function FactoryPage() {
  return <FactoryClient />;
}
