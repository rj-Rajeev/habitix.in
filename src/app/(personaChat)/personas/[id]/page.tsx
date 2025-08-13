"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"

interface IPersona {
  _id: string
  name: string
  avatarEmoji?: string
  systemPrompt?: string
}

interface ChatMessage {
  _id?: string
  role: "user" | "assistant"
  content: string
}

function CustomButton({
  children,
  onClick,
  disabled = false,
  variant = "default",
  size = "default",
  className = "",
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: "default" | "ghost"
  size?: "default" | "icon"
  className?: string
}) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    ghost: "hover:bg-gray-100 text-gray-700",
  }
  const sizeClasses = {
    default: "h-10 px-4 py-2",
    icon: "h-10 w-10",
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  )
}

function CustomCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>{children}</div>
}

function CustomAvatar({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>{children}</div>
}

function AvatarFallback({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex h-full w-full items-center justify-center rounded-full bg-gray-100 ${className}`}>
      {children}
    </div>
  )
}

function ArrowLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}

function LoaderIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m18 6-12 12" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function TypewriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, 25) // Typing speed
      return () => clearTimeout(timer)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, onComplete])

  useEffect(() => {
    setDisplayedText("")
    setCurrentIndex(0)
  }, [text])

  return (
    <span>
      {displayedText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

function ThinkingIndicator({ stage }: { stage: "thinking" | "processing" | "generating" | "finalizing" }) {
  const [dots, setDots] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const messages = {
    thinking: "🤔 Thinking",
    processing: "⚡ Processing your request",
    generating: "✨ Generating response",
    finalizing: "🎯 Almost ready",
  }

  return (
    <div className="flex justify-start animate-in slide-in-from-left-2 duration-300">
      <CustomCard className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md max-w-xs">
        <div className="flex items-center gap-2 text-gray-600">
          <LoaderIcon />
          <span className="text-sm font-medium">
            {messages[stage]}
            {dots}
          </span>
        </div>
      </CustomCard>
    </div>
  )
}

export default function PersonaChatPage() {
  const params = useParams()
  const router = useRouter()
  const personaId = params?.id as string

  const [persona, setPersona] = useState<IPersona | null>(null)
  const [personas, setPersonas] = useState<IPersona[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [thinkingStage, setThinkingStage] = useState<"thinking" | "processing" | "generating" | "finalizing">(
    "thinking",
  )
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading, isTyping])

  // Fetch persona info
  useEffect(() => {
    fetch(`/api-v2/personas/${personaId}`)
      .then((res) => res.json())
      .then((data) => setPersona(data.persona))
  }, [personaId])

  useEffect(() => {
    fetch("/api-v2/personas")
      .then((res) => res.json())
      .then((data) => setPersonas(data.personas || []))
      .catch(() => setPersonas([]))
  }, [])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage: ChatMessage = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)
    setThinkingStage("thinking")

    setTimeout(() => setThinkingStage("processing"), 800)
    setTimeout(() => setThinkingStage("generating"), 1800)
    setTimeout(() => setThinkingStage("finalizing"), 2600)

    try {
      const res = await fetch(`/api-v2/chat/${personaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      })
      const data = await res.json()

      setLoading(false)
      setIsTyping(true)

      // Add message with typewriter effect
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }])
    } catch (error) {
      setLoading(false)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ])
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Personas</h2>
            <CustomButton variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <CloseIcon />
            </CustomButton>
          </div>

          {/* Personas List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {personas.map((p) => (
              <div
                key={p._id}
                onClick={() => {
                  router.push(`/personas/${p._id}`)
                  setSidebarOpen(false)
                }}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  p._id === personaId ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                }`}
              >
                {p.avatarEmoji?.startsWith("http") ? (
                  <img
                    src={p.avatarEmoji}
                    alt="Avatar"
                    className="w-16 h-16 object-cover rounded-full"
                  />
                ) : (
                  p.avatarEmoji || "👤"
                )}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium truncate ${p._id === personaId ? "text-blue-900" : "text-gray-900"}`}>
                    {p.name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {p.systemPrompt ? p.systemPrompt.slice(0, 50) + "..." : "AI Assistant"}
                  </p>
                </div>
                {p._id === personaId && <div className="h-2 w-2 bg-blue-500 rounded-full"></div>}
              </div>
            ))}

            {personas.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No personas found</p>
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            <CustomButton
              onClick={() => router.push("/personas")}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              Manage Personas
            </CustomButton>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <CustomCard className="sticky top-0 z-10 border-b border-gray-200/50 backdrop-blur-sm bg-white/90 rounded-none shadow-sm">
          <div className="flex items-center gap-4 p-4">
            <CustomButton
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden hover:bg-gray-100/80"
            >
              <MenuIcon />
            </CustomButton>

            <CustomButton
              variant="ghost"
              size="icon"
              onClick={() => router.push("/personas")}
              className="hover:bg-gray-100/80 hidden lg:flex"
            >
              <ArrowLeftIcon />
            </CustomButton>

              {persona?.avatarEmoji?.startsWith("http") ? (
                <img
                  src={persona.avatarEmoji}
                  alt="Avatar"
                  className="w-16 h-16 object-cover rounded-full"
                />
              ) : (
                persona?.avatarEmoji || "👤"
              )}

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{persona?.name || "Loading..."}</h1>
              <p className="text-sm text-gray-500 font-medium">AI Assistant</p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-200">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-700 font-medium">Online</span>
            </div>
          </div>
        </CustomCard>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in-50 duration-500">
               {persona?.avatarEmoji?.startsWith("http") ? (
                  <img
                    src={persona?.avatarEmoji}
                    alt="Avatar"
                    className="w-16 h-16 object-cover rounded-full"
                  />
                ) : (
                  persona?.avatarEmoji || "👤"
                )}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">Start a conversation with {persona?.name}</h3>
                <p className="text-gray-600 max-w-md">Ask me anything! I'm here to help you with whatever you need.</p>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${
                m.role === "user" ? "justify-end" : "justify-start"
              } animate-in slide-in-from-bottom-3 duration-400`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {m.role === "assistant" && (
              persona?.avatarEmoji?.startsWith("http") ? (
                  <img
                    src={persona?.avatarEmoji}
                    alt="Avatar"
                    className="w-16 h-16 object-cover rounded-full"
                  />
                ) : (
                  persona?.avatarEmoji || "👤"
                )
              )}

              <CustomCard
                className={`px-4 py-3 max-w-[85%] sm:max-w-md break-words shadow-sm border-none transition-all duration-200 hover:shadow-md ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl rounded-br-md"
                    : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 rounded-2xl rounded-bl-md border border-gray-200"
                }`}
              >
                {m.role === "assistant" && i === messages.length - 1 && isTyping ? (
                  <div className="text-sm leading-relaxed font-medium">
                    <TypewriterText text={m.content} onComplete={() => setIsTyping(false)} />
                  </div>
                ) : (
                  <span className="text-sm leading-relaxed font-medium">{m.content}</span>
                )}
              </CustomCard>

              {m.role === "user" && (
                <CustomAvatar className="h-8 w-8 mt-1 ring-1 ring-blue-200">
                  <AvatarFallback className="text-sm bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-semibold">
                    You
                  </AvatarFallback>
                </CustomAvatar>
              )}
            </div>
          ))}

          {loading && <ThinkingIndicator stage={thinkingStage} />}

          <div ref={messagesEndRef} />
        </div>

        <CustomCard className="sticky bottom-0 border-t border-gray-200/50 backdrop-blur-sm bg-white/90 rounded-none shadow-lg">
          <div className="p-4">
            <div className="flex items-end gap-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200 shadow-inner">
              <div className="flex-1 min-h-[40px] max-h-32">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Type your message..."
                  className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed placeholder:text-gray-500 font-medium"
                  rows={1}
                  style={{
                    height: "auto",
                    minHeight: "24px",
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = "auto"
                    target.style.height = target.scrollHeight + "px"
                  }}
                  disabled={loading}
                />
              </div>

              <CustomButton
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                size="icon"
                className="h-12 w-12 rounded-xl shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? <LoaderIcon /> : <SendIcon />}
              </CustomButton>
            </div>

            <p className="text-xs text-gray-500 mt-3 text-center font-medium">
              Press Enter to send • Shift + Enter for new line
            </p>
          </div>
        </CustomCard>
      </div>
    </div>
  )
}
