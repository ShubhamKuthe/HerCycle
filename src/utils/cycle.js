import { addDays, daysBetween, toDateId } from "./date";

export const DEFAULT_CYCLE_LENGTH = 28;
export const IRREGULAR_CYCLE_LENGTH = 35;
export const DEFAULT_PERIOD_LENGTH = 5;

export function getLatestPeriodDate(onboarding, periodLogs) {
  if (periodLogs.length > 0) {
    return periodLogs[0].date;
  }

  return onboarding?.lastPeriodDate || null;
}

export function getLatestPeriodLog(onboarding, periodLogs) {
  if (periodLogs.length > 0) {
    return periodLogs[0];
  }

  if (onboarding?.lastPeriodDate) {
    return {
      date: onboarding.lastPeriodDate,
      endDate: onboarding.lastPeriodEndDate,
      source: "onboarding"
    };
  }

  return null;
}

export function getPeriodLength(log) {
  if (!log?.date) {
    return DEFAULT_PERIOD_LENGTH;
  }

  if (!log.endDate) {
    return DEFAULT_PERIOD_LENGTH;
  }

  const length = daysBetween(log.date, log.endDate) + 1;
  return Math.min(Math.max(length, 1), 12);
}

export function getEstimatedCycleLength(onboarding, periodLogs) {
  if (periodLogs.length >= 2) {
    const sortedOldestFirst = [...periodLogs].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const gaps = [];

    for (let index = 1; index < sortedOldestFirst.length; index += 1) {
      const gap = daysBetween(
        sortedOldestFirst[index - 1].date,
        sortedOldestFirst[index].date
      );

      if (gap >= 15 && gap <= 90) {
        gaps.push(gap);
      }
    }

    if (gaps.length > 0) {
      const total = gaps.reduce((sum, gap) => sum + gap, 0);
      return Math.round(total / gaps.length);
    }
  }

  if (onboarding?.cycleType === "Irregular" || onboarding?.regular === "No") {
    return IRREGULAR_CYCLE_LENGTH;
  }

  return DEFAULT_CYCLE_LENGTH;
}

export function getNextPeriodDate(onboarding, periodLogs) {
  const lastPeriodDate = getLatestPeriodDate(onboarding, periodLogs);

  if (!lastPeriodDate) {
    return null;
  }

  return addDays(lastPeriodDate, getEstimatedCycleLength(onboarding, periodLogs));
}

export function getAverageCycleLength(periodLogs) {
  if (periodLogs.length < 2) {
    return null;
  }

  return getEstimatedCycleLength(null, periodLogs);
}

export function getMissedCycleCount(onboarding, periodLogs) {
  const lastPeriodDate = getLatestPeriodDate(onboarding, periodLogs);

  if (!lastPeriodDate) {
    return 0;
  }

  const expectedLength = getEstimatedCycleLength(onboarding, periodLogs);
  const daysSinceLastPeriod = daysBetween(lastPeriodDate, toDateId());

  if (daysSinceLastPeriod <= expectedLength + 7) {
    return 0;
  }

  return Math.floor((daysSinceLastPeriod - expectedLength) / expectedLength);
}

export function getFertilityWindow(onboarding, periodLogs) {
  const nextPeriodDate = getNextPeriodDate(onboarding, periodLogs);

  if (!nextPeriodDate) {
    return [];
  }

  const ovulationEstimate = addDays(nextPeriodDate, -14);
  const dates = [];

  for (let offset = -5; offset <= 1; offset += 1) {
    dates.push(addDays(ovulationEstimate, offset));
  }

  return dates;
}

export function getCycleAlertFlags(onboarding, periodLogs, dailyLogs = []) {
  const flags = [];
  const latestLog = getLatestPeriodLog(onboarding, periodLogs);
  const estimatedCycleLength = getEstimatedCycleLength(onboarding, periodLogs);
  const missedCycles = getMissedCycleCount(onboarding, periodLogs);
  const recentHighPain = dailyLogs
    .slice(0, 10)
    .filter((log) => Number(log.painLevel) >= 4).length;

  if (estimatedCycleLength >= 45) {
    flags.push({
      title: "Long cycle pattern",
      message: "Recent cycle estimates are 45 days or longer. Consider discussing this with a clinician."
    });
  }

  if (latestLog?.endDate && getPeriodLength(latestLog) > 7) {
    flags.push({
      title: "Long bleeding duration",
      message: "The latest logged period lasted more than 7 days."
    });
  }

  if (recentHighPain >= 3) {
    flags.push({
      title: "Repeated high pain",
      message: "Pain level 4 or 5 has been logged multiple times recently."
    });
  }

  if (missedCycles >= 2) {
    flags.push({
      title: "Missed cycle pattern",
      message: "Two or more expected cycles may have been missed."
    });
  }

  return flags;
}
