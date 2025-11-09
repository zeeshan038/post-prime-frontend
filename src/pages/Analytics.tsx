import React, { useEffect, useRef, useState } from 'react'
import { Card, Row, Col, DatePicker, Select, Space, Button, Table, Spin, message, Statistic } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  getOptimalTimes,
  getTrends,
  getPlatformPerformance,
  getTopPosts,
  getComparison,
  type OptimalTime,
  type TrendData,
  type PlatformPerformance,
  type TopPost,
  type ComparisonData,  
} from '../api/analytics'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from 'recharts'

const { RangePicker } = DatePicker

const PLATFORMS = ['all', 'twitter', 'facebook', 'linkedin']
const PERIODS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
]
const METRICS = [
  { label: 'Engagement', value: 'engagement' },
  { label: 'Reach', value: 'reach' },
  { label: 'Interactions', value: 'interactions' },
]

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [platform, setPlatform] = useState<string>('all')
  const [period, setPeriod] = useState<string>('7d')
  const [metric, setMetric] = useState<string>('engagement')

  const [loading, setLoading] = useState<boolean>(true)
  const [optimalTimes, setOptimalTimes] = useState<OptimalTime[]>([])
  const [trends, setTrends] = useState<TrendData[]>([])
  const [platformPerformance, setPlatformPerformance] = useState<PlatformPerformance[]>([])
  const [topPosts, setTopPosts] = useState<TopPost[]>([])
  const [comparison, setComparison] = useState<ComparisonData[]>([])
  const [comparisonSummary, setComparisonSummary] = useState<any>(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const [optimalTimesData, trendsData, platformData, topPostsData, comparisonData, comparisonSummaryData] = await Promise.all([
        getOptimalTimes().catch(() => []),
        getTrends(period, 'daily', metric).catch(() => []),
        getPlatformPerformance(platform !== 'all' ? platform : undefined).catch(() => []),
        getTopPosts(5).catch(() => []),
        dateRange ? getComparison(dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')).catch(() => []) : Promise.resolve([]),
        dateRange ? (await import('../api/analytics')).getComparisonSummary(dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')).catch(() => null) : Promise.resolve(null),
      ])

      if (!mountedRef.current) return

      setOptimalTimes(Array.isArray(optimalTimesData) ? optimalTimesData : [])
      setTrends(Array.isArray(trendsData) ? trendsData : [])
      setPlatformPerformance(Array.isArray(platformData) ? platformData : [])
      setTopPosts(Array.isArray(topPostsData) ? topPostsData : [])
  setComparison(Array.isArray(comparisonData) ? comparisonData : [])
  setComparisonSummary(comparisonSummaryData ?? null)
    } catch (err) {
      console.error('analytics load error', err)
      if (mountedRef.current) message.error('Failed to load analytics')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, period, metric, dateRange])

  const handleExport = () => {
    const payload = { optimalTimes, trends, platformPerformance, topPosts, comparison }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'analytics-export.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const topPostsColumns = [
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      render: (text: string) => <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</div>,
    },
    { title: 'Platform', dataIndex: 'platform', key: 'platform' },
    { title: 'Engagement', dataIndex: 'engagement', key: 'engagement', sorter: (a: TopPost, b: TopPost) => (a.engagement ?? 0) - (b.engagement ?? 0) },
    { title: 'Engagement %', dataIndex: 'engagementRate', key: 'engagementRate', render: (r: number) => (r ? `${Number(r).toFixed(2)}%` : '-') },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (d: string) => dayjs(d).format('YYYY-MM-DD') },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space size="large">
            <RangePicker value={dateRange} onChange={(d) => setDateRange(d as any)} />
            <Select value={platform} onChange={setPlatform} style={{ width: 140 }} options={PLATFORMS.map(p => ({ label: p, value: p }))} />
            <Select value={period} onChange={setPeriod} style={{ width: 140 }} options={PERIODS} />
            <Select value={metric} onChange={setMetric} style={{ width: 160 }} options={METRICS} />
          </Space>
        </Col>
        <Col>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>Export Data</Button>
        </Col>
      </Row>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
      ) : (
        <>
          <Card title="Engagement Trends" style={{ marginBottom: 24 }}>
            <div style={{ height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={Array.isArray(trends) ? trends : []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d) => dayjs(d).format('MM/DD')} />
                  <YAxis />
                  <Tooltip labelFormatter={(d) => dayjs(d).format('YYYY-MM-DD')} />
                  <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Row gutter={24}>
            <Col span={12}>
              <Card title="Platform Performance" style={{ marginBottom: 24 }}>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Array.isArray(platformPerformance) ? platformPerformance : []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="platform" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="likes" stackId="a" fill="#8884d8" name="Likes" />
                        <Bar dataKey="comments" stackId="a" fill="#82ca9d" name="Comments" />
                        <Bar dataKey="shares" stackId="a" fill="#ffc658" name="Shares" />
                        <Bar dataKey="clicks" stackId="a" fill="#ff7a7a" name="Clicks" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="Optimal Posting Times" style={{ marginBottom: 24 }}>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={Array.isArray(optimalTimes) ? optimalTimes : []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="engagement" stroke="#16A34A" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>

          <Card title="Top Performing Posts" style={{ marginBottom: 24 }}>
            <Table columns={topPostsColumns} dataSource={Array.isArray(topPosts) ? topPosts : []} rowKey="_id" pagination={false} />
          </Card>

          {comparisonSummary && comparisonSummary.currentPeriod && (
            <Card title="Period Summary" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                {['totalEngagement', 'likes', 'comments', 'shares', 'clicks', 'impressions'].map((k) => {
                  const cur = Number(comparisonSummary.currentPeriod?.[k] ?? 0)
                  const prev = Number(comparisonSummary.previousPeriod?.[k] ?? 0)
                  const pct = prev > 0 ? ((cur - prev) / prev) * 100 : cur > 0 ? 100 : 0
                  const label = {
                    totalEngagement: 'Total Engagement',
                    likes: 'Likes',
                    comments: 'Comments',
                    shares: 'Shares',
                    clicks: 'Clicks',
                    impressions: 'Impressions',
                  }[k]
                  return (
                    <Col key={k} xs={24} sm={12} md={8} lg={4}>
                      <Statistic title={label} value={cur} suffix={<span style={{ color: pct >= 0 ? '#3f8600' : '#cf1322' }}>{pct >= 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`}</span>} />
                    </Col>
                  )
                })}
              </Row>
            </Card>
          )}

          {Array.isArray(comparison) && comparison.length > 0 && (
            <Card title="Period Comparison">
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="platform" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="currentPeriod" name="Current" fill="#8884d8" />
                    <Bar dataKey="previousPeriod" name="Previous" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default Analytics