import apiClient from "./apiClient";

export const createChannel = async (channelData) => {
    try {
        const response = await apiClient.post('/channel/createChannel', channelData, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error creating channel:', error);
        throw error;
    }
};

export const getChannelByChannelId = async (channelId) => {
    try {
        const response = await apiClient.get(`/channel/getByChannelId/${channelId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching channel:', error);
        throw error;
    }
}

export const getChannelsByOwnerId = async (ownerId) => {
    try {
        const response = await apiClient.get(`/channel/getByOwnerId/${ownerId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching channels:', error);
        throw error;
    }
}