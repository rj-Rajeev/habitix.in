import { Types } from "mongoose";
import { Errors } from "@/lib/api";
import Chat from "@/modules/people-chat/models/chat.model";
import ConnectionRequest, {
  getConnectionRequestPairKey,
} from "@/modules/people-chat/models/connection-request.model";
import Message from "@/modules/people-chat/models/message.model";
import type {
  ConnectionRequestDirection,
  ConnectionRequestAccessRecord,
  ConnectionRequestRecord,
  CreateConnectionRequestInput,
  CreateConnectionRequestResult,
} from "@/modules/people-chat/types/connection-request";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const PENDING_PAIR_INDEX = "unique_pending_connection_request_pair";
const ACTIVE_PAIR_INDEX = "unique_active_connection_request_pair";
const CHAT_REQUEST_INDEX = "unique_chat_connection_request";
const INTRO_MESSAGE_INDEX = "unique_intro_message_connection_request";

type IndexDescription = {
  name?: string;
  key: Record<string, unknown>;
  unique?: boolean;
  sparse?: boolean;
  partialFilterExpression?: Record<string, unknown>;
};

function hasUniquePartialPairIndex(
  indexes: IndexDescription[],
  name: string,
  partialField: "status" | "activePair",
  partialValue: string | boolean
) {
  const expectedFilter = { [partialField]: partialValue };
  return indexes.some(
    (index) =>
      index.name === name &&
      index.unique === true &&
      index.key.pairKey === 1 &&
      Object.keys(index.key).length === 1 &&
      JSON.stringify(normalizeIndexDocument(index.partialFilterExpression)) ===
        JSON.stringify(normalizeIndexDocument(expectedFilter)) &&
      index.sparse !== true
  );
}

function normalizeIndexDocument(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeIndexDocument);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => [key, normalizeIndexDocument(nestedValue)])
  );
}

function hasUniqueSparseRequestIndex(indexes: IndexDescription[], name: string) {
  return indexes.some(
    (index) =>
      index.name === name &&
      index.unique === true &&
      index.sparse === true &&
      index.key.connectionRequestId === 1 &&
      Object.keys(index.key).length === 1 &&
      index.partialFilterExpression === undefined
  );
}

/** Fail closed until the required database-enforced race/idempotency indexes exist. */
export async function assertConnectionRequestIndexes(): Promise<void> {
  try {
    const [requestIndexes, chatIndexes, messageIndexes] = await Promise.all([
      ConnectionRequest.collection.listIndexes().toArray(),
      Chat.collection.listIndexes().toArray(),
      Message.collection.listIndexes().toArray(),
    ]);

    if (
      !hasUniquePartialPairIndex(requestIndexes, PENDING_PAIR_INDEX, "status", "pending") ||
      !hasUniquePartialPairIndex(requestIndexes, ACTIVE_PAIR_INDEX, "activePair", true) ||
      !hasUniqueSparseRequestIndex(chatIndexes, CHAT_REQUEST_INDEX) ||
      !hasUniqueSparseRequestIndex(messageIndexes, INTRO_MESSAGE_INDEX)
    ) {
      throw Errors.internal("Connection-request indexes are not deployed");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Connection-request indexes are not deployed") {
      throw error;
    }
    throw Errors.internal("Connection-request indexes are not available");
  }
}

function normalizeObjectId(value: string, fieldName: string): string {
  if (!OBJECT_ID_PATTERN.test(value) || !Types.ObjectId.isValid(value)) {
    throw Errors.badRequest(`${fieldName} must be a valid ID`);
  }
  return value.toLowerCase();
}

function isPairDuplicate(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const databaseError = error as {
    code?: unknown;
    keyPattern?: Record<string, unknown>;
    message?: unknown;
  };
  return (
    databaseError.code === 11000 &&
    (databaseError.keyPattern?.pairKey === 1 ||
      (typeof databaseError.message === "string" &&
        (databaseError.message.includes(PENDING_PAIR_INDEX) ||
          databaseError.message.includes(ACTIVE_PAIR_INDEX))))
  );
}

export async function createPendingConnectionRequest(
  input: CreateConnectionRequestInput
): Promise<CreateConnectionRequestResult> {
  await assertConnectionRequestIndexes();
  const requesterId = normalizeObjectId(input.requesterId, "requesterId");
  const recipientId = normalizeObjectId(input.recipientId, "recipientId");
  const pairKey = getConnectionRequestPairKey(requesterId, recipientId);
  if (typeof input.introductoryMessage !== "string") {
    throw Errors.badRequest("Introductory message must be a string");
  }
  const introductoryMessage = input.introductoryMessage.trim();

  if (!introductoryMessage || introductoryMessage.length > 500) {
    throw Errors.badRequest("Introductory message must be between 1 and 500 characters");
  }

  try {
    const request = await ConnectionRequest.create({
      requesterId,
      recipientId,
      pairKey,
      introductoryMessage,
      status: "pending",
      activePair: true,
    });
    return { kind: "created", request: request.toObject() as ConnectionRequestRecord };
  } catch (error) {
    if (isPairDuplicate(error)) return { kind: "conflict" };
    throw error;
  }
}

