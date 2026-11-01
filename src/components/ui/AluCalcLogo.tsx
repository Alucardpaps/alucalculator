'use client';

import React from 'react';

interface AluCalcLogoProps {
  size?: number;
  className?: string;
  /** kept for API compatibility; the mark is static */
  animate?: boolean;
  title?: string;
}

/**
 * AluCAD OS brand mark — the 3D metallic/red emblem from /public/branding.
 * The artwork has a transparent background and is designed to sit on both
 * light and dark themes unchanged (no CSS filters / theme tinting).
 */
export function AluCalcLogo({ size = 28, className = '', title = 'AluCAD OS' }: AluCalcLogoProps) {
  const src = size <= 32 ? '/branding/alucad-mark-64.png' : '/branding/alucad-mark-128.png';
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        srcSet={`/branding/alucad-mark-64.png 64w, /branding/alucad-mark-128.png 128w, /branding/alucalculator-256.png 256w`}
        sizes={`${size}px`}
        width={size}
        height={size}
        alt={title}
        draggable={false}
        className="h-full w-full select-none object-contain"
      />
    </span>
  );
}

/**
 * Legacy vector fallback (kept so old imports compile). Returns a small SVG that
 * embeds the raster mark — used nowhere for theming any more.
 */
export function aluLogoSvg(_c?: { bg: string; frame: string; accent: string }, px = 32): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}"><image href="/branding/alucad-mark-64.png" width="${px}" height="${px}"/></svg>`;
}

/** Wordmark: "AluCAD OS" */
export function AluWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`whitespace-nowrap text-[15px] font-semibold tracking-tight text-[var(--ink)] ${className}`}>
      AluCAD<span className="text-[var(--cyan)]"> OS</span>
    </span>
  );
}

export default AluCalcLogo;
