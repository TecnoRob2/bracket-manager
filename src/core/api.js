
/**
 * Solicita datos a la API de start.gg utilizando una consulta GraphQL.
 * @param {string} apiToken - Token personal de acceso para autenticar la solicitud.
 * @param {string} query - Consulta GraphQL a enviar a la API.
 * @param {object} variables - Variables de la consulta GraphQL.
 * @returns {Promise<any>} - Promise que se resuelve con la respuesta de la API.
 */
export async function fetchStartGG(apiToken, query, variables = {}) {
    if (typeof apiToken !== 'string' || !apiToken.trim()) {
        throw new Error('El token no es válido. Por favor proporciona un token de acceso válido.');
    }

    if (typeof query !== 'string' || !query.trim()) {
        throw new Error('Ha ocurrido un error con la consulta. Por favor, comunícate con el soporte.');
    }

    const response = await fetch('https://api.start.gg/gql/alpha', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken.trim()}`,
        },
        body: JSON.stringify({ query: query.trim(), variables }),
    });
    const json = await response.json();

    if (!response.ok) {
        console.error('Error en la respuesta de la API:', json);
        switch (response.status) {
            case 400:
                throw new Error('Invalid request');
            
            default:
                throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
    }

    return json;

}