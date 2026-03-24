"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";

export default function ChatPage() {
  const params = useParams();
  const rawUserId = params.userId;
  const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [chatId, setChatId] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 🔹 Fetch user
  useEffect(() => {
    if (!userId) return;

    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then(setOtherUser);
  }, [userId]);

  // 🔹 Init chat
  useEffect(() => {
    if (!userId) return;

    const init = async () => {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const { chatId } = await res.json();
      setChatId(chatId);

      const msgs = await fetch(`/api/chats/${chatId}`).then((r) => r.json());
      setMessages(msgs);
    };

    init();
  }, [userId]);

  // 🔹 Socket
  useEffect(() => {
    if (!currentUserId || !userId) return;

    const socket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { userId: currentUserId },
    });

    socketRef.current = socket;

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // ✅ FIXED TYPING LOGIC (NO stopTyping)
    socket.on("typing", ({ senderId }) => {
      if (senderId?.toString() !== userId.toString()) return;

      setIsTyping(true);

      // reset timeout locally
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUserId, userId]);

  // 🔹 Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Send message
  const handleSend = async () => {
    if (!text.trim() || !chatId) return;

    const newMsg = {
      _id: Date.now(),
      text,
      senderId: currentUserId,
    };

    setMessages((prev) => [...prev, newMsg]);
    setText("");

    await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chatId, text }),
    });

    socketRef.current?.emit("sendMessage", {
      chatId,
      text,
      receiverId: userId,
    });
  };

  // 🔹 Typing emit (SIMPLIFIED)
  const handleTyping = (value: string) => {
    setText(value);

    socketRef.current?.emit("typing", {
      receiverId: userId,
    });
  };

return (
  <div className="h-[100dvh] w-full flex justify-center bg-gray-200">

    {/* Chat App Container */}
    <div className="w-full max-w-3xl h-full flex flex-col bg-white">

      {/* 🔷 Header (ALWAYS FIXED) */}
      <div className="flex py-3 items-center justify-between">
        <div className="flex-shrink-0 px-4 py-3 border-b bg-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
            {otherUser?.email?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div>
            <p className="font-semibold text-sm">
              {otherUser?.email || "User"}
            </p>

            <div className="text-xs text-gray-500 h-4 flex items-center">
              {isTyping ? (
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                </div>
              ) : (
                "Active"
              )}
            </div>
          </div>
        </div>

        <a className="px-4 py-2 text-blue-600 font-medium" href="/people">
          Back
        </a>
      </div>

      {/* 🔷 Messages (ONLY SCROLLABLE AREA) */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-100">

        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;

          return (
            <div
              key={msg._id}
              className={`flex items-end gap-2 ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              {!isMe && (
                <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                  {otherUser?.email?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}

              <div
                className={`px-4 py-2 rounded-2xl text-sm max-w-[70%] shadow ${
                  isMe
                    ? "bg-blue-500 text-white rounded-br-sm"
                    : "bg-white border rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>

              {isMe && (
                <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || "M"}
                </div>
              )}
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* 🔷 Input (ALWAYS FIXED) */}
      <div className="flex-shrink-0 border-t bg-white p-2 flex gap-2">

        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            text.trim()
              ? "bg-blue-500 text-white"
              : "bg-gray-300 text-gray-500"
          }`}
        >
          Send
        </button>
      </div>

    </div>
  </div>
);
}