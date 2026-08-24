'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplitCadRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/design-studio');
  }, [router]);

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] flex items-center justify-center bg-[#05080c] text-cyan-400 font-mono text-xs">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-t-cyan-400 border-white/10 rounded-full animate-spin" />
        <span>Yönlendiriliyor: Design Studio...</span>
      </div>
    </div>
  );
}
