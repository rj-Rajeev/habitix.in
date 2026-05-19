import * as XLSX from "xlsx";
import { Errors } from "@/lib/api";
import { toDateKey } from "@/lib/dates";
import { taskRepository } from "./task.repository";
import { TASK_SPREADSHEET_REQUIRED_HEADERS } from "./task-spreadsheet";

type Row = Record<string, unknown>;

type ImportParams = {
  userId: string;
  goalId: string;
  fallbackScheduledDate?: string;
  replaceExisting?: boolean;
  file: Buffer;
};

const TASK_KEYS = ["task"];
const TOPIC_KEYS = ["topic"];
const DESCRIPTION_KEYS = ["description"];
const DATE_KEYS = ["date"];
const PRIORITY_KEYS = ["priority"];
const STATUS_KEYS = ["status"];
const MINUTES_KEYS = ["minutes"];
const REQUIRED_HEADER_KEYS = TASK_SPREADSHEET_REQUIRED_HEADERS.map((header) =>
  header.toLowerCase()
);

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

function toStatus(
  value: string
): "pending" | "in_progress" | "completed" | "skipped" | "cancelled" {
  const normalized = value.toLowerCase().replace(/\s+/g, "_");
  if (
    normalized === "in_progress" ||
    normalized === "completed" ||
    normalized === "skipped" ||
    normalized === "cancelled"
  ) {
    return normalized;
  }
  if (normalized === "done") return "completed";
  if (normalized === "cancel") return "cancelled";
  return "pending";
}

function toMinutes(value: string) {
  const match = value.match(/\d+/);
  const minutes = match ? Number(match[0]) : Number(value);
  if (!Number.isFinite(minutes)) return 30;
  return Math.min(Math.max(Math.round(minutes), 5), 480);
}

function buildDescription(row: Row) {
  return pick(row, DESCRIPTION_KEYS);
}

function assertRequiredHeaders(workbook: XLSX.WorkBook) {
  const missingBySheet = workbook.SheetNames.map((sheetName) => {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(
      workbook.Sheets[sheetName],
      { header: 1, blankrows: false }
    );
    if (rows.length === 0) {
      return { sheetName, missing: [] };
    }

    const headerKeys = (rows[0] ?? []).map((value) =>
      String(value ?? "")
        .trim()
        .toLowerCase()
    );
    const missing = REQUIRED_HEADER_KEYS.filter(
      (header) => !headerKeys.includes(header)
    );

    return { sheetName, missing };
  }).filter((sheet) => sheet.missing.length > 0);

  if (missingBySheet.length === 0) return;

  throw Errors.badRequest("Invalid task spreadsheet headers", {
    requiredHeaders: TASK_SPREADSHEET_REQUIRED_HEADERS,
    missingBySheet,
  });
}

export const taskImportService = {
  async importExcel({
    userId,
    goalId,
    fallbackScheduledDate,
    replaceExisting,
    file,
  }: ImportParams) {
    const workbook = XLSX.read(file, {
      type: "buffer",
      cellDates: true,
    });
    assertRequiredHeaders(workbook);

    const fallbackDate = fallbackScheduledDate ?? toDateKey();
    const rows = workbook.SheetNames.flatMap((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
    });

    const tasks = rows
      .map((row, index) => {
        const task = pick(row, TASK_KEYS);
        const topic = pick(row, TOPIC_KEYS);
        if (!task && !topic) return null;

        const minutes = toMinutes(pick(row, MINUTES_KEYS));
        return {
          userId,
          goalId,
          date: toDateValue(pick(row, DATE_KEYS), fallbackDate),
          task: task.slice(0, 200) || topic.slice(0, 200),
          topic: topic.slice(0, 200) || task.slice(0, 200),
          title: topic.slice(0, 200) || task.slice(0, 200),
          description: buildDescription(row).slice(0, 2000) || undefined,
          scheduledDate: toDateValue(pick(row, DATE_KEYS), fallbackDate),
          priority: toPriority(pick(row, PRIORITY_KEYS)),
          minutes,
          estimatedMinutes: minutes,
          scheduledOrder: index,
          type: "execution" as const,
          status: toStatus(pick(row, STATUS_KEYS)),
          source: { type: "import" as const },
        };
      })
      .filter((task): task is NonNullable<typeof task> => Boolean(task));

    if (tasks.length === 0) {
      return { imported: 0, skipped: rows.length };
    }

    if (replaceExisting) {
      await taskRepository.deleteByGoalId(goalId);
    }

    await taskRepository.createMany(tasks);
    return { imported: tasks.length, skipped: rows.length - tasks.length };
  },
};
