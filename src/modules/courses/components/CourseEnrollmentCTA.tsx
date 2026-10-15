"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import { enrollInCourse } from "@/modules/courses/client/enroll-client";

export default function CourseEnrollmentCTA({
  courseId,
  courseTitle,
  overviewHref,
  firstLessonHref,
}: {
  courseId: string;
  courseTitle: string;
  overviewHref: string;
  firstLessonHref: string | null;
}) {
  const router = useRouter();
  const { status } = useSession();
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  async function handleEnrollment() {
    if (status === "unauthenticated") {
      await signIn(undefined, { callbackUrl: overviewHref });
      return;
    }
    if (status !== "authenticated" || enrolling) return;

    setEnrolling(true);
    setError("");
    try {
      await enrollInCourse(courseId, courseTitle);
      if (firstLessonHref) router.push(firstLessonHref);
      else setComplete(true);
    } catch (enrollmentError) {
      setError(enrollmentError instanceof Error ? enrollmentError.message : "Unable to enroll right now.");
    } finally {
      setEnrolling(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleEnrollment()}
        disabled={status === "loading" || enrolling}
        className="ui-button mt-5 w-full"
        data-variant="primary"
      >
        {enrolling ? "Preparing enrollment..." : status === "unauthenticated" ? "Sign in to enroll" : "Enroll now"}
        {!enrolling && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </button>
      {error && <p className="mt-3 text-sm text-text-secondary" role="alert">{error}</p>}
      {complete && <p className="mt-3 text-sm text-text-secondary" role="status">You are enrolled. Lessons are being prepared.</p>}
    </div>
  );
}
