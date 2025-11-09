import { api } from '../lib/axios'

export interface OptimalTime {
  day: string
  hour: number
  engagement: number
}

export interface TrendData {
  date: string
  value: number
  platform?: string
}

export interface PlatformPerformance {
  platform: string
  engagement: number
  reach: number
  interactions: number
  likes?: number
  comments?: number
  shares?: number
  clicks?: number
  impressions?: number
}

export interface TopPost {
  _id: string
  content: string
  platform: string
  engagement: number
  engagementRate?: number
  date: string
}

export interface ComparisonData {
  platform: string
  currentPeriod: number
  previousPeriod: number
  change: number
}

export async function getDashboard(range?: number) {
  const { data } = await api.get('/analytics/dashboard', { params: { range } })
  // server response shape: { status: true, data: { ... } }
  return data.data
}

export async function getOptimalTimes() {
  const { data } = await api.get('/analytics/optimal-times')
  // server may return { status: true, data: [...] }
  const payload = data?.data ?? data
  if (!Array.isArray(payload)) return []
  // map server fields to OptimalTime shape
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return payload.map((t: any) => ({
    day: typeof t.dayOfWeek === 'number' ? dayNames[t.dayOfWeek] ?? String(t.dayOfWeek) : t.dayOfWeek,
    hour: t.hour,
    engagement: t.averageEngagement ?? t.engagement ?? 0,
  }))
}

export async function getTrends(period: string = '7d', granularity: string = 'daily', metric: string = 'engagement') {
  const { data } = await api.get('/analytics/trends', {
    params: { period, granularity, metric }
  })
  // server may return { status: true, data: { data: [...] , summary: {...} } }
  const payload = data?.data ?? data
  const items = payload?.data ?? payload
  if (!Array.isArray(items)) return []
  return items.map((d: any) => ({ date: d.date, value: d.value ?? d.engagement ?? 0, platform: d.platform }))
}

export async function getPlatformPerformance(platform?: string) {
  const { data } = await api.get('/analytics/platform-performance', {
    params: platform ? { platform } : undefined
  })
  const payload = data?.data ?? data
  if (!Array.isArray(payload)) return []
  return payload.map((p: any) => ({
    platform: p.platform,
    engagement: p.engagement ?? p.totalEngagement ?? 0,
    reach: p.reach ?? p.impressions ?? 0,
    interactions: p.interactions ?? 0,
    likes: p.likes ?? 0,
    comments: p.comments ?? 0,
    shares: p.shares ?? 0,
    clicks: p.clicks ?? 0,
    impressions: p.impressions ?? 0,
  }))
}

export async function getTopPosts(limit: number = 5) {
  const { data } = await api.get('/analytics/top-posts', {
    params: { limit }
  })
  const payload = data?.data ?? data
  if (!Array.isArray(payload)) return []
  return payload.map((p: any) => ({
    _id: p._id ?? p.id,
    content: p.content ?? p.post?.content ?? '',
    platform: p.platform ?? p.post?.platform ?? '',
    engagement: p.engagement ?? p.totalEngagement ?? 0,
    date: p.date ?? p.createdAt ?? p.post?.createdAt ?? '',
  }))
}

export async function getComparison(startDate: string, endDate: string) {
  const { data } = await api.get('/analytics/comparison', {
    params: { startDate, endDate }
  })
  const payload = data?.data ?? data
  // payload can be either an array of per-platform comparisons or an object with currentPeriod/previousPeriod totals
  if (Array.isArray(payload)) {
    return payload.map((c: any) => ({
      platform: c.platform,
      currentPeriod: c.currentPeriod ?? c.current ?? c.totalEngagement ?? 0,
      previousPeriod: c.previousPeriod ?? c.previous ?? 0,
      change: c.change ?? 0,
    }))
  }

  if (payload && typeof payload === 'object') {
    // Handle the aggregate shape { currentPeriod: {...}, previousPeriod: {...}, growth: {...} }
    const cur = payload.currentPeriod ?? {}
    const prev = payload.previousPeriod ?? {}
    // Build an array of metric entries for charting
    const entries: Array<any> = []
    // pick a set of numeric metrics to show
    const metrics = ['totalEngagement', 'likes', 'comments', 'shares', 'clicks', 'impressions']
    metrics.forEach((m) => {
      const curVal = Number(cur[m] ?? 0)
      const prevVal = Number(prev[m] ?? 0)
      entries.push({ platform: m, currentPeriod: curVal, previousPeriod: prevVal, change: curVal && prevVal ? (curVal - prevVal) / prevVal : 0 })
    })
    return entries
  }

  return []
}

export async function getComparisonSummary(startDate: string, endDate: string) {
  const { data } = await api.get('/analytics/comparison', {
    params: { startDate, endDate }
  })
  return data?.data ?? data
}

export default {
  getDashboard,
  getOptimalTimes,
  getTrends,
  getPlatformPerformance,
  getTopPosts,
  getComparison
}
