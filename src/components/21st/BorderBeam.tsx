'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
  rx?: number;
}

export function BorderBeam({
  className,
  size = 180,
  duration = 8,
  borderWidth = 1.5,
  colorFrom = '#00e5ff',
  colorTo = '#3b82f6',
  delay = 0,
  rx = 16,
}: BorderBeamProps) {
  const gradientId = React.useId();

  return (
    <div className={cn('pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden', className)}>
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorFrom} stopOpacity="1" />
            <stop offset="60%" stopColor={colorTo} stopOpacity="0.8" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.rect
          x={borderWidth / 2}
          y={borderWidth / 2}
          width="calc(100% - 1px)"
          height="calc(100% - 1px)"
          rx={rx}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={borderWidth}
          strokeDasharray={`${size} 800`}
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: -1600 }}
          transition={{
            repeat: Infinity,
            duration,
            ease: 'linear',
            delay,
          }}
        />
      </svg>
    </div>
  );
}

export default BorderBeam;
