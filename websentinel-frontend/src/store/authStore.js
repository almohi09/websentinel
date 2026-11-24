import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null, // { id, email, fullName }
      token: null,
      organizationId: null,
      isAuthenticated: false,

      setAuth: (data) => {
        const token = data.accessToken || data.token
        if (token) {
          localStorage.setItem('ws_token', token)
        }
        set({
          user: {
            id: data.userId || data.id,
            email: data.email || null,
            fullName: data.fullName || null,
          },
          token: token,
          organizationId: data.organizationId || null,
          isAuthenticated: !!token,
        })
      },

      setOrganization: (orgId) => set({ organizationId: orgId }),

      logout: () => {
        localStorage.removeItem('ws_token')
        localStorage.removeItem('ws_user')
        set({
          user: null,
          token: null,
          organizationId: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'ws_auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        organizationId: state.organizationId,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
