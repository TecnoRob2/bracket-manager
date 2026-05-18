function buildSeedPositions(bracketSize) {
  if (bracketSize === 2) {
    return [1, 2];
  }

  const previous = buildSeedPositions(bracketSize / 2);
  return previous.flatMap((seed) => [seed, bracketSize + 1 - seed]);
}

function buildInitialSlots(phaseSeeds) {
  const seeds = Array.isArray(phaseSeeds) ? phaseSeeds : [];

  if (seeds.length < 2) {
    return [];
  }

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
    .map((participant, index) => ({
      ...participant,
      rank: index + 1,
    }));

  const bracketSize = 2 ** Math.ceil(Math.log2(rankedParticipants.length));
  const seedPositions = buildSeedPositions(bracketSize);
  const participantByRank = new Map(rankedParticipants.map((participant) => [participant.rank, participant]));

  return seedPositions.map((rank) => participantByRank.get(rank) || null);
}

function predictWinnerBySeed(teamA, teamB) {
  if (teamA && !teamB) return teamA;
  if (!teamA && teamB) return teamB;
  if (teamA && teamB) return teamA.seedNum <= teamB.seedNum ? teamA : teamB;
  return null;
}

function simulatePredictedRound(participants, roundIdPrefix, collectLosers = false) {
  const roundSeeds = [];
  const winners = [];
  const losers = [];

  for (let i = 0; i < participants.length; i += 2) {
    const teamA = participants[i];
    const teamB = participants[i + 1];
    const winner = predictWinnerBySeed(teamA, teamB);

    const teamALabel = teamA ? `${teamA.seedNum} | ${teamA.name}` : 'BYE';
    const teamBLabel = teamB ? `${teamB.seedNum} | ${teamB.name}` : 'BYE';

    roundSeeds.push({
      id: `${roundIdPrefix}-m${i / 2 + 1}`,
      teams: [
        { name: teamALabel, seedId: teamA?.seedId ?? null },
        { name: teamBLabel, seedId: teamB?.seedId ?? null },
      ],
    });

    if (winner) {
      winners.push(winner);
    }

    if (collectLosers && teamA && teamB) {
      losers.push(winner === teamA ? teamB : teamA);
    }
  }

  return { roundSeeds, winners, losers };
}

function buildSingleEliminationRounds(phaseSeeds) {
  let currentParticipants = buildInitialSlots(phaseSeeds);

  if (currentParticipants.length < 2) {
    return [];
  }

  const rounds = [];
  let roundIndex = 1;

  while (currentParticipants.length >= 2) {
    const { roundSeeds, winners } = simulatePredictedRound(currentParticipants, `wb-r${roundIndex}`);

    rounds.push({
      title: currentParticipants.length === 2 ? 'Final' : `Ronda ${roundIndex}`,
      seeds: roundSeeds,
    });

    currentParticipants = winners;
    roundIndex += 1;
  }

  return rounds;
}

function mergeLosersPools(lbWinners, wbLosers) {
  const merged = [];
  const maxLength = Math.max(lbWinners.length, wbLosers.length);

  for (let i = 0; i < maxLength; i += 1) {
    if (wbLosers[i]) merged.push(wbLosers[i]);
    if (lbWinners[i]) merged.push(lbWinners[i]);
  }

  return merged;
}

function buildDoubleEliminationData(phaseSeeds) {
  let currentWinnerParticipants = buildInitialSlots(phaseSeeds);

  const winnerRounds = [];
  const loserRounds = [];
  const finalsRounds = [];

  if (currentWinnerParticipants.length < 2) {
    return { winnerRounds, loserRounds, finalsRounds };
  }

  const wbLosersByRound = [];
  let winnerRoundIndex = 1;

  while (currentWinnerParticipants.length >= 2) {
    const { roundSeeds, winners, losers } = simulatePredictedRound(
      currentWinnerParticipants,
      `wb-r${winnerRoundIndex}`,
      true,
    );

    winnerRounds.push({
      title: currentWinnerParticipants.length === 2 ? 'Winners Final' : `Winners R${winnerRoundIndex}`,
      seeds: roundSeeds,
    });

    wbLosersByRound.push(losers);
    currentWinnerParticipants = winners;
    winnerRoundIndex += 1;
  }

  const winnerChampion = currentWinnerParticipants[0] || null;
  let loserRoundIndex = 1;
  let loserSurvivors;

  const initialLosers = wbLosersByRound[0] || [];
  if (initialLosers.length >= 2) {
    const firstLoserRound = simulatePredictedRound(initialLosers, `lb-r${loserRoundIndex}`);
    loserRounds.push({ title: `Losers R${loserRoundIndex}`, seeds: firstLoserRound.roundSeeds });
    loserSurvivors = firstLoserRound.winners;
    loserRoundIndex += 1;
  } else {
    loserSurvivors = initialLosers;
  }

  for (let i = 1; i < wbLosersByRound.length; i += 1) {
    const incomingWbLosers = wbLosersByRound[i] || [];
    const mergedParticipants = mergeLosersPools(loserSurvivors, incomingWbLosers);
    let nextLoserSurvivors;

    if (mergedParticipants.length < 2) {
      nextLoserSurvivors = mergedParticipants;
    } else {
      const majorRound = simulatePredictedRound(mergedParticipants, `lb-r${loserRoundIndex}`);
      loserRounds.push({ title: `Losers R${loserRoundIndex}`, seeds: majorRound.roundSeeds });
      loserRoundIndex += 1;

      const isLastMerge = i === wbLosersByRound.length - 1;
      if (isLastMerge || majorRound.winners.length < 2) {
        nextLoserSurvivors = majorRound.winners;
      } else {
        const minorRound = simulatePredictedRound(majorRound.winners, `lb-r${loserRoundIndex}`);
        loserRounds.push({ title: `Losers R${loserRoundIndex}`, seeds: minorRound.roundSeeds });
        loserRoundIndex += 1;
        nextLoserSurvivors = minorRound.winners;
      }
    }

    loserSurvivors = nextLoserSurvivors;
  }

  const loserChampion = loserSurvivors[0] || null;

  if (winnerChampion || loserChampion) {
    winnerRounds.push({
      title: 'Grand Final',
      seeds: [
        {
          id: 'gf-1',
          teams: [{ name: winnerChampion?.name || 'TBD' }, { name: loserChampion?.name || 'TBD' }],
        },
      ],
    });
  }

  return { winnerRounds, loserRounds, finalsRounds };
}

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
