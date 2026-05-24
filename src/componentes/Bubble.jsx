import { useState, useRef, useEffect } from "react";
import Lightbox from "./Lightbox";

const EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "👎"];

function CheckMark({ status }) {
  if (status === "sent") {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ opacity: 0.45 }}>
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    );
  }
  const color   = status === "read" ? "var(--accent)" : "currentColor";
  const opacity = status === "delivered" ? 0.55 : 1;
  return (
    <span style={{ display: "flex", color, opacity }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ marginRight: -6 }}>
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </span>
  );
}

function ReplyPreview({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ borderLeft: "3px solid var(--accent)", marginBottom: 6, opacity: 0.75, fontSize: "0.75rem", lineHeight: 1.4, borderRadius: "0 4px 4px 0", background: "rgba(0,0,0,0.08)", padding: "4px 8px" }}>
      <div style={{ fontWeight: 600, marginBottom: 2, color: "var(--accent)" }}>{msg.sender || "Mensaje"}</div>
      <div style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 200 }}>
        {msg.media ? "📎 Archivo adjunto" : msg.text}
      </div>
    </div>
  );
}

function MediaContent({ media }) {
  const [lightbox, setLightbox] = useState(false);
  if (!media) return null;

  if (media.type === "image") {
    return (
      <>
        <img
          src={media.url}
          alt={media.name || "imagen"}
          style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 8, display: "block", marginBottom: 4, cursor: "zoom-in", objectFit: "cover" }}
          onClick={() => setLightbox(true)}
        />
        {lightbox && <Lightbox src={media.url} name={media.name} onClose={() => setLightbox(false)} />}
      </>
    );
  }
  if (media.type === "video") {
    return (
      <video controls style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 4 }}>
        <source src={media.url} type={media.mimeType} />
      </video>
    );
  }
  if (media.type === "audio") {
    return (
      <audio controls style={{ width: "100%", marginBottom: 4 }}>
        <source src={media.url} type={media.mimeType} />
      </audio>
    );
  }
  return (
    <a href={media.url} target="_blank" rel="noreferrer"
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "rgba(0,0,0,0.1)", borderRadius: 8, marginBottom: 4, color: "inherit", textDecoration: "none", fontSize: "0.8rem" }}>
      <span style={{ fontSize: "1.2rem" }}>📎</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
        {media.name || "Archivo"}
      </span>
    </a>
  );
}

function Reactions({ reactions, onReact, isOut }) {
  if (!reactions?.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4, justifyContent: isOut ? "flex-end" : "flex-start" }}>
      {reactions.map((r) => (
        <button key={r.emoji} onClick={() => onReact(r.emoji)}
          style={{ background: "rgba(0,0,0,0.12)", border: "none", borderRadius: 12, padding: "2px 7px", fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, color: "inherit" }}>
          {r.emoji}
          {r.users?.length > 1 && <span style={{ opacity: 0.75 }}>{r.users.length}</span>}
        </button>
      ))}
    </div>
  );
}

