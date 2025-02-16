import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useState, useEffect, useCallback } from 'react'
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useGlobalContext } from '../../context/GlobalProvider'
import Dialog from "react-native-dialog";
import { icons } from '../../constants';
import { Alert } from 'react-native'
import { Calendar } from 'react-native-big-calendar';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import * as api from '../../api';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

const today = new Date();

const customCalendarTheme = {
  palette: {
    primary: {
      main: '#5e40b7',      // Primary color for calendar
      contrastText: '#000', // Text color for events
    },
    nowIndicator: '#FF5722', // Color for the now indicator
    gray: {
      100: '#333',
      200: '#666',
      300: '#888',
      500: '#4b5563',
      800: '#000',
    },
    moreLabel: '#FFEB3B', // Color for more label
  },
  isRTL: false,
  typography: {
    xs: {
      fontFamily: 'Arial',
      fontWeight: 'normal',
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0,
      textAlign: 'center',
    },
    sm: {
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontSize: 14,
      lineHeight: 18,
      letterSpacing: 0,
      textAlign: 'center',
    },
    xl: {
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontSize: 18,
      lineHeight: 22,
      letterSpacing: 0,
      textAlign: 'center',
    },
    moreLabel: {
      fontFamily: 'Arial',
      fontWeight: 'normal',
      fontSize: 10,
      lineHeight: 14,
      letterSpacing: 0,
      textAlign: 'center',
    },
  },
  eventCellOverlappings: [
    { main: '#FF5722', contrastText: '#fff' }, // Overlapping event color
  ],
  moreLabel: {
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0,
    textAlign: 'center',
  },
};

