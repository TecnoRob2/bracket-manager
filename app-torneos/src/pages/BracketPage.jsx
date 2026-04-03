import React, { useState } from 'react';
import './BracketPage.css'; // Importamos los estilos que crearemos ahora
import { useStore } from '../store/useStore'; // <-- 1. Importa el store
import { useNavigate } from 'react-router-dom';


export default function BracketPage() {
  // Estado temporal (mock data) para ver cómo queda el diseño
  // Más adelante esto lo conectaremos a tu base de datos local (Dexie)
  const navigate = useNavigate();
  const cerrarSesion = useStore((state) => state.cerrarSesion); // <-- 2. Extrae la función
  const [torneos] = useState([
    { id: 1, nombre: 'Trifulca', participantes: 260, categoria: 'singles' },
    { id: 2, nombre: 'Trifulca2', participantes: 260, categoria: 'singles' },
    { id: 3, nombre: 'Trifulca3', participantes: 260, categoria: 'singles' }
  ]);

  return (
    <div className="bracket-page">
      {/* CABECERA */}
      <header className="bp-header">
        <div className="bp-title-group">
          <span className="bp-icon-trophy">🏆</span>
          <h1>Gestión de torneos</h1>
        </div>
        <div className="bp-header-buttons">
          <button className="btn-cambiar-token" onClick={() => cerrarSesion()}>
            Cambiar token
          </button>
          <button className="btn-clasheos" onClick={() => navigate('/reglas')}>
            Clasheos
          </button>
          <button className="btn-crear">Crear torneo</button>
        </div>
      </header>

      {/* LISTA DE TORNEOS */}
      <main className="bp-list">
        {torneos.map((torneo) => (
          <div key={torneo.id} className="bp-card">
            
            <div className="bp-card-info">
              <h2>{torneo.nombre}</h2>
              <div className="bp-card-details">
                <p>Nº Participantes: {torneo.participantes}</p>
                <p>Categoría: {torneo.categoria}</p>
              </div>
            </div>

            <div className="bp-card-actions">
              <button className="btn-icon" aria-label="Duplicar">📄</button>
              <button className="btn-icon" aria-label="Borrar">🗑️</button>
            </div>
            
          </div>
        ))}
      </main>
    </div>
  );
}