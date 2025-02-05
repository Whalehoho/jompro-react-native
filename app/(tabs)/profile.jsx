import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useGlobalContext } from '../../context/GlobalProvider';
import AsyncStorage from '@react-native-async-storage/async-storage'

import { icons } from '../../constants';
import * as api from '../../api';
import { Link, router } from 'expo-router';


const Profile = () => {
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const { logoutUser } = useGlobalContext();

  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const storedProfileImage = await AsyncStorage.getItem('profileImage');
        if (storedProfileImage) {
          setProfileImage(storedProfileImage);
        }
      } catch (error) {
        console.error('Failed to load profile image from storage:', error);
      }
    };

    const fetchUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      }
    };

    fetchProfileImage();
    fetchUserData();
  }, []);

  const handleProfileImageUpload = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'You need to allow permission to upload a profile image.');
      return;
    }
  
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      base64: true,
    });
  
    if (!pickerResult.canceled) {
      setLoading(true);
      const localUri = pickerResult.assets[0].uri
      const filename = localUri.split('/').pop();
  
      // Infer the type of the image
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      try{
        const data = await api.imgbb.uploadImage({
          uri: localUri,
          name: filename,
          type: type,
        });
  
        if(!data) {
          Alert.alert('Error', 'Failed to upload image');
          return;
        }     
  
        const userData = {
          email: user.email,
          profileImgUrl: data.data.url,
          profileImgDeleteUrl: data.data.delete_url
        }
  
  
        await api.user.updateProfileImage(userData);
        setProfileImage(data.data.url);
        await AsyncStorage.setItem('profileImage', data.data.url);
      

      } catch (error) {
        console.error('Error updating profile image:', error);
        Alert.alert('Error', 'Failed to update profile image');
      } finally {
        setLoading(false);
      }
  
    }
  };
  

  const handleLogout = () => {
    Alert.alert('Logout', 'Proceed to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => {
        logoutUser();
        router.replace('/sign-in');
      } },
    ]);
  };

  const listItems = [
    { title: 'My Details', icon: icons.account, link: '/my-details' },
    { title: 'Saved Addresses', icon: icons.location, link: '/saved-addresses' },
    { title: 'Liveness Verification', icon: icons.faceId, link: '/liveness-verification' },
    { title: 'Notifications', icon: icons.notification, link: '/notifications' },
    { title: 'Settings', icon: icons.settings, link: '/settings' },
  ];

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 10, flexGrow: 1 }}>
        <TouchableOpacity
              onPress={handleLogout}
              className="flex w-full items-end mb-6"
        >
          <Image
            source={icons.logout}
            resizeMode="contain"
            className="w-6 h-6"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleProfileImageUpload} className="items-center mb-5">
          <View className="relative w-28 h-28 justify-center items-center">
          <View
            className="w-28 h-28 rounded-full border-1 border-gray-300 overflow-hidden"
            style={{
              opacity: loading ? 0.5 : 1,
            }}
          >
            <Image
              source={
                profileImage
                  ? { uri: profileImage }
                  : user?.profileImgUrl
                  ? { uri: user.profileImgUrl }
                  : require('../../assets/icons/account.png')
              }
              className="w-28 h-28"
              style={{
                tintColor: (!profileImage && !user?.profileImgUrl) ? '#5e40b7' : undefined,
              }}
            />
          </View>

            {loading && (
              <View className="absolute inset-0 flex justify-center items-center">
                <ActivityIndicator size="large" color="#5e40b7" />
              </View>
            )}
          </View>
          <Text className="text-xl text-gray-800 mt-3 font-psemibold">{user?.userName}</Text>
          <Text className="text-sm text-gray-500 mt-2 italic font-pblack">@{user?.accountId}</Text>
        </TouchableOpacity>

        <View className="mt-3">
          {listItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              className="flex-row items-center py-4 border-b border-gray-300"
              onPress={() => {
                router.push(item.link);
              }}
            >
              <Image 
                source={item.icon}
                resizeMode='contain'
                tintColor= '#5e40b7'
                className="w-6 h-6 ml-2 mr-4"
              />
              <Text className="text-base text-gray-800 font-pmedium">{item.title}</Text>
              <Image source={icons.next} className="w-4 h-4 ml-auto mr-2" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      
    </View>
  );
}

export default Profile
