import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  ListChecks,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { Container, SectionHeader } from "@/components/layout";

export const metadata: Metadata = {
  title: "Features | Habitix",
  description:
    "Explore Habitix tools for turning goals into structured plans, daily actions, and visible progress.",
};

const capabilities = [
  {
    icon: Target,
    title: "Goals and roadmaps",
    description:
      "Create goals and organize them into practical tasks, with plans you can build yourself, generate with AI, or connect to a course.",
  },
  {
    icon: Sparkles,
    title: "AI-assisted planning",
    description:
      "Generate a suggested roadmap from your goal, then review and adjust the plan to fit your needs.",
    ai: true,
  },
  {
    icon: CheckCircle2,
    title: "Daily task execution",
    description:
      "Use Today to focus on scheduled and overdue work, complete tasks, and manage revisions in one place.",
  },
  {
    icon: RefreshCw,
    title: "Flexible revisions",
    description:
      "Schedule a task for another review when you need more practice, and keep that revision in your task flow.",
  },
  {
    icon: TrendingUp,
    title: "Progress and activity",
    description:
      "Review goal task completion, course lesson progress, and activity history to understand how your plan is moving.",
  },
  {
    icon: MessageCircle,
    title: "People and conversations",
    description:
      "Discover people who choose to share interests, send a connection request, and chat after it is accepted.",
  },
];

const steps = [
  {
    number: "01",
    icon: Compass,
    title: "Choose a direction",
    description:
      "Set a personal goal or browse courses to find a learning direction that works for you.",
  },
  {
    number: "02",
    icon: ListChecks,
    title: "Make progress in small steps",
    description:
      "Follow a roadmap through manageable tasks, or work through course lessons at your pace.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Review and adjust",
    description:
      "Record completed work, check your progress, and revise your plan as you go.",
  },
];

export default function FeaturesPage() {
  return (
    <main>
      <section className="border-b border-border bg-background">
        <Container className="grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] lg:gap-16 lg:py-24">
          <div className="max-w-2xl">
            <Badge tone="success">A practical path from goals to progress</Badge>
            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Turn what matters into your next steps.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
              Habitix helps you shape goals into manageable plans, focus on
              daily tasks, and see the progress you record along the way.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="ui-button no-underline" data-variant="primary">
                Get Started <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/courses" className="ui-button no-underline" data-variant="secondary">
                Explore Courses <BookOpen className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <Card variant="outlined" className="relative overflow-hidden p-6 sm:p-8">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-primary-soft" aria-hidden="true" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-control bg-brand-primary-soft text-brand-primary">
                  <Target className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Your direction</p>
                  <p className="mt-1 font-semibold text-text-primary">A goal, shaped into a plan</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {["Break it into tasks", "Focus on what is next", "Review your progress"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-control border border-border bg-surface px-3 py-3">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${index === 0 ? "bg-brand-primary text-white" : "bg-surface-subtle text-text-secondary"}`}>
                      {index === 0 ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : `0${index + 1}`}
                    </span>
                    <span className="text-sm font-medium text-text-primary">{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-text-secondary">
                A flexible workflow for planning and follow-through—your goals
                and pace remain your own.
              </p>
            </div>
          </Card>
        </Container>
      </section>

      <section className="bg-surface py-16 sm:py-20">
        <Container>
          <SectionHeader
            title="Tools for the way you make progress"
            description="Bring planning, daily execution, learning, and reflection into one place."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, description, ai }) => (
              <Card key={title} variant="outlined" className="h-full p-5 sm:p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-control bg-brand-primary-soft text-brand-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 flex flex-wrap items-center gap-2 font-semibold text-text-primary">
                  {title}
                  {ai && <Badge tone="ai">AI suggestions</Badge>}
                </h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
              </Card>
            ))}
          </div>
          <p className="mt-5 text-xs leading-5 text-text-muted">
            AI-generated plans are suggestions for you to review, not a guarantee of results or professional advice.
          </p>
        </Container>
      </section>

      <section className="border-y border-border bg-surface-subtle py-16 sm:py-20">
        <Container>
          <SectionHeader
            title="How Habitix works"
            description="A simple cycle you can adapt as your goals change."
          />
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {steps.map(({ number, icon: Icon, title, description }) => (
              <div key={number} className="border-l-2 border-brand-primary-soft pl-5">
                <div className="flex items-center gap-3 text-brand-primary">
                  <span className="text-xs font-semibold tracking-[0.12em]">{number}</span>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-semibold text-text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-surface py-16 sm:py-20" aria-labelledby="learning-heading">
        <Container className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="max-w-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-control bg-brand-primary-soft text-brand-primary">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 id="learning-heading" className="mt-4 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
              Learn with courses, one lesson at a time.
            </h2>
            <p className="mt-3 text-sm leading-7 text-text-secondary sm:text-base">
              Browse published courses, explore their curricula, and follow
              lessons at your pace. Free lessons are available where marked;
              paid courses offer enrollment to unlock their protected content.
            </p>
          </div>
          <Link href="/courses" className="ui-button w-fit no-underline" data-variant="secondary">
            Browse Courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Container>
      </section>

      <section className="border-t border-border bg-brand-primary-soft py-16 sm:py-20">
        <Container className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
            Start with one meaningful next step.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-text-secondary">
            Choose a goal or explore a course, then make a plan that fits your life.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="ui-button no-underline" data-variant="primary">
              Get Started <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/courses" className="ui-button no-underline" data-variant="secondary">
              Explore Courses
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
