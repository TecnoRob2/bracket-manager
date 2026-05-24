import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userStore } from '../store/userStore';
import { tournamentStore } from '../store/tournamentStore';
import { clashService } from '../services/clashService';
import { tournamentService } from '../services/tournamentService';
import './DashboardPage.css';
import { FaMoon, FaSun, FaTrophy, FaSignOutAlt } from 'react-icons/fa';

export default function DashboardPage() {
  const navigate = useNavigate();
  const tema = userStore((state) => state.tema);
  const toggleTema = userStore((state) => state.toggleTema);
  const cerrarSesion = userStore((state) => state.cerrarSesion);
  const { tournamentList, setTournament } =  tournamentStore.getState();
  const [tournaments, setTournaments] = useState(() => (
    Array.isArray(tournamentList) ? tournamentList : []
  ));
  const [loading, setLoading] = useState(tournaments.length === 0);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      setLoading(true);
      setError('');

      const [loadedTournaments] = await Promise.all([
        tournamentService.getTournaments(),
        clashService.loadClasheos().catch((error) => {
          console.error('Error al cargar clasheos:', error);
        }),
      ]);

      if (cancelled) return;

      if (Array.isArray(loadedTournaments)) {
        setTournaments(loadedTournaments);
      } else {
        setTournaments([]);
        setError(loadedTournaments?.error || 'No se pudieron cargar los torneos.');
      }

      setLoading(false);
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  function selectTournament(tId) {
    const selectedTournament = tournaments.find((torneo) => torneo.id === tId);
    if (!selectedTournament) return;
    setTournament(selectedTournament);
    navigate(`/torneo/${selectedTournament.id}/bracket`);
  }

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
        {loading ? (
          <p className="dashboard__message">Cargando torneos...</p>
        ) : null}
        {!loading && error ? (
          <p className="dashboard__message dashboard__message--error">{error}</p>
        ) : null}
        {!loading && !error && tournaments.length === 0 ? (
          <p className="dashboard__message">No hay torneos disponibles.</p>
        ) : null}
        {tournaments.map((torneo) => (
          <div 
            key={torneo.id} 
            className="dashboard__card" 
            onClick={() => selectTournament(torneo.id)}
          >
            <div className="dashboard__card-info">
              <div className="dashboard__card-names">
                {torneo.iconUrl ? (
                  <img
                    className="dashboard__card-icon"
                    src={torneo.iconUrl}
                    alt={`${torneo.tournamentName} icon`}
                    loading="lazy"
                  />
                ) : null}
                <div className="dashboard__card-text">
                  <h2 className="dashboard__card-title">{torneo.tournamentName}</h2>
                  <h3 className="dashboard__card-subtitle">{torneo.eventName}</h3>
                </div>
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
