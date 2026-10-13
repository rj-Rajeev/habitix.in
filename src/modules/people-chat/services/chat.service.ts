import { Types } from "mongoose";
import { Errors } from "@/lib/api";
import {
  createChatForParticipants,
  findChatForParticipants,
  findChatsForUser,
  findChatParticipants,
} from "@/modules/people-chat/repositories/chat.repository";
import { findPeopleByIds } from "@/modules/people-chat/repositories/people.repository";
import type { PeopleConversationSummary } from "@/modules/people-chat/types/people-chat";

export async function getOrCreateChat(currentUserId: string, userId: string) {
  let chat = await findChatForParticipants(currentUserId, userId);

  if (!chat) {
    chat = await createChatForParticipants(currentUserId, userId);
  }

  return chat;
}

export async function getUserConversations(
  currentUserId: string
): Promise<PeopleConversationSummary[]> {
  const chats = await findChatsForUser(currentUserId);
  const conversations = chats
    .map((chat) => ({
      chat,
      participantId: chat.participants
        .find((participant: Types.ObjectId) => participant.toString() !== currentUserId)
        ?.toString(),
    }))
    .filter(
      (conversation): conversation is typeof conversation & { participantId: string } =>
        Boolean(conversation.participantId)
    );

  const participantIds = [...new Set(conversations.map(({ participantId }) => participantId))];
  const profiles = participantIds.length ? await findPeopleByIds(participantIds) : [];
  const displayNames = new Map(
    profiles.map((profile) => [profile._id.toString(), profile.fullname || null])
  );

  const summaries = conversations.map(({ chat, participantId }) => ({
    chatId: chat._id.toString(),
    participant: {
      userId: participantId,
      displayName: displayNames.get(participantId) ?? null,
    },
  }));

  // The repository orders newest first. Keep that ordering while hiding duplicate
  // records for the same participant pair and guarding against repeated chat IDs.
  const seenChatIds = new Set<string>();
  const seenParticipantIds = new Set<string>();
  return summaries.filter(({ chatId, participant }) => {
    if (seenChatIds.has(chatId) || seenParticipantIds.has(participant.userId)) {
      return false;
    }
    seenChatIds.add(chatId);
    seenParticipantIds.add(participant.userId);
    return true;
  });
}

export async function requireChatParticipant(chatId: string, userId: string) {
  const chat = await findChatParticipants(chatId);
  if (!chat) throw Errors.notFound("Chat");
  const isParticipant = chat.participants.some(
    (participant: Types.ObjectId) => participant.toString() === userId
  );
  if (!isParticipant) throw Errors.forbidden();

  return chat;
}
