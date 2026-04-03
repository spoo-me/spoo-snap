/**
 * Smart date formatter matching the dashboard's smart-datetime.js pattern.
 * No external dependencies — pure JS.
 */

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Format a date string as a smart relative/absolute label.
 *
 * - < 1 hour ago  → "5m ago"
 * - < 24 hours    → "3h ago"
 * - Yesterday     → "Yesterday"
 * - This week     → "Mon" / "Tue"
 * - This year     → "Mar 15"
 * - Older         → "Mar 15, 2023"
 */
export function smartDate(input: string): string {
  if (!input) return "";

  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const diff = now.getTime() - d.getTime();

  if (diff < HOUR) {
    const mins = Math.max(1, Math.floor(diff / MINUTE));
    return `${mins}m ago`;
  }

  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours}h ago`;
  }

  const todayStart = startOfDay(now);
  const yesterdayStart = todayStart - DAY;

  if (d.getTime() >= yesterdayStart && d.getTime() < todayStart) {
    return "Yesterday";
  }

  const weekAgo = todayStart - 6 * DAY;
  if (d.getTime() >= weekAgo) {
    return d.toLocaleDateString(undefined, { weekday: "short" });
  }

  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
