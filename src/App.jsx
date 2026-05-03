import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // IMPORTANTE: Falta importar Navigate
import { userStore } from './store/userStore';
import { useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage'; // Antes era BracketPage
import BracketViewPage from './pages/BracketViewPage'; // Nueva página
import BorradoresPage from './pages/DraftPage'; // Nueva página
import ReglasPage from './pages/ReglasPage';

export default function App() {
  const apiToken = userStore((state) => state.apiToken);
  
  const tema = userStore((state) => state.tema);
  useEffect(() => {
    document.body.className = tema;
  }, [tema]);

  return (
    <BrowserRouter>
      <main>
        <Routes>
          {/* 1. Login: Si NO hay token vamos a AuthPage, si hay token saltamos a dashboard */}
          <Route path="/" element={!apiToken ? <AuthPage /> : <Navigate to="/dashboard" />} />
          
          {/* 2. Dashboard: Si hay token lo vemos, si no, nos echa al Login (raíz) */}
          <Route path="/dashboard" element={apiToken ? <DashboardPage /> : <Navigate to="/" />} />
          
          {/* 3. Rutas de torneo específicas */}
          <Route path="/torneo/:id/bracket" element={apiToken ? <BracketViewPage /> : <Navigate to="/" />} />
          <Route path="/torneo/:id/borradores" element={apiToken ? <BorradoresPage /> : <Navigate to="/" />} />
          
          {/* 4. Ruta de reglas / clasheos */}
          <Route path="/clasheos" element={apiToken ? <ReglasPage /> : <Navigate to="/" />} />

          {/* Opcional: Si el usuario escribe una URL que no existe, le enviamos a la raíz */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}