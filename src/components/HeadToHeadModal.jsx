import './HeadToHeadModal.css';

export default function HeadToHeadModal({
  open,
  onClose,
  onAddClash,
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
          <h2>Historial entre jugadores</h2>
          {onAddClash && (
            <button className="btn-primario" onClick={handleAddClash} type="button">
              Anadir clasheo
            </button>
          )}
          <button className="btn-cancelar h2h-close" onClick={onClose} type="button">
            Cerrar
          </button>
        </div>
        <p className="h2h-subtitle">
          {players?.teamA || '---'} vs {players?.teamB || '---'}
        </p>

        {loading && <p className="h2h-status">Cargando sets...</p>}
        {error && <p className="h2h-status h2h-error">{error}</p>}

        {!loading && !error && sets?.length === 0 && (
          <p className="h2h-status">No hay sets recientes entre estos jugadores.</p>
        )}

        {!loading && !error && visibleSets.length > 0 && (
          <ul className="h2h-list">
            {visibleSets.map((set) => (
              <li key={set.id || `${set.evento}-${set.fecha}-${set.marcador}`} className="h2h-item">
                <div className="h2h-players">
                  <span className={set.winnerSide === 'A' ? 'h2h-side is-winner' : 'h2h-side'}>
                    {set.sideAName}
                  </span>
                  <span className="h2h-vs">vs</span>
                  <span className={set.winnerSide === 'B' ? 'h2h-side is-winner' : 'h2h-side'}>
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
                <div className="h2h-row">
                  <span className="h2h-label">Marcador:</span>
                  <span>{set.marcador}</span>
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
