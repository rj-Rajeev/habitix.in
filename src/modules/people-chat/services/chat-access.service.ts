import { Types } from "mongoose";
import { Errors } from "@/lib/api";
import { findChatParticipants } from "@/modules/people-chat/repositories/chat.repository";
import {
  findConnectionRequestById,
  findConnectionRequestsByChatIds,
  findConnectionRequestsByIds,
} from "@/modules/people-chat/repositories/connection-request.repository";
import { findIntroMessagesForRequests } from "@/modules/people-chat/repositories/message.repository";
import type { ConnectionRequestAccessRecord } from "@/modules/people-chat/types/connection-request";

type ChatRecord = {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  connectionRequestId?: Types.ObjectId | null;
};

type LinkedRequestRecord = ConnectionRequestAccessRecord;
type IntroMessageRecord = {
  _id: Types.ObjectId;
  connectionRequestId?: Types.ObjectId;
  chatId: Types.ObjectId;
  senderId: Types.ObjectId;
  text: string;
};

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

function normalizedId(value: unknown): string | null {
  const stringValue = typeof value === "string"
    ? value
    : value && typeof (value as { toString?: unknown }).toString === "function"
      ? (value as { toString(): string }).toString()
      : "";
  if (!OBJECT_ID_PATTERN.test(stringValue) || !Types.ObjectId.isValid(stringValue)) return null;
  return stringValue.toLowerCase();
}

function sameUnorderedPair(first: string, second: string, participants: string[]) {
  if (participants.length !== 2 || first === second) return false;
  const expected = [first, second].sort();
  const actual = [...participants].sort();
  return expected[0] === actual[0] && expected[1] === actual[1];
}

/** Shared consent and participant rule used by REST and internal Socket.IO authorization. */
export function isEligibleLegacyOrAcceptedChat(
  chat: ChatRecord,
  request: LinkedRequestRecord | null,
  reverseRequests: LinkedRequestRecord[],
  introMessage: IntroMessageRecord | null
): boolean {
  const chatId = normalizedId(chat._id);
  const participants = Array.isArray(chat.participants)
    ? chat.participants.map(normalizedId)
    : [];

  // People conversations are one-to-one for both legacy and request-linked chats.
  if (!chatId || !participants.every((participant): participant is string => Boolean(participant)) || participants.length !== 2) {
    return false;
  }

  if (chat.connectionRequestId === undefined) {
    // Preserve only genuinely legacy chats; a reverse link makes a missing forward link inconsistent.
    return reverseRequests.length === 0;
  }
  if (chat.connectionRequestId === null) return false;

  const requestId = normalizedId(chat.connectionRequestId);
  const linkedRequestId = normalizedId(request?._id);
  const linkedChatId = normalizedId(request?.chatId);
  const messageId = normalizedId(request?.messageId);
  const requesterId = normalizedId(request?.requesterId);
  const recipientId = normalizedId(request?.recipientId);
  const reverseRequestIds = reverseRequests.map((item) => normalizedId(item._id));
  const messageConnectionRequestId = normalizedId(introMessage?.connectionRequestId);

  return Boolean(
    request &&
      request.status === "accepted" &&
      request.activePair === true &&
      request.acceptanceInProgress === false &&
      requestId &&
      linkedRequestId === requestId &&
      reverseRequests.length === 1 &&
      reverseRequestIds[0] === requestId &&
      linkedChatId === chatId &&
      messageId &&
      requesterId &&
      recipientId &&
      sameUnorderedPair(requesterId, recipientId, participants) &&
      introMessage &&
      normalizedId(introMessage._id) === messageId &&
      messageConnectionRequestId === requestId &&
      normalizedId(introMessage.chatId) === chatId &&
      normalizedId(introMessage.senderId) === requesterId &&
      typeof request.introductoryMessage === "string" &&
      typeof introMessage.text === "string" &&
      introMessage.text.trim() === request.introductoryMessage.trim()
  );
}

