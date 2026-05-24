import { apiQueries } from "../core/queries"
import { fetchStartGG } from "../core/api"
import { parsePhasesSeeding, parseUser } from "../utils/parser";
import { tournamentStore } from "../store/tournamentStore";
import { userStore } from "../store/userStore";
import { handleError } from "../utils/handleError";
export const userService = {

    getUser: async function (apiToken) {
        try {
            const { setUser } = userStore.getState();
            const response = await fetchStartGG(apiToken, apiQueries.getUser);
            // console.log('Respuesta de fetchStartGG en userService:', response);
            if (response.error || !response.data) {
                return { error: handleError({ message: response.error?.message || 'Error desconocido', id: 'getUser' }) };
            }
        
            const userData = parseUser(response.data);
            console.log('Datos del usuario obtenidos:', userData);
            setUser(userData.user);
            return userData;
        } catch (error) {
            return { error: handleError({ message: error.message, id: 'getUser' }) };
        }
    },

    /**
     * Obtiene el seeding de una fase específica.
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
            return { error: handleError({error, id: 'getPhaseSeeding'}) };
        }
    },
}