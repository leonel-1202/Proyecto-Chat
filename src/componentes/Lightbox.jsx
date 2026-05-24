import { useEffect, useRef } from "react";

export default function Lightbox({ src, name, onClose }) {
    const overlayRef = useRef();

    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    return (
        <div
            ref={overlayRef}
            onClick={(e) => e.target === overlayRef.current && onClose()}
            style={{
                position:       "fixed",
                inset:          0,
                background:     "rgba(0,0,0,0.92)",
                display:        "flex",
                flexDirection:  "column",
                alignItems:     "center",
                justifyContent: "center",
                zIndex:         200,
                backdropFilter: "blur(6px)",
                animation:      "fadeUp 0.18s ease-out both",
        }}
    >
        <div style={{
            position:       "absolute",
            top:            0,
            left:           0,
            right:          0,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            padding:        "14px 20px",
            background:     "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
        }}>
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem", fontFamily: "var(--font-body)" }}>
                {name || "Imagen"}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
            <a
                href={src}
                download={name || "imagen"}
                target="_blank"
                rel="noreferrer"
                style={{
                    background:     "rgba(255,255,255,0.1)",
                    border:         "1px solid rgba(255,255,255,0.15)",
                    borderRadius:   8,
                    padding:        "7px 12px",
                    color:          "rgba(255,255,255,0.85)",
                    fontSize:       "0.78rem",
                    fontFamily:     "var(--font-body)",
                    cursor:         "pointer",
                    textDecoration: "none",
                    display:        "flex",
                    alignItems:     "center",
                    gap:            6,
                }}
            >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Descargar
            </a>
            <button
                onClick={onClose}
                style={{
                    background:   "rgba(255,255,255,0.1)",
                    border:       "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    padding:      "7px 10px",
                    color:        "rgba(255,255,255,0.85)",
                    cursor:       "pointer",
                    display:      "flex",
                    alignItems:   "center",
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        </div>

        <img
            src={src}
            alt={name || "imagen"}
            style={{
                maxWidth:     "90vw",
                maxHeight:    "85vh",
                objectFit:    "contain",
                borderRadius: 8,
                boxShadow:    "0 24px 64px rgba(0,0,0,0.6)",
                userSelect:   "none",
            }}
        draggable={false}
        />
    </div>
    );
}