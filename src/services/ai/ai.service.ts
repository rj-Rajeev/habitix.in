import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { Errors } from "@/lib/api";
import type { GenerateRoadmapInput } from "@/modules/tasks/task.schemas";

const roadmapDaySchema = z.object({
  dayNumber: z.number(),
  tasks: z.array(z.object({ title: z.string() })),
});

const roadmapSchema = z.array(roadmapDaySchema);

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
};
