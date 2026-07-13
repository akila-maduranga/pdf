'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

type StatsData = {
  currentViewers: number;
  daily: { total: number; uniqueDevices: number };
  weekly: { total: number; uniqueDevices: number };
  monthly: { total: number; uniqueDevices: number };
  allTime: { total: number; views: number; linkClicks: number; uniqueDevices: number };
  dailyChartData: { date: string; views: number; linkClicks: number; uniqueDevices: number }[];
  hourlyChartData: { hour: string; views: number }[];
  topItems: { key: string; title: string; type: string; id: string; views: number; linkClicks: number }[];
  topReactions: { emoji: string; count: number }[];
  contentCounts: { files: number; images: number; collections: number };
  funFacts: {
    peakHour: number;
    peakHourLabel: string;
    busiestDay: { date: string; count: number } | null;
    avgViewsPerItem: number;
    totalReactions: number;
  };
  weeklyTrend: number;
  monthlyTrend: number;
};

const ROSE = '#c77dba';
const WINE = '#8b2252';
const PAPER_DIM = 'rgba(240,230,245,0.5)';
const LINE_DIM = 'rgba(74,53,85,0.3)';
const PIE_COLORS = ['#c77dba', '#8b2252', '#6b3a7d', '#e8b4d8', '#d4a574', '#4a3555'];

