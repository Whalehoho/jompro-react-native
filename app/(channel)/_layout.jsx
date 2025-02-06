import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { icons } from '../../constants';
import { useLocalSearchParams } from 'expo-router';


const CustomHeaderTitle = ({ title }) => (
    <View className="flex-row items-center justify-center">
      <Text className="text-xl font-psemibold">
        {title}
      </Text>
    </View>
  );

const EventLayout = () => {
    const { channelId } = useLocalSearchParams();

  return (
      <>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="channel-info" 
            options={{
              headerShown: true,
              headerStyle: {
                backgroundColor: '#fff',
              },
              headerTitle: () => <CustomHeaderTitle title="Channel" />,
              headerShadowVisible: true,
            }} 
          />
          
        </Stack>
      </>
    );
}

export default EventLayout
