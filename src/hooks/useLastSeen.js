import { useState, useEffect, useCallback } from "react";
import socket from "../socket";

// Formatea el timestamp en texto legible
export function formatLastSeen(ts) {
  if (!ts) return null;
  const date  = new Date(ts);
  const now   = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);

  if (diffMin < 1)  return "en línea hace un momento";
  if (diffMin < 60) return `visto hace ${diffMin} min`;
  if (diffH < 24) {
    const t = date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    return `visto hoy a las ${t}`;
  }
  if (diffH < 48) {
    const t = date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    return `visto ayer a las ${t}`;
  }
  return `visto el ${date.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}`;
}

// phone → { lastSeen: Date, online: bool }
const lastSeenMap = new Map();

export function useLastSeen() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onOnline = ({ phone }) => {
      lastSeenMap.set(phone, { online: true, lastSeen: null });
      setTick((t) => t + 1);
    };
    const onOffline = ({ phone, lastSeen }) => {
      lastSeenMap.set(phone, { online: false, lastSeen: lastSeen ? new Date(lastSeen) : new Date() });
      setTick((t) => t + 1);
    };

    socket.on("user_online",  onOnline);
    socket.on("user_offline", onOffline);
    return () => {
      socket.off("user_online",  onOnline);
      socket.off("user_offline", onOffline);
    };
  }, []);

  const getStatus = useCallback((phone) => {
    if (!phone) return null;
    return lastSeenMap.get(phone) || null;
  }, [tick]);

  return { getStatus };
}