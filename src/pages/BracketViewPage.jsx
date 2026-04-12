import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userStore } from '../store/userStore';
import { tournamentStore } from '../store/tournamentStore';
import { userService } from '../services/userService';
import { parsePhaseSeedingDto } from '../utils/parser';
import DraggableSeeding from '../components/DraggableSeeding';

// Nuevos iconos
import { FaArrowLeft, FaSave, FaFileExport, FaMoon, FaSun, FaHistory } from 'react-icons/fa';

import './BracketViewPage.css';

export default function BracketViewPage() {
  const navigate = useNavigate();

  // Control de Tema
  const tema = userStore((state) => state.tema);
  const toggleTema = userStore((state) => state.toggleTema);

  // Estados originales del compañero
  const apiToken = userStore.getState().apiToken;
  const [seeds, setSeeds] = useState([]);
  const [phase, setPhase] = useState(null);
  const [saved, setSaved] = useState(false);
  const tournament = tournamentStore((state) => state.tournament);
  const setPhases = tournamentStore((state) => state.setPhases);

  // Estados nuevos de la UI (Modales)
  const [mostrarModalExportar, setMostrarModalExportar] = useState(false);
  const [mostrarNotificacion, setMostrarNotificacion] = useState(false);

  // Efecto original para cargar datos
  useEffect(() => {
    if (!tournament || !apiToken) {
      navigate('/');
      return;
    }
    const phaseId = tournament?.phases?.[0]?.id;
    if (!phaseId) return;

    const loadPhaseSeeding = async () => {
      const data = await userService.getPhaseSeeding(apiToken, phaseId);
      if (!data || data.error || !data.phase) return;
      setSeeds(data.phase.seeds);
      setPhase(data.phase);
    };
    loadPhaseSeeding();
  }, [tournament, apiToken, navigate]);

  // Funciones originales adaptadas a la nueva UI
  const handleSeedsReordered = (updatedSeeds) => {
    const updatedPhase = { ...phase, seeds: updatedSeeds };
    setPhases([updatedPhase]);
    setPhase(updatedPhase);
    setSaved(false);
  };

  const handleSeedSave = () => {
    setSaved(true);
    // Mostrar el toast de éxito
    setMostrarNotificacion(true);
    setTimeout(() => setMostrarNotificacion(false), 3000);
  };

  const handleSeedPublish = async () => {
    setMostrarModalExportar(false); // Cierra el modal primero
    if (!phase) return;
    
    const seedMapping = parsePhaseSeedingDto(phase.seeds);
    const response = await userService.updatePhaseSeeding(apiToken, phase.id, seedMapping);
    console.log('Respuesta de la API al actualizar el seeding de la fase:', response);
    // Aquí podrías añadir otro toast de éxito si quieres
  };

  if (!tournament) return null;

  return (
    <div className="bracket-view-page">
      
      {/* BARRA SUPERIOR (Volver y Tema) */}
      <div className="bv-top-bar">
        <button className="btn-volver" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft /> Volver al Dashboard
        </button>
        <button className="btn-tema" onClick={toggleTema} title="Cambiar tema">
          {tema === 'dark' ? <FaSun size={20} /> : <FaMoon size={20} />}
        </button>
      </div>

      {/* CABECERA PRINCIPAL */}
      <header className="bv-header">
        <h1>Bracket del Torneo {tournament.tournamentName}</h1>
        
        <div className="bv-botones-accion">
          <button className="btn-secundario" onClick={() => navigate(`/torneo/${tournament.id}/borradores`)}>
            <FaHistory /> Ver Borradores
          </button>
          
          <button className="btn-secundario" onClick={handleSeedSave} disabled={saved}>
            <FaSave /> Guardar borrador
          </button>
          
          <button 
            className="btn-exportar" 
            onClick={() => setMostrarModalExportar(true)} 
            disabled={!saved}
          >
            <FaFileExport /> Subir
          </button>
        </div>
      </header>

      {/* CONTENEDOR DIVIDIDO 25/75 */}
      <div className="bv-layout">
        
        {/* COLUMNA 1: LISTA ARRASTRABLE DE TU COMPAÑERO (25%) */}
        <aside className="bv-lista-jugadores">
          <DraggableSeeding 
            seeds={seeds} 
            setSeeds={setSeeds} 
            onSeedsReordered={handleSeedsReordered}
          />
        </aside>

        {/* COLUMNA 2: LIENZO VISUAL (75%) */}
        <main className="bv-lienzo">
          <p>El lienzo visual del Drag & Drop o dibujo del Bracket irá aquí.</p>
        </main>
      </div>

      {/* --- MODALES Y NOTIFICACIONES --- */}
      {mostrarNotificacion && (
        <div className="toast-guardado">
          ✅ Borrador guardado correctamente
        </div>
      )}

      {mostrarModalExportar && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>⚠️ Confirmar Subida</h2>
            <p>¿Estás seguro de que quieres exportar este orden a start.gg? Esto modificará el torneo oficial.</p>
            <div className="modal-botones">
              <button className="btn-cancelar" onClick={() => setMostrarModalExportar(false)}>Cancelar</button>
              <button className="btn-exportar-confirmar" onClick={handleSeedPublish}>Sí, subir cambios</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}