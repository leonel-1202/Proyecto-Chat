import { AuthProvider, useAuth } from "./Auth-Context";
import { ThemeProvider } from "./ThemeContext";
import Login from "./Login";
import ChatApp from "./ChatApp";
import "./App.css";

function Router() {
  const { usuario } = useAuth();
  return usuario ? <ChatApp /> : <Login />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </ThemeProvider>
  );
}