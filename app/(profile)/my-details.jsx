import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useState, useEffect } from 'react'
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage'
import Dialog from "react-native-dialog";
import { Alert } from 'react-native'

import { icons } from '../../constants'
import FormField from '../../components/FormField'
import CustomButton from '../../components/CustomButton'

import * as api from '../../api'

import { useGlobalContext } from '../../context/GlobalProvider'

const MyDetails = () => {
  const [form, setForm] = useState({
    userName: '',
    userEmail: '',
    newPassword: '',
    userAge: '',
  })

  const [gender, setGender] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [visible, setVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setGender(parsedUser.userGender);
          setForm({
            userName: parsedUser.userName || '',
            userEmail: parsedUser.userEmail || '',
            password: form.password || '',
            userAge: parsedUser.userAge ? `${parsedUser.userAge}` : '',
            userGender: parsedUser.userGender || '',
          });
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      }
    };
    fetchUserData();
  }, []);

  const showDialog = () => {
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const submit = async () => {

    if (!oldPassword) {
      Alert.alert('Password required', 'Please enter your old password to save changes');
      return;
    }

    setIsSubmitting(true);
    setVisible(false);

    if(!form.userName || !form.userEmail || !form.userAge){
      Alert.alert('Username, email, age are required');
      setIsSubmitting(false);
      return;
    }

    if(!Number.isInteger(Number(form.userAge))){
      Alert.alert('Invalid age');
      setIsSubmitting(false);
      return;
    }

    try{
      const message = await api.user.updateProfile({
        userId: user.userId,
        userName: form.userName,
        userEmail: form.userEmail,
        oldPassword: oldPassword,
        newPassword: form.newPassword,
        userAge: form.userAge,
        userGender: gender,
      });
      if(message.data === 'invalid password') {
        Alert.alert('invalid password');
        return;
      }
      if(message.data === 'success') {
        Alert.alert('Profile updated successfully');
        const updatedUser = {
          ...user,
          userName: form.userName,
          userEmail: form.userEmail,
          userAge: form.userAge,
          userGender: gender
        }
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      Alert.alert('Failed to update user', 'Please try again later');
    } finally {
      setIsSubmitting(false);
      setOldPassword('');
    }
  };


  return (
    <>
    <SafeAreaView className="flex-1 bg-primary h-full">
      <ScrollView>
        <View className="w-full min-h-[85vh] px-4">
          <FormField
            title="Username"
            value={form.userName}
            handleChangeText={(e) => setForm({ ...form, userName: e })}
            titleStyle={'text-black'}
            boxStyle={'border-gray-800 bg-gray-200 rounded-sm h-14 px-4'}
            otherStyles="mt-7 space-y-1"
          />
          <FormField
            title="Email"
            value={form.userEmail}
            handleChangeText={(e) => setForm({ ...form, userEmail: e })}
            titleStyle={'text-black'}
            boxStyle={'border-gray-800 bg-gray-200 rounded-sm h-14 px-4'}
            otherStyles="mt-5 space-y-1"
            keyboardType="email-address"
          />
          <FormField
            title="New Password"
            subtitle="Leave blank to keep the same password"
            value={form.newPassword}
            handleChangeText={(e) => setForm({ ...form, newPassword: e })}
            titleStyle={'text-black'}
            subtitleStyle={'mb-1 text-secondary'}
            boxStyle={'border-gray-800 bg-gray-200 rounded-sm h-14 px-4'}
            otherStyles="mt-5 space-y-1"
          />
          <FormField
            title="Age"
            value={`${form.userAge}`} 
            handleChangeText={(e) => setForm({ ...form, userAge: e })}
            titleStyle={'text-black'}
            boxStyle={'border-gray-800 bg-gray-200 rounded-sm h-14 px-4'}
            otherStyles="mt-5 space-y-1"
            keyboardType="numeric"
          />
          
          <Text className="text-base text-black font-pmedium mt-5">Gender</Text>

          <View className="flex-row justify-between mt-1">

            <TouchableOpacity
              className={`flex-1 py-4 items-center border-2 rounded-lg mx-1 ${
                gender?
                (gender === 'Male' ? 'bg-secondary-100 border-secondary-100' : 'border-gray-800') :
                (user?.userGender === 'Male' ? 'bg-secondary-100 border-secondary-100' : 'border-gray-800')
              }`}
              onPress={() => setGender('Male')}
            >
              <View className="flex-1 items-center justify-evenly space-y-2"> 
                <Image
                  source={icons.male}
                  resizeMode="contain"
                  className="w-4 h-4"
                />
                <Text className={`text-md font-psemibold text-black`}>Male</Text>
              </View>
              
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-4 items-center border-2 rounded-lg mx-1 ${
                gender?
                (gender === 'Female' ? 'bg-secondary-100 border-secondary-100' : 'border-gray-800') :
                (user?.userGender === 'Female' ? 'bg-secondary-100 border-secondary-100' : 'border-gray-800')
              }`}
              onPress={() => setGender('Female')}
            >
              <View className="flex-1 items-center justify-evenly space-y-2"> 
                <Image
                  source={icons.female}
                  resizeMode="contain"
                  className="w-4 h-4"
                />
                <Text className={`text-md font-psemibold text-black`}>Female</Text>
              </View>

            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-4 items-center border-2 rounded-lg mx-1 ${
                gender?
                (gender === 'Unknown' ? 'bg-secondary-100 border-secondary-100' : 'border-gray-800') :
                (user?.userGender === 'Unknown' ? 'bg-secondary-100 border-secondary-100' : 'border-gray-800')
              }`}
              onPress={() => setGender('Unknown')}
            >
              <View className="flex-1 items-center justify-evenly space-y-2"> 
                <Image
                  source={icons.question}
                  resizeMode="contain"
                  className="w-4 h-4"
                />
                <Text className={`text-md font-psemibold text-black`}>Unknown</Text>
              </View>

            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>
      <View className="absolute bottom-0 left-0 right-0 p-4">
        <CustomButton
          title="Save Changes"
          handlePress={showDialog}
          containerStyles="rounded-md"
          textStyles="text-base"
          isLoading={isSubmitting}
        />
      </View>

      <Dialog.Container visible={visible}>
        <Dialog.Title>Enter your old password to save changes</Dialog.Title>
        <Dialog.Input
          placeholder="Password"
          secureTextEntry
          onChangeText={(e) => setOldPassword(e)}
          value={oldPassword}
        />
        <Dialog.Button label="Cancel" onPress={handleCancel} />
        <Dialog.Button label="Submit" onPress={submit} />
      </Dialog.Container>

    </SafeAreaView>

    <StatusBar backgroundColor='#ffffff' style='auto' hidden={false} translucent={false} />
    </>
  )
}

export default MyDetails