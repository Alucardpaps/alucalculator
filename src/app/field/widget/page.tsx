import { Metadata, Viewport } from 'next';
import { FieldHomeScreenWidget } from '@/components/os/mobile/FieldHomeScreenWidget';

export const metadata: Metadata = {
  title: 'AluCAD OS Field Widget | Fast Shop-Floor HUD',
  description: 'Ultra-fast Android & PWA home screen widget for mechanics: Spirit level, bolt torque, tap chart, and unit converter.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function FieldWidgetPage() {
  return (
    <main className="w-full max-w-md mx-auto py-2 px-1 select-none flex flex-col items-center">
      <FieldHomeScreenWidget isEmbedded={false} />
    </main>
  );
}
