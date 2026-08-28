'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FailureDiagnosisRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/fatigue-analysis');
  }, [router]);
  return (
    <div className="w-full h-[calc(100vh-3.5rem)] flex items-center justify-center bg-[#05080c] text-cyan-400 font-mono text-xs">
      Redirecting to Fatigue Life…
    </div>
  );
}
