import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT from Zustand store or localStorage fallback on every request
api.interceptors.request.use((config) => {
  let token = useAuthStore.getState().token
  if (!token) {
    token = localStorage.getItem('ws_token')
  }
  if (!token) {
    try {
      const persisted = localStorage.getItem('ws_auth')
      if (persisted) {
        const parsed = JSON.parse(persisted)
        token = parsed?.state?.token
      }
    } catch (e) {
      // ignore JSON parse errors
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401, clear session and redirect to login (unless it's an auth endpoint or already on /login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || ''
      const isAuthCall = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register')

      // Do not trigger page reload/redirect on failed login/register credential attempts
      if (!isAuthCall) {
        useAuthStore.getState().logout()
        localStorage.removeItem('ws_token')
        localStorage.removeItem('ws_user')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
