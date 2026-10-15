export type CourseLesson = {
  _id: string;
  lessonSlug?: string;
  moduleId: string;
  title: string;
  description?: string;
  order: number;
  markdownContent?: string;
  videoUrl?: string;
  pdfUrl?: string;
  isFree?: boolean;
};

export type CourseModule = {
  _id: string;
  title: string;
  description?: string;
  order: number;
  lessons: CourseLesson[];
};

export type FlatCourseLesson = CourseLesson & {
  moduleTitle: string;
  moduleOrder: number;
};

export type CourseProgressSummary = { label: string; value?: number };
