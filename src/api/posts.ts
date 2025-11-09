import { api } from '../lib/axios'

export interface PostItem {
  _id?: string
  content: string
  platform: string
  status: string
  createdAt?: string
}

export async function getPosts(params: {
  page?: number
  pageSize?: number
  status?: string
  platform?: string
  search?: string
  startDate?: string
  endDate?: string
}) {
  const { data } = await api.get('/posts', { params })
  // Expect server envelope { status, data: { items, total, page, pageSize } }
  return data.data ?? data
}

export async function createPost(payload: PostItem) {
  const { data } = await api.post('/posts', payload)
  return data.data ?? data
}

export async function updatePost(id: string, payload: Partial<PostItem>) {
  const { data } = await api.put(`/posts/${id}`, payload)
  return data.data ?? data
}

export async function deletePost(id: string) {
  const { data } = await api.delete(`/posts/${id}`)
  return data.data ?? data
}

export default { getPosts, createPost, updatePost, deletePost }
