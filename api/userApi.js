import apiClient from './apiClient';

export const getAllUsers = async () => {
  try {
    const response = await apiClient.get('/user');
    return response.data;
  } catch (error) {
    if (error.response) {
        // The server responded with a status code outside the 2xx range
        console.error('Response error:', error.response.data);
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Request error:', error.request);
      } else {
        // Something happened in setting up the request
        console.error('Error:', error.message);
      }
      throw error;
  }
}

export const updateProfileImage = async (userData) => {
  try {
    const response = await apiClient.put('/user/updateProfileImg', userData);
    console.log('response', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export const updateProfile = async (userData) => {
  try {
    const response = await apiClient.put('/user/updateProfile', userData, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export const addAddress = async (accountId, addressData) => {
  try {
    console.log('addressData', addressData);
    const response = await apiClient.put(`/region/addAddress/${accountId}`, addressData);
    return response.data;
  } catch (error) {
    console.error('Error adding address:', error);
    throw error;
  }
}

export const fetchAddresses = async (accountId) => {
  try {
    const response = await apiClient.get(`/region/accountId/${accountId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching addresses:', error);
    throw error;
  }
}

export const updateDefaultAddress = async (defaultAddress) => {
  try {
    const response = await apiClient.put(`/region/updateDefault`, defaultAddress);
    return response.data;
  } catch (error) {
    console.error('Error updating default address:', error);
    throw error;
  }
}

export const removeAddress = async (accountId, addressData) => {
  try {
    const response = await apiClient.put(`/region/removeAddress/${accountId}`, addressData);
    return response.data;
  } catch (error) {
    console.error('Error removing address:', error);
    throw error;
  }
}

export const getProfileUrlbyId = async (accountId) => {
  try {
    const response = await apiClient.get(`/user/getProfileUrlbyAccountId/${accountId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching profile url:', error);
    throw error;
  }
}

export const getProfilebyId = async (accountId) => {
  try {
    const response = await apiClient.get(`/user/accountId/${accountId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}


