import Message from "@/modules/people-chat/models/message.model";
import type { CreatePeopleChatMessage } from "@/modules/people-chat/types/people-chat";

export function findMessagesForChat(chatId: string) {
  return Message.find({ chatId }).sort({ createdAt: 1 });
}

export function createChatMessage(message: CreatePeopleChatMessage) {
  return Message.create(message);
}
