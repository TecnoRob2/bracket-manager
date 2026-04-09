import { apiQueries } from "../utils/queries"
import { fetchStartGG } from "../core/api"
export const userService = {

    getUserAndTournaments: async function (apiToken) {
        try {
            const response = await fetchStartGG(apiToken, apiQueries.getUserAndTournaments);
            console.log('Respuesta de fetchStartGG en userService:', response);
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
     * @returns {Promise<PhaseApiResponse>}
     */
    getPhaseSeeding: async function (apiToken, phaseId) {
        try {
            const response = await fetchStartGG(apiToken, apiQueries.getPhaseSeeding, { phaseId });
            console.log('Respuesta de fetchStartGG en getPhaseSeeding:', response);
            if (response.errors || !response.data.phase) {
                throw new Error('No se pudo obtener la información de la fase. Verifica el ID de la fase y el token.');
            }
            return response.data;
        } catch (error) {
            console.error('Error al obtener el seeding de la fase:', error);
            return { error: error.message };
        }
    }
}