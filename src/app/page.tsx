import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Compass, ListChecks, Sparkles, Target, TrendingUp } from "lucide-react";
import AutoNotificationPrompt from "@/components/notifications/AutoNotificationPrompt";
import CourseDiscovery from "@/components/courses/CourseDiscovery";
import { Badge, Card } from "@/components/ui";
import { Container, SectionHeader } from "@/components/layout";

const steps = [
  { number: "01", icon: Compass, title: "Set your direction", description: "Turn a goal into a practical roadmap." },
  { number: "02", icon: ListChecks, title: "Execute today", description: "Focus on the tasks that matter today." },
  { number: "03", icon: TrendingUp, title: "Keep progressing", description: "Track completion and build consistency over time." },
];

const capabilities = [
  { icon: Target, title: "Goals & Roadmaps", description: "Turn bigger goals into structured actions." },
  { icon: CheckCircle2, title: "Daily Execution", description: "See what matters today and complete it without unnecessary complexity." },
  { icon: TrendingUp, title: "Progress", description: "Understand what you have completed and how consistently you are moving forward." },
  { icon: Sparkles, title: "AI Guidance", description: "Use AI where it is useful for planning, suggestions, and roadmap generation.", ai: true },
];

function ProductPreview() {
  return (
    <div className="w-full max-w-xl rounded-container border border-border bg-surface p-4 shadow-[var(--shadow-md)] sm:p-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-white"><Check className="h-4 w-4" aria-hidden="true" /></span><span className="font-semibold tracking-[0.04em] text-text-primary">HABITIX</span></div>
        <Badge tone="success">Today</Badge>
      </div>
      <div className="grid gap-5 pt-5 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Today overview</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">Good morning.</h3>
          <p className="mt-1 text-sm text-text-secondary">Here is what moves your goals forward today.</p>
          <div className="mt-5 space-y-2">
            {[["Review product notes", true], ["Complete a focused workout", true], ["Read 10 pages", false]].map(([task, complete]) => (
              <div key={task as string} className="flex items-center gap-3 rounded-control border border-border bg-surface-subtle px-3 py-3 text-sm">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${complete ? "border-brand-primary bg-brand-primary text-white" : "border-border-strong bg-surface"}`}>{complete && <Check className="h-3.5 w-3.5" aria-hidden="true" />}</span>
                <span className={complete ? "text-text-secondary line-through" : "font-medium text-text-primary"}>{task as string}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Card variant="subtle" className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">Daily progress</p><p className="mt-2 text-3xl font-semibold text-text-primary">On track</p></div><TrendingUp className="h-5 w-5 text-brand-primary" aria-hidden="true" /></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-border"><div className="h-full w-2/3 rounded-full bg-brand-primary" /></div></Card>
          <Card variant="outlined" className="mt-3 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><Target className="h-4 w-4 text-brand-primary" aria-hidden="true" /> Build a writing habit</div><p className="mt-2 text-sm text-text-secondary">Roadmap in progress</p><div className="mt-3 flex gap-1.5" aria-label="Roadmap progress"><span className="h-2 flex-1 rounded-full bg-brand-primary" /><span className="h-2 flex-1 rounded-full bg-brand-primary" /><span className="h-2 flex-1 rounded-full bg-border" /></div></Card>
        </div>
      </div>
    </div>
  );
}

export default function HabitixLanding() {
  return (
    <>
      <main className="overflow-hidden">
        <section className="border-b border-border bg-background"><Container className="grid min-h-[calc(100vh-80px)] items-center gap-12 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:py-24"><div className="max-w-xl"><Badge tone="neutral">Personal growth, made practical.</Badge><h1 className="mt-6 max-w-lg text-5xl font-semibold leading-[1.05] tracking-tight text-text-primary sm:text-6xl">Build yourself,<br />one day at a time.</h1><p className="mt-6 max-w-lg text-base leading-7 text-text-secondary sm:text-lg">Habitix turns goals into practical daily actions, helps you stay consistent, and makes progress easier to understand.</p><div className="mt-8 flex flex-wrap items-center gap-3"><Link href="/signup" className="ui-button no-underline" data-variant="primary">Get Started <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="#how-it-works" className="ui-button no-underline" data-variant="secondary">Explore Habitix</Link></div></div><div className="lg:justify-self-end"><ProductPreview /></div></Container></section>

        <section id="how-it-works" className="bg-surface py-20 sm:py-28"><Container><SectionHeader title="How Habitix works" description="A simple path from intention to steady progress." /><div className="mt-12 grid gap-8 md:grid-cols-3">{steps.map(({ number, icon: Icon, title, description }) => <div key={number} className="border-l-2 border-brand-primary-soft pl-5"><div className="flex items-center gap-3"><span className="text-xs font-semibold tracking-[0.12em] text-brand-primary">{number}</span><Icon className="h-5 w-5 text-brand-primary" aria-hidden="true" /></div><h3 className="mt-5 text-lg font-semibold text-text-primary">{title}</h3><p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p></div>)}</div></Container></section>

        <section className="bg-surface-subtle py-20 sm:py-28"><Container><SectionHeader title="Core Habitix capabilities" description="The essential pieces for making personal growth practical." /><div className="mt-12 grid gap-px overflow-hidden rounded-container border border-border bg-border sm:grid-cols-2">{capabilities.map(({ icon: Icon, title, description, ai }) => <div key={title} className="bg-surface p-6 sm:p-8"><Icon className={`h-5 w-5 ${ai ? "text-ai-primary" : "text-brand-primary"}`} aria-hidden="true" /><h3 className="mt-5 text-lg font-semibold text-text-primary">{title}{ai && <Badge tone="ai" className="ml-2 align-middle">AI</Badge>}</h3><p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">{description}</p></div>)}</div></Container></section>

        <CourseDiscovery />

        <section className="bg-brand-primary-soft py-20 sm:py-24"><Container className="text-center"><h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">Start building your next version.</h2><p className="mx-auto mt-4 max-w-lg text-base leading-7 text-text-secondary">Choose one meaningful direction, then make today count.</p><Link href="/signup" className="ui-button mt-7 no-underline" data-variant="primary">Get Started <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Container></section>
      </main>
      <AutoNotificationPrompt />
    </>
  );
}
