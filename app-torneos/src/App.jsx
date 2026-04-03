import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import BracketPage from './pages/BracketPage';
import ReglasPage from './pages/ReglasPage';
import LoginPage from './pages/loginpage';

export default function App() {
  // Leemos el token de la memoria
  const apiToken = useStore((state) => state.apiToken);

  return (
    <HashRouter>
      <main>
        <Routes>
          {/* Si hay token, mostramos BracketPage. Si no, redirigimos a /login */}
          <Route path="/" element={apiToken ? <BracketPage /> : <Navigate to="/login" />} />
          <Route path="/reglas" element={apiToken ? <ReglasPage /> : <Navigate to="/login" />} />
          
          {/* Si NO hay token, mostramos el login. Si ya lo hay, lo enviamos al menú principal */}
          <Route path="/login" element={!apiToken ? <LoginPage /> : <Navigate to="/" />} />
        </Routes>
      </main>
    </HashRouter>
  );
}

