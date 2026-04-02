import { useStore } from '../store/useStore';

export const sendNotification = (mealName, mode) => {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return;
  }

  if (Notification.permission === "granted") {
    let title = "Messit - Meal Time!";
    let body = `Time for ${mealName}. See you at the mess!`;
    let icon = "/icon.png"; // PWA icon

    if (mode === 'stud') {
      title = "Yo Bro, Fuel Up! 🥩";
      body = `Grab your protein! ${mealName} is being served at the mess. Let's get those gains.`;
    } else if (mode === 'princess') {
      title = "Your Meal Awaits, Princess ✨";
      body = `It's time for a delicious ${mealName}. Treat yourself well today! 🌸`;
    }

    new Notification(title, { body, icon });
    // Trigger the Bell Animation via Store
    useStore.setState({ isNotificationPending: true });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        sendNotification(mealName, mode);
      }
    });
  }
};

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
};
