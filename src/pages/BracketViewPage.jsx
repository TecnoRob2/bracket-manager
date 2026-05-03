import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { userStore } from '../store/userStore';
import { tournamentStore } from '../store/tournamentStore';

import { userService } from '../services/userService';
import { draftService } from '../services/draftService';

import { parsePhaseSeedingDto } from '../utils/parser';
import { buildBracketData } from '../core/bracketGenerator';
import DraggableSeeding from '../components/DraggableSeeding';
import BracketTabs from '../components/BracketTabs';
// Nuevos iconos
import { FaArrowLeft, FaSave, FaFileExport, FaMoon, FaSun, FaHistory } from 'react-icons/fa';

import './BracketViewPage.css';
export default function BracketViewPage() {
  const navigate = useNavigate();

  const [saved, setSaved] = useState(false);

  // Tema (claro/oscuro)
  const tema = userStore((state) => state.tema);
  const toggleTema = userStore((state) => state.toggleTema);

  // Datos del torneo y fase actual
  const apiToken = userStore((state) => state.apiToken);
  const tournament = tournamentStore((state) => state.tournament);
  const { setPhases, phase_idx } = tournamentStore((state) => state);
  const currentPhase = tournament?.phases?.[phase_idx] ?? null;
  const [selectedPhase, setSelectedPhase] = useState(() => currentPhase);

  // UI (modales y notificaciones)
  const [mostrarModalExportar, setMostrarModalExportar] = useState(false);
  const [mostrarNotificacion, setMostrarNotificacion] = useState(false);

  const rawBracketType = selectedPhase?.bracketType;
  const bracketType = String(rawBracketType || '').toLowerCase();
  const isDoubleElimination =
    bracketType.includes('double') ||
    bracketType === 'double_elimination' ||
    Number(rawBracketType) === 2;
  const bracketData = useMemo(
    () => buildBracketData(selectedPhase?.seeds, isDoubleElimination),
    [selectedPhase?.seeds, isDoubleElimination],
  );

  // Marca el body para estilos específicos de la vista.
  useEffect(() => {
    document.body.classList.add('bracket-view-active');
    return () => document.body.classList.remove('bracket-view-active');
  }, []);

  // Carga de seeds desde la API para la fase actual.
  useEffect(() => {
    if (!tournament || !apiToken) {
      navigate('/');
      return;
    }

    console.log('Cargando BracketViewPage para el torneo:', tournament);

    if (!currentPhase) {
      console.error('No se encontró la fase del torneo. Verifica que el torneo tenga fases y que se estén cargando correctamente en el store.');
      return;
    }

    const loadPhaseSeeding = async () => {
      const data = await userService.getPhaseSeeding(apiToken, currentPhase.id);
      if (!data || data.error || !data.phase) {
        setSelectedPhase(currentPhase);
        return;
      }

      setSelectedPhase({ ...currentPhase, seeds: data.phase.seeds });
    };
    void loadPhaseSeeding();
  }, [tournament, apiToken, navigate, currentPhase]);

  // Actualiza el orden de seeds desde la lista draggable.
  const handleSeedsReordered = (updatedSeeds) => {
    if (!selectedPhase) return;
    const updatedPhase = { ...selectedPhase, seeds: updatedSeeds };
    setSelectedPhase(updatedPhase);
    setPhases([updatedPhase]);
    console.log('Fase actualizada con nuevo orden de seeds:', updatedPhase);

    setSaved(false);
  };

  // Guarda el borrador en disco (Tauri).
  const handleSeedSave = async () => {
    if (!selectedPhase || !tournament || !selectedPhase.dirName) return;

    try {  
      const result = await draftService.exportSeedingDraft(selectedPhase.dirName, selectedPhase.seeds);

      if (!result.success) {
        throw new Error('No se pudo exportar el borrador de seeding');
      }

      setSaved(true);
      setMostrarNotificacion(true);
      setTimeout(() => setMostrarNotificacion(false), 3000);
    } catch (error) {
      console.error('Error guardando borrador:', error);
    }
  };

  // Publica el seeding en la API.
  const handleSeedPublish = async () => {
    setMostrarModalExportar(false); // Cierra el modal primero
    if (!selectedPhase) return;
    
    const seedMapping = parsePhaseSeedingDto(selectedPhase.seeds);
    const response = await userService.updatePhaseSeeding(apiToken, selectedPhase.id, seedMapping);
    console.log('Respuesta de la API al actualizar el seeding de la fase:', response);
    // Aquí podrías añadir otro toast de éxito si quieres
  };

  // Demo: click sobre un set.
  const handleSeedClick = ({ seed, roundIndex, seedIndex }) => {
    const teamA = seed?.teams?.[0]?.name || '---';
    const teamB = seed?.teams?.[1]?.name || '---';
    const message = `Click en set ${roundIndex + 1}-${seedIndex + 1}: ${teamA} vs ${teamB}`;
    window.alert(message);
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
        <div>
          <h1>{tournament.tournamentName}</h1>
          <h2>{tournament.name}</h2>
        </div>
        <div className="bv-botones-accion">
          <button className="btn-secundario" onClick={() => navigate(`/torneo/${tournament.id}/borradores`)}>
            <FaHistory /> Ver borradores
          </button>
          
          <button className="btn-secundario" onClick={handleSeedSave} disabled={saved}>
            <FaSave /> Guardar borrador
          </button>
          
          <button 
            className="btn-exportar" 
            onClick={() => setMostrarModalExportar(true)} 
            disabled={!saved}
          >
            <FaFileExport /> Exportar a StartGG
          </button>
        </div>
      </header>

      {/* CONTENEDOR DIVIDIDO 25/75 */}
      <div className="bv-layout">
        
        {/* COLUMNA 1: LISTA ARRASTRABLE DE TU COMPAÑERO (25%) */}
        <aside className="bv-lista-jugadores">
          <DraggableSeeding 
            seeds={selectedPhase ? selectedPhase.seeds : []} 
            onSeedsReordered={handleSeedsReordered}
          />
        </aside>

        {/* COLUMNA 2: LIENZO VISUAL (75%) */}
        <main className="bv-lienzo"> 
          <BracketTabs
            winnerRounds={bracketData.winnerRounds}
            loserRounds={bracketData.loserRounds}
            isDoubleElimination={isDoubleElimination}
            onSeedClick={handleSeedClick}
          />
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