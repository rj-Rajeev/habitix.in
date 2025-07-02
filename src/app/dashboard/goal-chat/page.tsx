"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([createMessage("system", questions[0])]);
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
    setMessages((prev) => [...prev, userMessage]);
    setAnswers(updatedAnswers);
    setInput("");
    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);

    if (nextIndex < questions.length) {
      setTimeout(() => {
        setMessages((prev) => [...prev, createMessage("system", questions[nextIndex])]);
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
      setMessages((prev) => [...prev, createMessage("system", "Great! Generating your roadmap...")]);

      try {
        const roadmapRes = await fetch("/api/generate-roadmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(goalData),
        });

        if (!roadmapRes.ok) throw new Error("Roadmap generation failed");

        const { roadmap } = await roadmapRes.json();

        const roadmapWithDates = roadmap.map((dayData: any, index: number) => {
          const date = new Date();
          date.setDate(date.getDate() + index);
          return { ...dayData, dayDate: date };
        });

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
        console.error(error);
        setMessages((prev) => [
          ...prev,
          createMessage("system", "❌ Something went wrong. Please try again later."),
        ]);
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f3efff] to-[#e6f0ff] dark:from-slate-900 dark:to-slate-800">
      <div className="flex-1 overflow-y-auto p-4 md:px-10">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 text-sm max-w-[80%] md:max-w-[70%] whitespace-pre-line shadow ${
                msg.role === "user"
                  ? "bg-green-100 ml-auto text-right"
                  : "bg-white text-left"
              }`}
            >
              {msg.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="w-full border-t bg-white dark:bg-slate-900 px-4 py-3 shadow-inner">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <input
            type="text"
            className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 p-3 px-4 bg-white dark:bg-slate-800 text-sm focus:outline-none"
            placeholder="Type your answer..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isSubmitting}
          />
          <button
            onClick={handleSend}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-medium"
            disabled={isSubmitting || !input.trim()}
          >
            Send
          </button>
        </div>
        {isSubmitting && (
          <p className="text-center text-sm text-gray-400 mt-2">
            ⏳ Generating your personalized plan...
          </p>
        )}
      </div>
    </div>
  );
}
