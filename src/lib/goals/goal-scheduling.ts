import { toDateKeyInTimezone } from "@/lib/dates";

export type RoadmapWorkGroup<T> = {
  tasks: T[];
};

export type ScheduledRoadmapDay<T> = {
  dayNumber: number;
  dayDate: string;
  tasks: T[];
};

export type StudyDateOptions = {
  targetDate: string;
  daysPerWeek: number;
  timezone: string;
  now?: Date;
};

export function parseGoalDateKey(dateKey: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function isValidGoalTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

function formatDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function dateKeyInTimezone(date: Date, timezone: string) {
  return toDateKeyInTimezone(date, timezone);
}

/**
 * V1 uses a simple Monday-first recurrence: for N days per week, Monday through
 * the Nth weekday are study days. `today` is calculated in the Goal timezone;
 * targetDate is a date-only value in that same local calendar.
 */
export function getAvailableStudyDates({
  targetDate,
  daysPerWeek,
  timezone,
  now = new Date(),
}: StudyDateOptions): string[] {
  const startDate = parseGoalDateKey(dateKeyInTimezone(now, timezone));
  const endDate = parseGoalDateKey(targetDate);
  if (!startDate || !endDate || endDate < startDate) return [];

  const frequency = Math.max(1, Math.min(7, Math.floor(daysPerWeek)));
  const studyDates: string[] = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const mondayFirstWeekday = (cursor.getUTCDay() + 6) % 7;
    if (mondayFirstWeekday < frequency) studyDates.push(formatDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return studyDates;
}

/** Validate a submitted roadmap against the same date rules used by the scheduler. */
export function validateRoadmapSchedule(
  roadmap: Array<{ dayNumber: number; dayDate: string; tasks: unknown[] }>,
  options: StudyDateOptions,
  now = new Date()
): string[] {
  if (!isValidGoalTimezone(options.timezone)) return ["Goal timezone must be a valid IANA timezone"];
  if (!Number.isInteger(options.daysPerWeek) || options.daysPerWeek < 1 || options.daysPerWeek > 7) {
    return ["Days per week must be a whole number from 1 to 7"];
  }
  if (!parseGoalDateKey(options.targetDate)) return ["Target date must be a valid YYYY-MM-DD calendar date"];

  const today = dateKeyInTimezone(now, options.timezone);
  const todayDate = parseGoalDateKey(today);
  const targetDate = parseGoalDateKey(options.targetDate);
  if (!todayDate || !targetDate || targetDate < todayDate) return ["Target date must be today or later in the Goal timezone"];
  const allowedDates = new Set(getAvailableStudyDates({ ...options, now }));

  const errors: string[] = [];
  let previousDate: Date | undefined;
  for (const [index, day] of roadmap.entries()) {
    const dayDate = parseGoalDateKey(day.dayDate);
    if (!dayDate) {
      errors.push(`Roadmap day ${index + 1} must use a valid YYYY-MM-DD date`);
      continue;
    }
    if (day.dayNumber !== index + 1) errors.push("Roadmap day numbers must be sequential starting at 1");
    if (!day.tasks.length) errors.push(`Roadmap day ${index + 1} must contain at least one task`);
    if (dayDate < todayDate || dayDate > targetDate) errors.push(`Roadmap day ${index + 1} is outside the Goal date window`);
    if (!allowedDates.has(day.dayDate)) errors.push(`Roadmap day ${index + 1} is not an available study date`);
    if (previousDate && dayDate <= previousDate) errors.push("Roadmap dates must be strictly increasing");
    previousDate = dayDate;
  }
  return errors;
}

/**
 * Roadmap task schemas have no reliable duration/effort field. Treat each real
 * task as one indivisible work unit, preserve returned task order, and spread
 * those units across valid study dates. Unused dates remain empty; no work is
 * fabricated. AI day numbers/groups are intentionally ignored.
 */
export function scheduleRoadmapTasks<T>(
  roadmap: RoadmapWorkGroup<T>[],
  options: StudyDateOptions
): ScheduledRoadmapDay<T>[] {
  const tasks = roadmap.flatMap((group) => group.tasks ?? []);
  const studyDates = getAvailableStudyDates(options);
  if (tasks.length === 0 || studyDates.length === 0) return [];

  const tasksByDate = studyDates.map((): T[] => []);
  tasks.forEach((task, taskIndex) => {
    const dateIndex = tasks.length <= studyDates.length
      ? tasks.length === 1
        ? 0
        : Math.round((taskIndex * (studyDates.length - 1)) / (tasks.length - 1))
      : Math.floor((taskIndex * studyDates.length) / tasks.length);
    tasksByDate[dateIndex].push(task);
  });

  return tasksByDate.flatMap((dateTasks, dateIndex) =>
    dateTasks.length > 0
      ? [{
          dayNumber: 0,
          dayDate: studyDates[dateIndex],
          tasks: dateTasks,
        }]
      : []
  ).map((day, index) => ({ ...day, dayNumber: index + 1 }));
}
