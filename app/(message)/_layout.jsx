import { View, Text, Image, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { icons } from '../../constants';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useGlobalContext } from '../../context/GlobalProvider'

const CustomHeaderTitle = ({ title }) => (
    <View className="flex-row items-center justify-center">
      <Text className="text-2xl font-psemibold">
        {title}
      </Text>
    </View>
  );

const ChatRoomLayout = () => {
    const { channel } = useLocalSearchParams();

  return (
    <Stack>
            <Stack.Screen 
              name="chatroom" 
              options={{
                headerShown: false,
                headerTitle: () => <CustomHeaderTitle title="channel.ChannelName" />,
                headerShadowVisible: true,
              }} 
            />
            
          </Stack>
  )
}

export default ChatRoomLayout
