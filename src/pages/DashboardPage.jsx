import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userStore } from '../store/userStore';
import { tournamentStore } from '../store/tournamentStore';
import { clashService } from '../services/clashService';
import './DashboardPage.css';
import { FaArrowLeft, FaSave, FaFileExport, FaMoon, FaSun, FaHistory, FaTrophy, FaSignOutAlt } from 'react-icons/fa';

export default function DashboardPage() {
  const navigate = useNavigate();
  // Control de Tema
  const tema = userStore((state) => state.tema);
  const toggleTema = userStore((state) => state.toggleTema);
  const setTournament = tournamentStore((state) => state.setTournament);

  function selectTournament(tId) {
    const selectedTournament = tournaments.find((torneo) => torneo.id === tId);
    if (!selectedTournament) return;
    setTournament(selectedTournament);
    navigate(`/torneo/${selectedTournament.id}/bracket`);
  }

  clashService.loadClasheos(); // Carga los clasheos al montar el componente
  
  const cerrarSesion = userStore((state) => state.cerrarSesion);

  const tournaments = userStore((state) => state.tournaments); // Extraemos los torneos del store

  const [torneos] = useState(/** @type {EventTournament[]} */ (tournaments));

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__title-group">
          <FaTrophy className="dashboard__icon-trophy" />
          <h1 className="dashboard__title">Tus Torneos</h1>
        </div>
        <div className="dashboard__header-actions">
          <button className="dashboard__button dashboard__button--clasheos" onClick={() => navigate('/clasheos')}>Clasheos</button>
          <button 
            className="dashboard__button dashboard__button--logout" 
            onClick={() => {
              cerrarSesion();
              navigate('/');
            }}
            title="Cerrar sesión"
          >
            <FaSignOutAlt size={20} />
          </button>
          <button className="dashboard__button dashboard__button--theme" onClick={toggleTema} title="Cambiar tema">
            {tema === 'dark' ? <FaSun size={20} /> : <FaMoon size={20} />}
          </button>
        </div>
      </header>

      <main className="dashboard__list">
        {torneos.map((torneo) => (
          <div 
            key={torneo.id} 
            className="dashboard__card" 
            onClick={() => selectTournament(torneo.id)}
          >
            <div className="dashboard__card-info">
              <div className="dashboard__card-names">
                <h2 className="dashboard__card-title">{torneo.tournamentName}</h2>
                <h3 className="dashboard__card-subtitle">{torneo.eventName}</h3>
              </div>
              <div className="dashboard__card-meta">
                <p className="dashboard__card-date">{torneo.startAt}</p>
                <p className="dashboard__card-participants">{torneo.numAttendees} participantes</p>
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
