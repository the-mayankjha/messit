import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      // Settings
      theme: 'system', // 'light', 'dark', 'system'
      accentColor: 'default', // 'default', 'red', 'blue', 'green', 'purple', 'orange'
      notificationMode: 'stud', // 'stud', 'princess'
      
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setNotificationMode: (notificationMode) => set({ notificationMode }),

      // Menu Data
      menuData: null, 
      setMenuData: (menuData) => set({ menuData }),

      // Onboarding & Auth
      isOnboarded: false,
      user: null, // { name, email } mock
      setIsOnboarded: (isOnboarded) => set({ isOnboarded }),
      setUser: (user) => set({ user }),

      // Real-time UI State (Un-persistent)
      isNotificationPending: false,
      isDrawerOpen: false,
      setNotificationPending: (isNotificationPending) => set({ isNotificationPending }),
      setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),

      // Notifications History (Persistent)
      notifications: [],
      addNotification: (title, body) => set((state) => ({
        notifications: [
          {
            id: Date.now().toString(),
            title,
            body,
            timestamp: new Date().toISOString(),
            read: false
          },
          ...state.notifications
        ].slice(0, 50) // Keep last 50
      })),
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      clearNotifications: () => set({ notifications: [] }),
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      })),
    }),
    {
      name: 'messit-storage',
    }
  )
);
