import axios from 'axios';
import { BASE_URL } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router'
import { Alert } from 'react-native';

const apiClient = axios.create({
  baseURL: BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response && error.response.status === 401) {
      Alert.alert('Session Expired', 'Your session has expired. Please log in again.');
      await AsyncStorage.removeItem('userToken');
      router.replace('/sign-in');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
