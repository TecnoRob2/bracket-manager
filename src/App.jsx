import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // IMPORTANTE: Falta importar Navigate
import { userService } from "./services/userService";
import { useEffect } from "react";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage"; // Antes era BracketPage
import BracketPage from "./pages/BracketPage"; // Nueva página
import BorradoresPage from "./pages/DraftPage"; // Nueva página
import ClashPage from "./pages/ClashPage";

export default function App() {
  const { authToken } = userService.getAuthToken();
  const { theme } = userService.getTheme();
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <BrowserRouter>
      <main>
        <Routes>
          {!authToken && <Navigate to="/" />}

          {/* 1. Login: Si NO hay token vamos a AuthPage, si hay token saltamos a dashboard */}
          <Route path="/" element={<AuthPage />} />

          {/* 2. Dashboard: Si hay token lo vemos, si no, nos echa al Login (raíz) */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* 3. Rutas de torneo específicas */}
          <Route path="/torneo/:id/bracket" element={<BracketPage />} />
          <Route path="/torneo/:id/borradores" element={<BorradoresPage />} />

          {/* 4. Ruta de reglas / clasheos */}
          <Route path="/clasheos" element={<ClashPage />} />

          {/* Opcional: Si el usuario escribe una URL que no existe, le enviamos a la raíz */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
