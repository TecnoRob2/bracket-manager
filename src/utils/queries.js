export const apiQueries = {
    // Consulta para obtener el usuario actual y sus torneos pendientes
    getUserAndTournaments: `
        query GetUserAndTournaments {
            currentUser {
                id
                player {
                    gamerTag
                }
                name
                tournaments(
                    query: {
                        perPage: 10
                        page: 1
                    }
                ) {
                    nodes {
                        id
                        name
                        numAttendees
                        slug
                        startAt
                        events(filter: { videogameId: 1386 }) {
                            id
                            name
                            phases {
                                id
                                name
                                bracketType
                            }      
                        }
                        admins {
                            id
                        }
                    }
                }
            }
        }
        `
};