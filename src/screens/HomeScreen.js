import React, { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import AnimatedBackground from "../components/AnimatedBackground";
import CycleCalendar from "../components/CycleCalendar";
import FadeInView from "../components/FadeInView";
import MetricCard from "../components/MetricCard";
import { logoutUser } from "../services/authService";
import {
  addPeriodLog,
  endLatestPeriod,
  getDailyLogs,
  getOnboardingData,
  getPeriodLogs,
  getSettings,
  updateOnboardingData,
  updateSettings,
} from "../storage/storage";
import { colors, spacing, type } from "../styles/theme";
import { daysBetween, formatFriendly, toDateId } from "../utils/date";
import {
  DEFAULT_PERIOD_LENGTH,
  getAverageCycleLength,
  getCycleAlertFlags,
  getEstimatedCycleLength,
  getFertilityWindow,
  getLatestPeriodLog,
  getLatestPeriodDate,
  getMissedCycleCount,
  getNextPeriodDate,
  getPeriodLength
} from "../utils/cycle";
import {
  schedulePeriodReminder,
  sendPeriodStartedReminders
} from "../utils/notifications";
import { useThemeMode } from "../context/ThemeContext";

export default function HomeScreen() {
  const [onboarding, setOnboarding] = useState(null);
  const [periodLogs, setPeriodLogs] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const { isDarkMode, themeColors, toggleDarkMode } = useThemeMode();

  const loadData = useCallback(async () => {
    const [storedOnboarding, storedPeriodLogs, storedDailyLogs, storedSettings] = await Promise.all([
      getOnboardingData(),
      getPeriodLogs(),
      getDailyLogs(),
      getSettings()
    ]);
    setOnboarding(storedOnboarding);
    setPeriodLogs(storedPeriodLogs);
    setDailyLogs(storedDailyLogs);
    setSettings(storedSettings);
    setNicknameDraft(storedOnboarding?.nickname || "");
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

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
    Alert.alert("Saved", "HerCycle updated your next prediction.");
  }

  async function markPeriodEnded() {
    const today = toDateId();
    const latestLog = getLatestPeriodLog(onboarding, periodLogs);

    if (!latestLog?.date) {
      Alert.alert("Start date needed", "Log when your period started first.");
      return;
    }

    if (daysBetween(latestLog.date, today) < 0) {
      Alert.alert("Check date", "The end date cannot be before the start date.");
      return;
    }

    const nextLogs = await endLatestPeriod(today);
    const nextOnboarding = await getOnboardingData();
    setPeriodLogs(nextLogs);
    setOnboarding(nextOnboarding);
    Alert.alert("Saved", "HerCycle saved your period end date.");
  }

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (error) {
      Alert.alert("Logout failed", error.message);
    }
  }

  async function saveNickname() {
    const next = await updateOnboardingData({ nickname: nicknameDraft.trim() });
    setOnboarding(next);
  }

  async function toggleFertilityWindow() {
    const nextSettings = await updateSettings({
      showFertilityWindow: !settings?.showFertilityWindow
    });
    setSettings(nextSettings);
  }

  const lastPeriodDate = getLatestPeriodDate(onboarding, periodLogs);
  const latestPeriodLog = getLatestPeriodLog(onboarding, periodLogs);
  const nextPeriodDate = getNextPeriodDate(onboarding, periodLogs);
  const fertilityDates = settings?.showFertilityWindow
    ? getFertilityWindow(onboarding, periodLogs)
    : [];
  const averageCycleLength = getAverageCycleLength(periodLogs);
  const missedCycles = getMissedCycleCount(onboarding, periodLogs);
  const alertFlags = getCycleAlertFlags(onboarding, periodLogs, dailyLogs);
  const estimatedLength = getEstimatedCycleLength(onboarding, periodLogs);
  const periodDay =
    lastPeriodDate && daysBetween(lastPeriodDate, toDateId()) >= 0
      ? daysBetween(lastPeriodDate, toDateId()) + 1
      : null;
  const latestPeriodLength = getPeriodLength(latestPeriodLog);
  const hasPeriodEndDate = Boolean(latestPeriodLog?.endDate);
  const isPeriodActive =
    periodDay &&
    (hasPeriodEndDate
      ? periodDay <= latestPeriodLength
      : periodDay <= DEFAULT_PERIOD_LENGTH);
  const displayName = onboarding?.nickname || "there";
  const calendarPeriodLogs =
    onboarding?.lastPeriodDate &&
    !periodLogs.some((log) => log.date === onboarding.lastPeriodDate)
      ? [
          {
            date: onboarding.lastPeriodDate,
            endDate: onboarding.lastPeriodEndDate,
            source: "onboarding"
          },
          ...periodLogs
        ]
      : periodLogs;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>HerCycle today</Text>
            <Text style={[styles.greeting, { color: themeColors.text }]}>
              Hi, {displayName}
            </Text>
            <Text style={[styles.title, { color: themeColors.text }]}>
              {formatFriendly(toDateId())}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Text style={styles.badge}>{onboarding?.condition || "Cycle"}</Text>
            <Pressable
              onPress={toggleFertilityWindow}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed ? styles.logoutPressed : null
              ]}
            >
              <Ionicons
                name={settings?.showFertilityWindow ? "leaf" : "leaf-outline"}
                size={20}
                color={colors.primary}
              />
            </Pressable>
            <Pressable
              onPress={toggleDarkMode}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed ? styles.logoutPressed : null
              ]}
            >
              <Ionicons
                name={isDarkMode ? "sunny" : "moon"}
                size={20}
                color={colors.primary}
              />
            </Pressable>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed ? styles.logoutPressed : null
              ]}
            >
              <Ionicons name="log-out" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </FadeInView>

        {!onboarding?.nickname ? (
          <FadeInView
            style={[
              styles.nicknameCard,
              {
                backgroundColor: themeColors.surfaceGlass,
                borderColor: themeColors.border
              }
            ]}
          >
            <Text style={[styles.nicknameLabel, { color: themeColors.text }]}>
              Choose nickname
            </Text>
            <View style={styles.nicknameRow}>
              <TextInput
                value={nicknameDraft}
                onChangeText={setNicknameDraft}
                placeholder="Your name"
                placeholderTextColor={colors.muted}
                style={styles.nicknameInput}
              />
              <Pressable onPress={saveNickname} style={styles.saveNameButton}>
                <Ionicons name="checkmark" size={20} color={colors.surface} />
              </Pressable>
            </View>
          </FadeInView>
        ) : null}

        {isPeriodActive ? (
          <FadeInView
            style={[
              styles.periodActiveCard,
              {
                backgroundColor: themeColors.surfaceSoft,
                borderColor: themeColors.border
              }
            ]}
            delay={80}
          >
            <View>
              <Text style={styles.periodActiveTitle}>
                {hasPeriodEndDate ? "Period end saved" : `Period day ${periodDay}`}
              </Text>
              <Text style={[styles.periodActiveText, { color: themeColors.textSoft }]}>
                {hasPeriodEndDate
                  ? `Last day saved as ${formatFriendly(latestPeriodLog.endDate)}.`
                  : "Color fades each day until the expected or saved last day."}
              </Text>
            </View>
            <View style={styles.periodDots}>
              {Array.from({ length: latestPeriodLength }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.periodDot,
                    {
                      opacity: Math.max(0.25, 1 - index * (0.75 / latestPeriodLength)),
                      backgroundColor:
                        index + 1 <= periodDay ? colors.primary : colors.border
                    }
                  ]}
                />
              ))}
            </View>
          </FadeInView>
        ) : null}

        <CycleCalendar
          periodLogs={calendarPeriodLogs}
          nextPeriodDate={nextPeriodDate}
          fertilityDates={fertilityDates}
        />

        {settings?.showFertilityWindow ? (
          <FadeInView
            style={[
              styles.fertilityNote,
              {
                backgroundColor: themeColors.surfaceGlass,
                borderColor: themeColors.border
              }
            ]}
            delay={110}
          >
            <Text style={[styles.fertilityTitle, { color: themeColors.text }]}>
              Possible fertile window
            </Text>
            <Text style={[styles.fertilityText, { color: themeColors.textSoft }]}>
              This is an estimate only. Irregular cycles and PCOD/PCOS can make fertile days less predictable.
            </Text>
          </FadeInView>
        ) : null}

        <View style={styles.grid}>
          <MetricCard
            icon="calendar"
            label="Next expected period"
            value={formatFriendly(nextPeriodDate)}
            delay={130}
          />
          <MetricCard
            icon="heart"
            label="Last period date"
            value={formatFriendly(lastPeriodDate)}
            tone="purple"
            delay={170}
          />
        </View>

        <View style={styles.grid}>
          <MetricCard
            icon="pulse"
            label="Cycle status"
            value={onboarding?.cycleType || "Not set"}
            delay={210}
          />
          <MetricCard
            icon="analytics"
            label="Avg cycle length"
            value={averageCycleLength ? `${averageCycleLength} days` : `${estimatedLength} days`}
            tone="purple"
            delay={250}
          />
        </View>

        <FadeInView style={styles.insight} delay={290}>
          <Text style={styles.insightTitle}>PCOD/PCOS insight</Text>
          <Text style={styles.insightText}>
            {missedCycles > 0
              ? `You may have missed ${missedCycles} expected cycle${missedCycles > 1 ? "s" : ""}. If this keeps happening, consider checking in with a clinician.`
              : "No missed cycles detected from your current logs."}
          </Text>
        </FadeInView>

        {alertFlags.length > 0 ? (
          <FadeInView
            style={[
              styles.alertCard,
              {
                backgroundColor: themeColors.surfaceGlass,
                borderColor: themeColors.border
              }
            ]}
            delay={305}
          >
            <Text style={[styles.alertTitle, { color: themeColors.text }]}>
              Gentle health flags
            </Text>
            {alertFlags.map((flag) => (
              <View key={flag.title} style={styles.alertRow}>
                <Ionicons name="alert-circle" size={18} color={colors.warning} />
                <View style={styles.alertTextWrap}>
                  <Text style={[styles.alertHeading, { color: themeColors.text }]}>
                    {flag.title}
                  </Text>
                  <Text style={[styles.alertBody, { color: themeColors.textSoft }]}>
                    {flag.message}
                  </Text>
                </View>
              </View>
            ))}
          </FadeInView>
        ) : null}

        <Pressable
          onPress={markPeriodStarted}
          style={({ pressed }) => [
            styles.periodButton,
            {
              backgroundColor: isPeriodActive
                ? `rgba(230, 76, 141, ${Math.max(
                    0.35,
                    1 - (periodDay - 1) * 0.16
                  )})`
                : colors.primary
            },
            pressed ? styles.periodButtonPressed : null
          ]}
        >
          <Ionicons name="add-circle" size={20} color={colors.surface} />
          <Text style={styles.periodButtonText}>
            {isPeriodActive ? `Period Day ${periodDay}` : "Period Started"}
          </Text>
        </Pressable>

        {isPeriodActive && !hasPeriodEndDate ? (
          <Pressable
            onPress={markPeriodEnded}
            style={({ pressed }) => [
              styles.periodEndButton,
              {
                backgroundColor: themeColors.surfaceGlass,
                borderColor: themeColors.border
              },
              pressed ? styles.periodButtonPressed : null
            ]}
          >
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={[styles.periodEndButtonText, { color: themeColors.text }]}>
              Period Ended Today
            </Text>
          </Pressable>
        ) : null}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
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
  greeting: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2
  },
  badge: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.lavender,
    color: colors.secondary,
    fontWeight: "900"
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.border
  },
  logoutPressed: {
    transform: [{ scale: 0.96 }]
  },
  grid: {
    flexDirection: "row",
    gap: spacing.sm
  },
  nicknameCard: {
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  nicknameLabel: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: spacing.sm
  },
  nicknameRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  nicknameInput: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontWeight: "800"
  },
  saveNameButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary
  },
  periodActiveCard: {
    borderRadius: 22,
    padding: spacing.md,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm
  },
  periodActiveTitle: {
    color: colors.primaryDark,
    fontSize: 20,
    fontWeight: "900"
  },
  periodActiveText: {
    color: colors.textSoft,
    fontWeight: "700",
    marginTop: 3
  },
  periodDots: {
    flexDirection: "row",
    gap: spacing.sm
  },
  periodDot: {
    flex: 1,
    height: 10,
    borderRadius: 99
  },
  periodButton: {
    minHeight: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5
  },
  periodButtonPressed: {
    transform: [{ scale: 0.98 }]
  },
  periodButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "900"
  },
  periodEndButton: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm
  },
  periodEndButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  insight: {
    borderRadius: 20,
    backgroundColor: colors.mint,
    padding: spacing.md
  },
  insightTitle: {
    color: colors.text,
    fontSize: type.subtitle,
    fontWeight: "900",
    marginBottom: 6
  },
  insightText: {
    color: colors.textSoft,
    lineHeight: 22,
    fontWeight: "600"
  },
  fertilityNote: {
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md
  },
  fertilityTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4
  },
  fertilityText: {
    lineHeight: 21,
    fontWeight: "600"
  },
  alertCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm
  },
  alertTitle: {
    fontSize: type.subtitle,
    fontWeight: "900"
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm
  },
  alertTextWrap: {
    flex: 1
  },
  alertHeading: {
    fontWeight: "800",
    marginBottom: 2
  },
  alertBody: {
    lineHeight: 20,
    fontWeight: "600"
  }
});
