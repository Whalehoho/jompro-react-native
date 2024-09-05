import { View, Text } from 'react-native';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';

const CustomHeaderTitle = ({ title }) => (
    <View className="flex-row items-center justify-center">
      <Text className="text-2xl font-psemibold">
        {title}
      </Text>
    </View>
  );

const ProfileLayout = () => {
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
