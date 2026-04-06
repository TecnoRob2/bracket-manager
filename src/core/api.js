
/**
 * Solicita datos a la API de start.gg utilizando una consulta GraphQL.
 * @param {string} query - Consulta GraphQL a enviar a la API.
 * @returns {Promise<any>} - Promise que se resuelve con la respuesta de la API.
 */
export async function fetchStartGG(query, apiToken) {
    const response = await fetch('https://api.start.gg/gql/alpha', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ query }),
    });
    return response.json();

}