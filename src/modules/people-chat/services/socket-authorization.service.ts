import { Types } from "mongoose";
import { Errors } from "@/lib/api";
import { requireChatAccess } from "@/modules/people-chat/services/chat-access.service";
import { findMessageForSocketDelivery } from "@/modules/people-chat/repositories/message.repository";

export type SocketChatAction = "sendMessage" | "typing";

export async function authorizeSocketChatAction({
  action,
  chatId,
  userId,
  messageId,
  text,
}: {
  action: SocketChatAction;
  chatId: string;
  userId: string;
  messageId?: string;
  text?: string;
}) {
  const chat = await requireChatAccess(chatId, userId, 3000);
  if (chat.participants.length !== 2) {
    throw Errors.forbidden();
  }

  const senderId = userId.toLowerCase();
  const recipient = chat.participants.find(
    (participant: Types.ObjectId) => participant.toString().toLowerCase() !== senderId
  );
  if (!recipient || !Types.ObjectId.isValid(recipient.toString())) {
    throw Errors.forbidden();
  }

  const authorization = {
    authorized: true as const,
    action,
    chatId: chat._id.toString().toLowerCase(),
    senderId,
    recipientId: recipient.toString().toLowerCase(),
  };

  if (action === "typing") return authorization;
  if (!messageId || !Types.ObjectId.isValid(messageId) || typeof text !== "string") {
    throw Errors.forbidden();
  }

  const persistedMessage = await findMessageForSocketDelivery(
    messageId,
    chatId,
    userId
  );
  if (!persistedMessage || persistedMessage.text !== text) throw Errors.forbidden();

  return {
    ...authorization,
    messageId: persistedMessage._id.toString().toLowerCase(),
    textMatches: true as const,
  };
}
