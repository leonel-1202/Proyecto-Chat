// ── Formatos de separación por país ──────────────────────────────────────────
// Cada entrada define cómo agrupar los dígitos locales (sin código de país)
const FORMATS = {
  "+57":  [3, 7],        // Colombia:       300 1234567
  "+1":   [3, 3, 4],    // USA/Canadá:     300 123 4567
  "+52":  [2, 4, 4],    // México:         55 1234 5678
  "+54":  [2, 4, 4],    // Argentina:      11 2345 6789
  "+56":  [1, 4, 4],    // Chile:          9 1234 5678
  "+51":  [2, 4, 4],    // Perú:           99 1234 567
  "+58":  [3, 7],        // Venezuela:      412 1234567
  "+34":  [3, 3, 3],    // España:         612 345 678
  "+55":  [2, 5, 4],    // Brasil:         11 91234 5678
  "+44":  [4, 6],        // UK:             7911 123456
  "+49":  [3, 4, 4],    // Alemania:       151 1234 5678
  "+33":  [1, 2, 2, 2, 2], // Francia:    6 12 34 56 78
};

/**
 * Limpia y normaliza un número de teléfono a formato E.164 estándar.
 * Elimina espacios, guiones, paréntesis y caracteres extra.
 * Ejemplos:
 *   "+57 300 123 4567" → "+573001234567"
 *   "+57-300-1234567"  → "+573001234567"
 *   "573001234567"     → "+573001234567"
 *   "+1 (800) 555-1234"→ "+18005551234"
 */
export function normalizePhone(input) {
    if (!input) return "";
    let raw = input.trim();

  // Añadir + si empieza con dígito (asume que ya incluye código de país)
    if (/^\d/.test(raw)) raw = "+" + raw;

  // Quitar todo excepto + y dígitos
    return raw.replace(/[^\d+]/g, "");
}

/**
 * Formatea un número normalizado para mostrar en UI.
 * "+573001234567" → "+57 300 1234567"
 */
export function formatPhoneDisplay(normalized) {
    if (!normalized) return "";

  // Buscar el código de país más largo que coincida
    const code = Object.keys(FORMATS)
        .sort((a, b) => b.length - a.length)
        .find((c) => normalized.startsWith(c));

    if (!code) return normalized;

    const local = normalized.slice(code.length);
    const groups = FORMATS[code];
    let   result = code + " ";
    let   offset = 0;

    for (let i = 0; i < groups.length; i++) {
        const chunk = local.slice(offset, offset + groups[i]);
        if (!chunk) break;
        result += chunk;
        offset += groups[i];
        if (i < groups.length - 1 && offset < local.length) result += " ";
    }

  // Si sobran dígitos (formatos no cubiertos), añadirlos
    if (offset < local.length) result += local.slice(offset);

    return result.trim();
}

/**
 * Formatea en tiempo real mientras el usuario escribe en el input.
 * Solo formatea la parte local (después del código de país).
 * Devuelve { formatted, normalized }
 */
export function formatPhoneInput(raw, countryCode) {
  // Solo dígitos del número local
    const digits = raw.replace(/\D/g, "");
    const groups  = FORMATS[countryCode] || [4, 4, 4];

    let formatted = "";
    let offset    = 0;

    for (let i = 0; i < groups.length; i++) {
        const chunk = digits.slice(offset, offset + groups[i]);
        if (!chunk) break;
        formatted += chunk;
        offset += groups[i];
        if (offset < digits.length && i < groups.length - 1) formatted += " ";
    }

    if (offset < digits.length) formatted += digits.slice(offset);

    const normalized = normalizePhone(countryCode + formatted);
    return { formatted, normalized };
}

/**
 * makeChatId consistente entre dos números normalizados.
 */
export function makeChatId(a, b) {
    return [normalizePhone(a), normalizePhone(b)].sort().join("__");
}