import { useState } from "react";
import { normalizePhone, makeChatId } from "../utils/phoneUtils";
import { crearConversacion } from "../api";
import socket from "../socket";

const COUNTRY_CODES = [
    { code: "+57", flag: "🇨🇴", name: "Colombia" },
    { code: "+1",  flag: "🇺🇸", name: "EE.UU." },
    { code: "+52", flag: "🇲🇽", name: "México" },
    { code: "+54", flag: "🇦🇷", name: "Argentina" },
    { code: "+56", flag: "🇨🇱", name: "Chile" },
    { code: "+51", flag: "🇵🇪", name: "Perú" },
    { code: "+58", flag: "🇻🇪", name: "Venezuela" },
    { code: "+34", flag: "🇪🇸", name: "España" },
    { code: "+55", flag: "🇧🇷", name: "Brasil" },
    { code: "+44", flag: "🇬🇧", name: "UK" },
    { code: "+49", flag: "🇩🇪", name: "Alemania" },
];

export default function AddContactModal({ myPhone, myNombre, onAdd, onClose }) {
    const [selectedCode, setSelectedCode] = useState("+57");
    const [rawPhone,  setRawPhone]  = useState("");
    const [nombre,    setNombre]    = useState("");
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState("");

    const digits = rawPhone.replace(/\D/g, "");
    const canSubmit = digits.length >= 7;

    const handleAdd = async () => {
        if (!canSubmit || loading) return;
        setLoading(true);
        setError("");

    try {
        const theirPhone = normalizePhone(selectedCode + rawPhone);

        if (theirPhone === myPhone) {
            setError("No puedes añadirte a ti mismo.");
            setLoading(false);
            return;
        }

        const chatId = makeChatId(myPhone, theirPhone);
        const theirNombre = nombre.trim() || theirPhone;

        await crearConversacion({ myPhone, myNombre, theirPhone, theirNombre });

        socket.emit("create_conversation", { myPhone, myNombre, theirPhone, theirNombre });

        onAdd({ chatId, theirPhone, theirNombre });
    }   catch {
        setError("No se pudo crear la conversación. Intenta de nuevo.");
    }
    setLoading(false);
    };

    return (
        <div
            onClick={(e) => e.target === e.currentTarget && onClose()}
            style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 100, backdropFilter: "blur(4px)",
            }}
        >
        <div style={{
            background: "var(--bg-sidebar)", border: "1px solid var(--border-strong)",
            borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 380,
            animation: "fadeUp 0.2s ease-out both",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
            <div style={{ width: 36, height: 36, background: "var(--accent)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bg-base)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
            </div>
        <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Nuevo chat
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                Ingresa el número exacto del contacto
            </div>
            </div>
                <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem" }}>✕</button>
            </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
                <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    Número de teléfono *
                </label>
            <div style={{ display: "flex", gap: 8 }}>
                <select
                    value={selectedCode}
                    onChange={(e) => setSelectedCode(e.target.value)}
                    style={{
                        background: "var(--bg-input)", border: "1px solid var(--border-strong)",
                        borderRadius: 10, padding: "10px 8px", color: "var(--text-primary)",
                        fontFamily: "var(--font-body)", fontSize: "0.82rem", outline: "none",
                        cursor: "pointer", flexShrink: 0,
                    }}
                >
                {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code} style={{ background: "#1a1a1a" }}>
                        {c.flag} {c.code}
                    </option>
                ))}
                </select>

                <input
                    autoFocus
                    type="tel"
                    placeholder="300 123 4567"
                    value={rawPhone}
                    onChange={(e) => setRawPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    style={{
                        flex: 1, background: "var(--bg-input)", border: "1px solid var(--border-strong)",
                        borderRadius: 10, padding: "10px 14px", color: "var(--text-primary)",
                        fontFamily: "var(--font-body)", fontSize: "0.9rem", outline: "none",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "var(--accent-dim)"}
                    onBlur={(e)  => e.target.style.borderColor = "var(--border-strong)"}
                />
            </div>

            {digits.length >= 7 && (
                <div style={{ marginTop: 5, fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    Se buscará:{" "}
                    <span style={{ color: "var(--accent-dim)", fontFamily: "monospace" }}>
                        {normalizePhone(selectedCode + rawPhone)}
                    </span>
                </div>
            )}
            </div>

            <div>
                <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    Nombre (opcional)
                </label>
            <input
                type="text"
                placeholder="Nombre del contacto"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                style={{
                    width: "100%", background: "var(--bg-input)", border: "1px solid var(--border-strong)",
                    borderRadius: 10, padding: "10px 14px", color: "var(--text-primary)",
                    fontFamily: "var(--font-body)", fontSize: "0.9rem", outline: "none",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--accent-dim)"}
                onBlur={(e)  => e.target.style.borderColor = "var(--border-strong)"}
            />
            </div>

            {error && (
                <div style={{ fontSize: "0.78rem", color: "#f43f5e", background: "rgba(244,63,94,0.1)", padding: "8px 12px", borderRadius: 8 }}>
                    {error}
                </div>
            )}

            <button
                onClick={handleAdd}
                disabled={!canSubmit || loading}
                style={{
                    marginTop: 4,
                    background: canSubmit ? "var(--accent)" : "var(--bg-input)",
                    color: canSubmit ? "var(--bg-base)" : "var(--text-muted)",
                    border: "none", borderRadius: 12, height: 46,
                    fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.9rem",
                    cursor: canSubmit ? "pointer" : "default", transition: "all 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
            >
                {loading ? "Creando..." : "Iniciar chat"}
            </button>
        </div>
        </div>
    </div>
    );
}