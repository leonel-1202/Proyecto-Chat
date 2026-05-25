import { createContext, useContext, useState, useEffect } from "react";

export const THEMES = [
    { id: "gold",        label: "Dorado",       preview: "#c9a55a" },
    { id: "emerald",     label: "Esmeralda",    preview: "#25d366" },
    { id: "violet",      label: "Violeta",      preview: "#a855f7" },
    { id: "ocean",       label: "Océano",       preview: "#38bdf8" },
    { id: "crimson",     label: "Carmesí",      preview: "#f43f5e" },
    { id: "cyberpunk",   label: "Cyberpunk",    preview: "#00f5d4" },
    { id: "matcha",      label: "Matcha Latte", preview: "#81b29a" },
    { id: "sunset",      label: "Sunset Glow",  preview: "#fb8500" },
    { id: "pastel",      label: "Pastel Dream", preview: "#ffb5a7" },
    { id: "nordic",      label: "Nordic Wood",  preview: "#4f6d65" },
    { id: "mocha",       label: "Mocha Vintage",preview: "#d4a373" },
    { id: "amoled",      label: "Pure Amoled",  preview: "#ffffff" },
    { id: "atlantis",    label: "Atlantis",     preview: "#00b4d8" },
    { id: "halloween",   label: "Halloween",    preview: "#f77f00" },
    { id: "toxic",       label: "Toxic Cyber",  preview: "#39ff14" },
    { id: "sea",         label: "Mar",          preview: "#0ea5e9" },
    { id: "sunset",      label: "Atardecer",    preview: "#f97316" },
    { id: "rose",        label: "Rosa",         preview: "#ec4899" },
    { id: "midnight",    label: "Medianoche",   preview: "#3b82f6" },
    { id: "golden",      label: "Dorado",       preview: "#eab308" },
    { id: "heart",       label: "Corazón",      preview: "#ef4444" },
    { id: "mint",        label: "Menta",        preview: "#10b981" },
    { id: "lavender",    label: "Lavanda",      preview: "#8b5cf6" },
    { id: "cyber",       label: "Cyber",        preview: "#06b6d4" },
    { id: "forest",      label: "Bosque",       preview: "#22c55e" },
    { id: "ice",         label: "Hielo",        preview: "#38bdf8" },
    { id: "coffee",      label: "Café",         preview: "#a16207" },
    { id: "ruby",        label: "Rubí",         preview: "#be123c" },
    { id:"neon-green",   label:"Neón Verde",    preview: "#39ff14" },
    { id:"neon-blue",    label:"Neón Azul",     preview: "#00e5ff" },
    { id:"neon-pink",    label:"Neón Rosa",     preview: "#ff00c8" },
    { id:"neon-purple",  label:"Neón Morado",   preview: "#9d00ff" },
    { id:"neon-orange",  label:"Neón Naranja",  preview: "#ff6a00" },
    { id:"neon-red",     label:"Neón Rojo",     preview: "#ff3131" }
];

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(
        () => localStorage.getItem("fc-theme") || "gold"
    );

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("fc-theme", theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);