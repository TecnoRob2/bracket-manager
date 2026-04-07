import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userStore } from '../store/userStore';
import './DashboardPage.css'; // Acuérdate de renombrar este archivo también

export default function DashboardPage() {
  const navigate = useNavigate();
  const cerrarSesion = userStore((state) => state.cerrarSesion);

  const tournaments = userStore((state) => state.tournaments); // Extraemos los torneos del store

  const [torneos] = useState(/** @type {EventTournament[]} */ (tournaments));

  return (
    <div className="bracket-page">
      <header className="bp-header">
        <div className="bp-title-group">
          <span className="bp-icon-trophy">🏆</span>
          <h1>Gestión de torneos</h1>
        </div>
        <div className="bp-header-buttons">
          <button className="btn-cambiar-token" onClick={() => cerrarSesion()}>Cambiar token</button>
          <button className="btn-clasheos" onClick={() => navigate('/clasheos')}>Clasheos</button>
          <button className="btn-crear">Crear torneo</button>
        </div>
      </header>

      <main className="bp-list">
        {torneos.map((torneo) => (
          <div 
            key={torneo.id} 
            className="bp-card" 
            style={{cursor: 'pointer'}}
            onClick={() => navigate(`/torneo/${torneo.id}/bracket`)}
          >
            <div className="bp-card-info">
              <h2>{torneo.tournamentName}</h2>
              <div className="bp-card-details">
                <p>Nº Participantes: {torneo.numAttendees}</p>
                <p>Evento: {torneo.name}</p>
                <p>Fecha: {torneo.startAt}</p>
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

{/* Este es el código actualizado para DashboardPage.jsx, que ahora muestra los torneos reales obtenidos del store recordar volver a poner los comentarios bien*/}
{/*import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import './DashboardPage.css'; 

export default function DashboardPage() {
  const navigate = useNavigate();
  const cerrarSesion = useStore((state) => state.cerrarSesion);
  
  // Extraemos la lista de torneos REALES de la memoria
  const torneos = useStore((state) => state.tournaments);

  return (
    <div className="bracket-page">
      <header className="bp-header">
        <div className="bp-title-group">
          <span className="bp-icon-trophy">🏆</span>
          <h1>Gestión de torneos</h1>
        </div>
        <div className="bp-header-buttons">
          <button className="btn-cambiar-token" onClick={() => cerrarSesion()}>Cambiar token</button>
          <button className="btn-clasheos" onClick={() => navigate('/clasheos')}>Clasheos</button>
          <button className="btn-crear">Crear torneo</button>
        </div>
      </header>

      <main className="bp-list">
        {/* Si la lista está vacía, mostramos un mensaje amistoso
        {torneos.length === 0 ? (
          <p style={{textAlign: 'center', color: '#666', marginTop: '2rem'}}>
            No tienes torneos pendientes en start.gg
          </p>
        ) : (
          torneos.map((torneo) => (
            <div 
              key={torneo.id} 
              className="bp-card" 
              style={{cursor: 'pointer'}}
              onClick={() => navigate(`/torneo/${torneo.id}/bracket`)}
            >
              <div className="bp-card-info">
                <h2>{torneo.name}</h2> {/* start.gg devuelve 'name', no 'nombre' 
                <div className="bp-card-details">
                  <p>Nº Participantes: {torneo.numAttendees || 0}</p>
                </div>
              </div>
              
              <div className="bp-card-actions">
                <button className="btn-icon" aria-label="Duplicar" onClick={(e) => e.stopPropagation()}>📄</button>
                <button className="btn-icon" aria-label="Borrar" onClick={(e) => e.stopPropagation()}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
*/}