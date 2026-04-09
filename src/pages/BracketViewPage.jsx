import './BracketViewPage.css';
import { useNavigate } from 'react-router-dom';
import { tournamentStore } from '../store/tournamentStore';
import { useEffect, useState } from 'react';
import { userStore } from '../store/userStore';
import { userService } from '../services/userService';
import { parsePhasesSeeding } from '../utils/parser';
import DraggableSeeding from '../components/DraggableSeeding';

export default function BracketViewPage() {
  const navigate = useNavigate();

  if(!tournamentStore.getState().tournament || !userStore.getState().apiToken) {
    navigate('/login');
  }

  const [seeds, setSeeds] = useState([]);

  const tournament = /** @type {EventTournament | null} */ (tournamentStore((state) => state.tournament));
  const setPhases = tournamentStore((state) => state.setPhases);

  const handleSeedsReordered = (updatedSeeds) => {
    // Aqui puedes llamar a una mutacion/endpoint para persistir el nuevo orden.
    console.log('Nuevo orden de seeds para subir:', updatedSeeds);
  };

  useEffect(() => {
    const phaseId = tournament?.phases[0]?.id; // Tomamos el ID de la primera fase del torneo
    if (!phaseId) {
      return;
    }

    const loadPhaseSeeding = async () => {
      const data = await userService.getPhaseSeeding(userStore.getState().apiToken, phaseId);
      if (!data || data.error || !data.phase) {
        return;
      }

      const parsedPhase = parsePhasesSeeding(data, phaseId);
      setPhases([parsedPhase]);
      setSeeds(parsedPhase.seeds);
      console.log('Data obtenida en BracketViewPage:', tournamentStore.getState().phases);
    };

    loadPhaseSeeding();

  }, [tournament, setPhases]);

  if (!tournament) {
    return null;
  }

  return (
    <div className="bracket-view-page">
      
      {/* 1. Botón de volver arriba a la izquierda */}
      <div className="bv-top-bar">
        <button className="btn-volver" onClick={() => navigate('/dashboard')}>
          ⬅ Volver al Dashboard
        </button>
      </div>

      {/* 2. Cabecera con el Título y los Botones de Acción */}
      <header className="bv-header">
        <h1>Bracket del Torneo #{id}</h1>
        
        <div className="bv-botones-accion">
          <button 
            className="btn-secundario" 
            onClick={() => navigate(`/torneo/${id}/borradores`)}
          >
            Ver Borradores
          </button>
          
          {/* Nuevos botones sin funcionalidad por ahora */}
          <button 
            className="btn-secundario" 
            onClick={() => console.log('Guardando borrador localmente...')}
          >
            Guardar borrador
          </button>
          
          <button 
            className="btn-exportar" 
            onClick={() => console.log('Exportando posiciones a la API de start.gg...')}
          >
            Subir 
          </button>
        </div>
      </header>

      {/* 3. El lienzo donde irá el bracket más adelante */}
      <main className="bv-lienzo">
        <DraggableSeeding
          seeds={seeds}
          setSeeds={setSeeds}
          onSeedsReordered={handleSeedsReordered}
        />
      </main>

    </div>
  );
}