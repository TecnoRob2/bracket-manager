import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore'; // <-- 1. Importa el store
import './ReglasPage.css';

export default function ReglasPage() {
  const navigate = useNavigate();
  const cerrarSesion = useStore((state) => state.cerrarSesion); // <-- 2. Extrae la función
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
          <button className="btn-cambiar-token" onClick={() => cerrarSesion()}>
            Cambiar token
          </button>
          <button className="btn-torneos" onClick={() => navigate('/')}>
            Torneos
          </button>
          <button className="btn-incluir">Incluir clasheo</button>
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