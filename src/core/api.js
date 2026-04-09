
/**
 * Solicita datos a la API de start.gg utilizando una consulta GraphQL.
 * @param {string} apiToken - Token personal de acceso para autenticar la solicitud.
 * @param {string} query - Consulta GraphQL a enviar a la API.
 * @param {object} variables - Variables de la consulta GraphQL.
 * @returns {Promise<any>} - Promise que se resuelve con la respuesta de la API.
 */
export async function fetchStartGG(apiToken, query, variables = {}) {
    if (typeof apiToken !== 'string' || !apiToken.trim()) {
        throw new Error('Falta un token de API valido.');
    }

    if (typeof query !== 'string' || !query.trim()) {
        throw new Error('La consulta GraphQL es invalida.');
    }

    const response = await fetch('https://api.start.gg/gql/alpha', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken.trim()}`,
        },
        body: JSON.stringify({ query: query.trim(), variables }),
    });
    return response.json();

}