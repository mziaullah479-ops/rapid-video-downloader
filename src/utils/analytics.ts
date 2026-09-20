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

  const payload = {
    name,
    ...params,
    path: params.path || window.location.pathname,
  };
  void fetch('/api/analytics/event', {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      'X-Visitor-Id': getVisitorId(),
    },
    body: JSON.stringify(payload),
  }).catch(() => undefined);
}
