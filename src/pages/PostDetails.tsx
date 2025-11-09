import React, { useEffect, useState } from 'react'
import { Card, Tag, Spin, message } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/axios'
import { refreshAccessToken } from '../api/auth'
import dayjs from 'dayjs'

type Post = {
  _id: string
  content: string
  platform: string
  status: string
  createdAt: string
  metadata?: {
    hashtags?: string[]
    wordCount?: number
  }
}

const PostDetails: React.FC = () => {
  const { postId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState<Post | null>(null)

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

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = await ensureToken()
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined
        const { data } = await api.get(`/post/post/${postId}`, { headers })
        const postData: Post = data?.post ?? data
        setPost(postData)
      } catch (err) {
        message.error('Failed to load post')
        navigate('/posts')
      } finally {
        setLoading(false)
      }
    }

    if (postId) {
      fetchPost()
    }
  }, [postId, navigate])

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}><Spin size="large" /></div>
  }

  if (!post) {
    return null
  }

  return (
    <Card title="Post Details">
      <div style={{ marginBottom: 24 }}>
        <Tag color={post.platform === 'twitter' ? 'blue' : post.platform === 'linkedin' ? 'cyan' : 'magenta'}>
          {post.platform}
        </Tag>
        <Tag>{post.status}</Tag>
        <div style={{ float: 'right' }}>
          {dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}
        </div>
      </div>

      <div style={{ whiteSpace: 'pre-wrap', marginBottom: 24 }}>
        {post.content}
      </div>

      {post.metadata?.hashtags && post.metadata.hashtags.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4>Hashtags:</h4>
          <div>
            {post.metadata.hashtags.map((tag, index) => (
              <Tag key={index}>#{tag}</Tag>
            ))}
          </div>
        </div>
      )}

      {post.metadata?.wordCount !== undefined && (
        <div>
          <strong>Word count:</strong> {post.metadata.wordCount}
        </div>
      )}
    </Card>
  )
}

export default PostDetails