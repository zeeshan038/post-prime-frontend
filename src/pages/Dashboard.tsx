import { useState } from 'react'
import { Row, Col, Card, Statistic, Radio, Table, Tag, Space, Spin } from 'antd'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend, Cell } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/analytics'

const Dashboard = () => {
  const [range, setRange] = useState(7)

  const colors = ['#22C55E', '#16A34A', '#A3E635'] // green palette

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', range],
    queryFn: () => getDashboard(range),
  })

  const dashboard = data?.data ?? data ?? {}

  const totals = dashboard?.totals ?? {}
  const totalPosts =
    (totals.posts?.published ?? 0) +
    (totals.posts?.scheduled ?? 0) +
    (totals.posts?.draft ?? 0)
  const totalEngagement = totals.engagement?.allTime ?? 0
  const avgEngagement = totals.avgEngagementRate ?? 0

  const chartData = Array.isArray(dashboard?.chart)
    ? dashboard.chart.map((c: any) => ({
        date: new Date(c.date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        engagement: c.value,
      }))
    : []

  const topPostsData = Array.isArray(dashboard?.topPosts)
    ? dashboard.topPosts.map((p: any) => ({
        id: p._id,
        title: p.post?.content ?? '',
        platform: p.post?.platform ?? '',
        engagements: p.totalEngagement ?? 0,
      }))
    : []

  const optimalTimesList = Array.isArray(dashboard?.optimalPostingTimes)
    ? dashboard.optimalPostingTimes.map((t: any) => ({
        day:
          [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ][t.dayOfWeek] ?? String(t.dayOfWeek),
        hour: `${((t.hour + 11) % 12) + 1}:00 ${t.hour >= 12 ? 'PM' : 'AM'}`,
        avg: Math.round(t.averageEngagement),
      }))
    : []

  const platformMap: Record<string, number> = {}
  if (Array.isArray(dashboard?.topPosts)) {
    dashboard.topPosts.forEach((p: any) => {
      const platform = p.post?.platform ?? 'unknown'
      platformMap[platform] = (platformMap[platform] || 0) + (p.totalEngagement ?? 0)
    })
  }
  const platformData = Object.entries(platformMap).map(([platform, engagements]) => ({
    platform,
    engagements,
  }))

  const topPostsColumns = [
    {
      title: 'Post',
      dataIndex: 'title',
      key: 'title',
      render: (t: string) => <div style={{ maxWidth: 200 }}>{t}</div>,
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      render: (p: string) => (
        <Tag
          color={
            p === 'twitter' ? 'blue' : p === 'facebook' ? 'geekblue' : p === 'linkedin' ? 'green' : 'gray'
          }
        >
          {p}
        </Tag>
      ),
    },
    { title: 'Engagements', dataIndex: 'engagements', key: 'engagements' },
  ]

  return isLoading ? (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <Spin size="large" />
    </div>
  ) : (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 16 }}>
            <Statistic title="Total Posts" value={totalPosts} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 16 }}>
            <Statistic title="Total Engagement" value={totalEngagement} suffix=" interactions" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 16 }}>
            <Statistic title="Avg Engagement" value={avgEngagement} suffix="%" precision={1} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 16 }}>
            <Statistic title="Scheduled Posts" value={totals.posts?.scheduled ?? 0} />
          </Card>
        </Col>
      </Row>

      {/* Chart + Top Posts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card style={{ borderRadius: 16, height: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>Engagement Trend</div>
              <Radio.Group value={String(range)} onChange={(e) => setRange(Number(e.target.value))}>
                <Radio.Button value="7">7 Days</Radio.Button>
                <Radio.Button value="30">30 Days</Radio.Button>
              </Radio.Group>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="engagement" stroke="#16A34A" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Top Posts" style={{ borderRadius: 16, height: 400 }}>
            <Table columns={topPostsColumns} dataSource={Array.isArray(topPostsData) ? topPostsData : []} pagination={false} rowKey="id" size="small" />
          </Card>
        </Col>
      </Row>

      {/* Platform Chart + Optimal Times */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Platform Performance" style={{ borderRadius: 16 }}>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="engagements">
                    {platformData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Optimal Posting Times" style={{ borderRadius: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {optimalTimesList.map((t: any, i: number) => (
                <div key={i}>
                  <div style={{ fontWeight: 600 }}>{t.day} · {t.hour}</div>
                  <div style={{ color: '#555' }}>Avg: {t.avg}</div>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}

export default Dashboard
