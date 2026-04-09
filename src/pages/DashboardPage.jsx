import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userStore } from '../store/userStore';
import { tournamentStore } from '../store/tournamentStore';
import './DashboardPage.css'; // Acuérdate de renombrar este archivo también


export default function DashboardPage() {
  const navigate = useNavigate();
  const setTournament = tournamentStore((state) => state.setTournament);

  function selectTournament(tId) {
    const selectedTournament = tournaments.find((torneo) => torneo.id === tId);
    if (!selectedTournament) return;
    setTournament(selectedTournament);
    navigate(`/torneo/${selectedTournament.id}/bracket`);
  }

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
            onClick={() => selectTournament(torneo.id)}
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
