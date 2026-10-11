import { NextRequest } from "next/server";
import { z } from "zod";
import { Errors, handleRouteError, jsonOk } from "@/lib/api";
import { requireUserId } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { courseCatalogService } from "@/modules/courses/services/course-catalog.service";
import { courseProgressService } from "@/modules/courses/services/course-progress.service";

const completeLessonSchema = z.object({ lessonId: z.string().regex(/^[a-f\d]{24}$/i) });

async function resolvePublishedCourseId(identifier: string) {
  return courseCatalogService.resolvePublishedCourseId(identifier);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const userId = await requireUserId();
    await connectDb();
    const { courseId } = await params;
    const actualCourseId = await resolvePublishedCourseId(courseId);
    return jsonOk(await courseProgressService.getCourseProgress(userId, actualCourseId));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const userId = await requireUserId();
    await connectDb();
    const { courseId } = await params;
    const parsed = completeLessonSchema.safeParse(await request.json());
    if (!parsed.success) throw Errors.badRequest("Invalid input", parsed.error.flatten());
    const actualCourseId = await resolvePublishedCourseId(courseId);
    return jsonOk(await courseProgressService.completeLesson(userId, actualCourseId, parsed.data.lessonId));
  } catch (error) {
    return handleRouteError(error);
  }
}
