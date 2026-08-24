'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AssemblyRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/design-studio');
  }, [router]);

  return (
    <div className="w-full h-screen flex items-center justify-center bg-[#05080c] text-cyan-400 font-mono text-xs">
      Redirecting to 3D Design Studio...
    </div>
  );
}
