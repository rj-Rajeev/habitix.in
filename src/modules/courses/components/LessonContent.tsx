import {
  ExternalLink,
  FileText,
  LockKeyhole,
  Play,
} from "lucide-react";
import type { CourseLesson } from "@/modules/courses/components/course-learning.types";
import type { ReactNode } from "react";

export default function LessonContent({
  lesson,
  hasAccess,
  onEnroll,
  enrolling,
}: {
  lesson: CourseLesson;
  hasAccess: boolean;
  onEnroll: () => void;
  enrolling: boolean;
}) {
  const previewContent =
    lesson.markdownContent ||
    lesson.description ||
    "This lesson is ready to explore. Enroll to access the complete lesson.";
  const videoUrl = getSafeWebUrl(lesson.videoUrl);
  const youtubeUrl = videoUrl && isYouTubeUrl(videoUrl) ? videoUrl : null;
  const pdfUrl = getSafeWebUrl(lesson.pdfUrl);

  return (
    <>
      <header className="mb-7 min-w-0">
        <h1 className="break-words text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          {lesson.title}
        </h1>
        <p className="mt-3 max-w-3xl break-words text-base leading-7 text-text-secondary">
          {lesson.description || "Work through this lesson at your own pace."}
        </p>
      </header>
      <article className="lesson-prose min-w-0 break-words">
        {hasAccess ? (
          lesson.markdownContent ? (
            <MarkdownContent content={lesson.markdownContent} />
          ) : (
            <p className="text-base leading-8 text-text-secondary">
              {previewContent}
            </p>
          )
        ) : (
          <div className="relative h-[420px] overflow-hidden">
            <div className="relative z-0">
              {lesson.markdownContent ? (
                <MarkdownContent content={previewContent} />
              ) : (
                <p className="text-base leading-8 text-text-secondary">
                  {previewContent}
                </p>
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-1 pt-24">
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-background via-background/95 to-transparent" />
              <div className="relative rounded-container border border-border bg-surface p-5 shadow-[var(--shadow-sm)]">
                <LockKeyhole
                  className="h-5 w-5 text-text-muted"
                  aria-hidden="true"
                />
                <h3 className="mt-3 text-base font-semibold text-text-primary">
                  Continue with enrollment
                </h3>
                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  Enroll to access the full lesson and learning materials.
                </p>
                <button
                  type="button"
                  onClick={onEnroll}
                  disabled={enrolling}
                  className="ui-button mt-4"
                  data-variant="primary"
                >
                  {enrolling ? "Preparing enrollment..." : "Enroll now"}
                </button>
              </div>
            </div>
          </div>
        )}
      </article>
      {!hasAccess ? (
        (youtubeUrl || pdfUrl) && (
          <section className="mt-8 rounded-control border border-border bg-surface-subtle px-4 py-3 text-sm text-text-secondary">
            <h3 className="font-semibold text-text-primary">
              References &amp; Further Learning
            </h3>
            <ul className="mt-2 space-y-2">
              {youtubeUrl && (
                <li className="flex items-center gap-2">
                  <Play className="h-4 w-4" aria-hidden="true" />
                  YouTube resource — available after enrollment
                </li>
              )}
              {pdfUrl && (
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  PDF resource — available after enrollment
                </li>
              )}
            </ul>
          </section>
        )
      ) : (
        (youtubeUrl || pdfUrl) && (
          <section
            className="mt-8 rounded-container border border-border bg-surface-subtle p-5"
            aria-labelledby="lesson-resources-heading"
          >
            <h3
              id="lesson-resources-heading"
              className="text-base font-semibold text-text-primary"
            >
              References &amp; Further Learning
            </h3>
            <ul className="mt-3 space-y-3">
              {youtubeUrl && (
                <li>
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-brand-primary hover:text-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  >
                    <Play className="h-4 w-4" aria-hidden="true" />
                    Watch on YouTube
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
              )}
              {pdfUrl && (
                <li>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-brand-primary hover:text-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    Open PDF resource
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
              )}
            </ul>
          </section>
        )
      )}
    </>
  );
}

function getSafeWebUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return !url.username &&
      !url.password &&
      (url.protocol === "https:" || url.protocol === "http:")
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function isYouTubeUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return (
      hostname === "youtu.be" ||
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtube-nocookie.com" ||
      hostname.endsWith(".youtube-nocookie.com")
    );
  } catch {
    return false;
  }
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let codeLines: string[] | null = null;
  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(
      <ul
        key={`list-${blocks.length}`}
        className="my-5 list-disc space-y-2 pl-5"
      >
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (/^```/.test(trimmed)) {
      if (codeLines === null) {
        flushList();
        codeLines = [];
      } else {
        blocks.push(
          <pre
            key={`code-${index}`}
            className="my-5 overflow-x-auto rounded-control bg-surface-subtle p-4 text-sm text-text-primary"
          >
            <code>{codeLines.join("\n")}</code>
          </pre>,
        );
        codeLines = null;
      }
      return;
    }
    if (codeLines !== null) {
      codeLines.push(line);
      return;
    }
    if (!trimmed) {
      flushList();
      return;
    }
    const listMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (listMatch) {
      listItems.push(listMatch[1]);
      return;
    }
    flushList();
    const heading = trimmed.match(/^(#{1,3})\s+(.+)/);
    if (heading) {
      const Tag =
        heading[1].length === 1 ? "h3" : heading[1].length === 2 ? "h4" : "h5";
      blocks.push(
        <Tag
          key={`heading-${index}`}
          className="mt-8 text-xl font-semibold text-text-primary first:mt-0"
        >
          {renderInline(heading[2])}
        </Tag>,
      );
      return;
    }
    blocks.push(
      <p
        key={`paragraph-${index}`}
        className="mt-5 text-base leading-8 text-text-secondary first:mt-0"
      >
        {renderInline(trimmed)}
      </p>,
    );
  });
  const remainingCodeLines = codeLines as string[] | null;
  if (remainingCodeLines !== null) {
    blocks.push(
      <pre
        key={`code-${blocks.length}`}
        className="my-5 overflow-x-auto rounded-control bg-surface-subtle p-4 text-sm text-text-primary"
      >
        <code>{remainingCodeLines.join("\n")}</code>
      </pre>,
    );
  }
  flushList();
  return <div>{blocks}</div>;
}

function renderInline(text: string) {
  const tokens = text
    .split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^\s)]+\))/g)
    .filter(Boolean);
  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**"))
      return <strong key={index}>{token.slice(2, -2)}</strong>;
    if (token.startsWith("`") && token.endsWith("`"))
      return (
        <code
          key={index}
          className="rounded bg-surface-subtle px-1.5 py-0.5 text-sm text-text-primary"
        >
          {token.slice(1, -1)}
        </code>
      );
    const link = token.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
    if (link)
      return (
        <a
          key={index}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-primary underline"
        >
          {link[1]}
        </a>
      );
    return <span key={index}>{token}</span>;
  });
}
