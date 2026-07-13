'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';

/* ---------- types ---------- */

type Summary = {
  totalViews: number;
  totalLinkClicks: number;
  uniqueDevices: number;
  currentViewers: number;
  todayViews: number;
  todayLinkClicks: number;
  thisWeekViews: number;
  thisMonthViews: number;
  avgDailyViews: number;
  peakHour: string;
  peakDay: string;
  bounceRate: number;
};

type ChartPoint = { label: string; views: number; linkClicks?: number };

type TopItem = { title: string; type: string; views: number; reactions: number; trend: string };

type DeviceStat = {
  desktop: { count: number; percentage: number };
  mobile: { count: number; percentage: number };
  tablet: { count: number; percentage: number };
};

type ReactionStat = { emoji: string; count: number };

type StatsData = {
  summary: Summary;
  hourly: ChartPoint[];
  daily: ChartPoint[];
  weekly: ChartPoint[];
  monthly: ChartPoint[];
  topItems: TopItem[];
  devices: DeviceStat;
  reactions: ReactionStat[];
  contentBreakdown?: { files: number; images: number; collections: number };
  recentTrend?: { direction: 'up' | 'down' | 'stable'; percentage: number };
  avgViewsPerItem?: number;
  mostActiveDay?: string;
  topCategory?: string;
  newItemsThisWeek?: number;
  engagementRate?: number;
};

/* ---------- helpers ---------- */

function fmt(n: number) {
  return n.toLocaleString();
}

function normalizeHourly(raw: any[]): ChartPoint[] {
  return raw.map((h) => ({ label: h.hour ?? h.label ?? '', views: h.views ?? 0, linkClicks: h.linkClicks ?? 0 }));
}
function normalizeDaily(raw: any[]): ChartPoint[] {
  return raw.map((d) => ({ label: d.date ?? d.label ?? '', views: d.views ?? 0, linkClicks: d.linkClicks ?? 0 }));
}
function normalizeWeekly(raw: any[]): ChartPoint[] {
  return raw.map((w) => ({ label: w.week ?? w.label ?? '', views: w.views ?? 0, linkClicks: w.linkClicks ?? 0 }));
}
function normalizeMonthly(raw: any[]): ChartPoint[] {
  return raw.map((m) => ({ label: m.month ?? m.label ?? '', views: m.views ?? 0, linkClicks: m.linkClicks ?? 0 }));
}

/* ---------- component ---------- */

type Tab = 'overview' | 'daily' | 'weekly' | 'monthly';

