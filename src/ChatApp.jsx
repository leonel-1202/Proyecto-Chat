import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./Auth-Context";
import { useTheme } from "./ThemeContext";
import { useNotifications } from "./hooks/useNotifications";
import { useLastSeen, formatLastSeen } from "./hooks/useLastSeen";
import { useCloudinary, MAX_SIZE_MB } from "./hooks/useCloudinary";
import { useBadge } from "./hooks/useBadge";
import ChatItem from "./componentes/ChatItem";
import Bubble from "./componentes/Bubble";
import Avatar from "./componentes/Avatar";
import GifPicker from "./componentes/GifPicker";
import EmojiPickerPanel from "./componentes/EmojiPickerPanel";
import AddContactModal from "./componentes/AddContactModal";
import Stories from "./componentes/Stories";
import UploadProgress from "./componentes/UploadProgress";
import UserProfilePanel from "./componentes/UserProfilePanel";
import { getMensajes, getConversaciones, clearChat } from "./api";
import socket from "./socket";

// ── Bot ───────────────────────────────────────────────────────────────────────
const BOT_CHAT_ID  = "bot_nexus";
const BOT_PHONE    = "+570000000000";
const BOT_NAME     = "Nexus-IA 🤖";
const BOT_INITIALS = "NI";

const BOT_RESPONSES = [
  "¡Hola! Soy el bot de demostración de Nexus 👋",
  "Puedes enviarme cualquier mensaje y te responderé automáticamente.",
  "¡Las respuestas en tiempo real funcionan con Socket.io! ⚡",
  "Puedes añadir contactos reales con el botón '+' en la barra lateral.",
  "Interesante lo que dices 🤔", "¿En serio? Cuéntame más 😄",
  "Entendido! Aquí estoy para lo que necesites.",
  "Nexus — mensajería en tiempo real 🚀",
];
const getBotResponse = () => BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)];

function nowTime() {
  return new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}
function convToChat(conv, myPhone) {
  const other = conv.participants?.find((p) => p.phone !== myPhone) || {};
  const initials = (other.nombre || other.phone || "?")[0]?.toUpperCase() || "?";
  const lastMsg = conv.lastMessageDoc;
  return {
    id: conv.chatId, chatId: conv.chatId,
    name: other.nombre || other.phone || "Contacto",
    phone: other.phone, initials, online: false, isGroup: false,
    messages: lastMsg
      ? [{ id: lastMsg._id, type: lastMsg.type, text: lastMsg.text, time: lastMsg.time, sender: lastMsg.sender }]
      : [],
    unread: 0,
  };
}

// ── Iconos ────────────────────────────────────────────────────────────────────
const Ico = {
  Phone:   () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.21 3.18 2 2 0 0 1 3.22 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l.62-.62a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/></svg>,
  Video:   () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>,
  Dots:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
  Attach:  () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  Send:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>,
  Palette: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  Close:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Search:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Plus:    () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Gif:     () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M10 9H7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3"/><path d="M10 12H8"/><path d="M14 9v6"/><path d="M17 9h-1.5a1.5 1.5 0 0 0 0 3H17a1.5 1.5 0 0 1 0 3h-1.5"/></svg>,
  Back:    () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  User:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Trash:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
};

// ── Menú "···" del header ────────────────────────────────────────────────────
function ChatMenu({ onClear, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", h), 50);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: "absolute", top: "calc(100% + 6px)", right: 8,
      background: "var(--bg-sidebar)", border: "1px solid var(--border-strong)",
      borderRadius: 12, overflow: "hidden", minWidth: 180, zIndex: 40,
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)", animation: "fadeUp 0.12s ease-out both",
    }}>
      <button onClick={onClear}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", padding: "11px 16px", cursor: "pointer", color: "#f43f5e", fontFamily: "var(--font-body)", fontSize: "0.85rem", transition: "background 0.12s" }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
        <Ico.Trash /> Vaciar chat
      </button>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────
