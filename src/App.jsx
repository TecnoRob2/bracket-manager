import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage'; // Antes era BracketPage
import BracketViewPage from './pages/BracketViewPage'; // Nueva página
import BorradoresPage from './pages/BorradoresPage'; // Nueva página
import ReglasPage from './pages/ReglasPage';

export default function App() {
  const apiToken = useStore((state) => state.apiToken);

  return (
    <BrowserRouter>
      <main>
        <Routes>
          {/* 1. Cambiar /login a / */}
          <Route path="/" element={!apiToken ? <LoginPage /> : <Navigate to="/dashboard" />} />
          
          {/* 2. Cambiar / a /dashboard (Aquí va el mockup de torneos) */}
          <Route path="/dashboard" element={apiToken ? <DashboardPage /> : <Navigate to="/" />} />
          
          {/* 3. Rutas dinámicas para el torneo específico (:id es el identificador) */}
          <Route path="/torneo/:id/bracket" element={apiToken ? <BracketViewPage /> : <Navigate to="/" />} />
          <Route path="/torneo/:id/borradores" element={apiToken ? <BorradoresPage /> : <Navigate to="/" />} />
          
          {/* Ruta de reglas (clasheos) mantenida */}
          <Route path="/clasheos" element={apiToken ? <ReglasPage /> : <Navigate to="/" />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}