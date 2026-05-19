import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { importTasksSchema } from "@/modules/tasks/task.schemas";
import { goalRepository } from "@/modules/goals/goal.repository";
import { taskImportService } from "@/modules/tasks/task-import.service";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMPORT_EXTENSIONS = [".xlsx", ".xls", ".csv"];

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const userId = await requireUserId();
    const form = await req.formData();
    const file = form.get("file");
    const parsed = importTasksSchema.safeParse({
      goalId: form.get("goalId"),
      date: form.get("date") || undefined,
    });

    if (!parsed.success) {
      throw Errors.badRequest("Invalid import data", parsed.error.flatten());
    }

    if (!(file instanceof File)) {
      throw Errors.badRequest("Excel file is required");
    }

    const fileName = file.name.toLowerCase();
    const validExtension = ALLOWED_IMPORT_EXTENSIONS.some((ext) =>
      fileName.endsWith(ext)
    );
    if (!validExtension) {
      throw Errors.badRequest("Upload an .xlsx, .xls, or .csv file");
    }

    if (file.size > MAX_IMPORT_BYTES) {
      throw Errors.badRequest("File must be 5MB or smaller");
    }

    const goal = await goalRepository.findByIdForUser(parsed.data.goalId, userId);
    if (!goal) {
      throw Errors.notFound("Goal");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await taskImportService.importExcel({
      userId,
      goalId: parsed.data.goalId,
      fallbackScheduledDate: parsed.data.date,
      replaceExisting: form.get("replace") === "true",
      file: buffer,
    });

    if (result.imported === 0) {
      throw Errors.badRequest("No tasks found in the uploaded file", result);
    }

    return jsonOk(result, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