function ReplyBar({ msg, onCancel }) {
  if (!msg) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "var(--bg-sidebar)", borderTop: "1px solid var(--border-strong)", borderLeft: "3px solid var(--accent)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.72rem", color: "var(--accent)", fontWeight: 600, marginBottom: 2 }}>Respondiendo a {msg.sender || "mensaje"}</div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          {msg.media ? "📎 Archivo adjunto" : msg.text}
        </div>
      </div>
      <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: 4, display: "flex" }}><Ico.Close /></button>
    </div>
  );
}

function MediaPreviewBar({ media, caption, onCaptionChange, onSend, onCancel }) {
  if (!media) return null;
  const sizeLabel = media.size ? `${(media.size / (1024 * 1024)).toFixed(1)} MB` : "GIF";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "var(--bg-sidebar)", borderTop: "1px solid var(--border-strong)", borderLeft: "3px solid var(--accent)" }}>
      {media.type === "image"
        ? <img src={media.url} alt="preview" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} />
        : <span style={{ fontSize: "1.8rem" }}>{media.type === "video" ? "🎥" : media.type === "audio" ? "🎵" : "📎"}</span>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.78rem", color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{media.name}</div>
        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 }}>{sizeLabel}</div>
      </div>
      <input value={caption} onChange={(e) => onCaptionChange(e.target.value)} placeholder="Añadir caption..."
        onKeyDown={(e) => e.key === "Enter" && onSend()}
        style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px", color: "var(--text-primary)", fontSize: "0.82rem", fontFamily: "var(--font-body)", outline: "none", width: 160 }} />
      <button onClick={onSend} style={{ background: "var(--accent)", border: "none", borderRadius: 8, padding: "6px 14px", color: "var(--bg-base)", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, fontFamily: "var(--font-body)" }}>Enviar</button>
      <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><Ico.Close /></button>
    </div>
  );
}

