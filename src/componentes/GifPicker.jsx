import { useState, useRef, useEffect } from "react";

const GIPHY_KEY = import.meta.env.VITE_GIPHY_KEY || "dc6zaTOxFJmzC";

const TRENDING_URL = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=12&rating=g`;
const SEARCH_URL   = (q) =>
    `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=12&rating=g`;

const MAX_REQUESTS_PER_HOUR = 34;

export default function GifPicker({ onSelect, onClose }) {
    const [query,   setQuery]   = useState("");
    const [gifs,    setGifs]    = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(false);
    const [quotaExceeded, setQuotaExceeded] = useState(false);
    const ref       = useRef();
    const timer     = useRef();

    useEffect(() => {
        const handler = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
        setTimeout(() => document.addEventListener("mousedown", handler), 100);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    useEffect(() => {
        fetchGifs(TRENDING_URL);
    }, []);

    useEffect(() => {
        clearTimeout(timer.current);
        if (!query.trim()) {
            fetchGifs(TRENDING_URL);
            return;
        }
        timer.current = setTimeout(() => fetchGifs(SEARCH_URL(query)), 500);
        return () => clearTimeout(timer.current);
    }, [query]);

    function checkAndIncrementQuota() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        
        const storedLogs = JSON.parse(localStorage.getItem("giphy_request_logs") || "[]");
        
        const recentRequests = storedLogs.filter(timestamp => (now - timestamp) < oneHour);
        
        if (recentRequests.length >= MAX_REQUESTS_PER_HOUR) {
            return false;
        }
        
        recentRequests.push(now);
        localStorage.setItem("giphy_request_logs", JSON.stringify(recentRequests));
        return true;
    }

    async function fetchGifs(url) {
        setLoading(true);
        setError(false);
        setQuotaExceeded(false);

        if (!checkAndIncrementQuota()) {
            setLoading(false);
            setQuotaExceeded(true);
            return;
        }

        try {
            const res  = await fetch(url);
            const data = await res.json();
            setGifs(data.data || []);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }

    const handleSelect = (gif) => {
        onSelect({
            url:      gif.images.fixed_height.url,
            name:     gif.title || "GIF",
            type:     "image",
            mimeType: "image/gif",
            size:     0,
            isGif:    true,
        });
        onClose();
    };

    return (
        <div
            ref={ref}
            style={{
                position: "absolute",
                bottom: "calc(100% + 10px)",
                left: 0,
                width: 320,
                background: "var(--bg-sidebar)",
                border: "1px solid var(--border-strong)",
                borderRadius: 16,
                overflow: "hidden",
                zIndex: 30,
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                animation: "fadeUp 0.15s ease-out both",
            }}
        >
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-input)", borderRadius: 10, padding: "7px 12px" }}>
                    <span style={{ fontSize: "1rem" }}>🔍</span>
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar GIFs..."
                        style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}
                    />
                    {query && (
                        <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.8rem" }}>✕</button>
                    )}
                </div>
                <div style={{ fontSize: "0.6rem", color: "var(--text-meta)", marginTop: 6, textAlign: "right" }}>
                    Powered by GIPHY
                </div>
            </div>

            <div style={{ height: 240, overflowY: "auto", padding: 8 }}>
                {loading && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                        Cargando...
                    </div>
                )}
                {error && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                        Error al cargar GIFs
                    </div>
                )}
                {quotaExceeded && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 20, textAlign: "center", color: "var(--text-secondary)", fontSize: "0.82rem", gap: 6 }}>
                        <span>⚠️</span>
                        <span>Límite de búsquedas temporalmente alcanzado. Por favor intenta de nuevo en unos minutos.</span>
                    </div>
                )}
                {!loading && !error && !quotaExceeded && gifs.length === 0 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                        Sin resultados
                    </div>
                )}
                {!loading && !error && !quotaExceeded && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                        {gifs.map((gif) => (
                            <div
                                key={gif.id}
                                onClick={() => handleSelect(gif)}
                                style={{ cursor: "pointer", borderRadius: 8, overflow: "hidden", aspectRatio: "1", background: "var(--bg-input)" }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                            >
                                <img
                                    src={gif.images.fixed_height_small.url}
                                    alt={gif.title}
                                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                    loading="lazy"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}