import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { themeStore } from "../store/themeStore";
import { userService } from "../services/userService";
import { FaMoon, FaSun } from "react-icons/fa";
import { open } from "@tauri-apps/plugin-shell";
import Notification from "../components/Notification";

import "./AuthPage.css";

const TOKEN_INFO_URL = "https://www.start.gg/admin/profile/developer";

export default function AuthPage() {
  const [inputToken, setInputToken] = useState("");
  const [cargando, setCargando] = useState(false);
  const [notificacion, setNotificacion] = useState(null);

  const navigate = useNavigate();

  const theme = themeStore((s) => s.theme);
  const toggleTheme = themeStore((s) => s.toggleTheme);

  const handleOpenToken = async (event) => {
    event.preventDefault();
    try {
      await open(TOKEN_INFO_URL);
    } catch {
      window.open(TOKEN_INFO_URL, "_blank", "noopener,noreferrer");
    }
  };

  const validarToken = async (e) => {
    e.preventDefault();

    if (!inputToken) {
      setNotificacion({
        message: "Por favor ingresa tu token para continuar.",
        type: "error",
      });
      return;
    }

    try {
      setCargando(true);

      await userService.getUser(inputToken);

      userService.setAuthToken(inputToken);

      navigate("/dashboard");
    } catch (error) {
      setNotificacion({
        message: error.message,
        type: "error",
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-header">
          <h2>Bienvenido</h2>
          <button
            className="btn-tema"
            onClick={() => toggleTheme()}
            title="Cambiar tema"
          >
            {theme === "dark" ? <FaSun size={18} /> : <FaMoon size={18} />}
          </button>
        </div>
        <p>Ingresa tu token de start.gg para ver y organizar tus torneos.</p>

        <form onSubmit={validarToken} className="login-form">
          <input
            type="password"
            className="TokenSpace"
            placeholder="Pegar token aquí..."
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            disabled={cargando}
          />
          <button type="submit" className="btn-confirmar" disabled={cargando}>
            {cargando ? "Cargando torneos..." : "Confirmar"}
          </button>
        </form>
        <p className="login-help">
          Para obtener tu token pulsa{" "}
          <a
            className="login-link"
            href={TOKEN_INFO_URL}
            onClick={handleOpenToken}
          >
            aqui
          </a>
        </p>
        <Notification
          open={notificacion !== null}
          message={notificacion?.message}
          type={notificacion?.type}
          duration={2500}
          onClose={() => setNotificacion(null)}
        />
      </div>
    </div>
  );
}
