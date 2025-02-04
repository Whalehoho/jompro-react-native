import apiClient from "./apiClient";


export const getMySubscribed = async (accountId) => {
    try {
        const response = await apiClient.get(`/subscription/getMySubscribed/${accountId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        throw error;
    }
}