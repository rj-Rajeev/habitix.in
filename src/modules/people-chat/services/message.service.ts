import { requireChatParticipant } from "@/modules/people-chat/services/chat.service";
import {
  createChatMessage,
  findMessagesForChat,
} from "@/modules/people-chat/repositories/message.repository";
import type { CreatePeopleChatMessage } from "@/modules/people-chat/types/people-chat";

export async function getChatHistory(chatId: string, userId: string) {
  await requireChatParticipant(chatId, userId);
  return findMessagesForChat(chatId);
}

export async function sendChatMessage(message: CreatePeopleChatMessage) {
  await requireChatParticipant(message.chatId, message.senderId);
  return createChatMessage(message);
}
