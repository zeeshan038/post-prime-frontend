import { api, refreshClient } from '../lib/axios'

export type RegisterPayload = {
  name: string
  email: string
  password: string
  role: string
}

export async function registerUser(payload: RegisterPayload) {
  const { data } = await api.post('/user/register', payload)
  return data
}

export async function loginUser(email: string, password: string) {
  const { data } = await api.post('/user/login', { email, password })
  return data
}

export async function refreshAccessToken() {
  // use the refresh client that does not have the auth interceptor to avoid loops
  const { data } = await refreshClient.post('/user/refresh-token')
  return data
}

export async function logoutUser() {
  const { data } = await api.post('/user/logout')
  return data
}
