import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth/admin";
import { connectDb } from "@/lib/db";
import Course from "@/models/Course";
import { courseCreateSchema, normalizeSlug } from "@/lib/courses";

export async function GET() {
  try {
    await requireAdminUser();
    const courses = await Course.find().sort({ createdAt: -1 });
    return jsonOk(courses);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminUser();
    await connectDb();
    const parsed = courseCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw Errors.badRequest("Invalid course data", parsed.error.flatten());
    }

    const slug = normalizeSlug(parsed.data.slug);
    if (!slug) throw Errors.badRequest("Slug must contain letters or numbers");

    try {
      const course = await Course.create({ ...parsed.data, slug });
      return jsonOk(course, { status: 201 });
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
