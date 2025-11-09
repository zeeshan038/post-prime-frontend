import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

// Primary axios instance used across the app
export const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
})

// A separate client without interceptors to call the refresh endpoint
export const refreshClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
})

// Attach access token (if any) from localStorage to each request
api.interceptors.request.use((config: AxiosRequestConfig) => {
  try {
    const token = localStorage.getItem('accessToken')
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
  } catch (e) {
    // ignore
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (err: any) => void
  config: AxiosRequestConfig
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      if (token && prom.config.headers) prom.config.headers['Authorization'] = `Bearer ${token}`
      prom.resolve(api(prom.config))
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    const originalRequest = err.config as AxiosRequestConfig & { _retry?: boolean }

    if (err.response && err.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      return new Promise(async (resolve, reject) => {
        try {
          // Call refresh endpoint using the refreshClient so we don't re-enter this interceptor
          const { data } = await refreshClient.post('/user/refresh-token')
          const newToken = data?.accessToken
          if (newToken) {
            try {
              localStorage.setItem('accessToken', newToken)
            } catch (e) {
              // ignore storage errors
            }
          }
          processQueue(null, newToken)
          originalRequest.headers = originalRequest.headers || {}
          if (newToken) originalRequest.headers['Authorization'] = `Bearer ${newToken}`
          resolve(api(originalRequest))
        } catch (refreshError) {
          processQueue(refreshError, null)
          // Clear local auth state and redirect to login on refresh failure
          try {
            localStorage.removeItem('accessToken')
          } catch (e) {
            // ignorec
          }
          // navigate to login page to force re-authentication
          if (typeof window !== 'undefined') {
            try {
              window.location.href = '/login'
            } catch (e) {
              // ignore
            }
          }
          reject(refreshError)
        } finally {
          isRefreshing = false
        }
      })
    }

    return Promise.reject(err)
  },
)

