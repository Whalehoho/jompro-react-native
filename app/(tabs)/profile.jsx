import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useGlobalContext } from '../../context/GlobalProvider';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native';
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

  useFocusEffect(
    useCallback(() => {
      const fetchUserDataWhenFocused = async () => {
        try {
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            const response = await api.user.getUserById(parsedUser.userId);
            setUser(response.data);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }
      };
      fetchUserDataWhenFocused();
    }, [])
  );

  
  useFocusEffect(
    useCallback(() => {
      const fetchUserDataWhenFocused = async () => {
        try {
          if(!user) {
            return;
          }
          const response = await api.user.getUserById(user.userId);
          setUser(response.data);
          await AsyncStorage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }
      };
      fetchUserDataWhenFocused();
  }, []));


  const handleProfileImageUpload = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    const albumPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted || !albumPermission.granted) {
      Alert.alert("Permission required", "You need to allow camera and album access to upload a profile image.");
      return;
    }

    // 📌 Let the user choose: Pick from gallery or Take a new photo
    Alert.alert(
      "Update Profile Image",
      "Would you like to pick an image from the gallery or take a new photo?",
      [
        {
          text: "📷 Take a Photo",
          onPress: async () => {
            await handleCaptureImage();
          },
        },
        {
          text: "🖼️ Choose from Album",
          onPress: async () => {
            await handlePickImage();
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  // 🖼️ **Function for Picking Image from Album**
  const handlePickImage = async () => {
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!pickerResult.canceled) {
        await processAndUploadImage(pickerResult.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image.");
    }
  };

  // 📷 **Function for Taking a New Photo**
  const handleCaptureImage = async () => {
    try {
      const photoResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!photoResult.canceled) {
        await processAndUploadImage(photoResult.assets[0].uri);
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      Alert.alert("Error", "Failed to capture image.");
    }
  };

  // 🔼 **Function to Upload Image to S3**
  const processAndUploadImage = async (localUri) => {
    setLoading(true);

    const filename = localUri.split("/").pop();

    // Infer the type of the image
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    // try{ //upload image to imgbb
    //   const data = await api.imgbb.uploadImage({
    //     uri: localUri,
    //     name: filename,
    //     type: type,
    //   });

    //   if(!data) {
    //     Alert.alert('Error', 'Failed to upload image');
    //     return;
    //   }     

    //   const userData = {
    //     userEmail: user.userEmail,
    //     userProfileImgUrl: data.data.url,
    //     userProfileImgDeleteUrl: data.data.delete_url
    //   }

    //   await api.user.updateProfileImage(userData);
    //   setProfileImage(data.data.url);
    //   await AsyncStorage.setItem('profileImage', data.data.url);
      
    // } catch (error) {
    //   console.error('Error updating profile image:', error);
    //   Alert.alert('Error', 'Failed to update profile image');
    // } finally {
    //   setLoading(false);
    // }

    try { //upload image to s3
      const data = await api.s3.uploadImageToS3(localUri, filename);

      if (!data) {
        Alert.alert("Error", "Failed to upload image");
        return;
      }

      console.log("data return from s3:", data);

      const userData = {
        userEmail: user.userEmail,
        userProfileImgUrl: data,
      };

      await api.user.updateProfileImage(userData);
      setProfileImage(data);
      await AsyncStorage.setItem("profileImage", data);
    } catch (error) {
      console.error("Error updating profile image:", error);
      Alert.alert("Error", "Failed to update profile image");
    } finally {
      setLoading(false);
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
    { title: 'My Events', icon: icons.rsvp, link: '/my-rsvps' },
    { title: 'My Channels', icon: icons.broadcast, link: '/my-subscriptions' },
    { title: 'My Addresses', icon: icons.location, link: '/saved-addresses' },
    { title: 'Verification', icon: icons.faceId, link: '/liveness-verification' },
    { title: 'Check for Updates', icon: icons.update, link: '/update' },
    
  ];

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 10, flexGrow: 1 }}>
        <TouchableOpacity
              onPress={handleLogout}
              className="flex w-full items-end mt-1 mb-0"
        >
          <Image
            source={icons.logout}
            resizeMode="contain"
            className="w-9 h-9"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleProfileImageUpload} className="items-center mb-5">
          <View className="relative w-40 h-40 justify-center items-center">
            <View
              className="w-40 h-40 rounded-full border-1 border-gray-300 overflow-hidden"
              style={{
                opacity: loading ? 0.5 : 1,
              }}
            >
              <Image
                source={
                  profileImage
                    ? { uri: profileImage }
                    : user?.userProfileImgUrl
                    ? { uri: user.userProfileImgUrl }
                    : require('../../assets/icons/account.png')
                }
                className="w-40 h-40"
                style={{
                  tintColor: (!profileImage && !user?.userProfileImgUrl) ? '#5e40b7' : undefined,
                }}
              />
            </View>

            {loading && (
              <View className="absolute inset-0 flex justify-center items-center">
                <ActivityIndicator size="large" color="#5e40b7" />
              </View>
            )}
          </View>
          
        </TouchableOpacity>

        <View className="items-center mb-2">
          <Text className="text-2xl text-black mt-0 mb-4 font-pblack">{user?.userName}</Text>
          <View className="flex-row items-center bg-primary">
            <Text className="text-base text-gray-800  underline font-pbold text-center border-y-2 border-r-2 border-l-2 border-gray-800 p-1" style={{ flex: 1 }}>@{user?.userId}</Text>
            <Text className="text-base text-gray-800  font-pbold text-center border-y-2 border-r-2 p-1" style={{ flex: 1 }}>{user?.verified === null? 'Unverified': user?.verified === true? 'Verified ✔': 'Verification failed'} </Text>
          </View>
        </View>

        <View className="mt-3  border-2 border-gray-800 bg-primary">
          {listItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              className={`flex-row items-center py-2  ${index !== listItems.length - 1 ? 'border-b-2 border-gray-800' : ''}`}
              onPress={() => {
                router.push(item.link);
              }}
            >
              <Image 
                source={item.icon}
                resizeMode='contain'
                tintColor= '#7257ca'
                className="w-8 h-8 ml-2 mr-4"
              />
              <Text className="text-base text-gray-800 font-psemibold ml-auto">{item.title}</Text>
              <Image source={icons.next} className="w-6 h-6 ml-auto mr-4" tintColor= '#7257ca'/>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      
    </View>
  );
}

export default Profile
