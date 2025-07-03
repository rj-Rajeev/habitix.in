"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Send,
  Target,
  Clock,
  Calendar,
  Heart,
  Sparkles,
  User,
  Bot,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface Message {
  role: "system" | "user";
  text: string;
  timestamp: Date;
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
  {
    text: "What's your goal?",
    icon: Target,
    placeholder: "e.g., Learn React, Build a fitness habit...",
    type: "text",
  },
  {
    text: "When do you want to achieve it?",
    icon: Calendar,
    placeholder: "e.g., 30 days, 3 months, 6 weeks...",
    type: "text",
  },
  {
    text: "How many hours can you work on it daily?",
    icon: Clock,
    placeholder: "e.g., 1, 2, 3...",
    type: "number",
  },
  {
    text: "How many days per week can you work on it?",
    icon: Calendar,
    placeholder: "e.g., 3, 5, 7...",
    type: "number",
  },
  {
    text: "What time of day do you prefer to work?",
    icon: Clock,
    placeholder: "e.g., morning, afternoon, evening...",
    type: "text",
  },
  {
    text: "Why do you want to achieve this goal?",
    icon: Heart,
    placeholder: "Share your motivation...",
    type: "textarea",
  },
];

const createMessage = (role: "system" | "user", text: string): Message => ({
  role,
  text,
  timestamp: new Date(),
});

export default function GoalChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([
    createMessage(
      "system",
      "Hi there! 👋 I'm here to help you create a personalized roadmap for your goals. Let's start with the first question:"
    ),
  ]);
  const [input, setInput] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryData, setRetryData] = useState<GoalData | null>(null);
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Auto-focus input when component mounts or question changes
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current && !isSubmitting && !isTyping) {
        inputRef.current.focus();
      }
    };

    // Focus immediately
    focusInput();

    // Also focus after a short delay to handle any rendering delays
    const timeoutId = setTimeout(focusInput, 100);

    return () => clearTimeout(timeoutId);
  }, [currentQuestionIndex, isSubmitting, isTyping]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show first question after initial greeting
  useEffect(() => {
    if (messages.length === 1) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          createMessage("system", questions[0].text),
        ]);
      }, 1000);
    }
  }, []);

  const simulateTyping = (message: string, callback: () => void) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, createMessage("system", message)]);
      callback();
    }, 800 + Math.random() * 400);
  };

  const generateRoadmap = async (goalData: GoalData) => {
    try {
      setError(null);
      setIsSubmitting(true);

      const roadmapRes = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalData),
      });

      if (!roadmapRes.ok) {
        throw new Error(`Failed to generate roadmap: ${roadmapRes.status}`);
      }

      const { roadmap } = await roadmapRes.json();

      const roadmapWithDates = roadmap.map((dayData: any, index: number) => {
        const date = new Date();
        date.setDate(date.getDate() + index);
        return { ...dayData, dayDate: date };
      });

      const fullGoal = {
        userId: session?.user?.id,
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

      if (!saveRes.ok) {
        throw new Error(`Failed to save goal: ${saveRes.status}`);
      }

      const { id }: { id: string } = await saveRes.json();

      if (!id) throw new Error("Missing goal ID");

      setMessages((prev) => [
        ...prev,
        createMessage(
          "system",
          "🎉 Your roadmap is ready! Redirecting you to your personalized plan..."
        ),
      ]);

      setTimeout(() => {
        router.push(`/dashboard/goals/${id}`);
      }, 2000);
    } catch (error) {
      console.error("Error generating roadmap:", error);
      setError(error instanceof Error ? error.message : "Something went wrong");
      setRetryData(goalData);
      setMessages((prev) => [
        ...prev,
        createMessage(
          "system",
          "❌ Oops! There was a problem creating your roadmap. This might be due to a network issue. Don't worry - your answers are saved and you can try again!"
        ),
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    if (retryData) {
      setMessages((prev) => [
        ...prev,
        createMessage("system", "Let me try creating your roadmap again... ✨"),
      ]);
      generateRoadmap(retryData);
    }
  };

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
      simulateTyping(questions[nextIndex].text, () => {});
    } else {
      const goalData: GoalData = {
        title: updatedAnswers[0],
        duration: updatedAnswers[1],
        hoursPerDay: Number(updatedAnswers[2]) || 1,
        daysPerWeek: Number(updatedAnswers[3]) || 1,
        preferredTime: updatedAnswers[4] || "morning",
        motivation: updatedAnswers[5] || "",
      };

      simulateTyping(
        "Perfect! ✨ Let me create your personalized roadmap...",
        () => {
          generateRoadmap(goalData);
        }
      );
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden">
      {/* Header - Fixed height */}
      <div className="flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  Habitix | Roadmap Planner
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                  Let's create your roadmap
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                {currentQuestionIndex + 1} of {questions.length}
              </div>
              <div className="w-16 sm:w-24 h-1.5 sm:h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages - Scrollable area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start space-x-2 sm:space-x-3 ${
                msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : "bg-gradient-to-r from-blue-500 to-purple-500"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                ) : (
                  <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                )}
              </div>

              {/* Message */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                      : "bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line break-words">
                    {msg.text}
                  </p>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex space-x-1">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error state with retry option */}
          {error && retryData && (
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-500 flex items-center justify-center">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm border border-red-200 dark:border-red-800 max-w-[85%] sm:max-w-[75%]">
                <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                  Network error: {error}
                </p>
                <button
                  onClick={handleRetry}
                  disabled={isSubmitting}
                  className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isSubmitting ? "animate-spin" : ""}`}
                  />
                  <span>{isSubmitting ? "Retrying..." : "Try Again"}</span>
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          {/* Current Question Indicator */}
          {currentQuestionIndex < questions.length && (
            <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-blue-200 dark:border-slate-600">
              <div className="flex items-center space-x-2 mb-2">
                <currentQuestion.icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">
                  Question {currentQuestionIndex + 1}
                </span>
              </div>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium break-words">
                {currentQuestion.text}
              </p>
            </div>
          )}

          {/* Input */}
          <div className="flex items-end space-x-2 sm:space-x-3">
            <div className="flex-1 min-w-0">
              {currentQuestion?.type === "textarea" ? (
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 p-3 sm:p-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 text-sm sm:text-base"
                  placeholder={
                    currentQuestion?.placeholder || "Type your answer..."
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={isSubmitting || isTyping}
                  rows={2}
                />
              ) : (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type={currentQuestion?.type || "text"}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 p-3 sm:p-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  placeholder={
                    currentQuestion?.placeholder || "Type your answer..."
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={isSubmitting || isTyping}
                />
              )}
            </div>

            <button
              onClick={handleSend}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3 sm:p-4 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex-shrink-0"
              disabled={isSubmitting || !input.trim() || isTyping}
            >
              {isSubmitting ? (
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>

          {/* Status */}
          {isSubmitting && (
            <div className="mt-3 sm:mt-4 flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span className="text-xs sm:text-sm font-medium">
                Creating your personalized roadmap...
              </span>
            </div>
          )}

          {/* Progress Steps */}
          {currentQuestionIndex < questions.length && (
            <div className="mt-3 sm:mt-4 flex items-center justify-center space-x-1 sm:space-x-2">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                    index <= currentQuestionIndex
                      ? "bg-gradient-to-r from-blue-600 to-purple-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
