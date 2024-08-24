import apiClient from './apiClient';

export const login = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials, { timeout: 10000 });
    // const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Error registering:', error);
    throw error;
  }
};
