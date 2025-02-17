import apiClient from "./apiClient";


export const getMySubscribed = async (userId) => {
    try {
        const response = await apiClient.get(`/subscription/getMySubscribed/${userId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        throw error;
    }
}

export const getSubscribedByChannelId = async (channelId) => {
    try {
        const response = await apiClient.get(`/subscription/getSubscribedByChannelId/${channelId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        throw error;
    }
}

export const getPendingbyChannelId = async (channelId) => {
    try {
        const response = await apiClient.get(`/subscription/getPendingbyChannelId/${channelId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        throw error;
    }
}

export const getSubscribedByChannelIdAndAccountId = async (subscriberId, channelId) => {
    try {
        const response = await apiClient.get(`/subscription/getSubscribed/${subscriberId}/${channelId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        throw error;
    }
}

export const subscribe = async (subscription)  => {
    try {
        const response = await apiClient.post('/subscription/createSubscription', subscription, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error subscribing:', error);
        throw error;
    }
}

export const unsubscribe = async (subscriptionId) => {
    try {
        const response = await apiClient.get(`/subscription/deleteSubscription/${subscriptionId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error unsubscribing:', error);
        throw error;
    }
}

export const decline = async (subscriptionId) => {
    try {
        const response = await apiClient.get(`/subscription/deleteSubscription/${subscriptionId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error unsubscribing:', error);
        throw error;
    }
}

export const approve = async (subscriptionId) => {
    try {
        const response = await apiClient.put(`/subscription/approveSubscription/${subscriptionId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error unsubscribing:', error);
        throw error;
    }
}

