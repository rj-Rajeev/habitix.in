import Chat from "@/modules/people-chat/models/chat.model";

export function findChatForParticipants(currentUserId: string, userId: string) {
  return Chat.findOne({
    participants: { $all: [currentUserId, userId] },
  }).sort({ _id: 1 });
}

export function findChatByConnectionRequestId(connectionRequestId: string) {
  return Chat.findOne({ connectionRequestId });
}

export async function createOrFindChatForConnectionRequest({
  connectionRequestId,
  requesterId,
  recipientId,
}: {
  connectionRequestId: string;
  requesterId: string;
  recipientId: string;
}) {
  try {
    return await Chat.findOneAndUpdate(
      { connectionRequestId },
      {
        $setOnInsert: {
          connectionRequestId,
          participants: [requesterId, recipientId],
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).exec();
  } catch (error) {
    const databaseError = error as { code?: unknown };
    if (databaseError?.code !== 11000) throw error;
    const existingChat = await findChatByConnectionRequestId(connectionRequestId);
    if (!existingChat) throw error;
    return existingChat;
  }
}

export function findChatsForUser(userId: string) {
  return Chat.find({ participants: userId })
    .select("participants createdAt connectionRequestId")
    .sort({ createdAt: -1, _id: -1 });
}

export function createChatForParticipants(currentUserId: string, userId: string) {
  return Chat.create({
    participants: [currentUserId, userId],
  });
}

export function findChatParticipants(chatId: string, maxTimeMs?: number) {
  const query = Chat.findById(chatId).select("participants connectionRequestId");
  return maxTimeMs ? query.maxTimeMS(maxTimeMs) : query;
}
