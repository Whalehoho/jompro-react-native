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

export const requestPasswordRecoveryCode = async (userEmail) => {
  try {
    const response = await apiClient.post('/auth/request-password-reset', { userEmail });
    console.log('response data', response.data);
    return response.data;
  } catch (error) {
    console.error('Error requesting password recovery code:', error);
    throw error;
  }
}

export const verifyPasswordRecoveryCode = async (email, code) => {
  try {
    const response = await apiClient.post('/auth/verify-password-reset-code', { email, code });
    console.log('response data', response.data);
    return response.data;
  } catch (error) {
    console.error('Error verifying password recovery code:', error);
    throw error;
  }
}

export const resetPassword = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/reset-password', { email, password });
    console.log('response data', response.data);
    return response.data;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}
