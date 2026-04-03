import { useStore } from '../store/useStore';

export const sendNotification = (mealName, mode, customTitle = null, customBody = null) => {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return;
  }

  let title = customTitle, body = customBody;
  const icon = "/icon.png";

  if (!title || !body) {
    if (mode === 'stud') {
      title = `Yo Bro, Fuel Up! 🥩`;
      body = `Grab your protein! ${mealName} is being served at the mess. Let's get those gains.`;
    } else if (mode === 'princess') {
      title = `Your Meal Awaits, Princess ✨`;
      body = `It's time for a delicious ${mealName}. Treat yourself well today! 🌸`;
    } else {
      title = "Messit - Meal Time!";
      body = `Time for ${mealName}. See you at the mess!`;
    }
  }

  // 1. In-App Notification Manager Sync (Always happens)
  const state = useStore.getState();
  const existing = state.notifications.some(n => n.title === title && n.body === body);
  if (!existing) {
    state.addNotification(title, body);
    state.setNotificationPending(true);
  }

  // 2. Browser/PWA Alert (Permission based)
  if (Notification.permission === "granted") {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon,
            badge: '/favicon.png',
            vibrate: [200, 100, 200],
            tag: 'messit-announcement', 
            renotify: true,
            data: { url: window.location.origin }
          });
        });
      } else {
        new Notification(title, { body, icon });
      }
    } catch (e) {
      console.error("[Notifier] Browser alert failed:", e);
    }
  } else if (Notification.permission === "default") {
    Notification.requestPermission();
  }

  return { success: true, title, body };
};

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
};
