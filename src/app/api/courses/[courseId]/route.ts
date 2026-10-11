import { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { getOptionalUserId } from "@/lib/auth/session";
import { courseCatalogService } from "@/modules/courses/services/course-catalog.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await connectDb();
    const { courseId: slug } = await params;
    const userId = await getOptionalUserId();
    return jsonOk(await courseCatalogService.getPublishedCourseDetail(slug, userId ?? undefined));
  } catch (error) {
    return handleRouteError(error);
  }
}
