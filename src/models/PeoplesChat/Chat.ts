import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
    ],
  },
  { timestamps: true }
);

// prevent duplicate chats between same users
ChatSchema.index({ participants: 1 });

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);