export const apiQueries = {
    getUser: `
        query GetUser {
            currentUser {
                id
                player {
                    gamerTag
                }
                name
            }
        }
    `,

    // Consulta para obtener el usuario actual y sus torneos pendientes
    getTournaments: `
        query GetTournaments {
            currentUser {
                id
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
                        images(type: "profile"){
                          url
                        }
                        events(filter: { videogameId: 1386 }) {
                            id
                            name
                            phases {
                                id
                                name
                                bracketType
                            } 
                            state     
                        }
                        admins {
                            id
                        }
                    }
                }
            }
        }
        `,
    getPhaseSeeding:
    `
        query GetPhaseSeeding($phaseId: ID!) {
            phase(id: $phaseId) {
                bracketType
                numSeeds
                seeds(query: {
                    perPage: 64
                    page: 1
                }) { 
                    nodes {
                        id
                        seedNum
                        players {
                            id
                            gamerTag
                    }
                }
            }
        }
    }
    `,

    updatePhaseSeeding:
    `
        mutation UpdatePhaseSeeding ($phaseId: ID!, $seedMapping: [UpdatePhaseSeedInfo]!) {
            updatePhaseSeeding (phaseId: $phaseId, seedMapping: $seedMapping) {
                id
            }
        }
    `,
    getPlayerHistory:
    `
        query GetPlayerHistory($seedId: ID!, $count: Int!) {
            seed(id: $seedId) {
                players {
                    id
                    gamerTag
                    sets(perPage: $count, page: 1) {
                        nodes {
                            id
                            completedAt
                            fullRoundText
                            event {
                                name
                                tournament {
                                    name
                                }
                            }
                            slots {
                                entrant {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        }
    `
}