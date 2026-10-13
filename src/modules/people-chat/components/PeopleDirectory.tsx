"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { io } from "socket.io-client";
import { ArrowLeft, ArrowRight, MessageCircle, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Input,
  Skeleton,
} from "@/components/ui";
import ConversationSidebar from "@/modules/people-chat/components/ConversationSidebar";
import PeopleChatHeader from "@/modules/people-chat/components/PeopleChatHeader";

type UserSummary = { _id: string; fullname?: string; name?: string };

export default function PeopleDirectory() {
  const [isNewChat, setIsNewChat] = useState(false);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [search, setSearch] = useState("");
  const [, setOnlineUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const { data: session } = useSession();

  useEffect(() => {
    if (!isNewChat) return;
    let active = true;

    const fetchUsers = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch("/api/users");
        const data = await response.json();
        if (!response.ok || !Array.isArray(data)) {
          throw new Error("People could not be loaded.");
        }
        if (active) setUsers(data);
      } catch {
        if (active) setLoadError("People could not be loaded. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchUsers();
    return () => {
      active = false;
    };
  }, [isNewChat, retryCount]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: {
        userId: session.user.id,
      },
    });

    socket.on("onlineUsers", (users: string[]) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.disconnect();
    };
  }, [session]);

  const filteredUsers = users.filter((user) =>
    (user.fullname || user.name || "").toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );

  return (
    <main className="min-h-[100dvh] bg-background text-text-primary">
      <PeopleChatHeader />
      {isNewChat ? (
        <section className="mx-auto w-full max-w-3xl px-4 py-5 sm:py-8">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsNewChat(false);
              setSearch("");
            }}
            className="mb-4 min-h-11"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to chats
          </Button>

          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">
              People Chat
            </p>
            <h1 className="mt-1 text-2xl font-bold text-text-primary">New Chat</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Choose someone from Habitix to start or open a conversation.
            </p>
          </div>

          <div className="mb-4 flex items-center gap-2 rounded-control border border-border bg-surface px-3 focus-within:ring-2 focus-within:ring-brand-primary">
            <Search className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
            <Input
              id="people-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search people"
              aria-label="Search people by name"
              className="min-h-11 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
            />
          </div>

          <div aria-busy={loading}>
            {loading ? (
              <ul className="space-y-3" aria-label="Loading people">
                {[0, 1, 2, 3].map((item) => (
                  <li key={item}>
                    <Card className="flex items-center gap-4 p-4">
                      <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                      <Skeleton className="h-4 w-2/5" />
                    </Card>
                  </li>
                ))}
              </ul>
            ) : loadError ? (
              <Alert tone="error" className="flex-col items-start sm:flex-row sm:items-center sm:justify-between">
                <span>{loadError}</span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setRetryCount((count) => count + 1)}
                >
                  Try again
                </Button>
              </Alert>
            ) : filteredUsers.length === 0 ? (
              <EmptyState
                title={users.length === 0 ? "No people to show yet" : "No matching people"}
                description={
                  users.length === 0
                    ? "When other people join Habitix, you can start a conversation here."
                    : "Try a different name."
                }
              />
            ) : (
              <ul className="space-y-3" aria-label="Available people">
                {filteredUsers.map((user) => {
                  const name = user.fullname?.trim() || user.name?.trim() || "Habitix member";
                  const initial = name.charAt(0).toUpperCase() || "U";

                  return (
                    <li key={user._id}>
                      <Link
                        href={`/people/${user._id}`}
                        aria-label={`Start or open a conversation with ${name}`}
                        className="group block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                      >
                        <Card className="flex items-center gap-3 p-4 transition-colors group-hover:border-brand-primary/40 group-hover:bg-surface-subtle sm:gap-4 sm:p-5">
                          <span
                            aria-hidden="true"
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-primary-soft text-lg font-semibold text-brand-primary"
                          >
                            {initial}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-semibold text-text-primary">
                            {name}
                          </span>
                          <span className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-control px-2 text-sm font-semibold text-brand-primary sm:px-3">
                            <span className="hidden sm:inline">Message</span>
                            <MessageCircle className="h-4 w-4" aria-hidden="true" />
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </span>
                        </Card>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      ) : (
        <section className="mx-auto w-full max-w-4xl px-4 py-5 sm:py-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">
                People Chat
              </p>
              <h1 className="mt-1 text-2xl font-bold text-text-primary sm:text-3xl">Chats</h1>
              <p className="mt-1 text-sm text-text-secondary">Your existing conversations.</p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setLoading(true);
                setIsNewChat(true);
              }}
              className="min-h-11"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              New Chat
            </Button>
          </div>

          <ConversationSidebar className="min-h-56 rounded-card border border-border shadow-[var(--shadow-sm)]" />
        </section>
      )}
    </main>
  );
}
