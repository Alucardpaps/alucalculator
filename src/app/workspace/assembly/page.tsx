'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AssemblyRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/design-studio');
  }, [router]);

  return (
    <div className="w-full h-screen flex items-center justify-center bg-[var(--bg-0)] text-cyan-400 font-mono text-xs">
      Redirecting to 3D Design Studio...
    </div>
  );
}