export default function AdminStatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (!json.error) {
        const d: StatsData = {
          summary: json.summary,
          hourly: normalizeHourly(json.hourly ?? []),
          daily: normalizeDaily(json.daily ?? []),
          weekly: normalizeWeekly(json.weekly ?? []),
          monthly: normalizeMonthly(json.monthly ?? []),
          topItems: json.topItems ?? [],
          devices: json.devices ?? { desktop: { count: 0, percentage: 0 }, mobile: { count: 0, percentage: 0 }, tablet: { count: 0, percentage: 0 } },
          reactions: json.reactions ?? [],
          contentBreakdown: json.contentBreakdown,
          recentTrend: json.recentTrend,
          avgViewsPerItem: json.avgViewsPerItem,
          mostActiveDay: json.mostActiveDay,
          topCategory: json.topCategory,
          newItemsThisWeek: json.newItemsThisWeek,
          engagementRate: json.engagementRate,
        };
        setData(d);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, 15_000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
          <span className="font-mono text-sm text-text-dim">Loading statistics…</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-text-muted">Could not load statistics. Try refreshing.</p>
      </div>
    );
  }

  const s = data.summary;
  const chartData = tab === 'overview' ? data.hourly : tab === 'daily' ? data.daily : tab === 'weekly' ? data.weekly : data.monthly;
  const maxViews = Math.max(...chartData.map((c) => c.views), 1);
  const deviceTotal = data.devices.desktop.count + data.devices.mobile.count + data.devices.tablet.count;
  const reactionMax = data.reactions.length > 0 ? data.reactions[0].count : 1;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="font-mono text-xs uppercase tracking-wider text-text-dim hover:text-gold">
            ← Dashboard
          </Link>
          <h1 className="mt-3 font-display text-3xl font-semibold text-text">Statistics</h1>
        </div>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-mono transition-all shrink-0 ${
            autoRefresh
              ? 'border-gold/30 text-gold bg-gold/5'
              : 'border-border text-text-muted hover:border-border-hover hover:text-text'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-gold animate-pulse' : 'bg-text-dim'}`} />
          Auto-refresh {autoRefresh ? 'on' : 'off'}
        </button>
      </div>

      {/* ---- Top summary cards (6) ---- */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard
          value={s.currentViewers}
          label="Current viewers"
          sub="right now"
          live
        />
        <SummaryCard
          value={s.todayViews}
          label="Today's views"
          sub={`${fmt(s.todayLinkClicks)} link clicks`}
        />
        <SummaryCard
          value={s.thisWeekViews}
          label="This week"
          sub="past 7 days"
        />
        <SummaryCard
          value={s.thisMonthViews}
          label="This month"
          sub="past 30 days"
        />
        <SummaryCard
          value={s.avgDailyViews}
          label="Avg daily"
          sub="rolling average"
        />
        <SummaryCard
          value={s.uniqueDevices}
          label="Unique devices"
          sub="all time"
        />
      </div>

      {/* ---- Info pills ---- */}
      <div className="mt-4 flex flex-wrap gap-3">
        <InfoPill label="All-time views" value={fmt(s.totalViews)} />
        <InfoPill label="Peak hour" value={s.peakHour} />
        <InfoPill label="Peak day" value={s.peakDay} />
        <InfoPill label="Bounce rate" value={`${s.bounceRate}%`} />
        {data.avgViewsPerItem != null && (
          <InfoPill label="Avg views/item" value={fmt(Math.round(data.avgViewsPerItem))} />
        )}
        {data.engagementRate != null && (
          <InfoPill label="Engagement" value={`${data.engagementRate}%`} />
        )}
        {data.newItemsThisWeek != null && (
          <InfoPill label="New this week" value={String(data.newItemsThisWeek)} />
        )}
        {data.topCategory && <InfoPill label="Top category" value={data.topCategory} />}
        {data.mostActiveDay && <InfoPill label="Most active day" value={data.mostActiveDay} />}
        {data.recentTrend && (
          <InfoPill
            label="Trend"
            value={`${data.recentTrend.direction === 'up' ? '↑' : data.recentTrend.direction === 'down' ? '↓' : '→'} ${data.recentTrend.percentage}%`}
          />
        )}
        {data.contentBreakdown && (
          <InfoPill
            label="Content"
            value={`${data.contentBreakdown.files} docs · ${data.contentBreakdown.images} imgs · ${data.contentBreakdown.collections} coll`}
          />
        )}
      </div>

      {/* ---- Chart tab bar ---- */}
      <div className="mt-8 flex gap-1 rounded-xl border border-border bg-surface p-1 w-fit">
        {(['overview', 'daily', 'weekly', 'monthly'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setHoveredBar(null); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${
              tab === t
                ? 'bg-rose text-white'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ---- Chart area ---- */}
      <div className="mt-4 bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono text-xs uppercase tracking-wider text-text-dim">
            {tab === 'overview' ? 'Last 24 hours' : tab === 'daily' ? 'Last 30 days' : tab === 'weekly' ? 'Weekly' : 'Monthly'}
          </h3>
          <div className="flex items-center gap-4 text-[10px] font-mono text-text-dim">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-rose inline-block" /> Views
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-gold-dim inline-block" /> Link clicks
            </span>
          </div>
        </div>

        {/* CSS Bar Chart */}
        <div className="relative">
          <div
            className="flex items-end gap-[3px] sm:gap-1"
            style={{ height: '200px' }}
            onMouseLeave={() => setHoveredBar(null)}
          >
            {chartData.map((point, i) => {
              const viewsH = Math.max((point.views / maxViews) * 100, 2);
              const clicksH = point.linkClicks != null ? Math.max((point.linkClicks / maxViews) * 100, 0) : 0;
              const isHovered = hoveredBar === i;
              return (
                <div
                  key={i}
                  className="flex-1 relative flex flex-col justify-end min-w-0"
                  onMouseEnter={() => setHoveredBar(i)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-lg bg-surface-2 border border-border px-2.5 py-1.5 text-[10px] font-mono shadow-lg pointer-events-none">
                      <span className="text-text">{fmt(point.views)} views</span>
                      {point.linkClicks != null && (
                        <span className="text-text-muted ml-2">{fmt(point.linkClicks)} clicks</span>
                      )}
                    </div>
                  )}
                  {/* Views bar */}
                  <div
                    className="w-full rounded-t-sm bg-gradient-to-t from-rose-dark to-rose transition-all duration-300"
                    style={{ height: `${viewsH}%`, opacity: isHovered ? 1 : 0.75 }}
                  />
                  {/* Clicks bar */}
                  {clicksH > 0 && (
                    <div
                      className="w-full rounded-t-sm bg-gradient-to-t from-gold-dim to-gold transition-all duration-300"
                      style={{ height: `${clicksH}%`, opacity: isHovered ? 0.9 : 0.5, marginTop: '1px' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {/* X-axis labels */}
          <div className="flex mt-2 overflow-hidden">
            {chartData.map((point, i) => {
              const total = chartData.length;
              const step = total > 20 ? 4 : total > 10 ? 3 : 2;
              const show = i % step === 0 || i === total - 1;
              if (!show) return <div key={i} className="flex-1" />;
              return (
                <div
                  key={i}
                  className="flex-1 text-center text-text-dim text-[9px] font-mono truncate"
                >
                  {point.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---- Bottom grid ---- */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Items (spans 2 cols) */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5">
          <h3 className="font-mono text-xs uppercase tracking-wider text-text-dim mb-4">Top items</h3>
          {!data.topItems.length ? (
            <p className="text-sm text-text-dim">No data available.</p>
          ) : (
            <div className="space-y-2">
              {data.topItems.slice(0, 8).map((item, i) => (
                <div
                  key={`${item.title}-${i}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose/10 text-rose-light font-mono text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-text">{item.title}</p>
                      <p className="font-mono text-[10px] uppercase text-text-dim">{item.type}</p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <span className="font-mono text-xs text-text-muted">
                      {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'}
                    </span>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold text-gold">{fmt(item.views)}</p>
                      <p className="font-mono text-[10px] text-text-dim">{item.reactions} reacts</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Device Breakdown */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-mono text-xs uppercase tracking-wider text-text-dim mb-4">Devices</h3>
            <div className="space-y-4">
              {(
                [
                  { label: 'Desktop', ...data.devices.desktop },
                  { label: 'Mobile', ...data.devices.mobile },
                  { label: 'Tablet', ...data.devices.tablet },
                ] as Array<{ label: string; count: number; percentage: number }>
              ).map((d) => (
                <div key={d.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-text">{d.label}</span>
                    <span className="font-mono text-xs text-text-muted">{d.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-rose/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-rose transition-all duration-700"
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                  <p className="font-mono text-[10px] text-text-dim mt-1">{fmt(d.count)} sessions</p>
                </div>
              ))}
              {deviceTotal > 0 && (
                <p className="pt-2 border-t border-border font-mono text-[10px] text-text-dim">
                  {fmt(deviceTotal)} total sessions
                </p>
              )}
            </div>
          </div>

          {/* Reactions */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-mono text-xs uppercase tracking-wider text-text-dim mb-4">Reactions</h3>
            {!data.reactions.length ? (
              <p className="text-sm text-text-dim">No reactions yet.</p>
            ) : (
              <div className="space-y-3">
                {data.reactions.slice(0, 6).map((r) => {
                  const pct = (r.count / reactionMax) * 100;
                  return (
                    <div key={r.emoji} className="flex items-center gap-3">
                      <span className="text-lg w-8 text-center shrink-0">{r.emoji}</span>
                      <div className="flex-1">
                        <div className="h-2.5 rounded-full bg-rose/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-rose to-gold transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-mono text-sm text-text-muted w-8 text-right shrink-0">{r.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------- sub-components ---------- */

function SummaryCard({
  value,
  label,
  sub,
  live = false,
}: {
  value: number;
  label: string;
  sub?: string;
  live?: boolean;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-2">
        {live && <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />}
        <p className="font-display text-2xl font-semibold text-gold font-mono">{fmt(value)}</p>
      </div>
      <p className="mt-1 text-text-dim text-xs">{label}</p>
      {sub && <p className="mt-0.5 text-text-dim text-[10px]">{sub}</p>}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3">
      <p className="font-mono text-sm text-text">{value}</p>
      <p className="text-text-dim text-[10px] mt-0.5">{label}</p>
    </div>
  );
}