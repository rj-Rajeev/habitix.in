import { Types } from "mongoose";
import { Errors } from "@/lib/api";
import {
  findChatForParticipants,
  findChatsForUser,
} from "@/modules/people-chat/repositories/chat.repository";
import { findPeopleByIds } from "@/modules/people-chat/repositories/people.repository";
import { requireChatAccess, filterAccessibleChatsForUser } from "@/modules/people-chat/services/chat-access.service";
import type { PeopleConversationSummary } from "@/modules/people-chat/types/people-chat";

export async function getExistingChatForPair(currentUserId: string, userId: string) {
  const chat = await findChatForParticipants(currentUserId, userId);
  if (chat) {
    const participants = chat.participants.map((participant: Types.ObjectId) => participant.toString().toLowerCase()).sort();
    const expectedParticipants = [currentUserId, userId].map((id) => id.toLowerCase()).sort();
    if (
      participants.length === 2 &&
      participants[0] === expectedParticipants[0] &&
      participants[1] === expectedParticipants[1]
    ) {
      try {
        return await requireChatAccess(chat._id.toString(), currentUserId);
      } catch (error) {
        if (error instanceof Error && "status" in error && error.status === 403) {
          throw Errors.conflict("This connection is not accepted");
        }
        throw error;
      }
    }
    throw Errors.conflict("This connection is not accepted");
  }

  throw Errors.conflict("A connection request must be accepted before a chat is available");
}

export async function getUserConversations(
  currentUserId: string
): Promise<PeopleConversationSummary[]> {
  const chats = await findChatsForUser(currentUserId);
  const eligibleChats = await filterAccessibleChatsForUser(chats, currentUserId);
  const conversations = eligibleChats
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

export async function getOtherParticipantDisplayName(
  chatId: string,
  currentUserId: string
): Promise<{ displayName: string | null }> {
  const chat = await requireChatAccess(chatId, currentUserId);
  const otherParticipantId = chat.participants.find(
    (participant: Types.ObjectId) => participant.toString() !== currentUserId
  )?.toString();

  if (!otherParticipantId) return { displayName: null };

  const [profile] = await findPeopleByIds([otherParticipantId]);
  return { displayName: profile?.fullname || null };
}
