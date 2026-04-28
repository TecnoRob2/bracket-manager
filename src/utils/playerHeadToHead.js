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
          displayScore
          completedAt
          event {
            name
            tournament { name }
          }
          slots {
            entrant {
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
                if (res.data?.user) {
                    return {
                        playerId: res.data.user.player?.id,
                        userId: res.data.user.id,
                        tag: res.data.user.player?.gamerTag || "Unknown"
                    };
                }
            } else {
                const res = await fetchStartGG(apiToken, QUERY_GET_PLAYER_FROM_PARTICIPANT, { id: id });
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

        if (response.errors || !response.data?.player) {
            console.log("DEBUG: Error en la respuesta de sets:", JSON.stringify(response.errors));
            return [];
        }

        const sets = response.data.player.sets.nodes;
        console.log(`DEBUG: Analizando ${sets.length} sets...`);
        
        return sets.filter(set => {
            return set.slots.some(slot => 
                slot.entrant?.participants?.some(p => {
                    const match = (p2PlayerId && String(p.player?.id) === String(p2PlayerId)) || 
                                  (p2UserId && String(p.user?.id) === String(p2UserId));
                    if (match) console.log(`DEBUG: ¡Match encontrado en ${set.event.tournament.name}!`);
                    return match;
                })
            );
        }).map(set => ({
            fecha: new Date(set.completedAt * 1000).toLocaleDateString(),
            evento: set.event.tournament.name,
            nombreEvento: set.event.name,
            marcador: set.displayScore
        }));
    } catch (error) {
        console.error('Error en getHeadToHeadMatches:', error);
        return [];
    }
}