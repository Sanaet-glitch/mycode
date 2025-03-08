// Utility functions for handling browser notifications

// Extended interface to include onclick property
interface ExtendedNotificationOptions extends NotificationOptions {
  onclick?: (this: Notification, ev: Event) => any;
}

/**
 * Request notification permission from the user
 * @returns Promise with the permission status
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!("Notification" in window)) {
    console.error("This browser does not support notifications");
    return "denied";
  }

  // If permission is already granted, no need to ask again
  if (Notification.permission === "granted") {
    return "granted";
  }

  // Otherwise, ask the user for permission
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return "denied";
  }
};

/**
 * Check if notifications are supported and enabled
 */
export const areNotificationsSupported = (): boolean => {
  return "Notification" in window;
};

/**
 * Check if notifications are currently permitted
 */
export const areNotificationsEnabled = (): boolean => {
  return "Notification" in window && Notification.permission === "granted";
};

/**
 * Send a browser notification
 * @param title - Title of the notification
 * @param options - Notification options
 * @returns The notification object if successful, null otherwise
 */
export const sendNotification = (
  title: string,
  options: ExtendedNotificationOptions = {}
): Notification | null => {
  if (!areNotificationsEnabled()) {
    console.warn("Notifications are not enabled");
    return null;
  }

  try {
    const defaultOptions: ExtendedNotificationOptions = {
      icon: "/app-icon.png",
      badge: "/app-icon.png",
      ...options,
    };

    const notification = new Notification(title, defaultOptions);

    // Add click handler if needed
    if (options.onclick) {
      notification.onclick = options.onclick;
    } else {
      // Default behavior is to focus the window
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    return null;
  }
};

/**
 * Schedule a notification to be sent at a specific time
 * @param title - Title of the notification
 * @param scheduledTime - Time to send the notification
 * @param options - Notification options
 * @returns A timeout ID that can be used to cancel the notification
 */
export const scheduleNotification = (
  title: string,
  scheduledTime: Date,
  options: ExtendedNotificationOptions = {}
): number => {
  const now = new Date();
  const delay = scheduledTime.getTime() - now.getTime();

  if (delay <= 0) {
    console.warn("Scheduled time is in the past, sending notification immediately");
    sendNotification(title, options);
    return 0;
  }

  return window.setTimeout(() => {
    sendNotification(title, options);
  }, delay);
};

/**
 * Save notification preference to local storage
 * @param key - Identifier for the notification (e.g., classId)
 * @param enabled - Whether notifications are enabled
 */
export const saveNotificationPreference = (key: string, enabled: boolean): void => {
  try {
    const preferences = getNotificationPreferences();
    preferences[key] = enabled;
    localStorage.setItem("notificationPreferences", JSON.stringify(preferences));
  } catch (error) {
    console.error("Error saving notification preference:", error);
  }
};

/**
 * Get all notification preferences from local storage
 * @returns Object with all preferences
 */
export const getNotificationPreferences = (): Record<string, boolean> => {
  try {
    const preferences = localStorage.getItem("notificationPreferences");
    return preferences ? JSON.parse(preferences) : {};
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    return {};
  }
};

/**
 * Get a specific notification preference
 * @param key - Identifier for the notification
 * @param defaultValue - Default value if preference is not set
 * @returns Whether notifications are enabled for this key
 */
export const getNotificationPreference = (key: string, defaultValue = false): boolean => {
  const preferences = getNotificationPreferences();
  return key in preferences ? preferences[key] : defaultValue;
}; 