import type { Types } from "mongoose";

export type ConnectionRequestStatus = "pending" | "accepted" | "declined";
export type ConnectionRequestDirection = "incoming" | "outgoing";

export interface CreateConnectionRequestInput {
  requesterId: string;
  recipientId: string;
  introductoryMessage: string;
}

export type CreateConnectionRequestResult =
  | { kind: "created"; request: ConnectionRequestRecord }
  | { kind: "conflict" };

export interface ConnectionRequestRecord {
  _id: Types.ObjectId;
  requesterId: Types.ObjectId;
  recipientId: Types.ObjectId;
  pairKey: string;
  introductoryMessage: string;
  status: ConnectionRequestStatus;
  activePair: boolean;
  acceptanceInProgress: boolean;
  decidedAt?: Date;
  chatId?: Types.ObjectId;
  messageId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ConnectionRequestAccessRecord = Pick<
  ConnectionRequestRecord,
  | "_id"
  | "status"
  | "requesterId"
  | "recipientId"
  | "chatId"
  | "messageId"
  | "activePair"
  | "acceptanceInProgress"
  | "introductoryMessage"
>;

export interface ConnectionRequestDto {
  requestId: string;
  status: ConnectionRequestStatus;
  introductoryMessage: string;
  createdAt: string;
  decidedAt: string | null;
  requester: { userId: string; displayName: string | null };
  recipient: { userId: string; displayName: string | null };
}

export interface AcceptedConnectionRequestResult {
  requestId: string;
  status: "accepted";
  chatId: string;
  messageId: string;
}

export interface DeclinedConnectionRequestResult {
  requestId: string;
  status: "declined";
  decidedAt: string;
}
