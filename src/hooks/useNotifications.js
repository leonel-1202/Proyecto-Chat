import { useEffect, useRef } from "react";

export function useNotifications() {
    const permissionRef = useRef(Notification.permission);

    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
            .register("/sw.js")
            .catch(console.error);
        }
    }, []);

    const requestPermission = async () => {
        if (!("Notification" in window)) return;
        const result = await Notification.requestPermission();
        permissionRef.current = result;
        return result;
    };

    const notify = (title, body, chatId) => {
        if (document.visibilityState === "visible") return;
        if (permissionRef.current !== "granted") return;

        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: "NOTIFY",
                title,
                body,
                chatId,
            });
        } else {
            new Notification(title, { body, icon: "/favicon.svg" });
        }
    };

    return { requestPermission, notify };
}