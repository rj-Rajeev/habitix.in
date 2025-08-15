// lib/types/persona.ts
export interface Persona {
  id?: string; // MongoDB ObjectId as string
  name: string;
  description?: string;
  avatarEmoji?: string; // e.g. "🤖"
  systemPrompt?: string; // The system message to guide the model
  model: "gpt-4o" | "gpt-4o-mini"; // Which OpenAI model to use
  temperature: number; // 0 to 2
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
}
