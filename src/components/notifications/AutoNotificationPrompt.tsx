"use client";

import { useEffect, useState } from "react";

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

const AutoNotificationPrompt = ({ userId }: { userId?: string }) => {
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (Notification.permission !== "default" || attempted) return;

    setAttempted(true);

    Notification.requestPermission().then(async (permission) => {
      if (permission !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          userId,
          categories: ["default"],
        }),
      });
    });
  }, [userId, attempted]);

  return null; // This component is silent
};

export default AutoNotificationPrompt;