async function loadIntroMessages(requests: Array<LinkedRequestRecord | null>) {
  const requestIds = [...new Set(
    requests
      .map((request) => normalizedId(request?._id))
      .filter((requestId): requestId is string => requestId !== null)
  )];
  const messages = await findIntroMessagesForRequests(requestIds) as unknown as IntroMessageRecord[];
  const messagesByRequestId = new Map<string, IntroMessageRecord[]>();
  for (const message of messages) {
    const requestId = normalizedId(message.connectionRequestId);
    if (!requestId) continue;
    const grouped = messagesByRequestId.get(requestId) ?? [];
    grouped.push(message);
    messagesByRequestId.set(requestId, grouped);
  }
  return (request: LinkedRequestRecord | null) => {
    const requestId = normalizedId(request?._id);
    const matches = requestId ? messagesByRequestId.get(requestId) ?? [] : [];
    return matches.length === 1 ? matches[0] : null;
  };
}

export async function requireChatAccess(
  chatId: string,
  userId: string,
  maxTimeMs?: number
) {
  const chat = (await findChatParticipants(chatId, maxTimeMs)) as ChatRecord | null;
  if (!chat) throw Errors.notFound("Chat");

  const normalizedUserId = normalizedId(userId);
  const isParticipant = normalizedUserId !== null && Array.isArray(chat.participants) && chat.participants.some(
    (participant) => normalizedId(participant) === normalizedUserId
  );
  if (!isParticipant) throw Errors.forbidden();

  let request: LinkedRequestRecord | null = null;
  if (chat.connectionRequestId !== undefined && chat.connectionRequestId !== null) {
    const requestId = normalizedId(chat.connectionRequestId);
    if (!requestId) throw Errors.forbidden();
    request = await findConnectionRequestById(requestId, maxTimeMs);
  }

  const reverseRequests = await findConnectionRequestsByChatIds([chat._id.toString()]);
  const getIntroMessage = await loadIntroMessages([request, ...reverseRequests]);
  if (!isEligibleLegacyOrAcceptedChat(chat, request, reverseRequests, getIntroMessage(request))) {
    throw Errors.forbidden();
  }
  return chat;
}

export async function filterAccessibleChatsForUser<T extends ChatRecord>(chats: T[], userId: string) {
  const requestIds = chats
    .map((chat) => normalizedId(chat.connectionRequestId))
    .filter((requestId): requestId is string => requestId !== null);
  const chatIds = chats
    .map((chat) => normalizedId(chat._id))
    .filter((chatId): chatId is string => chatId !== null);
  const [requests, reverseRequests] = await Promise.all([
    findConnectionRequestsByIds([...new Set(requestIds)]),
    findConnectionRequestsByChatIds([...new Set(chatIds)]),
  ]);
  const requestsById = new Map(
    requests.map((request) => [normalizedId(request._id), request])
  );
  const reverseRequestsByChatId = new Map<string, LinkedRequestRecord[]>();
  for (const request of reverseRequests) {
    const linkedChatId = normalizedId(request.chatId);
    if (!linkedChatId) continue;
    const grouped = reverseRequestsByChatId.get(linkedChatId) ?? [];
    grouped.push(request);
    reverseRequestsByChatId.set(linkedChatId, grouped);
  }

  const getIntroMessage = await loadIntroMessages([...requests, ...reverseRequests]);
  const normalizedUserId = normalizedId(userId);

  return chats.filter((chat) => {
    const isParticipant = normalizedUserId !== null && Array.isArray(chat.participants) && chat.participants.some(
      (participant) => normalizedId(participant) === normalizedUserId
    );
    if (!isParticipant) return false;

    const requestId = normalizedId(chat.connectionRequestId);
    const request = requestId ? requestsById.get(requestId) ?? null : null;
    const chatId = normalizedId(chat._id);
    const linkedRequests = chatId ? reverseRequestsByChatId.get(chatId) ?? [] : [];
    return isEligibleLegacyOrAcceptedChat(
      chat,
      request,
      linkedRequests,
      getIntroMessage(request)
    );
  });
}
