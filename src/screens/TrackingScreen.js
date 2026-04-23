import React, { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import AnimatedBackground from "../components/AnimatedBackground";
import AppButton from "../components/AppButton";
import Card from "../components/Card";
import FadeInView from "../components/FadeInView";
import {
  addDailyLog,
  addDoctorNote,
  addPeriodLog,
  endLatestPeriod,
  getDailyLogs,
  getDoctorNotes,
  getOnboardingData,
  getPeriodLogs,
  getSettings,
  updateSettings
} from "../storage/storage";
import { colors, spacing, type } from "../styles/theme";
import { useThemeMode } from "../context/ThemeContext";
import { daysBetween, formatFriendly, fromDateId, toDateId } from "../utils/date";
import { getLatestPeriodLog, getNextPeriodDate } from "../utils/cycle";
import {
  schedulePeriodReminder,
  schedulePadChangeReminder,
  cancelPadChangeReminder,
  sendPeriodStartedReminders
} from "../utils/notifications";

const moods = [
  { label: "Happy", icon: "happy" },
  { label: "Sad", icon: "sad" },
  { label: "Irritated", icon: "thunderstorm" }
];

const symptomTags = [
  "Cramps",
  "Acne",
  "Fatigue",
  "Bloating",
  "Headache",
  "Cravings",
  "Spotting",
  "Tender breasts"
];

const flowLevels = ["None", "Spotting", "Light", "Medium", "Heavy", "Clots"];

function Chip({ label, selected, onPress, themeColors }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : themeColors.surfaceGlass,
          borderColor: selected ? colors.primary : themeColors.border,
          opacity: pressed ? 0.75 : 1
        }
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: selected ? colors.surface : themeColors.textSoft }
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function TrackingScreen() {
  const { themeColors } = useThemeMode();
  const [mood, setMood] = useState("Happy");
  const [painLevel, setPainLevel] = useState(1);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [doctorNotes, setDoctorNotes] = useState([]);
  const [periodLogs, setPeriodLogs] = useState([]);
  const [onboarding, setOnboarding] = useState(null);
  const [settings, setSettings] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [flowLevel, setFlowLevel] = useState("None");
  const [isSpottingOnly, setIsSpottingOnly] = useState(false);
  const [doctorNoteText, setDoctorNoteText] = useState("");
  const [periodEndDate, setPeriodEndDate] = useState(toDateId());
  const [showEndPicker, setShowEndPicker] = useState(false);

  const loadData = useCallback(async () => {
    const [
      storedDailyLogs,
      storedDoctorNotes,
      storedPeriodLogs,
      storedOnboarding,
      storedSettings
    ] = await Promise.all([
      getDailyLogs(),
      getDoctorNotes(),
      getPeriodLogs(),
      getOnboardingData(),
      getSettings()
    ]);
    setDailyLogs(storedDailyLogs);
    setDoctorNotes(storedDoctorNotes);
    setPeriodLogs(storedPeriodLogs);
    setOnboarding(storedOnboarding);
    setSettings(storedSettings);

    const todayLog = storedDailyLogs.find((log) => log.date === toDateId());
    if (todayLog) {
      setMood(todayLog.mood);
      setPainLevel(todayLog.painLevel);
      setSelectedSymptoms(todayLog.symptoms || []);
      setFlowLevel(todayLog.flowLevel || "None");
      setIsSpottingOnly(Boolean(todayLog.isSpottingOnly));
    }

    const latestPeriodLog = getLatestPeriodLog(storedOnboarding, storedPeriodLogs);
    setPeriodEndDate(latestPeriodLog?.endDate || toDateId());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function saveDailyCheckIn() {
    const normalizedSymptoms = isSpottingOnly
      ? Array.from(new Set([...(selectedSymptoms || []), "Spotting"]))
      : selectedSymptoms;
    const normalizedFlowLevel =
      isSpottingOnly && flowLevel === "None" ? "Spotting" : flowLevel;

    const logs = await addDailyLog({
      date: toDateId(),
      mood,
      painLevel,
      symptoms: normalizedSymptoms,
      flowLevel: normalizedFlowLevel,
      isSpottingOnly
    });
    setDailyLogs(logs);
    setSelectedSymptoms(normalizedSymptoms);
    setFlowLevel(normalizedFlowLevel);
    Alert.alert("Saved", "Your mood and pain check-in is saved.");
  }

  function toggleSymptom(symptom) {
    setSelectedSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom]
    );
  }

  async function saveDoctorNote() {
    const text = doctorNoteText.trim();

    if (!text) {
      Alert.alert("Write a note", "Add a question or symptom note first.");
      return;
    }

    const notes = await addDoctorNote({
      date: toDateId(),
      text
    });
    setDoctorNotes(notes);
    setDoctorNoteText("");
    Alert.alert("Saved", "Doctor note saved for your report.");
  }

  async function markPeriodStarted() {
    const today = toDateId();
    const alreadyLogged = periodLogs.some((log) => log.date === today);

    if (alreadyLogged) {
      Alert.alert("Already logged", "Your period start is already saved for today.");
      return;
    }

    const nextLogs = await addPeriodLog({ date: today, source: "manual" });
    setPeriodLogs(nextLogs);
    await sendPeriodStartedReminders();
    await schedulePeriodReminder(getNextPeriodDate(onboarding, nextLogs));
    Alert.alert("Saved", "Day 1 reminders are ready.");
  }

  async function markPeriodEnded() {
    const today = toDateId();
    await savePeriodEndDate(today);
  }

  async function savePeriodEndDate(dateId = periodEndDate) {
    const latestLog = getLatestPeriodLog(onboarding, periodLogs);

    if (!latestLog?.date) {
      Alert.alert("Start date needed", "Log when your period started first.");
      return;
    }

    if (daysBetween(latestLog.date, dateId) < 0) {
      Alert.alert("Check date", "The end date cannot be before the start date.");
      return;
    }

    if (daysBetween(dateId, toDateId()) > 0) {
      Alert.alert("Check date", "The end date cannot be in the future.");
      return;
    }

    const nextLogs = await endLatestPeriod(dateId);
    const nextOnboarding = await getOnboardingData();
    setPeriodLogs(nextLogs);
    setOnboarding(nextOnboarding);
    setPeriodEndDate(dateId);
    Alert.alert("Saved", `Period end saved as ${formatFriendly(dateId)}.`);
  }

  async function startPadReminder(hours) {
    const existingId = settings?.padReminderId;
    if (existingId) {
      await cancelPadChangeReminder(existingId);
    }

    const identifier = await schedulePadChangeReminder(hours);
    const nextSettings = await updateSettings({
      padReminderHours: hours,
      padReminderId: identifier
    });
    setSettings(nextSettings);

    if (identifier) {
      Alert.alert("Reminder set", `HerCycle will remind you every ${hours} hours.`);
    }
  }

  async function stopPadReminder() {
    await cancelPadChangeReminder(settings?.padReminderId);
    const nextSettings = await updateSettings({ padReminderId: null });
    setSettings(nextSettings);
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <Text style={styles.eyebrow}>Daily care</Text>
          <Text style={[styles.title, { color: themeColors.text }]}>Track today</Text>
        </FadeInView>

        <Card delay={90}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Mood</Text>
          <View style={styles.choiceRow}>
            {moods.map((item) => (
              <AppButton
                key={item.label}
                title={item.label}
                icon={item.icon}
                variant={mood === item.label ? "primary" : "soft"}
                onPress={() => setMood(item.label)}
              />
            ))}
          </View>
        </Card>

        <Card delay={150}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Pain level</Text>
          <Text style={[styles.helper, { color: themeColors.textSoft }]}>1 is mild, 5 is intense.</Text>
          <View style={styles.painRow}>
            {[1, 2, 3, 4, 5].map((level) => (
              <AppButton
                key={level}
                title={`${level}`}
                variant={painLevel === level ? "primary" : "soft"}
                onPress={() => setPainLevel(level)}
              />
            ))}
          </View>
        </Card>

        <Card delay={165}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Symptoms
          </Text>
          <Text style={[styles.helper, { color: themeColors.textSoft }]}>
            Pick anything you noticed today.
          </Text>
          <View style={styles.chipWrap}>
            {symptomTags.map((symptom) => (
              <Chip
                key={symptom}
                label={symptom}
                selected={selectedSymptoms.includes(symptom)}
                onPress={() => toggleSymptom(symptom)}
                themeColors={themeColors}
              />
            ))}
          </View>
        </Card>

        <Card delay={170}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Spotting / one-time bleed
          </Text>
          <Text style={[styles.helper, { color: themeColors.textSoft }]}>
            Use this if there was a small leak or light spotting, but your real period did not continue.
          </Text>
          <View style={styles.chipWrap}>
            {["No", "Yes"].map((option) => (
              <Chip
                key={option}
                label={option}
                selected={isSpottingOnly === (option === "Yes")}
                onPress={() => setIsSpottingOnly(option === "Yes")}
                themeColors={themeColors}
              />
            ))}
          </View>
        </Card>

        <Card delay={175}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Flow
          </Text>
          <View style={styles.chipWrap}>
            {flowLevels.map((level) => (
              <Chip
                key={level}
                label={level}
                selected={flowLevel === level}
                onPress={() => setFlowLevel(level)}
                themeColors={themeColors}
              />
            ))}
          </View>
        </Card>

        <AppButton title="Save Check-in" icon="save" onPress={saveDailyCheckIn} />
        <AppButton
          title="Period Started"
          icon="add-circle"
          variant="soft"
          onPress={markPeriodStarted}
        />
        <AppButton
          title="Period Ended Today"
          icon="checkmark-circle"
          variant="soft"
          onPress={markPeriodEnded}
        />

        <Card delay={180}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Period end date
          </Text>
          <Text style={[styles.helper, { color: themeColors.textSoft }]}>
            If your period ended earlier, save the actual last day here.
          </Text>
          <Pressable
            onPress={() => setShowEndPicker(true)}
            style={({ pressed }) => [
              styles.dateButton,
              {
                backgroundColor: themeColors.surfaceSoft,
                borderColor: themeColors.border
              },
              pressed ? styles.dateButtonPressed : null
            ]}
          >
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text style={[styles.dateText, { color: themeColors.text }]}>
              {formatFriendly(periodEndDate)}
            </Text>
          </Pressable>

          {showEndPicker ? (
            <DateTimePicker
              value={fromDateId(periodEndDate)}
              mode="date"
              maximumDate={new Date()}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                if (Platform.OS !== "ios") {
                  setShowEndPicker(false);
                }

                if (selectedDate) {
                  setPeriodEndDate(toDateId(selectedDate));
                }
              }}
            />
          ) : null}

          <AppButton
            title="Save Period End Date"
            icon="save"
            onPress={() => savePeriodEndDate()}
          />
        </Card>

        <Card delay={195}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Pad change scheduler</Text>
          <Text style={[styles.helper, { color: themeColors.textSoft }]}>
            Set a repeating local reminder while you are on your period.
          </Text>
          <View style={styles.reminderGrid}>
            {[3, 4, 6].map((hours) => (
              <AppButton
                key={hours}
                title={`${hours}h`}
                icon="timer"
                variant={
                  settings?.padReminderId &&
                  settings?.padReminderHours === hours
                    ? "primary"
                    : "soft"
                }
                onPress={() => startPadReminder(hours)}
              />
            ))}
          </View>
          {settings?.padReminderId ? (
            <AppButton
              title="Stop Pad Reminder"
              icon="notifications-off"
              variant="soft"
              onPress={stopPadReminder}
            />
          ) : null}
        </Card>

        <Card delay={215}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Doctor notes
          </Text>
          <Text style={[styles.helper, { color: themeColors.textSoft }]}>
            Save questions or symptoms you want to discuss.
          </Text>
          <TextInput
            value={doctorNoteText}
            onChangeText={setDoctorNoteText}
            placeholder="Example: Ask about irregular cycles and acne"
            placeholderTextColor={colors.muted}
            multiline
            style={[
              styles.noteInput,
              {
                backgroundColor: themeColors.surfaceSoft,
                borderColor: themeColors.border,
                color: themeColors.text
              }
            ]}
          />
          <AppButton title="Save Doctor Note" icon="save" onPress={saveDoctorNote} />
          {doctorNotes.slice(0, 3).map((note) => (
            <View
              key={`${note.date}-${note.text}`}
              style={[styles.noteRow, { borderBottomColor: themeColors.border }]}
            >
              <Text style={[styles.logDate, { color: themeColors.text }]}>
                {note.date}
              </Text>
              <Text style={[styles.logText, { color: themeColors.textSoft }]}>
                {note.text}
              </Text>
            </View>
          ))}
        </Card>

        <Card delay={235}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Recent check-ins</Text>
          {dailyLogs.length === 0 ? (
            <Text style={[styles.empty, { color: themeColors.textSoft }]}>No mood or pain logs yet.</Text>
          ) : (
            dailyLogs.slice(0, 6).map((log) => (
              <View key={log.date} style={styles.logRow}>
                <Text style={[styles.logDate, { color: themeColors.text }]}>{log.date}</Text>
                <Text style={[styles.logText, { color: themeColors.textSoft }]}>
                  {log.mood} - Pain {log.painLevel}/5 - Flow {log.flowLevel || "None"}
                </Text>
                {log.isSpottingOnly ? (
                  <Text style={[styles.logText, { color: colors.warning }]}>
                    Spotting only logged - not counted as a full period
                  </Text>
                ) : null}
                {log.symptoms?.length ? (
                  <Text style={[styles.logText, { color: themeColors.textSoft }]}>
                    {log.symptoms.join(", ")}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 176
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: type.title,
    fontWeight: "900"
  },
  sectionTitle: {
    color: colors.text,
    fontSize: type.subtitle,
    fontWeight: "900",
    marginBottom: spacing.sm
  },
  helper: {
    color: colors.textSoft,
    fontWeight: "600",
    marginBottom: spacing.md
  },
  choiceRow: {
    gap: spacing.sm
  },
  painRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  reminderGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  chip: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center"
  },
  chipText: {
    fontWeight: "800"
  },
  dateButton: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm
  },
  dateButtonPressed: {
    transform: [{ scale: 0.99 }]
  },
  dateText: {
    color: colors.text,
    fontSize: type.body,
    fontWeight: "800"
  },
  empty: {
    color: colors.textSoft,
    fontWeight: "600"
  },
  noteInput: {
    minHeight: 92,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    textAlignVertical: "top",
    fontSize: type.body,
    fontWeight: "700",
    marginBottom: spacing.md
  },
  noteRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1
  },
  logRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  logDate: {
    color: colors.text,
    fontWeight: "900",
    marginBottom: 3
  },
  logText: {
    color: colors.textSoft,
    fontWeight: "600"
  }
});
