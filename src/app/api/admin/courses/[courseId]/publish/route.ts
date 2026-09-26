import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth/admin";
import { connectDb } from "@/lib/db";
import { isObjectId } from "@/lib/courses";
import Course from "@/models/Course";
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

    const course = await Course.findOneAndUpdate(
      { _id: courseId, delete: { $ne: true } },
      { status: parsed.data.status },
      { new: true, runValidators: true }
    );
    if (!course) throw Errors.notFound("Course");
    return jsonOk(course);
  } catch (error) {
    return handleRouteError(error);
  }
}
