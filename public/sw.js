self.addEventListener("push", (event) => {
    const data = event.data?.json() ?? {};
    event.waitUntil(
        self.registration.showNotification(data.title || "FromChat", {
            body:  data.body  || "",
            icon:  data.icon  || "/favicon.svg",
            badge: "/favicon.svg",
            data:  { chatId: data.chatId },
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window" }).then((list) => {
            if (list.length) return list[0].focus();
            return clients.openWindow("/");
        })
    );
});