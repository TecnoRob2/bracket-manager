import './BracketViewPage.css';
import { useNavigate } from 'react-router-dom';
import { tournamentStore } from '../store/tournamentStore';
import { useEffect, useState } from 'react';
import { userStore } from '../store/userStore';
import { userService } from '../services/userService';
import DraggableSeeding from '../components/DraggableSeeding';
import { parsePhaseSeedingDto } from '../utils/parser';

export default function BracketViewPage() {
  const navigate = useNavigate();
  if(!tournamentStore.getState().tournament || !userStore.getState().apiToken) {
    navigate('/login');
  }
  const apiToken = userStore.getState().apiToken;
  const [seeds, setSeeds] = useState([]);
  const [phase, setPhase] = useState(null);
  const tournament = /** @type {EventTournament | null} */ (tournamentStore((state) => state.tournament));
  const setPhases = tournamentStore((state) => state.setPhases);

  const handleSeedsReordered = (updatedSeeds) => {
    console.log('Nuevo orden de seeds para subir:', updatedSeeds);
    const updatedPhase = {
      ...phase,
      seeds: updatedSeeds,
    };
    setPhases([updatedPhase]); // Actualiza la fase completa en el store
    setPhase(updatedPhase);

    console.log('Fase actualizada en el store después de reordenar seeds:', tournamentStore.getState().phases);
  };

  const handleSeedPublish = async () => {
    const seedMapping = parsePhaseSeedingDto(phase.seeds);
    console.log('Enviando el siguiente seedMapping a la API:', seedMapping);
    const response = await userService.updatePhaseSeeding(apiToken, phase.id, seedMapping);
    console.log('Respuesta de la API al actualizar el seeding de la fase:', response);
  }

  useEffect(() => {
    const phaseId = tournament?.phases[0]?.id; // Tomamos el ID de la primera fase del torneo
    if (!phaseId) {
      return;
    }

    const loadPhaseSeeding = async () => {
      const data = await userService.getPhaseSeeding(apiToken, phaseId);
      if (!data || data.error || !data.phase) {
        return;
      }

      const { phase } = data;
      setSeeds(phase.seeds);
      setPhase(phase);
      console.log('Data obtenida en BracketViewPage:', tournamentStore.getState().phases);
    };
    
    loadPhaseSeeding();

  }, [tournament, apiToken]);

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
        <h1>Bracket del Torneo #{tournament.tournamentName}</h1>
        
        <div className="bv-botones-accion">
          <button 
            className="btn-secundario" 
            onClick={() => navigate(`/torneo/${tournament.id}/borradores`)}
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
            onClick={handleSeedPublish}
          >
            Subir 
          </button>
        </div>
      </header>

      {/* 3. El lienzo donde irá el bracket más adelante */}
      <main className="">
        <DraggableSeeding
          seeds={seeds}
          setSeeds={setSeeds}
          onSeedsReordered={handleSeedsReordered}
        />
      </main>

    </div>
  );
}