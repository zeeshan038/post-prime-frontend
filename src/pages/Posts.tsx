import React, { useCallback, useEffect, useState } from 'react'
import { Button, Table, Select, Row, Col, DatePicker, Input, Tag, Space, Spin, Modal, Form, message, Popconfirm, Tooltip } from 'antd'
import { EyeOutlined, EditOutlined, DeleteOutlined, BarChartOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { api } from '../lib/axios'
import { refreshAccessToken } from '../api/auth'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

// Debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

const { RangePicker } = DatePicker

type Post = {
  _id: string
  content: string
  platform: string
  status: string
  createdAt: string
}

const PLATFORMS = ['all', 'twitter', 'facebook', 'linkedin']
const STATUSES = ['all', 'draft', 'scheduled', 'published', 'failed']

const PLATFORM_OPTIONS = ['twitter', 'facebook', 'instagram', 'linkedin']

const Posts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)

  const [platform, setPlatform] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [search, setSearch] = useState<string>('')
  const debouncedSearch = useDebounce(search, 300)

  const LIMIT = 10
  const [currentPage, setCurrentPage] = useState(1)
  const [cursor, setCursor] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([])

  const navigate = useNavigate()

  const buildParams = (c: string | null) => {
    const params: Record<string, string | number | boolean> = { limit: LIMIT }
    if (c) params.cursor = c
    if (platform && platform !== 'all') params.platform = platform
    if (status && status !== 'all') params.status = status
    if (debouncedSearch) params.search = debouncedSearch
    if (range && range.length === 2) {
      params.startDate = range[0].startOf('day').toISOString()
      params.endDate = range[1].endOf('day').toISOString()
    }
    return params
  }

  const fetchPosts = useCallback(async (c: string | null) => {
    setLoading(true)
    try {
      let token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (!token) {
        try {
          const r = await refreshAccessToken()
          const newToken = r?.accessToken || r?.data?.accessToken || r?.data?.token
          if (newToken) {
            localStorage.setItem('accessToken', newToken)
            token = newToken
          }
        } catch (refreshErr) {
          console.warn('refresh failed', refreshErr)
          navigate('/login')
          return
        }
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const params = buildParams(c)
      const { data } = await api.get('/post/posts', { params, headers })

      const items: Post[] = Array.isArray(data) ? data : (data?.data ?? [])
      const next = data?.nextCursor ?? data?.meta?.nextCursor ?? null

      setPosts(items)
      setNextCursor(next)
      setCursor(c)
    } catch (err) {
      console.error('fetchPosts error', err)
    } finally {
      setLoading(false)
    }
  }, [platform, status, range, debouncedSearch, navigate])

  useEffect(() => {
    setCursorHistory([])
    setCurrentPage(1)
    fetchPosts(null)
  }, [fetchPosts])

  const handlePageChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && nextCursor) {
      setCursorHistory([...cursorHistory, cursor])
      setCurrentPage(currentPage + 1)
      fetchPosts(nextCursor)
    } else if (direction === 'prev' && currentPage > 1) {
      const newHistory = [...cursorHistory]
      const prevCursor = newHistory.pop()
      setCursorHistory(newHistory)
      setCurrentPage(currentPage - 1)
      fetchPosts(prevCursor ?? null)
    }
  }

  const columns = [
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      render: (text: string) => <div style={{ maxWidth: 480, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</div>,
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      render: (p: string) => {
        const color = p === 'twitter' ? 'blue' : p === 'linkedin' ? 'cyan' : 'magenta'
        return <Tag color={color}>{p}</Tag>
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag>{s}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Post) => (
        <Space>
          <Tooltip title="View">
            <Button type="text" icon={<EyeOutlined />} onClick={() => viewPost(record._id)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Tooltip title="Analytics">
            <Button type="text" icon={<BarChartOutlined />} onClick={() => viewAnalytics(record._id)} />
          </Tooltip>
          <Popconfirm title="Delete this post?" onConfirm={() => handleDelete(record._id)} okText="Yes" cancelText="No">
            <Tooltip title="Delete">
              <Button type="text" icon={<DeleteOutlined />} danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // modals / form state
  const [createVisible, setCreateVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [editing, setEditing] = useState<Post | null>(null)
  const [analyticsVisible, setAnalyticsVisible] = useState(false)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<any | null>(null)
  const [form] = Form.useForm()

  const ensureToken = async () => {
    let token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (!token) {
      try {
        const r = await refreshAccessToken()
        const newToken = r?.accessToken || r?.data?.accessToken || r?.data?.token
        if (newToken) {
          localStorage.setItem('accessToken', newToken)
          token = newToken
        }
      } catch (e) {
        navigate('/login')
        throw e
      }
    }
    return token
  }

  const viewPost = (id: string) => {
    navigate(`/posts/${id}`)
  }

  const openEdit = (record: Post) => {
    setEditing(record)
    form.setFieldsValue({
      content: record.content,
      platform: record.platform,
      status: record.status,
      scheduledAt: record.createdAt ? dayjs(record.createdAt) : null,
      hashtags: '',
    })
    setEditVisible(true)
  }

  const viewAnalytics = async (postId: string) => {
    try {
      setAnalyticsLoading(true)
      const token = await ensureToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const { data } = await api.get(`/post/analytics/${postId}`, { headers })
      const payload = data?.data ?? data
      setAnalyticsData(payload)
      setAnalyticsVisible(true)
    } catch (err) {
      console.error('analytics fetch error', err)
      message.error('Failed to load analytics')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const token = await ensureToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      await api.delete(`/post/delete/${id}`, { headers })
      message.success('Deleted')
      
      // Remove the post from local state immediately
      setPosts(prevPosts => prevPosts.filter(post => post._id !== id))
      
      // Refresh current page to ensure consistency
      fetchPosts(cursor)
    } catch (err) {
      console.log(err)
    }
  }

 const handleCreate = async (vals: any) => {
  try {
    const token = await ensureToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined
    const payload = {
      content: vals.content,
      platform: vals.platform,
      scheduledAt: vals.scheduledAt ? vals.scheduledAt.toISOString() : undefined,
      status: vals.status,
      metadata: {
        hashtags: vals.hashtags ? vals.hashtags.split(',').map((s: string) => s.trim()) : [],
        wordCount: vals.content ? vals.content.split(/\s+/).filter(Boolean).length : 0,
      },
    }

    const response = await api.post('/post/create', payload, { headers })
    const newPost = response.data?.data || { ...payload, _id: Date.now().toString(), createdAt: new Date().toISOString() }

    // Optimistically update table
    setPosts(prevPosts => [newPost, ...prevPosts]) 
    message.success('Post created!')

    // Close modal
    setCreateVisible(false)
    form.resetFields()
  } catch (err) {
    console.error(err)
    message.error('Create failed')
  }
}


  const handleUpdate = async (vals: any) => {
    if (!editing) return
    try {
      const token = await ensureToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const payload = {
        content: vals.content,
        platform: vals.platform,
        scheduledAt: vals.scheduledAt ? vals.scheduledAt.toISOString() : undefined,
        status: vals.status,
        metadata: {
          hashtags: vals.hashtags ? vals.hashtags.split(',').map((s: string) => s.trim()) : [],
          wordCount: vals.content ? vals.content.split(/\s+/).filter(Boolean).length : 0,
        },
      }
      const response = await api.post(`/post/update/${editing._id}`, payload, { headers })
      message.success('Updated')
      setEditVisible(false)
      
      // Update the post in the local state immediately
      const updatedPost = response.data?.data || { ...editing, ...payload }
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === editing._id ? { ...post, ...updatedPost } : post
        )
      )
      
      // Refresh current page to ensure consistency
      fetchPosts(cursor)
    } catch (err) {
      message.error('Update failed')
    }
  }

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <Space>
            <Select value={platform} onChange={(v) => setPlatform(v)} size="middle" style={{ width: 140 }} options={PLATFORMS.map((p) => ({ label: p, value: p }))} />
            <Select value={status} onChange={(v) => setStatus(v)} size="middle" style={{ width: 140 }} options={STATUSES.map((s) => ({ label: s, value: s }))} />
            <RangePicker onChange={(vals) => setRange(vals as any)} />
            <Input.Search placeholder="Search content" allowClear onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
          </Space>
        </Col>

        <Col>
          <Button type="primary" onClick={() => setCreateVisible(true)}>Add Post</Button>
        </Col>
      </Row>

      <Table<Post>
        columns={columns}
        dataSource={Array.isArray(posts) ? posts : []}
        rowKey={(r) => r._id}
        size="small"
        pagination={false}
        loading={loading}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 16 }}>
        <Space>
          <Button 
            onClick={() => handlePageChange('prev')} 
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <span>Page {currentPage}</span>
          <Button 
            onClick={() => handlePageChange('next')} 
            disabled={!nextCursor}
          >
            Next
          </Button>
        </Space>
      </div>

      {/* Create Modal */}
      <Modal title="Create Post" open={createVisible} onCancel={() => setCreateVisible(false)} footer={null}>
        <Form layout="vertical" form={form} onFinish={handleCreate}>
          <Form.Item name="content" label="Content" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="platform" label="Platform" rules={[{ required: true }]}>
            <Select options={PLATFORM_OPTIONS.map((p) => ({ label: p, value: p }))} />
          </Form.Item>
          <Form.Item name="scheduledAt" label="Scheduled At">
            <DatePicker showTime />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={STATUSES.filter(s => s !== 'all').map((s) => ({ label: s, value: s }))} />
          </Form.Item>
          <Form.Item name="hashtags" label="Hashtags (comma separated)">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" type="primary">Create</Button>
          </Form.Item>
        </Form>
      </Modal>

        {/* Analytics Modal */}
        <Modal
          title="Post Analytics"
          open={analyticsVisible}
          onCancel={() => setAnalyticsVisible(false)}
          footer={null}
        >
          <div style={{ minHeight: 160 }}>
            {analyticsLoading ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Spin />
              </div>
            ) : analyticsData ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 36, color: '#1890ff' }}>
                    <VideoCameraOutlined />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{analyticsData?.title ?? 'Post'}</div>
                    <div style={{ color: '#666' }}>{analyticsData?.platform ?? ''} • {analyticsData?._id ?? ''}</div>
                  </div>
                </div>

                <Row gutter={[12, 12]}>
                  <Col span={12}><div><strong>Likes:</strong> {analyticsData?.likes ?? analyticsData?.likeCount ?? 0}</div></Col>
                  <Col span={12}><div><strong>Comments:</strong> {analyticsData?.comments ?? analyticsData?.commentCount ?? 0}</div></Col>
                  <Col span={12}><div><strong>Shares:</strong> {analyticsData?.shares ?? analyticsData?.shareCount ?? 0}</div></Col>
                  <Col span={12}><div><strong>Clicks:</strong> {analyticsData?.clicks ?? analyticsData?.clickCount ?? 0}</div></Col>
                  <Col span={12}><div><strong>Impressions:</strong> {analyticsData?.impressions ?? analyticsData?.impressionCount ?? 0}</div></Col>
                  <Col span={12}><div><strong>Total Engagement:</strong> {analyticsData?.totalEngagement ?? analyticsData?.engagement ?? 0}</div></Col>
                </Row>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#666' }}>No analytics available</div>
            )}
          </div>
        </Modal>

      {/* Edit Modal */}
      <Modal title="Edit Post" open={editVisible} onCancel={() => setEditVisible(false)} footer={null}>
        <Form layout="vertical" form={form} onFinish={handleUpdate}>
          <Form.Item name="content" label="Content" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="platform" label="Platform" rules={[{ required: true }]}>
            <Select options={PLATFORM_OPTIONS.map((p) => ({ label: p, value: p }))} />
          </Form.Item>
          <Form.Item name="scheduledAt" label="Scheduled At">
            <DatePicker showTime />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={STATUSES.filter(s => s !== 'all').map((s) => ({ label: s, value: s }))} />
          </Form.Item>
          <Form.Item name="hashtags" label="Hashtags (comma separated)">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" type="primary">Update</Button>
          </Form.Item>
        </Form>
      </Modal>


    </div>
  )
}

export default Posts