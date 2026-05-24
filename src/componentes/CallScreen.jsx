import { useEffect, useRef } from "react";
import Avatar from "./Avatar";

const Hang = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.98.37 2.05.6 3.13.6a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2C8.95 22 2 15.05 2 6.5A2 2 0 0 1 4 4.5h3a2 2 0 0 1 2 2c0 1.09.24 2.15.6 3.13a2 2 0 0 1-.45 2.11L8.09 12.96a16 16 0 0 0 2.59 3.41z"/>
        <line x1="2" y1="2" x2="22" y2="22"/>
    </svg>
);

const Accept = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.21 3.18 2 2 0 0 1 3.22 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l.62-.62a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/>
    </svg>
);

const MicOff = () => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="2" y1="2" x2="22" y2="22"/>
        <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/>
        <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/>
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" y1="19" x2="12" y2="22"/>
        <line x1="8" y1="22" x2="16" y2="22"/>
    </svg>
);

const MicOn = () => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
        <line x1="8" y1="22" x2="16" y2="22"/>
    </svg>
);

const CamOff = () => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="2" y1="2" x2="22" y2="22"/>
        <path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h11"/>
        <path d="M9.5 4H18a2 2 0 0 1 2 2v9.5"/><path d="M22 8l-5 5V8l5-5v9"/>
    </svg>
);

const CamOn = () => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/>
    </svg>
);