const MyRSVPs = () => {
  const { rsvpView } = useGlobalContext();
  const [mode, setMode] = useState('month'); // Default mode
  const [currentDate, setCurrentDate] = useState(new Date()); // Track current date
  const [rsvps, setRsvps] = useState([]);
  const [events, setEvents] = useState([]);
  const [userId, setUserId] = useState(null);
  const [showRSVP, setShowRSVP] = useState(true); // Show RSVPs or Events

  useEffect(() => {
    const fetchUserId = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');
            if (!storedUser) {
                console.error('User not found in storage');
                return;
            }
            const parsedUser = JSON.parse(storedUser);
            setUserId(parsedUser.accountId);
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };
    fetchUserId();
  }, [rsvpView]);

  useFocusEffect(
    useCallback(() => {
      setEvents([]); // Clear events every time the screen is focused
    }, [])
  );

  useFocusEffect(useCallback(() => {
    if (!userId) { return; }
    const fetchRsvpsAndEvents = async () => {
        try {
            const response = await api.rsvp.getApprovedByAccountId(userId);
            if(!response || !response.data) { return; }
            setRsvps(response.data);
            const eventIds = response.data.map(rsvp => rsvp.eventId);
            for (const eventId of eventIds) {
                const event = await api.event.getActiveByEventId(eventId);
                if(event && event.data) {
                    const data = {
                        title: event.data.eventName,
                        organizerId: event.data.organizerId,
                        eventId: event.data.eventId,
                        eventName: event.data.eventName,
                        location: event.data.location,
                        start: new Date(event.data.startTime * 1000),
                        end: new Date(event.data.startTime * 1000 + event.data.duration * 1000),
                    }
                    setEvents(prev => {
                      const isDuplicate = prev.some(e => e.eventId === data.eventId);
                      return isDuplicate ? prev : [...prev, data];
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching RSVPs:', error);
        }
    };
    fetchRsvpsAndEvents();
  }, [userId]));


  useFocusEffect(useCallback(() => {
    if (!userId) { return; }
    const fetchMyActiveEvents = async () => {
      try {
        const response = await api.event.getActiveEventsByOrganizerId(userId);
        if (!response || !response.data) { return; }
        for (const event of response.data) {
          const data = {
            title: event.eventName,
            organizerId: event.organizerId,
            eventId: event.eventId,
            eventName: event.eventName,
            location: event.location,
            start: new Date(event.startTime * 1000),
            end: new Date(event.startTime * 1000 + event.duration * 1000),
          }
          setEvents(prev => {
            const isDuplicate = prev.some(e => e.eventId === data.eventId);
            return isDuplicate ? prev : [...prev, data];
          });
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
    fetchMyActiveEvents();
  }, [userId]));
              

  const changeDate = (direction) => {
    const today = new Date(); // Get today's date
    today.setHours(0, 0, 0, 0); // Remove time part for accurate comparison
  
    const newDate = new Date(currentDate);
  
    if (mode === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (mode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (mode === 'day') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    }
  
    // Prevent changing to a past date
    if (newDate >= today) {
      setCurrentDate(newDate);
    }
  };
  

  const formatDate = (date, mode) => {
    const options = { month: 'long', year: 'numeric' };
    if (mode === 'month') {
      return date.toLocaleDateString('en-US', options); // "February 2025"
    } else if (mode === 'week') {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday start
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return `${startOfWeek.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })} - ${endOfWeek.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }); // "Feb 10, 2025"
    }
  };

  const onSwipe = (event) => {
    return;
    const { translationX } = event.nativeEvent;
    if (translationX > 50) {
      changeDate('prev'); // Swipe right → Previous date
    } else if (translationX < -50) {
      changeDate('next'); // Swipe left → Next date
    }
  };

  


const handleOnPressEvent = (event) => { 
  if(Number(event.organizerId) !== Number(userId)) {
    Alert.alert(
      `Your RSVP for "${event.title}"`, 
      `📍 ${event.location.fullAddress}, ${event.start}-${event.end}`, 
      [
        { text: "Close", style: "cancel" },
        { text: "Go to Event", onPress: () => router.push(`/event-info?eventId=${event.eventId}`) }
      ]
    );
  } else {
    Alert.alert(
      `Your Event "${event.title}"`, 
      `📍 ${event.location.fullAddress}, ${event.start}-${event.end}`, 
      [
        { text: "Close", style: "cancel" },
        { text: "Go to Event", onPress: () => router.push(`/event-info?eventId=${event.eventId}`) }
      ]
    );
  }
};


  return (
    <GestureHandlerRootView>
    {rsvpView === 1 ? (
      <SafeAreaView className="bg-white h-full">
       <PanGestureHandler onGestureEvent={onSwipe} activeOffsetX={[-20, 20]}>
        <View className="flex-1 bg-primary">

          {/* Display Current Date/Month/Week with Navigation Buttons */}
          <View className="flex-row items-center justify-between py-2">
            {/* Previous Button */}
            <TouchableOpacity onPress={() => changeDate('prev')} className="p-2">
              <Image source={icons.back} className="w-6 h-6 tint-gray-600 dark:tint-white" />
            </TouchableOpacity>

            {/* Current Date Display */}
            <Text className="text-lg font-bold text-gray-800 dark:text-white mx-4">
              {formatDate(currentDate, mode)}
            </Text>

            {/* Next Button */}
            <TouchableOpacity onPress={() => changeDate('next')} className="p-2">
              <Image source={icons.forward} className="w-6 h-6 tint-gray-600 dark:tint-white" />
            </TouchableOpacity>
          </View>

          {/* Mode Switch */}
          <View className="flex-row justify-around py-3 bg-primary dark:bg-gray-800">
            {['month', 'week', 'day'].map((item, index, arr) => (
              <View key={item}
                className={`flex-1 border-2 border-gray-800 
                  ${index === 0 ? 'border-r-0' : ''} 
                  ${index === arr.length - 1 ? 'border-l-0' : ''}`}
                >
              <Text
                onPress={() => setMode(item)}
                className={`px-4 py-2 text-center ${
                  mode === item ? 'bg-secondary-100 text-white' : 'text-gray-700'
                }`}
              >
                {item.toUpperCase()}
              </Text>
              </View>
            ))}
          </View>

          

          {/* Calendar */}
          <Calendar
            events={events}
            height={600}
            mode={mode}
            date={currentDate}
            onPressEvent={handleOnPressEvent}
            eventCellStyle={(event) => ({
              backgroundColor: Number(event.organizerId) === Number(userId)? '#d94123': '#7257ca', 
              borderWidth: 1,
              borderColor: '#333',
              paddingBottom: 1,
            })}
            swipeEnabled={true}
            weekStartsOn={1}
            showTime
            theme = { customCalendarTheme}
          />
        </View>
      </PanGestureHandler>
      </SafeAreaView>
    ) : (
      <SafeAreaView className="flex-1 bg-primary h-full">

        {/* Switch between my rsvps and my events */}
        <View className="flex-row justify-around bg-primary">
          <View className="flex-1 border-2 border-gray-800">
            <Text
              onPress={() =>{ setShowRSVP(true);}}
              className={`px-4 py-4 text-center ${
                showRSVP ? 'bg-secondary-100 text-white' : 'text-gray-700'
              }`}
            >
              My RSVPs( {events?.filter((event) => {
                return Number(userId) !== Number(event.organizerId);
              }).length} )
            </Text>
          </View>
          <View className="flex-1 border-r-2 border-t-2 border-b-2 border-gray-800">
            <Text
              onPress={() => { setShowRSVP(false);}}
              className={`px-4 py-4 text-center ${
                !showRSVP ? 'bg-secondary-100 text-white' : 'text-gray-700'
              }`}
            >
              My Events( {events?.filter((event) => {
                return Number(userId) === Number(event.organizerId);
              }).length} )
            </Text>
          </View>
        </View>

        <ScrollView>
          <View>
            {
              events
              .filter((event) => {
                if (showRSVP) {
                  return Number(userId) !== Number(event.organizerId);  // Show events where eventId is not the same as organizerId
                } else {
                  return Number(userId) === Number(event.organizerId);  // Show events where eventId is the same as organizerId
                }
              })
              .sort((a, b) => new Date(a.start) - new Date(b.start)).map((event, index) => (
                <TouchableOpacity key={index} className="border-b border-black" onPress={() => { router.push(`/event-info?eventId=${event.eventId}`) }}>
                  <View className="flex-row">
                    {/* Date & Time Section (30%) */}
                    <View className="my-4 space-y-2 flex-[0.3] border-r border-black items-center justify-center">
                        <Text className="font-psemibold text-sm text-secondary-100">
                            {new Date(event.start).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Kuala_Lumpur' })}
                        </Text>
                        <Text className="font-psemibold text-sm text-secondary-100">
                            {new Date(event.start).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                        </Text>
                        <Text className="text-gray-600 text-xs font-pregular">
                            {new Date(event.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kuala_Lumpur' })}
                        </Text>
                    </View>

                    {/* Event Name & Location (70%) */}
                    <View className="ml-4 my-4 space-y-1 flex-[0.7]">
                        <Text className="font-psemibold text-base " numberOfLines={1} ellipsizeMode="tail">
                                {event.eventName}
                        </Text>

                        <Text className="text-gray-600 text-xs">📍 {event.location.fullAddress}</Text>
                    </View>
                </View>
                </TouchableOpacity>
              ))
            }
          </View>

        </ScrollView>
      </SafeAreaView>
    )}
        

        <StatusBar backgroundColor='#ffffff' style='auto' hidden={false} translucent={false} />
    </GestureHandlerRootView>
  )
}

export default MyRSVPs