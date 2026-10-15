"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Plus, Send, Trash2, UserRound } from "lucide-react";
import { Alert, Button, Card, EmptyState, Skeleton, Textarea } from "@/components/ui";
import { normalizeInterestLabel, normalizeInterestName } from "@/modules/people-chat/normalization/discovery-interest";
import type { DiscoveryCandidateDto, DiscoveryPreferenceDto } from "@/modules/people-chat/types/discovery";

const EMPTY_PREFERENCES: DiscoveryPreferenceDto = { enabled: false, interests: [] };

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

function hasVisibleInterests(preferences: DiscoveryPreferenceDto) {
  return preferences.interests.some((interest) => interest.visible);
}

function validateInterests(interests: DiscoveryPreferenceDto["interests"]): string | null {
  if (interests.length > 20) return "You can add up to 20 interests.";
  const names = new Set<string>();
  for (const interest of interests) {
    const label = normalizeInterestLabel(interest.name);
    const normalized = normalizeInterestName(label);
    if (!label) return "Interest names cannot be blank.";
    if (label.length > 80) return "Interest names must be 80 characters or fewer.";
    if (names.has(normalized)) return "Each interest must be unique, ignoring case and extra spaces.";
    names.add(normalized);
  }
  return null;
}

export default function PeopleDiscovery() {
  const [preferences, setPreferences] = useState<DiscoveryPreferenceDto>(EMPTY_PREFERENCES);
  const [draft, setDraft] = useState(EMPTY_PREFERENCES);
  const [newInterest, setNewInterest] = useState("");
  const [candidates, setCandidates] = useState<DiscoveryCandidateDto[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<DiscoveryCandidateDto | null>(null);
  const [introductoryMessage, setIntroductoryMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [candidateError, setCandidateError] = useState("");
  const [formError, setFormError] = useState("");
  const [interestError, setInterestError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sentCandidateIds, setSentCandidateIds] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const requestInProgress = useRef(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError("");
      setCandidateError("");
      let preferencesLoaded = false;
      try {
        const response = await fetch("/api/people/discovery");
        const data = await readJson(response);
        if (!response.ok || !data || typeof data !== "object") {
          throw new Error(errorMessage(data, "Your discovery settings could not be loaded."));
        }
        const record = data as Partial<DiscoveryPreferenceDto>;
        if (typeof record.enabled !== "boolean" || !Array.isArray(record.interests)) {
          throw new Error("Discovery settings returned an invalid response.");
        }
        const loaded: DiscoveryPreferenceDto = {
          enabled: record.enabled,
          interests: record.interests.filter(
            (interest): interest is DiscoveryPreferenceDto["interests"][number] =>
              Boolean(interest) && typeof interest.name === "string" && typeof interest.visible === "boolean",
          ),
        };
        preferencesLoaded = true;
        if (active) {
          setPreferences(loaded);
          setDraft(loaded);
          setDirty(false);
          setLoading(false);
        }

        if (loaded.enabled && hasVisibleInterests(loaded)) {
          if (active) setCandidateLoading(true);
          const candidatesResponse = await fetch("/api/people/discover");
          const candidatesData = await readJson(candidatesResponse);
          const candidateList = candidatesData && typeof candidatesData === "object"
            ? (candidatesData as { candidates?: unknown }).candidates
            : undefined;
          if (!candidatesResponse.ok || !Array.isArray(candidateList)) {
            if (active) setCandidateError(errorMessage(candidatesData, "People could not be discovered right now."));
          } else if (active) {
            setCandidates(candidateList as DiscoveryCandidateDto[]);
          }
        } else if (active) {
          setCandidates([]);
        }
      } catch (error) {
        if (active) {
          if (preferencesLoaded) {
            setCandidates([]);
            setCandidateError("People could not be discovered right now. Please try again.");
          } else {
            setLoadError(error instanceof Error ? error.message : "Your discovery settings could not be loaded.");
          }
        }
      } finally {
        if (active) {
          setLoading(false);
          setCandidateLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [retryCount]);

  const localValidationError = useMemo(() => validateInterests(draft.interests), [draft.interests]);
  const mayDiscover = preferences.enabled && hasVisibleInterests(preferences);
  const canShowCandidates = mayDiscover && !dirty && !loading;

  const changeDraft = (next: DiscoveryPreferenceDto) => {
    setDraft(next);
    setDirty(true);
    setCandidates([]);
    setCandidateError("");
    setSuccessMessage("");
  };

  const addInterest = () => {
    const label = normalizeInterestLabel(newInterest);
    if (!label) {
      setInterestError("Enter an interest before adding it.");
      return;
    }
    if (label.length > 80) {
      setInterestError("Interest names must be 80 characters or fewer.");
      return;
    }
    if (draft.interests.some((interest) => normalizeInterestName(interest.name) === normalizeInterestName(label))) {
      setInterestError("That interest is already on your list.");
      return;
    }
    if (draft.interests.length >= 20) {
      setInterestError("You can add up to 20 interests.");
      return;
    }
    changeDraft({ ...draft, interests: [...draft.interests, { name: label, visible: true }] });
    setNewInterest("");
    setInterestError("");
  };

  const savePreferences = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    const validationError = validateInterests(draft.interests);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/people/discovery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await readJson(response);
      if (!response.ok || !data || typeof data !== "object") {
        throw new Error(errorMessage(data, "Your discovery settings could not be saved."));
      }
      const record = data as Partial<DiscoveryPreferenceDto>;
      if (typeof record.enabled !== "boolean" || !Array.isArray(record.interests)) {
        throw new Error("Discovery settings returned an invalid response.");
      }
      const saved: DiscoveryPreferenceDto = {
        enabled: record.enabled,
        interests: record.interests as DiscoveryPreferenceDto["interests"],
      };
      setPreferences(saved);
      setDraft(saved);
      setDirty(false);
      setSuccessMessage("Your discovery preferences were saved.");
      setCandidates([]);

      if (saved.enabled && hasVisibleInterests(saved)) {
        setCandidateLoading(true);
        const candidateResponse = await fetch("/api/people/discover");
        const candidateData = await readJson(candidateResponse);
        const candidateList = candidateData && typeof candidateData === "object"
          ? (candidateData as { candidates?: unknown }).candidates
          : undefined;
        if (!candidateResponse.ok || !Array.isArray(candidateList)) {
          setCandidateError(errorMessage(candidateData, "Settings were saved, but people could not be loaded."));
        } else {
          setCandidates(candidateList as DiscoveryCandidateDto[]);
        }
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Your discovery settings could not be saved.");
    } finally {
      setSaving(false);
      setCandidateLoading(false);
    }
  };

  const sendConnectionRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCandidate || requestInProgress.current) return;
    if (!introductoryMessage.trim()) {
      setFormError("Write a short introductory message before sending.");
      return;
    }
    requestInProgress.current = true;
    setSending(true);
    setFormError("");
    setSuccessMessage("");
    try {
      const response = await fetch("/api/connection-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: selectedCandidate.userId,
          introductoryMessage,
        }),
      });
      const data = await readJson(response);
      const result = data as { requestId?: unknown; status?: unknown } | null;
      if (!response.ok) {
        const fallback = response.status === 409
          ? "A pending request or connection already exists. Check Requests or Chats."
          : "The connection request could not be sent.";
        throw new Error(errorMessage(data, fallback));
      }
      if (!result || typeof result.requestId !== "string" || result.status !== "pending") {
        throw new Error("The request response could not be confirmed. Check Requests before trying again.");
      }
      setSentCandidateIds((ids) => ids.includes(selectedCandidate.userId) ? ids : [...ids, selectedCandidate.userId]);
      setSelectedCandidate(null);
      setIntroductoryMessage("");
      setSuccessMessage("Request sent. They must accept before you can start a chat.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "The connection request could not be sent.");
    } finally {
      requestInProgress.current = false;
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Discovery preferences</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Discovery is opt-in. Only interests you mark visible can match with other people.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading discovery preferences">
            <Skeleton className="h-11 w-full max-w-sm" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : loadError ? (
          <Alert tone="error" className="flex-col items-start gap-3 sm:flex-row sm:items-center">
            <span>{loadError}</span>
            <Button type="button" variant="secondary" onClick={() => setRetryCount((value) => value + 1)}>
              Try again
            </Button>
          </Alert>
        ) : (
          <form onSubmit={savePreferences} className="space-y-5">
            <label className="flex min-h-11 items-center gap-3 rounded-control border border-border px-3 py-2">
              <input
                type="checkbox"
                checked={draft.enabled}
                disabled={saving}
                onChange={(event) => changeDraft({ ...draft, enabled: event.target.checked })}
                className="h-4 w-4 accent-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              />
              <span>
                <span className="block text-sm font-semibold">Allow people to discover me</span>
                <span className="block text-xs text-text-secondary">You can turn this off at any time.</span>
              </span>
            </label>

            <fieldset className="space-y-3" disabled={saving}>
              <legend className="text-sm font-semibold">Learning interests</legend>
              <p className="text-xs text-text-secondary">Add up to 20 interests. Visibility and discovery opt-in are separate controls.</p>
              {draft.interests.length ? (
                <ul className="space-y-2">
                  {draft.interests.map((interest, index) => (
                    <li key={index} className="grid gap-2 rounded-control border border-border p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                      <label className="min-w-0">
                        <span className="sr-only">Interest name {index + 1}</span>
                        <input
                          value={interest.name}
                          maxLength={80}
                          onChange={(event) => {
                            const interests = [...draft.interests];
                            interests[index] = { ...interest, name: event.target.value };
                            changeDraft({ ...draft, interests });
                            setInterestError("");
                          }}
                          className="ui-input min-h-11 w-full"
                        />
                      </label>
                      <label className="flex min-h-11 items-center gap-2 text-sm text-text-secondary">
                        <input
                          type="checkbox"
                          checked={interest.visible}
                          onChange={(event) => {
                            const interests = [...draft.interests];
                            interests[index] = { ...interest, visible: event.target.checked };
                            changeDraft({ ...draft, interests });
                          }}
                          className="h-4 w-4 accent-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                        />
                        Show in discovery
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        aria-label={`Remove ${interest.name || `interest ${index + 1}`}`}
                        onClick={() => changeDraft({
                          ...draft,
                          interests: draft.interests.filter((_, itemIndex) => itemIndex !== index),
                        })}
                        className="min-h-11 justify-center text-text-secondary"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="sm:hidden">Remove</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-control border border-dashed border-border-strong px-4 py-5 text-sm text-text-secondary">
                  No interests added yet.
                </p>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Add a learning interest</span>
                  <input
                    value={newInterest}
                    onChange={(event) => {
                      setNewInterest(event.target.value);
                      setInterestError("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addInterest();
                      }
                    }}
                    maxLength={80}
                    placeholder="e.g. TypeScript"
                    className="ui-input min-h-11 w-full"
                    aria-invalid={Boolean(interestError)}
                    aria-describedby={interestError ? "interest-error" : undefined}
                  />
                </label>
                <Button type="button" variant="secondary" onClick={addInterest} disabled={draft.interests.length >= 20} className="min-h-11">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add interest
                </Button>
              </div>
              {interestError && <p id="interest-error" role="alert" className="text-sm text-red-700">{interestError}</p>}
              {localValidationError && <p role="alert" className="text-sm text-text-secondary">{localValidationError}</p>}
            </fieldset>

            {formError && <Alert tone="error">{formError}</Alert>}
            {successMessage && <Alert tone="success">{successMessage}</Alert>}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" loading={saving} disabled={!dirty || Boolean(localValidationError)} className="min-h-11">
                <Check className="h-4 w-4" aria-hidden="true" />
                Save preferences
              </Button>
              {dirty && <span className="text-sm text-text-secondary">Save to update your discovery settings.</span>}
            </div>
          </form>
        )}
      </Card>

      {canShowCandidates && (
        <section aria-labelledby="discovery-results-heading" className="space-y-4">
          <div>
            <h2 id="discovery-results-heading" className="text-xl font-semibold">People who share your interests</h2>
            <p className="mt-1 text-sm text-text-secondary">A connection request starts with one introduction. Chat becomes available after they accept.</p>
          </div>

          {candidateError && (
            <Alert tone="error" className="flex-col items-start gap-3 sm:flex-row sm:items-center">
              <span>{candidateError}</span>
              <Button type="button" variant="secondary" onClick={() => setRetryCount((value) => value + 1)}>
                Try again
              </Button>
            </Alert>
          )}
          {candidateLoading ? (
            <ul className="space-y-3" aria-label="Loading people" aria-busy="true">
              {[0, 1, 2].map((item) => <li key={item}><Skeleton className="h-28 w-full rounded-card" /></li>)}
            </ul>
          ) : candidates.length === 0 ? (
            <EmptyState title="No matches yet" description="When people opt in with shared visible interests, they’ll appear here." />
          ) : (
            <ul className="space-y-3">
              {candidates.map((candidate) => {
                const sent = sentCandidateIds.includes(candidate.userId);
                return (
                  <li key={candidate.userId}>
                    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                      <div className="flex min-w-0 items-start gap-3">
                        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary-soft text-brand-primary">
                          <UserRound className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold">{candidate.displayName}</h3>
                          <p className="mt-1 text-xs font-medium text-text-secondary">Shared visible interests</p>
                          <ul className="mt-2 flex flex-wrap gap-2" aria-label="Shared interests">
                            {candidate.sharedInterests.map((interest) => (
                              <li key={normalizeInterestName(interest)} className="rounded-full border border-border bg-surface-subtle px-2.5 py-1 text-xs text-text-primary">
                                {interest}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant={sent ? "secondary" : "primary"}
                        disabled={sent}
                        onClick={() => {
                          setSelectedCandidate(candidate);
                          setIntroductoryMessage("");
                          setFormError("");
                        }}
                        className="min-h-11 shrink-0"
                      >
                        <Send className="h-4 w-4" aria-hidden="true" />
                        {sent ? "Request sent" : "Connect"}
                      </Button>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {!loading && !loadError && !dirty && !mayDiscover && (
        <EmptyState
          title={preferences.enabled ? "Choose visible interests to discover people" : "Discovery is off"}
          description={preferences.enabled
            ? "Turn on visibility for at least one interest, then save your preferences."
            : "Add interests and opt in above when you’re ready to be discovered."}
        />
      )}

      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !sending) setSelectedCandidate(null);
        }}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-dialog-title"
            onKeyDown={(event) => {
              if (event.key === "Escape" && !sending) setSelectedCandidate(null);
            }}
            className="w-full max-w-lg rounded-t-container border border-border bg-surface p-5 shadow-[var(--shadow-lg)] sm:rounded-container sm:p-6"
          >
            <h2 id="connect-dialog-title" className="text-xl font-semibold">Connect with {selectedCandidate.displayName}</h2>
            <p className="mt-2 text-sm text-text-secondary">Send one introductory message. They must accept before you can chat.</p>
            <form onSubmit={sendConnectionRequest} className="mt-5 space-y-4">
              <Textarea
                id="connection-intro"
                label="Introductory message"
                value={introductoryMessage}
                onChange={(event) => setIntroductoryMessage(event.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Say hello and share what you’re learning."
                disabled={sending}
                autoFocus
                required
              />
              <p className="text-right text-xs text-text-secondary">{introductoryMessage.length}/500</p>
              {formError && <Alert tone="error">{formError}</Alert>}
              <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                <Button type="button" variant="ghost" disabled={sending} onClick={() => setSelectedCandidate(null)} className="min-h-11">Cancel</Button>
                <Button type="submit" loading={sending} disabled={!introductoryMessage.trim()} className="min-h-11">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Send request
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
