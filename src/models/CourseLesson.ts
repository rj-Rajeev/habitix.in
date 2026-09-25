import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICourseLesson extends Document {
  moduleId: Types.ObjectId;
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
    moduleId: { type: Schema.Types.ObjectId, ref: "CourseModule", required: true, index: true },
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

export default mongoose.models?.CourseLesson || mongoose.model<ICourseLesson>("CourseLesson", CourseLessonSchema);
