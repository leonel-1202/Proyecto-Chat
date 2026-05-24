import { useEffect, useRef } from "react";

const ORIGINAL_TITLE = document.title;

export function useBadge() {
  const countRef = useRef(0);

  // Actualiza el título con el badge
  const setBadge = (n) => {
    countRef.current = n;
    document.title = n > 0 ? `(${n}) ${ORIGINAL_TITLE}` : ORIGINAL_TITLE;
  };

  // Incrementa en 1
  const increment = () => setBadge(countRef.current + 1);

  // Resetea al volver a la pestaña o al abrir un chat
  const reset = () => setBadge(0);

  // Al cerrar sesión o desmontar, restaurar título
  useEffect(() => {
    return () => { document.title = ORIGINAL_TITLE; };
  }, []);

  return { increment, reset, setBadge };
}