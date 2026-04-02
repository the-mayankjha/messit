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
      const notification = new Notification(title, { body, icon });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Trigger the Bell Animation via Store
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
