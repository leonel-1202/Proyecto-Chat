import { useState, useEffect } from "react";
import { useAuth } from "../Auth-Context";

const AVATAR_COLORS = [
    "#5a4a8a", "#2d6a4f", "#7a2d2d", "#1e5a7a", "#6a4a1e",
    "#2d4a6a", "#5a2d6a", "#1e6a5a", "#6a3a1e", "#c9184a",
    "#0f3460", "#e76f51", "#2a9d8f", "#457b9d", "#533483",
];

const AVATAR_EMOJIS = ["😎", "🦊", "🐺", "🦁", "🐯", "🦄", "🐉", "👾", "🤖", "🦅", "🌙", "⚡", "🔥", "💎", "🎭"];

export default function UserProfilePanel({ onClose }) {
    const { usuario, login } = useAuth();

    const [nombre,        setNombre]        = useState(usuario.nombre || "");
    const [avatarColor,   setAvatarColor]   = useState(() => localStorage.getItem("fc-avatar-color") || AVATAR_COLORS[0]);
    const [avatarEmoji,   setAvatarEmoji]   = useState(() => localStorage.getItem("fc-avatar-emoji") || "");
    const [saved,         setSaved]         = useState(false);
    const [tab,           setTab]           = useState("perfil");

    const initials = (nombre || usuario.numero)[0]?.toUpperCase() || "?";

    const handleSave = () => {
        if (!nombre.trim()) return;
        login(usuario.numero, nombre.trim());
        localStorage.setItem("fc-avatar-color", avatarColor);
        localStorage.setItem("fc-avatar-emoji", avatarEmoji);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <>
        <div
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
        />

        <div style={{
            position:      "fixed",
            top:           0,
            left:          0,
            width:         300,
            height:        "100dvh",
            background:    "var(--bg-sidebar)",
            borderRight:   "1px solid var(--border-strong)",
            zIndex:        90,
            display:       "flex",
            flexDirection: "column",
            animation:     "slideInLeft 0.22s ease-out both",
            overflowY:     "auto",
        }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", padding: 4 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
            </button>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Mi perfil
            </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 18px 20px", borderBottom: "1px solid var(--border)" }}>
            <div style={{
                width: 84, height: 84, borderRadius: "50%",
                background: avatarColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: avatarEmoji ? "2.4rem" : "2rem",
                fontWeight: 700, color: "white",
                fontFamily: "var(--font-display)",
                border: "3px solid var(--border-strong)",
                marginBottom: 12,
                userSelect: "none",
            }}>
                {avatarEmoji || initials}
            </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {nombre || usuario.numero}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "monospace", marginTop: 4 }}>
                    {usuario.numero}
                </div>
            </div>

        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 8px" }}>
            {["perfil", "avatar"].map((t) => (
                <button key={t} onClick={() => setTab(t)}
                    style={{
                        flex: 1, background: "none", border: "none",
                        borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                        padding: "10px 0", cursor: "pointer",
                        color: tab === t ? "var(--accent)" : "var(--text-secondary)",
                        fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 600,
                        transition: "all 0.15s", textTransform: "capitalize",
                    }}>
                {t === "perfil" ? "📝 Perfil" : "🎨 Avatar"}
            </button>
            ))}
        </div>

        <div style={{ flex: 1, padding: "20px 18px", display: "flex", flexDirection: "column", gap: 18 }}>

            {tab === "perfil" && (
                <>
                    <div>
                        <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                            Tu nombre
                        </label>
                        <input
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            maxLength={30}
                            placeholder="Tu nombre"
                            onKeyDown={(e) => e.key === "Enter" && handleSave()}
                            style={{
                                width: "100%", background: "var(--bg-input)",
                                border: "1px solid var(--border-strong)", borderRadius: 12,
                                padding: "11px 14px", color: "var(--text-primary)",
                                fontFamily: "var(--font-body)", fontSize: "0.9rem", outline: "none",
                                boxSizing: "border-box", transition: "border-color 0.2s",
                            }}
                        onFocus={(e) => e.target.style.borderColor = "var(--accent-dim)"}
                        onBlur={(e) => e.target.style.borderColor = "var(--border-strong)"}
                    />
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textAlign: "right", marginTop: 4 }}>
                        {nombre.length}/30
                    </div>
                </div>

                <div>
                    <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                        Número
                    </label>
                    <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 14px", color: "var(--text-secondary)", fontFamily: "monospace", fontSize: "0.88rem" }}>
                        {usuario.numero}
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={!nombre.trim() || nombre.trim() === usuario.nombre}
                    style={{
                        background: (nombre.trim() && nombre.trim() !== usuario.nombre) ? "var(--accent)" : "var(--bg-input)",
                        color:      (nombre.trim() && nombre.trim() !== usuario.nombre) ? "var(--bg-base)" : "var(--text-muted)",
                        border: "none", borderRadius: 12, height: 46,
                        fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.9rem",
                        cursor: (nombre.trim() && nombre.trim() !== usuario.nombre) ? "pointer" : "default",
                        transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}>
                        {saved ? "✅ Guardado" : "Guardar cambios"}
                    </button>
                </>
            )}

            {tab === "avatar" && (
                <>
                <div>
                    <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
                        Color de fondo
                    </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {AVATAR_COLORS.map((c) => (
                        <div key={c} onClick={() => setAvatarColor(c)}
                            style={{
                                width: 28, height: 28, borderRadius: "50%", background: c,
                                cursor: "pointer", flexShrink: 0,
                                border: avatarColor === c ? "3px solid var(--accent)" : "2px solid transparent",
                                transition: "border 0.15s, transform 0.1s",
                                transform: avatarColor === c ? "scale(1.15)" : "scale(1)",
                            }} 
                        />
                    ))}
                </div>
            </div>

                <div>
                    <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
                        Emoji (opcional)
                    </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <div onClick={() => setAvatarEmoji("")}
                        style={{
                            width: 36, height: 36, borderRadius: 8, background: avatarEmoji === "" ? "var(--bg-active)" : "var(--bg-input)",
                            border: avatarEmoji === "" ? "1px solid var(--accent-dim)" : "1px solid var(--border)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-body)",
                        }}>
                    {initials}
                    </div>
                        {AVATAR_EMOJIS.map((emoji) => (
                        <button key={emoji} onClick={() => setAvatarEmoji(emoji)}
                            style={{
                                width: 36, height: 36, borderRadius: 8,
                                background: avatarEmoji === emoji ? "var(--bg-active)" : "var(--bg-input)",
                                border: avatarEmoji === emoji ? "1px solid var(--accent-dim)" : "1px solid var(--border)",
                                fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.12s",
                            }}>
                        {emoji}
                    </button>
                    ))}
                </div>
            </div>

                <button onClick={handleSave}
                    style={{ background: "var(--accent)", color: "var(--bg-base)", border: "none", borderRadius: 12, height: 46, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {saved ? "✅ Guardado" : "Guardar avatar"}
                </button>
            </>
            )}
        </div>
        </div>
    </>
    );
}