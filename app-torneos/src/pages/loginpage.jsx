import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import './LoginPage.css';

export default function LoginPage() {
  const [inputToken, setInputToken] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  const setApiToken = useStore((state) => state.setApiToken);
  const navigate = useNavigate();

  const validarToken = async (e) => {
    e.preventDefault(); // Evita que la página se recargue al enviar el formulario
    if (!inputToken) return;

    setCargando(true);
    setError('');

    try {
      // Hacemos una petición de prueba a la API de start.gg
      const response = await fetch('https://api.start.gg/gql/alpha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${inputToken}`,
        },
        body: JSON.stringify({
          query: `query { currentUser { id name } }`
        }),
      });

      const data = await response.json();

      // Si la API devuelve un array de "errors", el token es falso o ha caducado
      if (data.errors || !response.ok) {
        throw new Error('El token es inválido o no tiene permisos.');
      }

      // Si llegamos aquí, el token es válido. Lo guardamos en Zustand (LocalStorage)
      setApiToken(inputToken);
      
      // Y redirigimos al usuario a la pantalla principal
      navigate('/');

    } catch (err) {
      setError('Token no válido. Por favor, revísalo e inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Autenticación</h2>
        <p>Introduce tu Personal Access Token de start.gg para continuar.</p>
        
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
            {cargando ? 'Validando...' : 'Confirmar'}
          </button>
        </form>
        
      </div>
    </div>
  );
}