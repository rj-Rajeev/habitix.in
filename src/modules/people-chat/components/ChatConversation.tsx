"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Send } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { Alert, Button, Card, EmptyState, Skeleton } from "@/components/ui";
import ConversationSidebar from "@/modules/people-chat/components/ConversationSidebar";
import PeopleChatHeader from "@/modules/people-chat/components/PeopleChatHeader";

type ChatMessage = { _id: string | number; text: string; senderId?: string };
type ChatUser = { email?: string; fullname?: string };

export default function ChatConversation() {
  const params = useParams();
  const rawUserId = params.userId;
  const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [chatId, setChatId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [participantError, setParticipantError] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sending, setSending] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendingRef = useRef(false);
  const bottomRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    fetch(`/api/users/${userId}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data?.error) throw new Error("Participant unavailable");
        return data as ChatUser;
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
  }, [userId]);

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

        if (active) setChatId(chatData.chatId);

        const historyResponse = await fetch(`/api/chats/${chatData.chatId}`);
        const history = await historyResponse.json();
        if (!historyResponse.ok || !Array.isArray(history)) {
          throw new Error("Message history unavailable");
        }

        if (active) setMessages(history);
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
    if (!currentUserId || !userId) return;

    const socket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { userId: currentUserId },
    });

    socketRef.current = socket;

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("typing", ({ senderId }) => {
      if (senderId?.toString() !== userId.toString()) return;

      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUserId, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !chatId || loading || loadError || sendingRef.current) return;

    const newMsg = {
      _id: Date.now(),
      text,
      senderId: currentUserId,
    };

    sendingRef.current = true;
    setSending(true);
    setSendError("");
    setMessages((prev) => [...prev, newMsg]);
    setText("");

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId, text }),
      });

      socketRef.current?.emit("sendMessage", {
        chatId,
        text,
        receiverId: userId,
      });
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

    socketRef.current?.emit("typing", {
      receiverId: userId,
    });
  };

  const participantName = otherUser?.fullname || otherUser?.email || "Conversation";
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
