import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY!;
const ai = new GoogleGenAI({ apiKey });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, hoursPerDay, daysPerWeek, preferredTime, motivation } = body;

    const prompt = `
You're a productivity and goal-setting coach. Create a detailed ${preferredTime} plan for achieving the following goal.

Goal: ${title}
Preferred working time in days: ${preferredTime}
Days per week: ${daysPerWeek}
Work time per day: ${hoursPerDay} hours
Motivation: ${motivation}

Return a JSON array where each item represents one day of the roadmap. Each day should include:
- "dayNumber": number (1-based)
- "tasks": an array of 3-5 small actionable task objects with "title"

Example format:
[
  {
    "dayNumber": 1,
    "tasks": [
      { "title": "Read 10 pages of X" },
      { "title": "Summarize notes" },
      ...
    ]
  },
  ...
]
ONLY RETURN JSON. Do not include explanations.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No content in Gemini response");

    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']') + 1;
    const jsonString = text.slice(jsonStart, jsonEnd);

    const parsed = JSON.parse(jsonString);

    // Transform into final schema format
    const roadmap = parsed.map((day: any, index: number) => ({
      dayNumber: day.dayNumber,
      unlocked: index === 0, // unlock first day only
      completed: false,
      tasks: day.tasks.map((t: any) => ({
        title: t.title,
        isCompleted: false,
        createdAt: new Date()
      })),
      proof: {
        uploaded: false
      }
    }));

    return NextResponse.json({ roadmap });

  } catch (err) {
    console.error('Gemini Error:', err);
    return NextResponse.json({ error: '❌ Failed to generate roadmap' }, { status: 500 });
  }
}
