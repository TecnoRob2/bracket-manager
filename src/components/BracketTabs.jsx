import { useRef, useState } from 'react';
import {
  Bracket,
  Seed,
  SeedItem,
  SeedTeam,
  SeedTime,
  SingleLineSeed,
} from '@ready2/react-brackets';

import './BracketTabs.css';

export default function BracketTabs({
  winnerRounds = [],
  loserRounds = [],
  isDoubleElimination = false,
  onSeedClick,
}) {
  const [activeTab, setActiveTab] = useState('winners');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const suppressClickRef = useRef(false);
  const activeRounds = activeTab === 'losers' ? loserRounds : winnerRounds;
  const emptyMessage = isDoubleElimination
    ? 'No hay suficientes jugadores para armar loser bracket.'
    : 'Este torneo no tiene loser bracket.';

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  /**
   * Ajusta el zoom con la rueda del mouse.
   * @param {WheelEvent} event
   */
  const handleWheel = (event) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -0.08 : 0.08;
    const nextZoom = clamp(zoom + direction, 0.5, 2.5);
    setZoom(nextZoom);
  };

  /**
   * Inicia el paneo del bracket.
   * @param {PointerEvent} event
   */
  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    isDraggingRef.current = true;
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
    suppressClickRef.current = false;
  };

  /**
   * Mueve el bracket mientras se arrastra.
   * @param {PointerEvent} event
   */
  const handlePointerMove = (event) => {
    if (!isDraggingRef.current) return;

    const dx = event.clientX - lastPointerRef.current.x;
    const dy = event.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: event.clientX, y: event.clientY };

    // Evita disparar clicks si hubo desplazamiento real.
    if (Math.abs(dx) + Math.abs(dy) > 2) {
      suppressClickRef.current = true;
    }

    setOffset((current) => ({ x: current.x + dx, y: current.y + dy }));
  };

  /**
   * Finaliza el paneo del bracket.
   * @param {PointerEvent} event
   */
  const handlePointerUp = (event) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  /**
   * Renderiza un set clickeable.
   * @param {object} params
   * @param {object} params.seed
   * @param {number} params.breakpoint
   * @param {boolean} params.isMiddleOfTwoSided
   * @param {number} params.roundIndex
   * @param {number} params.seedIndex
   */
  const renderSeedComponent = ({
    seed,
    breakpoint,
    isMiddleOfTwoSided,
    roundIndex,
    seedIndex,
  }) => {
    const Wrapper = isMiddleOfTwoSided ? SingleLineSeed : Seed;
    const teamA = seed?.teams?.[0]?.name || '-----------';
    const teamB = seed?.teams?.[1]?.name || '-----------';

    return (
      <Wrapper
        mobileBreakpoint={breakpoint}
        className="bv-bracket-seed"
      >
        <SeedItem
          className="bv-bracket-seed-item"
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => {
            event.stopPropagation();
            if (suppressClickRef.current) {
              suppressClickRef.current = false;
              return;
            }
            onSeedClick?.({ seed, roundIndex, seedIndex });
          }}
        >
          <div>
            <SeedTeam>{teamA}</SeedTeam>
            <SeedTeam>{teamB}</SeedTeam>
          </div>
        </SeedItem>
        <SeedTime mobileBreakpoint={breakpoint}>{seed?.date}</SeedTime>
      </Wrapper>
    );
  };

  return (
    <section className="bv-bracket-panel">
      <div className="bv-bracket-panel-header">
        <div className="bv-bracket-panel-spacer" />
        <div className="bv-bracket-tabs" role="tablist" aria-label="Selección de bracket">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'winners'}
            className={activeTab === 'winners' ? 'bv-bracket-tab is-active' : 'bv-bracket-tab'}
            onClick={() => setActiveTab('winners')}
          >
            Winners
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'losers'}
            className={activeTab === 'losers' ? 'bv-bracket-tab is-active' : 'bv-bracket-tab'}
            onClick={() => setActiveTab('losers')}
          >
            Losers
          </button>
        </div>
      </div>

      <div className="bv-bracket-panel-body">
        {activeRounds.length > 0 ? (
          <div
            className="bv-bracket-scroll"
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div
              className="bv-bracket-stage"
              style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
            >
              <Bracket rounds={activeRounds} renderSeedComponent={renderSeedComponent} />
            </div>
          </div>
        ) : (
          <p className="bv-empty-bracket">{emptyMessage}</p>
        )}
      </div>
    </section>
  );
}
