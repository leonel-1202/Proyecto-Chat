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
  const [callState,    setCallState]    = useState(CALL_STATE.IDLE);
  const [callType,     setCallType]     = useState(null);
  const [remoteUser,   setRemoteUser]   = useState(null);
  const [isMuted,      setIsMuted]      = useState(false);
  const [isCamOff,     setIsCamOff]     = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [incomingOffer, setIncomingOffer] = useState(null);

  const pcRef             = useRef(null);
  const localStreamRef    = useRef(null);
  const remoteStreamRef   = useRef(null);
  const localVideoRef     = useRef(null);
  const remoteVideoRef    = useRef(null);
  const remoteAudioRef    = useRef(null);
  const timerRef          = useRef(null);
  const pendingCandidates = useRef([]);
  
  // Clonamos el callState en una referencia para que los sockets mutables lo lean actualizado
  const callStateRef      = useRef(CALL_STATE.IDLE);
  const targetPhoneRef    = useRef(null);

  // Mantener la referencia del estado al día
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallDuration(0);
    timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallDuration(0);
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const attachRemoteStream = useCallback(() => {
    if (!remoteStreamRef.current) return;
    if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current && !remoteAudioRef.current.srcObject) {
      remoteAudioRef.current.srcObject = remoteStreamRef.current;
      remoteAudioRef.current.play().catch(() => {});
    }
  }, []);

  const cleanup = useCallback(() => {
    stopTimer();
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
    
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    targetPhoneRef.current = null;
    pendingCandidates.current = [];
    
    try { if (localVideoRef.current)  localVideoRef.current.srcObject  = null; } catch {}
    try { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null; } catch {}
    try { if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null; } catch {}
    
    setCallState(CALL_STATE.IDLE);
    setCallType(null);
    setRemoteUser(null);
    setIncomingOffer(null);
    setIsMuted(false);
    setIsCamOff(false);
  }, []);

  const hangUp = useCallback((reason = "hangup") => {
    const target = targetPhoneRef.current;
    if (target && usuario?.numero) {
      socket.emit("call_end", { to: target, from: usuario.numero, reason });
    }
    cleanup();
  }, [usuario?.numero, cleanup]);

  const createPC = useCallback((targetPhone) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && usuario?.numero) {
        socket.emit("call_ice_candidate", { to: targetPhone, from: usuario.numero, candidate });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      remoteStreamRef.current = stream;
      attachRemoteStream();
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "disconnected" || s === "failed" || s === "closed") {
        hangUp("disconnected");
      }
    };

    return pc;
  }, [usuario?.numero, attachRemoteStream, hangUp]);

  const getLocalStream = async (type) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video" ? { width: 1280, height: 720, facingMode: "user" } : false,
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(() => {});
    }
    return stream;
  };

  const startCall = useCallback(async (targetPhone, type = "audio") => {
    if (callStateRef.current !== CALL_STATE.IDLE) return;

    const chatObj = chats?.find((c) => c.phone === targetPhone);
    const remote = {
      phone:    targetPhone,
      nombre:   chatObj?.name    || targetPhone,
      initials: chatObj?.initials || targetPhone[0]?.toUpperCase() || "?",
    };

    targetPhoneRef.current = targetPhone;
    setCallType(type);
    setRemoteUser(remote);
    setCallState(CALL_STATE.CALLING);

    try {
      const stream = await getLocalStream(type);
      const pc     = createPC(targetPhone);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socket.emit("call_offer", {
        to: targetPhone, from: usuario.numero,
        nombre: usuario.nombre || usuario.numero, type, offer,
      });
    } catch (err) {
      console.error("Error al iniciar llamada:", err);
      cleanup();
      if (err.name === "NotAllowedError")
        alert("Necesitas permitir acceso al " + (type === "video" ? "micrófono y cámara" : "micrófono") + ".");
    }
  }, [chats, usuario, createPC, cleanup]);

  const acceptCall = useCallback(async () => {
    if (!incomingOffer || callStateRef.current !== CALL_STATE.INCOMING) return;

    const { from, type, offer } = incomingOffer;
    targetPhoneRef.current = from;
    setCallState(CALL_STATE.ACTIVE);

    try {
      const stream = await getLocalStream(type);
      const pc     = createPC(from);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      for (const c of pendingCandidates.current)
        await pc.addIceCandidate(new RTCIceCandidate(c));
      pendingCandidates.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("call_answer", { to: from, from: usuario.numero, answer });
      startTimer();
    } catch (err) {
      console.error("Error al aceptar llamada:", err);
      cleanup();
    }
  }, [incomingOffer, usuario, createPC, cleanup]);

  const rejectCall = useCallback(() => {
    const from = incomingOffer?.from;
    if (from && usuario?.numero) {
      socket.emit("call_end", { to: from, from: usuario.numero, reason: "rejected" });
    }
    cleanup();
  }, [incomingOffer, usuario, cleanup]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((v) => !v);
  }, []);

  const toggleCam = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsCamOff((v) => !v);
  }, []);

  // ESCUCHADORES DE SOCKET: Se ejecutan UNA SOLA VEZ al montar el componente
  useEffect(() => {
    if (!usuario?.numero) return;

    const handleOffer = ({ from, nombre, type, offer }) => {
      // Usamos callStateRef para saber el estado real y fresco
      if (callStateRef.current !== CALL_STATE.IDLE) {
        socket.emit("call_end", { to: from, from: usuario.numero, reason: "busy" });
        return;
      }
      const chatObj = chats?.find((c) => c.phone === from);
      const remote = {
        phone:    from,
        nombre:   nombre || chatObj?.name || from,
        initials: (nombre || chatObj?.name || from)[0]?.toUpperCase() || "?",
      };
      targetPhoneRef.current = from;
      setIncomingOffer({ from, nombre: remote.nombre, type, offer });
      setCallType(type);
      setRemoteUser(remote);
      setCallState(CALL_STATE.INCOMING);
    };

    const handleAnswer = async ({ answer }) => {
      if (!pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        for (const c of pendingCandidates.current)
          await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
        pendingCandidates.current = [];
        setCallState(CALL_STATE.ACTIVE);
        startTimer();
        setTimeout(attachRemoteStream, 100);
      } catch (err) { 
        console.error("Error en call_answer:", err); 
        cleanup(); 
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (pcRef.current?.remoteDescription) {
        try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (err) { console.error("ICE error:", err); }
      } else {
        pendingCandidates.current.push(candidate);
      }
    };

    const handleCallEnd = () => {
      cleanup();
    };

    socket.on("call_offer", handleOffer);
    socket.on("call_answer", handleAnswer);
    socket.on("call_ice_candidate", handleIceCandidate);
    socket.on("call_end", handleCallEnd);

    return () => {
      socket.off("call_offer", handleOffer);
      socket.off("call_answer", handleAnswer);
      socket.off("call_ice_candidate", handleIceCandidate);
      socket.off("call_end", handleCallEnd);
    };
  }, [usuario?.numero, chats, cleanup, attachRemoteStream]); // Quitado callState de aquí

  return {
    callState, callType, remoteUser,
    isMuted, isCamOff, callDuration, formatDuration,
    localVideoRef, remoteVideoRef, remoteAudioRef,
    attachRemoteStream,
    startCall, acceptCall, hangUp, rejectCall,
    toggleMute, toggleCam,
    CALL_STATE,
  };
}