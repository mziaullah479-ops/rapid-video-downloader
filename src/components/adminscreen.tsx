import React, { useEffect, useRef, useState } from 'react';
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
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type CountItem = { name: string; count: number };
type LocationItem = { city: string; country: string; latitude: number; longitude: number; count: number };
type ActivityItem = {
  id: string;
  name: string;
  timestamp: string;
  country: string;
  platform?: string;
  format?: string;
  success?: boolean;
  ipAddress?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
};
type Metrics = {
  generatedAt: string;
  capturedSince: string;
  retention: string;
  storagePath: string;
  archiveStatus: 'ephemeral' | 'persistent' | 'error';
  archiveConfigured: boolean;
  lastStoredAt?: string;
  archiveError?: string;
  eventCount: number;
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
  cities: CountItem[];
  uniqueIps: number;
  locations: LocationItem[];
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

function GeoMap({ locations }: { locations: LocationItem[] }) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;
    const map = L.map(mapElementRef.current, { zoomControl: false, worldCopyJump: true, minZoom: 1, maxZoom: 8 }).setView([20, 0], 1);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 120);
    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerLayerRef.current?.clearLayers();
    const layer = L.layerGroup().addTo(map);
    const bounds: [number, number][] = [];
    const maximum = Math.max(locations[0]?.count || 1, 1);
    locations.forEach((location) => {
      const point: [number, number] = [location.latitude, location.longitude];
      bounds.push(point);
      const intensity = Math.min(1, location.count / maximum);
      L.circleMarker(point, {
        radius: 7 + intensity * 12,
        color: "#00ffd5",
        weight: 2,
        fillColor: "#00ffd5",
        fillOpacity: 0.35 + intensity * 0.45,
      }).bindTooltip(location.city + " · " + location.country + " · " + location.count + " signals", { direction: "top", opacity: 0.95 }).addTo(layer);
    });
    markerLayerRef.current = layer;
    if (bounds.length) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 4 });
    return () => layer.remove();
  }, [locations]);

  return (
    <div className="overflow-hidden rounded-3xl border border-[#00ffd5]/25 bg-[#020e14] shadow-[0_0_50px_rgba(0,255,213,0.08)]">
      <div className="relative h-[560px]">
        <div ref={mapElementRef} className="h-full w-full" />
        <div className="pointer-events-none absolute left-5 top-5 flex flex-wrap items-center gap-2 rounded-full border border-[#00ffd5]/30 bg-[#021a22]/90 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[#9ffbef] shadow-lg">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#00ffd5] shadow-[0_0_12px_#00ffd5]" /> LIVE IP GEO INTELLIGENCE
        </div>
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl border border-white/10 bg-[#02090d]/85 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-white/60 backdrop-blur-md">{locations.length} mapped locations · zoom and drag enabled</div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#00ffd5]/15 px-5 py-3 text-[11px] text-white/60">
        <span>Marker size follows signal volume</span><span className="text-[#00ffd5]">City-level data appears after IP lookup</span>
      </div>
    </div>
  );
}

