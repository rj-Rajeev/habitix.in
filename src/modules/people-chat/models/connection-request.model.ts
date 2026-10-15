import mongoose, { Schema, Types } from "mongoose";
import type {
  ConnectionRequestRecord,
  ConnectionRequestStatus,
} from "@/modules/people-chat/types/connection-request";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export function getConnectionRequestPairKey(
  firstUserId: string,
  secondUserId: string
): string {
  if (
    !OBJECT_ID_PATTERN.test(firstUserId) ||
    !OBJECT_ID_PATTERN.test(secondUserId) ||
    !Types.ObjectId.isValid(firstUserId) ||
    !Types.ObjectId.isValid(secondUserId)
  ) {
    throw new Error("Connection request participant IDs must be valid ObjectIds");
  }

  const first = firstUserId.toLowerCase();
  const second = secondUserId.toLowerCase();
  if (first === second) {
    throw new Error("A user cannot send a connection request to themselves");
  }

  return [first, second].sort().join(":");
}

const ConnectionRequestSchema = new Schema<ConnectionRequestRecord>(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pairKey: {
      type: String,
      required: true,
      immutable: true,
    },
    introductoryMessage: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"] satisfies ConnectionRequestStatus[],
      required: true,
      default: "pending",
    },
    activePair: {
      type: Boolean,
      required: true,
      default: true,
    },
    acceptanceInProgress: {
      type: Boolean,
      required: true,
      default: false,
    },
    decidedAt: {
      type: Date,
      default: undefined,
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      default: undefined,
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: undefined,
    },
  },
  { timestamps: true }
);

ConnectionRequestSchema.pre("validate", function () {
  if (!this.requesterId || !this.recipientId) return;

  const requesterId = this.requesterId.toString().toLowerCase();
  const recipientId = this.recipientId.toString().toLowerCase();
  if (requesterId === recipientId) {
    this.invalidate("recipientId", "A user cannot request a connection with themselves");
    return;
  }

  this.pairKey = [requesterId, recipientId].sort().join(":");
  this.activePair = this.status !== "declined";
});

// Only pending requests participate, so declined history does not block a later request.
ConnectionRequestSchema.index(
  { pairKey: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
    name: "unique_pending_connection_request_pair",
  }
);
// Pending and accepted connections both reserve the pair; declined history does not.
ConnectionRequestSchema.index(
  { pairKey: 1 },
  {
    unique: true,
    partialFilterExpression: { activePair: true },
    name: "unique_active_connection_request_pair",
  }
);

ConnectionRequestSchema.index(
  { recipientId: 1, status: 1, createdAt: -1, _id: -1 },
  { name: "connection_request_incoming_by_status" }
);
ConnectionRequestSchema.index(
  { requesterId: 1, status: 1, createdAt: -1, _id: -1 },
  { name: "connection_request_outgoing_by_status" }
);

const ConnectionRequest =
  mongoose.models.ConnectionRequest ||
  mongoose.model<ConnectionRequestRecord>("ConnectionRequest", ConnectionRequestSchema);

export default ConnectionRequest;
