import { apiQueries } from "../core/queries";
import { fetchStartGG } from "../core/api";
import { parsePhasesSeeding, parseTournaments } from "../utils/parser";
import { tournamentStore } from "../store/tournamentStore";
import { userStore } from "../store/userStore";
import { handleError } from "../utils/handleError";
export const tournamentService = {
    getTournaments: async function () {
        try {
            const { apiToken } = userStore.getState();
            const { setTournamentList } = tournamentStore.getState();
            if (!apiToken) {
                throw new Error('No se ha proporcionado un token de API válido.');
            }
            const response = await fetchStartGG(apiToken, apiQueries.getTournaments);
            if (response.error || !response.data) {
                throw new Error(response.error?.message || 'Error desconocido al obtener torneos');
            }
            const tournamentsData = parseTournaments(response.data);
            console.log('Respuesta de fetchStartGG en getTournaments:', tournamentsData);
            setTournamentList(tournamentsData); // Guarda los torneos en el store
            return tournamentsData; // Retorna solo los torneos
        } catch (error) {
            console.error('Error al obtener torneos:', error);
            return { error: error.message || 'Error desconocido al obtener torneos' };
        }
    },

    updateSeeding: async function (phaseId, seedMapping) {
        try {
            const { apiToken } = userStore.getState();
            if (!apiToken) {
                throw new Error('No se ha proporcionado un token de API válido.');
            }
            const response = await fetchStartGG(apiToken, apiQueries.updatePhaseSeeding, { phaseId, seedMapping });
            console.log('Respuesta de fetchStartGG en updatePhaseSeeding:', response);
            if (response.errors || !response.data.updatePhaseSeeding) {
                throw new Error(response.errors?.[0]?.message || 'Error desconocido al actualizar el seeding de la fase');
            }
            return { success: true };
        } catch (error) {
            console.error('Error al actualizar el seeding de la fase:', error);
            return { error: handleError({error, id: 'updatePhaseSeeding'}) };
        }
    }
};