import { useState, useRef, useEffect } from "react";

const EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "👎"];

function CheckMark({ status }) {
  if (status === "sent") {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        strokeLinejoin="round" style={{ opacity: 0.45 }}>
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    );
  }

  const color   = status === "read" ? "var(--accent)" : "currentColor";
  const opacity = status === "delivered" ? 0.6 : 1;

  return (
    <span style={{ display: "flex", color, opacity }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        strokeLinejoin="round" style={{ marginRight: -6 }}>
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </span>
  );
}

function ReplyPreview({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      borderLeft: "3px solid var(--accent)",
      marginBottom: 6,
      opacity: 0.75,
      fontSize: "0.75rem",
      lineHeight: 1.4,
      borderRadius: "0 4px 4px 0",
      background: "rgba(0,0,0,0.08)",
      padding: "4px 8px",
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2, color: "var(--accent)" }}>
        {msg.sender || "Mensaje"}
      </div>
      <div style={{
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        maxWidth: 200,
      }}>
        {msg.media ? "📎 Archivo adjunto" : msg.text}
      </div>
    </div>
  );
}

function MediaContent({ media }) {
  if (!media) return null;

  if (media.type === "image") {
    return (
      <img
        src={media.url}
        alt="imagen"
        style={{
          maxWidth: "100%",
          maxHeight: 280,
          borderRadius: 8,
          display: "block",
          marginBottom: 4,
          cursor: "pointer",
          objectFit: "cover",
        }}
        onClick={() => window.open(media.url, "_blank")}
      />
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
    <a
      href={media.url}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        background: "rgba(0,0,0,0.1)",
        borderRadius: 8,
        marginBottom: 4,
        color: "inherit",
        textDecoration: "none",
        fontSize: "0.8rem",
      }}
    >
      <span style={{ fontSize: "1.2rem" }}>📎</span>
      <span style={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        maxWidth: 160,
      }}>
        {media.name || "Archivo"}
      </span>
    </a>
  );
}

function Reactions({ reactions, onReact, isOut }) {
  if (!reactions?.length) return null;

  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 4,
      marginTop: 4,
      justifyContent: isOut ? "flex-end" : "flex-start",
    }}>
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => onReact(r.emoji)}
          style={{
            background: "rgba(0,0,0,0.12)",
            border: "none",
            borderRadius: 12,
            padding: "2px 7px",
            fontSize: "0.78rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 3,
            color: "inherit",
          }}
        >
          {r.emoji}
          {r.users?.length > 1 && (
            <span style={{ opacity: 0.75 }}>{r.users.length}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        bottom: "calc(100% + 6px)",
        right: 0,
        background: "var(--bg-sidebar)",
        border: "1px solid var(--border-strong)",
        borderRadius: 12,
        padding: "6px 8px",
        display: "flex",
        gap: 4,
        zIndex: 10,
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      {EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => { onSelect(e); onClose(); }}
          style={{
            background: "none",
            border: "none",
            fontSize: "1.2rem",
            cursor: "pointer",
            borderRadius: 6,
            padding: "2px 4px",
            transition: "transform 0.1s",
          }}
          onMouseEnter={(el) => el.currentTarget.style.transform = "scale(1.3)"}
          onMouseLeave={(el) => el.currentTarget.style.transform = "scale(1)"}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

export default function Bubble({ msg, onReply, onReact, replyMsg }) {
  const [showPicker, setShowPicker] = useState(false);

  if (msg.typing) {
    return (
      <div className="bubble-wrap in">
        <div className="bubble in typing">
          <div className="typing-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  const isOut = msg.type === "out";

  return (
    <div className={`bubble-wrap ${msg.type}`} style={{ position: "relative" }}>

      <div className={`bubble ${msg.type}`} style={{ position: "relative", overflow: "visible" }}>

        <div className="bubble-actions">
          <button
            onClick={() => onReply?.(msg)}
            title="Responder"
            style={{
              background: "var(--bg-sidebar)",
              border: "1px solid var(--border-strong)",
              borderRadius: 8,
              width: 30, height: 30,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 17 4 12 9 7"/>
              <path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
            </svg>
          </button>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowPicker(v => !v)}
              title="Reaccionar"
              style={{
                background: "var(--bg-sidebar)",
                border: "1px solid var(--border-strong)",
                borderRadius: 8,
                width: 30, height: 30,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
              }}
            >
              😊
            </button>
            {showPicker && (
              <EmojiPicker
                onSelect={(emoji) => {
                  onReact?.(msg._id || msg.id, emoji);
                  setShowPicker(false);
                }}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>
        </div>

        {msg.replyTo && <ReplyPreview msg={replyMsg} />}

        {msg.sender && !isOut && (
          <div className="bubble-sender">{msg.sender}</div>
        )}

        <MediaContent media={msg.media} />

        {msg.text && <span>{msg.text}</span>}

        <div className="bubble-meta">
          <span className="bubble-time">{msg.time}</span>
          {isOut && <CheckMark status={msg.status || "sent"} />}
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