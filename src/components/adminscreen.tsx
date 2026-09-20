import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Download,
  DownloadCloud,
  FileJson,
  Filter,
  Globe2,
  KeyRound,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';

type CountItem = { name: string; count: number };
type ActivityItem = {
  id: string;
  name: string;
  timestamp: string;
  country: string;
  platform?: string;
  format?: string;
  success?: boolean;
};
type Metrics = {
  generatedAt: string;
  capturedSince: string;
  retention: string;
  pageViews: number;
  activeUsers: number;
  downloadsStarted: number;
  downloadsCompleted: number;
  downloadsFailed: number;
  successRate: number;
  countries: CountItem[];
  platforms: CountItem[];
  formats: CountItem[];
  recentActivity: ActivityItem[];
};

const countryNames: Record<string, string> = {
  PK: 'Pakistan',
  US: 'United States',
  IN: 'India',
  GB: 'United Kingdom',
  AE: 'United Arab Emirates',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  SA: 'Saudi Arabia',
  Unknown: 'Unknown location',
  TR: 'Türkiye',
  RU: 'Russia',
  ES: 'Spain',
  IT: 'Italy',
  BD: 'Bangladesh',
};

const countryPoints: Record<string, [number, number]> = {
  US: [185, 132], CA: [180, 98], MX: [175, 178], BR: [275, 235], GB: [340, 105],
  DE: [375, 122], FR: [360, 138], NG: [365, 220], ZA: [400, 292], AE: [438, 183], TR: [407, 148], RU: [455, 98], ES: [344, 155], IT: [370, 160], BD: [527, 208],
  PK: [476, 164], IN: [505, 190], CN: [550, 148], JP: [616, 155], AU: [610, 287],
};

