import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './DashboardPage.css'; // Reutilizamos los estilos del Dashboard porque la estructura es la misma
import { userStore } from '../store/userStore';
import { FaArrowLeft, FaSave, FaFileExport, FaMoon, FaSun, FaHistory } from 'react-icons/fa';
import { tournamentStore } from '../store/tournamentStore';
import { draftService } from '../services/draftService';

export default function BorradoresPage() {
  const { id } = useParams(); // Extrae el ID del torneo de la URL
  const navigate = useNavigate();

  // Control de Tema
  const tema = userStore((state) => state.tema);
  const toggleTema = userStore((state) => state.toggleTema);
  const { tournament, phase_idx } = tournamentStore((state) => state);
  const dirPath = tournament?.phases?.[phase_idx]?.dirName;

  const [drafts, setDrafts] = useState([]);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    const loadDrafts = async () => {
      if (!dirPath) {
        setDrafts([]);
        return;
      }

      try {
        console.log('Cargando borradores para el directorio:', dirPath);
        const result = await draftService.listSeedingDrafts(dirPath);
        console.log('Resultado de listSeedingDrafts:', result);
        setDrafts(result.drafts);
        
      } catch (error) {
        console.error('Error al cargar borradores:', error);
        setErrors(error);
        setDrafts([]);
      }
    };
    loadDrafts();

  }, [dirPath]);

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
        {drafts.length === 0 ? (
          <p style={{textAlign: 'center', color: '#666', marginTop: '2rem'}}>
            Aún no has guardado ningún borrador para este torneo.
          </p>
        ) : (
          drafts.map((draft) => (
            <div 
              key={draft.name} 
              className="bp-card" 
              style={{cursor: 'pointer'}}
              // Al clicar un borrador, volvemos al bracket pasándole el ID del borrador (lo programaremos más adelante)
              onClick={() => console.log(`Cargando borrador ${draft.name}...`)}
            >
              <div className="bp-card-info">
                <h2>{draft.name}</h2>
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