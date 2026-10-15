import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    connectionRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConnectionRequest",
      default: undefined,
    },
  },
  { timestamps: true }
);

// for fast message fetching
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index(
  { connectionRequestId: 1 },
  {
    unique: true,
    sparse: true,
    name: "unique_intro_message_connection_request",
  }
);

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
