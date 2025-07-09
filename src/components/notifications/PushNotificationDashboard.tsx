// Improved Push Notification Dashboard UI
// File: components/PushNotificationDashboard.tsx

"use client";

import { useEffect, useState } from "react";
import { Bell, Send, UserPlus } from "lucide-react";

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

const PushNotificationDashboard = () => {
  const [userId, setUserId] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("Habitix Alert");
  const [status, setStatus] = useState("");


  useEffect(() => {
    setCategories(["health", "focus", "reminder", "habit", "goal"]);
    navigator.serviceWorker.register("/sw.js");
  }, []);

  const subscribe = async () => {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return alert("Opps Permission not granted");

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    });

    console.log("subscription Start");

    await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: sub.toJSON(),
        userId,
        categories: selectedCategories,
      }),
    });

    setStatus("Subscribed successfully");
  };

  const send = async () => {
    await fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        category: selectedCategories[0],
        message,
        title,
      }),
    });

    setStatus("Notification sent");
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl space-y-6 border border-slate-200 dark:border-slate-700">
      <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-700 dark:text-blue-400">
        <Bell className="w-6 h-6" /> Push Notification Dashboard
      </h2>

      <input
        type="text"
        placeholder="User ID (optional)"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500"
      />

      <div className="space-y-2">
        <label className="font-semibold">Select Categories:</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`px-4 py-1.5 text-sm rounded-full transition ${
                selectedCategories.includes(cat)
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-200 text-slate-800 hover:bg-slate-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <textarea
        rows={4}
        className="w-full p-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500"
        placeholder="Notification message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <input
        type="text"
        placeholder="Notification title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex gap-4 items-center">
        <button
          onClick={subscribe}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl shadow"
        >
          <UserPlus size={18} /> Subscribe
        </button>
        <button
          onClick={send}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow"
        >
          <Send size={18} /> Send Notification
        </button>
      </div>

      {status && <p className="text-green-600 font-medium">{status}</p>}
    </div>
  );
};

export default PushNotificationDashboard;
