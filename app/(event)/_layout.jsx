import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { icons } from '../../constants';
import { useLocalSearchParams } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useGlobalContext } from '../../context/GlobalProvider';

const CustomHeaderTitle = ({ title }) => (
    <View className="flex-row items-center justify-center">
      <Text className="text-xl font-psemibold">
        {title}
      </Text>
    </View>
  );

const EventLayout = () => {
    const { eventId } = useLocalSearchParams();
    const { isEditingEvent, setIsEditingEvent } = useGlobalContext();

  return (
      <>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="event-info" 
            options={{
              headerShown: true,
              headerStyle: {
                backgroundColor: '#fff',
              },
              headerTitle: () => <CustomHeaderTitle title="Event" />,
              headerRight: () => (
                <TouchableOpacity onPress = {() => {
                    setIsEditingEvent(true);
                }}>
                    <Image
                        source={icons.edit}
                        resizeMode="contain"
                        className="w-4 h-4 mr-2"
                    />
                </TouchableOpacity>
              ),
              headerShadowVisible: true,
            }} 
          />
          
        </Stack>
      </>
    );
}

export default EventLayout
