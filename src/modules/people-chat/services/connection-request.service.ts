import { Types } from "mongoose";
import { Errors } from "@/lib/api";
import {
  createOrFindChatForConnectionRequest,
  findChatForParticipants,
} from "@/modules/people-chat/repositories/chat.repository";
import {
  beginConnectionRequestAcceptance,
  completeConnectionRequestAcceptance,
  createPendingConnectionRequest,
  declinePendingConnectionRequest,
  findAcceptedConnectionRequestForPair,
  findConnectionRequestById,
  listConnectionRequests,
  assertConnectionRequestIndexes,
} from "@/modules/people-chat/repositories/connection-request.repository";
import { findPeopleByIds, findPersonById } from "@/modules/people-chat/repositories/people.repository";
import { createOrFindConnectionRequestIntroMessage } from "@/modules/people-chat/repositories/message.repository";
import type {
  AcceptedConnectionRequestResult,
  ConnectionRequestDirection,
  ConnectionRequestDto,
  DeclinedConnectionRequestResult,
} from "@/modules/people-chat/types/connection-request";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

function isObjectId(value: string): boolean {
  return OBJECT_ID_PATTERN.test(value) && Types.ObjectId.isValid(value);
}

function acceptedResult(request: {
  _id: Types.ObjectId;
  status: string;
  chatId?: Types.ObjectId;
  messageId?: Types.ObjectId;
}): AcceptedConnectionRequestResult {
  if (request.status !== "accepted" || !request.chatId || !request.messageId) {
    throw Errors.internal("Accepted connection request is missing its conversation links");
  }
  return {
    requestId: request._id.toString(),
    status: "accepted",
    chatId: request.chatId.toString(),
    messageId: request.messageId.toString(),
  };
}

export async function createConnectionRequest(
  requesterId: string,
  recipientId: string,
  introductoryMessage: string
) {
  if (!isObjectId(requesterId) || !isObjectId(recipientId)) {
    throw Errors.badRequest("Invalid user ID");
  }
  if (requesterId.toLowerCase() === recipientId.toLowerCase()) {
    throw Errors.badRequest("You cannot send a connection request to yourself");
  }

  const recipient = await findPersonById(recipientId);
  if (!recipient) throw Errors.notFound("Recipient");

  const [existingChat, acceptedRequest] = await Promise.all([
    findChatForParticipants(requesterId, recipientId),
    findAcceptedConnectionRequestForPair(requesterId, recipientId),
  ]);
  if (existingChat || acceptedRequest) {
    throw Errors.conflict("A conversation already exists for this pair");
  }

  const result = await createPendingConnectionRequest({
    requesterId,
    recipientId,
    introductoryMessage,
  });
  if (result.kind === "conflict") {
    throw Errors.conflict("A pending or accepted connection already exists for this pair");
  }

  return {
    requestId: result.request._id.toString(),
    status: result.request.status,
    createdAt: result.request.createdAt.toISOString(),
  };
}

export async function getConnectionRequestsForUser(
  userId: string,
  direction: ConnectionRequestDirection
): Promise<ConnectionRequestDto[]> {
  const requests = await listConnectionRequests(userId, direction);
  if (!requests.length) return [];

  const participantIds = [
    ...new Set(
      requests.flatMap((request) => [
        request.requesterId.toString(),
        request.recipientId.toString(),
      ])
    ),
  ];
  const profiles = await findPeopleByIds(participantIds);
  const namesById = new Map(
    profiles.map((profile) => [profile._id.toString(), profile.fullname || null])
  );

  return requests.map((request) => {
    const requesterId = request.requesterId.toString();
    const recipientId = request.recipientId.toString();
    return {
      requestId: request._id.toString(),
      status: request.status,
      introductoryMessage: request.introductoryMessage,
      createdAt: request.createdAt.toISOString(),
      decidedAt: request.decidedAt?.toISOString() ?? null,
      requester: {
        userId: requesterId,
        displayName: namesById.get(requesterId) ?? null,
      },
      recipient: {
        userId: recipientId,
        displayName: namesById.get(recipientId) ?? null,
      },
    };
  });
}

