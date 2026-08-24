/**
 * Nesting Web Worker — delegates to shared packer.
 */

import type { NestingJob } from '@/types/nesting2d.types';
import { runNestingPacker } from '@/lib/nesting/packer';

self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

  if (type === 'start' && payload) {
    try {
      const job = payload as NestingJob;
      const result = runNestingPacker(job, (progress) => {
        self.postMessage({ type: 'progress', payload: progress });
      });
      self.postMessage({ type: 'complete', payload: result });
    } catch (error) {
      self.postMessage({
        type: 'error',
        payload: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  if (type === 'cancel') {
    self.postMessage({ type: 'cancelled' });
  }
};

export {};