export default function AdminStatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-gold/30 border-t-rose-gold" />
          <span className="font-mono text-sm text-velvet-text/40">Loading statistics...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-velvet-text/50">Could not load statistics. Try refreshing.</p>
      </div>
    );
  }

  const periodData = tab === 'daily' ? data.daily : tab === 'weekly' ? data.weekly : data.monthly;

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-8">
      <Link href="/admin" className="font-mono text-xs uppercase tracking-wider text-velvet-text/40 hover:text-rose-gold">
        ← Dashboard
      </Link>
      <div className="mb-8 mt-3">
        <h1 className="font-display text-3xl font-semibold">Statistics</h1>
        <p className="mt-2 text-sm text-velvet-text/50">
          Real-time insights into your library.
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-rose-gold/20 bg-gradient-to-br from-rose-gold/10 to-transparent p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-3 w-3 animate-pulse rounded-full bg-green-500" />
          <p className="font-mono text-xs uppercase tracking-wider text-velvet-text/50">Currently viewing</p>
        </div>
        <p className="mt-2 font-display text-5xl font-bold text-rose-gold sm:text-6xl">{data.currentViewers}</p>
        <p className="mt-1 text-sm text-velvet-text/40">active in the last 5 minutes</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <QuickStat label="All-time views" value={data.allTime.total} icon="👁" />
        <QuickStat label="Unique readers" value={data.allTime.uniqueDevices} icon="👤" />
        <QuickStat label="Link shares" value={data.allTime.linkClicks} icon="🔗" />
        <QuickStat label="Reactions" value={data.funFacts.totalReactions} icon="💜" />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <QuickStat label="This week" value={data.weekly.total} icon="📅" trend={data.weeklyTrend} />
        <QuickStat label="This month" value={data.monthly.total} icon="📊" trend={data.monthlyTrend} />
        <QuickStat label="Avg per item" value={data.funFacts.avgViewsPerItem} icon="📈" />
      </div>

      <div className="mb-6 flex gap-1 rounded-xl border border-velvet-border/30 bg-velvet-surface/20 p-1">
        {(['daily', 'weekly', 'monthly'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-rose-gold/15 text-rose-gold' : 'text-velvet-text/50 hover:text-velvet-text/80'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-velvet-border/30 bg-velvet-surface/20 p-4">
          <p className="font-display text-2xl font-bold text-velvet-text">{periodData.total}</p>
          <p className="mt-1 text-xs text-velvet-text/45">{tab === 'daily' ? 'Views today' : tab === 'weekly' ? 'Views this week' : 'Views this month'}</p>
        </div>
        <div className="rounded-xl border border-velvet-border/30 bg-velvet-surface/20 p-4">
          <p className="font-display text-2xl font-bold text-velvet-text">{periodData.uniqueDevices}</p>
          <p className="mt-1 text-xs text-velvet-text/45">Unique {tab === 'daily' ? 'readers today' : tab === 'weekly' ? 'readers this week' : 'readers this month'}</p>
        </div>
        <div className="col-span-2 rounded-xl border border-velvet-border/30 bg-velvet-surface/20 p-4 sm:col-span-1">
          <p className="font-display text-2xl font-bold text-velvet-text">
            {data.contentCounts.files + data.contentCounts.images}
          </p>
          <p className="mt-1 text-xs text-velvet-text/45">Total items ({data.contentCounts.files} stories + {data.contentCounts.images} images)</p>
        </div>
      </div>

      {data.dailyChartData.length > 0 && (
        <div className="mb-8 rounded-xl border border-velvet-border/30 bg-velvet-surface/20 p-4 sm:p-6">
          <h2 className="mb-1 font-display text-lg font-semibold">Last 14 days</h2>
          <p className="mb-4 text-xs text-velvet-text/40">Views vs link shares</p>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsGradAdmin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ROSE} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={ROSE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={LINE_DIM} />
                <XAxis dataKey="date" tick={{ fill: PAPER_DIM, fontSize: 11 }} />
                <YAxis tick={{ fill: PAPER_DIM, fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#2a1a30',
                    border: '1px solid rgba(74,53,85,0.4)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#f0e6f5',
                  }}
                />
                <Area type="monotone" dataKey="views" stroke={ROSE} fill="url(#viewsGradAdmin)" strokeWidth={2} name="Views" />
                <Area type="monotone" dataKey="linkClicks" stroke={WINE} fill="transparent" strokeWidth={1.5} strokeDasharray="5 5" name="Link shares" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data.hourlyChartData.length > 0 && (
        <div className="mb-8 rounded-xl border border-velvet-border/30 bg-velvet-surface/20 p-4 sm:p-6">
          <h2 className="mb-1 font-display text-lg font-semibold">Last 24 hours</h2>
          <p className="mb-4 text-xs text-velvet-text/40">Activity hour by hour (IST)</p>
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourlyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={LINE_DIM} />
                <XAxis dataKey="hour" tick={{ fill: PAPER_DIM, fontSize: 10 }} interval={2} />
                <YAxis tick={{ fill: PAPER_DIM, fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#2a1a30',
                    border: '1px solid rgba(74,53,85,0.4)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#f0e6f5',
                  }}
                />
                <Bar dataKey="views" fill={ROSE} radius={[3, 3, 0, 0]} name="Views" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-velvet-border/30 bg-velvet-surface/20 p-4 sm:p-6">
          <h2 className="mb-1 font-display text-lg font-semibold">Most popular</h2>
          <p className="mb-4 text-xs text-velvet-text/40">Top items of all time</p>
          {!data.topItems.length ? (
            <p className="text-sm text-velvet-text/35">No views yet.</p>
          ) : (
            <div className="space-y-2">
              {data.topItems.slice(0, 7).map((item, i) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg border border-velvet-border/20 px-3 py-2.5 transition-colors hover:bg-velvet-surface/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-gold/15 font-mono text-xs font-bold text-rose-gold">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-velvet-text/85">{item.title}</p>
                      <p className="font-mono text-[10px] uppercase text-velvet-text/35">{item.type}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-semibold text-rose-gold">{item.views + item.linkClicks}</p>
                    <p className="font-mono text-[10px] text-velvet-text/30">
                      {item.views} views · {item.linkClicks} shares
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-velvet-border/30 bg-velvet-surface/20 p-4 sm:p-6">
            <h2 className="mb-1 font-display text-lg font-semibold">Reactions</h2>
            <p className="mb-4 text-xs text-velvet-text/40">Reader sentiment</p>
            {!data.topReactions.length ? (
              <p className="text-sm text-velvet-text/35">No reactions yet.</p>
            ) : (
              <div className="space-y-3">
                {data.topReactions.map((r) => {
                  const maxCount = data.topReactions[0].count;
                  const pct = maxCount > 0 ? (r.count / maxCount) * 100 : 0;
                  return (
                    <div key={r.emoji} className="flex items-center gap-3">
                      <span className="text-xl w-8 text-center shrink-0">{r.emoji}</span>
                      <div className="flex-1">
                        <div className="h-3 rounded-full bg-velvet-border/15 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-rose-gold/50 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-mono text-sm text-velvet-text/60 w-8 text-right shrink-0">{r.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {(data.contentCounts.files > 0 || data.contentCounts.images > 0) && (
            <div className="rounded-xl border border-velvet-border/30 bg-velvet-surface/20 p-4 sm:p-6">
              <h2 className="mb-1 font-display text-lg font-semibold">Content breakdown</h2>
              <p className="mb-4 text-xs text-velvet-text/40">Library composition</p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Stories', value: data.contentCounts.files },
                        { name: 'Images', value: data.contentCounts.images },
                        { name: 'Collections', value: data.contentCounts.collections },
                      ].filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {[
                        { name: 'Stories', value: data.contentCounts.files },
                        { name: 'Images', value: data.contentCounts.images },
                        { name: 'Collections', value: data.contentCounts.collections },
                      ]
                        .filter((d) => d.value > 0)
                        .map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#2a1a30',
                        border: '1px solid rgba(74,53,85,0.4)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#f0e6f5',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex justify-center gap-4 text-xs text-velvet-text/50">
                {data.contentCounts.files > 0 && <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-gold inline-block" /> Stories</span>}
                {data.contentCounts.images > 0 && <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-wine inline-block" /> Images</span>}
                {data.contentCounts.collections > 0 && <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-plum inline-block" /> Collections</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-rose-gold/15 bg-gradient-to-r from-rose-gold/5 to-transparent p-4 sm:p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Insights</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FactCard emoji="⏰" label="Peak hour" value={data.funFacts.peakHourLabel} detail="Busiest reading time" />
          <FactCard emoji="📅" label="Best day ever" value={data.funFacts.busiestDay ? `${data.funFacts.busiestDay.count} views` : 'N/A'} detail={data.funFacts.busiestDay?.date || ''} />
          <FactCard emoji="📊" label="Avg views per item" value={String(data.funFacts.avgViewsPerItem)} detail="Across all content" />
          <FactCard emoji="📖" label="Total stories" value={String(data.contentCounts.files)} detail="PDFs in the library" />
          <FactCard emoji="🖼" label="Total images" value={String(data.contentCounts.images)} detail="In the gallery" />
          <FactCard emoji="📚" label="Total collections" value={String(data.contentCounts.collections)} detail="Grouped content" />
        </div>
      </div>

      <p className="mb-8 text-center font-mono text-[10px] text-velvet-text/25">
        All times in IST (UTC+05:30)
      </p>
    </div>
  );
}

function QuickStat({ label, value, icon, trend }: { label: string; value: number; icon: string; trend?: number }) {
  return (
    <div className="rounded-xl border border-velvet-border/30 bg-velvet-surface/20 p-4 transition-colors hover:border-rose-gold/30">
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>
        {trend !== undefined && (
          <span className={`font-mono text-[10px] ${trend >= 0 ? 'text-green-400' : 'text-wine'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-velvet-text sm:text-3xl">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-xs text-velvet-text/45">{label}</p>
    </div>
  );
}

function FactCard({ emoji, label, value, detail }: { emoji: string; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-velvet-border/20 bg-velvet-surface/15 p-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <p className="font-mono text-[11px] uppercase tracking-wider text-velvet-text/40">{label}</p>
      </div>
      <p className="mt-1 font-display text-xl font-semibold text-velvet-text">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-velvet-text/30">{detail}</p>}
    </div>
  );
}
