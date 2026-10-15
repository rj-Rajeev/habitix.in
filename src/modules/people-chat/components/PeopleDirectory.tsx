"use client";

import { useEffect, useState } from "react";
import { Compass, Inbox, MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui";
import ConnectionRequests from "@/modules/people-chat/components/ConnectionRequests";
import ConversationSidebar from "@/modules/people-chat/components/ConversationSidebar";
import PeopleChatHeader from "@/modules/people-chat/components/PeopleChatHeader";
import PeopleDiscovery from "@/modules/people-chat/components/PeopleDiscovery";
import { createPeopleChatSocket } from "@/modules/people-chat/integrations/socket-client";

type PeopleView = "discover" | "requests" | "chats";

const views: Array<{ id: PeopleView; label: string; icon: typeof Compass }> = [
  { id: "discover", label: "Discover", icon: Compass },
  { id: "requests", label: "Requests", icon: Inbox },
  { id: "chats", label: "Chats", icon: MessageCircle },
];

export default function PeopleDirectory() {
  const [view, setView] = useState<PeopleView>("chats");
  const [notice, setNotice] = useState("");
  const [, setOnlineUsers] = useState<string[]>([]);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;
    let active = true;
    let connection: Awaited<ReturnType<typeof createPeopleChatSocket>> | null = null;

    void createPeopleChatSocket()
      .then((createdConnection) => {
        if (!active) {
          createdConnection.disconnect();
          return;
        }

        connection = createdConnection;
        createdConnection.socket.on("onlineUsers", (users: unknown) => {
          if (active && Array.isArray(users)) setOnlineUsers(users);
        });
        createdConnection.socket.on("connect_error", () => {
          if (active) setOnlineUsers([]);
        });
        createdConnection.connect();
      })
      .catch(() => {
        if (active) setOnlineUsers([]);
      });

    return () => {
      active = false;
      connection?.disconnect();
    };
  }, [session?.user?.id]);

  return (
    <main className="min-h-[100dvh] bg-background text-text-primary">
      <PeopleChatHeader />
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:py-8">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">
            People
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            {view === "discover" ? "Discover learning partners" : view === "requests" ? "Connection requests" : "Chats"}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Find people who share your learning interests and connect by consent.
          </p>
        </div>

        <nav aria-label="People sections" className="mb-5 grid grid-cols-3 gap-2 border-b border-border pb-3">
          {views.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              type="button"
              variant={view === id ? "primary" : "ghost"}
              aria-current={view === id ? "page" : undefined}
              onClick={() => {
                setNotice("");
                setView(id);
              }}
              className="min-h-11 justify-center px-2 sm:gap-2"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Button>
          ))}
        </nav>

        {view === "discover" ? (
          <PeopleDiscovery />
        ) : view === "requests" ? (
          <ConnectionRequests onOpenChats={(message) => {
            setNotice(message ?? "");
            setView("chats");
          }} />
        ) : (
          <section aria-label="Your conversations">
            {notice && <p role="status" className="mb-4 rounded-control border border-border bg-surface-subtle px-4 py-3 text-sm text-text-primary">{notice}</p>}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-text-secondary">
                Only accepted connections and existing eligible chats appear here.
              </p>
              <Button type="button" variant="secondary" onClick={() => setView("discover")}>
                <Compass className="h-4 w-4" aria-hidden="true" />
                Find learning partners
              </Button>
            </div>
            <ConversationSidebar className="min-h-56 rounded-card border border-border shadow-[var(--shadow-sm)]" />
          </section>
        )}
      </div>
    </main>
  );
}
