import { createContext, useContext, useState, useEffect } from "react";

export const THEMES = [
    { id: "gold",      label: "Dorado",       preview: "#c9a55a" },
    { id: "emerald",   label: "Esmeralda",    preview: "#25d366" },
    { id: "violet",    label: "Violeta",      preview: "#a855f7" },
    { id: "ocean",     label: "Océano",       preview: "#38bdf8" },
    { id: "crimson",   label: "Carmesí",      preview: "#f43f5e" },
    { id: "cyberpunk", label: "Cyberpunk",    preview: "#00f5d4" },
    { id: "matcha",    label: "Matcha Latte", preview: "#81b29a" },
    { id: "sunset",    label: "Sunset Glow",  preview: "#fb8500" },
    { id: "pastel",    label: "Pastel Dream", preview: "#ffb5a7" },
    { id: "nordic",    label: "Nordic Wood",  preview: "#4f6d65" },
    { id: "mocha",     label: "Mocha Vintage",preview: "#d4a373" },
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