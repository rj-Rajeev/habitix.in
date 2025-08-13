import mongoose, { Schema, Document } from "mongoose";

export type ChatRole = "system" | "user" | "assistant";

export interface IChatMessage extends Document {
  personaId: mongoose.Types.ObjectId;
  role: ChatRole;
  content: string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  personaId: { type: Schema.Types.ObjectId, ref: "Persona", required: true },
  role: { type: String, enum: ["system", "user", "assistant"], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ChatMessage ||
  mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
