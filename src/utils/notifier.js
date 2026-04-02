import { useStore } from '../store/useStore';

export const sendNotification = (mealName, mode) => {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return;
  }

  if (Notification.permission === "granted") {
    let title, body;
    const icon = "/icon.png";

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

    try {
      console.log(`[Notifier] Attempting to fire: ${title}`);
      
      // Check for Service Worker registration (Required for Mobile PWA)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon,
            badge: '/favicon.png', // Small icon for notification bar
            vibrate: [200, 100, 200],
            tag: 'messit-meal-notification', // Prevent duplicate stacking
            renotify: true,
            data: { url: window.location.origin }
          });
        });
      } else {
        // Fallback for non-SW environments (Legacy)
        new Notification(title, { body, icon });
      }

      // Trigger the Bell Animation via Store
      useStore.getState().addNotification(title, body);
      useStore.setState({ isNotificationPending: true });
      return { success: true, title, body };
    } catch (e) {
      console.error("[Notifier] Error creating notification:", e);
      return { success: false, error: e.message };
    }
  } else if (Notification.permission !== "denied") {
    console.log("[Notifier] Requesting permission...");
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        sendNotification(mealName, mode);
      }
    });
  } else {
    console.warn(`[Notifier] Permission denied. Current state: ${Notification.permission}`);
    return { success: false, error: "Permission denied" };
  }
};

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
};
