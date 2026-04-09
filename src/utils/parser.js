/**
 * 
 * @param {UserApiResponse} fetchData 
 * @returns {User}
 */
export function parseUser(fetchData) {
    return {
        id: fetchData.currentUser.id,
        name: fetchData.currentUser.player.gamerTag,
    };
}

/**
 * Convierte un unix timestamp (segundos) a formato dd/mm/YYYY.
 * @param {number} unixSeconds
 * @returns {string}
 */
function formatUnixDate(unixSeconds) {
    const date = new Date(unixSeconds * 1000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

/**
 * Parsea la respuesta de la API para extraer los torneos asociados al usuario.
 * @param {UserApiResponse} fetchData 
 * @returns {EventTournament[]}
 */
export function parseTournaments(fetchData) {
    /** @type {EventTournament[]} */
    const tournamentList = [];
    const currentUserId = fetchData.currentUser.id;

    fetchData.currentUser.tournaments.nodes.forEach((tournament) => {
        // Si admins es null, consideramos que el usuario no es admin de ese torneo.
        const isAdmin = Array.isArray(tournament.admins)
            ? tournament.admins.some((admin) => admin.id === currentUserId)
            : false;

        if (isAdmin) {
            tournament.events.forEach((event) => {
                tournamentList.push({
                    id: event.id,
                    name: event.name,
                    tournamentName: tournament.name,
                    numAttendees: tournament.numAttendees,
                    startAt: formatUnixDate(tournament.startAt),
                    phases: event.phases.map(phase => ({
                        id: phase.id,
                        name: phase.name,
                        bracketType: phase.bracketType
                    }))
                });
            });
        }
    });

    return tournamentList;
}