import mongoose, { Schema, Document } from "mongoose";

export interface IChatThread extends Document {
  personaId: mongoose.Types.ObjectId;
  title?: string;
  status: "active" | "ended";
  messages: mongoose.Types.ObjectId[]; // refs to ChatMessage
  createdAt: Date;
  updatedAt: Date;
}

const ChatThreadSchema = new Schema<IChatThread>({
  personaId: { type: Schema.Types.ObjectId, ref: "Persona", required: true },
  title: { type: String },
  status: { type: String, enum: ["active", "ended"], default: "active" },
  messages: [{ type: Schema.Types.ObjectId, ref: "ChatMessage" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt on save
ChatThreadSchema.pre<IChatThread>("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.ChatThread ||
  mongoose.model<IChatThread>("ChatThread", ChatThreadSchema);
