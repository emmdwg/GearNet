self.addEventListener("push", (event) => {
  let data = { title: "GearNet", body: "You have a new notification" };
  try {
    if (event.data) data = event.data.json();
  } catch {
    /* ignore */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.ico",
      data: { url: data.url ?? "/activity" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/activity";
  event.waitUntil(clients.openWindow(url));
});
