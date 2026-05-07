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

const QUERY_SETS_PAGE = `
  query GetPlayerSetsPage($p1Id: ID!, $page: Int!, $perPage: Int!, $filters: SetFilters) {
    player(id: $p1Id) {
      sets(perPage: $perPage, page: $page, filters: $filters) {
        pageInfo {
          total
          totalPages
          page
          perPage
        }
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

export async function getHeadToHeadMatches(apiToken, id1, id2, searchRange = 100) {
    try {
        let p1GlobalId = id1;
        let p2PlayerId = null;

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
            console.log(`DEBUG: Jugador 2 -> ${p2Info.tag} (PlayerID: ${p2PlayerId})`);
        }

        if (!p1GlobalId || !p2PlayerId) {
          console.log("DEBUG: No se pudo resolver el PlayerID de uno de los jugadores.");
          return [];
        }

        const perPage = 50;
        const sixMonthsAgo = Math.floor(Date.now() / 1000) - (60 * 60 * 24 * 30 * 6);

        const slotHasPlayer = (slot, playerId) =>
          slot.entrant?.participants?.some(p => (
            playerId && String(p.player?.id) === String(playerId)
          ));

        let page = 1;
        let matches = [];
        let pageInfo = null;

        while (true) {
          const response = await fetchStartGG(apiToken, QUERY_SETS_PAGE, {
            p1Id: p1GlobalId,
            page,
            perPage,
            filters: null
          });

          console.log(`DEBUG: respuesta sets page ${page} ->`, JSON.stringify(response, null, 2));

          if (response.errors || !response.data?.player?.sets) {
            console.log("DEBUG: Error en la respuesta de sets:", JSON.stringify(response.errors));
            return [];
          }

          const sets = response.data.player.sets.nodes || [];
          pageInfo = response.data.player.sets.pageInfo;
          console.log(`DEBUG: Analizando ${sets.length} sets (pagina ${page})...`);

          const pageMatches = sets.filter(set =>
            set.slots.some(slot => slotHasPlayer(slot, p2PlayerId))
          );

          if (pageMatches.length > 0) {
            console.log(`DEBUG: H2H encontrados en pagina ${page}: ${pageMatches.length}`);
          }

          matches = matches.concat(pageMatches);

          if (matches.length >= searchRange) {
            matches = matches.slice(0, searchRange);
            break;
          }

          const oldestCompletedAt = sets
            .map(set => set.completedAt)
            .filter(ts => typeof ts === "number")
            .reduce((min, ts) => (min === null || ts < min ? ts : min), null);

          if (oldestCompletedAt !== null && oldestCompletedAt < sixMonthsAgo) {
            break;
          }

          if (!pageInfo || page >= pageInfo.totalPages) {
            break;
          }

          page += 1;
        }
        
        return matches.map(set => {
          const slotA = set.slots.find(slot => slotHasPlayer(slot, p1GlobalId));
          const slotB = set.slots.find(slot => slotHasPlayer(slot, p2PlayerId));

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