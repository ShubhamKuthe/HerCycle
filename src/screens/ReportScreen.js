import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import AnimatedBackground from "../components/AnimatedBackground";
import AppButton from "../components/AppButton";
import Card from "../components/Card";
import FadeInView from "../components/FadeInView";
import {
  getDailyLogs,
  getDoctorNotes,
  getOnboardingData,
  getPeriodLogs,
  getWeightLogs
} from "../storage/storage";
import { colors, spacing, type } from "../styles/theme";
import { useThemeMode } from "../context/ThemeContext";
import { daysBetween, formatFriendly, toDateId } from "../utils/date";
import {
  getAverageCycleLength,
  getCycleAlertFlags,
  getEstimatedCycleLength,
  getFertilityWindow,
  getLatestPeriodDate,
  getMissedCycleCount,
  getNextPeriodDate,
  getPeriodLength
} from "../utils/cycle";

function average(values) {
  if (values.length === 0) {
    return null;
  }

  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function getCycleGaps(periodLogs) {
  const sortedOldestFirst = [...periodLogs].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const gaps = [];

  for (let index = 1; index < sortedOldestFirst.length; index += 1) {
    gaps.push({
      from: sortedOldestFirst[index - 1].date,
      to: sortedOldestFirst[index].date,
      length: daysBetween(sortedOldestFirst[index - 1].date, sortedOldestFirst[index].date)
    });
  }

  return gaps;
}

function getMoodSummary(dailyLogs) {
  return dailyLogs.reduce((summary, log) => {
    summary[log.mood] = (summary[log.mood] || 0) + 1;
    return summary;
  }, {});
}

function buildReportData(onboarding, periodLogs, dailyLogs, weightLogs, doctorNotes) {
  const cycleGaps = getCycleGaps(periodLogs);
  const painValues = dailyLogs
    .map((log) => Number(log.painLevel))
    .filter((value) => Number.isFinite(value));
  const periodLengths = periodLogs.map(getPeriodLength);

  return {
    generatedOn: formatFriendly(toDateId()),
    nickname: onboarding?.nickname || "Not provided",
    age: onboarding?.age || "Not provided",
    condition: onboarding?.condition || "Not provided",
    cycleType: onboarding?.cycleType || "Not provided",
    regular: onboarding?.regular || "Not provided",
    lastPeriodDate: getLatestPeriodDate(onboarding, periodLogs),
    nextPeriodDate: getNextPeriodDate(onboarding, periodLogs),
    fertilityWindow: getFertilityWindow(onboarding, periodLogs),
    estimatedCycleLength: getEstimatedCycleLength(onboarding, periodLogs),
    averageCycleLength: getAverageCycleLength(periodLogs),
    missedCycles: getMissedCycleCount(onboarding, periodLogs),
    alertFlags: getCycleAlertFlags(onboarding, periodLogs, dailyLogs),
    spottingDays: dailyLogs.filter((log) => log.isSpottingOnly).length,
    averagePain: average(painValues),
    averagePeriodLength: average(periodLengths),
    moodSummary: getMoodSummary(dailyLogs),
    cycleGaps,
    periodLogs,
    dailyLogs,
    weightLogs,
    doctorNotes
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rowsHtml(rows, emptyText) {
  if (rows.length === 0) {
    return `<p class="muted">${emptyText}</p>`;
  }

  return rows.join("");
}

function buildReportHtml(report) {
  const cycleRows = rowsHtml(
    report.cycleGaps.map(
      (gap) =>
        `<tr><td>${escapeHtml(gap.from)}</td><td>${escapeHtml(gap.to)}</td><td>${gap.length} days</td></tr>`
    ),
    "No completed cycle intervals available yet."
  );
  const periodRows = rowsHtml(
    report.periodLogs.map(
      (log) =>
        `<tr><td>${escapeHtml(log.date)}</td><td>${escapeHtml(log.endDate || "Not logged")}</td><td>${getPeriodLength(log)} days</td></tr>`
    ),
    "No period logs available."
  );
  const symptomRows = rowsHtml(
    report.dailyLogs.slice(0, 20).map(
      (log) =>
        `<tr><td>${escapeHtml(log.date)}</td><td>${escapeHtml(log.mood)}</td><td>${escapeHtml(log.painLevel)}/5</td><td>${escapeHtml(log.flowLevel || "None")}</td><td>${escapeHtml(log.isSpottingOnly ? "Yes" : "No")}</td><td>${escapeHtml((log.symptoms || []).join(", ") || "-")}</td></tr>`
    ),
    "No symptom check-ins available."
  );
  const doctorNoteRows = rowsHtml(
    report.doctorNotes.slice(0, 20).map(
      (note) => `<tr><td>${escapeHtml(note.date)}</td><td>${escapeHtml(note.text)}</td></tr>`
    ),
    "No doctor notes saved."
  );
  const alertRows = rowsHtml(
    report.alertFlags.map(
      (flag) => `<tr><td>${escapeHtml(flag.title)}</td><td>${escapeHtml(flag.message)}</td></tr>`
    ),
    "No current alert flags."
  );
  const weightRows = rowsHtml(
    report.weightLogs.slice(0, 20).map(
      (log) =>
        `<tr><td>${escapeHtml(log.date)}</td><td>${escapeHtml(log.weight)} kg</td></tr>`
    ),
    "No weight logs available."
  );

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #2F2534; padding: 28px; }
          h1 { color: #9F2F6D; margin-bottom: 4px; }
          h2 { color: #2F2534; margin-top: 24px; border-bottom: 1px solid #F1D8E4; padding-bottom: 6px; }
          .muted { color: #6E6070; }
          .notice { background: #FFF0F5; border-left: 4px solid #E64C8D; padding: 12px; margin: 16px 0; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .metric { background: #FFF7FA; border: 1px solid #F1D8E4; border-radius: 10px; padding: 10px; }
          .label { color: #6E6070; font-size: 12px; }
          .value { font-weight: 700; font-size: 16px; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #F1D8E4; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #FFF0F5; }
        </style>
      </head>
      <body>
        <h1>HerCycle Menstrual Health Report</h1>
        <p class="muted">Generated on ${escapeHtml(report.generatedOn)}</p>
        <div class="notice">
          This report is a patient-entered tracking summary. It is not a diagnosis. Please review it together with clinical history, examination, and appropriate investigations.
        </div>
        <h2>Patient-entered profile</h2>
        <div class="grid">
          <div class="metric"><div class="label">Nickname</div><div class="value">${escapeHtml(report.nickname)}</div></div>
          <div class="metric"><div class="label">Age</div><div class="value">${escapeHtml(report.age)}</div></div>
          <div class="metric"><div class="label">PCOD/PCOS status</div><div class="value">${escapeHtml(report.condition)}</div></div>
          <div class="metric"><div class="label">Cycle pattern</div><div class="value">${escapeHtml(report.cycleType)}</div></div>
        </div>
        <h2>Cycle summary</h2>
        <div class="grid">
          <div class="metric"><div class="label">Last period start</div><div class="value">${escapeHtml(formatFriendly(report.lastPeriodDate))}</div></div>
          <div class="metric"><div class="label">Next expected period</div><div class="value">${escapeHtml(formatFriendly(report.nextPeriodDate))}</div></div>
          <div class="metric"><div class="label">Average cycle length</div><div class="value">${escapeHtml(report.averageCycleLength || report.estimatedCycleLength)} days</div></div>
          <div class="metric"><div class="label">Missed cycles estimated</div><div class="value">${escapeHtml(report.missedCycles)}</div></div>
          <div class="metric"><div class="label">Average period duration</div><div class="value">${escapeHtml(report.averagePeriodLength || "Not enough data")} ${report.averagePeriodLength ? "days" : ""}</div></div>
          <div class="metric"><div class="label">Average pain score</div><div class="value">${escapeHtml(report.averagePain || "Not enough data")} ${report.averagePain ? "/5" : ""}</div></div>
          <div class="metric"><div class="label">Spotting-only days logged</div><div class="value">${escapeHtml(report.spottingDays)}</div></div>
        </div>
        <h2>Fertility estimate</h2>
        <p>${report.fertilityWindow.length > 0 ? escapeHtml(report.fertilityWindow.join(", ")) : "Not enough cycle data yet."}</p>
        <p class="muted">Estimated only. Irregular cycles and PCOD/PCOS can make fertile days less predictable.</p>
        <h2>Gentle health flags</h2>
        <table><tr><th>Flag</th><th>Detail</th></tr>${alertRows}</table>
        <h2>Cycle intervals</h2>
        <table><tr><th>From period start</th><th>To next period start</th><th>Cycle length</th></tr>${cycleRows}</table>
        <h2>Period duration logs</h2>
        <table><tr><th>Start date</th><th>End date</th><th>Duration</th></tr>${periodRows}</table>
        <h2>Symptoms and pain logs</h2>
        <table><tr><th>Date</th><th>Mood</th><th>Pain</th><th>Flow</th><th>Spotting only</th><th>Symptoms</th></tr>${symptomRows}</table>
        <h2>Doctor notes</h2>
        <table><tr><th>Date</th><th>Note</th></tr>${doctorNoteRows}</table>
        <h2>Weight logs</h2>
        <table><tr><th>Date</th><th>Weight</th></tr>${weightRows}</table>
      </body>
    </html>
  `;
}

function BarChart({ title, rows, maxValue, valueSuffix, themeColors }) {
  return (
    <Card delay={140}>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{title}</Text>
      {rows.length === 0 ? (
        <Text style={[styles.empty, { color: themeColors.textSoft }]}>Not enough data yet.</Text>
      ) : (
        rows.map((row) => (
          <View key={row.label} style={styles.chartRow}>
            <Text style={[styles.chartLabel, { color: themeColors.textSoft }]}>
              {row.label}
            </Text>
            <View style={[styles.barTrack, { backgroundColor: themeColors.surfaceSoft }]}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.min(100, (row.value / maxValue) * 100)}%` }
                ]}
              />
            </View>
            <Text style={[styles.chartValue, { color: themeColors.text }]}>
              {row.value}{valueSuffix}
            </Text>
          </View>
        ))
      )}
    </Card>
  );
}

export default function ReportScreen() {
  const { themeColors } = useThemeMode();
  const [onboarding, setOnboarding] = useState(null);
  const [periodLogs, setPeriodLogs] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [doctorNotes, setDoctorNotes] = useState([]);

  const loadData = useCallback(async () => {
    const [
      storedOnboarding,
      storedPeriodLogs,
      storedDailyLogs,
      storedWeightLogs,
      storedDoctorNotes
    ] =
      await Promise.all([
        getOnboardingData(),
        getPeriodLogs(),
        getDailyLogs(),
        getWeightLogs(),
        getDoctorNotes()
      ]);

    setOnboarding(storedOnboarding);
    setPeriodLogs(storedPeriodLogs);
    setDailyLogs(storedDailyLogs);
    setWeightLogs(storedWeightLogs);
    setDoctorNotes(storedDoctorNotes);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const report = useMemo(
    () => buildReportData(onboarding, periodLogs, dailyLogs, weightLogs, doctorNotes),
    [onboarding, periodLogs, dailyLogs, weightLogs, doctorNotes]
  );
  const cycleRows = report.cycleGaps.slice(-6).map((gap) => ({
    label: formatFriendly(gap.to),
    value: gap.length
  }));
  const painRows = dailyLogs.slice(0, 7).reverse().map((log) => ({
    label: formatFriendly(log.date),
    value: Number(log.painLevel) || 0
  }));
  const weightRows = weightLogs.slice(0, 7).reverse().map((log) => ({
    label: formatFriendly(log.date),
    value: Number(log.weight) || 0
  }));
  const maxWeight = Math.max(...weightRows.map((row) => row.value), 1);

  async function sharePdf() {
    try {
      const { uri } = await Print.printToFileAsync({
        html: buildReportHtml(report),
        base64: false
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share HerCycle medical report",
          UTI: "com.adobe.pdf"
        });
      } else {
        Alert.alert("PDF ready", `Report created at: ${uri}`);
      }
    } catch (error) {
      Alert.alert("Report export failed", error.message);
    }
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <Text style={styles.eyebrow}>Doctor report</Text>
          <Text style={[styles.title, { color: themeColors.text }]}>
            Medical summary
          </Text>
        </FadeInView>

        <Card delay={80}>
          <View style={styles.reportHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="document-text" size={26} color={colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Shareable cycle report
              </Text>
              <Text style={[styles.helper, { color: themeColors.textSoft }]}>
                A patient-entered summary for doctor review, including cycle
                dates, period duration, pain, mood, and weight trends.
              </Text>
            </View>
          </View>
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              This is not a diagnosis. It helps your doctor review patterns and
              decide what questions or tests may be needed.
            </Text>
          </View>
          <AppButton title="Export PDF Report" icon="share" onPress={sharePdf} />
        </Card>

        <View style={styles.metricsGrid}>
          <View style={[styles.metricBox, { backgroundColor: themeColors.surfaceGlass, borderColor: themeColors.border }]}>
            <Text style={[styles.metricLabel, { color: themeColors.textSoft }]}>Last period</Text>
            <Text style={[styles.metricValue, { color: themeColors.text }]}>{formatFriendly(report.lastPeriodDate)}</Text>
          </View>
          <View style={[styles.metricBox, { backgroundColor: themeColors.surfaceGlass, borderColor: themeColors.border }]}>
            <Text style={[styles.metricLabel, { color: themeColors.textSoft }]}>Avg cycle</Text>
            <Text style={[styles.metricValue, { color: themeColors.text }]}>{report.averageCycleLength || report.estimatedCycleLength} days</Text>
          </View>
          <View style={[styles.metricBox, { backgroundColor: themeColors.surfaceGlass, borderColor: themeColors.border }]}>
            <Text style={[styles.metricLabel, { color: themeColors.textSoft }]}>Avg pain</Text>
            <Text style={[styles.metricValue, { color: themeColors.text }]}>{report.averagePain || "N/A"}</Text>
          </View>
          <View style={[styles.metricBox, { backgroundColor: themeColors.surfaceGlass, borderColor: themeColors.border }]}>
            <Text style={[styles.metricLabel, { color: themeColors.textSoft }]}>Missed cycles</Text>
            <Text style={[styles.metricValue, { color: themeColors.text }]}>{report.missedCycles}</Text>
          </View>
          <View style={[styles.metricBox, { backgroundColor: themeColors.surfaceGlass, borderColor: themeColors.border }]}>
            <Text style={[styles.metricLabel, { color: themeColors.textSoft }]}>Spotting-only days</Text>
            <Text style={[styles.metricValue, { color: themeColors.text }]}>{report.spottingDays}</Text>
          </View>
        </View>

        <BarChart
          title="Cycle length chart"
          rows={cycleRows}
          maxValue={60}
          valueSuffix="d"
          themeColors={themeColors}
        />
        <BarChart
          title="Pain level chart"
          rows={painRows}
          maxValue={5}
          valueSuffix="/5"
          themeColors={themeColors}
        />
        <BarChart
          title="Weight trend"
          rows={weightRows}
          maxValue={maxWeight}
          valueSuffix="kg"
          themeColors={themeColors}
        />

        <Card delay={170}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Gentle health flags
          </Text>
          {report.alertFlags.length === 0 ? (
            <Text style={[styles.empty, { color: themeColors.textSoft }]}>
              No current alert flags from the logged data.
            </Text>
          ) : (
            report.alertFlags.map((flag) => (
              <View key={flag.title} style={[styles.tableRow, { borderBottomColor: themeColors.border }]}>
                <Text style={[styles.tableText, { color: themeColors.text }]}>
                  {flag.title}
                </Text>
                <Text style={[styles.tableText, { color: themeColors.textSoft }]}>
                  {flag.message}
                </Text>
              </View>
            ))
          )}
        </Card>

        <Card delay={180}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Recent period logs
          </Text>
          {periodLogs.length === 0 ? (
            <Text style={[styles.empty, { color: themeColors.textSoft }]}>No period logs yet.</Text>
          ) : (
            periodLogs.slice(0, 6).map((log) => (
              <View key={`${log.date}-${log.endDate || "open"}`} style={[styles.tableRow, { borderBottomColor: themeColors.border }]}>
                <Text style={[styles.tableText, { color: themeColors.text }]}>
                  {formatFriendly(log.date)}
                </Text>
                <Text style={[styles.tableText, { color: themeColors.textSoft }]}>
                  End: {log.endDate ? formatFriendly(log.endDate) : "Not logged"}
                </Text>
                <Text style={styles.tableAccent}>{getPeriodLength(log)}d</Text>
              </View>
            ))
          )}
        </Card>

        <Card delay={190}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Doctor notes
          </Text>
          {doctorNotes.length === 0 ? (
            <Text style={[styles.empty, { color: themeColors.textSoft }]}>
              No saved doctor notes yet.
            </Text>
          ) : (
            doctorNotes.slice(0, 6).map((note) => (
              <View key={`${note.date}-${note.text}`} style={[styles.tableRow, { borderBottomColor: themeColors.border }]}>
                <Text style={[styles.tableText, { color: themeColors.text }]}>
                  {formatFriendly(note.date)}
                </Text>
                <Text style={[styles.tableText, { color: themeColors.textSoft }]}>
                  {note.text}
                </Text>
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
  reportHeader: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start"
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.lavender,
    alignItems: "center",
    justifyContent: "center"
  },
  headerText: {
    flex: 1
  },
  sectionTitle: {
    color: colors.text,
    fontSize: type.subtitle,
    fontWeight: "900",
    marginBottom: spacing.xs
  },
  helper: {
    color: colors.textSoft,
    lineHeight: 21,
    fontWeight: "600"
  },
  notice: {
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: colors.peach,
    marginVertical: spacing.md
  },
  noticeText: {
    color: colors.text,
    lineHeight: 20,
    fontWeight: "700"
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  metricBox: {
    width: "48.5%",
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md
  },
  metricLabel: {
    fontWeight: "800",
    marginBottom: 6
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "900"
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.xs
  },
  chartLabel: {
    width: 76,
    fontSize: 11,
    fontWeight: "800"
  },
  barTrack: {
    flex: 1,
    height: 14,
    borderRadius: 99,
    overflow: "hidden"
  },
  barFill: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: colors.primary
  },
  chartValue: {
    width: 48,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "900"
  },
  empty: {
    color: colors.textSoft,
    fontWeight: "600"
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm
  },
  tableText: {
    flex: 1,
    fontWeight: "700"
  },
  tableAccent: {
    color: colors.primary,
    fontWeight: "900"
  }
});
