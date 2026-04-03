import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { ACCENT_COLORS } from '../constants/colors';
import { X, BellOff, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRef, useEffect } from 'react';
import { BellRingIcon } from './ui/icons/BellRingIcon';

export default function NotificationDrawer() {
  const { 
    isDrawerOpen, 
    setDrawerOpen, 
    notifications, 
    removeNotification, 
    clearNotifications,
    markAllAsRead,
    accentColor,
    theme,
    dismissAnnouncement
  } = useStore();

  const systemTheme = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  const accentHex = ACCENT_COLORS[accentColor]?.[effectiveTheme] || ACCENT_COLORS.Blue[effectiveTheme];

  const bellRef = useRef(null);

  useEffect(() => {
    if (isDrawerOpen) {
      // Trigger a welcoming ring when drawer opens
      setTimeout(() => {
        bellRef.current?.startAnimation();
      }, 300);
    }
  }, [isDrawerOpen]);

  const handleClose = () => {
    setDrawerOpen(false);
    markAllAsRead();
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60]"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[min(400px,100%)] bg-background border-l border-border z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-muted/50 rounded-2xl text-foreground/80">
                  <BellRingIcon ref={bellRef} size={28} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="font-bold text-lg leading-none">Notifications</h2>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5 font-bold">Today's Updates</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              <AnimatePresence mode="popLayout" initial={false}>
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <NotificationItem 
                      key={notif.id} 
                      notification={notif} 
                      accentHex={accentHex}
                      onRemove={() => removeNotification(notif.id)}
                      onDismissAnnouncement={dismissAnnouncement}
                    />
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4"
                  >
                    <div className="p-6 bg-muted/50 rounded-full border border-dashed border-border">
                      <BellOff size={32} className="text-muted-foreground/40" />
                    </div>
                    <div>
                      <p className="font-bold text-muted-foreground/60">All Caught Up!</p>
                      <p className="text-xs text-muted-foreground/40 mt-1">No notifications for today.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer / Actions */}
            {notifications.length > 0 && (
              <div className="p-6 border-t border-border bg-secondary/10">
                <button
                  onClick={() => {
                    // Dismiss all announcement-linked banners before clearing
                    notifications.forEach(n => {
                      if (n.announcementId) dismissAnnouncement(n.announcementId);
                    });
                    clearNotifications();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-muted/50 hover:bg-muted text-muted-foreground font-bold text-sm transition-all border border-border group"
                >
                  Clear All Notifications
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function NotificationItem({ notification, onRemove, onDismissAnnouncement, accentHex }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      drag="x"
      dragConstraints={{ right: 200, left: -200 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 100) {
          if (notification.announcementId) onDismissAnnouncement(notification.announcementId);
          onRemove();
        }
      }}
      className="relative group active:cursor-grabbing"
    >
      {/* Delete Background Hint (Minimalist) */}
      <div className="absolute inset-0 bg-muted/20 rounded-2xl -z-10" />

      {/* Main Card */}
      <motion.div
        className={`p-4 rounded-2xl border transition-all duration-300 bg-card shadow-sm ${
          notification.read 
            ? 'opacity-60 border-border/50' 
            : 'border-border/50 bg-card'
        }`}
        style={{ 
          borderColor: !notification.read ? `${accentHex}40` : undefined,
          backgroundColor: !notification.read ? `${accentHex}05` : undefined 
        }}
      >
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0 mt-1">
            <BellRingIcon 
              size={20} 
              strokeWidth={2} 
              className={notification.read ? "text-muted-foreground/40" : "text-foreground/80"} 
              style={{ color: !notification.read ? accentHex : undefined }}
            />
            {!notification.read && (
              <motion.div
                layoutId={`dot-${notification.id}`}
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card shadow-sm"
                style={{ backgroundColor: accentHex }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-foreground truncate">{notification.title}</h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{notification.body}</p>
            <div className="flex items-center gap-1.5 mt-3">
              <span className="text-[10px] text-muted-foreground/40 font-medium uppercase tracking-wider">
                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
              </span>
              <CheckCheck size={12} style={{ color: accentHex }} className="opacity-60" />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
