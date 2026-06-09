// ---------------------------------------------------------------------------
// Bracket Generator
// Supports single-elimination and double-elimination bracket generation.
// Brackets are seeded using standard tournament seeding (1 vs N, etc.)
// and winners are predicted by lower seed number (better seed wins).
//
// General display rule:
//  Every generated set must show the lower seed number in the top slot.
//  Keep this as a display-only rule so internal bracket positions can still
//  drive losers bracket routing correctly.
//
// Double Elimination LB pairing rules (matches start.gg behavior):
//
//  LB R1 (minor) — WB R1 losers only, no survivors yet:
//    Keep the WB loser order and pair sequentially.
//    e.g. losers [8,5,7,6] → pairs [8v5, 7v6]
//
//  LB major rounds — WB losers drop in against LB survivors:
//    Pair by bracket position, but avoid immediate/known rematches where a
//    different positional assignment is available (matches start.gg behavior).
//    If WB losers outnumber LB survivors, extra WB losers get BYEs.
//    e.g. wbLosers [4,3], lbSurvivors [5,6] → pairs [3v5, 4v6]
//
//  LB minor rounds — LB major winners play each other:
//    Sequential pairing of major round winners.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Seed positioning
// ---------------------------------------------------------------------------

/**
 * Recursively builds ordered seed positions for a power-of-2 bracket.
 * Ensures top seeds are placed on opposite sides of the bracket.
 *
 * @param {number} bracketSize - Must be a power of 2.
 * @returns {number[]}
 */
function buildSeedPositions(bracketSize) {
  if (bracketSize === 2) return [1, 2];

  const previous = buildSeedPositions(bracketSize / 2);
  return previous.flatMap((seed) => [seed, bracketSize + 1 - seed]);
}

// ---------------------------------------------------------------------------
// Participant setup
// ---------------------------------------------------------------------------

/**
 * Parses raw phase seeds into normalized participant objects,
 * ranks them by seed number, and places them into bracket slots.
 * Slots without a participant are filled with null (BYE).
 *
 * @param {Array} phaseSeeds - Raw seed data from the API.
 * @returns {(Object|null)[]}
 */
function buildInitialSlots(phaseSeeds) {
  const seeds = Array.isArray(phaseSeeds) ? phaseSeeds : [];
  if (seeds.length < 2) return [];

  const participants = seeds.map((seed, index) => {
    const parsedSeed = Number(seed?.seedNum);
    return {
      name: seed?.gamerTag || 'TBD',
      seedNum: Number.isFinite(parsedSeed) ? parsedSeed : index + 1,
      seedId: seed?.seedId ?? null,
    };
  });

  const rankedParticipants = [...participants]
    .sort((a, b) => a.seedNum - b.seedNum)
    .map((participant, index) => ({ ...participant, rank: index + 1 }));

  const bracketSize = 2 ** Math.ceil(Math.log2(rankedParticipants.length));
  const seedPositions = buildSeedPositions(bracketSize);
  const participantByRank = new Map(
    rankedParticipants.map((participant) => [participant.rank, participant]),
  );

  return seedPositions.map((rank) => participantByRank.get(rank) ?? null);
}

// ---------------------------------------------------------------------------
// Match simulation
// ---------------------------------------------------------------------------

/**
 * Predicts the winner of a matchup by seed number.
 * A BYE (null) always loses to any real participant.
 *
 * @param {Object|null} teamA
 * @param {Object|null} teamB
 * @returns {Object|null}
 */
function predictWinner(teamA, teamB) {
  if (teamA && !teamB) return teamA;
  if (!teamA && teamB) return teamB;
  if (teamA && teamB) return teamA.seedNum <= teamB.seedNum ? teamA : teamB;
  return null;
}

/**
 * Carries first-loss history through the simulated lower bracket so later
 * LB major rounds can avoid pairing a player into a same-bracket rematch.
 *
 * @param {Object|null} loser
 * @param {Object|null} winner
 * @returns {Object|null}
 */
