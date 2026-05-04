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

// Estado para la notificación flotante (Toast)
const [notificacion, setNotificacion] = useState({
  visible: false,
  mensaje: '',
  tipo: 'success' // Puedes usar 'success', 'error', 'info', etc.
});

// Estado para el modal emergente de confirmación
const [modalConfirmacion, setModalConfirmacion] = useState({
  visible: false,
  titulo: '',
  mensaje: '',
  textoConfirmar: 'Confirmar',
  onConfirm: null // Función a ejecutar cuando se diga que SÍ
});

// Función para mostrar un mensaje verde/rojo que desaparece a los 3 segundos
const mostrarAviso = (mensaje, tipo = 'success') => {
  setNotificacion({ visible: true, mensaje, tipo });
  setTimeout(() => setNotificacion(prev => ({ ...prev, visible: false })), 3000);
};

// Función para mostrar una ventana de "Estás seguro" configurable
const pedirConfirmacion = (titulo, mensaje, textoConfirmar, callbackConfirmacion) => {
  setModalConfirmacion({
    visible: true,
    titulo,
    mensaje,
    textoConfirmar,
    onConfirm: () => {
      setModalConfirmacion(prev => ({ ...prev, visible: false })); // Cierra el modal
      callbackConfirmacion(); // Ejecuta la acción prometida
    }
  });
};
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
  mostrarAviso('💾 Borrador guardado correctamente localmente', 'success');
};

  const handleSeedPublish = async () => {
    setModalConfirmacion(prev => ({ ...prev, visible: false })); // Cierra el modal primero
    if (!phase) return;
    
    const seedMapping = parsePhaseSeedingDto(phase.seeds);
    const response = await userService.updatePhaseSeeding(apiToken, phase.id, seedMapping);
    console.log('Respuesta de la API al actualizar el seeding de la fase:', response);
    // Aquí podrías añadir otro toast de éxito si quieres
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
            onClick={confirmarSubida}
          >
            <FaFileExport /> Subir
          </button>
        </div>
      </header>

      <div className="bv-layout">
        
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