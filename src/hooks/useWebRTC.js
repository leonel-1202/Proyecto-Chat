import { useRef, useState, useCallback, useEffect } from "react";
import socket from "../socket";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
    ],
};

export const CALL_STATE = {
    IDLE:     "idle",
    CALLING:  "calling",
    INCOMING: "incoming",
    ACTIVE:   "active",
};

export function useWebRTC({ usuario, chats }) {
    const [callState,   setCallState]   = useState(CALL_STATE.IDLE);
    const [callType,    setCallType]    = useState(null);
    const [remoteUser,  setRemoteUser]  = useState(null);
    const [isMuted,     setIsMuted]     = useState(false);
    const [isCamOff,    setIsCamOff]    = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [incomingOffer, setIncomingOffer] = useState(null);

    const pcRef          = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const localVideoRef  = useRef(null);
    const remoteVideoRef = useRef(null);
    const timerRef       = useRef(null);
    const pendingCandidates = useRef([]);

    const startTimer = () => {
        setCallDuration(0);
        timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    };
    const stopTimer = () => { clearInterval(timerRef.current); setCallDuration(0); };

    const formatDuration = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
    };

    const cleanup = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        pendingCandidates.current = [];
        stopTimer();
        setCallState(CALL_STATE.IDLE);
        setCallType(null);
        setRemoteUser(null);
        setIncomingOffer(null);
        setIsMuted(false);
        setIsCamOff(false);
        if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    }, []);

    const createPC = useCallback((targetPhone) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;

        pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
                socket.emit("call_ice_candidate", {
                    to:        targetPhone,
                    from:      usuario.numero,
                    candidate,
                });
            }
        };

        pc.ontrack = (event) => {
            const [remoteStream] = event.streams;
            remoteStreamRef.current = remoteStream;
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
        };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        hangUp();
      }
    };

    return pc;
  }, [usuario.numero]);

  const getLocalStream = async (type) => {
    const constraints = {
      audio: true,
      video: type === "video" ? { width: 1280, height: 720, facingMode: "user" } : false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  // ── INICIAR llamada ────────────────────────────────────────────────────────
  const startCall = useCallback(async (targetPhone, type = "audio") => {
    if (callState !== CALL_STATE.IDLE) return;

    // Buscar nombre del contacto
    const chat = chats?.find((c) => c.phone === targetPhone);
    const remote = {
      phone:    targetPhone,
      nombre:   chat?.name   || targetPhone,
      initials: chat?.initials || targetPhone[0]?.toUpperCase() || "?",
    };

    setCallType(type);
    setRemoteUser(remote);
    setCallState(CALL_STATE.CALLING);

    try {
      const stream = await getLocalStream(type);
      const pc     = createPC(targetPhone);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call_offer", {
        to:      targetPhone,
        from:    usuario.numero,
        nombre:  usuario.nombre || usuario.numero,
        type,
        offer,
      });
    } catch (err) {
      console.error("Error al iniciar llamada:", err);
      cleanup();
      if (err.name === "NotAllowedError") {
        alert("Necesitas permitir acceso al micrófono" + (type === "video" ? " y cámara" : "") + ".");
      }
    }
  }, [callState, chats, usuario, createPC, cleanup]);

  // ── ACEPTAR llamada entrante ───────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!incomingOffer || callState !== CALL_STATE.INCOMING) return;

    const { from, nombre, type, offer } = incomingOffer;
    setCallState(CALL_STATE.ACTIVE);

    try {
      const stream = await getLocalStream(type);
      const pc     = createPC(from);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Añadir candidatos pendientes
      for (const c of pendingCandidates.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      pendingCandidates.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call_answer", { to: from, from: usuario.numero, answer });
      startTimer();
    } catch (err) {
      console.error("Error al aceptar llamada:", err);
      cleanup();
    }
  }, [incomingOffer, callState, usuario, createPC, cleanup]);

  // ── RECHAZAR / COLGAR ──────────────────────────────────────────────────────
  const hangUp = useCallback((reason = "hangup") => {
    const target = remoteUser?.phone || incomingOffer?.from;
    if (target) {
      socket.emit("call_end", { to: target, from: usuario.numero, reason });
    }
    cleanup();
  }, [remoteUser, incomingOffer, usuario, cleanup]);

  const rejectCall = useCallback(() => {
    const from = incomingOffer?.from;
    if (from) socket.emit("call_end", { to: from, from: usuario.numero, reason: "rejected" });
    cleanup();
  }, [incomingOffer, usuario, cleanup]);

  // ── MUTE / CAM ─────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((v) => !v);
  }, []);

  const toggleCam = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCamOff((v) => !v);
  }, []);

  // ── Eventos de socket entrantes ────────────────────────────────────────────
  useEffect(() => {
    // Oferta de llamada entrante
    socket.on("call_offer", ({ from, nombre, type, offer }) => {
      if (callState !== CALL_STATE.IDLE) {
        // Ya estamos en llamada → rechazar automáticamente
        socket.emit("call_end", { to: from, from: usuario.numero, reason: "busy" });
        return;
      }
      const chat = chats?.find((c) => c.phone === from);
      setIncomingOffer({ from, nombre: nombre || chat?.name || from, type, offer });
      setCallType(type);
      setRemoteUser({
        phone:    from,
        nombre:   nombre || chat?.name || from,
        initials: (nombre || chat?.name || from)[0]?.toUpperCase() || "?",
      });
      setCallState(CALL_STATE.INCOMING);
    });

    // Respuesta a nuestra oferta
    socket.on("call_answer", async ({ answer }) => {
      if (!pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        // Añadir candidatos pendientes
        for (const c of pendingCandidates.current) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidates.current = [];
        setCallState(CALL_STATE.ACTIVE);
        startTimer();
      } catch (err) {
        console.error("Error en call_answer:", err);
        cleanup();
      }
    });

    // Candidato ICE del otro peer
    socket.on("call_ice_candidate", async ({ candidate }) => {
      if (pcRef.current?.remoteDescription) {
        try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (err) { console.error("ICE error:", err); }
      } else {
        // Guardar para después de setRemoteDescription
        pendingCandidates.current.push(candidate);
      }
    });

    // Llamada terminada / rechazada
    socket.on("call_end", ({ reason }) => {
      cleanup();
      if (reason === "rejected") console.log("Llamada rechazada");
      if (reason === "busy")     console.log("Usuario ocupado");
    });

    return () => {
      socket.off("call_offer");
      socket.off("call_answer");
      socket.off("call_ice_candidate");
      socket.off("call_end");
    };
  }, [callState, chats, usuario, cleanup]);

  return {
    callState, callType, remoteUser, isMuted, isCamOff,
    callDuration, formatDuration,
    localVideoRef, remoteVideoRef,
    startCall, acceptCall, hangUp, rejectCall,
    toggleMute, toggleCam,
    CALL_STATE,
  };
}