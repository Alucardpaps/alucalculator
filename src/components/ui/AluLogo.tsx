'use client';

import React from 'react';
import { AluCalcLogo } from './AluCalcLogo';

/** Legacy alias — renders the AluCAD OS emblem. */
export function AluLogo({ size = 24, className = '' }: { size?: number; className?: string }) {
  return <AluCalcLogo size={size} className={className} />;
}

export default AluLogo;
