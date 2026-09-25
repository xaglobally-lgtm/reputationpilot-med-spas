// Reports this website's errors to its own backend, so Planet of the Apps can show them.
// Catches crashes, unhandled promise errors and failed API calls. Sends at most 10 reports per
// page visit, skips duplicates, strips query strings (which can hold tokens), and never throws.
import axios from 'axios';

const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MAX_REPORTS = 10;
const seen = new Set<string>();
let sent = 0;

const noQuery = (u: string) => { try { const x = new URL(u, location.href); return x.origin + x.pathname; } catch { return String(u).split('?')[0]; } };

function report(kind: 'js' | 'promise' | 'api' | 'network', message: string, extra: Record<string, unknown> = {}) {
  try {
    if (!message || sent >= MAX_REPORTS) return;
    const key = `${kind}:${message}`;
    if (seen.has(key)) return;
    seen.add(key);
    sent++;
    fetch(`${API_URL}/client-errors`, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, message: String(message).slice(0, 500), page: noQuery(location.href), ...extra }),
    }).catch(() => { /* reporting must never break the app */ });
  } catch { /* ignore */ }
}

window.addEventListener('error', (e: ErrorEvent) => {
  report('js', e.message || String(e.error), { stack: e.error instanceof Error ? e.error.stack : undefined });
});

window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
  const r: unknown = e.reason;
  report('promise', r instanceof Error ? r.message : String(r), { stack: r instanceof Error ? r.stack : undefined });
});

// Failed API calls. 401/403/404 are expected answers (e.g. the "Test API" button proves the API is protected).
axios.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = noQuery(err?.config?.url || '');
    if (!url.includes('/client-errors')) {
      const status: number | undefined = err?.response?.status;
      if (!status) report('network', `Network error calling ${url}`, { api: url });
      else if (![401, 403, 404].includes(status)) report('api', `API returned ${status} for ${url}`, { api: url, status });
    }
    return Promise.reject(err);
  },
);

export {};
