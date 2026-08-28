import { TelemetryEvent, getCleanPathname, getSessionId } from './events';

const BATCH_SIZE_LIMIT_BYTES = 8 * 1024; // 8 KB
const FLUSH_INTERVAL_MS = 15 * 1000; // 15 seconds
const STORAGE_KEY = 'alucalc_telemetry_offline_queue_v1';
const CONSENT_TELEMETRY_KEY = 'alu_consent_telemetry';
const MAX_OFFLINE_EVENTS = 200;
const MAX_OFFLINE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

let fallbackMemoryStorage: Record<string, string> = {};

export function hasTelemetryConsent(): boolean {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(CONSENT_TELEMETRY_KEY) === '1';
    }
  } catch {
    // Ignore and use fallback
  }
  return fallbackMemoryStorage[CONSENT_TELEMETRY_KEY] === '1';
}

class TelemetryQueue {
  private queue: TelemetryEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private endpoint = '/api/telemetry';
  private isInitialized = false;

  public init(endpoint = '/api/telemetry'): void {
    this.endpoint = endpoint;

    // Strict consent check: If consent is NOT given ('1'), do NOT initialize or start timer!
    if (!hasTelemetryConsent()) {
      this.clear();
      return;
    }

    if (this.isInitialized) return;
    this.isInitialized = true;

    // Load offline stored events
    this.loadFromStorage();

    // Set 15-second flush interval
    this.timer = setInterval(() => {
      if (this.queue.length > 0 && hasTelemetryConsent()) {
        this.flush();
      }
    }, FLUSH_INTERVAL_MS);

    // Listen to visibility change & pagehide in browser
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const handleUnload = () => {
        if (this.queue.length > 0 && hasTelemetryConsent()) {
          this.flush(true);
        }
      };

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          handleUnload();
        }
      });

      window.addEventListener('pagehide', handleUnload);
    }
  }

  public setConsent(allowed: boolean): void {
    const val = allowed ? '1' : '0';
    fallbackMemoryStorage[CONSENT_TELEMETRY_KEY] = val;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CONSENT_TELEMETRY_KEY, val);
      }
    } catch {
      // Ignore
    }

    if (allowed) {
      this.init(this.endpoint);
    } else {
      this.clear();
    }
  }

  public clear(): void {
    this.queue = [];
    fallbackMemoryStorage = {};
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isInitialized = false;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  }

  public track(
    feature: string,
    action: string,
    plan: 'free' | 'pro' | 'team' = 'free',
  ): void {
    // If user has not consented, tracking is a strict NO-OP
    if (!hasTelemetryConsent()) {
      return;
    }

    const event: TelemetryEvent = {
      session_id: getSessionId(),
      page: getCleanPathname(),
      feature,
      action,
      plan,
      ts: Date.now(),
    };

    this.queue.push(event);
    this.saveToStorage();

    // Check 8KB limit
    const currentSize = new TextEncoder().encode(JSON.stringify(this.queue)).byteLength;
    if (currentSize >= BATCH_SIZE_LIMIT_BYTES) {
      this.flush();
    }
  }

  public async flush(isUnloading = false): Promise<void> {
    if (!hasTelemetryConsent() || this.queue.length === 0) {
      return;
    }

    const batch = [...this.queue];
    const payload = JSON.stringify({ events: batch });

    let sent = false;

    if (isUnloading && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      sent = navigator.sendBeacon(this.endpoint, blob);
    }

    if (!sent && typeof fetch !== 'undefined') {
      try {
        const res = await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: isUnloading,
        });
        if (res.ok) {
          sent = true;
        }
      } catch {
        sent = false;
      }
    }

    if (sent) {
      // Remove flushed batch
      this.queue = this.queue.slice(batch.length);
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    if (!hasTelemetryConsent()) return;
    try {
      if (typeof localStorage !== 'undefined') {
        const now = Date.now();
        const pruned = this.queue
          .filter((e) => now - e.ts < MAX_OFFLINE_AGE_MS)
          .slice(-MAX_OFFLINE_EVENTS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
      }
    } catch {
      // Storage quota or private browsing silently handled
    }
  }

  private loadFromStorage(): void {
    if (!hasTelemetryConsent()) return;
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          const loaded: TelemetryEvent[] = JSON.parse(data);
          const now = Date.now();
          const valid = loaded.filter((e) => now - e.ts < MAX_OFFLINE_AGE_MS);
          this.queue = [...valid, ...this.queue].slice(-MAX_OFFLINE_EVENTS);
        }
      }
    } catch {
      // Ignore
    }
  }
}

export const telemetry = new TelemetryQueue();

export function trackEvent(
  feature: string,
  action: string,
  plan: 'free' | 'pro' | 'team' = 'free',
): void {
  telemetry.track(feature, action, plan);
}
