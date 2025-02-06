import apiClient from "./apiClient";

export const getByEventId = async (eventId) => {
    try {
        const response = await apiClient.get(`/rsvp/getByEventId/${eventId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching RSVPs:', error);
        throw error;
    }
}