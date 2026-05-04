import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { userStore } from '../store/userStore';
import { tournamentStore } from '../store/tournamentStore';

import { userService } from '../services/userService';
import { draftService } from '../services/draftService';

import { parsePhaseSeedingDto } from '../utils/parser';
import { buildBracketData } from '../core/bracketGenerator';
import { getHeadToHeadMatches } from '../utils/playerHeadToHead';
import DraggableSeeding from '../components/DraggableSeeding';
import BracketTabs from '../components/BracketTabs';
import HeadToHeadModal from '../components/HeadToHeadModal';
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
  const [mostrarModalH2H, setMostrarModalH2H] = useState(false);
  const [h2hLoading, setH2hLoading] = useState(false);
  const [h2hError, setH2hError] = useState('');
  const [h2hSets, setH2hSets] = useState([]);
  const [h2hPlayers, setH2hPlayers] = useState({ teamA: '', teamB: '' });
  const [h2hPage, setH2hPage] = useState(1);
  const h2hPageSize = 3;

  // Estado para la notificación flotante (Toast)
  const [notificacion, setNotificacion] = useState({
    visible: false,
    mensaje: '',
    tipo: 'success',
  });

  // Estado para el modal emergente de confirmación
  const [modalConfirmacion, setModalConfirmacion] = useState({
    visible: false,
    titulo: '',
    mensaje: '',
    textoConfirmar: 'Confirmar',
    onConfirm: null,
  });

  // Función para mostrar un mensaje verde/rojo que desaparece a los 3 segundos
  const mostrarAviso = (mensaje, tipo = 'success') => {
    setNotificacion({ visible: true, mensaje, tipo });
    setTimeout(() => setNotificacion((prev) => ({ ...prev, visible: false })), 3000);
  };

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
      mostrarAviso('Borrador guardado correctamente', 'success');
    } catch (error) {
      console.error('Error guardando borrador:', error);
      mostrarAviso('No se pudo guardar el borrador', 'error');
    }
  };

  // Publica el seeding en la API.
  const handleSeedPublish = async () => {
    setModalConfirmacion(prev => ({ ...prev, visible: false })); // Cierra el modal primero
    if (!selectedPhase) return;
    
    const seedMapping = parsePhaseSeedingDto(selectedPhase.seeds);
    const response = await userService.updatePhaseSeeding(apiToken, selectedPhase.id, seedMapping);
    console.log('Respuesta de la API al actualizar el seeding de la fase:', response);
    // Aquí podrías añadir otro toast de éxito si quieres
  };

  // Click sobre un set para cargar el H2H.
  const handleSeedClick = async ({ seed }) => {
    const teamA = seed?.teams?.[0]?.name || '---';
    const teamB = seed?.teams?.[1]?.name || '---';
    const seedIdA = seed?.teams?.[0]?.seedId;
    const seedIdB = seed?.teams?.[1]?.seedId;

    setH2hPlayers({ teamA, teamB });
    setH2hError('');
    setH2hSets([]);
    setH2hPage(1);
    setMostrarModalH2H(true);

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
      const sets = await getHeadToHeadMatches(apiToken, seedIdA, seedIdB, 50);
      setH2hSets(sets);
    } catch (error) {
      console.error('Error cargando sets H2H:', error);
      setH2hError('No se pudieron cargar los sets.');
    } finally {
      setH2hLoading(false);
    }
  };
// Cuando pulsas el botón rojo grande de "Subir"
const confirmarSubida = () => {
  pedirConfirmacion(
    '⚠️ Confirmar subida',
    '¿Estás seguro de que quieres exportar este orden a start.gg? Esto modificará el torneo oficial en la nube.',
    'Sí, subir',
    handleSeedPublish // Pasamos tu función original como callback
  );
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
            onClick={confirmarSubida}
          >
            <FaFileExport /> Exportar a StartGG
          </button>
        </div>
      </header>

      <div className="bv-layout">
        
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
            {/* NOTIFICACIÓN REUTILIZABLE (TOAST) */}
      {notificacion.visible && (
        <div className="toast-guardado" style={{
          backgroundColor: notificacion.tipo === 'error' ? '#dc3545' : '#28a745'
        }}>
          {notificacion.mensaje}
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN REUTILIZABLE */}
      {modalConfirmacion.visible && (
        <div className="modal-overlay" onClick={() => setModalConfirmacion(prev => ({...prev, visible: false}))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{modalConfirmacion.titulo}</h2>
            <p>{modalConfirmacion.mensaje}</p>
            <div className="modal-botones">
              <button 
                className="btn-cancelar" 
                onClick={() => setModalConfirmacion(prev => ({...prev, visible: false}))}
              >
                Cancelar
              </button>
              <button 
                className="btn-exportar-confirmar" 
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

/* =====================================================================
 * 🛠️ GUÍA DE USO: COMPONENTES REUTILIZABLES (MODAL Y NOTIFICACIONES)
 * =====================================================================
 *
 * Estas dos herramientas sirven para lanzar avisos en pantalla sin 
 * tener que escribir el HTML (JSX) cada vez.
 *
 * ---------------------------------------------------------------------
 * 1️⃣ NOTIFICACIONES FLOTANTES (TOASTS)
 * ---------------------------------------------------------------------
 * Muestra un pequeño mensaje en la esquina que desaparece a los 3 segundos.
 * Ideal para confirmar que una acción silenciosa ha salido bien.
 *
 * ¿CÓMO USARLO?
 * Simplemente llama a la función `mostrarAviso(mensaje, tipo)` dentro
 * de cualquier otra función de tu componente.
 *
 * EJEMPLOS DE USO:
 *   // Ejemplo 1: Guardado exitoso (verde por defecto)
 *   const guardarDatos = () => {
 *     guardarEnBaseDeDatos();
 *     mostrarAviso('Datos guardados correctamente', 'success');
 *   };
 *
 *   // Ejemplo 2: Mostrar un error (rojo)
 *   const fallarDatos = () => {
 *     mostrarAviso('Error: No se pudo conectar al servidor', 'error');
 *   };
 *
 * ---------------------------------------------------------------------
 * 2️⃣ VENTANAS EMERGENTES DE CONFIRMACIÓN (MODALES)
 * ---------------------------------------------------------------------
 * Muestra una ventana en el centro de la pantalla bloqueando el resto
 * de la app. Tiene un botón de Cancelar y otro de Confirmar.
 * Ideal para acciones destructivas (borrar, sobreescribir, exportar).
 *
 * ¿CÓMO USARLO?
 * Llama a la función `pedirConfirmacion(titulo, texto, textoBoton, callback)`
 * donde "callback" es la función real que quieres que se ejecute SOLO
 * si el usuario pulsa el botón de confirmar.
 *
 * EJEMPLOS DE USO:
 *   // Paso A: Tienes la función peligrosa que quieres proteger
 *   const borrarJugador = () => {
 *     api.delete(jugadorId);
 *   };
 *
 *   // Paso B: Creas una función intermedia que lanza el modal
 *   const intentarBorrarJugador = () => {
 *     pedirConfirmacion(
 *       '⚠️ Borrar Jugador',                      // 1. Título grande
 *       '¿Estás seguro de que quieres borrarlo?', // 2. Texto explicativo
 *       'Sí, borrar',                             // 3. Texto del botón rojo
 *       borrarJugador                             // 4. Función a ejecutar si dice "Sí"
 *     );
 *   };
 *
 *   // Paso C: En tu botón HTML (JSX), llamas a la intermedia:
 *   // <button onClick={intentarBorrarJugador}>Borrar</button>
 * =====================================================================
 */