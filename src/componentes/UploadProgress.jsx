export default function UploadProgress({ progress, fileName, onCancel }) {
  return (
    <div style={{
      display:       "flex",
      alignItems:    "center",
      gap:           12,
      padding:       "10px 16px",
      background:    "var(--bg-sidebar)",
      borderTop:     "1px solid var(--border-strong)",
      borderLeft:    "3px solid var(--accent)",
    }}>
      {/* Icono animado */}
      <div style={{
        width:          36,
        height:         36,
        borderRadius:   "50%",
        background:     `conic-gradient(var(--accent) ${progress * 3.6}deg, var(--bg-input) 0deg)`,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flexShrink:     0,
        transition:     "background 0.2s",
      }}>
        <div style={{
          width:          28,
          height:         28,
          borderRadius:   "50%",
          background:     "var(--bg-sidebar)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       "0.7rem",
          fontWeight:     700,
          color:          "var(--accent)",
          fontFamily:     "monospace",
        }}>
          {progress}%
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.78rem", color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", marginBottom: 4 }}>
          Subiendo {fileName}…
        </div>
        {/* Barra de progreso */}
        <div style={{ height: 3, background: "var(--bg-input)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height:     "100%",
            width:      `${progress}%`,
            background: "var(--accent)",
            borderRadius: 2,
            transition: "width 0.3s ease",
          }} />
        </div>
      </div>

      {/* Cancelar */}
      {onCancel && (
        <button
          onClick={onCancel}
          style={{
            background:   "none",
            border:       "1px solid var(--border-strong)",
            borderRadius: 8,
            padding:      "4px 10px",
            cursor:       "pointer",
            color:        "var(--text-muted)",
            fontSize:     "0.75rem",
            fontFamily:   "var(--font-body)",
            flexShrink:   0,
            transition:   "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#f43f5e"; e.currentTarget.style.borderColor = "#f43f5e"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}
        >
          Cancelar
        </button>
      )}
    </div>
  );
}