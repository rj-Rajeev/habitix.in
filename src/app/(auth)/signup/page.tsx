"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Alert, Card } from "@/components/ui";
import { Container } from "@/components/layout";

export default function SignUp() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const fullname = String(formData.get("fullname") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!fullname || !email || !password) {
      setError("Please enter your full name, email, and password.");
      setSuccess("");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setSuccess("");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Registration failed. Please try again.");
        return;
      }
      setSuccess("Account created successfully. Redirecting to sign in...");
      window.setTimeout(() => router.push("/signin"), 900);
    } catch {
      setError("Unable to create your account right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-background px-4 py-10 sm:px-6 sm:py-16">
      <Container className="flex min-h-[calc(100dvh-5rem)] items-center justify-center">
        <Card className="w-full max-w-[440px] p-6 sm:p-8">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.08em] text-text-primary" aria-label="Habitix home">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-white"><Check className="h-4 w-4" aria-hidden="true" /></span>
              HABITIX
            </Link>
            <h1 className="mt-8 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">Create your Habitix account</h1>
            <p className="mt-2 text-sm leading-6 text-text-secondary">Start turning your goals into practical daily actions.</p>
          </div>
          {error && <Alert tone="error" className="mb-5">{error}</Alert>}
          {success && <Alert tone="success" className="mb-5">{success}</Alert>}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <label className="block space-y-1.5" htmlFor="fullname"><span className="text-sm font-medium text-text-primary">Full name</span><input id="fullname" name="fullname" type="text" required autoComplete="name" disabled={isLoading} className="ui-input" placeholder="Your full name" /></label>
            <label className="block space-y-1.5" htmlFor="email"><span className="text-sm font-medium text-text-primary">Email</span><input id="email" name="email" type="email" required autoComplete="email" disabled={isLoading} className="ui-input" placeholder="you@example.com" /></label>
            <label className="block space-y-1.5" htmlFor="password"><span className="text-sm font-medium text-text-primary">Password</span><input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" disabled={isLoading} className="ui-input" placeholder="At least 6 characters" /></label>
            <button type="submit" disabled={isLoading} className="ui-button w-full" data-variant="primary">{isLoading ? "Creating account..." : "Create account"}<ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          </form>
          <p className="mt-7 text-center text-sm text-text-secondary">Already have an account? <Link href="/signin" className="font-semibold text-brand-primary hover:text-brand-primary-hover">Sign in</Link></p>
        </Card>
      </Container>
    </main>
  );
}
