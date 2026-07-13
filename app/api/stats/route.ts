import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = supabaseServer();

    // Fetch all events with timestamps
    const { data: events } = await supabase
      .from('events')
      .select('id, item_type, item_id, event_type, device_id, created_at')
      .order('created_at', { ascending: false });

    // Fetch all reactions
    const { data: reactions } = await supabase.from('reactions').select('emoji, item_type, item_id, created_at');

    // Fetch item counts
    const { count: fileCount } = await supabase.from('files').select('*', { count: 'exact', head: true });
    const { count: imageCount } = await supabase.from('images').select('*', { count: 'exact', head: true });
    const { count: collectionCount } = await supabase.from('collections').select('*', { count: 'exact', head: true });

    // Fetch categories for breakdown
    const { data: categories } = await supabase.from('categories').select('id, name, slug');
    const { data: filesWithCats } = await supabase.from('files').select('category_id');
    const { data: imagesWithCats } = await supabase.from('images').select('category_id');

    const allEvents = events || [];
    const allReactions = reactions || [];

    // Fetch item titles for context
    const { data: files } = await supabase.from('files').select('id, title, share_id, category_id');
    const { data: images } = await supabase.from('images').select('id, title, share_id, category_id');

    // Build title lookup
    const titleMap: Record<string, { title: string; shareId: string; categoryId: string | null }> = {};
    for (const f of files || []) titleMap[`file:${f.id}`] = { title: f.title, shareId: f.share_id, categoryId: f.category_id };
    for (const i of images || []) titleMap[`image:${i.id}`] = { title: i.title, shareId: i.share_id, categoryId: i.category_id };

    // Current viewers: unique devices active in last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const recentEvents = allEvents.filter((e) => e.created_at >= fiveMinAgo);
    const currentViewers = new Set(recentEvents.map((e) => e.device_id).filter(Boolean)).size;

    // Helper: filter events in a time window
    function filterByTimeWindow(minutes: number) {
      const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
      return allEvents.filter((e) => e.created_at >= cutoff);
    }

    // Daily: last 24h
    const dailyEvents = filterByTimeWindow(24 * 60);
    const dailyUniqueDevices = new Set(dailyEvents.map((e) => e.device_id).filter(Boolean)).size;

    // Weekly: last 7 days
    const weeklyEvents = filterByTimeWindow(7 * 24 * 60);
    const weeklyUniqueDevices = new Set(weeklyEvents.map((e) => e.device_id).filter(Boolean)).size;

    // Monthly: last 30 days
    const monthlyEvents = filterByTimeWindow(30 * 24 * 60);
    const monthlyUniqueDevices = new Set(monthlyEvents.map((e) => e.device_id).filter(Boolean)).size;

    // Total all-time
    const totalEvents = allEvents.length;
    const totalLinkClicks = allEvents.filter((e) => e.event_type === 'link_click').length;
    const totalUniqueDevices = new Set(allEvents.map((e) => e.device_id).filter(Boolean)).size;

    // Daily chart data: last 14 days, grouped by day
    const dailyChartData: { date: string; views: number; linkClicks: number; uniqueDevices: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayEvents = allEvents.filter((e) => {
        const d = new Date(e.created_at);
        return d >= dayStart && d < dayEnd;
      });

      const dayLabel = dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Colombo' });
      dailyChartData.push({
        date: dayLabel,
        views: dayEvents.filter((e) => e.event_type === 'view').length,
        linkClicks: dayEvents.filter((e) => e.event_type === 'link_click').length,
        uniqueDevices: new Set(dayEvents.map((e) => e.device_id).filter(Boolean)).size,
      });
    }

    // Hourly chart data: last 24 hours
    const hourlyChartData: { hour: string; views: number }[] = [];
    for (let i = 23; i >= 0; i--) {
      const hStart = new Date(Date.now() - i * 60 * 60 * 1000);
      const hEnd = new Date(Date.now() - (i - 1) * 60 * 60 * 1000);
      const hEvents = allEvents.filter((e) => {
        const d = new Date(e.created_at);
        return d >= hStart && d < hEnd;
      });
      hourlyChartData.push({
        hour: hStart.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, timeZone: 'Asia/Colombo' }),
        views: hEvents.length,
      });
    }

    // Top items
    const byItem: Record<string, { views: number; linkClicks: number; type: string; id: string }> = {};
    for (const e of allEvents) {
      const key = `${e.item_type}:${e.item_id}`;
      if (!byItem[key]) byItem[key] = { views: 0, linkClicks: 0, type: e.item_type, id: e.item_id };
      if (e.event_type === 'view') byItem[key].views++;
      else byItem[key].linkClicks++;
    }
    const topItems = Object.entries(byItem)
      .map(([key, stats]) => {
        const info = titleMap[key] || { title: 'Untitled', shareId: '', categoryId: null };
        return { key, title: info.title, shareId: info.shareId, ...stats };
      })
      .sort((a, b) => (b.views + b.linkClicks) - (a.views + a.linkClicks))
      .slice(0, 10);

    // Trending: most views in last 7 days
    const weeklyItemEvents = filterByTimeWindow(7 * 24 * 60);
    const trendingByItem: Record<string, number> = {};
    for (const e of weeklyItemEvents) {
      const key = `${e.item_type}:${e.item_id}`;
      trendingByItem[key] = (trendingByItem[key] || 0) + 1;
    }
    const trendingItems = Object.entries(trendingByItem)
      .map(([key, count]) => {
        const info = titleMap[key] || { title: 'Untitled', shareId: '', categoryId: null };
        const [itemType, itemId] = key.split(':');
        return { key, title: info.title, shareId: info.shareId, type: itemType, id: itemId, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Reaction breakdown
    const reactionCounts: Record<string, number> = {};
    for (const r of allReactions) {
      reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
    }
    const topReactions = Object.entries(reactionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([emoji, count]) => ({ emoji, count }));

    // Views count
    const viewsCount = allEvents.filter((e) => e.event_type === 'view').length;

    // Peak hours (which hours of day get most traffic, all-time)
    const hourBuckets = new Array(24).fill(0);
    for (const e of allEvents) {
      const h = parseInt(new Date(e.created_at).toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Colombo' }), 10);
      hourBuckets[h]++;
    }
    const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets));

    // Busiest day ever
    const dayBuckets: Record<string, number> = {};
    for (const e of allEvents) {
      const day = new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Colombo' });
      dayBuckets[day] = (dayBuckets[day] || 0) + 1;
    }
    const busiestDay = Object.entries(dayBuckets).sort((a, b) => b[1] - a[1])[0];

    // Average views per item
    const totalItems = (fileCount ?? 0) + (imageCount ?? 0);
    const avgViewsPerItem = totalItems > 0 ? Math.round(totalEvents / totalItems) : 0;

    // Engagement rate: reactions per 100 views
    const engagementRate = totalEvents > 0 ? Math.round((allReactions.length / totalEvents) * 100) : 0;

    // Category breakdown
    const categoryMap = new Map((categories || []).map((c) => [c.id, c]));
    const catCounts: Record<string, { name: string; count: number }> = {};
    for (const f of filesWithCats || []) {
      if (f.category_id) {
        const cat = categoryMap.get(f.category_id);
        if (cat) {
          catCounts[cat.id] = { name: cat.name, count: (catCounts[cat.id]?.count || 0) + 1 };
        }
      }
    }
    for (const i of imagesWithCats || []) {
      if (i.category_id) {
        const cat = categoryMap.get(i.category_id);
        if (cat) {
          catCounts[cat.id] = { name: cat.name, count: (catCounts[cat.id]?.count || 0) + 1 };
        }
      }
    }
    const categoryBreakdown = Object.entries(catCounts)
      .map(([, v]) => v)
      .sort((a, b) => b.count - a.count);

    // Most active day of week
    const dayOfWeekBuckets = new Array(7).fill(0);
    for (const e of allEvents) {
      const day = new Date(e.created_at).getDay();
      dayOfWeekBuckets[day]++;
    }
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostActiveDay = dayNames[dayOfWeekBuckets.indexOf(Math.max(...dayOfWeekBuckets))];

    return NextResponse.json({
      currentViewers,
      daily: { total: dailyEvents.length, uniqueDevices: dailyUniqueDevices },
      weekly: { total: weeklyEvents.length, uniqueDevices: weeklyUniqueDevices },
      monthly: { total: monthlyEvents.length, uniqueDevices: monthlyUniqueDevices },
      allTime: {
        total: totalEvents,
        views: viewsCount,
        linkClicks: totalLinkClicks,
        uniqueDevices: totalUniqueDevices,
      },
      dailyChartData,
      hourlyChartData,
      topItems,
      trendingItems,
      topReactions,
      contentCounts: {
        files: fileCount ?? 0,
        images: imageCount ?? 0,
        collections: collectionCount ?? 0,
      },
      categoryBreakdown,
      funFacts: {
        peakHour,
        peakHourLabel: new Date(2000, 0, 1, peakHour).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, timeZone: 'Asia/Colombo' }),
        busiestDay: busiestDay ? { date: busiestDay[0], count: busiestDay[1] } : null,
        avgViewsPerItem,
        totalReactions: allReactions.length,
        engagementRate,
        mostActiveDay,
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    return NextResponse.json({ error: 'Failed to compute stats' }, { status: 500 });
  }
}
