export type RoadmapWorkGroup<T> = {
  tasks: T[];
};

export type ScheduledRoadmapDay<T> = {
  dayNumber: number;
  dayDate: string;
  tasks: T[];
};

type StudyDateOptions = {
  targetDate: string;
  daysPerWeek: number;
  timezone: string;
  now?: Date;
};

function parseDateKey(dateKey: string): Date | null {
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

function formatDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function dateKeyInTimezone(date: Date, timezone: string) {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
  } catch {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
  }

  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
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
  const startDate = parseDateKey(dateKeyInTimezone(now, timezone));
  const endDate = parseDateKey(targetDate);
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
