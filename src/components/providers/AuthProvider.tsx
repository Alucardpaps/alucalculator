"use client";

/**
 * Auth Provider (Static Export Mode)
 * 
 * In static export mode, NextAuth's SessionProvider is bypassed
 * since there is no server-side auth endpoint available.
 * Children are rendered directly as a passthrough.
 * 
 * To re-enable auth: restore SessionProvider import and wrap children.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
