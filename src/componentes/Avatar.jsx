const PALETTE = [
  "#5a4a8a", "#2d6a4f", "#7a2d2d", "#1e5a7a", "#6a4a1e",
  "#2d4a6a", "#5a2d6a", "#1e6a5a", "#6a3a1e", "#2a5a3a",
];

function colorFor(initials = "") {
  const code = initials.codePointAt(0) || 0;
  return PALETTE[code % PALETTE.length];
}

export default function Avatar({ initials = "?", online = false, isGroup = false, size = "md" }) {
  return (
    <div
      className={`avatar${isGroup ? " group" : ""}${size === "lg" ? " lg" : ""}`}
      style={{ background: colorFor(initials) }}
      aria-label={initials}
    >
      {initials}
      {online && <span className="online-dot" />}
    </div>
  );
}