function markLossTo(loser, winner) {
  if (!loser || !winner) return loser;

  return {
    ...loser,
    lostToSeedNums: [...(loser.lostToSeedNums ?? []), winner.seedNum],
  };
}

/**
 * Orders a set for display. Internal bracket slot order must stay untouched,
 * but visually the better seed is always shown on top.
 *
 * @param {Object|null} teamA
 * @param {Object|null} teamB
 * @returns {[Object|null, Object|null]}
 */
function orderSetForDisplay(teamA, teamB) {
  if (teamA && !teamB) return [teamA, teamB];
  if (!teamA && teamB) return [teamB, teamA];
  if (teamA && teamB && teamB.seedNum < teamA.seedNum) return [teamB, teamA];
  return [teamA, teamB];
}

/**
 * Formats a participant for display inside a bracket slot.
 *
 * @param {Object|null} participant
 * @returns {{ name: string, seedId: string|null }}
 */
function formatTeamSlot(participant) {
  return {
    name: participant ? `${participant.seedNum} | ${participant.name}` : 'BYE',
    seedId: participant?.seedId ?? null,
  };
}

/**
 * Simulates all matchups for a single round and returns structured data.
 * Accepts null entries as BYEs — the real participant always advances.
 *
 * @param {(Object|null)[]} slots - Paired slots (even length).
 * @param {string} roundIdPrefix
 * @param {boolean} collectLosers
 * @returns {{ roundSeeds: Object[], winners: (Object|null)[], losers: (Object|null)[] }}
 */
function simulateRound(slots, roundIdPrefix, collectLosers = false) {
  const roundSeeds = [];
  const winners = [];
  const losers = [];

  for (let i = 0; i < slots.length; i += 2) {
    const teamA = slots[i] ?? null;
    const teamB = slots[i + 1] ?? null;
    const winner = predictWinner(teamA, teamB);
    const [displayTeamA, displayTeamB] = orderSetForDisplay(teamA, teamB);

    roundSeeds.push({
      id: `${roundIdPrefix}-m${i / 2 + 1}`,
      teams: [formatTeamSlot(displayTeamA), formatTeamSlot(displayTeamB)],
    });

    winners.push(winner);

    if (collectLosers) {
      // Only collect a loser when both slots are real (no BYE match)
      const loser = teamA && teamB ? (winner === teamA ? teamB : teamA) : null;
      losers.push(markLossTo(loser, winner));
    }
  }

  return { roundSeeds, winners, losers };
}

/**
 * Simulates a round, pushes it into a rounds array, and returns the real winners.
 *
 * @param {(Object|null)[]} slots
 * @param {string} idPrefix
 * @param {string} title
 * @param {Object[]} roundsArray - Mutated in place.
 * @returns {Object[]} Non-null winners.
 */
function addRound(slots, idPrefix, title, roundsArray) {
  const { roundSeeds, winners } = simulateRound(slots, idPrefix);
  roundsArray.push({ title, seeds: roundSeeds });
  return winners.filter(Boolean);
}

// ---------------------------------------------------------------------------
// Double elimination — LB slot builders
// ---------------------------------------------------------------------------

/**
 * Builds the opening LB lanes from WB R1 loser positions. Complete lanes are
 * rendered as LB R1 sets; single-player lanes advance silently as BYEs.
 *
 * @param {(Object|null)[]} losers
 * @returns {{ slots: Object[], laneEntries: Object[] }}
 */
function buildOpeningLbRound(losers) {
  const slots = [];
  const laneEntries = [];

  for (let i = 0; i < losers.length; i += 2) {
    const teamA = losers[i] ?? null;
    const teamB = losers[i + 1] ?? null;

    if (teamA && teamB) {
      slots.push(teamA, teamB);
      laneEntries.push({ type: 'match' });
      continue;
    }

    if (teamA || teamB) {
      laneEntries.push({ type: 'bye', participant: teamA ?? teamB });
    }
  }

  return { slots, laneEntries };
}

