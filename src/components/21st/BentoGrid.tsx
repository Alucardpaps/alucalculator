'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 auto-rows-[minmax(180px,auto)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3;
}

export function BentoCard({
  children,
  className,
  colSpan = 1,
  ...props
}: BentoCardProps) {
  const colSpanClasses = {
    1: 'col-span-1',
    2: 'col-span-1 md:col-span-2',
    3: 'col-span-1 md:col-span-2 lg:col-span-3',
  };

  return (
    <div
      className={cn(
        'rounded-[var(--radius-m)] transition-all duration-200',
        colSpanClasses[colSpan],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default BentoGrid;
