'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BeamDeflectionCalculatorPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/beam-deflection');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#020408] flex flex-col items-center justify-center text-slate-500 font-mono text-xs gap-2">
      <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <span>Redirecting to interactive beam deflection workspace...</span>
    </div>
  );
}
