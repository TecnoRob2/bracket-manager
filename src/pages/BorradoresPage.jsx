import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './DashboardPage.css'; // Reutilizamos los estilos del Dashboard porque la estructura es la misma
import { userStore } from '../store/userStore';
import { FaArrowLeft, FaSave, FaFileExport, FaMoon, FaSun, FaHistory } from 'react-icons/fa';

export default function BorradoresPage() {
  const { id } = useParams(); // Extrae el ID del torneo de la URL
  const navigate = useNavigate();
  // Control de Tema
  const tema = userStore((state) => state.tema);
  const toggleTema = userStore((state) => state.toggleTema);
  // Mock data: Simulamos que Dexie nos devuelve 3 borradores para este torneo específico
  const [borradores, setBorradores] = useState([
    { idBorrador: 101, nombre: 'Borrador Principal', fecha: '04/04/2026', completado: '100%' },
    { idBorrador: 102, nombre: 'Prueba sin los de Madrid', fecha: '03/04/2026', completado: '80%' },
    { idBorrador: 103, nombre: 'Backup antes de comer', fecha: '03/04/2026', completado: '45%' }
  ]);

  return (
    <div className="bracket-page">
      {/* CABECERA (Adaptada para Borradores) */}
      <header className="bp-header">
        <div className="bp-title-group">
          <span className="bp-icon-trophy">💾</span>
          <h1>Borradores (Torneo #{id})</h1>
        </div>
        <div className="bp-header-buttons">
          <button 
            className="btn-cambiar-token" 
            onClick={() => navigate(`/torneo/${id}/bracket`)}
            style={{ backgroundColor: '#555' }} // Cambiamos el color para que sea un botón de "Volver"
          >
            ⬅ Volver al Bracket
          </button>
          <button className="btn-tema" onClick={toggleTema} title="Cambiar tema">
            {tema === 'dark' ? <FaSun size={20} /> : <FaMoon size={20} />}
          </button>
        </div>
      </header>

      {/* LISTA DE BORRADORES */}
      <main className="bp-list">
        {borradores.length === 0 ? (
          <p style={{textAlign: 'center', color: '#666', marginTop: '2rem'}}>
            Aún no has guardado ningún borrador para este torneo.
          </p>
        ) : (
          borradores.map((borrador) => (
            <div 
              key={borrador.idBorrador} 
              className="bp-card" 
              style={{cursor: 'pointer'}}
              // Al clicar un borrador, volvemos al bracket pasándole el ID del borrador (lo programaremos más adelante)
              onClick={() => console.log(`Cargando borrador ${borrador.idBorrador}...`)}
            >
              <div className="bp-card-info">
                <h2>{borrador.nombre}</h2>
                <div className="bp-card-details">
                  <p>Guardado: {borrador.fecha}</p>
                  <p>Progreso: {borrador.completado}</p>
                </div>
              </div>
              
              <div className="bp-card-actions">
                <button 
                  className="btn-icon" 
                  aria-label="Restaurar" 
                  title="Cargar en el Bracket"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Restaurando...');
                  }}
                >
                  🔄
                </button>
                <button 
                  className="btn-icon" 
                  aria-label="Borrar" 
                  title="Eliminar borrador"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Borrando...');
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}