"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Alert, Button, Card, EmptyState, Skeleton } from "@/components/ui";
import type { PeopleConversationSummary } from "@/modules/people-chat/types/people-chat";

type ConversationSidebarProps = {
  activeUserId?: string;
  className?: string;
  refreshKey?: string;
};

export default function ConversationSidebar({
  activeUserId,
  className = "",
  refreshKey = "",
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<PeopleConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    const loadConversations = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/chats");
        const data = await response.json();
        if (!response.ok || !Array.isArray(data)) {
          throw new Error("Conversations are unavailable.");
        }
        if (active) {
          const seenChatIds = new Set<string>();
          setConversations(
            data.filter((conversation: PeopleConversationSummary) => {
              if (seenChatIds.has(conversation.chatId)) return false;
              seenChatIds.add(conversation.chatId);
              return true;
            }),
          );
        }
      } catch {
        if (active) setError("Your conversations could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadConversations();
    return () => {
      active = false;
    };
  }, [refreshKey, retryCount]);

  return (
    <aside
      aria-label="Existing conversations"
      className={`flex min-h-0 flex-col bg-surface ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">
            Inbox
          </p>
          <h2 className="mt-1 text-lg font-semibold text-text-primary">Conversations</h2>
        </div>
        <MessageCircle className="h-5 w-5 shrink-0 text-brand-primary" aria-hidden="true" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {loading ? (
          <ul className="space-y-2" aria-label="Loading conversations" aria-busy="true">
            {[0, 1, 2].map((item) => (
              <li key={item}>
                <Card className="flex items-center gap-3 p-3">
                  <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        ) : error ? (
          <Alert tone="error" className="flex-col items-start">
            <span>{error}</span>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              Try again
            </Button>
          </Alert>
        ) : conversations.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            description="Start a conversation with someone from New Chat."
          />
        ) : (
          <ul className="space-y-2">
            {conversations.map(({ chatId, participant }) => {
              const isActive = participant.userId === activeUserId;
              const name = participant.displayName || "Unavailable participant";
              const initial = participant.displayName?.trim().charAt(0).toUpperCase() || "?";

              return (
                <li key={chatId}>
                  <Link
                    href={`/people/${participant.userId}`}
                    aria-label={`Open conversation with ${name}`}
                    aria-current={isActive ? "page" : undefined}
                    className="group block rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                  >
                    <Card
                      className={`flex items-center gap-3 p-3 transition-colors ${
                        isActive
                          ? "border-brand-primary/40 bg-brand-primary-soft"
                          : "group-hover:border-brand-primary/30 group-hover:bg-surface-subtle"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                          isActive
                            ? "bg-brand-primary text-white"
                            : "bg-surface-subtle text-text-secondary"
                        }`}
                      >
                        {initial}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-text-primary">
                          {name}
                        </span>
                        <span className="mt-0.5 block text-xs text-text-muted">
                          Conversation
                        </span>
                      </span>
                      <ArrowRight
                        className="h-4 w-4 shrink-0 text-text-muted transition group-hover:text-brand-primary"
                        aria-hidden="true"
                      />
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
