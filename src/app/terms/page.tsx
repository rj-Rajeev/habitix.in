import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Habitix",
  description: "Read the terms for using Habitix planning, learning, and community features.",
};

export default function TermsPage() {
  return (
    <main className="px-4 py-10 text-text-primary sm:px-6 sm:py-14">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
        <p className="mt-3 text-sm text-text-secondary">Last updated: October 17, 2026</p>
        <p className="mt-6 leading-7 text-text-secondary">These terms describe use of Habitix, a service for personal planning, goals, tasks, AI-assisted roadmaps, course learning, progress tracking, and optional People and notification features.</p>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Accounts and responsible use</h2>
          <p className="leading-7 text-text-secondary">Provide accurate account information and keep your sign-in credentials secure. You are responsible for activity performed through your account. Use Habitix lawfully and do not attempt to disrupt the service, bypass access controls, interfere with another person’s account, or misuse the People and chat features.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Information and AI-generated plans</h2>
          <p className="leading-7 text-text-secondary">You are responsible for the goals, notes, messages, and other information you submit. Submit only information you are entitled to provide. Habitix processes submitted information to provide the requested features, including sending relevant roadmap inputs to Google Gemini as described in the <a className="font-medium text-brand-primary underline underline-offset-4 hover:text-brand-primary-hover" href="/privacy-policy">Privacy Policy</a>.</p>
          <p className="leading-7 text-text-secondary">AI-generated roadmaps and recommendations may be incomplete or unsuitable for your circumstances. Review and adjust them before relying on them. They are planning assistance, not professional advice.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Courses and payments</h2>
          <p className="leading-7 text-text-secondary">Course descriptions, prices, and enrollment options are presented on the relevant course page. Paid course checkout is handled through Razorpay. Enrollment access is activated after the application confirms payment. Course access is subject to the course offering and enrollment information shown to you.</p>
          <p className="leading-7 text-text-secondary">Refund requests for paid courses are handled under the <a className="font-medium text-brand-primary underline underline-offset-4 hover:text-brand-primary-hover" href="/refund-policy">Refund &amp; Cancellation Policy</a>. Nothing in these terms limits rights that cannot be excluded under applicable law.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Content and intellectual property</h2>
          <p className="leading-7 text-text-secondary">You retain responsibility for content you submit. You permit Habitix to store and process that content as needed to provide the features you use, including displaying it to you and generating requested plans. Course materials and other content may be subject to rights held by their respective owners; do not copy or redistribute content unless you have permission or applicable law allows it.</p>
          <p className="leading-7 text-text-secondary">The Habitix name and service materials are not transferred to you by using the service. Ownership and licensing questions remain subject to applicable law and any terms presented with specific content.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Availability and access</h2>
          <p className="leading-7 text-text-secondary">Features may change, be unavailable, or be maintained from time to time. Habitix does not promise uninterrupted availability. Access may be restricted where reasonably necessary to protect users or the service, address misuse, or comply with legal requirements.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Legal rights and contact</h2>
          <p className="leading-7 text-text-secondary">These terms do not remove consumer or other rights that applicable law does not allow a service to exclude. For questions, contact <a className="font-medium text-brand-primary underline underline-offset-4 hover:text-brand-primary-hover" href="mailto:habitix.in@gmail.com">habitix.in@gmail.com</a>.</p>
        </section>
      </article>
    </main>
  );
}
