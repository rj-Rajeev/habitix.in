self.addEventListener("push", function (event) {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || "Habitix";
  const options = {
    body: data.body || "",
    icon: "1.webp",
    badge: "next.svg",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then(function (clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        return client.focus();
      }
      return clients.openWindow("/");
    })
  );
});