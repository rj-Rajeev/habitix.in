import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICourseLesson extends Document {
  courseId?: Types.ObjectId;
  moduleId: Types.ObjectId;
  lessonSlug?: string;
  title: string;
  description?: string;
  order: number;
  markdownContent?: string;
  videoUrl?: string;
  pdfUrl?: string;
  isFree: boolean;
}

const CourseLessonSchema: Schema<ICourseLesson> = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", index: true },
    moduleId: { type: Schema.Types.ObjectId, ref: "CourseModule", required: true, index: true },
    lessonSlug: { type: String, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    order: { type: Number, required: true, min: 0, default: 0 },
    markdownContent: { type: String },
    videoUrl: { type: String, trim: true },
    pdfUrl: { type: String, trim: true },
    isFree: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CourseLessonSchema.index(
  { courseId: 1, lessonSlug: 1 },
  {
    name: "course_lesson_slug_unique",
    unique: true,
    partialFilterExpression: {
      courseId: { $type: "objectId" },
      lessonSlug: { $type: "string" },
    },
  },
);

export default mongoose.models?.CourseLesson || mongoose.model<ICourseLesson>("CourseLesson", CourseLessonSchema);
