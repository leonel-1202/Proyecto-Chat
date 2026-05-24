import { useState, useEffect, useRef } from "react";
import { getEstados, crearEstado } from "../api";

const BG_COLORS = [
  "#1a1a2e", "#16213e", "#0f3460", "#533483",
  "#2d6a4f", "#1b4332", "#7b2d8b", "#c9184a",
  "#e63946", "#457b9d", "#2a9d8f", "#e76f51",
];

const DURATIONS_MS = 5000; // cada story dura 5s en el viewer

// ── Progreso bar de cada story ────────────────────────────────────────────────
function StoryProgress({ count, current, paused, onDone }) {
  const [width, setWidth] = useState(0);
  const rafRef  = useRef();
  const startRef = useRef();

  useEffect(() => {
    setWidth(0);
    startRef.current = null;

    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      if (paused) { startRef.current = ts - (width / 100) * DURATIONS_MS; rafRef.current = requestAnimationFrame(animate); return; }
      const elapsed = ts - startRef.current;
      const pct = Math.min((elapsed / DURATIONS_MS) * 100, 100);
      setWidth(pct);
      if (pct < 100) { rafRef.current = requestAnimationFrame(animate); }
      else { onDone(); }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [current, paused]);

  return (
    <div style={{ display: "flex", gap: 4, width: "100%", padding: "0 16px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.3)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            background: "white",
            width: i < current ? "100%" : i === current ? `${width}%` : "0%",
            transition: i === current ? "none" : undefined,
            borderRadius: 2,
          }} />
        </div>
      ))}
    </div>
  );
}

// ── Viewer de stories de un usuario ──────────────────────────────────────────
function StoryViewer({ stories, user, onClose, onNext, onPrev, hasPrev, hasNext }) {
  const [idx,    setIdx]    = useState(0);
  const [paused, setPaused] = useState(false);

  const story = stories[idx];

  const goNext = () => {
    if (idx < stories.length - 1) setIdx((i) => i + 1);
    else if (hasNext) onNext();
    else onClose();
  };
  const goPrev = () => {
    if (idx > 0) setIdx((i) => i - 1);
    else if (hasPrev) onPrev();
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "black", display: "flex", alignItems: "center", justifyContent: "center" }}
      onMouseDown={() => setPaused(true)}
      onMouseUp={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Fondo / contenido */}
      <div style={{
        width: "100%", maxWidth: 420, height: "100dvh",
        background: story.type === "image" ? `url(${story.content}) center/cover` : story.color || "#1a1a2e",
        display: "flex", flexDirection: "column",
        position: "relative", overflow: "hidden",
      }}>
        {/* Progreso */}
        <div style={{ paddingTop: 12, zIndex: 10 }}>
          <StoryProgress count={stories.length} current={idx} paused={paused} onDone={goNext} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", zIndex: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", color: "white", flexShrink: 0 }}>
            {user.initials}
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 600, fontSize: "0.9rem", fontFamily: "var(--font-body)" }}>{user.nombre}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.7rem" }}>{story.time}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "white", fontSize: "1.4rem", lineHeight: 1 }}>✕</button>
        </div>

        {/* Texto del estado */}
        {story.type === "text" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 28px" }}>
            <p style={{ color: "white", fontSize: "1.5rem", fontFamily: "var(--font-display)", textAlign: "center", lineHeight: 1.4, textShadow: "0 2px 8px rgba(0,0,0,0.4)", fontWeight: 600 }}>
              {story.content}
            </p>
          </div>
        )}

        {/* Zonas de tap izq/der */}
        <div style={{ position: "absolute", inset: 0, display: "flex", zIndex: 5 }}>
          <div style={{ flex: 1, cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); goPrev(); }} />
          <div style={{ flex: 1, cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); goNext(); }} />
        </div>
      </div>
    </div>
  );
}

// ── Avatar de story (anillo de color si tiene stories) ────────────────────────
function StoryAvatar({ user, unseen, onClick }) {
  return (
    <div onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer", flexShrink: 0 }}>
      <div style={{
        width: 54, height: 54, borderRadius: "50%",
        padding: 2,
        background: unseen ? "linear-gradient(135deg, var(--accent), var(--accent-dim))" : "var(--border-strong)",
        transition: "opacity 0.2s",
      }}>
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--bg-sidebar)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", border: "2px solid var(--bg-sidebar)" }}>
          {user.initials}
        </div>
      </div>
      <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", maxWidth: 56, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {user.nombre.split(" ")[0]}
      </span>
    </div>
  );
}