function SearchBar({ messages, onClose, onJump }) {
  const [q, setQ] = useState("");
  const results = q.trim().length > 1 ? messages.filter((m) => m.text?.toLowerCase().includes(q.toLowerCase())) : [];
  return (
    <div style={{ position: "absolute", top: 0, right: 0, width: 300, background: "var(--bg-sidebar)", borderLeft: "1px solid var(--border-strong)", height: "100%", display: "flex", flexDirection: "column", zIndex: 20 }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-strong)", display: "flex", alignItems: "center", gap: 8 }}>
        <Ico.Search />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar mensajes..."
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: "0.9rem", fontFamily: "var(--font-body)" }} />
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><Ico.Close /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {q.trim().length > 1 && results.length === 0 && <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 24 }}>Sin resultados</p>}
        {results.map((m) => (
          <div key={m._id || m.id} onClick={() => { onJump(m._id || m.id); onClose(); }}
            style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 2 }}>{m.time} · {m.sender}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{m.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onNew }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "var(--text-muted)", padding: "20px" }}>
      <div style={{ width: 72, height: 72, background: "var(--bg-sidebar)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--text-secondary)", marginBottom: 6 }}>Selecciona un chat</div>
        <div style={{ fontSize: "0.8rem", lineHeight: 1.6 }}>o añade un contacto para empezar</div>
      </div>
      <button onClick={onNew} style={{ background: "var(--accent)", border: "none", borderRadius: 12, padding: "10px 24px", color: "var(--bg-base)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
        <Ico.Plus /> Nuevo chat
      </button>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ChatApp() {
  const { usuario, cerrarSesion }         = useAuth();
  const { theme, setTheme, THEMES }       = useTheme();
  const { requestPermission, notify }     = useNotifications();
  const { getStatus }                     = useLastSeen();
  const { upload, progress, uploading, error: uploadError, reset: resetUpload } = useCloudinary();
  const { increment: badgeInc, reset: badgeReset } = useBadge();

  const BOT_CHAT = {
    id: BOT_CHAT_ID, chatId: BOT_CHAT_ID, name: BOT_NAME,
    phone: BOT_PHONE, initials: BOT_INITIALS, online: true,
    isGroup: false, messages: [], unread: 0, isBot: true,
  };

  const [chats,           setChats]           = useState([BOT_CHAT]);
  const [selectedId,      setSelectedId]      = useState(null);
  const [text,            setText]            = useState("");
  const [search,          setSearch]          = useState("");
  const [typing,          setTyping]          = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [loadingChats,    setLoadingChats]    = useState(true);
  const [showThemes,      setShowThemes]      = useState(false);
  const [replyMsg,        setReplyMsg]        = useState(null);
  const [showSearch,      setShowSearch]      = useState(false);
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [mediaPreview,    setMediaPreview]    = useState(null);
  const [pendingFile,     setPendingFile]     = useState(null);
  const [caption,         setCaption]         = useState("");
  const [onlineUsers,     setOnlineUsers]     = useState(new Set());
  const [showGif,         setShowGif]         = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadFileName,  setUploadFileName]  = useState("");
  const [showProfile,     setShowProfile]     = useState(false);
  const [showChatMenu,    setShowChatMenu]    = useState(false);

  const bottomRef       = useRef();
  const inputRef        = useRef();
  const fileInputRef    = useRef();
  const typingTimer     = useRef();
  const stopTypingTimer = useRef();
  const msgRefs         = useRef({});

  const chat          = chats.find((c) => c.id === selectedId);
  const filteredChats = chats.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const headerStatus = () => {
    if (!chat) return "";
    if (chat.isBot) return "Bot de demostración · siempre activo";
    if (typing) return "escribiendo...";
    const s = getStatus(chat.phone);
    if (s?.online) return "en línea";
    if (s?.lastSeen) return formatLastSeen(s.lastSeen);
    return chat.online ? "en línea" : "";
  };

  // Reset badge al volver a la pestaña
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") badgeReset(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Reset badge al abrir un chat
  useEffect(() => {
    if (selectedId) badgeReset();
  }, [selectedId]);

  useEffect(() => { requestPermission(); }, []);

  useEffect(() => {
    setLoadingChats(true);
    getConversaciones(usuario.numero)
      .then((res) => {
        const realChats = res.data.map((conv) => convToChat(conv, usuario.numero));
        setChats([BOT_CHAT, ...realChats.filter((c) => c.id !== BOT_CHAT_ID)]);
      })
      .catch(console.error)
      .finally(() => setLoadingChats(false));
  }, [usuario.numero]);

  useEffect(() => {
    socket.connect();
    socket.emit("register", usuario.numero);
    chats.forEach((c) => { if (c.chatId) socket.emit("join_chat", c.chatId); });

    socket.on("new_message", (msg) => {
      const miNumero = usuario.numero;

      // Badge: solo si no estamos viendo esa pestaña
      if (msg.sender !== miNumero && document.visibilityState !== "visible") {
        badgeInc();
      }
      if (msg.sender !== miNumero) {
        notify(msg.sender || "Nuevo mensaje", msg.text || "📎", msg.chatId);
      }

      setChats((prev) => prev.map((c) => {
        if (c.id !== msg.chatId) return c;
        const msgs = [...c.messages];
        if (msg.sender === miNumero) {
          let idx = msgs.findIndex((m) => !m._id && (m.id === msg.id || (m.text === msg.text && m.sender === miNumero)));
          if (idx !== -1) { msgs[idx] = msg; return { ...c, messages: msgs }; }
          if (msgs.some((m) => m._id === msg._id)) return c;
        } else {
          if (msgs.some((m) => m._id === msg._id)) return c;
        }
        return { ...c, messages: [...msgs, msg] };
      }));

      if (msg.chatId === selectedId && msg.sender !== miNumero)
        socket.emit("mark_read", { messageIds: [msg._id], chatId: msg.chatId, phone: miNumero });
    });

    socket.on("messages_read", ({ messageIds, phone }) => {
      if (phone === usuario.numero) return;
      setChats((prev) => prev.map((c) => ({ ...c, messages: c.messages.map((m) => messageIds.includes(String(m._id || m.id)) ? { ...m, status: "read" } : m) })));
    });
    socket.on("message_reaction", ({ messageId, reactions }) => {
      setChats((prev) => prev.map((c) => ({ ...c, messages: c.messages.map((m) => String(m._id || m.id) === String(messageId) ? { ...m, reactions } : m) })));
    });
    socket.on("message_edited", ({ messageId, text: t, edited }) => {
      setChats((prev) => prev.map((c) => ({ ...c, messages: c.messages.map((m) => String(m._id || m.id) === String(messageId) ? { ...m, text: t, edited } : m) })));
    });
    socket.on("message_deleted", ({ messageId, forEveryone }) => {
      setChats((prev) => prev.map((c) => ({ ...c, messages: c.messages.map((m) => String(m._id || m.id) === String(messageId) ? { ...m, deleted: true, text: forEveryone ? "" : m.text } : m) })));
    });

    // Chat vaciado por cualquier participante
    socket.on("chat_cleared", ({ chatId }) => {
      setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, messages: [] } : c));
    });

    socket.on("typing", ({ phone }) => {
      if (phone !== usuario.numero) { setTyping(true); clearTimeout(typingTimer.current); typingTimer.current = setTimeout(() => setTyping(false), 2500); }
    });
    socket.on("stop_typing", ({ phone }) => { if (phone !== usuario.numero) setTyping(false); });
    socket.on("user_online",  ({ phone }) => setOnlineUsers((s) => new Set([...s, phone])));
    socket.on("user_offline", ({ phone }) => { setOnlineUsers((s) => { const n = new Set(s); n.delete(phone); return n; }); });
    socket.on("new_conversation", (conv) => {
      const newChat = convToChat(conv, usuario.numero);
      setChats((prev) => prev.find((c) => c.id === newChat.id) ? prev : [...prev, newChat]);
      socket.emit("join_chat", conv.chatId);
    });

    return () => {
      ["new_message","messages_read","message_reaction","typing","stop_typing",
       "user_online","user_offline","new_conversation","message_edited","message_deleted","chat_cleared"]
        .forEach((ev) => socket.off(ev));
    };
  }, [usuario.numero, usuario.nombre, selectedId]);

  useEffect(() => {
    setChats((prev) => prev.map((c) => ({ ...c, online: c.chatId === BOT_CHAT_ID ? true : onlineUsers.has(c.phone) })));
  }, [onlineUsers]);

  useEffect(() => {
    if (!selectedId) return;
    socket.emit("join_chat", selectedId);
    setLoading(true);
    getMensajes(selectedId)
      .then((res) => {
        if (res.data.length > 0) {
          setChats((prev) => prev.map((c) => c.id === selectedId ? { ...c, messages: res.data } : c));
          const unread = res.data.filter((m) => m.type === "in" && !m.readBy?.includes(usuario.numero)).map((m) => m._id);
          if (unread.length) socket.emit("mark_read", { messageIds: unread, chatId: selectedId, phone: usuario.numero });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedId, usuario.numero]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat?.messages, typing]);

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!selectedId || selectedId === BOT_CHAT_ID) return;
    socket.emit("typing", { chatId: selectedId, phone: usuario.numero, nombre: usuario.nombre });
    clearTimeout(stopTypingTimer.current);
    stopTypingTimer.current = setTimeout(() => socket.emit("stop_typing", { chatId: selectedId, phone: usuario.numero }), 1500);
  };

  const addOptimisticMessage = useCallback((msgData) => {
    setChats((prev) => prev.map((c) => c.id === selectedId ? { ...c, messages: [...c.messages, msgData] } : c));
  }, [selectedId]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || !selectedId) return;
    const msgData = { id: Date.now(), chatId: selectedId, type: "out", text: trimmed, time: nowTime(), sender: usuario.numero, status: "sent", replyTo: replyMsg?._id || null };
    addOptimisticMessage(msgData);
    setText(""); setReplyMsg(null);
    inputRef.current?.focus();
    if (selectedId === BOT_CHAT_ID) {
      setTimeout(() => {
        setChats((prev) => prev.map((c) => c.id === BOT_CHAT_ID
          ? { ...c, messages: [...c.messages, { chatId: BOT_CHAT_ID, type: "in", text: getBotResponse(), time: nowTime(), sender: BOT_PHONE, status: "read", id: Date.now() + 1 }] }
          : c));
      }, 800 + Math.random() * 800);
    } else {
      socket.emit("send_message", msgData);
    }
  };

  const sendMedia = (mediaObj = mediaPreview, cap = caption) => {
    if (!mediaObj || !selectedId) return;
    const msgData = { chatId: selectedId, type: "out", text: cap.trim(), media: mediaObj, time: nowTime(), sender: usuario.numero, status: "sent", replyTo: replyMsg?._id || null, id: Date.now() };
    addOptimisticMessage(msgData);
    setCaption(""); setMediaPreview(null); setReplyMsg(null); setShowGif(false);
    inputRef.current?.focus();
    if (selectedId !== BOT_CHAT_ID) socket.emit("send_media_message", msgData);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { alert(`El archivo supera el límite de ${MAX_SIZE_MB}MB`); return; }
    setUploadFileName(file.name);
    setPendingFile(file);
    try {
      const mediaData = await upload(file);
      setMediaPreview(mediaData);
      setCaption("");
    } catch (err) {
      if (err.message !== "Subida cancelada") alert(`Error al subir: ${err.message}`);
    } finally {
      setPendingFile(null); setUploadFileName(""); resetUpload();
    }
  };

  // ── Vaciar chat ─────────────────────────────────────────────────────────────
  const handleClearChat = async () => {
    if (!selectedId || !window.confirm(`¿Vaciar todos los mensajes de este chat?`)) return;
    setShowChatMenu(false);
    try {
      await clearChat(selectedId);
      socket.emit("clear_chat", { chatId: selectedId, phone: usuario.numero });
      setChats((prev) => prev.map((c) => c.id === selectedId ? { ...c, messages: [] } : c));
    } catch (err) {
      alert("No se pudo vaciar el chat.");
    }
  };

  const handleReact  = (messageId, emoji) => { if (selectedId !== BOT_CHAT_ID) socket.emit("react_message", { messageId, emoji, phone: usuario.numero, chatId: selectedId }); };
  const handleEdit   = (messageId, newText) => {
    if (selectedId === BOT_CHAT_ID) return;
    socket.emit("edit_message", { messageId, text: newText, chatId: selectedId });
    setChats((prev) => prev.map((c) => ({ ...c, messages: c.messages.map((m) => String(m._id || m.id) === String(messageId) ? { ...m, text: newText, edited: true } : m) })));
  };
  const handleDelete = (messageId) => {
    if (selectedId === BOT_CHAT_ID) return;
    if (!window.confirm("¿Eliminar este mensaje?")) return;
    socket.emit("delete_message", { messageId, chatId: selectedId, forEveryone: true });
    setChats((prev) => prev.map((c) => ({ ...c, messages: c.messages.map((m) => String(m._id || m.id) === String(messageId) ? { ...m, deleted: true } : m) })));
  };
  const handleJump = (id) => {
    const el = msgRefs.current[id];
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.style.background = "var(--bg-active)"; setTimeout(() => (el.style.background = ""), 1500); }
  };
  const handleAddContact = ({ chatId, theirPhone, theirNombre }) => {
    const newChat = { id: chatId, chatId, name: theirNombre, phone: theirPhone, initials: theirNombre[0]?.toUpperCase() || "?", online: onlineUsers.has(theirPhone), isGroup: false, messages: [], unread: 0 };
    setChats((prev) => prev.find((c) => c.id === chatId) ? prev : [...prev, newChat]);
    socket.emit("join_chat", chatId);
    setSelectedId(chatId);
    setShowAddModal(false);
  };
  const handleSelectChat = (id) => {
    setSelectedId(id); setReplyMsg(null); setShowSearch(false);
    setMediaPreview(null); setShowGif(false); setShowEmojiPicker(false);
    setShowChatMenu(false);
    badgeReset();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {showAddModal && <AddContactModal myPhone={usuario.numero} myNombre={usuario.nombre} onAdd={handleAddContact} onClose={() => setShowAddModal(false)} />}
      {showProfile && <UserProfilePanel onClose={() => setShowProfile(false)} />}

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <span className="sidebar-logo">Nexus</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button className="icon-btn" onClick={() => setShowThemes((v) => !v)} style={{ color: showThemes ? "var(--accent)" : undefined }}><Ico.Palette /></button>
            <button className="icon-btn" onClick={() => setShowAddModal(true)} title="Nuevo chat"><Ico.Plus /></button>
            <button className="btn-ghost" onClick={cerrarSesion}>Salir</button>
          </div>
        </div>

        {showThemes && (
          <div className="theme-strip">
            <span className="theme-strip-label">Tema</span>
            <div className="theme-dots">
              {THEMES.map((t) => (
                <div key={t.id} className={`theme-dot${theme === t.id ? " active" : ""}`}
                  style={{ background: t.preview }} title={t.label} onClick={() => setTheme(t.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Barra de usuario — clic abre perfil */}
        <div className="sidebar-user-bar" onClick={() => setShowProfile(true)} title="Ver mi perfil"
          style={{ cursor: "pointer" }}>
          <span className="user-dot" />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {usuario.nombre !== usuario.numero ? usuario.nombre : usuario.numero}
          </span>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.65rem", color: "var(--text-meta)", fontFamily: "monospace" }}>{usuario.numero}</span>
            <Ico.User />
          </span>
        </div>

        <Stories usuario={usuario} />

        <div className="search-wrap">
          <input type="text" placeholder="Buscar chat..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="chat-list">
          {loadingChats
            ? <p style={{ padding: "1rem", fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>Cargando chats...</p>
            : <>
                {filteredChats.map((c) => <ChatItem key={c.id} chat={c} active={c.id === selectedId} onClick={() => handleSelectChat(c.id)} />)}
                {filteredChats.length === 0 && <p style={{ padding: "1rem", fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>Sin resultados</p>}
              </>
          }
        </div>
      </aside>

      {/* ── CHAT AREA ── */}
      {!chat ? (
        <main className={`chat ${selectedId ? "open" : ""}`}>
          <EmptyState onNew={() => setShowAddModal(true)} />
        </main>
      ) : (
        <main className={`chat ${selectedId ? "open" : ""}`} style={{ position: "relative" }}>

          {/* Header */}
          <div className="chat-header">
            <button className="icon-btn btn-back" onClick={() => setSelectedId(null)} title="Volver">
              <Ico.Back />
            </button>
            <Avatar initials={chat.initials} online={chat.online || getStatus(chat.phone)?.online} isGroup={chat.isGroup} />
            <div className="chat-header-info">
              <div className="chat-header-name">{chat.name}</div>
              <div className={`chat-header-status${(chat.online || getStatus(chat.phone)?.online) ? " online" : ""}`}>
                {headerStatus()}
              </div>
            </div>
            <div className="header-actions" style={{ position: "relative" }}>
              <button className="icon-btn" onClick={() => setShowSearch((v) => !v)} style={{ color: showSearch ? "var(--accent)" : undefined }}><Ico.Search /></button>
              <button className="icon-btn" title="Llamada" onClick={() => alert("Próximamente — Parte 5")}><Ico.Phone /></button>
              <button className="icon-btn" title="Videollamada" onClick={() => alert("Próximamente — Parte 5")}><Ico.Video /></button>
              <button className="icon-btn" onClick={() => setShowChatMenu((v) => !v)}
                style={{ color: showChatMenu ? "var(--accent)" : undefined }}>
                <Ico.Dots />
              </button>
              {showChatMenu && (
                <ChatMenu onClear={handleClearChat} onClose={() => setShowChatMenu(false)} />
              )}
            </div>
          </div>

          {/* Mensajes */}
          <div className="messages">
            {loading
              ? <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "2rem" }}>Cargando mensajes...</p>
              : <>
                  {chat.messages.length === 0 && (
                    <div style={{ textAlign: "center", marginTop: "3rem" }}>
                      <div style={{ fontSize: "2rem", marginBottom: 8 }}>💬</div>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                        {chat.isBot ? "Escríbele algo al bot para empezar" : `Di hola a ${chat.name}`}
                      </p>
                    </div>
                  )}
                  <div className="date-sep">Hoy</div>
                  {chat.messages.map((m) => (
                    <div key={m._id || m.id} ref={(el) => (msgRefs.current[m._id || m.id] = el)} style={{ transition: "background 0.4s", borderRadius: 8 }}>
                      <Bubble
                        msg={m}
                        currentUserPhone={usuario.numero}
                        onReply={setReplyMsg}
                        onReact={handleReact}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        replyMsg={m.replyTo ? chat.messages.find((x) => String(x._id || x.id) === String(m.replyTo)) : null}
                      />
                    </div>
                  ))}
                  {typing && <Bubble msg={{ typing: true }} currentUserPhone={usuario.numero} />}
                </>
            }
            <div ref={bottomRef} />
          </div>

          {showSearch && <SearchBar messages={chat.messages} onClose={() => setShowSearch(false)} onJump={handleJump} />}

          {uploading && <UploadProgress progress={progress} fileName={uploadFileName} onCancel={() => { resetUpload(); setPendingFile(null); }} />}
          {!uploading && <MediaPreviewBar media={mediaPreview} caption={caption} onCaptionChange={setCaption} onSend={sendMedia} onCancel={() => setMediaPreview(null)} />}
          <ReplyBar msg={replyMsg} onCancel={() => setReplyMsg(null)} />

          {/* Input bar */}
          <div className="input-bar">
            <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.rar,.7z" style={{ display: "none" }} onChange={handleFileSelect} />
            <button className="icon-btn" onClick={() => fileInputRef.current?.click()} title={`Adjuntar (máx. ${MAX_SIZE_MB}MB)`} disabled={uploading} style={{ opacity: uploading ? 0.5 : 1 }}><Ico.Attach /></button>

            <div style={{ position: "relative" }}>
              <button className="icon-btn" onClick={() => { setShowEmojiPicker((v) => !v); setShowGif(false); }} style={{ color: showEmojiPicker ? "var(--accent)" : undefined, fontSize: "1.1rem" }}>😊</button>
              {showEmojiPicker && (
                <EmojiPickerPanel onSelect={(emoji) => { setText((p) => p + emoji); setShowEmojiPicker(false); inputRef.current?.focus(); }} onClose={() => setShowEmojiPicker(false)} />
              )}
            </div>

            <div style={{ position: "relative" }}>
              <button className="icon-btn" onClick={() => { setShowGif((v) => !v); setShowEmojiPicker(false); }} style={{ color: showGif ? "var(--accent)" : undefined }}><Ico.Gif /></button>
              {showGif && <GifPicker onSelect={(gif) => sendMedia(gif, "")} onClose={() => setShowGif(false)} />}
            </div>

            <input ref={inputRef} value={text} onChange={handleTyping}
              placeholder={chat.isBot ? "Escríbele algo al bot..." : "Escribe un mensaje..."}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              disabled={uploading}
            />
            <button className="btn-send" onClick={send} disabled={uploading}><Ico.Send /></button>
          </div>
        </main>
      )}
    </div>
  );
}