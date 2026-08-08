// Star Trader Signals — service worker
// Its only job is to wake for a push and put it on the lock screen.
// Nothing is cached and nothing is stored.

self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Star Trader", body: event.data ? event.data.text() : "" };
  }

  const sig = data.data || {};
  const dir = String(sig.direction || "").toUpperCase();

  // Signals are short-lived. If the phone was offline and this arrives after
  // the trade window closed, say nothing rather than send someone into a
  // trade that already expired.
  const expiry = Number(sig.expires_at || 0);
  if (expiry && Date.now() / 1000 > expiry) return;

  const options = {
    body: data.body || "",
    // Same tag = a new signal replaces the old one instead of stacking up.
    tag: "star-signal",
    renotify: true,
    requireInteraction: false,
    vibrate: dir === "BUY" ? [40, 40, 40] : [90, 50, 90],
    data: sig,
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Star Trader", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow("./");
    })
  );
});
