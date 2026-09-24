"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { Check, Eye, EyeOff, Github, Loader2 } from "lucide-react";
import { Alert, Card } from "@/components/ui";
import { Container } from "@/components/layout";

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await nextAuthSignIn("credentials", { email, password, redirect: false });
      if (res?.ok) {
        router.push("/dashboard");
        return;
      }
      setError("Invalid email or password");
    } catch {
      setError("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true);
    setError("");
    try {
      await nextAuthSignIn(provider, { callbackUrl: "/dashboard" });
    } catch {
      setError("Unable to sign in with this provider right now.");
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
            <h1 className="mt-8 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">Welcome back</h1>
            <p className="mt-2 text-sm leading-6 text-text-secondary">Sign in to continue building yourself, one day at a time.</p>
          </div>

          {error && <Alert tone="error" className="mb-6">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block space-y-1.5" htmlFor="email">
              <span className="text-sm font-medium text-text-primary">Email</span>
              <input id="email" name="email" type="email" autoComplete="email" required disabled={isLoading} className="ui-input" placeholder="you@example.com" />
            </label>

            <div>
              <label className="block space-y-1.5" htmlFor="password">
                <span className="text-sm font-medium text-text-primary">Password</span>
                <span className="relative block">
                  <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required disabled={isLoading} className="ui-input pr-11" placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} disabled={isLoading} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-text-muted hover:text-text-primary" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button>
                </span>
              </label>
              <div className="mt-2 text-right"><Link href="/forgot-password" className="text-sm font-medium text-brand-primary hover:text-brand-primary-hover">Forgot password?</Link></div>
            </div>

            <button type="submit" disabled={isLoading} className="ui-button w-full" data-variant="primary">{isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{isLoading ? "Signing in..." : "Sign in"}</button>
          </form>

          <div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-border" /><span className="text-xs font-medium text-text-muted">or continue with</span><span className="h-px flex-1 bg-border" /></div>

          <div className="space-y-3">
            <button type="button" onClick={() => void handleOAuthSignIn("google")} disabled={isLoading} className="ui-button w-full" data-variant="secondary"><span className="font-semibold text-[#4285F4]" aria-hidden="true">G</span> Continue with Google</button>
            <button type="button" onClick={() => void handleOAuthSignIn("github")} disabled={isLoading} className="ui-button w-full" data-variant="secondary"><Github className="h-4 w-4" aria-hidden="true" /> Continue with GitHub</button>
          </div>

          <p className="mt-7 text-center text-sm text-text-secondary">Don&apos;t have an account? <Link href="/signup" className="font-semibold text-brand-primary hover:text-brand-primary-hover">Sign up</Link></p>
        </Card>
      </Container>
    </main>
  );
}
