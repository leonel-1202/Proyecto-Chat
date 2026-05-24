import { useState, useRef, useEffect } from "react";

const CATEGORIES = [
    {
        label: "😀", title: "Smileys",
        emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖"],
    },
    {
        label: "👋", title: "Gestos",
        emojis: ["👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦵","🦶","👂","🦻","👃","🧠","🦷","🦴","👀","👁️","👅","👄","💋"],
    },
    {
        label: "❤️", title: "Amor",
        emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☯️","💏","💑","💍","💎","🌹","💐","🌷","🌸","💒","🏩","🎁","🎀","🎊","🎉","🥂","🍾","💌","💘"],
    },
    {
        label: "🐶", title: "Animales",
        emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🕷️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐈"],
    },
    {
        label: "🍕", title: "Comida",
        emojis: ["🍕","🍔","🍟","🌭","🍿","🧂","🥓","🥚","🍳","🧇","🥞","🧈","🍞","🥐","🥨","🥯","🧀","🥗","🥙","🌮","🌯","🫔","🥪","🍱","🍘","🍙","🍚","🍛","🍜","🍝","🍠","🍢","🍣","🍤","🍥","🥮","🍡","🥟","🥠","🥡","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍮","🍯","🍼","🥛","☕","🍵","🧃","🥤","🧋","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾"],
    },
    {
        label: "⚽", title: "Deportes",
        emojis: ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🏓","🏸","🏒","🥍","🏑","🥅","⛳","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛷","⛸️","🥌","🎿","⛷️","🏂","🪂","🏋️","🤼","🤸","⛹️","🤺","🏇","🧘","🏄","🏊","🚴","🏆","🥇","🥈","🥉","🏅","🎖️","🏵️","🎗️"],
    },
    {
        label: "🚀", title: "Viajes",
        emojis: ["🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍️","🛵","🚲","🛴","🛺","🚁","🛸","🚀","✈️","🛩️","🪂","⛵","🚢","🛳️","🚂","🚃","🚆","🚇","🚈","🚉","🚊","🚝","🚞","🚋","🚌","🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏯","🏰","🗼","🗽","🗿","🌋","⛺","🏕️","🌁","🌃","🌆","🌇","🌉","🌌","🌠","🎇","🎆"],
    },
    {
        label: "💡", title: "Objetos",
        emojis: ["💡","🔦","🕯️","🪔","💰","💳","💎","⚖️","🔧","🔨","⚒️","🛠️","⛏️","🔩","🪛","🔫","🧨","💣","🪓","🔪","🗡️","⚔️","🛡️","🪚","🔬","🔭","📡","💊","🩺","🩹","🩻","🩼","🧬","🦠","🧫","🧪","🌡️","🔮","🧿","🪬","🧲","🔋","🪫","💡","🔌","💻","🖥️","🖨️","⌨️","🖱️","🖲️","💾","💿","📀","📱","☎️","📞","📟","📠","📺","📻","🎙️","🎚️","🎛️","🧭","⏱️","⏰","⌚","📷","📸","📹","🎥","📽️","🎞️","📞","🔋","🪝","🧰","🔑","🗝️","🔐","🔒","🔓"],
    },
];

export default function EmojiPickerPanel({ onSelect, onClose }) {
    const [activeCategory, setActiveCategory] = useState(0);
    const [search, setSearch] = useState("");
    const ref = useRef();

    useEffect(() => {
        const handler = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
        setTimeout(() => document.addEventListener("mousedown", handler), 100);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    const searchResults = search.trim()
        ? CATEGORIES.flatMap((c) => c.emojis).filter((e) => {
            return true;
        }).slice(0, 60)
    : null;

    const displayed = searchResults || CATEGORIES[activeCategory].emojis;

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
            <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar emoji..."
                style={{
                    width: "100%", background: "var(--bg-input)",
                    border: "1px solid var(--border)", borderRadius: 10,
                    padding: "7px 12px", color: "var(--text-primary)",
                    fontFamily: "var(--font-body)", fontSize: "0.85rem", outline: "none",
                }}
            />
        </div>

        {!search && (
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", overflowX: "auto", padding: "4px 6px", gap: 2 }}>
            {CATEGORIES.map((cat, i) => (
                <button
                    key={i}
                    onClick={() => setActiveCategory(i)}
                    title={cat.title}
                    style={{
                        background: activeCategory === i ? "var(--bg-active)" : "none",
                        border: "none",
                        borderRadius: 8,
                        padding: "5px 8px",
                        fontSize: "1rem",
                        cursor: "pointer",
                        transition: "background 0.15s",
                        flexShrink: 0,
                    }}
                >
                {cat.label}
            </button>
            ))}
        </div>
        )}

        <div style={{ height: 220, overflowY: "auto", padding: "8px 10px" }}>
            {!search && (
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {CATEGORIES[activeCategory].title}
                </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2 }}>
                {displayed.map((emoji, i) => (
                    <button
                        key={i}
                        onClick={() => onSelect(emoji)}
                        style={{
                            background: "none", border: "none",
                            borderRadius: 8, padding: "5px",
                            fontSize: "1.3rem", cursor: "pointer",
                            lineHeight: 1, transition: "background 0.1s, transform 0.1s",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--bg-hover)";
                            e.currentTarget.style.transform = "scale(1.2)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "none";
                            e.currentTarget.style.transform = "scale(1)";
                        }}
                        >
                    {emoji}
                </button>
                ))}
            </div>
        </div>
    </div>
    );
}