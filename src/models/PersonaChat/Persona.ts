import mongoose, { Schema, Document } from "mongoose";

export interface IPersona extends Document {
  name: string;
  description?: string;
  avatarEmoji?: string;
  systemPrompt?: string;
  createdAt: Date;
  updatedAt?: Date;
}

const PersonaSchema = new Schema<IPersona>(
  {
    name: { type: String, required: true },
    description: { type: String },
    avatarEmoji: { type: String },
    systemPrompt: { type: String },
    // model: { type: String, enum: ["gpt-4o", "gpt-4o-mini"], required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Persona ||
  mongoose.model<IPersona>("Persona", PersonaSchema);
