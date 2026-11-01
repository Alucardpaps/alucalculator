'use client';
import dynamic from 'next/dynamic';

const PartStudio = dynamic(() => import('@/cad/part/PartStudio').then((m) => m.PartStudio), { ssr: false });

export default function PartStudioClient() {
  return (
    <div className="h-[calc(100dvh-56px)] w-full">
      <PartStudio />
    </div>
  );
}