/**
 * Merges played LB R1 winners back into the full opening lane order.
 *
 * @param {Object[]} laneEntries
 * @param {Object[]} matchWinners
 * @returns {Object[]}
 */
function buildOpeningLbSurvivors(laneEntries, matchWinners) {
  let winnerIndex = 0;

  return laneEntries
    .map((entry) => {
      if (entry.type === 'match') {
        const winner = matchWinners[winnerIndex] ?? null;
        winnerIndex += 1;
        return winner;
      }

      return entry.participant ?? null;
    })
    .filter(Boolean);
}

/**
 * Builds slots for an LB major round by pairing incoming WB losers with LB
 * survivors while avoiding rematches against the winner who originally sent
 * the survivor to the lower bracket.
 *
 * The first preference is still positional: candidate WB losers closest to
 * the survivor index are tried first. If a no-rematch assignment exists, it is
 * used; otherwise the function falls back to straight positional pairing.
 *
 * @param {Object[]} wbLosers
 * @param {Object[]} lbSurvivors
 * @param {{ usePartialDropPattern?: boolean }} options
 * @returns {(Object|null)[]}
 */
function buildMajorRoundSlots(wbLosers, lbSurvivors, options = {}) {
  if (lbSurvivors.length === 0) {
    return wbLosers.flatMap((loser) => [loser, null]);
  }

  if (options.usePartialDropPattern || lbSurvivors.length < wbLosers.length) {
    return buildPartialMajorRoundSlots(wbLosers, lbSurvivors);
  }

  const assignedWbIndexes = findNoRematchMajorAssignment(wbLosers, lbSurvivors);
  const slots = [];

  for (let i = 0; i < lbSurvivors.length; i++) {
    const wbLoserIndex = assignedWbIndexes[i] ?? i;
    slots.push(wbLosers[wbLoserIndex] ?? null);
    slots.push(lbSurvivors[i]);
  }

  for (let i = 0; i < wbLosers.length; i++) {
    if (!assignedWbIndexes.includes(i)) {
      slots.push(wbLosers[i]);
      slots.push(null);
    }
  }

  return slots;
}

/**
 * Handles incomplete opening WB rounds. The first WB R1 losers are held until
 * the next drop and inserted into the reversed WB R2 loser order:
 *   WB R2 losers [8,5,7,6] -> carrier order [6,7,5,8]
 *   WB R1 losers [9,10]    -> [6v9, 7vBYE, 5v10, 8vBYE]
 *
 * @param {Object[]} wbLosers
 * @param {Object[]} lbSurvivors
 * @returns {(Object|null)[]}
 */
function buildPartialMajorRoundSlots(wbLosers, lbSurvivors) {
  const carrierLosers = [...wbLosers].reverse();
  const injectedLosers = [...lbSurvivors].sort((a, b) => a.seedNum - b.seedNum);
  const placementIndexes = buildAlternatingPlacementIndexes(carrierLosers.length);
  const slotPairs = carrierLosers.map((loser) => [loser, null]);

  for (let i = 0; i < injectedLosers.length; i++) {
    const targetIndex = placementIndexes[i] ?? i;
    if (slotPairs[targetIndex]) {
      slotPairs[targetIndex] = targetIndex === 0 || targetIndex % 2 === 1
        ? [slotPairs[targetIndex][0], injectedLosers[i]]
        : [injectedLosers[i], slotPairs[targetIndex][0]];
    }
  }

  return slotPairs.flat();
}

/**
 * Places injected players into alternating lanes recursively so future minor rounds 
 * keep the expected pair order across any bracket size.
 *
 * @param {number} length
 * @returns {number[]}
 */
