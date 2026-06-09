import { FaTimes } from 'react-icons/fa';
import './HeadToHeadModal.css';

export default function HeadToHeadModal({
  open,
  onClose,
  onAddClash,
  onRemoveClash,
  activeClash,
  players,
  loading,
  error,
  sets,
  page,
  pageSize,
  onPageChange,
}) {
  if (!open) return null;

  const safePageSize = pageSize || 3;
  const totalPages = Math.max(1, Math.ceil((sets?.length || 0) / safePageSize));
  const currentPage = Math.min(Math.max(page || 1, 1), totalPages);
  const startIndex = (currentPage - 1) * safePageSize;
  const visibleSets = sets?.slice(startIndex, startIndex + safePageSize) || [];
  const escapeRegExp = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Función para limpiar el nombre del seed
  const cleanSeedName = (fullName) => {
    if (!fullName) return fullName;
    const match = String(fullName).match(/^(\d+)\s*\|\s*(.+)$/);
    return match ? match[2] : fullName;
  };

  const getScoreOnly = (set) => {
    if (!set.marcador) return 'Sin marcador';

    const scoreWithoutNames = [set.sideAName, set.sideBName]
      .filter(Boolean)
      .reduce(
        (score, name) => score.replace(new RegExp(escapeRegExp(name), 'gi'), ''),
        set.marcador
      );
    const scoreMatch = scoreWithoutNames.match(/(\d+)\s*[-–]\s*(\d+)/);

    return scoreMatch ? `${scoreMatch[1]} - ${scoreMatch[2]}` : set.marcador;
  };

  const handleAddClash = () => {
    if (!onAddClash) return;

    const reason = window.prompt('Motivo del clasheo:');
    if (!reason || !reason.trim()) return;

    const importanceInput = window.prompt('Importancia (1 a 5):', '3');
    if (importanceInput === null) return;

    const importance = Number.parseInt(importanceInput, 10);
    if (!Number.isFinite(importance) || importance < 1 || importance > 5) {
      window.alert('La importancia debe ser un numero del 1 al 5.');
      return;
    }

    onAddClash({ reason: reason.trim(), importance });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content h2h-modal">
        <div className="h2h-header">
          <h2>H2H</h2>
          <div className="h2h-header-actions">
            {activeClash ? (
              <button 
                className="btn-cancelar h2h-warning-button" 
                onClick={onRemoveClash} 
                type="button"
                style={{ backgroundColor: '#dc2626', color: '#fff' }}
              >
                Eliminar advertencia
              </button>
            ) : (
              onAddClash && (
                <button className="btn-primario h2h-warning-button" onClick={handleAddClash} type="button">
                  Incluir advertencia
                </button>
              )
            )}
            <button
              aria-label="Cerrar historial H2H"
              className="btn-cancelar h2h-close"
              onClick={onClose}
              title="Cerrar"
              type="button"
            >
              <FaTimes aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
        <p className="h2h-subtitle">
          {cleanSeedName(players?.teamA) || '---'} vs {cleanSeedName(players?.teamB) || '---'}
        </p>

        {activeClash && (
          <div className="h2h-clash-warning" style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            padding: '10px 15px',
            borderRadius: '6px',
            marginBottom: '15px',
            color: '#ef4444'
          }}>
            <strong>⚠️ Advertencia de Clasheo:</strong> {activeClash.reason} 
            <span style={{ marginLeft: '10px' }}>(Importancia: {activeClash.importance}/5)</span>
          </div>
        )}

        {loading && <p className="h2h-status">Cargando sets...</p>}
        {error && <p className="h2h-status h2h-error">{error}</p>}

        {!loading && !error && sets?.length === 0 && (
          <p className="h2h-status">No hay sets recientes entre estos jugadores.</p>
        )}

        {!loading && !error && visibleSets.length > 0 && (
          <ul className="h2h-list">
            {visibleSets.map((set) => (
              <li key={set.id || `${set.evento}-${set.fecha}-${set.marcador}`} className="h2h-item">
                <div className={`h2h-set-title ${set.winnerSide ? 'has-winner' : 'no-winner'}`}>
                  <span className={set.winnerSide === 'A' ? 'h2h-title-player is-winner' : 'h2h-title-player'}>
                    {set.sideAName}
                  </span>
                  <span className="h2h-score">{getScoreOnly(set)}</span>
                  <span className={set.winnerSide === 'B' ? 'h2h-title-player is-winner' : 'h2h-title-player'}>
                    {set.sideBName}
                  </span>
                </div>
                <div className="h2h-row">
                  <span className="h2h-label">Fecha:</span>
                  <span>{set.fecha}</span>
                </div>
                <div className="h2h-row">
                  <span className="h2h-label">Torneo:</span>
                  <span>{set.evento}</span>
                </div>
                <div className="h2h-row">
                  <span className="h2h-label">Evento:</span>
                  <span>{set.nombreEvento}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && !error && sets?.length > safePageSize && (
          <div className="h2h-pagination">
            <button
              type="button"
              className="btn-secundario"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Anterior
            </button>
            <span className="h2h-page">{currentPage} / {totalPages}</span>
            <button
              type="button"
              className="btn-secundario"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
