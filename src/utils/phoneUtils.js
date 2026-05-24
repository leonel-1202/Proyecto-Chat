const FORMATS = {
    "+57":  [3, 7],
    "+1":   [3, 3, 4],
    "+52":  [2, 4, 4],
    "+54":  [2, 4, 4],
    "+56":  [1, 4, 4],
    "+51":  [2, 4, 4],
    "+58":  [3, 7],
    "+34":  [3, 3, 3],
    "+55":  [2, 5, 4],
    "+44":  [4, 6],
    "+49":  [3, 4, 4],
    "+33":  [1, 2, 2, 2, 2],
};

export function normalizePhone(input) {
    if (!input) return "";
    let raw = input.trim();

    if (/^\d/.test(raw)) raw = "+" + raw;

    return raw.replace(/[^\d+]/g, "");
}

export function formatPhoneDisplay(normalized) {
    if (!normalized) return "";

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

    if (offset < local.length) result += local.slice(offset);

    return result.trim();
}

export function formatPhoneInput(raw, countryCode) {
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

export function makeChatId(a, b) {
    return [normalizePhone(a), normalizePhone(b)].sort().join("__");
}