function buildAlternatingPlacementIndexes(length) {
  if (length <= 1) return [0];
  if (length === 2) return [0, 1];

  const half = buildAlternatingPlacementIndexes(length / 2);
  const left = half.map((x) => x * 2);
  const right = [...left].map((x) => x + 1).reverse();

  return [...left, ...right];
}

/**
 * Finds a survivor-indexed assignment of WB losers that avoids rematches.
 *
 * @param {Object[]} wbLosers
 * @param {Object[]} lbSurvivors
 * @returns {number[]}
 */
function findNoRematchMajorAssignment(wbLosers, lbSurvivors) {
  const assignment = Array(lbSurvivors.length).fill(null);
  const usedWbIndexes = new Set();

  const canPair = (wbLoser, lbSurvivor) => {
    const lostToSeedNums = lbSurvivor?.lostToSeedNums ?? [];
    return !lostToSeedNums.includes(wbLoser?.seedNum);
  };

  const solve = (survivorIndex) => {
    if (survivorIndex >= lbSurvivors.length) return true;

    const candidates = wbLosers
      .map((wbLoser, index) => ({ wbLoser, index }))
      .filter(({ index }) => !usedWbIndexes.has(index))
      .filter(({ wbLoser }) => canPair(wbLoser, lbSurvivors[survivorIndex]))
      .sort((a, b) => (
        Math.abs(a.index - survivorIndex) - Math.abs(b.index - survivorIndex)
      ));

    for (const candidate of candidates) {
      assignment[survivorIndex] = candidate.index;
      usedWbIndexes.add(candidate.index);

      if (solve(survivorIndex + 1)) return true;

      usedWbIndexes.delete(candidate.index);
      assignment[survivorIndex] = null;
    }

    return false;
  };

  return solve(0)
    ? assignment
    : lbSurvivors.map((_, index) => index).filter((index) => index < wbLosers.length);
}

// ---------------------------------------------------------------------------
// Single elimination
// ---------------------------------------------------------------------------

/**
 * Builds all rounds for a single-elimination bracket.
 *
 * @param {Array} phaseSeeds
 * @returns {{ title: string, seeds: Object[] }[]}
 */
function buildSingleEliminationRounds(phaseSeeds) {
  let currentParticipants = buildInitialSlots(phaseSeeds);
  if (currentParticipants.length < 2) return [];

  const rounds = [];
  let roundIndex = 1;

  while (currentParticipants.length >= 2) {
    const isFinal = currentParticipants.length === 2;
    const { roundSeeds, winners } = simulateRound(currentParticipants, `wb-r${roundIndex}`);

    rounds.push({
      title: isFinal ? 'Final' : `Ronda ${roundIndex}`,
      seeds: roundSeeds,
    });

    currentParticipants = winners.filter(Boolean);
    roundIndex += 1;
  }

  return rounds;
}

// ---------------------------------------------------------------------------
// Double elimination
// ---------------------------------------------------------------------------

/**
 * Builds all rounds for a double-elimination bracket.
 *
 * @param {Array} phaseSeeds
 * @returns {{ winnerRounds: Object[], loserRounds: Object[], finalsRounds: Object[] }}
 */
