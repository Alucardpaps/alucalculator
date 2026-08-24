'use client';

import React from 'react';

type FlagIconProps = {
  lang: string;
  className?: string;
};

export function FlagIcon({ lang, className = 'w-5 h-3.5 shrink-0 object-cover rounded-sm overflow-hidden' }: FlagIconProps) {
  const code = lang.toLowerCase();

  switch (code) {
    case 'en':
      // US flag representation
      return (
        <svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="20" height="14" fill="#FFFFFF"/>
          <path d="M0 0h20v1.07H0V0zm0 2.15h20v1.08H0V2.15zm0 2.16h20v1.07H0V4.31zm0 2.15h20v1.08H0V6.46zm0 2.16h20v1.07H0V8.62zm0 2.15h20v1.08H0v-1.08zm0 2.16h20V14H0v-1.08z" fill="#B22234"/>
          <rect width="10" height="7.54" fill="#3C3B6E"/>
          {/* Simplified stars representation */}
          <circle cx="2" cy="1.8" r="0.45" fill="#FFFFFF"/>
          <circle cx="5" cy="1.8" r="0.45" fill="#FFFFFF"/>
          <circle cx="8" cy="1.8" r="0.45" fill="#FFFFFF"/>
          <circle cx="3.5" cy="3.8" r="0.45" fill="#FFFFFF"/>
          <circle cx="6.5" cy="3.8" r="0.45" fill="#FFFFFF"/>
          <circle cx="2" cy="5.8" r="0.45" fill="#FFFFFF"/>
          <circle cx="5" cy="5.8" r="0.45" fill="#FFFFFF"/>
          <circle cx="8" cy="5.8" r="0.45" fill="#FFFFFF"/>
        </svg>
      );

    case 'tr':
      // Turkish flag representation
      return (
        <svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="20" height="14" fill="#E30A17"/>
          <circle cx="7.5" cy="7" r="3.2" fill="#FFFFFF"/>
          <circle cx="8.7" cy="7" r="2.56" fill="#E30A17"/>
          <path d="M11.8 5.7l.4 1.3 1.3.1-.9.8.3 1.3-1.1-.8-1.1.8.3-1.3-.9-.8 1.3-.1.4-1.3z" fill="#FFFFFF"/>
        </svg>
      );

    case 'de':
      // German flag representation
      return (
        <svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="20" height="4.67" fill="#000000"/>
          <rect y="4.67" width="20" height="4.67" fill="#DD0000"/>
          <rect y="9.33" width="20" height="4.67" fill="#FFCC00"/>
        </svg>
      );

    case 'es':
      // Spanish flag representation
      return (
        <svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="20" height="3.5" fill="#C60B1E"/>
          <rect y="3.5" width="20" height="7" fill="#FBE122"/>
          <rect y="10.5" width="20" height="3.5" fill="#C60B1E"/>
          {/* Simplified coat of arms */}
          <rect x="4.5" y="5.5" width="1.5" height="3" fill="#C60B1E" opacity="0.85" rx="0.2"/>
          <circle cx="5.25" cy="4.8" r="0.4" fill="#FFF" opacity="0.9"/>
        </svg>
      );

    case 'fr':
      // French flag representation
      return (
        <svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="6.67" height="14" fill="#0055A5"/>
          <rect x="6.67" width="6.67" height="14" fill="#FFFFFF"/>
          <rect x="13.33" width="6.67" height="14" fill="#EF4135"/>
        </svg>
      );

    case 'it':
      // Italian flag representation
      return (
        <svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="6.67" height="14" fill="#009246"/>
          <rect x="6.67" width="6.67" height="14" fill="#FFFFFF"/>
          <rect x="13.33" width="6.67" height="14" fill="#F14436"/>
        </svg>
      );

    case 'pt':
      // Portuguese flag representation
      return (
        <svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="8" height="14" fill="#006600"/>
          <rect x="8" width="12" height="14" fill="#FF0000"/>
          {/* Simplified coat of arms */}
          <circle cx="8" cy="7" r="2.2" fill="#FFFF00" opacity="0.9"/>
          <circle cx="8" cy="7" r="1.3" fill="#FF0000"/>
          <rect x="7.6" y="6.6" width="0.8" height="0.8" fill="#000080"/>
        </svg>
      );

    case 'ru':
      // Russian flag representation
      return (
        <svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="20" height="4.67" fill="#FFFFFF"/>
          <rect y="4.67" width="20" height="4.67" fill="#0039A6"/>
          <rect y="9.33" width="20" height="4.67" fill="#D52B1E"/>
        </svg>
      );

    case 'zh':
      // Chinese flag representation
      return (
        <svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="20" height="14" fill="#DE2910"/>
          <path d="M4.5 2.5l.4 1.2 1.2.1-.9.8.3 1.2-1-.8-1 .8.3-1.2-.9-.8 1.2-.1z" fill="#FFDE00"/>
          <circle cx="7.5" cy="2" r="0.32" fill="#FFDE00"/>
          <circle cx="8.5" cy="3.2" r="0.32" fill="#FFDE00"/>
          <circle cx="8.5" cy="4.8" r="0.32" fill="#FFDE00"/>
          <circle cx="7.5" cy="6" r="0.32" fill="#FFDE00"/>
        </svg>
      );

    case 'ja':
      // Japanese flag representation
      return (
        <svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="20" height="14" fill="#FFFFFF"/>
          <circle cx="10" cy="7" r="3.8" fill="#BC002D"/>
        </svg>
      );

    case 'ko':
      // South Korean flag representation
      return (
        <svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="20" height="14" fill="#FFFFFF"/>
          {/* Taegeuk */}
          <path d="M10 3.8a3.2 3.2 0 000 6.4c1.6 0 1.6-3.2 3.2-3.2S14.8 3.8 10 3.8z" fill="#0A50A1"/>
          <path d="M10 3.8a3.2 3.2 0 000 6.4c-1.6 0-1.6-3.2-3.2-3.2S5.2 3.8 10 3.8z" fill="#C60C30"/>
          {/* Minimalist trigrams */}
          <line x1="4.5" y1="3.2" x2="6.5" y2="4.2" stroke="#000000" strokeWidth="0.6"/>
          <line x1="13.5" y1="4.2" x2="15.5" y2="3.2" stroke="#000000" strokeWidth="0.6"/>
          <line x1="4.5" y1="10.8" x2="6.5" y2="9.8" stroke="#000000" strokeWidth="0.6"/>
          <line x1="13.5" y1="9.8" x2="15.5" y2="10.8" stroke="#000000" strokeWidth="0.6"/>
        </svg>
      );

    case 'ar':
      // UAE flag (very clean representant for generic Arabic locale)
      return (
        <svg viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="5" height="14" fill="#FF0000"/>
          <rect x="5" width="15" height="4.67" fill="#00732F"/>
          <rect x="5" y="4.67" width="15" height="4.67" fill="#FFFFFF"/>
          <rect x="5" y="9.33" width="15" height="4.67" fill="#000000"/>
        </svg>
      );

    default:
      // Fallback is a globe icon or clean code box
      return (
        <span className="text-[10px] font-black font-mono border border-white/20 px-1 rounded bg-white/5 tracking-tighter">
          {code.toUpperCase()}
        </span>
      );
  }
}
