import type { Theme } from '@/store/osStore';
import type { MobileFontSize } from '@/mobile/store/mobileStore';

export const MOBILE_APP_VERSION = '5.0.0';

export function getMobileThemeClasses(theme: Theme, isLight: boolean): string {
  if (isLight || theme === 'light') {
    return 'bg-slate-50 text-slate-900 [--mobile-accent:#0891b2] [--mobile-surface:#ffffff]';
  }
  return 'bg-[#020408] text-slate-100 [--mobile-accent:#06b6d4] [--mobile-surface:#0a0e14]';
}

export function getFontSizeClass(size: MobileFontSize): string {
  switch (size) {
    case 'small':
      return 'text-[13px]';
    case 'large':
      return 'text-[17px]';
    default:
      return 'text-[15px]';
  }
}

export function getMotionClass(reduceMotion: boolean): string {
  return reduceMotion ? 'motion-reduce' : '';
}
