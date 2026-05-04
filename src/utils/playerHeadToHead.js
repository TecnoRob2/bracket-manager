import { fetchStartGG } from "../core/api.js";

const QUERY_GET_PLAYER_FROM_PARTICIPANT = `
  query GetPlayerFromParticipant($id: ID!) {
    participant(id: $id) {
      player {
        id
        gamerTag
      }
    }
  }
`;

const QUERY_GET_PLAYER_FROM_SEED = `
  query GetPlayerFromSeed($id: ID!) {
    seed(id: $id) {
      players {
        id
        gamerTag
        user { id }
      }
    }
  }
`;

const QUERY_GET_PLAYER_FROM_USER = `
  query GetPlayerFromUser($slug: String!) {
    user(slug: $slug) {
      id
      player {
        id
        gamerTag
      }
    }
  }
`;

const QUERY_H2H_REFINED = `
  query GetPlayerSets($id: ID!, $count: Int!) {
    player(id: $id) {
      sets(perPage: $count, page: 1) {
        nodes {
          id
          winnerId
          displayScore
          completedAt
          event {
            name
            tournament { name }
          }
          slots {
            entrant {
              id
              name
              participants {
                player { id }
                user { id }
              }
            }
          }
        }
      }
    }
  }
`;

export async function getHeadToHeadMatches(apiToken, id1, id2, searchRange = 50) {
    try {
        let p1GlobalId = id1;
        let p2PlayerId = null;
        let p2UserId = null;

        const resolveId = async (id) => {
            if (/[a-z]/i.test(String(id))) {
                const res = await fetchStartGG(apiToken, QUERY_GET_PLAYER_FROM_USER, { slug: String(id) });
                console.log('DEBUG: respuesta user ->', JSON.stringify(res, null, 2));
                if (res.data?.user) {
                    return {
                        playerId: res.data.user.player?.id,
                        userId: res.data.user.id,
                        tag: res.data.user.player?.gamerTag || "Unknown"
                    };
                }
            } else {
            const seedRes = await fetchStartGG(apiToken, QUERY_GET_PLAYER_FROM_SEED, { id });
            console.log('DEBUG: respuesta seed ->', JSON.stringify(seedRes, null, 2));
            const seedPlayer = seedRes.data?.seed?.players?.[0];
            if (seedPlayer) {
              return {
                playerId: seedPlayer.id,
                userId: seedPlayer.user?.id || null,
                tag: seedPlayer.gamerTag || "Unknown"
              };
            }

                const res = await fetchStartGG(apiToken, QUERY_GET_PLAYER_FROM_PARTICIPANT, { id: id });
                console.log('DEBUG: respuesta participant ->', JSON.stringify(res, null, 2));
                if (res.data?.participant?.player) {
                    return {
                        playerId: res.data.participant.player.id,
                        userId: null,
                        tag: res.data.participant.player.gamerTag
                    };
                }
            }
            return null;
        };

        const p1Info = await resolveId(id1);
        if (p1Info) {
            p1GlobalId = p1Info.playerId;
            console.log(`DEBUG: Jugador 1 -> ${p1Info.tag} (PlayerID: ${p1GlobalId})`);
        }

        const p2Info = await resolveId(id2);
        if (p2Info) {
            p2PlayerId = p2Info.playerId;
            p2UserId = p2Info.userId;
            console.log(`DEBUG: Jugador 2 -> ${p2Info.tag} (PlayerID: ${p2PlayerId}, UserID: ${p2UserId})`);
        }

        const response = await fetchStartGG(apiToken, QUERY_H2H_REFINED, {
            id: p1GlobalId,
            count: searchRange
        });

        console.log('DEBUG: respuesta H2H ->', JSON.stringify(response, null, 2));

        if (response.errors || !response.data?.player) {
          console.log("DEBUG: Error en la respuesta de sets:", JSON.stringify(response.errors));
            return [];
        }

        const sets = response.data.player.sets.nodes;
        console.log(`DEBUG: Analizando ${sets.length} sets...`);
        
        const slotHasPlayer = (slot, playerId, userId) =>
          slot.entrant?.participants?.some(p => (
            (playerId && String(p.player?.id) === String(playerId)) ||
            (userId && String(p.user?.id) === String(userId))
          ));

        return sets.filter(set => {
          const isSinglesSet = set.slots.every(
            slot => (slot.entrant?.participants?.length || 0) === 1
          );

          if (!isSinglesSet) return false;

          const hasP2 = set.slots.some(slot => slotHasPlayer(slot, p2PlayerId, p2UserId));
          if (hasP2) console.log(`DEBUG: Match singles encontrado en ${set.event.tournament.name}!`);
          return hasP2;
        }).map(set => {
          const slotA = set.slots.find(slot => slotHasPlayer(slot, p1GlobalId, null));
          const slotB = set.slots.find(slot => slotHasPlayer(slot, p2PlayerId, p2UserId));

          const sideAName = slotA?.entrant?.name || '---';
          const sideBName = slotB?.entrant?.name || '---';

          let winnerSide = null;
          if (set.winnerId) {
            if (slotA?.entrant?.id && String(set.winnerId) === String(slotA.entrant.id)) {
              winnerSide = 'A';
            } else if (slotB?.entrant?.id && String(set.winnerId) === String(slotB.entrant.id)) {
              winnerSide = 'B';
            }
          }

          return {
            id: set.id,
            fecha: new Date(set.completedAt * 1000).toLocaleDateString(),
            evento: set.event.tournament.name,
            nombreEvento: set.event.name,
            marcador: set.displayScore,
            sideAName,
            sideBName,
            winnerSide,
          };
        });
    } catch (error) {
        console.error('Error en getHeadToHeadMatches:', error);
        return [];
    }
}