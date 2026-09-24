"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Alert, Card } from "@/components/ui";
import { Container } from "@/components/layout";

export default function ForgotPassword() {
  return (
    <main className="min-h-[100dvh] bg-background px-4 py-10 sm:px-6 sm:py-16">
      <Container className="flex min-h-[calc(100dvh-5rem)] items-center justify-center">
        <Card className="w-full max-w-[440px] p-6 sm:p-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.08em] text-text-primary" aria-label="Habitix home">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-white"><Check className="h-4 w-4" aria-hidden="true" /></span>
              HABITIX
            </Link>
            <h1 className="mt-8 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">Password reset</h1>
            <p className="mt-2 text-sm leading-6 text-text-secondary">Password reset isn&apos;t available in V1 yet.</p>
          </div>
          <Alert tone="info" className="mt-7"><span>We&apos;re keeping the first release focused. You can continue using your account normally, and password reset will be added in a future update.</span></Alert>
          <Link href="/signin" className="ui-button mt-6 w-full no-underline" data-variant="secondary">Back to sign in</Link>
        </Card>
      </Container>
    </main>
  );
}
