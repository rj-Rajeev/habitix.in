import { z } from "zod";
import { Errors } from "@/lib/api";
import { requireCourseAccess } from "@/lib/enrollments/access";
import type { GenerateRoadmapInput } from "@/modules/tasks/task.schemas";
import { courseLearningService } from "@/modules/courses/course-learning.service";
import OpenAI from "openai";

const roadmapDaySchema = z.object({
  dayNumber: z.number(),
  tasks: z.array(z.object({ title: z.string() })),
});

const roadmapSchema = z.array(roadmapDaySchema);

const courseRoadmapSchema = z.array(
  z.object({
    dayNumber: z.number(),
    tasks: z.array(
      z.object({
        title: z.string(),
        lessonId: z.string(),
      })
    ),
  })
);

function getClient() {
  return new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
}

async function generateText(prompt: string) {
  const ai = getClient();

  const response = await ai.chat.completions.create({
    model: "gemini-2.5-flash",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text = response.choices[0]?.message?.content;

  if (!text) {
    throw new Error("Empty AI response");
  }

  return text;
}

export const aiService = {
  async generateRoadmap(input: GenerateRoadmapInput) {
    const prompt = `You're a learning coach. Create meaningful, ordered work for the goal below within the supplied planning window and capacity:

Goal: ${input.title}
Planning window: ${input.duration}
Preferred time: ${input.preferredTime}
Days per week: ${input.daysPerWeek}
Hours per day: ${input.hoursPerDay}
Motivation: ${input.motivation ?? "N/A"}

Return only a JSON array of ordered work groups. The groups are sequence containers, not calendar days. Habitix assigns calendar dates after generation. Do not output dates or decide which weekdays are study days. Use the requested available time and frequency as capacity context; do not invent task duration estimates.

Each item must have:
- "dayNumber": numeric sequence metadata only
- "tasks": array of 3-5 objects with an actionable, specific "title"

Example:
[{"dayNumber":1,"tasks":[{"title":"Read chapter 1"}]}]`;

    try {
      const text = await generateText(prompt);

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

  async generateCourseRoadmap(
    input: GenerateRoadmapInput,
    userId: string,
    courseId: string
  ) {
    await requireCourseAccess(userId, courseId);

    const { course, modules, lessons } =
      await courseLearningService.loadPublishedCourseContent(courseId);

    if (lessons.length === 0) {
      throw Errors.badRequest("This course does not have any lessons yet");
    }

    const allowedModules = new Map(
      modules.map((module) => [module.moduleId, module.moduleTitle])
    );

    if (
      input.focusAreas?.some(
        (moduleId) => !allowedModules.has(moduleId)
      )
    ) {
      throw Errors.badRequest(
        "A selected focus area does not belong to this course"
      );
    }

    const selectedFocusAreas = input.focusAreas?.map(
      (moduleId) => allowedModules.get(moduleId) as string
    );
    const planLessons = lessons;
    const allowedLessonIds = new Set(planLessons.map((lesson) => lesson.lessonId));

    const prompt = `You're a learning coach. Create personalized, ordered work for the goal and planning window below. Habitix, not you, assigns calendar dates.

Course: ${course.title}
Course description: ${course.description}
Goal: ${input.title}
Objective: ${input.objective ?? input.title}
Planning window: ${input.duration}
Current level: ${input.currentLevel ?? "not specified"}
Existing knowledge: ${input.existingKnowledge ?? "not specified"}
Focus areas: ${selectedFocusAreas?.join(", ") || "not specified"}
Learning preference: ${input.learningPreference ?? "not specified"}
Additional requirements: ${input.additionalRequirements ?? "not specified"}
Preferred time: ${input.preferredTime}
Days per week: ${input.daysPerWeek}
Hours per day: ${input.hoursPerDay}
Motivation: ${input.motivation ?? "N/A"}

Available real lessons for this plan (lessonId is an authoritative database ID):
${JSON.stringify(planLessons)}

Return ONLY a JSON array of ordered work groups. Each item's "dayNumber" is sequence metadata only, not a calendar day. Do not output dates or choose study weekdays. Include one task for every supplied lesson exactly once. Each task needs an actionable "title" and the exact "lessonId" copied from that lesson. Never create, alter, omit, or duplicate lesson IDs. Use the selected time capacity as context, but do not invent tasks beyond the supplied course lessons or task duration estimates.

Example:
[{"dayNumber":1,"tasks":[{"title":"Understand the fundamentals","lessonId":"${lessons[0].lessonId}"}]}]`;

    try {
      const text = await generateText(prompt);

      const jsonStart = text.indexOf("[");
      const jsonEnd = text.lastIndexOf("]") + 1;

      if (jsonStart < 0 || jsonEnd <= jsonStart) {
        throw new Error("No JSON array in response");
      }

      const parsed = courseRoadmapSchema.parse(
        JSON.parse(text.slice(jsonStart, jsonEnd))
      );

      const generatedTitles = new Map<string, string>();
      for (const task of parsed.flatMap((day) => day.tasks)) {
        if (!allowedLessonIds.has(task.lessonId)) {
          throw new Error("AI returned a lesson ID outside the supplied course focus");
        }
        if (!generatedTitles.has(task.lessonId)) generatedTitles.set(task.lessonId, task.title);
      }

      // Curriculum order is authoritative; AI may personalize titles but cannot
      // reorder, omit, duplicate, or invent course lessons.
      const orderedLessonIds = planLessons.map((lesson) => lesson.lessonId);
      const lessonById = new Map(planLessons.map((lesson) => [lesson.lessonId, lesson]));
      return [{
        dayNumber: 1,
        unlocked: true,
        completed: false,
        tasks: orderedLessonIds.map((lessonId) => {
          const lesson = lessonById.get(lessonId)!;
          return {
          title: generatedTitles.get(lessonId)?.trim() || lesson.lessonTitle,
          isCompleted: false,
          createdAt: new Date(),
          courseLessonId: lesson.lessonId,
          lessonTitle: lesson.lessonTitle,
        }; }),
        proof: { uploaded: false },
      }];
    } catch (err) {
      console.error("[AI] course roadmap generation failed:", err);
      throw Errors.internal("Failed to generate course roadmap");
    }
  },
};
