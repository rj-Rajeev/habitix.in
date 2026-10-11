import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth/admin";
import { connectDb } from "@/lib/db";
import { isObjectId } from "@/modules/courses/validation/course.schemas";
import { courseAdminService } from "@/modules/courses/services/course-admin.service";
import { z } from "zod";

const publishSchema = z.object({ status: z.enum(["draft", "published"]) }).strict();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await requireAdminUser();
    await connectDb();
    const { courseId } = await params;
    if (!isObjectId(courseId)) throw Errors.notFound("Course");

    const parsed = publishSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw Errors.badRequest("Status must be draft or published", parsed.error.flatten());
    }

    const course = await courseAdminService.setCourseStatus(courseId, parsed.data.status);
    return jsonOk(course);
  } catch (error) {
    return handleRouteError(error);
  }
}
