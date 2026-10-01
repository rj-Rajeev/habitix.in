"use client";

import Link from "next/link";
import { type FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui";
import { Container } from "@/components/layout";

type VerificationStatus = "verifying" | "verified" | "invalid" | "expired" | "error";

export default function VerifyEmailPage() {
  return <Suspense fallback={<main className="min-h-screen grid place-items-center text-sm text-text-secondary">Loading verification link…</main>}><VerificationContent /></Suspense>;
}

function VerificationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const submittedToken = useRef<string | null>(null);
  const [status, setStatus] = useState<VerificationStatus>(token ? "verifying" : "invalid");
  const [email, setEmail] = useState("");
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState(false);

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResendLoading(true);
    setResendError(false);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendSent(true);
    } catch {
      setResendError(true);
    } finally {
      setResendLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    if (submittedToken.current === token) return;
    submittedToken.current = token;
    let active = true;
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(async (response) => {
      const data = await response.json();
      if (active) setStatus(response.ok ? "verified" : data.status === "expired" ? "expired" : "invalid");
    }).catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [token]);

  const content: Record<VerificationStatus, { title: string; message: string }> = {
    verifying: { title: "Verifying your email", message: "Please wait while we confirm your link." },
    verified: { title: "Email verified", message: "Your Habitix account is ready. You can sign in now." },
    invalid: { title: "Link unavailable", message: "This verification link is invalid or has already been used." },
    expired: { title: "Link expired", message: "This verification link has expired. Request a new one below." },
    error: { title: "Something went wrong", message: "We could not verify your email right now. Please try again." },
  };
  const current = content[status];

  return <main className="min-h-[100dvh] bg-background px-4 py-10 sm:px-6 sm:py-16"><Container className="flex min-h-[calc(100dvh-5rem)] items-center justify-center"><Card className="w-full max-w-[440px] p-6 text-center sm:p-8"><h1 className="text-2xl font-semibold tracking-tight text-text-primary">{current.title}</h1><p className="mt-3 text-sm leading-6 text-text-secondary" role="status">{current.message}</p>{status === "verified" ? <Link href="/signin" className="ui-button mt-7 w-full no-underline" data-variant="primary">Continue to sign in</Link> : status !== "verifying" && <><form onSubmit={resend} className="mt-6 space-y-3 text-left"><label className="block text-sm font-medium text-text-primary" htmlFor="verification-email">Email address</label><input id="verification-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="ui-input" autoComplete="email"/><button type="submit" disabled={resendLoading || resendSent} className="ui-button w-full" data-variant="primary">{resendSent ? "Request received" : resendLoading ? "Sending..." : "Send a new verification link"}</button>{resendSent && <p className="text-sm text-text-secondary" role="status">If the account needs verification, a new link will be sent shortly.</p>}{resendError && <p className="text-sm text-red-700" role="alert">Unable to submit the request. Please try again.</p>}</form><Link href="/signup" className="ui-button mt-4 w-full no-underline" data-variant="secondary">Back to sign up</Link></>}</Card></Container></main>;
}
