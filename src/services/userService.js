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
    }
}