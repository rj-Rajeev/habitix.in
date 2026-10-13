export { requireCourseAccess } from "./services/course-access.service";
import { courseLearningService } from "./services/course-learning.service";
import { courseProgressService } from "./services/course-progress.service";

export function loadPublishedCourseContent(
  ...args: Parameters<typeof courseLearningService.loadPublishedCourseContent>
) {
  return courseLearningService.loadPublishedCourseContent(...args);
}

export type { CourseLearningLesson } from "./services/course-learning.service";

export function completeLesson(
  ...args: Parameters<typeof courseProgressService.completeLesson>
) {
  return courseProgressService.completeLesson(...args);
}
