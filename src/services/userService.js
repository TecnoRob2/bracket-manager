import { apiQueries } from "../utils/queries"
import { fetchStartGG } from "../core/api"
import { parsePhasesSeeding } from "../utils/parser";
import { tournamentStore } from "../store/tournamentStore";
export const userService = {

    getUserAndTournaments: async function (apiToken) {
        try {
            const response = await fetchStartGG(apiToken, apiQueries.getUserAndTournaments);
            //console.log('Respuesta de fetchStartGG en userService:', response);
            if (response.errors || !response.data.currentUser) {
                throw new Error('El token es inválido o no tiene permisos.');
            }
            return response.data;   
        } catch (error) {
            console.error('Error al obtener usuario y torneos:', error);
            return { error: error.message };
        }
    },

    /**
     * 
     * @param {string} apiToken
     * @param {number} phaseId
     * @returns {Promise<{phase: Phase} | {error: string}>}
     */
    getPhaseSeeding: async function (apiToken, phaseId) {
        try {
            const currentPhases = tournamentStore.getState().phases;
            const setPhases = tournamentStore.getState().setPhases;
            if (currentPhases.length > 0 && currentPhases[0]?.id === phaseId) {
                return { phase: currentPhases[0] }; // Retorna la fase ya cargada en el store
            }
            // console.log('No se encontró la fase en el store, realizando fetch a la API para obtener el seeding de la fase con ID:', phaseId, currentPhases[0]?.id);
            const response = await fetchStartGG(apiToken, apiQueries.getPhaseSeeding, { phaseId });
            // console.log('Respuesta de fetchStartGG en getPhaseSeeding:', response);
            if (response.errors || !response.data.phase) {
                throw new Error('No se pudo obtener la información de la fase. Verifica el ID de la fase y el token.');
            }

            const phases = [parsePhasesSeeding(response.data, phaseId)];
            setPhases(phases); // Guarda la fase parseada en el store para futuros accesos

            return { phase: phases[0] }; // Retorna la fase parseada
        } catch (error) {
            console.error('Error al obtener el seeding de la fase:', error);
            return { error: error.message };
        }
    },

    updatePhaseSeeding: async function(apiToken, phaseId, seedMapping) {
        try {
            const response = await fetchStartGG(apiToken, apiQueries.updatePhaseSeeding, { phaseId, seedMapping });
            console.log('Respuesta de fetchStartGG en updatePhaseSeeding:', response);
            if (response.errors || !response.data.updatePhaseSeeding) {
                throw new Error('No se pudo actualizar el seeding de la fase. Verifica los datos enviados y el token.');
            }
            return { success: true };
        } catch (error) {
            console.error('Error al actualizar el seeding de la fase:', error);
            return { error: error.message };
        }
    }
}