function displayName(value: string) {
  return countryNames[value] || value;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function WorldMap({ countries }: { countries: CountItem[] }) {
  const max = Math.max(...countries.map((item) => item.count), 1);
  const mapped = countries.filter((item) => Boolean(countryPoints[item.name])).length;
  const unmapped = Math.max(0, countries.length - mapped);
  const labels = countries.filter((item) => Boolean(countryPoints[item.name])).map((item) => displayName(item.name)).join(", ");
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#00ffd5]/20 bg-[#031118] p-3">
      <svg viewBox="0 0 720 340" className="h-[280px] w-full" role="img" aria-label={"Live visitor country map. " + (labels || "No country data yet")}>
        <defs>
          <pattern id="admin-grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#00ffd5" strokeOpacity=".08" strokeWidth="1" />
          </pattern>
          <filter id="admin-glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width="720" height="340" fill="url(#admin-grid)" />
        <path d="M72 92 128 64 190 78 216 115 193 137 153 129 130 158 91 143 56 116ZM211 171 250 190 270 227 254 274 225 258 214 223 184 196ZM306 84 350 66 379 78 405 107 393 135 356 130 339 158 309 142 288 113ZM394 161 435 155 461 179 450 204 423 215 407 244 381 227 388 194ZM483 76 548 82 588 111 616 146 593 178 548 165 522 184 489 159 468 126ZM549 228 613 228 650 250 628 278 573 275 538 253Z" fill="#0b3842" stroke="#1a8182" strokeOpacity=".7" strokeWidth="2" />
        <path d="M25 170H695M360 30V310" stroke="#00ffd5" strokeOpacity=".12" strokeDasharray="3 8" />
        {countries.map((item) => {
          const point = countryPoints[item.name];
          if (!point) return null;
          const intensity = item.count / max;
          const radius = 5 + intensity * 12;
          return (
            <g key={item.name} tabIndex={0} className="outline-none">
              <title>{displayName(item.name)}: {item.count} signals</title>
              <circle cx={point[0]} cy={point[1]} r={radius + 9} fill="#00ffd5" opacity={0.05 + intensity * 0.1} />
              <circle cx={point[0]} cy={point[1]} r={radius + 3} fill="none" stroke="#00ffd5" strokeOpacity=".25" strokeDasharray="2 4" />
              <circle cx={point[0]} cy={point[1]} r={radius} fill="#00ffd5" opacity=".92" />
              <text x={point[0] + 12} y={point[1] + 4} fill="#d8fffa" fontSize="11" fontFamily="monospace">{item.name} {item.count}</text>
            </g>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#00ffd5]/60">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#00ffd5]" /> Live geo telemetry
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-white/40">
        <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#00ffd5]" />Signal intensity</span>
        <span>{mapped} mapped countries</span>
        {unmapped > 0 && <span>{unmapped} other / unknown</span>}
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, tone = 'cyan' }: { label: string; value: string | number; icon: React.ElementType; tone?: 'cyan' | 'green' | 'amber' }) {
  const color = tone === 'green' ? 'text-[#00e599]' : tone === 'amber' ? 'text-[#ffd166]' : 'text-[#00ffd5]';
  return (
    <div className="rounded-2xl border border-[#00ffd5]/15 bg-[#041820]/90 p-4 shadow-[0_0_25px_rgba(0,255,213,0.05)]">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/45">
        <span>{label}</span><Icon size={16} className={color} />
      </div>
      <div className={`mt-3 font-display text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

export const AdminScreen: React.FC = () => {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [eventFilter, setEventFilter] = useState('all');
  const filteredActivity = metrics?.recentActivity.filter((item) => eventFilter === 'all' || item.name === eventFilter) || [];
  const exportMetrics = () => {
    if (!metrics) return;
    const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rapid-analytics-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/metrics', { credentials: 'include' });
      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) throw new Error((await response.json()).error || 'Dashboard data unavailable.');
      setMetrics(await response.json() as Metrics);
      setAuthenticated(true);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Dashboard data unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadMetrics(); }, []);
  useEffect(() => {
    if (!authenticated) return undefined;
    const timer = window.setInterval(() => void loadMetrics(), 15_000);
    return () => window.clearInterval(timer);
  }, [authenticated]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Login failed.');
      setPassword('');
      setAuthenticated(true);
      await loadMetrics();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
    setAuthenticated(false);
    setMetrics(null);
  };

  if (!authenticated || !metrics) {
    return (
      <main className="min-h-screen bg-[#02090d] px-4 py-16 font-mono-cyber text-[#e0f7f6]">
        <div className="mx-auto max-w-md rounded-3xl border border-[#00ffd5]/20 bg-[#041820] p-7 shadow-[0_0_60px_rgba(0,255,213,0.12)]">
          <div className="mb-8 flex items-center gap-3"><div className="rounded-xl bg-[#00ffd5]/10 p-3 text-[#00ffd5]"><KeyRound /></div><div><p className="text-[10px] uppercase tracking-[0.25em] text-[#00ffd5]/60">Rapid command center</p><h1 className="font-display text-2xl font-bold">Admin telemetry</h1></div></div>
          <p className="mb-6 text-sm leading-6 text-white/60">Private dashboard for live traffic, countries, active users, and verified download activity.</p>
          <form onSubmit={login} className="space-y-3"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Admin password" autoComplete="current-password" className="w-full rounded-xl border border-[#00ffd5]/20 bg-[#020d12] px-4 py-3 text-white outline-none focus:border-[#00ffd5]" /><button disabled={loading || !password} className="w-full rounded-xl bg-[#00ffd5] px-4 py-3 font-bold text-[#021318] disabled:cursor-not-allowed disabled:opacity-40">{loading ? 'VERIFYING...' : 'ENTER COMMAND CENTER'}</button></form>
          {error && <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#02090d] px-3 py-5 font-mono-cyber text-[#e0f7f6] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#00ffd5]/15 bg-[#041820]/90 px-5 py-4">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-[#00ffd5]/10 p-3 text-[#00ffd5]"><Activity /></div><div><p className="text-[10px] uppercase tracking-[0.25em] text-[#00ffd5]/60">Rapid command center // live</p><h1 className="font-display text-2xl font-bold">Traffic intelligence</h1></div></div>
          <div className="flex items-center gap-2"><button onClick={exportMetrics} className="flex items-center gap-2 rounded-lg border border-[#00ffd5]/20 px-3 py-2 text-xs text-[#00ffd5] hover:bg-[#00ffd5]/10" title="Export JSON"><FileJson size={16} /><span className="hidden sm:inline">Export</span></button><button onClick={() => void loadMetrics()} className="rounded-lg border border-[#00ffd5]/20 p-2 text-[#00ffd5] hover:bg-[#00ffd5]/10" title="Refresh"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button><button onClick={() => void logout()} className="flex items-center gap-2 rounded-lg border border-[#00ffd5]/20 px-3 py-2 text-xs text-white/70 hover:text-white"><LogOut size={15} /> Exit</button></div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <MetricCard label="Active now" value={metrics.activeUsers} icon={Users} tone="green" />
          <MetricCard label="Page views" value={metrics.pageViews} icon={Globe2} />
          <MetricCard label="Downloads started" value={metrics.downloadsStarted} icon={Download} />
          <MetricCard label="Completed" value={metrics.downloadsCompleted} icon={ShieldCheck} tone="green" />
          <MetricCard label="Failed" value={metrics.downloadsFailed} icon={AlertTriangle} tone="amber" />
          <MetricCard label="Success rate" value={`${metrics.successRate}%`} icon={Zap} tone="amber" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
          <div className="rounded-2xl border border-[#00ffd5]/15 bg-[#041820]/90 p-4"><div className="mb-3 flex items-center justify-between"><div><h2 className="font-display text-lg font-bold">Global activity map</h2><p className="text-[11px] text-white/45">Countries detected from live requests and page views</p></div><span className="rounded-full border border-[#00e599]/30 px-2 py-1 text-[10px] text-[#00e599]">ONLINE</span></div><WorldMap countries={metrics.countries} /></div>
          <div className="rounded-2xl border border-[#00ffd5]/15 bg-[#041820]/90 p-4"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-lg font-bold">Top countries</h2><p className="text-[11px] text-white/45">Visitor share by country</p></div><ArrowUpRight size={17} className="text-[#00ffd5]" /></div><div className="space-y-3">{metrics.countries.length ? metrics.countries.map((item, index) => <div key={item.name}><div className="mb-1 flex justify-between text-xs"><span className="text-white/80">{index + 1}. {displayName(item.name)}</span><span className="text-[#00ffd5]">{item.count}</span></div><div className="h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-[#00ffd5]" style={{ width: `${Math.max(8, (item.count / Math.max(metrics.countries[0].count, 1)) * 100)}%` }} /></div></div>) : <p className="text-sm text-white/45">No page-view data yet.</p>}</div></div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#00ffd5]/15 bg-[#041820]/90 p-4"><h2 className="font-display text-lg font-bold">Platform downloads</h2><div className="mt-4 space-y-3">{metrics.platforms.length ? metrics.platforms.map((item) => <div key={item.name} className="flex items-center justify-between rounded-xl bg-[#020d12] px-3 py-2 text-sm"><span className="capitalize text-white/75">{item.name}</span><span className="font-bold text-[#00ffd5]">{item.count}</span></div>) : <p className="mt-4 text-sm text-white/45">No download data yet.</p>}</div></div>
          <div className="rounded-2xl border border-[#00ffd5]/15 bg-[#041820]/90 p-4"><h2 className="font-display text-lg font-bold">Format mix</h2><div className="mt-4 space-y-3">{metrics.formats.length ? metrics.formats.map((item) => <div key={item.name} className="flex items-center justify-between rounded-xl bg-[#020d12] px-3 py-2 text-sm"><span className="uppercase text-white/75">{item.name}</span><span className="font-bold text-[#00e599]">{item.count}</span></div>) : <p className="mt-4 text-sm text-white/45">No format data yet.</p>}</div><p className="mt-5 text-xs text-white/35">Failed jobs: {metrics.downloadsFailed}</p></div>
          <div className="rounded-2xl border border-[#00ffd5]/15 bg-[#041820]/90 p-4"><h2 className="font-display text-lg font-bold">Data status</h2><div className="mt-4 space-y-3 text-xs text-white/60"><p><span className="text-[#00ffd5]">Captured since:</span> {new Date(metrics.capturedSince).toLocaleString()}</p><p><span className="text-[#00ffd5]">Last refresh:</span> {new Date(metrics.generatedAt).toLocaleTimeString()}</p><p><span className="text-[#00ffd5]">Retention:</span> {metrics.retention}</p><p><span className="text-[#00ffd5]">Recent feed:</span> {metrics.recentActivity.length} events</p><p className="rounded-xl border border-[#ffd166]/20 bg-[#ffd166]/5 p-3 text-[#ffe7a5]">For historical reporting after a restart, add a GA4 measurement ID or connect durable storage.</p></div></div>
        </section>

        <section className="rounded-2xl border border-[#00ffd5]/15 bg-[#041820]/90 p-4"><div className="mb-3 flex items-center justify-between"><div><h2 className="font-display text-lg font-bold">Recent signal feed</h2><p className="text-[11px] text-white/45">Latest events captured by the service</p></div><div className="flex flex-wrap items-center justify-end gap-2"><label className="flex items-center gap-1 rounded-lg border border-[#00ffd5]/15 bg-[#020d12] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/50"><Filter size={13} className="text-[#00ffd5]" /><select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)} className="bg-transparent text-[#00ffd5] outline-none"><option value="all">All events</option><option value="page_view">Page views</option><option value="download_started">Started</option><option value="download_completed">Completed</option><option value="download_failed">Failed</option></select></label><span className="text-[10px] uppercase tracking-[0.18em] text-[#00ffd5]/60">Auto refresh 15s</span></div></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="text-[10px] uppercase tracking-[0.16em] text-white/35"><tr><th className="pb-3">Event</th><th className="pb-3">Country</th><th className="pb-3">Platform</th><th className="pb-3">Format</th><th className="pb-3">Time</th><th className="pb-3">Status</th></tr></thead><tbody>{filteredActivity.map((item) => <tr key={item.id} className="border-t border-white/5"><td className="py-3 text-white/75">{item.name.replaceAll('_', ' ')}</td><td className="py-3 text-[#00ffd5]">{item.country}</td><td className="py-3 capitalize text-white/60">{item.platform || '—'}</td><td className="py-3 uppercase text-white/60">{item.format || '—'}</td><td className="py-3 text-white/45">{formatTime(item.timestamp)}</td><td className={`py-3 ${item.success === false ? 'text-red-300' : 'text-[#00e599]'}`}>{item.success === false ? 'FAILED' : 'CAPTURED'}</td></tr>)}</tbody></table>{!filteredActivity.length && <p className="py-8 text-center text-sm text-white/40">Waiting for the first signal.</p>}</div></section>
      </div>
    </main>
  );
};
