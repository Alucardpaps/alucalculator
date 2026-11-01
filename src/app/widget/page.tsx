import { Metadata, Viewport } from 'next';
import { FieldHomeScreenWidget } from '@/components/os/mobile/FieldHomeScreenWidget';

export const metadata: Metadata = {
  title: 'AluCAD OS Quick Widget',
  description: 'Fast Android & PWA home screen widget for engineers and technicians.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function StandaloneWidgetPage() {
  return (
    <main className="w-full max-w-md mx-auto py-2 px-1 select-none flex flex-col items-center">
      <FieldHomeScreenWidget isEmbedded={false} />
    </main>
  );
}
