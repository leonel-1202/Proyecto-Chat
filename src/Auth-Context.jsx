import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("fc-usuario");
    if (saved) setUsuario(JSON.parse(saved));
  }, []);

  const login = (numero, nombre = "") => {
    const user = { numero, nombre: nombre.trim() || numero };
    setUsuario(user);
    localStorage.setItem("fc-usuario", JSON.stringify(user));
  };

  const cerrarSesion = () => {
    setUsuario(null);
    localStorage.removeItem("fc-usuario");
  };

  return (
    <AuthContext.Provider value={{ usuario, login, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);