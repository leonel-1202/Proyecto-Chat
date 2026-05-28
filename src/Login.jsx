import { useState, useRef, useEffect } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "./utils/firebaseConfig";
import { useAuth } from "./Auth-Context";
import { formatPhoneInput, normalizePhone } from "./utils/phoneUtils";

const COUNTRY_CODES = [
  { code: "+57", flag: "🇨🇴", name: "Colombia",       digits: 10 },
  { code: "+1",  flag: "🇺🇸", name: "Estados Unidos", digits: 10 },
  { code: "+52", flag: "🇲🇽", name: "México",         digits: 10 },
  { code: "+54", flag: "🇦🇷", name: "Argentina",      digits: 10 },
  { code: "+56", flag: "🇨🇱", name: "Chile",          digits: 9  },
  { code: "+51", flag: "🇵🇪", name: "Perú",           digits: 9  },
  { code: "+58", flag: "🇻🇪", name: "Venezuela",      digits: 10 },
  { code: "+34", flag: "🇪🇸", name: "España",         digits: 9  },
  { code: "+55", flag: "🇧🇷", name: "Brasil",         digits: 11 },
  { code: "+44", flag: "🇬🇧", name: "Reino Unido",    digits: 10 },
  { code: "+49", flag: "🇩🇪", name: "Alemania",       digits: 11 },
  { code: "+33", flag: "🇫🇷", name: "Francia",        digits: 9  },
];

