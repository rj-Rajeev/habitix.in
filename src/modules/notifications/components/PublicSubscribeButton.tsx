

'use client';

import { useEffect, useState } from 'react';
import { urlBase64ToUint8Array } from './subscription-utils';

const PublicSubscribeButton = ({ userId }: { userId?: string }) => {
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    navigator.serviceWorker.register('/sw.js');
  }, []);

  const subscribe = async () => {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return alert('Permission not granted');

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    });

    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON(), userId, categories: ['default'] }),
    });

    setSubscribed(true);
    alert('Subscribed to notifications');
  };

  return (
    <button
      onClick={subscribe}
      disabled={subscribed}
      className="px-4 py-2 rounded bg-blue-600 text-white shadow"
    >
      {subscribed ? 'Subscribed!' : 'Enable Notifications'}
    </button>
  );
};

export default PublicSubscribeButton;
