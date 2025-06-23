import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY!;
const ai = new GoogleGenAI({ apiKey });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, hoursPerDay, daysPerWeek, preferredTime, motivation } = body;

    const prompt = `
You're a productivity and goal-setting coach. Create a detailed 7-day plan for achieving the following goal.

Goal: ${title}
Work time per day: ${hoursPerDay}h
Days per week: ${daysPerWeek}
Preferred working time: ${preferredTime}
Motivation: ${motivation}

Return only valid JSON:
[
  { "day": 1, "task": "..." },
  ...
]
`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    // ✅ Correct way to get the text
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No text found in Gemini response');
    }

    // Extract JSON
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']') + 1;
    const jsonString = text.slice(jsonStart, jsonEnd);

    const roadmap = JSON.parse(jsonString);

    return NextResponse.json({ roadmap });
  } catch (err) {
    console.error('Gemini Error:', err);
    return NextResponse.json({ error: '❌ Failed to generate roadmap' }, { status: 500 });
  }
}
