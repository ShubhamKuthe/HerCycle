export function toDateId(date = new Date()) {
  const safeDate = new Date(date);
  const year = safeDate.getFullYear();
  const month = `${safeDate.getMonth() + 1}`.padStart(2, "0");
  const day = `${safeDate.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateId(dateId) {
  const [year, month, day] = dateId.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(dateId, days) {
  const date = fromDateId(dateId);
  date.setDate(date.getDate() + days);
  return toDateId(date);
}

export function formatFriendly(dateId) {
  if (!dateId) {
    return "Not logged yet";
  }

  return fromDateId(dateId).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function daysBetween(olderDateId, newerDateId) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const older = fromDateId(olderDateId);
  const newer = fromDateId(newerDateId);
  return Math.round((newer - older) / msPerDay);
}