function CallBtn({ onClick, color, title, children, size = 60 }) {
    return (
        <button
            onClick={onClick}
            title={title}
            style={{
                width:          size,
                height:         size,
                borderRadius:   "50%",
                background:     color,
                border:         "none",
                cursor:         "pointer",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                color:          "white",
                transition:     "opacity 0.15s, transform 0.1s",
                flexShrink:     0,
                boxShadow:      "0 4px 16px rgba(0,0,0,0.3)",
            }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        onMouseDown={(e)  => e.currentTarget.style.transform = "scale(0.94)"}
        onMouseUp={(e)    => e.currentTarget.style.transform = "scale(1)"}
    >
        {children}
    </button>
    );
}

function PulseRings() {
    return (
        <div style={{ position: "relative", width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {[1, 2, 3].map((i) => (
                <div key={i} style={{
                    position:     "absolute",
                    width:        "100%",
                    height:       "100%",
                    borderRadius: "50%",
                    border:       "2px solid var(--accent)",
                    opacity:      0,
                    animation:    `pulseRing 2s ease-out ${i * 0.5}s infinite`,
                }} />
            ))}
        <style>{`
            @keyframes pulseRing {
                0%   { transform: scale(0.8); opacity: 0.8; }
                100% { transform: scale(1.8); opacity: 0; }
            }
        `}</style>
    </div>
    );
}

function IncomingCall({ remoteUser, callType, onAccept, onReject }) {
    return (
        <div style={{
            position:       "fixed",
            inset:          0,
            zIndex:         500,
            background:     "rgba(0,0,0,0.85)",
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            gap:            24,
            backdropFilter: "blur(8px)",
            animation:      "fadeUp 0.2s ease-out both",
    }}>
        <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {callType === "video" ? "📹 Videollamada entrante" : "📞 Llamada entrante"}
        </div>

        <div style={{ position: "relative" }}>
            <PulseRings />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Avatar initials={remoteUser.initials} size="lg" />
            </div>
        </div>

        <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 600, color: "white", marginBottom: 6 }}>
                {remoteUser.nombre}
            </div>
        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>{remoteUser.phone}</div>
        </div>

        <div style={{ display: "flex", gap: 48, marginTop: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <CallBtn onClick={onReject} color="#f43f5e" title="Rechazar" size={64}>
                    <Hang />
                </CallBtn>
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>Rechazar</span>
            </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <CallBtn onClick={onAccept} color="#25d366" title="Aceptar" size={64}>
                <Accept />
            </CallBtn>
            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>Aceptar</span>
        </div>
        </div>
    </div>
    );
}

function AudioCall({ remoteUser, isMuted, duration, onMute, onHangUp }) {
    return (
        <div style={{
            position:       "fixed",
            inset:          0,
            zIndex:         500,
            background:     "linear-gradient(160deg, var(--bg-sidebar) 0%, var(--bg-base) 100%)",
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            gap:            20,
    }}>
        <Avatar initials={remoteUser.initials} size="lg" />

        <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                {remoteUser.nombre}
            </div>
        <div style={{ fontSize: "1rem", color: "var(--accent)", fontFamily: "monospace", letterSpacing: "0.1em" }}>
            {duration}
        </div>
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: 32 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <CallBtn onClick={onMute} color={isMuted ? "var(--accent)" : "rgba(255,255,255,0.12)"} title={isMuted ? "Activar mic" : "Silenciar"} size={56}>
                {isMuted ? <MicOff /> : <MicOn />}
            </CallBtn>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{isMuted ? "Activar" : "Silenciar"}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <CallBtn onClick={onHangUp} color="#f43f5e" title="Colgar" size={64}>
                <Hang />
            </CallBtn>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Colgar</span>
        </div>
        </div>
    </div>
    );
}

function VideoCall({ remoteUser, localVideoRef, remoteVideoRef, isMuted, isCamOff, duration, onMute, onCam, onHangUp }) {
    return (
        <div style={{
            position:   "fixed",
            inset:      0,
            zIndex:     500,
            background: "#000",
        }}>
        <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />

        <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
                position:     "absolute",
                bottom:       100,
                right:        16,
                width:        120,
                height:       160,
                objectFit:    "cover",
                borderRadius: 12,
                border:       "2px solid rgba(255,255,255,0.3)",
                background:   "#111",
            }}
        />

        <div style={{
            position:   "absolute",
            top:        20,
            left:       0,
            right:      0,
            textAlign:  "center",
        }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 600, color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
                {remoteUser.nombre}
            </div>
            <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", fontFamily: "monospace", marginTop: 4 }}>
                {duration}
            </div>
        </div>

        <div style={{
            position:       "absolute",
            bottom:         24,
            left:           0,
            right:          0,
            display:        "flex",
            justifyContent: "center",
            gap:            20,
        }}>
            <CallBtn onClick={onMute} color={isMuted ? "var(--accent)" : "rgba(255,255,255,0.2)"} title={isMuted ? "Activar mic" : "Silenciar"} size={52}>
                {isMuted ? <MicOff /> : <MicOn />}
            </CallBtn>

            <CallBtn onClick={onHangUp} color="#f43f5e" title="Colgar" size={60}>
                <Hang />
            </CallBtn>

            <CallBtn onClick={onCam} color={isCamOff ? "var(--accent)" : "rgba(255,255,255,0.2)"} title={isCamOff ? "Activar cámara" : "Apagar cámara"} size={52}>
                {isCamOff ? <CamOff /> : <CamOn />}
            </CallBtn>
        </div>
    </div>
    );
}

function CallingBanner({ remoteUser, callType, onHangUp }) {
    return (
        <div style={{
            position:       "fixed",
            inset:          0,
            zIndex:         500,
            background:     "rgba(0,0,0,0.88)",
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            gap:            20,
            backdropFilter: "blur(8px)",
        }}>
        <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {callType === "video" ? "📹 Videollamada" : "📞 Llamada de voz"}
        </div>

        <div style={{ position: "relative" }}>
            <PulseRings />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Avatar initials={remoteUser.initials} size="lg" />
            </div>
        </div>    

        <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 600, color: "white", marginBottom: 6 }}>
                {remoteUser.nombre}
            </div>
            <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", animation: "pulse 1.5s infinite" }}>
                Llamando…
            </div>
        </div>

        <CallBtn onClick={onHangUp} color="#f43f5e" title="Cancelar" size={60}>
            <Hang />
        </CallBtn>
    </div>
    );
}

export default function CallScreen({
    callState, callType, remoteUser,
    isMuted, isCamOff,
    callDuration, formatDuration,
    localVideoRef, remoteVideoRef,
    onAccept, onReject, onHangUp,
    onMute, onCam,
    CALL_STATE,
}) {
    const duration = formatDuration(callDuration);

    if (callState === CALL_STATE.INCOMING) {
        return <IncomingCall remoteUser={remoteUser} callType={callType} onAccept={onAccept} onReject={onReject} />;
    }

    if (callState === CALL_STATE.CALLING) {
        return <CallingBanner remoteUser={remoteUser} callType={callType} onHangUp={onHangUp} />;
    }

    if (callState === CALL_STATE.ACTIVE && callType === "audio") {
        return <AudioCall remoteUser={remoteUser} isMuted={isMuted} duration={duration} onMute={onMute} onHangUp={onHangUp} />;
    }

    if (callState === CALL_STATE.ACTIVE && callType === "video") {
        return (
        <VideoCall
            remoteUser={remoteUser}
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            isMuted={isMuted}
            isCamOff={isCamOff}
            duration={duration}
            onMute={onMute}
            onCam={onCam}
            onHangUp={onHangUp}
        />
    );
    }

    return null;
}