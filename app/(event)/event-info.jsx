import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef } from 'react';
import * as api from '../../api';

import { useGlobalContext } from '../../context/GlobalProvider';

import { icons, images } from '../../constants';

const EventInfo = () => {
    const { eventId } = useLocalSearchParams(); // Get eventId from URL
    const { starredEvents, setIsEventStarred } = useGlobalContext();
    const [ event, setEvent ] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef();
    

    const isEventStarred = starredEvents[eventId] || false;  

    useEffect(() => {
        // Only reset starred state if this is the first time visiting the event
        if (!(eventId in starredEvents)) {
          setIsEventStarred(eventId, false); // Reset to false for this event
        }
        // setIsEventStarred(14, true);

        // TO BE IMPLEMENTED:
        // Fetch starred events from the server and update the starredEvents state

    }, [eventId]);

    useEffect(() => {
        // Fetch event details from the server
        const fetchEvent = async () => {
            try {
                const response = await api.event.getEvent(eventId);
                setEvent(response.data);
            } catch (error) {
                console.error('Failed to fetch event:', error);
            }
        };
        fetchEvent();
    }, [eventId]);

    useEffect(() => {
        const lineCount = countNewLines(event?.eventAbout);
        setIsTruncated(lineCount > 10); // Show "Read More" if there are more than 10 lines
      }, [event]);
    

    // console.log(event);

    const formatEventAbout = (text) => {
        if (!text) return '';
        // Replace HTML <br> tags with new lines or any other form of line breaks
        const formattedText = text.replace(/<br\s*\/?>/g, '\n');
        return formattedText;
    };

    const countNewLines = (text) => {
        if (!text) return 0;
        return (text.match(/\n/g) || []).length;  // Count the number of '\n' occurrences
      };

    const toggleReadMore = () => {
        setIsExpanded(!isExpanded);
    };


    return (
        <>
        <SafeAreaView className="flex-1 bg-white h-full">
                <ScrollView>
                    <View className="w-full h-60 bg-white">
                        <Image
                            source={images.landscape}
                            resizeMode="cover"
                            className="w-[92%] h-[92%] m-4 rounded-xl"
                        />
                    </View>
                    <View className="mx-4">
                        <Text className="text-xl font-pbold mt-2" style={{ lineHeight: 40 }}>😊 Make New Friends - Coffee and Chat LIVE 😊 Chinese New Year - Wear Red 🔴</Text>
                    </View>
                    <View className="mx-4 my-2 flex-col space-y-4">
                        <TouchableOpacity className="mt-2 mb-2"onPress={ () => {}}>
                            <View className="flex-row items-start justify-start">
                                <View>
                                    <Image source={icons.calendar} tintColor='#374151' className="w-6 h-6" />
                                </View>
                                <View className="ml-4 space-y-1 flex-1">
                                    <Text className="font-psemibold text-lg text-gray-700">Date</Text>
                                    <Text className="text-gray-600 text-xs font-pmedium">Start_Time - End_Time </Text>
                                </View>
                                <View className="ml-2">
                                    <Image source={icons.next} tintColor='#374151' className="w-4 h-4 mr-1" />
                                </View>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity className="mb-4"onPress={ () => {}}>
                            <View className="flex-row items-start justify-start">
                                <View>
                                    <Image source={icons.location} tintColor='#374151' className="w-6 h-6" />
                                </View>
                                <View className="ml-4 space-y-1 flex-1">
                                    <Text className="font-psemibold text-lg text-gray-700">Location</Text>
                                    <Text className="text-gray-600 text-xs font-pmedium">Address </Text>
                                </View>
                                <View className="ml-2">
                                    <Image source={icons.next} tintColor='#374151' className="w-4 h-4 mr-1" />
                                </View>
                            </View>
                        </TouchableOpacity>
                        <View className="mb-4 space-y-1">
                            <Text className="font-pbold text-sm text-gray-700">Channel Name</Text>
                            <Text className="text-gray-600 text-xs font-pmedium">Privacy </Text>
                        </View>
                        <View className="mb-2 space-y-2">
                            <Text className="font-pbold text-xl text-gray-700">About</Text>
                            <Text className="text-gray-600 text-sm font-pmedium" style={{
                                    lineHeight: 24,         // Adjust line spacing for better readability
                                    marginTop: 20,          // Adds space above the text
                                }}
                                ref={textRef}
                            >
                               {isExpanded? formatEventAbout(event?.eventAbout) : `${formatEventAbout(event?.eventAbout).split('\n').slice(0, 10).join('\n')}`}
                               {isTruncated && !isExpanded && '...'}
                            </Text>
                            {isTruncated && (
                                <TouchableOpacity onPress={toggleReadMore}>
                                <Text className="text-blue-500">
                                    {isExpanded ? 'Read Less' : 'Read More'}
                                </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.separator} className="mt-0 mb-2" />

                    <View className="mx-4 my-2 flex-row space-x-4">
                        <View style={{ flex: 1, alignItems: 'flex-start' }}>
                            <Text className="font-pbold text-xl text-gray-700">Hosted By</Text>
                            <Text className="text-gray-600 text-sm font-pmedium">{event?.organizerId} </Text>
                            
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-start' }}>
                            <Text className="font-pbold text-xl text-gray-700">Attendees(20)</Text>

                        </View>
                    </View>


                    
                    
                    <View style={styles.container}>
                        <Text>Event ID: {eventId}</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>

        <StatusBar backgroundColor='#ffffff' style='auto' hidden={false} translucent={false} />
        </>
    );
    };

export default EventInfo

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
    },
    separator: {
        height: 10,
        backgroundColor: '#d1d5db',
        marginVertical: 8
      },
})