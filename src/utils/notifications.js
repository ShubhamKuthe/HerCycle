import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { fromDateId } from "./date";

let channelReady = false;

async function ensureNotificationChannel() {
  if (channelReady || Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("hercycle-reminders", {
    name: "HerCycle reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#E64C8D"
  });

  channelReady = true;
}

export async function requestNotificationPermission() {
  await ensureNotificationChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function schedulePeriodReminder(dateId) {
  if (!dateId) {
    return;
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return;
  }

  const triggerDate = fromDateId(dateId);
  triggerDate.setHours(9, 0, 0, 0);

  if (triggerDate <= new Date()) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "HerCycle check-in",
      body: "Did you get your period today?",
      sound: true
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: "hercycle-reminders"
    }
  });
}

export async function sendPeriodStartedReminders() {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Day 1 care",
      body: "Carry extra pads today",
      sound: true
    },
    trigger: null
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Gentle health tip",
      body: "Try light walking or stretching today to reduce cramps",
      sound: true
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 8,
      channelId: "hercycle-reminders"
    }
  });
}

export async function schedulePadChangeReminder(hours = 4) {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Time to change pad",
      body: "Change your pad to stay fresh and comfortable.",
      sound: true
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Number(hours)) * 60 * 60,
      repeats: true,
      channelId: "hercycle-reminders"
    }
  });
}

export async function cancelPadChangeReminder(identifier) {
  if (!identifier) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(identifier);
}
