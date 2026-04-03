import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      // Settings
      theme: 'system', // 'light', 'dark', 'system'
      notificationMode: 'stud', // 'stud', 'princess'
      
      setTheme: (theme) => set({ theme }),
      setNotificationMode: (notificationMode) => set({ notificationMode }),

      // Onboarding & Auth
      isOnboarded: false,
      user: null, // { name, email, picture }
      
      // Profile Details
      hostel: null, // 'MH1'-'MH7', 'LH1'-'LH5'
      roomNumber: '',
      messType: 'Veg', // 'Veg', 'Non-Veg', 'Special'
      gender: null, // 'Male', 'Female'
      role: 'None', // 'Admin', 'Coordinator', 'Developer', 'None'

      setIsOnboarded: (isOnboarded) => set({ isOnboarded }),
      setUser: (user) => set({ user }),
      
      setProfile: (profile) => set((state) => ({
        ...state,
        ...profile
      })),

      // Menu Data (Persistent)
      menuData: null,
      setMenuData: (menuData) => set({ menuData }),

      // Notification Tracking (Persistent)
      lastNotifiedMeal: null,
      setLastNotifiedMeal: (lastNotifiedMeal) => set({ lastNotifiedMeal }),

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
