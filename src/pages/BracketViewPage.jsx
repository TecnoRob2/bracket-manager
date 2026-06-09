import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { userStore } from '../store/userStore';
import { tournamentStore } from '../store/tournamentStore';
import { tournamentService } from '../services/tournamentService';

import { userService } from '../services/userService';
import { draftService } from '../services/draftService';

import { parsePhaseSeedingDto } from '../utils/parser';
import { buildBracketData } from '../utils/bracketGenerator';
import { getHeadToHeadMatches } from '../utils/playerHeadToHead';
import DraggableSeeding from '../components/DraggableSeeding';
import BracketTabs from '../components/BracketTabs';
import HeadToHeadModal from '../components/HeadToHeadModal';
import Notification from '../components/Notification';
// Nuevos iconos
import { FaArrowLeft, FaSave, FaFileExport, FaMoon, FaSun, FaHistory, FaSyncAlt } from 'react-icons/fa';

import './BracketViewPage.css';
import { clashService } from '../services/clashService';
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
  const [mostrarModalH2H, setMostrarModalH2H] = useState(false);
  const [reloadingTournament, setReloadingTournament] = useState(false);
  const [h2hLoading, setH2hLoading] = useState(false);
  const [h2hError, setH2hError] = useState('');
  const [h2hSets, setH2hSets] = useState([]);
  const [h2hPlayers, setH2hPlayers] = useState({ p1_id: null, p2_id: null, teamA: '', teamB: '' });
  const [activeClash, setActiveClash] = useState(null);
  const [h2hPage, setH2hPage] = useState(1);
  const h2hPageSize = 3;

  // Estado para la notificación flotante (Toast)
  const [notificacion, setNotificacion] = useState({
    open: false,
    message: '',
    type: 'success',
  });

  // Estado para el modal emergente de confirmación
  const [modalConfirmacion, setModalConfirmacion] = useState({
    visible: false,
    titulo: '',
    mensaje: '',
    textoConfirmar: 'Confirmar',
    onConfirm: null,
  });

  // Función para mostrar una ventana de "Estás seguro" configurable
  const pedirConfirmacion = (titulo, mensaje, textoConfirmar, callbackConfirmacion) => {
    setModalConfirmacion({
      visible: true,
      titulo,
      mensaje,
      textoConfirmar,
      onConfirm: () => {
        setModalConfirmacion((prev) => ({ ...prev, visible: false }));
        callbackConfirmacion();
      },
    });
  };

  const isDoubleElimination = (selectedPhase?.bracketType ?? '').toLowerCase().includes('double');
  const bracketData = useMemo(
    () => buildBracketData(selectedPhase?.seeds ?? [], isDoubleElimination),
    [selectedPhase?.seeds, isDoubleElimination]
  );

  const loadPhaseSeeding = useCallback(async (forceReload = false) => {
    if (!currentPhase || !apiToken) return false;

    const data = await userService.getPhaseSeeding(apiToken, currentPhase.id, forceReload);
    if (!data || data.error || !data.phase) {
      setSelectedPhase(currentPhase);
      return false;
    }

    const updatedPhase = { ...currentPhase, seeds: data.phase.seeds };
    setSelectedPhase(updatedPhase);
    setPhases([updatedPhase]);
    return true;
  }, [apiToken, currentPhase, setPhases]);

  // Efecto original para cargar datos
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

    const timeoutId = window.setTimeout(() => {
      void loadPhaseSeeding();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [tournament, apiToken, navigate, currentPhase, loadPhaseSeeding]);


  // Actualiza el orden de seeds desde la lista draggable.
  const handleSeedsReordered = (updatedSeeds) => {
    if (!selectedPhase) return;
    const updatedPhase = { ...selectedPhase, seeds: updatedSeeds };
    setSelectedPhase(updatedPhase);
    setPhases([updatedPhase]);
    console.log('Fase actualizada con nuevo orden de seeds:', updatedPhase);

    setSaved(false);
  };

  const handleTournamentReload = async () => {
    if (reloadingTournament) return;

    setReloadingTournament(true);
    try {
      const reloaded = await loadPhaseSeeding(true);
      if (reloaded) {
        setSaved(false);
        setNotificacion({ open: true, message: 'Torneo recargado correctamente', type: 'success' });
        return;
      }

      setNotificacion({ open: true, message: 'No se pudo recargar el torneo', type: 'error' });
    } catch (error) {
      console.error('Error recargando torneo:', error);
      setNotificacion({ open: true, message: 'No se pudo recargar el torneo', type: 'error' });
    } finally {
      setReloadingTournament(false);
    }
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
      setNotificacion({ open: true, message: 'Borrador guardado correctamente', type: 'success' });
    } catch (error) {
      console.error('Error guardando borrador:', error);
      setNotificacion({ open: true, message: 'No se pudo guardar el borrador', type: 'error' });
    } finally {
      setSaved(false);
    }
  };

  // Publica el seeding en la API.
  const handleSeedPublish = async () => {
    setModalConfirmacion(prev => ({ ...prev, visible: false })); // Cierra el modal primero
    if (!selectedPhase) return;
    
    const seedMapping = parsePhaseSeedingDto(selectedPhase.seeds);
    const response = await tournamentService.updateSeeding(selectedPhase.id, seedMapping);
    console.log('Respuesta de la API al actualizar el seeding de la fase:', response);
    if (response.success) {
      setNotificacion({ open: true, message: 'Seeding actualizado en StartGG', type: 'success' });
    }

    if (response.error) {
      setNotificacion({ open: true, message: 'Error al actualizar el seeding en StartGG', type: 'error' });
    }
    setSaved(true);

  };

  // Click sobre un set para cargar el H2H.
  const handleSeedClick = async ({ seed }) => {
    const teamA = seed?.teams?.[0]?.name || '---';
    const teamB = seed?.teams?.[1]?.name || '---';
    const seedIdA = seed?.teams?.[0]?.seedId;
    const seedIdB = seed?.teams?.[1]?.seedId;

    console.log('Seed clickeada:', seed);

    // Intentamos buscar los Player IDs directamente en las semillas locales para ir rápido
    const p1Seed = selectedPhase?.seeds?.find(s => String(s.seedId) === String(seedIdA));
    const p2Seed = selectedPhase?.seeds?.find(s => String(s.seedId) === String(seedIdB));

    const resolvedP1 = p1Seed?.playerId || null;
    const resolvedP2 = p2Seed?.playerId || null;

    setH2hPlayers({ p1_id: resolvedP1, p2_id: resolvedP2, teamA, teamB });
    setActiveClash(null);
    setH2hError('');
    setH2hSets([]);
    setH2hPage(1);
    setMostrarModalH2H(true);

    // Si ya tenemos los IDs resueltos localmente, buscamos el clash de forma instantánea
    if (resolvedP1 && resolvedP2) {
      const existingClash = await clashService.getClasheo(resolvedP1, resolvedP2);
      console.log('Clash encontrado instantáneamente:', existingClash);
      setActiveClash(existingClash);
    }

    if (!apiToken) {
      setH2hError('No hay token de autenticacion para consultar H2H.');
      return;
    }

    if (!seedIdA || !seedIdB) {
      setH2hError('No se pudieron resolver los IDs de ambos jugadores.');
      return;
    }

    setH2hLoading(true);
    try {
      const hasLocalIds = !!(resolvedP1 && resolvedP2);
      const queryIdA = hasLocalIds ? resolvedP1 : seedIdA;
      const queryIdB = hasLocalIds ? resolvedP2 : seedIdB;

      // Al pasar `hasLocalIds` como 5º argumento, evitamos llamadas lentas de resolución
      const result = await getHeadToHeadMatches(apiToken, queryIdA, queryIdB, 50, hasLocalIds);
      setH2hSets(result.matches);
      
      // Si no teníamos los IDs locales inicialmente, guardamos los resueltos por la API
      if (!hasLocalIds) {
        setH2hPlayers(prev => ({
          ...prev,
          p1_id: result.p1Id,
          p2_id: result.p2Id,
        }));

        if (result.p1Id && result.p2Id) {
          const existingClash = await clashService.getClasheo(result.p1Id, result.p2Id);
          console.log('Clash encontrado tras resolución H2H:', existingClash);
          setActiveClash(existingClash);
        }
      }
    } catch (error) {
      console.error('Error cargando sets H2H:', error);
      setH2hError('No se pudieron cargar los sets.');
    } finally {
      setH2hLoading(false);
    }
  };
