import { useEffect, useRef } from "react";

const ORIGINAL_TITLE = document.title;

export function useBadge() {
    const countRef = useRef(0);

    const setBadge = (n) => {
        countRef.current = n;
        document.title = n > 0 ? `(${n}) ${ORIGINAL_TITLE}` : ORIGINAL_TITLE;
    };

    const increment = () => setBadge(countRef.current + 1);

    const reset = () => setBadge(0);

    useEffect(() => {
        return () => { document.title = ORIGINAL_TITLE; };
    }, []);

    return { increment, reset, setBadge };
}