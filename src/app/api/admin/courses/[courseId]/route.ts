import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth/admin";
import { connectDb } from "@/lib/db";
import { courseUpdateSchema, isObjectId, normalizeSlug } from "@/lib/courses";
import Course from "@/models/Course";

async function getCourseId(params: Promise<{ courseId: string }>) {
  const { courseId } = await params;
  if (!isObjectId(courseId)) throw Errors.notFound("Course");
  return courseId;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await requireAdminUser();
    await connectDb();
    const courseId = await getCourseId(params);
    const course = await Course.findOne({ _id: courseId, delete: { $ne: true } });
    if (!course) throw Errors.notFound("Course");
    return jsonOk(course);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await requireAdminUser();
    await connectDb();
    const courseId = await getCourseId(params);
    const parsed = courseUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw Errors.badRequest("Invalid course data", parsed.error.flatten());
    }

    const update = { ...parsed.data };
    if (update.slug !== undefined) {
      update.slug = normalizeSlug(update.slug);
      if (!update.slug) throw Errors.badRequest("Slug must contain letters or numbers");
    }

    try {
      const course = await Course.findOneAndUpdate({ _id: courseId, delete: { $ne: true } }, update, {
        new: true,
        runValidators: true,
      });
      if (!course) throw Errors.notFound("Course");
      return jsonOk(course);
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw Errors.conflict("A course with this slug already exists");
      }
      throw error;
    }
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await requireAdminUser();
    await connectDb();
    const courseId = await getCourseId(params);
    const course = await Course.findOneAndUpdate({ _id: courseId, delete: { $ne: true } }, { delete: true }, { new: true }).select("_id");
    if (!course) throw Errors.notFound("Course");
    return jsonOk({ deleted: true, archived: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
