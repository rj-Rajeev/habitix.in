import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Help | Habitix",
  description: "Contact Habitix about account, privacy, course enrollment, payment verification, or refund requests.",
};

export default function ContactPage() {
  return (
    <main className="px-4 py-10 text-text-primary sm:px-6 sm:py-14">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact &amp; Help</h1>
        <p className="mt-6 leading-7 text-text-secondary">For support, email <a className="font-medium text-brand-primary underline underline-offset-4 hover:text-brand-primary-hover" href="mailto:habitix.in@gmail.com">habitix.in@gmail.com</a>.</p>
        <p className="mt-4 leading-7 text-text-secondary">You can contact us about:</p>
        <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-text-secondary">
          <li>Account and privacy questions, including account deletion requests.</li>
          <li>Course enrollment and access.</li>
          <li>Payment verification issues.</li>
          <li>Paid-course refund requests for manual review.</li>
        </ul>
        <p className="mt-6 leading-7 text-text-secondary">For your security, do not include your password, full payment-card details, or payment security codes in an email. Account deletion and refunds are not completed automatically in the app.</p>
      </article>
    </main>
  );
}
