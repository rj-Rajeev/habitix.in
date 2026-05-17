import * as XLSX from "xlsx";
import { toDateKey } from "@/lib/dates";
import { taskRepository } from "./task.repository";

type Row = Record<string, unknown>;

type ImportParams = {
  userId: string;
  goalId: string;
  fallbackScheduledDate?: string;
  file: Buffer;
};

const TITLE_KEYS = [
  "task",
  "task title",
  "title",
  "question",
  "questions",
  "subtopic / questions to revise",
  "problem",
  "topic",
];
const QUESTION_KEYS = [
  "question",
  "questions",
  "interview question",
  "subtopic / questions to revise",
  "prompt",
];
const DESCRIPTION_KEYS = [
  "description",
  "details",
  "notes",
  "answer",
  "solution",
  "leetcode link",
  "link",
  "url",
  "difficulty",
  "topic",
  "task type",
  "focus area",
];
const DATE_KEYS = ["date", "scheduled date", "scheduleddate", "due date", "duedate"];
const PRIORITY_KEYS = ["priority"];
const MINUTES_KEYS = [
  "minutes",
  "estimated minutes",
  "estimatedminutes",
  "estimated time",
  "estimatedtime",
  "time",
  "duration",
];

function normalizedEntries(row: Row) {
  return Object.entries(row).map(([key, value]) => [
    key.trim().toLowerCase(),
    value,
  ] as const);
}

function pick(row: Row, keys: string[]) {
  const entries = normalizedEntries(row);
  const found = entries.find(([key]) => keys.includes(key));
  if (!found) return "";
  const value = found[1];
  if (value instanceof Date) return toDateKey(value);
  return String(value ?? "").trim();
}

function toDateValue(value: string, fallback: string) {
  if (!value) return fallback;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return toDateKey(parsed);
}

function toPriority(value: string): "low" | "medium" | "high" {
  const normalized = value.toLowerCase();
  if (normalized === "low" || normalized === "high") return normalized;
  return "medium";
}

function toMinutes(value: string) {
  const match = value.match(/\d+/);
  const minutes = match ? Number(match[0]) : Number(value);
  if (!Number.isFinite(minutes)) return 30;
  return Math.min(Math.max(Math.round(minutes), 5), 480);
}

function buildDescription(row: Row) {
  const question = pick(row, QUESTION_KEYS);
  const description = DESCRIPTION_KEYS.map((key) => {
    const value = pick(row, [key]);
    return value ? `${key}: ${value}` : "";
  }).filter(Boolean);

  if (question && !description.some((line) => line.includes(question))) {
    description.unshift(`question: ${question}`);
  }

  return description.join("\n");
}

export const taskImportService = {
  async importExcel({ userId, goalId, fallbackScheduledDate, file }: ImportParams) {
    const workbook = XLSX.read(file, {
      type: "buffer",
      cellDates: true,
    });
    const fallbackDate = fallbackScheduledDate ?? toDateKey();
    const rows = workbook.SheetNames.flatMap((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
    });

    const tasks = rows
      .map((row, index) => {
        const title = pick(row, TITLE_KEYS);
        if (!title) return null;

        return {
          userId,
          goalId,
          title: title.slice(0, 200),
          description: buildDescription(row).slice(0, 2000) || undefined,
          scheduledDate: toDateValue(pick(row, DATE_KEYS), fallbackDate),
          priority: toPriority(pick(row, PRIORITY_KEYS)),
          estimatedMinutes: toMinutes(pick(row, MINUTES_KEYS)),
          scheduledOrder: index,
          type: "execution" as const,
          status: "pending" as const,
          source: { type: "import" as const },
        };
      })
      .filter((task): task is NonNullable<typeof task> => Boolean(task));

    if (tasks.length === 0) {
      return { imported: 0, skipped: rows.length };
    }

    await taskRepository.createMany(tasks);
    return { imported: tasks.length, skipped: rows.length - tasks.length };
  },
};
