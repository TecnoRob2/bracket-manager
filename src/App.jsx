import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage'; // Antes era BracketPage
import BracketViewPage from './pages/BracketViewPage'; // Nueva página
import BorradoresPage from './pages/BorradoresPage'; // Nueva página
import ReglasPage from './pages/ReglasPage';

export default function App() {


  return (
    <BrowserRouter>
      <main>
        <Routes>
          {/* 1. Cambiar /login a / */}
          <Route path="/" element={<AuthPage />} />
          
          {/* 2. Cambiar / a /dashboard (Aquí va el mockup de torneos) */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* 3. Rutas dinámicas para el torneo específico (:id es el identificador) */}
          <Route path="/torneo/:id/bracket" element={<BracketViewPage />} />
          <Route path="/torneo/:id/borradores" element={<BorradoresPage />} />
          
          {/* Ruta de reglas (clasheos) mantenida */}
          <Route path="/clasheos" element={<ReglasPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}