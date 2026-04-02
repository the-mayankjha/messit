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

      // Real-time UI State (Un-persistent)
      isNotificationPending: false,
      setNotificationPending: (isNotificationPending) => set({ isNotificationPending }),
    }),
    {
      name: 'messit-storage',
    }
  )
);
