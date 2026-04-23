import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "../styles/theme";
import { addDays, fromDateId, toDateId } from "../utils/date";
import { getPeriodLength } from "../utils/cycle";
import FadeInView from "./FadeInView";
import { useThemeMode } from "../context/ThemeContext";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatMonth(date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });
}

function getMonthGrid(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const mondayOffset = firstDay === 0 ? 6 : firstDay - 1;
  const cells = [];

  for (let index = 0; index < mondayOffset; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function buildMarkedDates(periodLogs, nextPeriodDate, fertilityDates = []) {
  const markedDates = {};

  fertilityDates.forEach((dateId) => {
    markedDates[dateId] = {
      fertility: true,
      customStyles: {
        container: styles.fertileDate,
        text: styles.fertileDateText
      }
    };
  });

  periodLogs.forEach((log) => {
    const periodLength = getPeriodLength(log);

    for (let offset = 0; offset < periodLength; offset += 1) {
      const dateId = addDays(log.date, offset);
      const opacity = Math.max(0.25, 1 - offset * (0.75 / periodLength));

      markedDates[dateId] = {
        periodOffset: offset,
        customStyles: {
          container: [
            styles.periodDate,
            {
              backgroundColor: `rgba(230, 76, 141, ${opacity})`
            }
          ],
          text: offset === 0 ? styles.periodDateText : styles.periodFadeText
        }
      };
    }
  });

  if (nextPeriodDate) {
    markedDates[nextPeriodDate] = {
      customStyles: {
        container: styles.predictedDate,
        text: styles.predictedDateText
      }
    };
  }

  const today = toDateId();
  const todayMark = markedDates[today];

  if (todayMark?.periodOffset !== undefined) {
    markedDates[today] = {
      ...todayMark,
      customStyles: {
        container: [todayMark.customStyles.container, styles.todayPeriodDate],
        text: todayMark.customStyles.text
      }
    };
  } else {
    markedDates[today] = {
      ...(todayMark || {}),
      customStyles: {
        container: styles.todayDate,
        text: styles.todayDateText
      }
    };
  }

  return markedDates;
}

export default function CycleCalendar({
  periodLogs,
  nextPeriodDate,
  fertilityDates = []
}) {
  const { isDarkMode, themeColors } = useThemeMode();
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const focusDate = nextPeriodDate ? fromDateId(nextPeriodDate) : new Date();
    return new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
  });
  const markedDates = useMemo(
    () => buildMarkedDates(periodLogs, nextPeriodDate, fertilityDates),
    [periodLogs, nextPeriodDate, fertilityDates]
  );
  const monthCells = useMemo(() => getMonthGrid(visibleMonth), [visibleMonth]);

  function moveMonth(direction) {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + direction, 1)
    );
  }

  return (
    <FadeInView
      delay={90}
      style={[
        styles.wrapper,
        {
          backgroundColor: themeColors.surfaceGlass,
          borderColor: themeColors.border,
          shadowColor: themeColors.shadow
        }
      ]}
    >
      <View style={styles.monthHeader}>
        <Pressable
          onPress={() => moveMonth(-1)}
          style={({ pressed }) => [
            styles.arrowButton,
            pressed ? styles.arrowPressed : null
          ]}
        >
          <Ionicons name="chevron-back" size={19} color={colors.primary} />
        </Pressable>
        <Text style={[styles.monthTitle, { color: themeColors.text }]}>
          {formatMonth(visibleMonth)}
        </Text>
        <Pressable
          onPress={() => moveMonth(1)}
          style={({ pressed }) => [
            styles.arrowButton,
            pressed ? styles.arrowPressed : null
          ]}
        >
          <Ionicons name="chevron-forward" size={19} color={colors.primary} />
        </Pressable>
      </View>

      <View
        style={[
          styles.calendarBody,
          {
            backgroundColor: isDarkMode
              ? themeColors.surfaceSoft
              : themeColors.surfaceGlass
          }
        ]}
      >
        <View style={styles.weekRow}>
          {weekDays.map((day) => (
            <Text key={day} style={[styles.weekText, { color: themeColors.muted }]}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {monthCells.map((date, index) => {
            if (!date) {
              return <View key={`empty-${index}`} style={styles.gridCell} />;
            }

            const dateId = toDateId(date);
            const marked = markedDates[dateId];
            const isPeriod = marked?.periodOffset !== undefined;
            const containerStyle = marked?.customStyles?.container;
            const textStyle = marked?.customStyles?.text;

            return (
              <View key={dateId} style={styles.gridCell}>
                <View style={[styles.dayCell, containerStyle]}>
                  <Text
                    style={[
                      styles.dayText,
                      { color: themeColors.text },
                      textStyle
                    ]}
                  >
                    {isPeriod
                      ? marked.periodOffset === 0
                        ? "X"
                        : date.getDate()
                      : date.getDate()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.periodDot]} />
          <Text style={[styles.legendText, { color: themeColors.textSoft }]}>Period</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.predictedDot]} />
          <Text style={[styles.legendText, { color: themeColors.textSoft }]}>Predicted</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.todayDot]} />
          <Text style={[styles.legendText, { color: themeColors.textSoft }]}>Today</Text>
        </View>
        {fertilityDates.length > 0 ? (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.fertileDot]} />
            <Text style={[styles.legendText, { color: themeColors.textSoft }]}>Fertile</Text>
          </View>
        ) : null}
      </View>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surfaceGlass,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 9 },
    elevation: 5
  },
  monthHeader: {
    minHeight: 54,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: "900"
  },
  arrowButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center"
  },
  arrowPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.78
  },
  calendarBody: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: spacing.xs
  },
  weekText: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "900"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  gridCell: {
    width: `${100 / 7}%`,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  dayCell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center"
  },
  dayText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  disabledDay: {
    color: colors.border
  },
  periodDate: {
    backgroundColor: colors.primary
  },
  periodDateText: {
    color: colors.surface
  },
  periodFadeText: {
    color: colors.surface
  },
  predictedDate: {
    backgroundColor: colors.lavender,
    borderWidth: 2,
    borderColor: colors.secondary
  },
  predictedDateText: {
    color: colors.secondary
  },
  fertileDate: {
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: "#5ECDB7"
  },
  fertileDateText: {
    color: "#197665"
  },
  todayDate: {
    backgroundColor: colors.primary
  },
  todayPeriodDate: {
    borderWidth: 2,
    borderColor: colors.surface
  },
  todayDateText: {
    color: colors.surface
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  periodDot: {
    backgroundColor: colors.accent
  },
  predictedDot: {
    backgroundColor: colors.secondary
  },
  todayDot: {
    backgroundColor: colors.primary
  },
  fertileDot: {
    backgroundColor: "#5ECDB7"
  },
  legendText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "600"
  }
});
