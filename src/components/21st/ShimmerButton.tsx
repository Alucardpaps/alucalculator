'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ShimmerButton({
  shimmerColor = '#00e5ff',
  shimmerSize = '0.1em',
  shimmerDuration = '2.5s',
  borderRadius = '12px',
  background = 'radial-gradient(ellipse 80% 80% at 50% -20%,rgba(14,165,233,0.3),rgba(2,6,23,0.95))',
  className,
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      style={
        {
          '--spread': '90deg',
          '--shimmer-color': shimmerColor,
          '--radius': borderRadius,
          '--speed': shimmerDuration,
          '--cut': shimmerSize,
          '--bg': background,
        } as React.CSSProperties
      }
      className={cn(
        'group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3.5 text-white [background:var(--bg)] [border-radius:var(--radius)] transition-all duration-300 hover:scale-[1.02] hover:border-cyan-400/40 active:scale-[0.98]',
        className
      )}
      {...props}
    >
      {/* Spark container */}
      <div
        className={cn(
          '-z-30 blur-[2px]',
          'pointer-events-none absolute inset-0 overflow-visible [container-type:size]'
        )}
      >
        {/* Spark */}
        <div className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
          {/* Spark before */}
          <div className="animate-spin-around absolute -inset-full w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
        </div>
      </div>

      {/* Backdrop */}
      <div
        className={cn(
          'insert-0 absolute size-full',
          'rounded-[var(--radius)] px-4 py-1.5 text-sm font-medium shadow-[inset_0_-2px_6px_rgba(255,255,255,0.1)]'
        )}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2 font-bold text-sm tracking-wide text-white">
        {children}
      </span>
    </button>
  );
}

export default ShimmerButton;