function QuickEmojiPicker({ onSelect, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return (
    <div ref={ref} style={{ position: "absolute", bottom: "calc(100% + 6px)", right: 0, background: "var(--bg-sidebar)", border: "1px solid var(--border-strong)", borderRadius: 12, padding: "6px 8px", display: "flex", gap: 4, zIndex: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
      {EMOJIS.map((e) => (
        <button key={e} onClick={() => { onSelect(e); onClose(); }}
          style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", borderRadius: 6, padding: "2px 4px", transition: "transform 0.1s" }}
          onMouseEnter={(el) => el.currentTarget.style.transform = "scale(1.3)"}
          onMouseLeave={(el) => el.currentTarget.style.transform = "scale(1)"}>
          {e}
        </button>
      ))}
    </div>
  );
}

function ContextMenu({ isOut, hasText, onReply, onCopy, onEdit, onDelete, onClose, style: extraStyle }) {
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const items = [
    { label: "Responder", icon: "↩️", action: onReply },
    hasText && { label: "Copiar", icon: "📋", action: () => { navigator.clipboard.writeText(hasText); onClose(); } },
    isOut && hasText && { label: "Editar", icon: "✏️", action: handleEdit },
    isOut && { label: "Eliminar", icon: "🗑️", action: onDelete, danger: true },
  ].filter(Boolean);

  return (
    <div ref={ref} style={{ position: "absolute", zIndex: 50, background: "var(--bg-sidebar)", border: "1px solid var(--border-strong)", borderRadius: 12, overflow: "hidden", minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", animation: "fadeUp 0.12s ease-out both", ...extraStyle }}>
      {items.map((item) => (
        <button key={item.label} onClick={() => { item.action(); onClose(); }}
          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", padding: "9px 14px", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)", fontSize: "0.85rem", color: item.danger ? "#f43f5e" : "var(--text-primary)", transition: "background 0.12s" }}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
          <span>{item.icon}</span>{item.label}
        </button>
      ))}
    </div>
  );
}

export default function Bubble({ msg, onReply, onReact, onEdit, onDelete, replyMsg, currentUserPhone }) {
  const [showPicker,  setShowPicker]  = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [contextPos,  setContextPos]  = useState({ bottom: "calc(100% + 4px)", top: "auto" });
  const [editing,     setEditing]     = useState(false);
  const [editText,    setEditText]    = useState(msg.text || "");
  const wrapRef = useRef();

  const isOut = msg.sender === currentUserPhone;
  const bubbleType = isOut ? "out" : "in";

  if (msg.typing) {
    return (
      <div className="bubble-wrap in">
        <div className="bubble in typing">
          <div className="typing-dots"><span /><span /><span /></div>
        </div>
      </div>
    );
  }

  if (msg.deleted) {
    return (
      <div className={`bubble-wrap ${bubbleType}`}>
        <div className={`bubble ${bubbleType}`} style={{ opacity: 0.5, fontStyle: "italic", fontSize: "0.82rem" }}>
          🗑️ Mensaje eliminado
        </div>
      </div>
    );
  }

  const handleContextMenu = (e) => {
    e.preventDefault();
    const rect = wrapRef.current?.getBoundingClientRect();
    const spaceBelow = window.innerHeight - (rect?.bottom || 0);
    setContextPos(spaceBelow < 160
      ? { bottom: "calc(100% + 4px)", top: "auto" }
      : { top: "calc(100% + 4px)", bottom: "auto" }
    );
    setShowContext(true);
  };

  const handleEdit = () => { setEditing(true); setEditText(msg.text || ""); setShowContext(false); };
  const handleEditSave = () => {
    if (editText.trim() && editText.trim() !== msg.text) onEdit?.(msg._id || msg.id, editText.trim());
    setEditing(false);
  };

  return (
    <div ref={wrapRef} className={`bubble-wrap ${bubbleType}`} style={{ position: "relative" }}
      onContextMenu={handleContextMenu}>
      <div className={`bubble ${bubbleType}`} style={{ position: "relative", overflow: "visible" }}>

        <div className="bubble-actions">
          <button onClick={() => onReply?.(msg)} title="Responder"
            style={{ background: "var(--bg-sidebar)", border: "1px solid var(--border-strong)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
            </svg>
          </button>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowPicker((v) => !v)} title="Reaccionar"
              style={{ background: "var(--bg-sidebar)", border: "1px solid var(--border-strong)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>
              😊
            </button>
            {showPicker && (
              <QuickEmojiPicker
                onSelect={(emoji) => { onReact?.(msg._id || msg.id, emoji); setShowPicker(false); }}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={handleContextMenu} title="Más opciones"
              style={{ background: "var(--bg-sidebar)", border: "1px solid var(--border-strong)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: "1rem", fontWeight: 700, letterSpacing: -1 }}>
              ···
            </button>
            {showContext && (
              <ContextMenu
                isOut={isOut} hasText={msg.text}
                onReply={() => onReply?.(msg)}
                onEdit={handleEdit}
                onDelete={() => onDelete?.(msg._id || msg.id)}
                onClose={() => setShowContext(false)}
                style={contextPos}
              />
            )}
          </div>
        </div>

        {msg.replyTo && <ReplyPreview msg={replyMsg} />}
        {msg.sender && !isOut && <div className="bubble-sender">{msg.sender}</div>}

        <MediaContent media={msg.media} />

        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <textarea autoFocus value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSave(); } if (e.key === "Escape") setEditing(false); }}
              style={{ background: "rgba(0,0,0,0.15)", border: "1px solid var(--accent-dim)", borderRadius: 8, padding: "6px 8px", color: "inherit", fontFamily: "var(--font-body)", fontSize: "0.9rem", resize: "none", outline: "none", minWidth: 180, lineHeight: 1.5 }}
              rows={Math.min(4, editText.split("\n").length + 1)}
            />
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(false)}
                style={{ background: "none", border: "1px solid var(--border-strong)", borderRadius: 6, padding: "3px 10px", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.75rem", fontFamily: "var(--font-body)" }}>
                Cancelar
              </button>
              <button onClick={handleEditSave}
                style={{ background: "var(--accent)", border: "none", borderRadius: 6, padding: "3px 10px", cursor: "pointer", color: "var(--bg-base)", fontSize: "0.75rem", fontFamily: "var(--font-body)", fontWeight: 600 }}>
                Guardar
              </button>
            </div>
          </div>
        ) : (
          msg.text && (
            <span>
              {msg.text}
              {msg.edited && <span style={{ fontSize: "0.65rem", opacity: 0.5, marginLeft: 4, fontStyle: "italic" }}>editado</span>}
            </span>
          )
        )}

        <div className="bubble-meta">
          <span className="bubble-time">{msg.time}</span>
          {isOut && !editing && <CheckMark status={msg.status || "sent"} />}
        </div>
      </div>

      <Reactions
        reactions={msg.reactions}
        onReact={(emoji) => onReact?.(msg._id || msg.id, emoji)}
        isOut={isOut}
      />
    </div>
  );
}