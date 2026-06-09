import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userStore } from '../store/userStore';
import { clashStore } from '../store/clashStore';
import { clashService } from '../services/clashService';
import './ReglasPage.css';
import { FaMoon, FaSun, FaSignOutAlt, FaTrash } from 'react-icons/fa';

// Función para limpiar nombres de seeds
const cleanSeedName = (fullName) => {
  if (!fullName) return fullName;
  const match = String(fullName).match(/^(\d+)\s*\|\s*(.+)$/);
  return match ? match[2].trim() : fullName;
};

export default function ReglasPage() {
  const navigate = useNavigate();
  const tema = userStore((state) => state.tema);
  const toggleTema = userStore((state) => state.toggleTema);
  const cerrarSesion = userStore((state) => state.cerrarSesion);
  
  const clasheos = clashStore((state) => state.clasheos);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalConfirmacion, setModalConfirmacion] = useState({
    visible: false,
    titulo: '',
    mensaje: '',
    textoConfirmar: 'Eliminar',
    onConfirm: null,
    clasheoAEliminar: null,
  });

  useEffect(() => {
    const cargarClasheos = async () => {
      try {
        setLoading(true);
        await clashService.loadClasheos();
        setError('');
      } catch (err) {
        console.error('Error al cargar clasheos:', err);
        setError('No se pudieron cargar los clasheos');
      } finally {
        setLoading(false);
      }
    };

    cargarClasheos();
  }, []);

  const pedirConfirmacionEliminar = (clasheo) => {
    setModalConfirmacion({
      visible: true,
      titulo: 'Eliminar clasheo',
      mensaje: `¿Estás seguro de que deseas eliminar el clasheo entre ${cleanSeedName(clasheo.p1_name) || clasheo.p1_id} y ${cleanSeedName(clasheo.p2_name) || clasheo.p2_id}?`,
      textoConfirmar: 'Eliminar',
      clasheoAEliminar: clasheo,
      onConfirm: () => handleEliminarClasheo(clasheo),
    });
  };

  const handleEliminarClasheo = async (clasheo) => {
    try {
      await clashService.removeClasheo(clasheo.p1_id, clasheo.p2_id);
      setModalConfirmacion(prev => ({ ...prev, visible: false }));
    } catch (err) {
      console.error('Error al eliminar clasheo:', err);
      setError('No se pudo eliminar el clasheo');
    }
  };

  return (
    <div className="reglas-page">
      {/* CABECERA */}
      <header className="reglas-page__header">
        <div className="reglas-page__title-group">
          <h1 className="reglas-page__title">Gestión de Clasheos</h1>
        </div>
        <div className="reglas-page__header-actions">
          <button className="reglas-page__button reglas-page__button--back" onClick={() => navigate('/dashboard')}>
            Torneos
          </button>
          <button 
            className="reglas-page__button reglas-page__button--logout" 
            onClick={() => {
              cerrarSesion();
              navigate('/');
            }}
            title="Cerrar sesión"
          >
            <FaSignOutAlt size={20} />
          </button>
          <button className="reglas-page__button reglas-page__button--theme" onClick={toggleTema} title="Cambiar tema">
            {tema === 'dark' ? <FaSun size={20} /> : <FaMoon size={20} />}
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="reglas-page__content">
        {error && (
          <div className="reglas-page__message reglas-page__message--error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="reglas-page__message reglas-page__message--loading">
            Cargando clasheos...
          </div>
        ) : clasheos.length === 0 ? (
          <div className="reglas-page__message reglas-page__message--empty">
            No hay clasheos registrados
          </div>
        ) : (
          <div className="reglas-page__list">
            {clasheos.map((clasheo) => (
              <div key={`${clasheo.p1_id}-${clasheo.p2_id}`} className="reglas-page__card">
                
                <div className="reglas-page__card-info">
                  <div className="reglas-page__card-players">
                    <span className="reglas-page__player-name">{cleanSeedName(clasheo.p1_name) || clasheo.p1_id}</span>
                    <span className="reglas-page__player-vs">vs</span>
                    <span className="reglas-page__player-name">{cleanSeedName(clasheo.p2_name) || clasheo.p2_id}</span>
                  </div>
                  
                  <div className="reglas-page__card-details">
                    <p className="reglas-page__detail-item">
                      <strong>Motivo:</strong> {clasheo.reason || 'No especificado'}
                    </p>
                    <p className="reglas-page__detail-item">
                      <strong>Importancia:</strong> {clasheo.importance || 0}/5
                    </p>
                  </div>
                </div>

                <div className="reglas-page__card-actions">
                  <button 
                    className="reglas-page__button-action reglas-page__button-action--delete"
                    onClick={() => pedirConfirmacionEliminar(clasheo)}
                    title="Eliminar clasheo"
                    aria-label="Eliminar"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL DE CONFIRMACIÓN */}
      {modalConfirmacion.visible && (
        <div 
          className="reglas-page__modal-overlay" 
          onClick={() => setModalConfirmacion(prev => ({...prev, visible: false}))}
        >
          <div 
            className="reglas-page__modal-content" 
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="reglas-page__modal-title">{modalConfirmacion.titulo}</h2>
            <p className="reglas-page__modal-message">{modalConfirmacion.mensaje}</p>
            <div className="reglas-page__modal-actions">
              <button 
                className="reglas-page__modal-cancel" 
                onClick={() => setModalConfirmacion(prev => ({...prev, visible: false}))}
              >
                Cancelar
              </button>
              <button 
                className="reglas-page__modal-confirm" 
                onClick={() => {
                  setModalConfirmacion(prev => ({...prev, visible: false}));
                  modalConfirmacion.onConfirm();
                }}
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