import Message from "@/modules/people-chat/models/message.model";
import type { CreatePeopleChatMessage } from "@/modules/people-chat/types/people-chat";

export function findMessagesForChat(chatId: string) {
  return Message.find({ chatId }).sort({ createdAt: 1 });
}

export function createChatMessage(message: CreatePeopleChatMessage) {
  return Message.create(message);
}

export function createOrFindConnectionRequestIntroMessage({
  connectionRequestId,
  chatId,
  senderId,
  text,
}: {
  connectionRequestId: string;
  chatId: string;
  senderId: string;
  text: string;
}) {
  return Message.findOneAndUpdate(
      { connectionRequestId },
      {
        $setOnInsert: { connectionRequestId, chatId, senderId, text },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )
    .exec()
    .catch(async (error: unknown) => {
      const databaseError = error as { code?: unknown };
      if (databaseError?.code !== 11000) throw error;
      const existingMessage = await Message.findOne({ connectionRequestId }).exec();
      if (!existingMessage) throw error;
      return existingMessage;
    });
}

export function findMessageForSocketDelivery(
  messageId: string,
  chatId: string,
  senderId: string
) {
  return Message.findOne({ _id: messageId, chatId, senderId })
    .select("_id chatId senderId text")
    .maxTimeMS(3000);
}

export function findIntroMessagesForRequests(connectionRequestIds: string[]) {
  if (!connectionRequestIds.length) return Promise.resolve([]);
  return Message.find({ connectionRequestId: { $in: connectionRequestIds } })
    .select("_id connectionRequestId chatId senderId text")
    .lean()
    .exec();
}
