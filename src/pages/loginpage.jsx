import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import './LoginPage.css';

export default function LoginPage() {
  const [inputToken, setInputToken] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  const setApiToken = useStore((state) => state.setApiToken);
  const setTorneosUsuario = useStore((state) => state.setTorneosUsuario); // <-- Lo importamos
  const navigate = useNavigate();

  const validarToken = async (e) => {
    e.preventDefault();
    if (!inputToken) return;

    setCargando(true);
    setError('');

    // Consulta GraphQL combinada: pide el usuario y sus torneos pendientes
    const queryGraphQL = `
      query GetUserAndTournaments {
        currentUser {
          id
          name
          tournaments(query: {
            perPage: 50,
            page: 1,
            filter: { 
              upcoming: true 
            }
          }) {
            nodes {
              id
              name
              numAttendees
            }
          }
        }
      }
    `;

    try {
      const response = await fetch('https://api.start.gg/gql/alpha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${inputToken}`,
        },
        body: JSON.stringify({ query: queryGraphQL }),
      });

      const data = await response.json();

      if (data.errors || !response.ok || !data.data.currentUser) {
        throw new Error('El token es inválido o no tiene permisos.');
      }

      // 1. Extraemos los torneos de la respuesta
      const listaTorneos = data.data.currentUser.tournaments.nodes;
      
      // 2. Guardamos la lista en la memoria de la aplicación (Zustand)
      setTorneosUsuario(listaTorneos);
      
      // 3. Guardamos el token
      setApiToken(inputToken);
      
      // 4. Vamos al Dashboard
      navigate('/dashboard');

    } catch {
      setError('Token no válido. Por favor, revísalo e inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
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