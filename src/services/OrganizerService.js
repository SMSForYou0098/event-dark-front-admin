import api from 'auth/FetchInterceptor';

const OrganizerService = {};

/**
 * Fetch organizer summary data
 * @param {string|number} userId - The organizer user ID
 * @param {string|number} eventId - Event ID to filter by specific event (required)
 * @returns {Promise} API response with organizer summary data
 */
OrganizerService.getOrganizerSummary = function (userId, eventId) {
    if (!eventId) {
        console.warn('Event ID is required for organizer summary');
        return Promise.resolve(null);
    }

    return api.get(`organizer/summary/${userId}/${eventId}`)
        .then(res => {
            // Handle nested data structure: response.data.data or response.data
            const data = res?.data?.data || res?.data || res;
            return data;
        })
        .catch(() => null);
};

/**
 * Fetch dashboard organizer tickets
 * @param {string|number} userId - The organizer user ID (required)
 * @param {string|number} eventId - Event ID to filter by specific event (required)
 * @returns {Promise} API response with organizer tickets data
 */
OrganizerService.getDashboardOrgTickets = function (userId, eventId) {
    if (!eventId) {
        console.warn('Event ID is required for organizer tickets');
        return Promise.resolve(null);
    }

    return api.get(`getDashboardOrgTicket/${userId}/${eventId}`)
        .then(res => {
            // Handle nested data structure: response.data.data or response.data
            const data = res?.data?.data || res?.data || res;
            return data;
        })
        .catch(() => null);
};

/**
 * Fetch complete organizer report data (summary + tickets)
 * @param {string|number} userId - The organizer user ID
 * @param {string|number} eventId - Event ID to filter by specific event (required)
 * @returns {Promise} Combined API response with both summary and tickets
 */
OrganizerService.getOrganizerReport = async function (userId, eventId) {
    const [organizerSummary, organizerTickets] = await Promise.all([
        OrganizerService.getOrganizerSummary(userId, eventId),
        // OrganizerService.getDashboardOrgTickets(userId, eventId)
    ]);

    return {
        organizerSummary,
        // organizerTickets
    };
};

export default OrganizerService;
