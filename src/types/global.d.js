// API Response Types

/**
 * @typedef {Object} PlayerDto
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
 * @typedef {Object} PhaseDto
 */

/**
 * @typedef {Object} EventDto
 * @property {number} id
 * @property {string} name
 * @property {PhaseDto[]} phases
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