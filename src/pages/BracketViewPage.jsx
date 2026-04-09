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
    <div style={{padding: '2rem'}}>
      <button onClick={() => navigate('/dashboard')}>⬅ Volver al Dashboard</button>
      <button onClick={() => navigate(`/torneo/${tournament.id}/borradores`)}>Ver Borradores</button>
      
      <h1>Viendo el Bracket del Torneo #{tournament.tournamentName}</h1>
      <DraggableSeeding
        seeds={seeds}
        setSeeds={setSeeds}
        onSeedsReordered={handleSeedsReordered}
      />
    </div>
  )
}