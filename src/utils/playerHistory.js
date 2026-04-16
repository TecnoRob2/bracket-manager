import { fetchStartGG } from "../core/api.js";
import { apiQueries } from "./queries.js";

/**
Obtiene el historial de las últimas 30 partidas para una lista de jugadores.
@param {string} apiToken - Token de API de Start.gg.
@param {Array} playersList - Lista de jugadores en el formato especificado.
@returns {Promise<Object>} - JSON con el historial de cada jugador.
*/
export async function getPlayersMatchHistory(apiToken, playersList) {
    const historyResults = {};

    // Procesamos cada jugador de la lista
    for (const player of playersList) {
        try {
            // Usamos el id proporcionado (asumiendo que es el seedId de Start.gg)
            const response = await fetchStartGG(apiToken, apiQueries.getPlayerHistory, { seedId: player.id });
            
            if (response.errors) {
                console.error(`Error obteniendo historial para ${player.entrant.name}:`, response.errors);
                historyResults[player.entrant.name] = { error: 'Error al obtener datos de la API' };
                continue;
            }

            const playerData = response.data.seed?.players?.[0];
            if (!playerData) {
                historyResults[player.entrant.name] = { error: 'No se encontró información del jugador' };
                continue;
            }

            // Mapeamos las partidas (sets) al formato solicitado
            const sets = playerData.sets.nodes.map(set => {
                // Filtramos para obtener los nombres de los oponentes
                const opponents = set.slots
                    .map(slot => slot.entrant?.name)
                    .filter(name => name && name !== player.entrant.name);

                return {
                    id: set.id,
                    fecha: formatUnixDate(set.completedAt),
                    antiguedad: calcularAntiguedad(set.completedAt),
                    evento: `${set.event.tournament.name} - ${set.event.name}`,
                    rivales: opponents.length > 0 ? opponents.join(', ') : 'TBD/Desconocido',
                    ronda: set.fullRoundText
                };
            });

            historyResults[player.entrant.name] = {
                gamerTag: playerData.gamerTag,
                seedNum: player.seedNum,
                totalPartidasEncontradas: sets.length,
                historial: sets
            };

        } catch (error) {
            console.error(`Excepción obteniendo historial para ${player.entrant.name}:`, error);
            historyResults[player.entrant.name] = { error: error.message };
        }
    }

    return historyResults;
}

/**
 * Calcula la antigüedad de una fecha en formato legible.
 * @param {number} unixTimestamp 
 * @returns {string}
 */
function calcularAntiguedad(unixTimestamp) {
    if (!unixTimestamp) return 'N/A';
    const now = Math.floor(Date.now() / 1000);
    const diff = now - unixTimestamp;

    if (diff < 60) return 'Hace menos de un minuto';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} minutos`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`;
    if (diff < 2592000) return `Hace ${Math.floor(diff / 86400)} días`;
    if (diff < 31536000) return `Hace ${Math.floor(diff / 2592000)} meses`;
    return `Hace ${Math.floor(diff / 31536000)} años`;
}

/**
 * Formatea un timestamp Unix a dd/mm/yyyy.
 * @param {number} unixSeconds 
 * @returns {string}
 */
function formatUnixDate(unixSeconds) {
    if (!unixSeconds) return 'Fecha desconocida';
    const date = new Date(unixSeconds * 1000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}