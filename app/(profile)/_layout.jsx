import { View, Text, Image, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { icons } from '../../constants';
import { Stack } from 'expo-router';
import { useGlobalContext } from '../../context/GlobalProvider'

const CustomHeaderTitle = ({ title }) => (
    <View className="flex-row items-center justify-center">
      <Text className="text-2xl font-psemibold">
        {title}
      </Text>
    </View>
  );

const ProfileLayout = () => {
  const { rsvpView, setRsvpView } = useGlobalContext();


  return (
    <>
      <Stack>
        <Stack.Screen 
          name="my-details" 
          options={{
            headerShown: true,
            headerTitle: () => <CustomHeaderTitle title="My Details" />,
            headerShadowVisible: true,
          }} 
        />
        <Stack.Screen 
          name="my-rsvps" 
          options={{
            headerShown: true,
            headerTitle: () => <CustomHeaderTitle title="My Events & RSVP" />,
            headerShadowVisible: true,
            headerRight: () => (
              <TouchableOpacity onPress = {() => {
                  setRsvpView(rsvpView === 0 ? 1 : 0);
              }}>
                  <Image
                      source={rsvpView === 0 ? icons.calendar2 : icons.list}
                      resizeMode="contain"
                      className="w-6 h-6 mr-2"
                  />
              </TouchableOpacity>
            ),
          }} 
        />
        <Stack.Screen 
          name="saved-addresses" 
          options={{
            headerShown: true,
            headerTitle: () => <CustomHeaderTitle title="Saved Addresses" />,
            headerShadowVisible: true,
          }} 
        />
        <Stack.Screen
          name="liveness-verification"
          options={{ headerShown: false}}
        />
      </Stack>
    </>
  );
};

export default ProfileLayout;
