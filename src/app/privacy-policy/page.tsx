import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Habitix",
  description: "Learn how Habitix handles account, planning, course, People, AI, and notification data.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="px-4 py-10 text-text-primary sm:px-6 sm:py-14">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-text-secondary">Last updated: October 17, 2026</p>
        <p className="mt-6 leading-7 text-text-secondary">
          This policy describes information processed when you use Habitix, including its planning, learning, People, and notification features.
        </p>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Information processed</h2>
          <p className="leading-7 text-text-secondary">Depending on the features you use, Habitix processes account name and email address, local sign-in credentials (stored by the application as a password hash), authentication-provider identifiers, profile information, goals, tasks, schedules, revision choices, notes you submit, roadmap data, and completion/progress records. Local accounts use email verification; Google and GitHub sign-in are also supported.</p>
          <p className="leading-7 text-text-secondary">Course enrollment records include course and enrollment status and payment-provider order or payment identifiers. Payments are handled through Razorpay checkout; Habitix’s application code does not collect card credentials through its own forms.</p>
          <p className="leading-7 text-text-secondary">People features process discovery settings and visible interests, connection requests and their introductory messages, chat participants, and messages you send. Web Push subscriptions may include a browser endpoint, subscription keys, expiration information, and notification categories.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">How information is used</h2>
          <p className="leading-7 text-text-secondary">Habitix uses this information to authenticate accounts, provide profile and planning features, save progress, manage course enrollment, support People and chat features, and deliver notifications you enable. Task-completion and progress summaries are used within Habitix to show your activity.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">AI-assisted roadmaps</h2>
          <p className="leading-7 text-text-secondary">When you request an AI-generated roadmap, the information used to prepare it is sent to Google Gemini through Google’s Generative Language API. This can include your goal title, planning window, schedule and capacity preferences, motivation, and optional objective, existing knowledge, focus areas, learning preference, and additional requirements. Course-based roadmaps also use course and lesson titles and identifiers.</p>
          <p className="leading-7 text-text-secondary">Do not include sensitive information that is not needed to generate your plan. Google’s handling of submitted data is governed by the applicable provider terms and settings; Habitix does not make claims here about provider retention, model improvement, or processing region.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Service providers and sharing</h2>
          <p className="leading-7 text-text-secondary">Information is processed by providers needed to operate features, including Google and GitHub for sign-in (and GitHub’s API for email verification), Google Gemini for requested roadmap generation, Razorpay for course payments, the configured email-delivery provider for verification messages, and browser/platform push services when you enable notifications. Provider-specific processing is subject to their applicable terms and privacy information.</p>
          <p className="leading-7 text-text-secondary">The application source reviewed for this policy contains internal progress analytics; it does not show a third-party analytics integration. Provider and hosting details should be confirmed against the active deployment.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Cookies and preferences</h2>
          <p className="leading-7 text-text-secondary">Habitix uses authentication session cookies through its sign-in system. It also stores a non-sensitive <code className="rounded bg-surface-subtle px-1">habitix_sidebar</code> cookie to remember whether your navigation sidebar is expanded or collapsed. The preference cookie is set for the site path, uses SameSite=Lax, and is marked Secure when used over HTTPS.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Security, retention, and deletion requests</h2>
          <p className="leading-7 text-text-secondary">Habitix uses safeguards intended to protect information, but no online service can guarantee absolute security. The application does not define one retention period for all account, planning, chat, enrollment, or operational records.</p>
          <p className="leading-7 text-text-secondary">You may request account deletion by emailing <a className="font-medium text-brand-primary underline underline-offset-4 hover:text-brand-primary-hover" href="mailto:habitix.in@gmail.com">habitix.in@gmail.com</a>. Where feasible, the intention is to delete the account and associated personal data. This is a support request, not a self-service feature currently available in the app. Requests are subject to applicable retention requirements and technical limitations. We do not promise immediate or complete removal from backups.</p>
          <p className="leading-7 text-text-secondary">Goal deletion is available in the app, but it is not the same as deleting an account or all related records. How requests affect payment/enrollment records, chat history, logs, and backups may depend on applicable requirements and operational systems.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Your questions and policy changes</h2>
          <p className="leading-7 text-text-secondary">For privacy questions or deletion requests, contact <a className="font-medium text-brand-primary underline underline-offset-4 hover:text-brand-primary-hover" href="mailto:habitix.in@gmail.com">habitix.in@gmail.com</a>. Habitix may update this policy as its practices change. The date above indicates when this version was prepared; review this page for the current version.</p>
        </section>
      </article>
    </main>
  );
}
