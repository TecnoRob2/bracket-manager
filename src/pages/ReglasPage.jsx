import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userStore } from '../store/userStore'; // <-- 1. Importa el store
import './ReglasPage.css';
import { FaArrowLeft, FaSave, FaFileExport, FaMoon, FaSun, FaHistory } from 'react-icons/fa';

export default function ReglasPage() {
  const navigate = useNavigate();
  // Control de Tema
  const tema = userStore((state) => state.tema);
  const toggleTema = userStore((state) => state.toggleTema);

  const cerrarSesion = userStore((state) => state.cerrarSesion); // <-- 2. Extrae la función
  // Datos temporales simulando la lista de tu imagen
  const [clasheos] = useState([
    { id: 1, jugador1: 'Starchild', jugador2: 'Xiorad', motivo: 'región', relevancia: 3 },
    { id: 2, jugador1: 'Simbionz', jugador2: 'Cardii', motivo: 'región', relevancia: 3 },
    { id: 3, jugador1: 'Descartes', jugador2: 'InkLucario', motivo: 'región', relevancia: 3 }
  ]);

  return (
    <div className="reglas-page">
      {/* CABECERA */}
      <header className="rp-header">
        <div className="rp-title-group">
          <span className="rp-icon-ban">🚫</span>
          <h1>Gestión de clasheo</h1>
        </div>
        <div className="rp-header-buttons">
          <button 
            className="btn-cambiar-token" 
            onClick={() => {
              cerrarSesion(); // 1. Borra el token de la memoria
              navigate('/');  // 2. Fuerza al navegador a ir a la pantalla de Login
            }}
          >
            Cerrar sesión
          </button>
          <button className="btn-torneos" onClick={() => navigate('/Dashboard')}>
            Torneos
          </button>
          <button className="btn-incluir">Incluir clasheo</button>
          <button className="btn-tema" onClick={toggleTema} title="Cambiar tema">
            {tema === 'dark' ? <FaSun size={20} /> : <FaMoon size={20} />}
          </button>
        </div>
      </header>

      {/* LISTA DE CLASHEOS */}
      <main className="rp-list">
        {clasheos.map((clasheo) => (
          <div key={clasheo.id} className="rp-card">
            
            <div className="rp-card-info">
              <div className="rp-players">
                <span className="player-name">{clasheo.jugador1}</span>
                <hr className="player-divider" />
                <span className="player-name">{clasheo.jugador2}</span>
              </div>
              
              <div className="rp-card-details">
                <p>Motivo: {clasheo.motivo}</p>
                <p>Relevancia: {clasheo.relevancia}</p>
              </div>
            </div>

            <div className="rp-card-actions">
              <button className="btn-icon" aria-label="Editar">📝</button>
              <button className="btn-icon" aria-label="Borrar">🗑️</button>
            </div>
            
          </div>
        ))}
      </main>
    </div>
  );
}