export async function acceptConnectionRequest(
  requestId: string,
  recipientId: string
): Promise<AcceptedConnectionRequestResult> {
  if (!isObjectId(requestId)) throw Errors.badRequest("Invalid request ID");
  await assertConnectionRequestIndexes();

  let request = await findConnectionRequestById(requestId);
  if (!request) throw Errors.notFound("Connection request");
  if (request.recipientId.toString() !== recipientId.toLowerCase()) {
    throw Errors.forbidden();
  }
  if (request.status === "accepted") return acceptedResult(request);
  if (request.status === "declined") {
    throw Errors.conflict("A declined connection request cannot be accepted");
  }

  request = await beginConnectionRequestAcceptance(requestId, recipientId);
  if (!request) throw Errors.notFound("Connection request");
  if (request.recipientId.toString() !== recipientId.toLowerCase()) {
    throw Errors.forbidden();
  }
  if (request.status === "accepted") return acceptedResult(request);
  if (request.status !== "pending" || !request.acceptanceInProgress) {
    throw Errors.conflict("The connection request can no longer be accepted");
  }

  const chat = await createOrFindChatForConnectionRequest({
    connectionRequestId: request._id.toString(),
    requesterId: request.requesterId.toString(),
    recipientId: request.recipientId.toString(),
  });
  if (!chat) throw Errors.internal("The conversation could not be created");
  const participants = chat.participants
    .map((participant: Types.ObjectId) => participant.toString().toLowerCase())
    .sort();
  const expectedParticipants = [
    request.requesterId.toString().toLowerCase(),
    request.recipientId.toString().toLowerCase(),
  ].sort();
  if (
    participants.length !== 2 ||
    participants[0] !== expectedParticipants[0] ||
    participants[1] !== expectedParticipants[1]
  ) {
    throw Errors.internal("The conversation participants do not match the request");
  }

  const message = await createOrFindConnectionRequestIntroMessage({
    connectionRequestId: request._id.toString(),
    chatId: chat._id.toString(),
    senderId: request.requesterId.toString(),
    text: request.introductoryMessage,
  });
  if (
    message.chatId.toString() !== chat._id.toString() ||
    message.senderId.toString() !== request.requesterId.toString() ||
    message.text !== request.introductoryMessage
  ) {
    throw Errors.internal("The introductory message link is inconsistent");
  }

  const completed = await completeConnectionRequestAcceptance(
    request._id.toString(),
    recipientId,
    chat._id.toString(),
    message._id.toString()
  );
  if (completed) return acceptedResult(completed);

  const current = await findConnectionRequestById(request._id.toString());
  if (
    current?.status === "accepted" &&
    current.chatId?.toString() === chat._id.toString() &&
    current.messageId?.toString() === message._id.toString()
  ) {
    return acceptedResult(current);
  }
  throw Errors.conflict("The connection request changed while it was being accepted");
}

export async function declineConnectionRequest(
  requestId: string,
  recipientId: string
): Promise<DeclinedConnectionRequestResult> {
  if (!isObjectId(requestId)) throw Errors.badRequest("Invalid request ID");
  let request = await findConnectionRequestById(requestId);
  if (!request) throw Errors.notFound("Connection request");
  if (request.recipientId.toString() !== recipientId.toLowerCase()) {
    throw Errors.forbidden();
  }
  if (request.status === "declined") {
    return {
      requestId: request._id.toString(),
      status: "declined",
      decidedAt: request.decidedAt?.toISOString() ?? request.updatedAt.toISOString(),
    };
  }
  if (request.status === "accepted") {
    throw Errors.conflict("An accepted connection request cannot be declined");
  }

  request = await declinePendingConnectionRequest(requestId, recipientId);
  if (!request) {
    const current = await findConnectionRequestById(requestId);
    if (!current) throw Errors.notFound("Connection request");
    if (current.recipientId.toString() !== recipientId.toLowerCase()) {
      throw Errors.forbidden();
    }
    if (current.status === "declined") request = current;
    else throw Errors.conflict("The connection request is being accepted or has changed");
  }

  return {
    requestId: request._id.toString(),
    status: "declined",
    decidedAt: request.decidedAt?.toISOString() ?? request.updatedAt.toISOString(),
  };
}
