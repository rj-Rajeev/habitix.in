import Chat from "@/modules/people-chat/models/chat.model";

export function findChatForParticipants(currentUserId: string, userId: string) {
  return Chat.findOne({
    participants: { $all: [currentUserId, userId] },
  });
}

export function findChatsForUser(userId: string) {
  return Chat.find({ participants: userId })
    .select("participants createdAt")
    .sort({ createdAt: -1, _id: -1 });
}

export function createChatForParticipants(currentUserId: string, userId: string) {
  return Chat.create({
    participants: [currentUserId, userId],
  });
}

export function findChatParticipants(chatId: string) {
  return Chat.findById(chatId).select("participants");
}
