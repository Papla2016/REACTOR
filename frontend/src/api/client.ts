import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let queue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean })
    if (error.response?.status !== 401 || originalRequest?._retry || originalRequest?.url?.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push((token: string) => {
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${token}`
          resolve(api(originalRequest))
        })
      })
    }

    isRefreshing = true
    originalRequest._retry = true

    try {
      const res = await api.post('/auth/refresh', { refresh_token: refreshToken })
      const newAccess = res.data.access_token
      const newRefresh = res.data.refresh_token
      localStorage.setItem('access_token', newAccess)
      localStorage.setItem('refresh_token', newRefresh)
      originalRequest.headers = originalRequest.headers || {}
      originalRequest.headers.Authorization = `Bearer ${newAccess}`
      queue.forEach((resume) => resume(newAccess))
      queue = []
      return api(originalRequest)
    } catch (refreshError) {
      queue = []
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
