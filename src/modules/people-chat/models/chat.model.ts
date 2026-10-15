import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
    ],
    connectionRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConnectionRequest",
      default: undefined,
    },
  },
  { timestamps: true }
);

// prevent duplicate chats between same users
ChatSchema.index({ participants: 1 });
ChatSchema.index(
  { connectionRequestId: 1 },
  {
    unique: true,
    sparse: true,
    name: "unique_chat_connection_request",
  }
);

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
