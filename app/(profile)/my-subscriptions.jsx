import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useState, useEffect, useCallback } from 'react'
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useGlobalContext } from '../../context/GlobalProvider'
import Dialog from "react-native-dialog";
import { icons } from '../../constants';
import { Alert } from 'react-native'
import * as api from '../../api';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

const categories = [
  { title: 'Outdoor', icon: icons.outdoor },
  { title: 'Culture', icon: icons.culture },
  { title: 'Charity', icon: icons.charity },
  { title: 'Dining', icon: icons.dining },
  { title: 'Arts', icon: icons.arts },
  { title: 'Sports', icon: icons.sports },
  { title: 'Travel', icon: icons.travel },
  { title: 'Workout', icon: icons.workout },
  { title: 'Hobbies', icon: icons.hobbies },
  { title: 'Tech', icon: icons.tech },
  { title: 'Seminar', icon: icons.seminar },
  { title: 'Pets', icon: icons.pets },
  { title: 'Science', icon: icons.science },
  { title: 'Tabletop', icon: icons.boardGames },
  { title: 'Cosplay', icon: icons.cosplay },
  { title: 'Garden', icon: icons.gardening }
];

const MySubscriptions = () => {
  const [showChannels, setShowChannels] = useState(true); // Show channels or subscriptions
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [mySubscribedChannels, setMySubscribedChannels] = useState([]);
  const [myChannels, setMyChannels] = useState([]);
  const [userId, setUserId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      setMySubscribedChannels([]);
      setMyChannels([]);
    }, [])
  );

  useFocusEffect(useCallback(() => {
    const fetchUserId = async () => {
      try{
        const storedUser = await AsyncStorage.getItem('user');
        if(!storedUser) {
          console.error('User not found');
          return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUserId(parsedUser.accountId);
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      }
    };
    fetchUserId();
  }, [userId]));

  useFocusEffect(useCallback(() => {
    if (!userId) { return; }
    const fetchMySubscribed = async () => {
      try {
        const response = await api.subscription.getMySubscribed(userId);
        if(!response || !response.data) { return; }
        setMySubscriptions(response.data);
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error);
      }
    };
    fetchMySubscribed();
  }, [userId]));

  useFocusEffect(useCallback(() => {
    if (!mySubscriptions || mySubscriptions.length === 0) { return; }
    const fetchMySubscribedChannels = async () => {
      try {
        const channelIds = mySubscriptions.map(subscription => subscription.channelId);
        for (const channelId of channelIds){
          const response = await api.channel.getChannelByChannelId(channelId);
          if(response){
            setMySubscribedChannels(prev => {
              const isDuplicate = prev.some(e => e.channelId === response.data.channelId);
              return isDuplicate ? prev : [...prev, response.data];
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch subscribed channels:', error);
      }
    };
    fetchMySubscribedChannels();
  }, [mySubscriptions]));

  useFocusEffect(useCallback(() => {
    if (!userId) { return; }
    const fetchMyChannels = async () => {
      try {
        const response = await api.channel.getChannelsByOwnerId(userId);
        setMyChannels(response.data);
      } catch (error) {
        console.error('Failed to fetch channels:', error);
      }
    };
    fetchMyChannels();
  }, [userId]));

  const formatChannelDesc = (desc) => {
    if(!desc) return '';
    // Replace HTML <br> tags with new lines or any other form of line breaks
    const formattedText = desc.replace(/<br\s*\/?>/g, '\n');
    return formattedText;
};

  return (
    <>
    
      <SafeAreaView className="flex-1 bg-primary h-full">

        <View className="flex-row justify-arround bg-primary">
            <View className="flex-1 border-2 border-gray-800">
              <Text
                className={`px-4 py-4 text-center ${
                  showChannels ? 'bg-secondary-100 text-white' : 'text-gray-700'
                }`}
                onPress={() => setShowChannels(true)}
              >
                My Channels( {myChannels?.length} )
              </Text>
            </View>
            <View className="flex-1 border-2 border-gray-800">
              <Text
                className={`px-4 py-4 text-center ${
                  !showChannels ? 'bg-secondary-100 text-white' : 'text-gray-700'
                }`}
                onPress={() => setShowChannels(false)}
              >
                My Subscriptions( {mySubscribedChannels?.length} )
              </Text>
            </View>
        </View>

        <ScrollView>
          {
            showChannels  && (
              myChannels?.map((channel, index) => (
                <TouchableOpacity key={index} className="border-b border-black" onPress={() => { router.push(`/channel-info?channelId=${channel.channelId}`) }}>
                  <View className="flex-row">
                    <View className="my-4 space-y-2 flex-[0.4] border-r border-black items-center justify-center">
                        <Image 
                          source={categories.find(cat => cat.title === channel.category).icon} 
                          className="w-12 h-12" 
                          tintColor={'#7257ca'}
                          />
                        <Text className="text-center text-gray-600">{channel.category}</Text>
                    </View>
                    <View className="ml-4 my-4 space-y-1 flex-1 items-center justify-center">
                      <Text className="font-psemibold text-lg text-center" numberOfLines={1} ellipsizeMode="tail">
                              {channel.channelName}
                      </Text>
                      <Text className="font-pregular text-sm " numberOfLines={6} ellipsizeMode="tail">
                              {formatChannelDesc(channel.channelDesc)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )
          }
          {
            !showChannels && (
              mySubscribedChannels?.map((channel, index) => (
                <TouchableOpacity key={index} className="border-b border-black" onPress={() => { router.push(`/channel-info?channelId=${channel.channelId}`) }}>
                  <View className="flex-row">
                    <View className="my-4 space-y-2 flex-[0.4] border-r border-black items-center justify-center">
                        <Image 
                          source={categories.find(cat => cat.title === channel.category).icon} 
                          className="w-12 h-12" 
                          tintColor={'#7257ca'}
                          />
                        <Text className="text-center text-gray-600">{channel.category}</Text>
                    </View>
                    <View className="ml-4 my-4 space-y-1 flex-1 items-center justify-center">
                      <Text className="font-psemibold text-lg text-center" numberOfLines={1} ellipsizeMode="tail">
                              {channel.channelName}
                      </Text>
                      <Text className="font-pregular text-sm " numberOfLines={6} ellipsizeMode="tail">
                              {formatChannelDesc(channel.channelDesc)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )
          }
        </ScrollView>

      </SafeAreaView>

      <StatusBar backgroundColor='#ffffff' style='auto' hidden={false} translucent={false} />
    </>
    

  )
}

export default MySubscriptions