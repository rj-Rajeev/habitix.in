"use client";

import { useEffect, useState } from "react";

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

const subscribeWithTimeout = async (
  reg: ServiceWorkerRegistration
): Promise<PushSubscription> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Subscription timeout after 5s")), 5000);

    reg.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })
      .then((sub) => {
        clearTimeout(timeout);
        resolve(sub);
      })
      .catch((err) => {
        clearTimeout(timeout);
        reject(err);
      });
  });
};

const AutoNotificationPrompt = ({ userId }: { userId?: string }) => {
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    navigator.serviceWorker.register("/sw.js");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || Notification.permission !== "default" || attempted) return;

    setAttempted(true);

    const subscribe = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const reg = await navigator.serviceWorker.ready;
        const existingSub = await reg.pushManager.getSubscription();
        const sub = existingSub || await subscribeWithTimeout(reg);

        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: sub.toJSON(),
            userId,
            categories: ["default"],
          }),
        });
      } catch (error) {
        console.error("AutoNotification subscription error:", error);
      }
    };

    subscribe();
  }, [userId, attempted]);

  return null;
};

export default AutoNotificationPrompt;
