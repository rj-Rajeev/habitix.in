import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { Errors } from "@/lib/api";
import { requireCourseAccess } from "@/lib/enrollments/access";
import type { GenerateRoadmapInput } from "@/modules/tasks/task.schemas";
import { courseLearningService } from "@/modules/courses/course-learning.service";

const roadmapDaySchema = z.object({
  dayNumber: z.number(),
  tasks: z.array(z.object({ title: z.string() })),
});

const roadmapSchema = z.array(roadmapDaySchema);
const courseRoadmapSchema = z.array(z.object({
  dayNumber: z.number(),
  tasks: z.array(z.object({ title: z.string(), lessonId: z.string() })),
}));

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Errors.internal("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({ apiKey });
}

export const aiService = {
  async generateRoadmap(input: GenerateRoadmapInput) {
    const prompt = `You're a learning coach. Create a detailed ${input.duration} study plan (maximum 14 days) for:

Goal: ${input.title}
Preferred time: ${input.preferredTime}
Days per week: ${input.daysPerWeek}
Hours per day: ${input.hoursPerDay}
Motivation: ${input.motivation ?? "N/A"}

Return ONLY a JSON array. Each item:
- "dayNumber": number (1-based)
- "tasks": array of 3-5 objects with "title" (actionable, specific)

Example:
[{"dayNumber":1,"tasks":[{"title":"Read chapter 1"}]}]`;

    try {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty AI response");

      const jsonStart = text.indexOf("[");
      const jsonEnd = text.lastIndexOf("]") + 1;
      if (jsonStart < 0 || jsonEnd <= jsonStart) {
        throw new Error("No JSON array in response");
      }

      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd));
      const validated = roadmapSchema.parse(parsed);

      return validated.map((day, index) => ({
        dayNumber: day.dayNumber,
        unlocked: index === 0,
        completed: false,
        tasks: day.tasks.map((t) => ({
          title: t.title,
          isCompleted: false,
          createdAt: new Date(),
        })),
        proof: { uploaded: false },
      }));
    } catch (err) {
      console.error("[AI] roadmap generation failed:", err);
      throw Errors.internal("Failed to generate roadmap");
    }
  },

  async generateCourseRoadmap(input: GenerateRoadmapInput, userId: string, courseId: string) {
    await requireCourseAccess(userId, courseId);
    const { course, modules, lessons } = await courseLearningService.loadPublishedCourseContent(courseId);
    if (lessons.length === 0) throw Errors.badRequest("This course does not have any lessons yet");
    const allowedLessonIds = new Set(lessons.map((lesson) => lesson.lessonId));
    const allowedModules = new Map(modules.map((module) => [module.moduleId, module.moduleTitle]));
    if (input.focusAreas?.some((moduleId) => !allowedModules.has(moduleId))) {
      throw Errors.badRequest("A selected focus area does not belong to this course");
    }
    const selectedFocusAreas = input.focusAreas?.map((moduleId) => allowedModules.get(moduleId) as string);
    const prompt = `You're a learning coach. Create a personalized ${input.duration} study plan (maximum 30 days) for this published course.

Course: ${course.title}
Course description: ${course.description}
Goal: ${input.title}
Objective: ${input.objective ?? input.title}
Current level: ${input.currentLevel ?? "not specified"}
Existing knowledge: ${input.existingKnowledge ?? "not specified"}
Focus areas: ${selectedFocusAreas?.join(", ") || "not specified"}
Learning preference: ${input.learningPreference ?? "not specified"}
Additional requirements: ${input.additionalRequirements ?? "not specified"}
Preferred time: ${input.preferredTime}
Days per week: ${input.daysPerWeek}
Hours per day: ${input.hoursPerDay}
Motivation: ${input.motivation ?? "N/A"}

Available real lessons (lessonId is an authoritative database ID):
${JSON.stringify(lessons)}

Return ONLY a JSON array. Each item has "dayNumber" (1-based) and "tasks" (3-5 objects). Each task must have an actionable "title" and a "lessonId" copied exactly from the available lessons. Never create or alter lesson IDs.
Example: [{"dayNumber":1,"tasks":[{"title":"Understand the fundamentals","lessonId":"${lessons[0].lessonId}"}]}]`;

    try {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty AI response");
      const jsonStart = text.indexOf("[");
      const jsonEnd = text.lastIndexOf("]") + 1;
      if (jsonStart < 0 || jsonEnd <= jsonStart) throw new Error("No JSON array in response");
      const parsed = courseRoadmapSchema.parse(JSON.parse(text.slice(jsonStart, jsonEnd)));
      if (parsed.some((day) => day.tasks.some((task) => !allowedLessonIds.has(task.lessonId)))) {
        throw new Error("AI returned a lesson ID outside the supplied course");
      }

      const lessonTitles = new Map(lessons.map((lesson) => [lesson.lessonId, lesson.lessonTitle]));
      return parsed.map((day, index) => ({
        dayNumber: day.dayNumber,
        unlocked: index === 0,
        completed: false,
        tasks: day.tasks.map((task) => ({
          title: task.title,
          isCompleted: false,
          createdAt: new Date(),
          courseLessonId: task.lessonId,
          lessonTitle: lessonTitles.get(task.lessonId),
        })),
        proof: { uploaded: false },
      }));
    } catch (err) {
      console.error("[AI] course roadmap generation failed:", err);
      throw Errors.internal("Failed to generate course roadmap");
    }
  },
};
