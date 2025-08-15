// lib/types/chat.ts
export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  id?: string; // MongoDB ObjectId as string
  personaId: string; // Which persona this message is linked to
  role: ChatRole;
  content: string;
  createdAt: string; // ISO date string
}
