import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,        // { id, email, fullName }
      token: null,
      organizationId: null,
      isAuthenticated: false,

      setAuth: (data) => set({
        user: { id: data.userId, email: data.email, fullName: data.fullName },
        token: data.accessToken,
        organizationId: data.organizationId,
        isAuthenticated: true,
      }),

      setOrganization: (orgId) => set({ organizationId: orgId }),

      logout: () => set({
        user: null,
        token: null,
        organizationId: null,
        isAuthenticated: false,
      }),
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