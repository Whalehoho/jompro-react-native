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

export const getActiveEventsByOrganizerId = async(organizerId) => { //fetch own events
    try {
        const response = await apiClient.get(`/event/getActiveEventsByOrganizerId/${organizerId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
}

export const getEvent = async(eventId) => {
    try {
        const response = await apiClient.get(`/event/getById/${eventId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching event:', error);
        throw error;
    }
}

export const getActiveEventsByChannelId = async(channelId) => {
    try {
        const response = await apiClient.get(`/event/getActiveEventsByChannelId/${channelId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
}

export const getActiveByEventId = async(eventId) => {
    try {
        const response = await apiClient.get(`/event/getActiveByEventId/${eventId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching event:', error);
        throw error;
    }
}