function GeoIntelligencePage({ metrics, onBack }: { metrics: Metrics; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-[10px] uppercase tracking-[0.28em] text-[#00ffd5]/70">Geo intelligence // dedicated view</p><h2 className="mt-2 font-display text-3xl font-bold text-white">Visitor locations</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">Live city and country signals derived from public IP geolocation. Exact IP values remain restricted to this protected admin panel.</p></div>
        <button onClick={onBack} className="rounded-xl border border-[#00ffd5]/30 px-4 py-2 text-xs font-bold tracking-[0.14em] text-[#9ffbef] hover:bg-[#00ffd5]/10">BACK TO OVERVIEW</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Mapped points" value={metrics.locations.length.toLocaleString()} icon={Globe2} />
        <MetricCard label="Unique IPs" value={metrics.uniqueIps.toLocaleString()} icon={Users} tone="green" />
        <MetricCard label="Cities" value={metrics.cities.length.toLocaleString()} icon={Activity} />
        <MetricCard label="Countries" value={metrics.countries.length.toLocaleString()} icon={DownloadCloud} tone="amber" />
      </div>
      <GeoMap locations={metrics.locations} />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-[#00ffd5]/15 bg-[#041820]/90 p-5"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-display text-xl font-bold">Cities by signal volume</h3><p className="text-xs text-white/45">Top detected cities across all stored events</p></div><span className="text-xs text-[#00ffd5]">{metrics.cities.length} cities</span></div><div className="space-y-3">{metrics.cities.slice(0, 12).map((item, index) => <div key={item.name} className="flex items-center gap-3"><span className="w-5 text-xs text-white/35">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-3 text-xs"><span className="truncate text-white/85">{item.name}</span><span className="text-[#00ffd5]">{item.count}</span></div><div className="mt-1 h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-[#00ffd5] to-[#00e599]" style={{ width: `${Math.max(5, (item.count / Math.max(metrics.cities[0]?.count || 1, 1)) * 100)}%` }} /></div></div></div>)}</div></section>
        <section className="rounded-3xl border border-[#00ffd5]/15 bg-[#041820]/90 p-5"><div className="mb-4"><h3 className="font-display text-xl font-bold">Location feed</h3><p className="text-xs text-white/45">Highest-confidence city coordinates currently available</p></div><div className="space-y-2">{metrics.locations.slice(0, 12).map((location) => <div key={location.city + location.country + location.latitude} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#020d12] px-3 py-3"><div><p className="text-sm font-bold text-white">{location.city}</p><p className="text-[11px] uppercase tracking-[0.12em] text-[#7feadc]">{location.country} · {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}</p></div><span className="rounded-full border border-[#00ffd5]/25 px-2 py-1 text-xs text-[#00ffd5]">{location.count}</span></div>)}</div></section>
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
  const [activeView, setActiveView] = useState<'overview' | 'geo'>(() => window.location.hash === '#geo' ? 'geo' : 'overview');
  const filteredActivity = metrics?.recentActivity.filter((item) => eventFilter === 'all' || item.name === eventFilter) || [];
  const exportMetrics = async () => {
    if (!metrics) return;
    const response = await fetch('/api/admin/events', { credentials: 'include' });
    const payload = response.ok ? await response.json() : metrics;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rapid-analytics-archive-' + new Date().toISOString().slice(0, 10) + '.json';
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
    <main className="min-h-screen bg-[#02090d] px-4 py-6 font-mono-cyber text-[#e0f7f6] sm:px-8 lg:px-12 xl:px-16">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#00ffd5]/15 bg-[#041820]/90 px-6 py-5">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-[#00ffd5]/10 p-3 text-[#00ffd5]"><Activity /></div><div><p className="text-[10px] uppercase tracking-[0.25em] text-[#00ffd5]/60">Rapid command center // live</p><h1 className="font-display text-2xl font-bold">Traffic intelligence</h1></div></div>
          <div className="flex items-center gap-2"><button onClick={exportMetrics} className="flex items-center gap-2 rounded-lg border border-[#00ffd5]/20 px-3 py-2 text-xs text-[#00ffd5] hover:bg-[#00ffd5]/10" title="Export JSON"><FileJson size={16} /><span className="hidden sm:inline">Export</span></button><button onClick={() => void loadMetrics()} className="rounded-lg border border-[#00ffd5]/20 p-2 text-[#00ffd5] hover:bg-[#00ffd5]/10" title="Refresh"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button><button onClick={() => void logout()} className="flex items-center gap-2 rounded-lg border border-[#00ffd5]/20 px-3 py-2 text-xs text-white/70 hover:text-white"><LogOut size={15} /> Exit</button></div>
        </header>
        <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#00ffd5]/15 bg-[#041820]/70 p-2">
          <button onClick={() => setActiveView('overview')} className={`rounded-xl px-4 py-2 text-xs font-bold tracking-[0.14em] ${activeView === 'overview' ? 'bg-[#00ffd5] text-[#021318]' : 'text-[#9ffbef] hover:bg-[#00ffd5]/10'}`}>OVERVIEW</button>
          <button onClick={() => { setActiveView('geo'); window.history.replaceState(null, "", "#geo"); }} className={`rounded-xl px-4 py-2 text-xs font-bold tracking-[0.14em] ${activeView === 'geo' ? 'bg-[#00ffd5] text-[#021318]' : 'text-[#9ffbef] hover:bg-[#00ffd5]/10'}`}>GEO INTELLIGENCE</button>
        </nav>


        {activeView === 'geo' ? <GeoIntelligencePage metrics={metrics} onBack={() => { setActiveView('overview'); window.history.replaceState(null, "", window.location.pathname); }} /> : <>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <MetricCard label="Active now" value={metrics.activeUsers} icon={Users} tone="green" />
          <MetricCard label="Page views" value={metrics.pageViews} icon={Globe2} />
          <MetricCard label="Downloads started" value={metrics.downloadsStarted} icon={Download} />
          <MetricCard label="Completed" value={metrics.downloadsCompleted} icon={ShieldCheck} tone="green" />
          <MetricCard label="Failed" value={metrics.downloadsFailed} icon={AlertTriangle} tone="amber" />
          <MetricCard label="Success rate" value={`${metrics.successRate}%`} icon={Zap} tone="amber" />
          <MetricCard label="Stored events" value={metrics.eventCount.toLocaleString()} icon={DownloadCloud} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
          <div className="rounded-2xl border border-[#00ffd5]/15 bg-[#041820]/90 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl font-bold">Geo intelligence</h2><p className="text-[11px] text-white/50">Open the dedicated live IP and city map</p></div><button onClick={() => { setActiveView('geo'); window.history.replaceState(null, "", "#geo"); }} className="rounded-xl border border-[#00ffd5]/30 px-3 py-2 text-[10px] font-bold tracking-[0.14em] text-[#9ffbef] hover:bg-[#00ffd5]/10">OPEN FULL MAP</button></div><div className="mt-5 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-[#020d12] p-3"><p className="text-2xl font-bold text-[#00ffd5]">{metrics.locations.length}</p><p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/45">Mapped</p></div><div className="rounded-xl bg-[#020d12] p-3"><p className="text-2xl font-bold text-[#00e599]">{metrics.cities.length}</p><p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/45">Cities</p></div><div className="rounded-xl bg-[#020d12] p-3"><p className="text-2xl font-bold text-[#ffd166]">{metrics.uniqueIps}</p><p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/45">IPs</p></div></div></div>
          <div className="rounded-2xl border border-[#00ffd5]/15 bg-[#041820]/90 p-4"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-lg font-bold">Top countries</h2><p className="text-[11px] text-white/45">Visitor share by country</p></div><ArrowUpRight size={17} className="text-[#00ffd5]" /></div><div className="space-y-3">{metrics.countries.length ? metrics.countries.map((item, index) => <div key={item.name}><div className="mb-1 flex justify-between text-xs"><span className="text-white/80">{index + 1}. {displayName(item.name)}</span><span className="text-[#00ffd5]">{item.count}</span></div><div className="h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-[#00ffd5]" style={{ width: `${Math.max(8, (item.count / Math.max(metrics.countries[0].count, 1)) * 100)}%` }} /></div></div>) : <p className="text-sm text-white/45">No page-view data yet.</p>}</div></div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#00ffd5]/15 bg-[#041820]/90 p-4"><h2 className="font-display text-lg font-bold">Platform downloads</h2><div className="mt-4 space-y-3">{metrics.platforms.length ? metrics.platforms.map((item) => <div key={item.name} className="flex items-center justify-between rounded-xl bg-[#020d12] px-3 py-2 text-sm"><span className="capitalize text-white/75">{item.name}</span><span className="font-bold text-[#00ffd5]">{item.count}</span></div>) : <p className="mt-4 text-sm text-white/45">No download data yet.</p>}</div></div>
          <div className="rounded-2xl border border-[#00ffd5]/15 bg-[#041820]/90 p-4"><h2 className="font-display text-lg font-bold">Format mix</h2><div className="mt-4 space-y-3">{metrics.formats.length ? metrics.formats.map((item) => <div key={item.name} className="flex items-center justify-between rounded-xl bg-[#020d12] px-3 py-2 text-sm"><span className="uppercase text-white/75">{item.name}</span><span className="font-bold text-[#00e599]">{item.count}</span></div>) : <p className="mt-4 text-sm text-white/45">No format data yet.</p>}</div><p className="mt-5 text-xs text-white/35">Failed jobs: {metrics.downloadsFailed}</p></div>
          <div className="rounded-2xl border border-[#00ffd5]/15 bg-[#041820]/90 p-5"><h2 className="font-display text-lg font-bold">Data status</h2>
            <div className="mt-4 space-y-3 text-xs text-white/70">
              <p><span className="text-[#00ffd5]">Captured since:</span> {new Date(metrics.capturedSince).toLocaleString()}</p>
              <p><span className="text-[#00ffd5]">Last refresh:</span> {new Date(metrics.generatedAt).toLocaleTimeString()}</p>
              <p><span className="text-[#00ffd5]">Stored events:</span> {metrics.eventCount.toLocaleString()}</p>
              <p><span className="text-[#00ffd5]">Archive mode:</span> {metrics.retention}</p>
              <p><span className="text-[#00ffd5]">Write status:</span> <span className={metrics.archiveStatus === 'error' ? 'text-red-300' : 'text-[#00e599]'}>{metrics.archiveStatus.toUpperCase()}</span></p>
              <p><span className="text-[#00ffd5]">Path:</span> {metrics.storagePath}</p>
              <p><span className="text-[#00ffd5]">Last stored:</span> {metrics.lastStoredAt ? new Date(metrics.lastStoredAt).toLocaleTimeString() : 'Waiting for first write'}</p>
              <p className="rounded-xl border border-[#00ffd5]/20 bg-[#00ffd5]/5 p-3 text-[#b8fff6]">{metrics.archiveConfigured ? 'Archive is configured for a persistent path.' : 'Archive is running on local service storage. Add a Render persistent disk and set ANALYTICS_STORE_PATH to keep events after restarts.'}{metrics.archiveError ? ' Last write error: ' + metrics.archiveError : ''}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#00ffd5]/15 bg-[#041820]/90 p-5"><div className="mb-3 flex items-center justify-between"><div><h2 className="font-display text-xl font-bold">Recent signal feed</h2><p className="text-[11px] text-white/45">Latest 50 events with IP and city enrichment</p></div><div className="flex flex-wrap items-center justify-end gap-2"><label className="flex items-center gap-1 rounded-lg border border-[#00ffd5]/15 bg-[#020d12] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/50"><Filter size={13} className="text-[#00ffd5]" /><select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)} className="bg-transparent text-[#00ffd5] outline-none"><option value="all">All events</option><option value="page_view">Page views</option><option value="download_started">Started</option><option value="download_completed">Completed</option><option value="download_failed">Failed</option></select></label><span className="text-[10px] uppercase tracking-[0.18em] text-[#00ffd5]/60">Auto refresh 15s</span></div></div><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-xs"><thead className="text-[10px] uppercase tracking-[0.16em] text-white/35"><tr><th className="pb-3">Event</th><th className="pb-3">IP / City</th><th className="pb-3">Country</th><th className="pb-3">Platform</th><th className="pb-3">Format</th><th className="pb-3">Time</th><th className="pb-3">Status</th></tr></thead><tbody>{filteredActivity.map((item) => <tr key={item.id} className="border-t border-white/5"><td className="py-3 text-white/75">{item.name.replaceAll('_', ' ')}</td><td className="py-3"><span className="block text-[#b8fff6]">{item.ipAddress || 'Unknown IP'}</span><span className="block text-[10px] text-white/45">{item.city || 'City pending'}</span></td><td className="py-3 text-[#00ffd5]">{item.country}</td><td className="py-3 capitalize text-white/60">{item.platform || '—'}</td><td className="py-3 uppercase text-white/60">{item.format || '—'}</td><td className="py-3 text-white/45">{formatTime(item.timestamp)}</td><td className={`py-3 ${item.success === false ? 'text-red-300' : 'text-[#00e599]'}`}>{item.success === false ? 'FAILED' : 'CAPTURED'}</td></tr>)}</tbody></table>{!filteredActivity.length && <p className="py-8 text-center text-sm text-white/40">Waiting for the first signal.</p>}</div></section>
        </>}
      </div>
    </main>
  );
};
