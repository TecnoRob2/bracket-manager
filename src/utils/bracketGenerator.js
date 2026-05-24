// ---------------------------------------------------------------------------
// Bracket Generator
// Supports single-elimination and double-elimination bracket generation.
// Brackets are seeded using standard tournament seeding (1 vs N, etc.)
// and winners are predicted by lower seed number (better seed wins).
//
// Double Elimination LB pairing rules (matches start.gg behavior):
//
//  LB R1 (minor) — WB R1 losers only, no survivors yet:
//    Cross-pair: split in half, reverse second half, interleave.
//    Ensures opposite sides of the WB face each other.
//    e.g. losers [8,5,7,6] → pairs [8v6, 5v7]
//
//  LB major rounds — WB losers drop in against LB survivors:
//    Straight pair: wbLosers[i] faces lbSurvivors[i].
//    If WB losers outnumber LB survivors, extra WB losers get BYEs.
//    e.g. wbLosers [4,3], lbSurvivors [6,5] → pairs [4v6, 3v5]
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

    roundSeeds.push({
      id: `${roundIdPrefix}-m${i / 2 + 1}`,
      teams: [formatTeamSlot(teamA), formatTeamSlot(teamB)],
    });

    winners.push(winner);

    if (collectLosers) {
      // Only collect a loser when both slots are real (no BYE match)
      losers.push(teamA && teamB ? (winner === teamA ? teamB : teamA) : null);
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
 * Cross-pairs an array by splitting in half, reversing the second half,
 * then interleaving: [top[0], bot_rev[0], top[1], bot_rev[1], ...]
 *
 * Used only for LB R1 so opposite WB halves face each other.
 *
 * @param {Object[]} losers
 * @returns {Object[]}
 */
function crossPairForLbR1(losers) {
  const half = Math.floor(losers.length / 2);
  const top = losers.slice(0, half);
  const bottomReversed = [...losers.slice(half)].reverse();
  const result = [];

  for (let i = 0; i < Math.max(top.length, bottomReversed.length); i++) {
    if (top[i]) result.push(top[i]);
    if (bottomReversed[i]) result.push(bottomReversed[i]);
  }

  return result;
}

/**
 * Builds slots for an LB major round by pairing each WB loser at index i
 * with the LB survivor at index i (or null/BYE if there is no survivor there).
 *
 * This straight positional pairing is correct because both arrays share the
 * same bracket-tree positional index. When WB losers outnumber LB survivors
 * (e.g. 24-player bracket where BYEs created fewer LB R1 matches), the extra
 * WB losers automatically receive BYEs and advance.
 *
 * @param {Object[]} wbLosers
 * @param {Object[]} lbSurvivors
 * @returns {(Object|null)[]}
 */
function buildMajorRoundSlots(wbLosers, lbSurvivors) {
  const slots = [];

  for (let i = 0; i < wbLosers.length; i++) {
    slots.push(wbLosers[i]);
    slots.push(lbSurvivors[i] ?? null); // null = BYE when no survivor at this position
  }

  return slots;
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

    // Store only real losers (no BYE matches)
    wbLosersByRound.push(losers.filter(Boolean));
    currentWbParticipants = winners.filter(Boolean);
    wbRoundIndex += 1;
  }

  const winnerChampion = currentWbParticipants[0] ?? null;

  // --- Losers Bracket ---
  let lbSurvivors = [];
  let lbRoundIndex = 1;

  for (let i = 0; i < wbLosersByRound.length; i++) {
    const incomingWbLosers = wbLosersByRound[i];
    const isLastDrop = i === wbLosersByRound.length - 1;

    if (i === 0) {
      // LB R1 minor: WB R1 losers play among themselves, cross-paired so
      // opposite WB halves face each other (avoids rematches).
      if (incomingWbLosers.length >= 2) {
        const slots = crossPairForLbR1(incomingWbLosers);
        lbSurvivors = addRound(slots, `lb-r${lbRoundIndex}`, `Losers R${lbRoundIndex}`, loserRounds);
        lbRoundIndex += 1;
      } else {
        lbSurvivors = incomingWbLosers;
      }
      continue;
    }

    // LB major round: WB losers drop in and face LB survivors at the same
    // positional slot. Extra WB losers (no LB survivor at that slot) get BYEs.
    const majorSlots = buildMajorRoundSlots(incomingWbLosers, lbSurvivors);
    const majorWinners = addRound(
      majorSlots,
      `lb-r${lbRoundIndex}`,
      `Losers R${lbRoundIndex}`,
      loserRounds,
    );
    lbRoundIndex += 1;

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
    finalsRounds.push({
      title: 'Grand Final',
      seeds: [
        {
          id: 'gf-1',
          teams: [
            { name: winnerChampion?.name ?? 'TBD', seedId: winnerChampion?.seedId ?? null },
            { name: loserChampion?.name ?? 'TBD', seedId: loserChampion?.seedId ?? null },
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
