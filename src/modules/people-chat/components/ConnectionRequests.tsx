"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, MessageCircle, X } from "lucide-react";
import { Alert, Badge, Button, Card, EmptyState, Skeleton } from "@/components/ui";
import type { ConnectionRequestDto } from "@/modules/people-chat/types/connection-request";

type ConnectionRequestsProps = { onOpenChats: (notice?: string) => void };

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function errorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const error = (data as { error?: unknown }).error;
  if (error && typeof error === "object" && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return fallback;
}

function statusTone(status: ConnectionRequestDto["status"]): "warning" | "success" | "neutral" {
  if (status === "pending") return "warning";
  if (status === "accepted") return "success";
  return "neutral";
}

function statusLabel(status: ConnectionRequestDto["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function ConnectionRequests({ onOpenChats }: ConnectionRequestsProps) {
  const router = useRouter();
  const [incoming, setIncoming] = useState<ConnectionRequestDto[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyRequestId, setBusyRequestId] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const actionInProgress = useRef(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const [incomingResponse, outgoingResponse] = await Promise.all([
          fetch("/api/connection-requests?direction=incoming"),
          fetch("/api/connection-requests?direction=outgoing"),
        ]);
        const [incomingData, outgoingData] = await Promise.all([
          readJson(incomingResponse),
          readJson(outgoingResponse),
        ]);
        if (!incomingResponse.ok || !Array.isArray(incomingData)) {
          throw new Error(errorMessage(incomingData, "Incoming requests could not be loaded."));
        }
        if (!outgoingResponse.ok || !Array.isArray(outgoingData)) {
          throw new Error(errorMessage(outgoingData, "Outgoing requests could not be loaded."));
        }
        if (active) {
          setIncoming(incomingData as ConnectionRequestDto[]);
          setOutgoing(outgoingData as ConnectionRequestDto[]);
        }
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : "Requests could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [retryCount]);

  const decide = async (request: ConnectionRequestDto, decision: "accept" | "decline") => {
    if (actionInProgress.current) return;
    actionInProgress.current = true;
    setBusyRequestId(request.requestId);
    setActionError("");
    try {
      const response = await fetch(`/api/connection-requests/${request.requestId}/${decision}`, {
        method: "POST",
      });
      const data = await readJson(response);
      const result = data as { requestId?: unknown; status?: unknown; chatId?: unknown } | null;
      if (!response.ok) {
        const fallback = decision === "accept"
          ? "This request could not be accepted. It may have changed; refresh and try again."
          : "This request could not be declined. It may have changed; refresh and try again.";
        throw new Error(errorMessage(data, fallback));
      }
      if (!result || result.requestId !== request.requestId || result.status !== (decision === "accept" ? "accepted" : "declined")) {
        throw new Error("The request action could not be confirmed. Refresh the list before trying again.");
      }

      if (decision === "accept") {
        if (typeof result.chatId !== "string") {
          onOpenChats("Request accepted. The conversation is available in Chats.");
          return;
        }

        let participantUserId: unknown;
        try {
          const chatsResponse = await fetch("/api/chats");
          const chatsData = await readJson(chatsResponse);
          const acceptedConversation = chatsResponse.ok && Array.isArray(chatsData)
            ? chatsData.find((conversation: unknown) => {
                if (!conversation || typeof conversation !== "object") return false;
                const chat = conversation as { chatId?: unknown };
                return chat.chatId === result.chatId;
              })
            : undefined;
          const participant = acceptedConversation && typeof acceptedConversation === "object"
            ? (acceptedConversation as { participant?: unknown }).participant
            : undefined;
          participantUserId = participant && typeof participant === "object"
            ? (participant as { userId?: unknown }).userId
            : undefined;
        } catch {
          // Acceptance already succeeded; fall back to the chats list on lookup failure.
        }

        if (typeof participantUserId === "string" && participantUserId.length > 0) {
          router.push(`/people/${participantUserId}`);
        } else {
          onOpenChats("Request accepted. The conversation is available in Chats.");
        }
        return;
      }

      setRetryCount((value) => value + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The request action failed.");
    } finally {
      actionInProgress.current = false;
      setBusyRequestId("");
    }
  };

  const renderAcceptedLink = (request: ConnectionRequestDto, otherUserId: string) => (
    <Link
      href={`/people/${otherUserId}`}
      className="ui-button min-h-11 shrink-0"
      data-variant="secondary"
      aria-label={`Open accepted conversation with ${request.requester.userId === otherUserId ? request.requester.displayName || "this person" : request.recipient.displayName || "this person"}`}
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      Open chat
    </Link>
  );

  return (
    <div className="space-y-6">
      {actionError && <Alert tone="error">{actionError}</Alert>}
      {loading ? (
        <div className="space-y-6" aria-label="Loading connection requests" aria-busy="true">
          {[0, 1].map((section) => (
            <section key={section} className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-28 w-full rounded-card" />
            </section>
          ))}
        </div>
      ) : loadError ? (
        <Alert tone="error" className="flex-col items-start gap-3 sm:flex-row sm:items-center">
          <span>{loadError}</span>
          <Button type="button" variant="secondary" onClick={() => setRetryCount((value) => value + 1)}>
            Try again
          </Button>
        </Alert>
      ) : (
        <>
          <section aria-labelledby="incoming-heading" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 id="incoming-heading" className="text-lg font-semibold">Incoming</h2>
              <Badge>{incoming.length}</Badge>
            </div>
            {incoming.length === 0 ? (
              <EmptyState title="No incoming requests" description="New connection requests will appear here." />
            ) : (
              <ul className="space-y-3">
                {incoming.map((request) => {
                  const name = request.requester.displayName || "Habitix member";
                  return (
                    <li key={request.requestId}>
                      <Card className="space-y-3 p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold">{name}</h3>
                            <p className="mt-1 text-xs text-text-muted">Sent {new Date(request.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Badge tone={statusTone(request.status)}>{statusLabel(request.status)}</Badge>
                        </div>
                        <p className="whitespace-pre-wrap break-words rounded-control bg-surface-subtle px-3 py-3 text-sm text-text-primary">{request.introductoryMessage}</p>
                        {request.status === "pending" ? (
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" onClick={() => void decide(request, "accept")} loading={busyRequestId === request.requestId} disabled={Boolean(busyRequestId)} className="min-h-11">
                              <Check className="h-4 w-4" aria-hidden="true" />
                              Accept
                            </Button>
                            <Button type="button" variant="secondary" onClick={() => void decide(request, "decline")} loading={busyRequestId === request.requestId} disabled={Boolean(busyRequestId)} className="min-h-11">
                              <X className="h-4 w-4" aria-hidden="true" />
                              Decline
                            </Button>
                          </div>
                        ) : request.status === "accepted" ? (
                          renderAcceptedLink(request, request.requester.userId)
                        ) : null}
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="outgoing-heading" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 id="outgoing-heading" className="text-lg font-semibold">Outgoing</h2>
              <Badge>{outgoing.length}</Badge>
            </div>
            {outgoing.length === 0 ? (
              <EmptyState title="No outgoing requests" description="When you connect with someone, your request status will appear here." />
            ) : (
              <ul className="space-y-3">
                {outgoing.map((request) => {
                  const name = request.recipient.displayName || "Habitix member";
                  return (
                    <li key={request.requestId}>
                      <Card className="space-y-3 p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold">{name}</h3>
                            <p className="mt-1 text-xs text-text-muted">Sent {new Date(request.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Badge tone={statusTone(request.status)}>{statusLabel(request.status)}</Badge>
                        </div>
                        <p className="whitespace-pre-wrap break-words rounded-control bg-surface-subtle px-3 py-3 text-sm text-text-primary">{request.introductoryMessage}</p>
                        {request.status === "accepted" && renderAcceptedLink(request, request.recipient.userId)}
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          <Button type="button" variant="ghost" onClick={() => onOpenChats()} className="min-h-11">Back to chats</Button>
        </>
      )}
    </div>
  );
}
