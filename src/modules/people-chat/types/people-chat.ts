export interface CreatePeopleChatMessage {
  chatId: string;
  senderId: string;
  text: string;
}

export interface PeopleConversationSummary {
  chatId: string;
  participant: {
    userId: string;
    displayName: string | null;
  };
}
