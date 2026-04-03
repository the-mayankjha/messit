import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { useStore } from './store/useStore';
import Dashboard from './pages/Dashboard';
import UploadMenu from './pages/UploadMenu';
import Settings from './pages/Settings';
import Search from './pages/Search';
import Onboarding from './pages/Onboarding';
import { UtensilsCrossed } from 'lucide-react';
import { SettingsIcon } from './components/ui/icons/SettingsIcon';
import { BellRingIcon } from './components/ui/icons/BellRingIcon';
import { DashboardIcon } from './components/ui/icons/DashboardIcon';
import { SearchIcon } from './components/ui/icons/SearchIcon';
import { useAuth0 } from '@auth0/auth0-react';
import { requestNotificationPermission, sendNotification } from './utils/notifier';
import NotificationDrawer from './components/NotificationDrawer';

export default function App() {
  const { 
    theme, 
    menuData, 
    notificationMode, 
    isNotificationPending, 
    setNotificationPending,
    isOnboarded,
    setIsOnboarded,
    setUser,
    hostel, // Track profile completion
    notifications, 
    setDrawerOpen
  } = useStore();

  const unreadCount = notifications.filter(n => !n.read).length;

  const { user: auth0User, isAuthenticated, isLoading } = useAuth0();

  // 1. ALL HOOKS MUST BE DEFINED HERE (Top Level)
  
  // Page State
  const [currentPage, setCurrentPage] = useState(menuData ? 'dashboard' : 'upload');
  
  // Refs for animations
  const bellRef = useRef(null);
  const settingsIconRef = useRef(null);
  const uploadIconRef = useRef(null);
  const searchIconRef = useRef(null);
  const mobileSettingsIconRef = useRef(null);
  const mobileUploadIconRef = useRef(null);
  const mobileSearchIconRef = useRef(null);

  // Sync Auth0 User with Store
  useEffect(() => {
    if (isAuthenticated && auth0User) {
      setUser({
        name: auth0User.name,
        email: auth0User.email,
        picture: auth0User.picture
      });

      if (!hostel) {
        setIsOnboarded(false);
      }
    }
  }, [isAuthenticated, auth0User, setUser, hostel, setIsOnboarded]);

  // Sync current page with menuData availability
  useEffect(() => {
    if (!menuData && currentPage === 'dashboard') {
      setCurrentPage('upload');
    }
  }, [menuData, currentPage]);

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
    }
  }, [isNotificationPending]);

  // 2. CONDITIONAL RETURNS (After all hooks)

  const needsOnboarding = isAuthenticated ? !hostel : !isOnboarded;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-6 text-center">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-primary animate-pulse">Initializing Identity...</p>
          <p className="text-[10px] text-muted-foreground mt-2">Checking secure tunnel to Auth0</p>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding />;
  }

  const BellWithBadge = ({ isMobile = false }) => (
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
          className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background shadow-sm pointer-events-none"
        />
      )}
    </div>
  );

  const navItems = [
    { id: 'dashboard', label: 'Menu', icon: UtensilsCrossed },
    { id: 'search', label: 'Search', icon: SearchIcon },
    { id: 'upload', label: 'Upload', icon: DashboardIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
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
                      <DashboardIcon ref={uploadIconRef} size={19} strokeWidth={1.8} />
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
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl transition-all duration-300 relative ${
                isActive 
                  ? 'bg-primary/10 text-primary-foreground' 
                  : 'text-muted-foreground/60'
              }`}
            >
              {item.id === 'settings' ? (
                <SettingsIcon ref={isActive ? mobileSettingsIconRef : null} size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              ) : item.id === 'upload' ? (
                <DashboardIcon ref={isActive ? mobileUploadIconRef : null} size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              ) : item.id === 'search' ? (
                <SearchIcon ref={isActive ? mobileSearchIconRef : null} size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              ) : (
                <Icon className="w-5 h-5" size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              )}
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="active-pill-mobile"
                  className="absolute inset-0 bg-primary/5 rounded-2xl -z-10"
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
            <UploadMenu onComplete={() => setCurrentPage('dashboard')} />
          ) : currentPage === 'settings' ? (
            <Settings />
          ) : null}
        </LayoutGroup>
      </main>

    </div>
  );
}
