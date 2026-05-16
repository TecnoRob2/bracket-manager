import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userStore } from '../store/userStore';
import './AuthPage.css';
import { userService } from '../services/userService';
import { parseUser, parseTournaments } from '../utils/parser';
import { handleError } from '../utils/handleError';
import { FaMoon, FaSun } from 'react-icons/fa';
import { open } from '@tauri-apps/plugin-shell';
import Notification from '../components/Notification';
import { TfiControlSkipBackward } from 'react-icons/tfi';

export default function AuthPage() {
  const [inputToken, setInputToken] = useState('');
  const [cargando, setCargando] = useState(false);
  const [notificacion, setNotificacion] = useState({
    open: false,
    message: '',
    type: 'error',
  });
  const { setApiToken, setTournaments, setUser, tema, toggleTema } = userStore((state) => state);
  const navigate = useNavigate();
  const tokenUrl = 'https://www.start.gg/admin/profile/developer';

  const handleOpenToken = async (event) => {
    event.preventDefault();
    try {
      await open(tokenUrl);
    } catch {
      window.open(tokenUrl, '_blank', 'noopener,noreferrer');
    }
  };


  const validarToken = async (e) => {
    e.preventDefault();
    if (!inputToken) {
      setNotificacion({ open: true, message: 'Por favor ingresa tu token para continuar.', type: 'error' });
      return;
    }

    setCargando(true);

    userService.getUserAndTournaments(inputToken).then((data) => {
      // console.log('Respuesta de getUserAndTournaments:', data);

      if (data.error) {
        console.log('Error al validar token:', data.error);
        setNotificacion({ open: true, message: data.error.message, type: 'error' });
        setCargando(false);
        return;
      }
      setCargando(false);
      setApiToken(inputToken);
      setUser(parseUser(data));
      setTournaments(parseTournaments(data));
      
      // console.log("Torneos del usuario:", parseTournaments(data));
      // console.log("Usuario guardado:", parseUser(data));

      navigate('/dashboard');
    }).catch((error) => {
      const errorMsg = handleError({ message: error.message, id: 'getUser' });
      setNotificacion({ open: true, message: errorMsg, type: 'error' });
      setCargando(false);
    });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-header">
          <h2>Bienvenido</h2>
          <button className="btn-tema" onClick={toggleTema} title="Cambiar tema">
            {tema === 'dark' ? <FaSun size={18} /> : <FaMoon size={18} />}
          </button>
        </div>
        <p>Ingresa tu token de start.gg para ver y organizar tus torneos.</p>
        
        <form onSubmit={validarToken} className="login-form">
          <input 
            type="password" 
            placeholder="Pegar token aquí..." 
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            disabled={cargando}
          />
          <button type="submit" className="btn-confirmar" disabled={cargando}>
            {cargando ? 'Cargando torneos...' : 'Confirmar'}
          </button>
        </form>
        <p className="login-help">
          Para obtener tu token pulsa{' '}
          <a className="login-link" href={tokenUrl} onClick={handleOpenToken}>
            aqui
          </a>
        </p>
        <Notification
          open={notificacion.open}
          message={notificacion.message}
          type={notificacion.type}
          duration={2500}
          onClose={() => setNotificacion((prev) => ({ ...prev, open: false }))}
        />
      </div>
    </div>
  );
}