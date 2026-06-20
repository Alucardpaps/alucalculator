'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PlanetaryCalculatorPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/planetary-gearbox');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#020408] flex flex-col items-center justify-center text-slate-500 font-mono text-xs gap-2">
      <div className="w-6 h-6 border-2 border-[#00e5ff]/30 border-t-[#00e5ff] rounded-full animate-spin" />
      <span>Redirecting to interactive planetary gearbox workspace...</span>
    </div>
  );
}