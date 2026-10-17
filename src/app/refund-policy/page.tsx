import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Habitix",
  description: "How to request a review of a paid Habitix course refund or cancellation.",
};

export default function RefundPolicyPage() {
  return (
    <main className="px-4 py-10 text-text-primary sm:px-6 sm:py-14">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Refund &amp; Cancellation Policy</h1>
        <p className="mt-3 text-sm text-text-secondary">Last updated: October 17, 2026</p>
        <p className="mt-6 leading-7 text-text-secondary">This policy applies to paid Habitix course enrollments. Refund requests are reviewed manually on a case-by-case basis. A request does not guarantee approval, and course-access outcomes are considered individually.</p>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Request a review</h2>
          <p className="leading-7 text-text-secondary">Email <a className="font-medium text-brand-primary underline underline-offset-4 hover:text-brand-primary-hover" href="mailto:habitix.in@gmail.com">habitix.in@gmail.com</a> with the email address associated with your account, the course name, your order or payment reference if available, and a short explanation of your request.</p>
          <p className="leading-7 text-text-secondary">Do not email passwords, full card numbers, security codes, or other payment credentials. If you cannot locate a reference, explain that in your request.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Review and payment processing</h2>
          <p className="leading-7 text-text-secondary">Habitix reviews requests manually. Any decision about a refund and related course access is made case by case. Habitix does not currently provide an automated refund request or refund-processing flow through the application.</p>
          <p className="leading-7 text-text-secondary">If a refund is approved, it must be processed and tracked through the applicable payment-provider procedure. This page does not mean a refund has been initiated, and the timing depends on the provider and payment method.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Your legal rights</h2>
          <p className="leading-7 text-text-secondary">This policy does not waive or restrict rights available to you under applicable law. Where a legal right conflicts with this policy, the applicable legal right takes precedence.</p>
        </section>

        <p className="mt-8 leading-7 text-text-secondary">No fixed refund window or guaranteed approval has been established in this policy. Contact <a className="font-medium text-brand-primary underline underline-offset-4 hover:text-brand-primary-hover" href="mailto:habitix.in@gmail.com">habitix.in@gmail.com</a> to submit a request for review.</p>
      </article>
    </main>
  );
}
