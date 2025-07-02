"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { log } from "util";

interface Message {
  role: "system" | "user";
  text: string;
}

interface GoalData {
  title: string;
  duration: string;
  hoursPerDay: number;
  daysPerWeek: number;
  preferredTime: string;
  motivation: string;
}

const questions = [
  "What's your goal?",
  "When do you want to achieve it? (e.g., 30 days, 3 months)",
  "How many hours can you work on it daily?",
  "How many days per week can you work on it?",
  "What time of day do you prefer to work?",
  "Why do you want to achieve this goal? (motivation)",
];

const createMessage = (role: "system" | "user", text: string): Message => ({
  role,
  text,
});

export default function GoalChatPage() {
  const { data: session, status } = useSession();

  const [messages, setMessages] = useState<Message[]>([
    createMessage("system", questions[0]),
  ]);
  const [input, setInput] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = createMessage("user", input);
    const updatedAnswers = [...answers, input];

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setAnswers(updatedAnswers);
    setInput("");

    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);

    if (nextIndex < questions.length) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          createMessage("system", questions[nextIndex]),
        ]);
      }, 400);
    } else {
      const goalData: GoalData = {
        title: updatedAnswers[0],
        duration: updatedAnswers[1],
        hoursPerDay: Number(updatedAnswers[2]) || 1,
        daysPerWeek: Number(updatedAnswers[3]) || 1,
        preferredTime: updatedAnswers[4] || "morning",
        motivation: updatedAnswers[5] || "",
      };

      setIsSubmitting(true);

      setMessages((prev) => [
        ...prev,
        createMessage("system", "Great! Generating your roadmap..."),
      ]);

      try {
        const roadmapRes = await fetch("/api/generate-roadmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(goalData),
        });

        if (!roadmapRes.ok) throw new Error("Roadmap generation failed");

        const { roadmap } = await roadmapRes.json();
        function addDatesToRoadmap(roadmap: any[], startDateStr: string) {
          const startDate = new Date(startDateStr);

          return roadmap.map((dayData, index) => {
            const dayOffset = index; // dayNumber starts from 1, index from 0
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + dayOffset);

            return {
              ...dayData,
              dayDate: currentDate, // YYYY-MM-DD
            };
          });
        }

        // Example usage:

        const roadmapWithDates = addDatesToRoadmap(roadmap, "2025-06-29");
        console.log(roadmapWithDates);

        const fullGoal = {
          userId: session?.user.id,
          title: goalData.title,
          description: "",
          hoursPerDay: goalData.hoursPerDay,
          daysPerWeek: goalData.daysPerWeek,
          preferredTime: goalData.preferredTime,
          motivation: goalData.motivation,
          startDate: new Date(),
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "in_progress",
          roadmap: roadmapWithDates,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const saveRes = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fullGoal),
        });

        const { id }: { id: string } = await saveRes.json();
        if (!id) throw new Error("Missing goal ID");

        router.push(`/dashboard/goals/${id}`);
      } catch (error) {
        console.error("Generation failed:", error);
        setMessages((prev) => [
          ...prev,
          createMessage(
            "system",
            "❌ Something went wrong. Please try again later."
          ),
        ]);
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-900 dark:to-slate-800 p-6 flex flex-col items-center">
      <div className="w-full max-w-xl bg-white/40 dark:bg-slate-700/40 backdrop-blur-md rounded-xl shadow-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold text-center">🎯 Set Your Goal</h2>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg max-w-[80%] ${
                msg.role === "system"
                  ? "bg-indigo-100 text-left"
                  : "bg-green-100 text-right ml-auto"
              }`}
            >
              {msg.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {currentQuestionIndex < questions.length && !isSubmitting && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-1 p-2 rounded-md border border-gray-300 dark:bg-slate-800"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your answer..."
            />
            <button
              onClick={handleSend}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md"
            >
              Send
            </button>
          </div>
        )}

        {isSubmitting && (
          <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
            ⏳ Generating your personalized plan...
          </div>
        )}
      </div>
    </div>
  );
}