// Cuando pulsas el botón rojo grande de "Subir"
const uploadStartGG = async () => {
  pedirConfirmacion(
    'Confirmar subida a StartGG',
    'Esto modificará el torneo en la plataforma.',
    'Sí, subir',
    handleSeedPublish // Pasamos tu función original como callback
  );
};

const reloadTournament = () => {
  pedirConfirmacion(
    'Recargar torneo',
    'Se perderán los cambios no subidos.',
    'Sí, recargar',
    handleTournamentReload
  );
};

  if (!tournament) return null;

  return (
    <div className="bracket-view">
      {/* BARRA SUPERIOR (Volver y Tema) */}
      <div className="bracket-view__top-bar">
        <button className="bracket-view__back" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft /> Volver al Dashboard
        </button>
        <button className="bracket-view__theme" onClick={toggleTema} title="Cambiar tema">
          {tema === 'dark' ? <FaSun size={20} /> : <FaMoon size={20} />}
        </button>
      </div>

      {/* CABECERA PRINCIPAL */}
      <header className="bracket-view__header">
        <div className="bracket-view__header-info">
          <h1 className="bracket-view__title">{tournament.tournamentName}</h1>
          <h2 className="bracket-view__subtitle">{tournament.eventName}</h2>
        </div>
        <div className="bracket-view__actions">
          <button
            className="bracket-view__button bracket-view__button--secondary"
            onClick={reloadTournament}
            disabled={reloadingTournament}
          >
            <FaSyncAlt /> {reloadingTournament ? 'Recargando...' : 'Recargar torneo'}
          </button>
          <button className="bracket-view__button bracket-view__button--secondary" onClick={() => navigate(`/torneo/${tournament.id}/borradores`)}>
            <FaHistory /> Ver borradores
          </button>
          <button className="bracket-view__button bracket-view__button--secondary" onClick={handleSeedSave} disabled={saved}>
            <FaSave /> Guardar borrador
          </button>
          <button 
            className="bracket-view__button bracket-view__button--export" 
            onClick={uploadStartGG}
          >
            <FaFileExport /> Exportar a StartGG
          </button>
        </div>
      </header>

      <div className="bracket-view__layout">
        <aside className="bracket-view__players">
          <DraggableSeeding 
            seeds={selectedPhase ? selectedPhase.seeds : []} 
            onSeedsReordered={handleSeedsReordered}
          />
        </aside>
        {/* COLUMNA 2: LIENZO VISUAL (75%) */}
        <main className="bracket-view__canvas"> 
          <BracketTabs
            winnerRounds={bracketData.winnerRounds}
            loserRounds={bracketData.loserRounds}
            isDoubleElimination={isDoubleElimination}
            onSeedClick={handleSeedClick}
          />
        </main>
      </div>

      {/* --- MODALES Y NOTIFICACIONES --- */}
      <Notification
        open={notificacion.open}
        message={notificacion.message}
        type={notificacion.type}
        duration={2500}
        onClose={() => setNotificacion((prev) => ({ ...prev, open: false }))}
      />

      {/* MODAL DE CONFIRMACIÓN REUTILIZABLE */}
      {modalConfirmacion.visible && (
        <div className="bracket-view__modal-overlay" onClick={() => setModalConfirmacion(prev => ({...prev, visible: false}))}>
          <div className="bracket-view__modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{modalConfirmacion.titulo}</h2>
            <p>{modalConfirmacion.mensaje}</p>
            <div className="bracket-view__modal-actions">
              <button 
                className="bracket-view__modal-cancel" 
                onClick={() => setModalConfirmacion(prev => ({...prev, visible: false}))}
              >
                Cancelar
              </button>
              <button 
                className="bracket-view__modal-confirm" 
                onClick={modalConfirmacion.onConfirm}
              >
                {modalConfirmacion.textoConfirmar}
              </button>
            </div>
          </div>
        </div>
      )}

      <HeadToHeadModal
        open={mostrarModalH2H}
        onClose={() => setMostrarModalH2H(false)}
        activeClash={activeClash}
        onAddClash={async ({ reason, importance }) => {
          if (!h2hPlayers.p1_id || !h2hPlayers.p2_id) {
            setNotificacion({ open: true, message: 'No se puede guardar el clasheo: Faltan los IDs de los jugadores.', type: 'error' });
            return;
          }
          try {
            const nuevoClash = {
              p1_id: h2hPlayers.p1_id,
              p2_id: h2hPlayers.p2_id,
              reason,
              importance
            };
            await clashService.addClasheo(nuevoClash);
            setActiveClash(nuevoClash);
            setNotificacion({ open: true, message: 'Advertencia de clasheo agregada correctamente.', type: 'success' });
          } catch (error) {
            console.error('Error al agregar clasheo:', error);
            setNotificacion({ open: true, message: 'No se pudo guardar la advertencia.', type: 'error' });
          }
        }}
        onRemoveClash={async () => {
          if (!h2hPlayers.p1_id || !h2hPlayers.p2_id) return;
          try {
            await clashService.removeClasheo(h2hPlayers.p1_id, h2hPlayers.p2_id);
            setActiveClash(null);
            setNotificacion({ open: true, message: 'Clasheo eliminado correctamente.', type: 'success' });
          } catch (error) {
            console.error('Error al eliminar clasheo:', error);
            setNotificacion({ open: true, message: 'No se pudo eliminar el clasheo.', type: 'error' });
          }
        }}
        players={h2hPlayers}
        loading={h2hLoading}
        error={h2hError}
        sets={h2hSets}
        page={h2hPage}
        pageSize={h2hPageSize}
        onPageChange={setH2hPage}
      />
    </div>
  );
}