const s = {
  input: {
    background: "var(--bg-input)",
    border: "1px solid var(--border-strong)",
    borderRadius: 14,
    color: "var(--text-primary)",
    padding: "0 18px",
    height: 54,
    width: "100%",
    fontSize: "1rem",
    fontFamily: "var(--font-body)",
    outline: "none",
    transition: "border-color 0.2s",
    letterSpacing: "0.03em",
    boxSizing: "border-box",
  },
  btn: (active) => ({
    background: active ? "var(--accent)" : "var(--bg-input)",
    color: active ? "var(--bg-base)" : "var(--text-meta)",
    border: "none",
    borderRadius: 14,
    height: 52,
    width: "100%",
    fontFamily: "var(--font-body)",
    fontWeight: 500,
    fontSize: "0.9rem",
    letterSpacing: "0.06em",
    cursor: active ? "pointer" : "default",
    transition: "all 0.25s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  }),
  title: {
    fontFamily: "var(--font-display)",
    fontSize: "1.75rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    lineHeight: 1.2,
  },
  subtitle: {
    marginTop: 8,
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  },
};

function PhoneInput({ onSubmit, loading }) {
  const [country,    setCountry]    = useState(COUNTRY_CODES[0]);
  const [rawDisplay, setRawDisplay] = useState("");
  const [normalized, setNormalized] = useState("");
  const [open,       setOpen]       = useState(false);
  const dropRef = useRef(null);

  const minDigits = country.digits || 7;
  const digits    = rawDisplay.replace(/\D/g, "");
  const canSubmit = digits.length >= minDigits && !loading;

  useEffect(() => {
    const handler = (e) => {
      if (!dropRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCountryChange = (c) => {
    setCountry(c);
    setRawDisplay("");
    setNormalized("");
    setOpen(false);
  };

  const handleChange = (e) => {
    const input = e.target.value;
    const { formatted, normalized: norm } = formatPhoneInput(input, country.code);
    setRawDisplay(formatted);
    setNormalized(norm);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(normalized || normalizePhone(country.code + rawDisplay));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <p style={s.title}>Ingresa tu número</p>
        <p style={s.subtitle}>Usaremos este número como tu identificador</p>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div ref={dropRef} style={{ position: "relative" }}>
          <button
            onClick={() => setOpen((o) => !o)}
            style={{
              background: "var(--bg-input)",
              border: `1px solid ${open ? "var(--accent-dim)" : "var(--border-strong)"}`,
              borderRadius: 14,
              color: "var(--text-primary)",
              padding: "0 12px",
              height: 54,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              transition: "border-color 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>{country.flag}</span>
            <span style={{ color: "var(--text-secondary)" }}>{country.code}</span>
            <svg
              width="11" height="11" viewBox="0 0 24 24"
              fill="none" stroke="var(--text-meta)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "0.2s" }}
            >
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>

          {open && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 100,
              background: "var(--bg-sidebar)", border: "1px solid var(--border-strong)",
              borderRadius: 14, overflow: "hidden", minWidth: 220,
              boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
              animation: "fadeUp 0.12s ease-out both",
              maxHeight: 280, overflowY: "auto",
            }}>
              {COUNTRY_CODES.map((c) => (
                <div
                  key={c.code + c.name}
                  onClick={() => handleCountryChange(c)}
                  style={{
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    color: country.code === c.code ? "var(--accent)" : "var(--text-primary)",
                    background: country.code === c.code ? "var(--bg-active)" : "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      country.code === c.code ? "var(--bg-active)" : "transparent")
                  }
                >
                  <span style={{ fontSize: "1rem" }}>{c.flag}</span>
                  <span style={{ flex: 1 }}>{c.name}</span>
                  <span style={{ color: "var(--text-meta)" }}>{c.code}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          type="tel"
          placeholder={
            country.code === "+57" ? "300 1234567" :
            country.code === "+1"  ? "300 123 4567" : "Número"
          }
          value={rawDisplay}
          onChange={handleChange}
          autoFocus
          disabled={loading}
          style={{ ...s.input, flex: 1 }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent-dim)")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--border-strong)")}
          onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSubmit()}
        />
      </div>

      {normalized && (
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: -16, paddingLeft: 4 }}>
          Tu número:{" "}
          <span style={{ color: "var(--accent-dim)", fontFamily: "monospace" }}>{normalized}</span>
        </div>
      )}

      <button style={s.btn(canSubmit)} onClick={handleSubmit} disabled={!canSubmit}>
        {loading ? "Enviando…" : "Continuar"}
        {!loading && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
        )}
      </button>

      <p style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--text-meta)", lineHeight: 1.6 }}>
        Al continuar aceptas los{" "}
        <span style={{ color: "var(--accent-dim)", cursor: "pointer" }}>Términos de servicio</span>
        {" "}y la{" "}
        <span style={{ color: "var(--accent-dim)", cursor: "pointer" }}>Política de privacidad</span>
      </p>
    </div>
  );
}

function CodeInput({ onComplete, onBack, phoneNumber, loading, cooldown, onResend }) {
  const [code, setCode] = useState("");
  const canSubmit = code.trim().length === 6 && !loading;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <p style={s.title}>Verifica tu número</p>
        <p style={s.subtitle}>
          Ingresa el código de 6 dígitos enviado al{" "}
          <span style={{ color: "var(--accent)", fontWeight: 500 }}>{phoneNumber}</span>
        </p>
      </div>

      <input
        type="text"
        placeholder="000000"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        maxLength={6}
        autoFocus
        disabled={loading}
        style={{ ...s.input, letterSpacing: "0.5em", textAlign: "center", fontSize: "1.25rem" }}
        onFocus={(e) => (e.target.style.borderColor = "var(--accent-dim)")}
        onBlur={(e)  => (e.target.style.borderColor = "var(--border-strong)")}
        onKeyDown={(e) => e.key === "Enter" && canSubmit && onComplete(code)}
      />

      <button
        style={s.btn(canSubmit)}
        onClick={() => canSubmit && onComplete(code)}
        disabled={!canSubmit}
      >
        {loading ? "Verificando…" : "Verificar Código"}
        {!loading && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
        )}
      </button>

      <button
        onClick={onResend}
        disabled={cooldown > 0 || loading}
        style={{
          background: "none", border: "none",
          cursor: cooldown > 0 || loading ? "default" : "pointer",
          color: cooldown > 0 || loading ? "var(--text-meta)" : "var(--accent-dim)",
          fontSize: "0.8rem", fontFamily: "var(--font-body)",
          padding: 0, textAlign: "center", transition: "color 0.2s",
        }}
      >
        {cooldown > 0 ? `Reenviar código en ${cooldown}s` : "Reenviar código"}
      </button>

      <button
        onClick={onBack}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-secondary)", fontSize: "0.8rem",
          fontFamily: "var(--font-body)", letterSpacing: "0.03em",
          display: "flex", alignItems: "center", gap: 6, padding: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Regresar
      </button>
    </div>
  );
}

function NameInput({ onComplete, onBack }) {
  const [nombre, setNombre] = useState("");
  const canSubmit = nombre.trim().length >= 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <p style={s.title}>¿Cómo te llamas?</p>
        <p style={s.subtitle}>Este será tu nombre visible en el chat</p>
      </div>

      <input
        type="text"
        placeholder="Tu nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        maxLength={30}
        autoFocus
        style={s.input}
        onFocus={(e) => (e.target.style.borderColor = "var(--accent-dim)")}
        onBlur={(e)  => (e.target.style.borderColor = "var(--border-strong)")}
        onKeyDown={(e) => e.key === "Enter" && canSubmit && onComplete(nombre.trim())}
      />

      <button
        style={s.btn(canSubmit)}
        onClick={() => canSubmit && onComplete(nombre.trim())}
        disabled={!canSubmit}
      >
        Entrar al chat
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
      </button>

      <button
        onClick={onBack}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-secondary)", fontSize: "0.8rem",
          fontFamily: "var(--font-body)", letterSpacing: "0.03em",
          display: "flex", alignItems: "center", gap: 6, padding: 0,
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Cambiar número
      </button>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const [step,               setStep]               = useState("phone");
  const [phoneNumber,        setPhoneNumber]        = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error,              setError]              = useState("");
  const [loading,            setLoading]            = useState(false);
  const [cooldown,           setCooldown]           = useState(0);

  useEffect(() => {
    initRecaptcha();
    return () => resetRecaptcha();
  }, []);

  const resetRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.warn("Error limpiando reCAPTCHA:", e);
      } finally {
        window.recaptchaVerifier = null;
      }
    }
  };

  const initRecaptcha = () => {
    resetRecaptcha();
    
    // Inicialización limpia apuntando al elemento estático del DOM
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      "expired-callback": () => {
        setError("El reCAPTCHA expiró, intenta de nuevo.");
        initRecaptcha();
      },
    });
  };

  const handlePhoneSubmit = async (fullNumber) => {
    const numeroLimpio = `+${fullNumber.replace(/\D/g, "")}`;
    try {
      setError("");
      setLoading(true);

      // Si por algún motivo la instancia se perdió, la recreamos de forma segura
      if (!window.recaptchaVerifier) {
        initRecaptcha();
      }

      const confirmation = await signInWithPhoneNumber(
        auth,
        numeroLimpio,
        window.recaptchaVerifier
      );

      setConfirmationResult(confirmation);
      setPhoneNumber(numeroLimpio);
      setStep("code");

      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Firebase Auth error:", err);
      setError(friendlyError(err.code));
      initRecaptcha(); // Forzamos un reset limpio tras un fallo de red o token inválido
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (code) => {
    if (!confirmationResult) {
      setError("Sesión expirada, vuelve a ingresar tu número.");
      setStep("phone");
      return;
    }
    try {
      setError("");
      setLoading(true);
      await confirmationResult.confirm(code);
      setStep("name");
    } catch (err) {
      console.error("Firebase confirm error:", err);
      setError("Código incorrecto. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = (nombre) => login(phoneNumber, nombre);

  const goPhone = () => {
    setConfirmationResult(null);
    setPhoneNumber("");
    setError("");
    setCooldown(0);
    initRecaptcha();
    setStep("phone");
  };

  const goCode = () => {
    if (confirmationResult) {
      setError("");
      setStep("code");
    } else {
      goPhone();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        background: "var(--bg-base)",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-body)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Contenedor estático e inmutable del reCAPTCHA */}
      <div id="recaptcha-container" />

      <div
        style={{
          position: "absolute",
          width: 420, height: 420,
          background: "var(--accent)",
          opacity: 0.05,
          filter: "blur(90px)",
          borderRadius: "50%",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "0 24px",
          position: "relative",
          animation: "fadeUp 0.4s ease-out both",
        }}
      >
        <div style={{ marginBottom: 44, display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36, height: 36,
              background: "var(--accent)",
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="var(--bg-base)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Nexus
          </span>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 36 }}>
          {["phone", "code", "name"].map((st, i) => (
            <div
              key={st}
              style={{
                height: 2, flex: 1,
                background:
                  ["phone", "code", "name"].indexOf(step) >= i
                    ? "var(--accent)"
                    : "var(--border-strong)",
                borderRadius: 2,
                transition: "background 0.4s",
              }}
            />
          ))}
        </div>

        {error && (
          <div
            style={{
              color: "#ff6b6b",
              fontSize: "0.8rem",
              marginBottom: 16,
              textAlign: "center",
              background: "rgba(255,107,107,0.1)",
              padding: "10px",
              borderRadius: 10,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ minHeight: 300 }}>
          {step === "phone" && (
            <PhoneInput onSubmit={handlePhoneSubmit} loading={loading} />
          )}
          {step === "code" && (
            <CodeInput
              onComplete={handleCodeSubmit}
              onBack={goPhone}
              phoneNumber={phoneNumber}
              loading={loading}
              cooldown={cooldown}
              onResend={() => handlePhoneSubmit(phoneNumber)}
            />
          )}
          {step === "name" && (
            <NameInput onComplete={handleNameSubmit} onBack={goCode} />
          )}
        </div>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    "auth/invalid-phone-number":    "Número de teléfono inválido.",
    "auth/too-many-requests":       "Demasiados intentos. Espera un momento.",
    "auth/quota-exceeded":          "Límite de SMS alcanzado. Intenta más tarde.",
    "auth/captcha-check-failed":    "Falló la verificación de reCAPTCHA.",
    "auth/missing-phone-number":    "Debes ingresar un número de teléfono.",
    "auth/network-request-failed":  "Sin conexión. Verifica tu internet.",
    "auth/invalid-app-credential":  "Configuración de Firebase incorrecta.",
    "auth/web-storage-unsupported": "Tu navegador no soporta esta función. Prueba con Chrome.",
  };
  return map[code] ?? `Error inesperado (${code ?? "desconocido"}).`;
}