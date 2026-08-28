'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ParametricCadRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/design-studio');
  }, [router]);
  return (
    <div className="w-full h-[calc(100vh-3.5rem)] flex items-center justify-center bg-[#05080c] text-cyan-400 font-mono text-xs">
      Redirecting to 3D Studio…
    </div>
  );
}