function buildDoubleEliminationData(phaseSeeds) {
  let currentWbParticipants = buildInitialSlots(phaseSeeds);

  const winnerRounds = [];
  const loserRounds = [];
  const finalsRounds = [];

  if (currentWbParticipants.length < 2) {
    return { winnerRounds, loserRounds, finalsRounds };
  }

  // --- Winners Bracket ---
  const wbLosersByRound = [];
  let wbRoundIndex = 1;

  while (currentWbParticipants.length >= 2) {
    const isFinal = currentWbParticipants.length === 2;
    const { roundSeeds, winners, losers } = simulateRound(
      currentWbParticipants,
      `wb-r${wbRoundIndex}`,
      true,
    );

    winnerRounds.push({
      title: isFinal ? 'Winners Final' : `Winners R${wbRoundIndex}`,
      seeds: roundSeeds,
    });

    wbLosersByRound.push(losers);
    currentWbParticipants = winners.filter(Boolean);
    wbRoundIndex += 1;
  }

  const winnerChampion = currentWbParticipants[0] ?? null;

  // --- Losers Bracket ---
  let lbSurvivors = [];
  let lbRoundIndex = 1;
  let usePartialDropPattern = false;

  for (let i = 0; i < wbLosersByRound.length; i++) {
    const incomingWbLosers = wbLosersByRound[i].filter(Boolean);
    const isLastDrop = i === wbLosersByRound.length - 1;

    if (i === 0) {
      // LB R1 minor: WB R1 losers play among themselves in positional order.
      const nextWbLosers = wbLosersByRound[i + 1] ?? [];
      const shouldWaitForNextDrop = (
        incomingWbLosers.length > 0
        && incomingWbLosers.length <= nextWbLosers.length
      );

      if (shouldWaitForNextDrop) {
        lbSurvivors = incomingWbLosers;
        usePartialDropPattern = true;
      } else {
        const { slots, laneEntries } = buildOpeningLbRound(wbLosersByRound[i]);

        if (slots.length > 0) {
          const matchWinners = addRound(
            slots,
            `lb-r${lbRoundIndex}`,
            `Losers R${lbRoundIndex}`,
            loserRounds,
          );

          lbSurvivors = buildOpeningLbSurvivors(laneEntries, matchWinners);
          lbRoundIndex += 1;
        } else {
          lbSurvivors = buildOpeningLbSurvivors(laneEntries, []);
        }
      }
      continue;
    }

    // LB major round: WB losers drop in and face LB survivors at the same
    // positional slot. Extra WB losers (no LB survivor at that slot) get BYEs.
    const majorSlots = buildMajorRoundSlots(
      incomingWbLosers,
      lbSurvivors,
      { usePartialDropPattern },
    );
    const majorWinners = addRound(
      majorSlots,
      `lb-r${lbRoundIndex}`,
      `Losers R${lbRoundIndex}`,
      loserRounds,
    );
    lbRoundIndex += 1;
    usePartialDropPattern = false;

    // LB minor round: major winners play each other sequentially.
    // Skipped on the last WB drop — that winner goes straight to Grand Final.
    if (!isLastDrop && majorWinners.length >= 2) {
      lbSurvivors = addRound(
        majorWinners,
        `lb-r${lbRoundIndex}`,
        `Losers R${lbRoundIndex}`,
        loserRounds,
      );
      lbRoundIndex += 1;
    } else {
      lbSurvivors = majorWinners;
    }
  }

  const loserChampion = lbSurvivors[0] ?? null;

  // --- Grand Final ---
  if (winnerChampion || loserChampion) {
    const [displayWinnerChampion, displayLoserChampion] = orderSetForDisplay(
      winnerChampion,
      loserChampion,
    );

    finalsRounds.push({
      title: 'Grand Final',
      seeds: [
        {
          id: 'gf-1',
          teams: [
            formatTeamSlot(displayWinnerChampion),
            formatTeamSlot(displayLoserChampion),
          ],
        },
      ],
    });
  }

  return { winnerRounds, loserRounds, finalsRounds };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Entry point. Builds bracket data for either single or double elimination.
 *
 * @param {Array} phaseSeeds - Raw seed objects from the API.
 * @param {boolean} isDoubleElimination
 * @returns {{ winnerRounds: Object[], loserRounds: Object[], finalsRounds: Object[] }}
 */
export function buildBracketData(phaseSeeds, isDoubleElimination) {
  if (isDoubleElimination) {
    return buildDoubleEliminationData(phaseSeeds);
  }

  return {
    winnerRounds: buildSingleEliminationRounds(phaseSeeds),
    loserRounds: [],
    finalsRounds: [],
  };
}
