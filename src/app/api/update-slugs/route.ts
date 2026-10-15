// pages/api/update-slugs.ts
import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import CourseLesson from "@/modules/courses/models/course-lesson.model"; // adjust path if needed
import { NextResponse } from "next/server";

// Simple slug generator without slugify
const makeSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric except spaces/hyphens
    .replace(/\s+/g, "-")         // replace spaces with hyphens
    .replace(/-+/g, "-");         // collapse multiple hyphens
};

// Ensure DB connection
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI as string);
};

export async function GET() {
  try {
    await connectDB();

    // Fetch all lessons
    const lessons = await CourseLesson.find();

    // Update each lesson with slug from title
    const updates = lessons.map(async (lesson) => {
      if (lesson.title) {
        const newSlug = makeSlug(lesson.title);
        lesson.lessonSlug = newSlug;
        return lesson.save();
      }
    });

    await Promise.all(updates);

    return NextResponse.json({ message: "All slugs updated successfully" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: "Internal server error", error: error.message });
  }
}
