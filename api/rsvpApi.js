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

export const getApprovedByEventId = async (eventId) => {
    try {
        const response = await apiClient.get(`/rsvp/getApprovedByEventId/${eventId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching RSVPs:', error);
        throw error;
    }
}

export const getPendingByEventId = async (eventId) => {
    try {
        const response = await apiClient.get(`/rsvp/getPendingByEventId/${eventId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching RSVPs:', error);
        throw error;
    }
}

export const getByEventIdAndAccountId = async (eventId, accountId) => {
    try {
        const response = await apiClient.get(`/rsvp/getByEventIdAndAccountId/${eventId}/${accountId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching RSVP:', error);
        throw error;
    }
}

export const createRsvp = async (rsvpData) => {
    try {
        const response = await apiClient.post(`/rsvp/create`, rsvpData, { timeout: 10000 });
        console.log('response', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating RSVP:', error);
        throw error;
    }
}

export const approveRsvp = async (rsvpId) => {
    try {
        const response = await apiClient.put(`/rsvp/approve/${rsvpId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error approving RSVP:', error);
        throw error;
    }
}

export const deleteRsvp = async (rsvpId) => {
    try {
        const response = await apiClient.get(`/rsvp/delete/${rsvpId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error deleting RSVP:', error);
        throw error;
    }
}