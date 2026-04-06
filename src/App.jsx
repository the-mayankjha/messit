import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { useStore } from './store/useStore';
import { ACCENT_COLORS } from './constants/colors';
import Dashboard from './pages/Dashboard';
import UploadMenu from './pages/UploadMenu';
import Settings from './pages/Settings';
import Search from './pages/Search';
import Onboarding from './pages/Onboarding';
import AdminDashboard from './pages/AdminDashboard';
import { UtensilsCrossed } from 'lucide-react';
import { SettingsIcon } from './components/ui/icons/SettingsIcon';
import { BellRingIcon } from './components/ui/icons/BellRingIcon';
import { DashboardIcon } from './components/ui/icons/DashboardIcon';
import { SearchIcon } from './components/ui/icons/SearchIcon';
import { useAuth0 } from '@auth0/auth0-react';
import { requestNotificationPermission, sendNotification } from './utils/notifier';
import NotificationDrawer from './components/NotificationDrawer';
import InstallPrompt from './components/InstallPrompt';
import { CoffeeIcon } from './components/ui/icons/CoffeeIcon';
import { LunchIcon } from './components/ui/icons/LunchIcon';
import { SnacksIcon } from './components/ui/icons/SnacksIcon';
import { DinnerIcon } from './components/ui/icons/DinnerIcon';
import { CookingPotIcon } from './components/ui/icons/CookingPotIcon';
import { CalendarDaysIcon } from './components/ui/icons/CalendarDaysIcon';
import { getMessMenu } from './lib/supabase';
import { CloudUploadIcon } from './components/ui/icons/CloudUploadIcon';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import { WifiAnimatedIcon } from './components/ui/icons/WifiAnimatedIcon';
import { WifiOffAnimatedIcon } from './components/ui/icons/WifiOffAnimatedIcon';
import { subscribeToPushNotifications, updatePushDebug } from './utils/push';
import { Workbox } from 'workbox-window';

