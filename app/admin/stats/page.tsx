'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { hybridPath } from '@/lib/slugify';

type StatsData = {
  currentViewers: number;
  daily: { total: number; uniqueDevices: number };
  weekly: { total: number; uniqueDevices: number };
  monthly: { total: number; uniqueDevices: number };
  allTime: { total: number; views: number; linkClicks: number; uniqueDevices: number };
  dailyChartData: { date: string; views: number; linkClicks: number; uniqueDevices: number }[];
  hourlyChartData: { hour: string; views: number }[];
  topItems: { key: string; title: string; type: string; id: string; shareId: string; views: number; linkClicks: number }[];
  trendingItems: { key: string; title: string; type: string; id: string; shareId: string; count: number }[];
  topReactions: { emoji: string; count: number }[];
  contentCounts: { files: number; images: number; collections: number };
  categoryBreakdown: { name: string; count: number }[];
  funFacts: {
    peakHour: number;
    peakHourLabel: string;
    busiestDay: { date: string; count: number } | null;
    avgViewsPerItem: number;
    totalReactions: number;
    engagementRate: number;
    mostActiveDay: string;
  };
};

const BRASS = '#b8934a';
const PAPER_DIM = 'rgba(246,243,236,0.5)';
const LINE_DIM = 'rgba(216,208,189,0.15)';
const PIE_COLORS = ['#b8934a', '#a8462f', '#3c4a3e', '#d8d0bd', '#6b7280', '#92400e', '#4a6741', '#8b7355'];

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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass/30 border-t-brass" />
          <span className="font-mono text-sm text-paper/40">Loading stats...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-paper/50">Couldn&apos;t load stats. Try refreshing?</p>
      </div>
    );
  }

  const periodData = tab === 'daily' ? data.daily : tab === 'weekly' ? data.weekly : data.monthly;
  const periodLabel = tab === 'daily' ? 'today' : tab === 'weekly' ? 'this week' : 'this month';

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin" className="font-mono text-xs uppercase tracking-wider text-paper/40 hover:text-brass">
          ← Control room
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold">The numbers room</h1>
        <p className="mt-2 text-sm text-paper/50">
          Detailed analytics for your content library.
        </p>
      </div>

      {/* Current viewers */}
      <div className="mb-8 rounded-2xl border border-brass/20 bg-gradient-to-br from-brass/10 to-transparent p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-3 w-3 animate-pulse rounded-full bg-green-500" />
          <p className="font-mono text-xs uppercase tracking-wider text-paper/50">Active right now</p>
        </div>
        <p className="mt-2 font-display text-5xl font-bold text-brass sm:text-6xl">{data.currentViewers}</p>
        <p className="mt-1 text-sm text-paper/40">people browsing in the last 5 minutes</p>
      </div>

      {/* Quick stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <QuickStat label="All-time views" value={data.allTime.total} icon="👀" />
        <QuickStat label="Unique visitors" value={data.allTime.uniqueDevices} icon="🧍" />
        <QuickStat label="Shared links" value={data.allTime.linkClicks} icon="🔗" />
        <QuickStat label="Reactions" value={data.funFacts.totalReactions} icon="💬" />
      </div>

      {/* Time period tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-line/15 bg-white/[0.02] p-1">
        {(['daily', 'weekly', 'monthly'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-brass/15 text-brass' : 'text-paper/50 hover:text-paper/80'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Period stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-line/15 bg-white/[0.02] p-4">
          <p className="font-display text-2xl font-bold text-paper">{periodData.total}</p>
          <p className="mt-1 text-xs text-paper/45">Page loads {periodLabel}</p>
        </div>
        <div className="rounded-xl border border-line/15 bg-white/[0.02] p-4">
          <p className="font-display text-2xl font-bold text-paper">{periodData.uniqueDevices}</p>
          <p className="mt-1 text-xs text-paper/45">Unique visitors {periodLabel}</p>
        </div>
        <div className="rounded-xl border border-line/15 bg-white/[0.02] p-4">
          <p className="font-display text-2xl font-bold text-paper">{data.funFacts.engagementRate}%</p>
          <p className="mt-1 text-xs text-paper/45">Engagement rate</p>
        </div>
        <div className="rounded-xl border border-line/15 bg-white/[0.02] p-4">
          <p className="font-display text-2xl font-bold text-paper">
            {data.contentCounts.files + data.contentCounts.images}
          </p>
          <p className="mt-1 text-xs text-paper/45">Total items</p>
        </div>
      </div>

      {/* 14-day chart */}
      {data.dailyChartData.length > 0 && (
        <div className="mb-8 rounded-xl border border-line/15 bg-white/[0.02] p-4 sm:p-6">
          <h2 className="mb-1 font-display text-lg font-semibold">Activity trend</h2>
          <p className="mb-4 text-xs text-paper/40">Views and link clicks over the last 14 days</p>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRASS} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={BRASS} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={LINE_DIM} />
                <XAxis dataKey="date" tick={{ fill: PAPER_DIM, fontSize: 11 }} />
                <YAxis tick={{ fill: PAPER_DIM, fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e1c17',
                    border: '1px solid rgba(216,208,189,0.2)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#f6f3ec',
                  }}
                />
                <Area type="monotone" dataKey="views" stroke={BRASS} fill="url(#viewsGrad)" strokeWidth={2} name="Views" />
                <Area type="monotone" dataKey="linkClicks" stroke="#a8462f" fill="transparent" strokeWidth={1.5} strokeDasharray="5 5" name="Link clicks" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Hourly activity */}
      {data.hourlyChartData.length > 0 && (
        <div className="mb-8 rounded-xl border border-line/15 bg-white/[0.02] p-4 sm:p-6">
          <h2 className="mb-1 font-display text-lg font-semibold">24-hour activity</h2>
          <p className="mb-4 text-xs text-paper/40">Views hour by hour</p>
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourlyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={LINE_DIM} />
                <XAxis dataKey="hour" tick={{ fill: PAPER_DIM, fontSize: 10 }} interval={2} />
                <YAxis tick={{ fill: PAPER_DIM, fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e1c17',
                    border: '1px solid rgba(216,208,189,0.2)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#f6f3ec',
                  }}
                />
                <Bar dataKey="views" fill={BRASS} radius={[3, 3, 0, 0]} name="Views" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top items + Trending */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-line/15 bg-white/[0.02] p-4 sm:p-6">
          <h2 className="mb-1 font-display text-lg font-semibold">Top content</h2>
          <p className="mb-4 text-xs text-paper/40">Most viewed of all time</p>
          {!data.topItems.length ? (
            <p className="text-sm text-paper/35">No views yet.</p>
          ) : (
            <div className="space-y-2">
              {data.topItems.slice(0, 7).map((item, i) => (
                <Link
                  key={item.key}
                  href={hybridPath('/view', item.shareId, item.title)}
                  className="flex items-center justify-between rounded-lg border border-line/10 px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brass/15 font-mono text-xs font-bold text-brass">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-paper/85">{item.title}</p>
                      <p className="font-mono text-[10px] uppercase text-paper/35">{item.type}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-semibold text-brass">{item.views + item.linkClicks}</p>
                    <p className="font-mono text-[10px] text-paper/30">
                      {item.views} views · {item.linkClicks} shares
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-line/15 bg-white/[0.02] p-4 sm:p-6">
          <h2 className="mb-1 font-display text-lg font-semibold">Trending now</h2>
          <p className="mb-4 text-xs text-paper/40">Most popular this week</p>
          {!data.trendingItems.length ? (
            <p className="text-sm text-paper/35">No trending items yet.</p>
          ) : (
            <div className="space-y-2">
              {data.trendingItems.map((item, i) => (
                <Link
                  key={item.key}
                  href={hybridPath('/view', item.shareId, item.title)}
                  className="flex items-center justify-between rounded-lg border border-line/10 px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rust/15 font-mono text-xs font-bold text-rust">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-paper/85">{item.title}</p>
                      <p className="font-mono text-[10px] uppercase text-paper/35">{item.type}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-semibold text-rust">{item.count}</p>
                    <p className="font-mono text-[10px] text-paper/30">this week</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reactions + Content + Categories */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-line/15 bg-white/[0.02] p-4 sm:p-6">
          <h2 className="mb-1 font-display text-lg font-semibold">Reactions</h2>
          <p className="mb-4 text-xs text-paper/40">How people are responding</p>
          {!data.topReactions.length ? (
            <p className="text-sm text-paper/35">No reactions yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topReactions.map((r) => {
                const maxCount = data.topReactions[0].count;
                const pct = maxCount > 0 ? (r.count / maxCount) * 100 : 0;
                return (
                  <div key={r.emoji} className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center shrink-0">{r.emoji}</span>
                    <div className="flex-1">
                      <div className="h-3 rounded-full bg-line/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brass/50 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-mono text-sm text-paper/60 w-8 text-right shrink-0">{r.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-line/15 bg-white/[0.02] p-4 sm:p-6">
          <h2 className="mb-1 font-display text-lg font-semibold">Content mix</h2>
          <p className="mb-4 text-xs text-paper/40">What&apos;s in the library</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Documents', value: data.contentCounts.files },
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
                    { name: 'Documents', value: data.contentCounts.files },
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
                    backgroundColor: '#1e1c17',
                    border: '1px solid rgba(216,208,189,0.2)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#f6f3ec',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-paper/50">
            {data.contentCounts.files > 0 && <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brass inline-block" /> Docs ({data.contentCounts.files})</span>}
            {data.contentCounts.images > 0 && <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rust inline-block" /> Images ({data.contentCounts.images})</span>}
            {data.contentCounts.collections > 0 && <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-moss inline-block" /> Collections ({data.contentCounts.collections})</span>}
          </div>
        </div>

        <div className="rounded-xl border border-line/15 bg-white/[0.02] p-4 sm:p-6">
          <h2 className="mb-1 font-display text-lg font-semibold">Categories</h2>
          <p className="mb-4 text-xs text-paper/40">Content by category</p>
          {!data.categoryBreakdown.length ? (
            <p className="text-sm text-paper/35">No categories yet.</p>
          ) : (
            <div className="space-y-3">
              {data.categoryBreakdown.map((cat, i) => {
                const maxCount = data.categoryBreakdown[0].count;
                const pct = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
                return (
                  <div key={cat.name} className="flex items-center gap-3">
                    <span className="font-mono text-xs w-6 text-center shrink-0 text-paper/40">{i + 1}</span>
                    <div className="flex-1">
                      <div className="h-3 rounded-full bg-line/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-moss/50 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-paper/60 w-20 text-right shrink-0">{cat.name}</span>
                    <span className="font-mono text-sm text-paper/40 w-6 text-right shrink-0">{cat.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick facts */}
      <div className="mb-8 rounded-xl border border-brass/15 bg-gradient-to-r from-brass/5 to-transparent p-4 sm:p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Quick facts</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FactCard emoji="⏰" label="Peak hour" value={data.funFacts.peakHourLabel} detail="Most active time" />
          <FactCard emoji="📅" label="Busiest day" value={data.funFacts.busiestDay ? `${data.funFacts.busiestDay.count} views` : 'N/A'} detail={data.funFacts.busiestDay?.date || 'No data yet'} />
          <FactCard emoji="📊" label="Avg views per item" value={String(data.funFacts.avgViewsPerItem)} detail="Across all content" />
          <FactCard emoji="🗓️" label="Most active day" value={data.funFacts.mostActiveDay} detail="Day of the week" />
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-xl border border-line/15 bg-white/[0.02] p-4 transition-colors hover:border-brass/30">
      <span className="text-xl">{icon}</span>
      <p className="mt-2 font-display text-2xl font-bold text-paper sm:text-3xl">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-xs text-paper/45">{label}</p>
    </div>
  );
}

function FactCard({ emoji, label, value, detail }: { emoji: string; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-line/10 bg-white/[0.015] p-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <p className="font-mono text-[11px] uppercase tracking-wider text-paper/40">{label}</p>
      </div>
      <p className="mt-1 font-display text-xl font-semibold text-paper">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-paper/30">{detail}</p>}
    </div>
  );
}
