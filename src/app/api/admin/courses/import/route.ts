import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth/admin";
import { connectDb } from "@/lib/db";
import { courseImportService } from "@/modules/courses/services/course-import.service";

export async function POST(request: NextRequest) {
  try {
    await requireAdminUser();
    await connectDb();
    const body = await request.json().catch(() => null) as { csv?: unknown; action?: unknown } | null;
    if (typeof body?.csv !== "string" || body.csv.length === 0) throw Errors.badRequest("Choose a non-empty CSV file.");
    if (body.csv.length > 10_000_000) throw Errors.badRequest("CSV file must be smaller than 10 MB.");
    if (body.action !== "preview" && body.action !== "import") throw Errors.badRequest("Unsupported import action.");

    if (body.action === "preview") {
      const { data, issues } = await courseImportService.inspectCsv(body.csv);
      return jsonOk({ data, issues });
    }

    const data = await courseImportService.validateImportCsv(body.csv);
    const importedCourse = await courseImportService.importCsv(data);

    return jsonOk({
      course: importedCourse,
      moduleCount: data.modules.length,
      lessonCount: data.lessonCount,
      freeLessonCount: data.freeLessonCount,
    }, { status: 201 });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return handleRouteError(Errors.conflict("A course with this slug already exists. Choose another slug or use the existing manual builder."));
    }
    return handleRouteError(error);
  }
}
