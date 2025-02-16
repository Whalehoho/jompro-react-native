import apiClient from "./apiClient";

export const searchQuery = async (query) => {   
    try {
        const response = await apiClient.get(`/query/search/${query}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching search results:', error);
        throw error;
    }
}