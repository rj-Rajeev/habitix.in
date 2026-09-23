"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Check,
  CircleUserRound,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Pencil,
  X,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";

type Profile = {
  _id: string;
  fullname: string;
  email: string;
  role: "user" | "admin";
};

type ProfilePageProps = {
  userId: string;
};

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const body = payload as {
      error?: { message?: string } | string;
      message?: string;
    };

    if (typeof body.error === "string") return body.error;
    if (body.error?.message) return body.error.message;
    if (body.message) return body.message;
  }

  return fallback;
}

async function readResponse(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, fallback));
  }
  return payload;
}

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

function Feedback({ children, tone }: { children: string; tone: "error" | "success" }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`mt-4 flex items-start gap-2 rounded-xl border px-3 py-3 text-sm ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {tone === "success" && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{children}</span>
    </div>
  );
}

function ChangePasswordForm({ userId }: { userId: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Enter your current password, a new password, and confirmation.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/users/${encodeURIComponent(userId)}/password`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      );
      await readResponse(response, "Unable to update your password.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated successfully.");
    } catch (passwordError) {
      setError(
        passwordError instanceof Error
          ? passwordError.message
          : "Unable to update your password."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <KeyRound className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold text-slate-950">Change password</h2>
          <p className="text-sm text-slate-500">Keep your account secure</p>
        </div>
      </div>

      <form onSubmit={changePassword} className="mt-6 space-y-4">
        <PasswordField
          id="current-password"
          label="Current password"
          value={currentPassword}
          onChange={setCurrentPassword}
          visible={showCurrentPassword}
          onToggleVisibility={() => setShowCurrentPassword((visible) => !visible)}
          autoComplete="current-password"
          disabled={isSaving}
        />
        <PasswordField
          id="new-password"
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          visible={showNewPassword}
          onToggleVisibility={() => setShowNewPassword((visible) => !visible)}
          autoComplete="new-password"
          disabled={isSaving}
        />
        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          visible={showConfirmPassword}
          onToggleVisibility={() => setShowConfirmPassword((visible) => !visible)}
          autoComplete="new-password"
          disabled={isSaving}
        />
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Update password
        </button>
      </form>

      {message && <Feedback tone="success">{message}</Feedback>}
      {error && <Feedback tone="error">{error}</Feedback>}
    </section>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggleVisibility,
  autoComplete,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
  autoComplete: string;
  disabled: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-300 px-3 py-3 pr-12 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={disabled}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </label>
  );
}