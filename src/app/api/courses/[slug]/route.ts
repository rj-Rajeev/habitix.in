import { NextRequest } from "next/server";
import { handleRouteError, jsonOk, Errors } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { normalizeSlug } from "@/lib/courses";
import Course from "@/models/Course";
import CourseModule from "@/models/CourseModule";
import CourseLesson from "@/models/CourseLesson";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDb();
    const { slug } = await params;
    const course = await Course.findOne({ slug: normalizeSlug(slug), status: "published" });
    if (!course) throw Errors.notFound("Course");

    const modules = await CourseModule.find({ courseId: course._id }).sort({ order: 1, createdAt: 1 });
    const lessons = await CourseLesson.find({ moduleId: { $in: modules.map((module) => module._id) } })
      .sort({ order: 1, createdAt: 1 });

    return jsonOk({
      course,
      modules: modules.map((module) => ({
        ...module.toObject(),
        lessons: lessons.filter((lesson) => lesson.moduleId.toString() === module._id.toString()),
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
