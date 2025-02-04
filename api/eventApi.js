import apiClient from './apiClient';

export const createEvent = async (event) => {
    try {
        const response = await apiClient.post('/event/createEvent', event, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error creating event:', error);
        throw error;
    }
};

export const getActiveEvents = async(organizerId) => { //exclude own events
    try {
        const response = await apiClient.get(`/event/getActiveEvents/${organizerId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
}
