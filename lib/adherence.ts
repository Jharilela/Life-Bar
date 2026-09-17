import type { MedicationLog } from "./types";

export type AdherenceSummary = {
  streakDays: number;
  completionPct: number;
  windowDays: number;
};

/**
 * Streak counts consecutive taken days ending today; completion is taken/logged
 * over the trailing window. Days with no log at all don't count against either.
 */
export function computeAdherence(
  logs: Pick<MedicationLog, "log_date" | "taken">[],
  windowDays = 30
): AdherenceSummary {
  const byDate = new Map(logs.map((log) => [log.log_date, log.taken]));

  let streakDays = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    const taken = byDate.get(key);
    if (taken !== true) break;
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const logged = logs.filter((log) => {
    const daysAgo =
      (Date.now() - new Date(log.log_date).getTime()) / 86_400_000;
    return daysAgo >= 0 && daysAgo < windowDays;
  });
  const taken = logged.filter((log) => log.taken).length;
  const completionPct =
    logged.length === 0 ? 0 : Math.round((taken / logged.length) * 100);

  return { streakDays, completionPct, windowDays };
}
