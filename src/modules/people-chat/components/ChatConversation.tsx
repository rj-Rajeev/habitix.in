"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Send } from "lucide-react";
import type { Socket } from "socket.io-client";
import { Alert, Button, Card, EmptyState, Skeleton } from "@/components/ui";
import ConversationSidebar from "@/modules/people-chat/components/ConversationSidebar";
import PeopleChatHeader from "@/modules/people-chat/components/PeopleChatHeader";
import { createPeopleChatSocket } from "@/modules/people-chat/integrations/socket-client";

type ChatMessage = {
  _id: string | number;
  text: string;
  senderId?: string;
  chatId?: string;
};
type ChatParticipant = { displayName: string | null };

function appendMessageOnce(current: ChatMessage[], message: ChatMessage) {
  if (current.some((existing) => String(existing._id) === String(message._id))) {
    return current;
  }
  return [...current, message];
}

function uniqueMessages(messages: ChatMessage[]) {
  return messages.reduce<ChatMessage[]>(appendMessageOnce, []);
}

export default function ChatConversation() {
  const params = useParams();
  const rawUserId = params.userId;
  const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [chatId, setChatId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [otherUser, setOtherUser] = useState<ChatParticipant | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [participantError, setParticipantError] = useState(false);
  const [sendError, setSendError] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [socketError, setSocketError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [activeConversationUserId, setActiveConversationUserId] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendingRef = useRef(false);
  const bottomRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!chatId) return;
    let active = true;
    setOtherUser(null);
    setParticipantError(false);

    fetch(`/api/chats/${chatId}/participant`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data?.error) throw new Error("Participant unavailable");
        return data as ChatParticipant;
      })
      .then((user) => {
        if (active) {
          setOtherUser(user);
          setParticipantError(false);
        }
      })
      .catch(() => {
        if (active) setParticipantError(true);
      });

    return () => {
      active = false;
    };
  }, [chatId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setLoadError("This conversation could not be opened.");
      return;
    }

    let active = true;
    const init = async () => {
      setLoading(true);
      setLoadError("");
      setChatId("");
      setMessages([]);
      setActiveConversationUserId("");
      setIsTyping(false);

      try {
        const response = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const chatData = await response.json();
        if (!response.ok || typeof chatData?.chatId !== "string") {
          throw new Error("Conversation unavailable");
        }

        if (active) {
          setChatId(chatData.chatId);
          setActiveConversationUserId(typeof userId === "string" ? userId : "");
        }

        const historyResponse = await fetch(`/api/chats/${chatData.chatId}`);
        const history = await historyResponse.json();
        if (!historyResponse.ok || !Array.isArray(history)) {
          throw new Error("Message history unavailable");
        }

        if (active) setMessages(uniqueMessages(history));
      } catch {
        if (active) setLoadError("This conversation could not be loaded. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void init();
    return () => {
      active = false;
    };
  }, [userId, retryCount]);

  useEffect(() => {
    if (
      !currentUserId ||
      !userId ||
      !chatId ||
      activeConversationUserId !== userId ||
      loading ||
      loadError
    ) {
      return;
    }

    let active = true;
    let connection: Awaited<ReturnType<typeof createPeopleChatSocket>> | null = null;
    setSocketError("");

    void createPeopleChatSocket()
      .then((createdConnection) => {
        if (!active) {
          createdConnection.disconnect();
          return;
        }

        connection = createdConnection;
        const socket = createdConnection.socket;
        socketRef.current = socket;

        const refreshHistory = async () => {
          try {
            const response = await fetch(`/api/chats/${chatId}`);
            const history = await response.json();
            if (active && response.ok && Array.isArray(history)) {
              setMessages((previous) => uniqueMessages([...history, ...previous]));
            }
          } catch {
            // Existing message history remains visible if a live refresh fails.
          }
        };

        socket.on("connect", () => {
          if (active) setSocketError("");
          void refreshHistory();
        });
        socket.on("connect_error", () => {
          if (active) {
            setSocketError("Live chat is unavailable. Messages can still be saved.");
          }
        });
        socket.on(
          "receiveMessage",
          (message: Partial<ChatMessage> & { messageId?: string }) => {
            if (
              !active ||
              message.chatId !== chatId ||
              typeof message.messageId !== "string" ||
              !/^[a-f\d]{24}$/i.test(message.messageId) ||
              typeof message.text !== "string" ||
              typeof message.senderId !== "string"
            ) {
              return;
            }

            const receivedMessage: ChatMessage = {
              _id: message.messageId.toLowerCase(),
              chatId,
              text: message.text,
              senderId: message.senderId,
            };
            setMessages((previous) => appendMessageOnce(previous, receivedMessage));
          }
        );

        socket.on("typing", ({ senderId }: { senderId?: string }) => {
          if (!active || senderId?.toString() !== userId.toString()) return;

          setIsTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
        });

        createdConnection.connect();
      })
      .catch(() => {
        if (active) {
          setSocketError("Live chat is unavailable. Messages can still be saved.");
        }
      });

    return () => {
      active = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (socketRef.current === connection?.socket) socketRef.current = null;
      connection?.disconnect();
    };
  }, [
    activeConversationUserId,
    chatId,
    currentUserId,
    loadError,
    loading,
    userId,
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !chatId || loading || loadError || sendingRef.current) return;

    const messageText = text;
    sendingRef.current = true;
    setSending(true);
    setSendError("");
    setDeliveryStatus("");
    setText("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId, text: messageText }),
      });
      const persistedMessage = await response.json();
      if (
        !response.ok ||
        !persistedMessage ||
        typeof persistedMessage._id !== "string" ||
        typeof persistedMessage.text !== "string"
      ) {
        throw new Error("Message persistence failed");
      }

      const savedMessage: ChatMessage = {
        _id: persistedMessage._id,
        chatId,
        text: persistedMessage.text,
        senderId:
          typeof persistedMessage.senderId === "string"
            ? persistedMessage.senderId
            : currentUserId,
      };
      setMessages((previous) => appendMessageOnce(previous, savedMessage));

      const socket = socketRef.current;
      if (socket?.connected) {
        socket.volatile.timeout(5000).emit("sendMessage", {
          chatId,
          messageId: savedMessage._id,
          text: savedMessage.text,
        }, (error: Error | null, acknowledgement?: unknown) => {
          if (error || !acknowledgement || typeof acknowledgement !== "object") {
            setDeliveryStatus("Message saved, but live delivery could not be confirmed.");
            return;
          }

          const status = (acknowledgement as { status?: unknown }).status;
          if (status === "emitted") {
            setDeliveryStatus("");
          } else if (status === "authorization_denied" || status === "authorization_unavailable") {
            setDeliveryStatus("Message saved, but live delivery could not be completed.");
          } else if (status === "invalid_message") {
            setDeliveryStatus("Message saved, but its live update could not be sent.");
          } else if (status === "emission_failed") {
            setDeliveryStatus("Message saved, but its live update could not be completed.");
          } else {
            setDeliveryStatus("Message saved, but live delivery could not be confirmed.");
          }
        });
      } else {
        setDeliveryStatus("Message saved. Live updates may be delayed while chat is disconnected.");
      }
    } catch {
      setSendError("The message could not be sent. Please check your connection.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const handleTyping = (value: string) => {
    setText(value);
    setSendError("");

    if (chatId && !loading && !loadError && socketRef.current?.connected) {
      socketRef.current.emit("typing", { chatId });
    }
  };

  const participantName = otherUser?.displayName || "Conversation";
  const participantInitial = participantName.trim().charAt(0).toUpperCase() || "P";

  return (
    <main className="min-h-[100dvh] bg-background text-text-primary">
      <PeopleChatHeader />
      <div className="mx-auto max-w-6xl lg:px-4 lg:pt-4">
        <div className="grid h-[calc(100dvh-3.5rem)] grid-cols-1 lg:h-[calc(100dvh-4.5rem)] lg:grid-cols-[20rem_minmax(0,1fr)] lg:overflow-hidden lg:rounded-container lg:border lg:border-border lg:shadow-[var(--shadow-md)]">
          <ConversationSidebar
            activeUserId={typeof userId === "string" ? userId : undefined}
            refreshKey={chatId}
            className="hidden border-r border-border lg:flex lg:h-full"
          />
          <section className="mx-auto flex h-full min-w-0 w-full max-w-4xl flex-col overflow-hidden bg-surface lg:max-w-none">
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-3 py-3 sm:px-5">
          <Link
            href="/people"
            aria-label="Back to conversations"
            className="ui-button shrink-0 px-3 text-text-secondary"
            data-variant="ghost"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            <span>Back to chats</span>
          </Link>

          <div
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary-soft font-semibold text-brand-primary"
          >
            {participantInitial}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-semibold text-text-primary">{participantName}</h1>
            <div className="flex h-5 items-center text-xs text-text-muted" aria-live="polite">
              {isTyping ? (
                <span className="flex gap-1" aria-label="Typing">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted" />
                </span>
              ) : participantError ? (
                "Participant details unavailable"
              ) : (
                "People"
              )}
            </div>
          </div>
        </header>

        {socketError && (
          <Alert tone="error" className="shrink-0 rounded-none border-x-0 border-t-0">
            {socketError}
          </Alert>
        )}

        <div
          className="min-h-0 flex-1 overflow-y-auto bg-surface-subtle px-3 py-4 sm:px-6 sm:py-6"
          aria-busy={loading}
        >
          {loading ? (
            <div className="mx-auto max-w-2xl space-y-4" aria-label="Loading conversation">
              <Skeleton className="h-14 w-3/5 rounded-2xl" />
              <Skeleton className="ml-auto h-14 w-2/3 rounded-2xl" />
              <Skeleton className="h-20 w-1/2 rounded-2xl" />
            </div>
          ) : loadError ? (
            <div className="mx-auto max-w-xl space-y-4 pt-8">
              <Alert tone="error">{loadError}</Alert>
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setRetryCount((count) => count + 1)}
                >
                  Try again
                </Button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="mx-auto max-w-xl pt-8">
              <EmptyState
                title="Start the conversation"
                description="Send a message to get things going."
              />
            </div>
          ) : (
            <ol className="mx-auto flex max-w-2xl flex-col gap-3" aria-label="Conversation messages">
              {messages.map((message) => {
                const isMe = message.senderId === currentUserId;

                return (
                  <li
                    key={message._id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <Card
                      variant={isMe ? "default" : "outlined"}
                      className={`max-w-[88%] px-4 py-3 shadow-[var(--shadow-sm)] sm:max-w-[75%] ${
                        isMe
                          ? "border-brand-primary bg-brand-primary text-brand-primary-foreground"
                          : "border-border bg-surface text-text-primary"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere]">
                        {message.text}
                      </p>
                    </Card>
                  </li>
                );
              })}
              <li ref={bottomRef} aria-hidden="true" />
            </ol>
          )}
        </div>

        <footer className="shrink-0 border-t border-border bg-surface px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 sm:px-5">
          {sendError && (
            <Alert tone="error" className="mb-3">
              {sendError}
            </Alert>
          )}
          {deliveryStatus && (
            <p role="status" className="mx-auto mb-3 max-w-2xl text-sm text-text-secondary">
              {deliveryStatus}
            </p>
          )}
          <form
            className="mx-auto flex max-w-2xl items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend();
            }}
          >
            <label htmlFor="chat-message" className="sr-only">
              Message
            </label>
            <input
              id="chat-message"
              value={text}
              onChange={(event) => handleTyping(event.target.value)}
              placeholder="Write a message..."
              autoComplete="off"
              className="ui-input min-h-11 flex-1 rounded-full px-4 py-2 text-sm"
            />
            <Button
              type="submit"
              disabled={!text.trim() || !chatId || loading || Boolean(loadError) || sending}
              aria-label="Send message"
              className="min-h-11 shrink-0 rounded-full px-4"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>{sending ? "Sending" : "Send"}</span>
            </Button>
          </form>
        </footer>
          </section>
        </div>
      </div>
    </main>
  );
}
