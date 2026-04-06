import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userStore } from '../store/userStore';
import './LoginPage.css';
import { userService } from '../services/userService';
import { parseUser, parseTournaments } from '../utils/parser';

export default function LoginPage() {
  const [inputToken, setInputToken] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  const setApiToken = userStore((state) => state.setApiToken);
  const setTorneosUsuario = userStore((state) => state.setTorneosUsuario);
  const setUser = userStore((state) => state.setUser);
  const navigate = useNavigate();

  const validarToken = async (e) => {
    e.preventDefault();
    if (!inputToken) return;

    setCargando(true);
    setError('');

    userService.getUserAndTournaments(inputToken).then((data) => {
      console.log('Respuesta de getUserAndTournaments:', data);
      if (data.error) {
        setError(data.error);
        setCargando(false);
        return;
      }
      setCargando(false);
      setApiToken(inputToken);
      setUser(parseUser(data));
      setTorneosUsuario(parseTournaments(data));
      console.log('Usuario y torneos guardados en el store');
      console.log("Torneos del usuario:", parseTournaments(data));
      console.log("Usuario guardado:", parseUser(data));

      navigate('/dashboard');
    })
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Autenticación</h2>
        <p>Introduce tu Personal Access Token de start.gg para continuar y cargar tus torneos.</p>
        
        <form onSubmit={validarToken} className="login-form">
          <input 
            type="password" 
            placeholder="Pegar token aquí..." 
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            disabled={cargando}
          />
          
          {error && <div className="login-error">⚠️ {error}</div>}
          
          <button type="submit" className="btn-confirmar" disabled={cargando}>
            {cargando ? 'Cargando torneos...' : 'Confirmar'}
          </button>
        </form>
      </div>
    </div>
  );
}