import apiClient from './apiClient';

export const updateEvent = async (eventData) => {
    try {
        const response = await apiClient.put('/event/updateEvent', eventData, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
};

export const updateSession = async (sessionData) => {
    try {
        const response = await apiClient.put('/event/updateSession', sessionData, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error updating session:', error);
        throw error;
    }
}

export const getMyEvents = async (accountId) => {
    try {
        const response = await apiClient.get(`/event/getByHostOrCoHostId/${accountId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
}