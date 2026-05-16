export const handleError = ({ message, id}) => {
    const fallback = 'Ocurrió un error inesperado. Por favor, intenta de nuevo más tarde.';
    console.error('Error detectado en handleError:', { message, id });
    if (!message) return fallback;

    switch (message) {
        case 'Invalid authentication token':
            return 'Token inválido. Por favor verifica tu token y vuelve a intentarlo.';
        
        case 'Invalid request':
            if (id === 'getUser') {
                return 'No se pudo obtener la información del usuario. Verifica tu token y vuelve a intentarlo.';
            }   
            return 'Solicitud inválida. Verifica los datos ingresados y vuelve a intentarlo.';

        default:
            console.error('Error desconocido:', response);
            return fallback;
    }
};
