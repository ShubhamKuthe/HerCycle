import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveUserDataPatch } from "../services/userDataService";

const KEYS = {
  onboarding: "@cyclecare/onboarding",
  periodLogs: "@cyclecare/periodLogs",
  weightLogs: "@cyclecare/weightLogs",
  dailyLogs: "@cyclecare/dailyLogs",
  doctorNotes: "@hercycle/doctorNotes",
  settings: "@hercycle/settings"
};

async function readJson(key, fallback) {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn("Storage read failed", error);
    return fallback;
  }
}

async function writeJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Storage write failed", error);
  }
}

async function syncPatch(patch) {
  try {
    await saveUserDataPatch(patch);
  } catch (error) {
    console.warn("Cloud sync failed", error);
  }
}

export async function getOnboardingData() {
  return readJson(KEYS.onboarding, null);
}

export async function saveOnboardingData(data) {
  await writeJson(KEYS.onboarding, data);
  await syncPatch({ onboarding: data });
}

export async function updateOnboardingData(patch) {
  const current = await getOnboardingData();
  const next = { ...(current || {}), ...patch };
  await saveOnboardingData(next);
  return next;
}

export async function getPeriodLogs() {
  return readJson(KEYS.periodLogs, []);
}

export async function addPeriodLog(log) {
  const logs = await getPeriodLogs();
  const nextLogs = [log, ...logs].sort((a, b) => b.date.localeCompare(a.date));
  await writeJson(KEYS.periodLogs, nextLogs);
  await syncPatch({ periodLogs: nextLogs });
  return nextLogs;
}

export async function endLatestPeriod(dateId) {
  const logs = await getPeriodLogs();

  if (logs.length === 0) {
    const onboarding = await getOnboardingData();
    const nextOnboarding = {
      ...(onboarding || {}),
      lastPeriodEndDate: dateId
    };
    await saveOnboardingData(nextOnboarding);
    return [];
  }

  const nextLogs = logs.map((log, index) =>
    index === 0 ? { ...log, endDate: dateId } : log
  );
  await writeJson(KEYS.periodLogs, nextLogs);
  await syncPatch({ periodLogs: nextLogs });
  return nextLogs;
}

export async function getWeightLogs() {
  return readJson(KEYS.weightLogs, []);
}

export async function addWeightLog(log) {
  const logs = await getWeightLogs();
  const nextLogs = [log, ...logs].sort((a, b) => b.date.localeCompare(a.date));
  await writeJson(KEYS.weightLogs, nextLogs);
  await syncPatch({ weightLogs: nextLogs });
  return nextLogs;
}

export async function getDailyLogs() {
  return readJson(KEYS.dailyLogs, []);
}

export async function addDailyLog(log) {
  const logs = await getDailyLogs();
  const withoutToday = logs.filter((item) => item.date !== log.date);
  const nextLogs = [log, ...withoutToday].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  await writeJson(KEYS.dailyLogs, nextLogs);
  await syncPatch({ dailyLogs: nextLogs });
  return nextLogs;
}

export async function getDoctorNotes() {
  return readJson(KEYS.doctorNotes, []);
}

export async function addDoctorNote(note) {
  const notes = await getDoctorNotes();
  const nextNotes = [note, ...notes].sort((a, b) => b.date.localeCompare(a.date));
  await writeJson(KEYS.doctorNotes, nextNotes);
  await syncPatch({ doctorNotes: nextNotes });
  return nextNotes;
}

export async function getSettings() {
  return readJson(KEYS.settings, {
    darkMode: false,
    showFertilityWindow: false,
    padReminderHours: 4,
    padReminderId: null
  });
}

export async function saveSettings(settings) {
  await writeJson(KEYS.settings, settings);
  await syncPatch({ settings });
  return settings;
}

export async function updateSettings(patch) {
  const current = await getSettings();
  return saveSettings({ ...current, ...patch });
}

export async function hydrateLocalDataFromCloud(cloudData) {
  if (!cloudData) {
    return;
  }

  const writes = [];

  if (cloudData.onboarding) {
    writes.push(writeJson(KEYS.onboarding, cloudData.onboarding));
  }

  if (Array.isArray(cloudData.periodLogs)) {
    writes.push(writeJson(KEYS.periodLogs, cloudData.periodLogs));
  }

  if (Array.isArray(cloudData.weightLogs)) {
    writes.push(writeJson(KEYS.weightLogs, cloudData.weightLogs));
  }

  if (Array.isArray(cloudData.dailyLogs)) {
    writes.push(writeJson(KEYS.dailyLogs, cloudData.dailyLogs));
  }

  if (Array.isArray(cloudData.doctorNotes)) {
    writes.push(writeJson(KEYS.doctorNotes, cloudData.doctorNotes));
  }

  if (cloudData.settings) {
    writes.push(writeJson(KEYS.settings, cloudData.settings));
  }

  await Promise.all(writes);
}

export async function clearLocalData() {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
