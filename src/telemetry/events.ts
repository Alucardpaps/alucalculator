export interface TelemetryEvent {
  session_id: string;
  page: string; // pathname only, search/hash strictly excluded!
  feature: string; // e.g. gear.solve | share.export | feedback.send
  action: string;
  plan: 'free' | 'pro' | 'team';
  ts: number;
}

export function getCleanPathname(): string {
  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }
  return '/';
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  const key = 'alucalc_telemetry_session_id';
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    sessionStorage.setItem(key, sid);
  }
  return sid;
}
