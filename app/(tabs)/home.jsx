import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, FlatList, ActivityIndicator, TouchableWithoutFeedback, Keyboard, Modal, } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useState, useEffect, useCallback, use } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '../../components/CustomButton';
import { icons } from '../../constants';
import * as api from '../../api';
import { Link, router, useLocalSearchParams } from 'expo-router';

const states_in_malaysia = [
  'Johor', 
  'Kedah',
  'Kelantan',
  'Wilayah Persekutuan Kuala Lumpur',
  'Wilayah Persekutuan Labuan',
  'Malacca',
  'Negeri Sembilan',
  'Pahang',
  'Perak',
  'Perlis',
  'Penang',
  'Wilayah Persekutuan Putrajaya',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',

];

const Home = () => {
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false); // Track focus state
  const [rsvp, setRsvp] = useState([]);
  const [activeRsvp, setActiveRsvp] = useState([]);
  const [event, setEvent] = useState([]);
  const [channel, setChannel] = useState([]);
  const [subscription, setSubscription] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedStates, setSelectedStates] = useState(states_in_malaysia);
  const [similarityScores, setSimilarityScores] = useState([]);
  const [recommendationTypes, setRecommendationTypes] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);

  const toggleSelection = (state) => {
    setSelectedStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  const handleApply = async () => {
    setShowModal(false);
    // console.log('selected states:', selectedStates);
    const data = {
      user_id: user.userId,
      top_n: 3,
      states: selectedStates,
    };
  };

  useFocusEffect(useCallback(() => {
    if (!user) return;
    if (selectedStates.length <= 0) return;
    const fetchRecommendedEvents = async () => {
      const data = {
        user_id: user.userId,
        top_n: 3,
        states: selectedStates,
      };
      const response = await api.event.getRecommendedEvents(data);
      const recommendedEventIdsAndSimilarityScores = response.data;
      // console.log('recommendedEventIdsAndSimilarityScores:', recommendedEventIdsAndSimilarityScores);
      // recommendedEventIdsAndSimilarityScores: {"content_based": [["85", 0.7123641530615953], ["81", 0.4485347611419461], ["82", 0.37638632635454045], ["84", 0.36952156194051206], ["83", 0.36231772144642793], ["88", 0.3094747936219101], ["87", 0.263415555922654]], "user_cf": [["83", 2], ["86", 1]]}
      // use recommendedEvents to store the event data, including id, score, and type.
      // Extract recommended event IDs
      const recommendedEventIds = Object.values(recommendedEventIdsAndSimilarityScores)
        .flat()
        .map(item => item[0]);
      // console.log('recommendedEventIds', recommendedEventIds);
      // Extract similarity scores
      const similarityScores = Object.values(recommendedEventIdsAndSimilarityScores)
        .flat()
        .map(item => item[1]);
      setSimilarityScores(similarityScores);
      // console.log('similarityScores:', similarityScores);

      // Flatten and track types
      const recommendationTypes = Object.entries(recommendedEventIdsAndSimilarityScores)
      .flatMap(([type, events]) => events.map(() => type));

      setRecommendationTypes(recommendationTypes);
      // console.log('recommendationTypes:', recommendationTypes);

      const recommendedEvents = await Promise.all(
        recommendedEventIds.map(async (eventId, index) => {
          const response = await api.event.getEvent(eventId);
          if(!response || !response.data) {
            // remove the similarity score if the event is not found based on current index
            setSimilarityScores((prev) => prev.filter((item, i) => i !== index));
            setRecommendationTypes((prev) => prev.filter((item, i) => i !== index));
          }
          return response.data;
        })
      );
      setRecommendedEvents(recommendedEvents);
    };
    fetchRecommendedEvents();
  }, [user, selectedStates]));


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser)); // Parse the stored JSON string to an object
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if(rsvp.length <= 0) return;
    const fetchActiveRsvp = async () => {
      try {
        const activeRsvpData = await Promise.all(
          rsvp.map(async (item) => {
            const response = await api.event.getActiveByEventId(item.eventId);
            return response.data;
          })
        );
        setActiveRsvp(activeRsvpData.filter(item => item !== null && item !== undefined));
      } catch (error) {
        console.error('Failed to load active RSVPs:', error);
      }
    };
    fetchActiveRsvp();
  }, [rsvp]);

  useFocusEffect(useCallback(() => {
    if(!user) return;
    const fetchRsvpData = async () => {
      try {
        const response = await api.rsvp.getApprovedByAccountId(user.userId);
        if(!response) return;
        setRsvp(response.data);
      } catch (error) {
        console.error('Failed to load RSVPs:', error);
      }
    };
    const fetchOwnEventData = async () => {
      try {
        const response = await api.event.getAllByOrganizerId(user.userId);
        if(!response) return;
        setEvent(response.data);
      } catch (error) {
        console.error('Failed to load events:', error);
      }
    };
    const fetchOwnChannelData = async () => {
      try {
        const response = await api.channel.getChannelsByOwnerId(user.userId);
        if(!response) return;
        setChannel(response.data);
      } catch (error) {
        console.error('Failed to load channels:', error);
      }
    };
    const fetchSubscriptionData = async () => {
      try {
        const response = await api.subscription.getMySubscribed(user.userId);
        if(!response) return;
        setSubscription(response.data);
      } catch (error) {
        console.error('Failed to load subscriptions:', error);
      }
    };
    fetchRsvpData();
    fetchOwnEventData();
    fetchOwnChannelData();
    fetchSubscriptionData();
  }, [user]));

  // Debounce input to avoid frequent API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch combined results for events and channels
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await api.query.searchQuery(debouncedQuery);
        const data = response.data;
        // Combine results with labels
        const combinedResults = [
          ...data.events.map(event => ({ ...event, category: 'Event' })),
          ...data.channels.map(channel => ({ ...channel, category: 'Channel' }))
        ];
        setResults(combinedResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const handleClear = () => {
    setQuery(''); // Clears the input
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss(); // Dismiss the keyboard when tapping outside the search bar
    setQuery(''); // Clear the input
    setIsFocused(false); // Set focus to false when tapping outside
  };

  const renderItem = ({ item }) => {
    const handlePress = () => {
      if (item.eventId) {
        router.push(`/event-info?eventId=${item.eventId}`);
      } else if (item.channelId) {
        router.push(`/channel-info?channelId=${item.channelId}`);
      }
    };
  
    return (
      <TouchableOpacity className="p-3 border-t border-gray-800" onPress={handlePress}>
        <Text className="text-base font-pregular">{item.eventName || item.channelName}</Text>
        <Text className="text-sm text-secondary-200">{item.category}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView className="flex-1 bg-white h-full">
        <View className="flex-row justify-around">
          <View className="flex-1 border-b-0 border-gray-800">
            <View className="relative bg-primary">
              <TextInput
                className="h-12 my-3 mx-3 px-3 rounded-3xl bg-white pl-5"  // Add some left padding for space
                placeholder="Search for events & channels"
                value={query}
                onChangeText={setQuery}
                onFocus={() => setIsFocused(true)} // Set focus to true when user focuses
                onBlur={() => setIsFocused(false)} // Set focus to false when user blur
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={handleClear}
                  className="absolute right-7 top-1/3 transform -translate-y-1/2"
                >
                  <Text className="text-gray-600">✖</Text>
                </TouchableOpacity>
              )}
            </View>
              {loading && <ActivityIndicator size="small" color="#0000ff" />}
              {isFocused && results.length > 0 ? ( // Conditionally render FlatList based on focus
                <FlatList
                  data={results}
                  keyExtractor={(item) => `${item.category}-${item.eventId || item.channelId || item.id}`}
                  renderItem={renderItem}
                  className="mx-3 bg-primary border-x border-b border-gray-800 rounded-b-3xl"
                />
              ) : (
                isFocused && <Text className="p-5 text-center  bg-primary mx-3 text-gray-800 border border-gray-800 rounded-b-3xl">No results found</Text>
              )}
          </View>
        </View>

        <View className="h-[25%] bg-secondary-100 m-3 rounded-lg p-2 relative overflow-hidden">
          <View className="absolute top-[-80%] right-[25%] w-[200%] h-[210%] border-2 border-primary bg-secondary opacity-90 rounded-full" />
          <Text className="text-start text-2xl text-primary font-pbold mx-2 mt-3" onPress={()=>router.push('/my-details')}>{user ? user.userName : 'guest'}</Text>
          <View className="flex-row justify-start mt-4">
            <View className="flex-col justify-start">
              <View className="flex-col justify-start">
                <Text className="text-center text-base text-primary font-psemibold mx-2" onPress={()=>router.push('/my-rsvps')}>{event?event.length: 0}</Text>
                <Text className="text-center text-base text-primary font-psemibold mx-2">event</Text>
              </View>
              <View className="flex-col justify-start">
                <Text className="text-center text-base text-primary font-psemibold mx-2" onPress={()=>router.push('/my-rsvps')}>{activeRsvp?activeRsvp.length: 0}</Text>
                <Text className="text-center text-base text-primary font-psemibold mx-2">rsvp</Text>
              </View>
            </View>
            <View className="flex-col justify-start">
              <View className="flex-col justify-start">
                <Text className="text-center text-base text-primary font-psemibold mx-2" onPress={()=>router.push('/my-subscriptions')}>{channel?channel.length: 0}</Text>
                <Text className="text-center text-base text-primary font-psemibold mx-2">channel</Text>
              </View>
              <View className="flex-col justify-start">
                <Text className="text-center text-base text-primary font-psemibold mx-2" onPress={()=>router.push('/my-subscriptions')}>{subscription?subscription.length: 0}</Text>
                <Text className="text-center text-base text-primary font-psemibold mx-2">subscription</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="h-[5%] flex-row justify-between mx-3 mt-1 mb-2 items-start">
            <Text className="text-lg font-pbold py-1">Recommended Events</Text>
            <TouchableOpacity className="bg-primary rounded-full p-1 w-[15%] h-[65%] items-center justify-center" onPress={()=>{ setShowModal(true); }}>
              <Image source={icons.filter} className="w-4 h-4" />
            </TouchableOpacity>
        </View>

        <ScrollView className="mx-3 space-y-2">
          {recommendedEvents.reduce((acc, event, index) => {
            // Check if the event ID is already in the accumulator
            const existingEvent = acc.find(e => e.eventId === event.eventId);

            if (existingEvent) {
              // If the event already exists, merge the recommendation info
              const updatedEvent = { ...existingEvent };

              // Combine recommendationTypes and similarityScores
              if (recommendationTypes[index] === 'content_based') {
                updatedEvent.similarityScore = updatedEvent.similarityScore
                  ? updatedEvent.similarityScore
                  : similarityScores[index];
              }
              if (recommendationTypes[index] === 'user_cf') {
                updatedEvent.similarUsers = updatedEvent.similarUsers
                  ? updatedEvent.similarUsers + 1
                  : 1;
              }

              // Remove the existing event and push the updated version
              acc = acc.filter(e => e.eventId !== existingEvent.eventId);
              acc.push(updatedEvent);
            } else {
              // If the event is not in the accumulator, just add it
              acc.push({
                ...event,
                similarityScore: recommendationTypes[index] === 'content_based' ? similarityScores[index] : undefined,
                similarUsers: recommendationTypes[index] === 'user_cf' ? 1 : undefined,
              });
            }

            return acc;
          }, [])
            .sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0))
            .map((event, index) => (
            <TouchableOpacity
              key={index}
              className="rounded-lg border border-black"
              onPress={() => { router.push(`/event-info?eventId=${event.eventId}`) }}
            >
              <View className="flex-row rounded-lg bg-primary">
                {/* Date & Time Section (30%) */}
                <View className="my-4 space-y-2 flex-[0.3] border-r  border-black items-center justify-center">
                  <Text className="font-psemibold text-sm text-secondary">
                    {new Date(event.startTime * 1000).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Kuala_Lumpur' })}
                  </Text>
                  <Text className="font-psemibold text-sm text-secondary">
                    {new Date(event.startTime * 1000).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text className="text-secondary text-xs font-pregular">
                    {new Date(event.startTime * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kuala_Lumpur' })}
                  </Text>
                </View>

                {/* Event Name & Location (70%) */}
                <View className="ml-4 my-4 space-y-1 flex-[0.7]">
                  <Text className="font-psemibold text-base text-secondary" numberOfLines={1} ellipsizeMode="tail">
                    {event.eventName}
                  </Text>
                  <Text className="text-secondary-100 text-xs">📍 {event.eventLocation.fullAddress}</Text>

                  {/* Show similarity score and similar users only if applicable */}
                  {event.similarityScore && (
                    <Text className="text-black text-xs font-pbold">
                      Similarity Score: {event.similarityScore.toFixed(2)}
                    </Text>
                  )}
                  {event.similarUsers && (
                    <Text className="text-black text-xs font-pbold">
                      {event.similarUsers} similar user(s) in this event
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

      </SafeAreaView>
      </TouchableWithoutFeedback>

      <Modal visible={showModal} transparent={true} animationType="slide">
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white w-[90%] h-[90%] rounded-lg p-5">
            <Text className="text-center text-lg font-pbold mb-3">Select State</Text>
            <ScrollView className="mb-5">
              {states_in_malaysia.map((state, index) => (
                <TouchableOpacity
                  key={index}
                  className="flex-row items-center justify-between px-3 py-2 border-b border-gray-200"
                  onPress={() => toggleSelection(state)}
                >
                  <Text className="text-base">{state}</Text>
                  <Text className={`text-lg ${selectedStates.includes(state) ? 'text-blue-500' : 'text-gray-300'}`}>
                    {selectedStates.includes(state) ? '✔️' : '⬜'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <CustomButton title="Apply Filter" handlePress={() => handleApply()} />
          </View>
        </View>
      </Modal>

    </>
  );
};

export default Home;