// ── Modal crear story ─────────────────────────────────────────────────────────
function CreateStoryModal({ onPublish, onClose }) {
  const [type,    setType]    = useState("text"); // "text" | "image"
  const [content, setContent] = useState("");
  const [color,   setColor]   = useState(BG_COLORS[0]);
  const [imgUrl,  setImgUrl]  = useState("");
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setImgUrl(ev.target.result); setType("image"); };
    reader.readAsDataURL(file);
  };

  const canPublish = type === "text" ? content.trim().length > 0 : !!imgUrl;

  const handlePublish = () => {
    if (!canPublish) return;
    onPublish({ type, content: type === "text" ? content.trim() : imgUrl, color });
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 150, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "var(--bg-sidebar)", border: "1px solid var(--border-strong)", borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 400, animation: "fadeUp 0.2s ease-out both" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Nuevo estado
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem" }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["text", "image"].map((t) => (
            <button key={t} onClick={() => setType(t)}
              style={{ flex: 1, background: type === t ? "var(--accent)" : "var(--bg-input)", color: type === t ? "var(--bg-base)" : "var(--text-secondary)", border: "none", borderRadius: 10, padding: "8px 0", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 600, transition: "all 0.2s" }}>
              {t === "text" ? "✏️ Texto" : "🖼️ Imagen"}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div style={{ width: "100%", height: 180, borderRadius: 14, background: type === "image" && imgUrl ? `url(${imgUrl}) center/cover` : color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, overflow: "hidden", transition: "background 0.3s" }}>
          {type === "text" && (
            <p style={{ color: "white", fontSize: "1.1rem", fontFamily: "var(--font-display)", textAlign: "center", padding: "0 20px", fontWeight: 600, lineHeight: 1.4 }}>
              {content || "Tu estado aquí..."}
            </p>
          )}
          {type === "image" && !imgUrl && (
            <div style={{ color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: 6 }}>🖼️</div>
              <div style={{ fontSize: "0.8rem" }}>Selecciona una imagen</div>
            </div>
          )}
        </div>

        {/* Input texto */}
        {type === "text" && (
          <>
            <textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="¿Qué está pasando?"
              maxLength={200}
              rows={3}
              style={{ width: "100%", background: "var(--bg-input)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "10px 14px", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "0.9rem", outline: "none", resize: "none", lineHeight: 1.5, boxSizing: "border-box" }}
              onFocus={(e) => e.target.style.borderColor = "var(--accent-dim)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border-strong)"}
            />
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textAlign: "right", marginTop: 4, marginBottom: 12 }}>{content.length}/200</div>

            {/* Colores de fondo */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {BG_COLORS.map((c) => (
                <div key={c} onClick={() => setColor(c)}
                  style={{ width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer", border: color === c ? "3px solid var(--accent)" : "2px solid transparent", transition: "border 0.15s", flexShrink: 0 }} />
              ))}
            </div>
          </>
        )}

        {/* Input imagen */}
        {type === "image" && (
          <>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
            <button onClick={() => fileRef.current?.click()}
              style={{ width: "100%", background: "var(--bg-input)", border: "1px dashed var(--border-strong)", borderRadius: 10, padding: "12px", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "0.85rem", marginBottom: 16, transition: "all 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent-dim)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-strong)"}>
              {imgUrl ? "✅ Imagen seleccionada · Cambiar" : "📁 Seleccionar imagen"}
            </button>
          </>
        )}

        <button onClick={handlePublish} disabled={!canPublish}
          style={{ width: "100%", background: canPublish ? "var(--accent)" : "var(--bg-input)", color: canPublish ? "var(--bg-base)" : "var(--text-muted)", border: "none", borderRadius: 12, height: 46, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.9rem", cursor: canPublish ? "pointer" : "default", transition: "all 0.2s" }}>
          Publicar estado
        </button>
      </div>
    </div>
  );
}

// ── Componente principal Stories ──────────────────────────────────────────────
export default function Stories({ usuario }) {
  const [stories,      setStories]      = useState([]);
  const [viewerUser,   setViewerUser]   = useState(null); // { nombre, initials, phone, stories[] }
  const [viewerIdx,    setViewerIdx]    = useState(0);    // índice de grupo de usuarios
  const [showCreate,   setShowCreate]   = useState(false);
  const [userGroups,   setUserGroups]   = useState([]);   // [{ phone, nombre, initials, stories[], seen }]
  const scrollRef = useRef();

  // Cargar estados al montar
  useEffect(() => {
    getEstados(usuario.numero)
      .then((res) => {
        setStories(res.data);
        groupStories(res.data);
      })
      .catch(console.error);
  }, [usuario.numero]);

  const groupStories = (data) => {
    const map = new Map();
    data.forEach((s) => {
      if (!map.has(s.phone)) {
        map.set(s.phone, {
          phone:    s.phone,
          nombre:   s.nombre || s.phone,
          initials: (s.nombre || s.phone)[0]?.toUpperCase() || "?",
          stories:  [],
          seen:     false,
        });
      }
      const entry = map.get(s.phone);
      entry.stories.push({
        ...s,
        time: new Date(s.createdAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
      });
      if (s.viewers?.includes(usuario.numero)) entry.seen = true;
    });

    // Mi story primero
    const mine  = map.get(usuario.numero);
    const others = [...map.values()].filter((g) => g.phone !== usuario.numero);
    const sorted = mine ? [mine, ...others] : others;
    setUserGroups(sorted);
  };

  const handlePublish = async ({ type, content, color }) => {
    try {
      const res = await crearEstado({
        phone:   usuario.numero,
        nombre:  usuario.nombre || usuario.numero,
        content,
        type,
        color,
      });
      const updated = [res.data, ...stories];
      setStories(updated);
      groupStories(updated);
      setShowCreate(false);
    } catch (err) {
      console.error("Error publicando estado:", err);
    }
  };

  const openViewer = (group, idx) => {
    setViewerUser(group);
    setViewerIdx(idx);
  };

  const closeViewer = () => { setViewerUser(null); };

  const goNextUser = () => {
    const nextIdx = viewerIdx + 1;
    if (nextIdx < userGroups.length) { setViewerUser(userGroups[nextIdx]); setViewerIdx(nextIdx); }
    else closeViewer();
  };
  const goPrevUser = () => {
    const prevIdx = viewerIdx - 1;
    if (prevIdx >= 0) { setViewerUser(userGroups[prevIdx]); setViewerIdx(prevIdx); }
  };

  if (userGroups.length === 0 && !usuario) return null;

  return (
    <>
      {/* ── Franja horizontal de stories ── */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "10px 0 12px", background: "var(--bg-sidebar)" }}>
        <div ref={scrollRef} style={{ display: "flex", gap: 14, overflowX: "auto", padding: "0 14px", scrollbarWidth: "none" }}>

          {/* Botón añadir mi story */}
          <div onClick={() => setShowCreate(true)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer", flexShrink: 0 }}>
            <div style={{ width: 54, height: 54, borderRadius: "50%", background: "var(--bg-input)", border: "2px dashed var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", transition: "border-color 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent-dim)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-strong)"}>
              <span style={{ fontSize: "1.4rem", color: "var(--accent)", lineHeight: 1 }}>+</span>
            </div>
            <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>Mi estado</span>
          </div>

          {/* Stories de otros */}
          {userGroups.map((group, i) => (
            <StoryAvatar key={group.phone} user={group} unseen={!group.seen}
              onClick={() => openViewer(group, i)} />
          ))}
        </div>
      </div>

      {/* Viewer */}
      {viewerUser && (
        <StoryViewer
          stories={viewerUser.stories}
          user={viewerUser}
          onClose={closeViewer}
          onNext={goNextUser}
          onPrev={goPrevUser}
          hasNext={viewerIdx < userGroups.length - 1}
          hasPrev={viewerIdx > 0}
        />
      )}

      {/* Modal crear */}
      {showCreate && (
        <CreateStoryModal onPublish={handlePublish} onClose={() => setShowCreate(false)} />
      )}
    </>
  );
}