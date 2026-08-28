const DAILY_IMAGE_COUNT_LIMIT = 10;
const DAILY_IMAGE_BYTES_LIMIT = 2 * 1024 * 1024; // 2 MB
const MAX_IMAGE_DIMENSION = 1280;
const MAX_SCREENSHOT_BYTES = 400 * 1024; // 400 KB
const QUOTA_STORAGE_KEY = 'alucalc_feedback_daily_quota_v1';

interface DailyQuotaRecord {
  date: string;
  count: number;
  bytes: number;
}

export function checkDailyScreenshotQuota(estimatedBytes = 0): {
  allowed: boolean;
  remainingCount: number;
  remainingBytes: number;
  reason?: string;
} {
  if (typeof window === 'undefined') {
    return { allowed: true, remainingCount: 10, remainingBytes: 2097152 };
  }

  const today = new Date().toISOString().split('T')[0];
  let record: DailyQuotaRecord = { date: today, count: 0, bytes: 0 };

  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        record = parsed;
      }
    }
  } catch {
    // Ignore storage issues
  }

  const remainingCount = Math.max(0, DAILY_IMAGE_COUNT_LIMIT - record.count);
  const remainingBytes = Math.max(0, DAILY_IMAGE_BYTES_LIMIT - record.bytes);

  if (record.count >= DAILY_IMAGE_COUNT_LIMIT) {
    return {
      allowed: false,
      remainingCount: 0,
      remainingBytes,
      reason: 'Günlük ekran görüntüsü kotası (10 adet) doldu.',
    };
  }

  if (record.bytes + estimatedBytes > DAILY_IMAGE_BYTES_LIMIT) {
    return {
      allowed: false,
      remainingCount,
      remainingBytes: 0,
      reason: 'Günlük ekran görüntüsü veri boyutu kotası (2 MB) doldu.',
    };
  }

  return {
    allowed: true,
    remainingCount,
    remainingBytes,
  };
}

export function recordScreenshotQuotaUsage(byteLength: number): void {
  if (typeof window === 'undefined') return;
  const today = new Date().toISOString().split('T')[0];
  let record: DailyQuotaRecord = { date: today, count: 0, bytes: 0 };

  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        record = parsed;
      }
    }
    record.count += 1;
    record.bytes += byteLength;
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Ignore
  }
}

export function maskSensitiveInputs(): () => void {
  if (typeof document === 'undefined') return () => {};

  const sensitiveElements = document.querySelectorAll<HTMLInputElement>(
    'input[data-sensitive="true"], [data-privacy="sensitive"]',
  );

  const originalValues: Array<{ el: HTMLInputElement; val: string }> = [];

  sensitiveElements.forEach((el) => {
    originalValues.push({ el, val: el.value });
    el.value = '••••••••';
  });

  return () => {
    originalValues.forEach(({ el, val }) => {
      el.value = val;
    });
  };
}

/**
 * Captures a Three.js / WebGL renderer screenshot in the same tick.
 * Avoids keeping preserveDrawingBuffer: true permanently.
 */
export function captureRendererScreenshot(
  renderer: { render: (scene: any, camera: any) => void; domElement: HTMLCanvasElement },
  scene: any,
  camera: any,
  quality = 0.7,
): string {
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/jpeg', quality);
}

export async function captureCanvasScreenshot(): Promise<{
  dataUrl: string;
  byteLength: number;
  width: number;
  height: number;
} | null> {
  if (typeof document === 'undefined') return null;

  // Search for 3D/WebGL or 2D canvas in view
  const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    return null;
  }

  try {
    let targetWidth = canvas.width;
    let targetHeight = canvas.height;

    // Scale down if exceeds MAX_IMAGE_DIMENSION
    if (targetWidth > MAX_IMAGE_DIMENSION || targetHeight > MAX_IMAGE_DIMENSION) {
      if (targetWidth >= targetHeight) {
        targetHeight = Math.round((targetHeight * MAX_IMAGE_DIMENSION) / targetWidth);
        targetWidth = MAX_IMAGE_DIMENSION;
      } else {
        targetWidth = Math.round((targetWidth * MAX_IMAGE_DIMENSION) / targetHeight);
        targetHeight = MAX_IMAGE_DIMENSION;
      }
    }

    const offscreen = document.createElement('canvas');
    offscreen.width = targetWidth;
    offscreen.height = targetHeight;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

    // Initial 0.7 quality JPEG
    let quality = 0.7;
    let dataUrl = offscreen.toDataURL('image/jpeg', quality);
    let approxBytes = Math.round((dataUrl.length * 3) / 4);

    // If larger than 400 KB, compress further
    if (approxBytes > MAX_SCREENSHOT_BYTES) {
      quality = 0.4;
      dataUrl = offscreen.toDataURL('image/jpeg', quality);
      approxBytes = Math.round((dataUrl.length * 3) / 4);
    }

    return {
      dataUrl,
      byteLength: approxBytes,
      width: targetWidth,
      height: targetHeight,
    };
  } catch (err) {
    console.error('Canvas capture failed:', err);
    return null;
  }
}
