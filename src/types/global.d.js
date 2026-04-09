// API Response Types

/**
 * @typedef {Object} PlayerDto
 * @property {number} id
 * @property {string} gamerTag
 */

/**
 * @typedef {Object} AdminDto
 * @property {number} id
 */

/**
 * @typedef {Object} CurrentUserDto
 * @property {number} id
 * @property {PlayerDto} player
 * @property {TournamentsDto} tournaments
 */

/**
 * @typedef {Object} EventDto
 * @property {number} id
 * @property {string} name
 * @property {PhaseDto[]} phases
 */

/**
 * @typedef {Object} PhaseDto
 * @property {number} id
 * @property {string} name
 * @property {string} bracketType
 */

/**
 * @typedef {Object} TournamentDto
 * @property {number} id
 * @property {string} name
 * @property {number} numAttendees
 * @property {string} slug
 * @property {number} startAt
 * @property {EventDto[]} events
 * @property {AdminDto[] | null} admins
 */

/**
 * @typedef {Object} TournamentsDto
 * @property {TournamentDto[]} nodes
 */


/**
 * @typedef {Object} UserApiResponse
 * @property {CurrentUserDto} currentUser
 */

/**
 * @typedef {Object} SeedDto
 * @property {number} id
 * @property {string} seedNum
 * @property {PlayerDto[]} players
 */

/**
 * @typedef {Object} SeedsDto
 * @property {SeedDto[]} nodes
 */

/**
 * @typedef {Object} PhaseApiResponse
 * @property {number} id
 * @property {string} bracketType
 * @property {number} numSeeds
 * @property {SeedsDto} seeds
 */

// Our App Types

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} name
 */

/**
 * @typedef {Object} EventTournament
 * @property {number} id
 * @property {string} name
 * @property {string} tournamentName
 * @property {number} numAttendees
 * @property {string} startAt
 */

/**
 * @typedef {Object} PlayerSeed
 * @property {number} seedId
 * @property {string} seedNum
 * @property {string} gamerTag
 */

/**
 * @typedef {Object} Phase
 * @property {number} id
 * @property {string} name
 * @property {string} bracketType
 * @property {PlayerSeed[]} seeds
 */