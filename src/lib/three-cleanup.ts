import * as THREE from 'three';

if (typeof window !== 'undefined') {
  (THREE as any).setConsoleFunction?.((type: 'log' | 'warn' | 'error', message: string, ...params: any[]) => {
    if (
      typeof message === 'string' &&
      (message.includes('Clock: This module has been deprecated') ||
       message.includes('PCFSoftShadowMap has been deprecated'))
    ) {
      return;
    }
    if (typeof (console as any)[type] === 'function') {
      (console as any)[type](message, ...params);
    }
  });
}