export function findConnectionRequestById(
  requestId: string,
  maxTimeMs?: number
): Promise<ConnectionRequestRecord | null> {
  const query = ConnectionRequest.findById(normalizeObjectId(requestId, "requestId"));
  return (maxTimeMs ? query.maxTimeMS(maxTimeMs) : query).exec();
}

export function listConnectionRequests(
  userId: string,
  direction: ConnectionRequestDirection
): Promise<ConnectionRequestRecord[]> {
  const normalizedUserId = normalizeObjectId(userId, "userId");
  const ownerField = direction === "incoming" ? "recipientId" : "requesterId";

  return ConnectionRequest.find({ [ownerField]: normalizedUserId })
    .sort({ createdAt: -1, _id: -1 })
    .exec();
}

export function findPendingConnectionRequestForPair(
  firstUserId: string,
  secondUserId: string
): Promise<ConnectionRequestRecord | null> {
  const pairKey = getConnectionRequestPairKey(firstUserId, secondUserId);
  return ConnectionRequest.findOne({ pairKey, status: "pending" }).exec();
}

export function findAcceptedConnectionRequestForPair(
  firstUserId: string,
  secondUserId: string
): Promise<ConnectionRequestRecord | null> {
  const pairKey = getConnectionRequestPairKey(firstUserId, secondUserId);
  return ConnectionRequest.findOne({ pairKey, status: "accepted" }).exec();
}

export function findConnectionRequestsByIds(
  requestIds: string[]
): Promise<ConnectionRequestAccessRecord[]> {
  if (!requestIds.length) return Promise.resolve([]);
  return ConnectionRequest.find({ _id: { $in: requestIds } })
    .select("_id status requesterId recipientId chatId messageId activePair acceptanceInProgress introductoryMessage")
    .lean()
    .exec() as unknown as Promise<ConnectionRequestAccessRecord[]>;
}

export function findConnectionRequestsByChatIds(
  chatIds: string[]
): Promise<ConnectionRequestAccessRecord[]> {
  if (!chatIds.length) return Promise.resolve([]);
  return ConnectionRequest.find({ chatId: { $in: chatIds } })
    .select("_id status requesterId recipientId chatId messageId activePair acceptanceInProgress introductoryMessage")
    .lean()
    .exec() as unknown as Promise<ConnectionRequestAccessRecord[]>;
}

export async function beginConnectionRequestAcceptance(
  requestId: string,
  recipientId: string
) {
  const normalizedRequestId = normalizeObjectId(requestId, "requestId");
  const normalizedRecipientId = normalizeObjectId(recipientId, "recipientId");
  await ConnectionRequest.updateOne(
    {
      _id: normalizedRequestId,
      recipientId: normalizedRecipientId,
      status: "pending",
      acceptanceInProgress: { $ne: true },
    },
    { $set: { acceptanceInProgress: true } }
  ).exec();
  return findConnectionRequestById(normalizedRequestId);
}

export function completeConnectionRequestAcceptance(
  requestId: string,
  recipientId: string,
  chatId: string,
  messageId: string
) {
  return ConnectionRequest.findOneAndUpdate(
    {
      _id: normalizeObjectId(requestId, "requestId"),
      recipientId: normalizeObjectId(recipientId, "recipientId"),
      status: "pending",
      acceptanceInProgress: true,
    },
    {
      $set: {
        status: "accepted",
        activePair: true,
        acceptanceInProgress: false,
        decidedAt: new Date(),
        chatId: normalizeObjectId(chatId, "chatId"),
        messageId: normalizeObjectId(messageId, "messageId"),
      },
    },
    { new: true, runValidators: true }
  ).exec();
}

export function declinePendingConnectionRequest(
  requestId: string,
  recipientId: string
) {
  return ConnectionRequest.findOneAndUpdate(
    {
      _id: normalizeObjectId(requestId, "requestId"),
      recipientId: normalizeObjectId(recipientId, "recipientId"),
      status: "pending",
      acceptanceInProgress: { $ne: true },
    },
    {
      $set: {
        status: "declined",
        activePair: false,
        acceptanceInProgress: false,
        decidedAt: new Date(),
      },
    },
    { new: true, runValidators: true }
  ).exec();
}
