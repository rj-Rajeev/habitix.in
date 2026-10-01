"use client";

import { type FormEvent, useEffect, useState } from "react";
import { CircleUserRound, Loader2, Pencil, X } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import ChangePasswordForm from "@/components/profile/change-password-form";
import { Feedback, readResponse } from "@/components/profile/profile-utils";

type Profile = {
  _id: string;
  fullname: string;
  email: string;
  role: "user" | "admin";
};

type ProfilePageProps = {
  userId: string;
};

export default function ProfilePage({ userId }: ProfilePageProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [fullname, setFullname] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadProfile() {
      try {
        const response = await fetch(`/api/users/${encodeURIComponent(userId)}`);
        const payload = await readResponse(response, "Unable to load your profile.");

        if (!isCurrent) return;

        const nextProfile = payload as Profile;
        setProfile(nextProfile);
        setFullname(nextProfile.fullname);
      } catch (error) {
        if (isCurrent) {
          setLoadError(error instanceof Error ? error.message : "Unable to load your profile.");
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadProfile();

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  function beginEditing() {
    if (!profile) return;
    setFullname(profile.fullname);
    setProfileMessage("");
    setProfileError("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setFullname(profile?.fullname ?? "");
    setProfileMessage("");
    setProfileError("");
    setIsEditing(false);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFullname = fullname.trim();

    if (!nextFullname) {
      setProfileError("Full name is required.");
      return;
    }

    if (nextFullname.length > 100) {
      setProfileError("Full name must be 100 characters or fewer.");
      return;
    }

    setIsSavingProfile(true);
    setProfileError("");
    setProfileMessage("");

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname: nextFullname }),
      });
      const updatedProfile = (await readResponse(
        response,
        "Unable to update your profile."
      )) as Profile;

      setProfile(updatedProfile);
      setFullname(updatedProfile.fullname);
      setIsEditing(false);
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Unable to update your profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  return (
    <AppShell eyebrow="Account" title="Profile">
      {isLoading ? (
        <LoadingState label="Loading your profile" />
      ) : loadError ? (
        <Feedback tone="error">{loadError}</Feedback>
      ) : !profile ? (
        <Feedback tone="error">Your profile could not be found.</Feedback>
      ) : (
        <div className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <CircleUserRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-slate-950">Profile information</h2>
                  <p className="text-sm text-slate-500">Your account details</p>
                </div>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={beginEditing}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              )}
            </div>

            <form onSubmit={saveProfile} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Full name</span>
                {isEditing ? (
                  <input
                    value={fullname}
                    onChange={(event) => setFullname(event.target.value)}
                    maxLength={100}
                    autoComplete="name"
                    disabled={isSavingProfile}
                    className="w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                  />
                ) : (
                  <p className="rounded-xl bg-slate-50 px-3 py-3 text-slate-950">{profile.fullname}</p>
                )}
              </label>

              <ReadOnlyField label="Email" value={profile.email} />
              <ReadOnlyField label="Role" value={profile.role ?? "user"} />

              {isEditing && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
                  >
                    {isSavingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={isSavingProfile}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              )}
            </form>

            {profileMessage && <Feedback tone="success">{profileMessage}</Feedback>}
            {profileError && <Feedback tone="error">{profileError}</Feedback>}
          </section>

          <ChangePasswordForm userId={userId} />
        </div>
      )}
    </AppShell>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <p className="rounded-xl bg-slate-50 px-3 py-3 text-slate-600">{value}</p>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-3xl bg-white text-sm text-slate-500 shadow-sm">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}
