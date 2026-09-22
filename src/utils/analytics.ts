type AnalyticsParams = {
  path?: string;
  platform?: string;
  format?: string;
  quality?: string;
  success?: boolean;
  [key: string]: string | boolean | undefined;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const visitorKey = 'rapid_visitor_id';
const retryQueueKey = 'rapid_analytics_retry_queue_v1';
let visitorId: string | undefined;
let analyticsInitialized = false;

function getVisitorId() {
  if (visitorId) return visitorId;
  try {
    visitorId = localStorage.getItem(visitorKey) || undefined;
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem(visitorKey, visitorId);
    }
  } catch {
    visitorId = `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  return visitorId;
}

type QueuedEvent = { name: string; visitorId: string; [key: string]: string | boolean | undefined };

function readRetryQueue(): QueuedEvent[] {
  try {
    const value = JSON.parse(localStorage.getItem(retryQueueKey) || '[]');
    return Array.isArray(value) ? value.slice(-20) : [];
  } catch {
    return [];
  }
}

function writeRetryQueue(events: QueuedEvent[]) {
  try {
    localStorage.setItem(retryQueueKey, JSON.stringify(events.slice(-20)));
  } catch {
    // Analytics must never interfere with the downloader.
  }
}

async function postEvent(payload: QueuedEvent) {
  const response = await fetch('/api/analytics/event', {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      'X-Visitor-Id': payload.visitorId,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Analytics request failed with ' + response.status);
}

function flushRetryQueue() {
  const queued = readRetryQueue();
  if (!queued.length) return;
  writeRetryQueue([]);
  void Promise.all(queued.map((event) => postEvent(event))).catch(() => {
    writeRetryQueue(queued);
  });
}

export function initAnalytics() {
  if (analyticsInitialized) return;
  analyticsInitialized = true;
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (!measurementId || document.querySelector(`script[data-rapid-ga="${measurementId}"]`)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { anonymize_ip: true });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.rapidGa = measurementId;
  document.head.appendChild(script);
}

export function trackEvent(name: string, params: AnalyticsParams = {}) {
  initAnalytics();
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (measurementId && window.gtag) window.gtag('event', name, params);

  flushRetryQueue();
  const currentVisitorId = getVisitorId();
  const payload = {
    name,
    visitorId: currentVisitorId,
    ...params,
    path: params.path || window.location.pathname,
  };

  // Beacon survives a tab close better than a normal fetch, which matters for page_view.
  if (name === 'page_view' && navigator.sendBeacon) {
    const sent = navigator.sendBeacon(
      '/api/analytics/event',
      new Blob([JSON.stringify(payload)], { type: 'application/json' }),
    );
    if (sent) return;
  }

  void postEvent(payload).catch(() => {
    writeRetryQueue([...readRetryQueue(), payload]);
  });
}
