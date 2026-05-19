import { createContext, useContext, useState, useEffect } from "react";

export const THEMES = [
    { id: "gold",    label: "Dorado",    preview: "#c9a55a" },
    { id: "emerald", label: "Esmeralda", preview: "#25d366" },
    { id: "violet",  label: "Violeta",   preview: "#a855f7" },
    { id: "ocean",   label: "Océano",    preview: "#38bdf8" },
    { id: "crimson", label: "Carmesí",   preview: "#f43f5e" },
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