export default function App() {
  const pushSyncAttemptedRef = useRef(false);
  const { 
    theme, 
    accentColor,
    menuData, 
    notificationMode, 
    isNotificationPending, 
    setNotificationPending,
    isOnboarded,
    setIsOnboarded,
    setUser,
    user,
    setProfile,
    hostel, // Track profile completion
    messType, // Support cloud sync
    role,
    notifications, 
    setDrawerOpen,
    isSyncing,
    syncStatus,
    setSyncStatus,
    setMenuData,
    cloudMenuInfo,
    setCloudMenuInfo,
    addNotification,
    updateNotification,
    removeNotificationByAnnouncementId,
    isOnline,
    setIsOnline,
    setIsUpdateAvailable,
  } = useStore();

  const unreadCount = notifications.filter(n => !n.read).length;

  const { user: auth0User, isAuthenticated, isLoading } = useAuth0();

  // 1. ALL HOOKS MUST BE DEFINED HERE (Top Level)
  
  // Page State
  const [currentPage, setCurrentPage] = useState(menuData ? 'dashboard' : 'upload');
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);

  // Theme & Accent Logic
  const [systemTheme, setSystemTheme] = useState(
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  // Connection Status Logic
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger a re-sync when coming back online
      setSyncStatus({ isSyncing: false, syncStatus: 'idle' });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline, setSyncStatus]);

  // PWA UPDATE WATCHDOG
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || import.meta.env.DEV) return;

    const wb = new Workbox('/sw.js');

    const handleUpdate = () => {
      setIsUpdateAvailable(true);
      window.dispatchEvent(new CustomEvent('messit-update-available'));

      // 🔊 SHOUT: Persona-styled update alert
      const prefix = notificationMode === 'stud' ? '💪 Bro! 🔥' : '✨ For You, Princess... 🎀';
      sendNotification(
        `${prefix} New Build Ready!`,
        `Swipe to Settings to grab the latest premium features and fixes...`
      );
    };

    wb.addEventListener('waiting', handleUpdate);
    wb.register();

    // Check for updates when the app is focused (foregrounded)
    const checkUpdate = () => wb.update();
    window.addEventListener('focus', checkUpdate);
    return () => window.removeEventListener('focus', checkUpdate);
  }, []);

  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  const accentHex = ACCENT_COLORS[accentColor]?.[effectiveTheme] || ACCENT_COLORS.Blue[effectiveTheme];
  
  // Refs for animations
  const bellRef = useRef(null);
  const settingsIconRef = useRef(null);
  const uploadIconRef = useRef(null);
  const searchIconRef = useRef(null);
  const mobileSettingsIconRef = useRef(null);
  const mobileUploadIconRef = useRef(null);
  const mobileSearchIconRef = useRef(null);

  // 1. Clean up duplicate notification IDs from old sessions
  useEffect(() => {
    const state = useStore.getState();
    if (state.notifications.length > 0) {
      const seenIds = new Set();
      const uniqueNotifications = state.notifications.map(notif => {
        if (seenIds.has(notif.id)) {
          // Re-generate ID for duplicate
          return { ...notif, id: `${notif.id}-fixed-${Math.random().toString(36).substr(2, 5)}` };
        }
        seenIds.add(notif.id);
        return notif;
      });
      
      if (uniqueNotifications.some((n, i) => n.id !== state.notifications[i].id)) {
        useStore.setState({ notifications: uniqueNotifications });
      }
    }
  }, []);

  // Sync Auth0 User with Store + Fetch Supabase Profile
  useEffect(() => {
    const syncUserAndProfile = async () => {
      if (!isOnline) {
        setIsSyncingProfile(false);
        return;
      }
      if (isAuthenticated && auth0User) {
        setIsSyncingProfile(true);
        setUser({
          name: auth0User.name,
          email: auth0User.email,
          picture: auth0User.picture
        });

        // 🚀 SMART PROFILE REFRESH:
        // Always fetch the latest profile from Supabase for authenticated users
        // to ensure roles, names, and preferences are perfectly in sync.
        try {
          const { getSupabaseProfile, syncSupabaseProfile } = await import('./lib/supabase');
          const { success, data } = await getSupabaseProfile(auth0User.email);

          if (success && data) {
            const nextProfile = {
              ...data,
              email: auth0User.email,
              name: auth0User.name,
              picture: auth0User.picture || data.picture || null,
            };

            const shouldRefreshProfile =
              data.name !== auth0User.name ||
              data.picture !== auth0User.picture;

            if (shouldRefreshProfile) {
              const syncRes = await syncSupabaseProfile(nextProfile);
              if (syncRes.success && Array.isArray(syncRes.data) && syncRes.data[0]) {
                const syncedProfile = syncRes.data[0];
                nextProfile.roomNumber = syncedProfile.room_number ?? nextProfile.roomNumber;
                nextProfile.messType = syncedProfile.mess_type ?? nextProfile.messType;
                nextProfile.picture = syncedProfile.picture ?? nextProfile.picture;
              }
            }

            // Check for role change to notify student
            if (role === 'None' && data.role !== 'None') {
              const { addNotification, setNotificationPending } = useStore.getState();
              addNotification(
                "Protocol Clearance Received 🛡️",
                `Your authority request was approved! You are now a ${data.role}.`
              );
              setNotificationPending(true);
            }
            
            setProfile(nextProfile);
            setIsOnboarded(true);
          } else if (!hostel) {
            // New user without a profile in Supabase
            setIsOnboarded(false);
          } else {
            // Existing user (Guest mode or local-only)
            setIsOnboarded(true);
          }
        } catch (err) {
          console.error("Profile sync error:", err);
          if (!hostel) setIsOnboarded(false);
        }
        setIsSyncingProfile(false);
      }
    };

    syncUserAndProfile();
  }, [isAuthenticated, auth0User, setUser, hostel, setIsOnboarded, setProfile, isOnline]);

  // Sync current page with menuData availability
  useEffect(() => {
    if (!menuData && currentPage === 'dashboard') {
      setCurrentPage('upload');
    }
  }, [menuData, currentPage]);

  // Cloud Menu Sync Logic
  useEffect(() => {
    const syncCloudMenu = async () => {
      if (!isOnline) {
        if (syncStatus !== 'idle') setSyncStatus({ isSyncing: false, syncStatus: 'idle' });
        return;
      }
      if (isSyncing || !isAuthenticated || !hostel || syncStatus !== 'idle') return;
      
      setSyncStatus({ isSyncing: true, syncStatus: 'syncing' });
      try {
        const { getMessMenu } = await import('./lib/supabase');
        const res = await getMessMenu(hostel, messType);
        
        if (res.success && res.data) {
          const syncMeta = {
            updatedAt: res.updatedAt,
            messType: res.actualMessType,
            isFallback: res.isFallback
          };
          
          setMenuData(res.data);
          setCloudMenuInfo(syncMeta);
          
          setSyncStatus({ 
            isSyncing: false, 
            syncStatus: 'success',
            lastSyncedAt: new Date().toISOString()
          });

          // 🛡️ SYNC INTELLIGENCE: Notify in the Manager instead of Dashboard
          const timeStr = new Date(res.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateStr = new Date(res.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
          
          const title = res.isFallback ? 'Intelligence Fallback Active ⚠️' : 'Protocol Fully Synced ✅';
          const body = res.isFallback 
            ? `Showing ${res.actualMessType} menu. Your specific profile is not yet available in the vault.`
            : `Verified ${res.actualMessType} intelligence is active. Last integrity check: ${dateStr}, ${timeStr}`;
          
          const state = useStore.getState();
          // Avoid duplicate sync notifications in the same session/load
          const lastNotif = state.notifications[0];
          if (!lastNotif || lastNotif.body !== body) {
            state.addNotification(title, body);
            state.setNotificationPending(true);
          }
        } else {
          setSyncStatus({ isSyncing: false, syncStatus: 'idle' });
        }
      } catch (err) {
        console.error("Sync Error:", err);
        setSyncStatus({ isSyncing: false, syncStatus: 'error' });
      }
    };

    if (!isLoading) syncCloudMenu();
  }, [isAuthenticated, isLoading, hostel, messType, setMenuData, setSyncStatus, isSyncing, syncStatus, setCloudMenuInfo, isOnline]);

  // 🔔 HIGH-DENSITY REALTIME BROADCASTS & ADMIN ALERTS
  useEffect(() => {
    let announcementChannel = null;
    let requestChannel = null;

    const setupRealtime = async () => {
      const { supabase, getAnnouncements } = await import('./lib/supabase');
      const state = useStore.getState();
      
      // 0. Sync Historical Announcements (Ensuring they are in the Manager)
      try {
        const histRes = await getAnnouncements();
        if (histRes.success && histRes.data) {
          const existingAnnIds = state.notifications
            .filter(n => n.announcementId)
            .map(n => n.announcementId);
          
          histRes.data.reverse().forEach(ann => {
            if (!existingAnnIds.includes(ann.id)) {
              const title = `📢 ${ann.title}`;
              state.addNotification(title, ann.content, { 
                id: `announcement-${ann.id}`,
                announcementId: ann.id 
              });
            }
          });
        }
      } catch (e) {
        console.error("Historical Sync Error:", e);
      }
      
      // 1. Global Announcements (For Everyone) — INSERT, UPDATE, DELETE
      announcementChannel = supabase.channel(`announcements-${Date.now()}`);
      announcementChannel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'announcements' },
          (payload) => {
            const title = `📢 ${payload.new.title}`;
            const content = payload.new.content;
            sendNotification(null, notificationMode, title, content);
            window.dispatchEvent(new CustomEvent('new-announcement'));
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'announcements' },
          (payload) => {
            // Sync edited announcement into the notification drawer in real-time
            const { updateNotification } = useStore.getState();
            updateNotification(payload.new.id, payload.new.title, payload.new.content);
            window.dispatchEvent(new CustomEvent('new-announcement'));
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'announcements' },
          (payload) => {
            // Remove deleted announcement from the notification drawer immediately
            const { removeNotificationByAnnouncementId } = useStore.getState();
            removeNotificationByAnnouncementId(payload.old.id);
            window.dispatchEvent(new CustomEvent('new-announcement'));
          }
        )
        .subscribe();

      // 2. Admin Security Alerts (Only for Admins)
      if (role === 'Admin') {
        requestChannel = supabase.channel(`admin-alerts-${Date.now()}`);
        requestChannel
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'coordinator_requests' },
            (payload) => {
              addNotification(
                "New Security Petition 🛡️",
                `Student ${payload.new.user_name} is requesting Coordinator access. Review required.`
              );
              setNotificationPending(true);
              // Dispatch event for AdminDashboard to re-fetch if open
              window.dispatchEvent(new CustomEvent('new-coordinator-request'));
            }
          )
          .subscribe();
      }
    };

    setupRealtime();

    return () => {
      import('./lib/supabase').then(({ supabase }) => {
        if (announcementChannel) supabase.removeChannel(announcementChannel);
        if (requestChannel) supabase.removeChannel(requestChannel);
      });
    };
  }, [notificationMode, role, addNotification, setNotificationPending]);

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Notifications Logic
  useEffect(() => {
    const { lastNotifiedMeal, setLastNotifiedMeal } = useStore.getState();
    if ("Notification" in window && Notification.permission !== "denied") {
      requestNotificationPermission();
    }

    const checkMealTimes = () => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const hours = now.getHours();
      const mins = now.getMinutes();

      if (!menuData) return;

      const schedules = [
        { name: 'Breakfast', h: 7, m: 10 },
        { name: 'Lunch', h: 12, m: 25 },
        { name: 'Snacks', h: 16, m: 40 },
        { name: 'Dinner', h: 19, m: 10 }
      ];

      schedules.forEach(s => {
        const mealID = `${dateStr}_${s.name.toLowerCase()}`;
        if (hours === s.h && mins === s.m && lastNotifiedMeal !== mealID) {
          sendNotification(s.name, notificationMode);
          setLastNotifiedMeal(mealID);
        }
      });
    };

    checkMealTimes();
    const interval = setInterval(checkMealTimes, 60000);
    return () => clearInterval(interval);
  }, [notificationMode, menuData]);

  useEffect(() => {
    if (isNotificationPending && bellRef.current) {
      bellRef.current.shake();
      // Reset after animation duration to allow re-triggering for next notification
      const timer = setTimeout(() => {
        setNotificationPending(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isNotificationPending, setNotificationPending]);

  useEffect(() => {
    const syncPushSubscription = async () => {
      // 1. Pre-check: Don't sync if offline or push not supported
      if (!isOnline || !('Notification' in window)) return;
      
      // 2. Permission check: Only sync if granted
      if (Notification.permission !== 'granted') {
          updatePushDebug({ stage: 'sync_skipped', reason: 'permission_not_granted' });
          return;
      }

      // 3. Prevent redundant syncs within the same session unless profile data changes
      const syncKey = `${auth0User?.email || user?.email}:${hostel}:${messType}:${role}`;
      const blockedSyncKey = `messit-push-blocked:${syncKey}`;
      if (pushSyncAttemptedRef.current === syncKey) return;
      if (sessionStorage.getItem(blockedSyncKey) === 'true') {
        updatePushDebug({ stage: 'sync_skipped', reason: 'session_blocked_after_push_abort' });
        return;
      }
      pushSyncAttemptedRef.current = syncKey;

      try {
        updatePushDebug({ stage: 'sync_start' });
        const { success, subscription, reason, error } = await subscribeToPushNotifications();
        
        if (!success || !subscription) {
          if (reason && reason !== 'unsupported') {
            console.warn('Push sync subscription failed:', reason, error || '');
          }
          updatePushDebug({ lastSyncStatus: 'subscription_failed', lastError: error || reason });
          const isPushServiceAbort =
            reason === 'subscription_failed' &&
            typeof error === 'string' &&
            error.includes('Registration failed - push service error');

          if (isPushServiceAbort) {
            // Instead of just blocking, we flag it so the UI can offer troubleshooting
            sessionStorage.setItem(blockedSyncKey, 'true');
            updatePushDebug({ 
              stage: 'sync_blocked', 
              reason: 'push_service_error',
              suggestion: 'Try "Reset Push Service" in Settings if this persists.'
            });
            
            addNotification(
              "Push Sync Interrupted ⚡", 
              "Your browser's push engine reported a service error. If you don't receive notifications, please visit Settings > Notification Health."
            );
            return;
          }
          // Reset attempt ref to allow retry on next render if it failed at subscription level
          pushSyncAttemptedRef.current = false;
          return;
        }

        const serializedSubscription = subscription.toJSON();
        const { upsertPushSubscription } = await import('./lib/supabase');

        const result = await upsertPushSubscription({
          subscription: serializedSubscription,
          email: auth0User?.email || user?.email || null,
          hostel,
          messType,
          role,
          notificationMode,
        });

        if (!result.success) {
          console.warn('Push backend sync failed:', result.error);
          updatePushDebug({ lastSyncStatus: 'db_failed', dbError: result.error });
          pushSyncAttemptedRef.current = false;
        } else {
          updatePushDebug({ lastSyncStatus: 'synced_successfully', lastSyncTime: new Date().toISOString() });
        }
      } catch (error) {
        console.error('Push sync process crashed:', error);
        updatePushDebug({ lastSyncStatus: 'crashed', crashError: error?.message || String(error) });
        pushSyncAttemptedRef.current = false;
      }
    };

    syncPushSubscription();
  }, [auth0User?.email, user?.email, hostel, messType, role, isOnline]);

  useEffect(() => {
    const handleUpdateAvailable = () => {
      const notifiedKey = `messit-update-available-${__APP_VERSION__}`;

      if (sessionStorage.getItem(notifiedKey)) return;
      sessionStorage.setItem(notifiedKey, 'true');

      let title = 'Latest App Update Available';
      let body = `A newer Messit build is ready. Open Settings and tap Get Latest Version to update from v${__APP_VERSION__}.`;

      if (notificationMode === 'princess') {
        title = 'A Lovely Update for My Princess ✨';
        body = `A fresh Messit build is waiting for you. Please visit Settings to enjoy the latest enhancements, Princess! 🎀`;
      } else if (notificationMode === 'stud') {
        title = 'Bro! Fresh Build Ready 🔥';
        body = `New version v${__APP_VERSION__} is live. Go to Settings and upgrade your rig now! 💪`;
      }

      sendNotification(null, notificationMode, title, body);
    };

    window.addEventListener('messit-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('messit-update-available', handleUpdateAvailable);
    };
  }, [notificationMode]);

  // 2. CONDITIONAL RETURNS (After all hooks)

  const needsOnboarding = isAuthenticated ? !hostel : !isOnboarded;

  // ─── SMART LOADING GATE ─────────────────────────────────────────
  // Show the splash ONLY when there is no local cache at all.
  // If the user is returning (has menuData + isOnboarded), go straight
  // to the app and let Auth0 session check + Supabase sync run in the
  // background silently. No unnecessary splash on every open.
  const isOfflineMode = !navigator.onLine && !isOnline;
  const hasLocalCache = !!menuData && isOnboarded;

  if ((isLoading || isSyncingProfile) && !hasLocalCache) {
    const loadingText = notificationMode === 'princess' 
      ? 'Cooking Delicious Meal for My Princess' 
      : 'Cooking you Delicious Meal';

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-12 text-center overflow-hidden">
        <div className="relative w-full max-w-[280px] overflow-hidden mask-fade-edges py-4 opacity-50">
          <motion.div 
            className="flex gap-10 whitespace-nowrap"
            animate={{ x: [0, -384] }}
            transition={{ 
              duration: 12, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-10 shrink-0">
                <CoffeeIcon size={32} className="text-foreground shrink-0" />
                <LunchIcon size={32} className="text-foreground shrink-0" />
                <SnacksIcon size={32} className="text-foreground shrink-0" />
                <DinnerIcon size={32} className="text-foreground shrink-0" />
                <CookingPotIcon size={32} className="text-foreground shrink-0" />
                <CalendarDaysIcon size={32} className="text-foreground shrink-0" />
              </div>
            ))}
          </motion.div>
        </div>

        <div className="space-y-4 max-w-xs">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] font-black tracking-[0.3em] uppercase text-foreground/60 italic"
          >
            {loadingText}
          </motion.p>
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.4, 1],
                  opacity: [0.2, 0.6, 0.2] 
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  delay: i * 0.3 
                }}
                className="w-1 h-1 rounded-full bg-foreground/30"
              />
            ))}
          </div>
          {isOfflineMode ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <WifiOffAnimatedIcon size={28} className="text-muted-foreground/50" />
              <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-widest">
                You're Offline · Cached Data
              </p>
            </motion.div>
          ) : (
            <p className="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-widest pt-4">
              Establishing Secure Tunnel...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding />;
  }

  const BellWithBadge = ({ isMobile = false }) => {
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
      <div className="relative">
        <BellRingIcon 
          ref={bellRef} 
          className={`${isMobile ? '' : 'text-muted-foreground/60 hover:text-foreground'} transition-colors cursor-pointer p-2 hover:bg-muted/50 rounded-xl`}
          size={22}
          strokeWidth={1.8}
          onClick={() => setDrawerOpen(true)}
        />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-background shadow-sm pointer-events-none"
            style={{ backgroundColor: accentHex }}
          />
        )}
      </div>
    );
  };

  const navItems = [
    { id: 'dashboard', label: 'Menu', icon: CookingPotIcon },
    { id: 'search', label: 'Search', icon: SearchIcon },
    { id: 'upload', label: (role && role !== 'None') ? 'Admin' : 'Upload', icon: (role && role !== 'None') ? DashboardIcon : CloudUploadIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleNavClick = (id) => {
    setCurrentPage(id);
    if (id === 'settings') {
      settingsIconRef.current?.startAnimation();
      mobileSettingsIconRef.current?.startAnimation();
    }
    if (id === 'upload') {
      uploadIconRef.current?.startAnimation();
      mobileUploadIconRef.current?.startAnimation();
    }
    if (id === 'search') {
      searchIconRef.current?.startAnimation();
      mobileSearchIconRef.current?.startAnimation();
    }
  };

  if (!isOnboarded) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      
      {/* Notifications Hub */}
      <NotificationDrawer />

      {/* Connection Recovery Indicator */}
      <OfflineIndicator />

      {/* Browser install prompt */}
      <InstallPrompt />

      {/* Offline banner — shown instantly when device has no network */}
      {isOfflineMode && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-2 bg-muted/80 backdrop-blur-md border-b border-border/40"
        >
          <WifiOffAnimatedIcon size={14} className="text-muted-foreground/60" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Offline — Showing Cached Data
          </p>
        </motion.div>
      )}

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between h-20 px-6 lg:px-12 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 font-bold text-xl cursor-pointer group" onClick={() => handleNavClick(menuData ? 'dashboard' : 'upload')}>
            <img 
              src="/icon.png" 
              alt="Messit Logo" 
              className="w-9 h-9 rounded-xl object-contain shadow-md group-hover:scale-105 transition-transform duration-200" 
            />
            <span className="tracking-tight">Messit</span>
          </div>
          
          <nav className="hidden sm:flex items-center gap-2 sm:gap-6">
            <div className="flex items-center bg-muted/50 rounded-2xl p-1.5 gap-1 shadow-inner">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                if (item.id === 'dashboard' && !menuData) return null; // Hide dashboard if no data

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 relative ${
                      isActive 
                        ? 'bg-background text-primary-foreground shadow-sm font-semibold' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                  >
                    {item.id === 'settings' ? (
                      <SettingsIcon ref={settingsIconRef} size={19} strokeWidth={1.8} />
                    ) : item.id === 'upload' ? (
                      (role && role !== 'None') ? (
                        <DashboardIcon ref={uploadIconRef} size={19} strokeWidth={1.8} />
                      ) : (
                        <CloudUploadIcon ref={uploadIconRef} size={19} strokeWidth={1.8} />
                      )
                    ) : item.id === 'search' ? (
                      <SearchIcon ref={searchIconRef} size={19} strokeWidth={1.8} />
                    ) : (
                      <Icon className="w-4.5 h-4.5" size={19} strokeWidth={1.8} />
                    )}
                    <span className="hidden md:inline text-sm">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 bg-background rounded-xl -z-10 shadow-sm"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="h-8 w-px bg-border/60 mx-2 hidden sm:block" />
            
            <div className="flex items-center">
              <BellWithBadge />
            </div>
          </nav>

          {/* Mobile Bell (visible only on mobile) */}
          <div className="sm:hidden flex items-center">
            <BellWithBadge isMobile={true} />
          </div>
        </div>
      </header>

      {/* Bottom Navigation for Mobile */}
      <nav className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[min(400px,90%)] bg-background/80 backdrop-blur-xl border border-border/40 rounded-[2rem] p-1.5 shadow-2xl flex items-center justify-around gap-1 animate-in slide-in-from-bottom-10 duration-700">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          if (item.id === 'dashboard' && !menuData) return null;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl transition-all duration-300 relative"
              style={{ color: isActive ? accentHex : undefined }}
            >
              {item.id === 'settings' ? (
                <SettingsIcon ref={isActive ? mobileSettingsIconRef : null} size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              ) : item.id === 'upload' ? (
                (role && role !== 'None') ? (
                  <DashboardIcon ref={isActive ? mobileUploadIconRef : null} size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                ) : (
                  <CloudUploadIcon ref={isActive ? mobileUploadIconRef : null} size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                )
              ) : item.id === 'search' ? (
                <SearchIcon ref={isActive ? mobileSearchIconRef : null} size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              ) : (
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              )}
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="active-pill-mobile"
                  className="absolute inset-0 rounded-2xl -z-10"
                  style={{ backgroundColor: `${accentHex}10` }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 pb-28 sm:pb-20">
        <LayoutGroup>
          {currentPage === 'dashboard' ? (
            <Dashboard />
          ) : currentPage === 'search' ? (
            <Search />
          ) : currentPage === 'upload' ? (
            (role && role !== 'None') ? (
              <AdminDashboard />
            ) : (
              <UploadMenu onComplete={() => setCurrentPage('dashboard')} />
            )
          ) : currentPage === 'settings' ? (
            <Settings />
          ) : null}
        </LayoutGroup>
      </main>

    </div>
  );
}
