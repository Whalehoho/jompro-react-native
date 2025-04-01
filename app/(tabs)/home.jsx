import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, FlatList, ActivityIndicator, TouchableWithoutFeedback, Keyboard, Modal, TouchableHighlight } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useState, useEffect, useCallback, use } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '../../components/CustomButton';
import { icons, images } from '../../constants';
import * as api from '../../api';
import { Link, router, useLocalSearchParams } from 'expo-router';
import Swiper from 'react-native-deck-swiper';
import { Dimensions } from 'react-native';

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

const { width, height } = Dimensions.get('window');

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
  const [similarUsersInEvent, setSimilarUsersInEvent] = useState([]);
  const [textInputAlign, setTextInputAlign] = useState('center');

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
      top_n: 15,
      states: selectedStates,
    };

    // Reset Swiper State
    setCurrentCardIndex(0);
    setDeckResetKey((prevKey) => prevKey + 1);
  };

  useFocusEffect(
    useCallback(() => {
      // When returning, ensure Swiper starts from the last swiped card
      setDeckResetKey((prevKey) => prevKey + 1);
    }, [])
  );

  useFocusEffect(useCallback(() => {
    // Check if user is logged in and selectedStates is not empty
    if (!user) return;
    if (selectedStates.length <= 0) return;

    // Fetch recommended events based on user ID and selected states
    const fetchRecommendedEvents = async () => {

      // Set request data
      const data = {
        user_id: user.userId,
        top_n: 15,
        states: selectedStates,
      };

      // Fetch recommended events from the backend via API
      const response = await api.event.getRecommendedEvents(data);

      // Get recommended event IDs and similarity scores
      const recommendedEventIdsAndSimilarityScores = response.data;

      // Extract recommended event IDs
      const recommendedEventIds = Object.values(recommendedEventIdsAndSimilarityScores)
        .flat()
        .map(item => item[0]);

      // Extract similarity scores
      const similarityScores = Object.values(recommendedEventIdsAndSimilarityScores)
        .flat()
        .map(item => item[1]);

      // Set similarity scores
      setSimilarityScores(similarityScores);

      // Flatten and track types
      const recommendationTypes = Object.entries(recommendedEventIdsAndSimilarityScores)
      .flatMap(([type, events]) => events.map(() => type));

      // Set recommendation types
      setRecommendationTypes(recommendationTypes);
    
      // Fetch recommended events from the backend using the recommended event IDs
      const recommendedEvents = await Promise.all(
        recommendedEventIds.map(async (eventId, index) => {
          const response = await api.event.getEvent(eventId);
          if(!response || !response.data) {
            setSimilarityScores((prev) => prev.filter((item, i) => i !== index));
            setRecommendationTypes((prev) => prev.filter((item, i) => i !== index));
          }
          return response.data;
        })
      );

      // Set recommended events
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

  const preprocessEvents = (events) => {
    return events.reduce((acc, event, index) => {
      //print all evenid in acc, acc is an array of event
      // console.log(acc.map(e => e.eventId));
      const eventId = String(event.eventId);
      // console.log('eventId:', eventId);

      // Find the index instead of using `find`
      const existingIndex = acc.findIndex(e => String(e.eventId) === eventId);

      if (existingIndex !== -1) {
        // console.log('eventId:', acc[existingIndex].eventId);
          // Create a shallow copy of the existing event (to maintain immutability)
          const updatedEvent = { ...acc[existingIndex] };

          // Handle content-based recommendation similarity score
          if (recommendationTypes[index] === 'content_based') {
              updatedEvent.similarityScore = updatedEvent.similarityScore ?? similarityScores[index];
          }

          // Handle user-based collaborative filtering
          if (recommendationTypes[index] === 'user_cf') {
              updatedEvent.similarUsers = similarityScores[index];

              // if (eventId === '86') {
              //     console.log(`Incrementing similarUsers for eventId: ${eventId} -> ${updatedEvent.similarUsers}`);
              // }
          }

          // Replace the old event with the updated one
          acc[existingIndex] = updatedEvent;
      } else {
          // Add new event with initial similarity score and similarUsers count
          acc.push({
              ...event,
              eventId, // Ensure consistent type
              similarityScore: recommendationTypes[index] === 'content_based' ? similarityScores[index] : undefined,
              similarUsers: recommendationTypes[index] === 'user_cf' ? 1 : 0,
          });
      }

      return acc;
    }, [])
    .sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));
  };

  // useEffect(() => {
  //   setPreprocessedEvents(preprocessEvents(recommendedEvents));
  //   setCurrentCardIndex(0); // Reset current index
  //   setDeckResetKey((prevKey) => prevKey + 1); // Force Swiper to refresh
  // }, [recommendedEvents]);
  

  const [preprocessedEvents, setPreprocessedEvents] = useState([]);
  const [deckResetKey, setDeckResetKey] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Load data only once when component mounts
  useEffect(() => {
    setPreprocessedEvents(preprocessEvents(recommendedEvents));
  }, [recommendedEvents]); // Re-run only if recommendedEvents changes

  const handleSwiped = (cardIndex) => {
    setCurrentCardIndex(cardIndex + 1); // Update the index when a card is swiped
    console.log(`Swiped card at index: ${cardIndex}`);

    if (cardIndex === preprocessedEvents.length - 1) {
      console.log("Resetting deck...");
      setCurrentCardIndex(0); 

      // Reset event list and force Swiper to re-render
      setPreprocessedEvents(preprocessEvents(recommendedEvents));
      setDeckResetKey((prevKey) => prevKey + 1);
    }
  };

  const renderCard = (event) => (
    <TouchableHighlight
      className="rounded-2xl"
      onPress={() => router.push(`/event-info?eventId=${event.eventId}`)}
      underlayColor="#fff"
    >
      <View
        key={event.eventId}
        className="rounded-2xl border-2 border-secondary shadow-lg p-4"
        style={{
          shadowColor: 'rgba(254, 204, 29, 0.8)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
          backgroundColor: 'rgba(254, 204, 29, 1)',
          minHeight: 400, // Ensures all cards have at least this height
        justifyContent: 'space-between', // Ensures content is evenly spaced
        }}
      >
        <Text className="text-secondary text-xl font-psemibold text-center mb-8">
          {event.eventName}
        </Text>
        
        <Text className="text-gray-700 text-base font-pregular text-center mb-6" numberOfLines={5} ellipsizeMode="tail">
          {event.eventAbout}
        </Text>
        
        <View className="flex-row justify-between items-center mt-2 border-t-0 pt-2 border-gray-700">
          <View className="items-center">
            <Text className="font-psemibold text-secondary-100">
              {new Date(event.startTime * 1000).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kuala_Lumpur' })}
            </Text>
            <Text className="font-pmedium text-gray-700">
              {new Date(event.startTime * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </Text>
          </View>
          
          <Text className="font-psemibold text-secondary-100">
            {new Date(event.startTime * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kuala_Lumpur' })}
          </Text>
        </View>
        
        <View className="mt-2 border-t-0 pt-2 border-black items-center">
          {event.similarityScore !== undefined && (
            <Text className="text-gray-700 text-base font-pbold">
              Similarity Score: {event.similarityScore.toFixed(2)}
            </Text>
          )}
          {event.similarUsers !== undefined && (
            <Text className="text-gray-700 text-base font-pbold">
              Similar Users: {event.similarUsers}
            </Text>
          )}
        </View>
      </View>
    </TouchableHighlight>
  );
  
  

  const handleYup = (card) => {
    console.log(`Yup for ${card.eventName}`);
  };

  const handleNope = (card) => {
    console.log(`Nope for ${card.eventName}`);
  };

  return (
    <>
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView className="flex-1 bg-white h-full">
        <View className="flex-row justify-around">
          <View className="flex-1 border-b-0 border-gray-800">
            <View className="relative pt-0 bg-primary">
              <TextInput
                className="h-12 my-3 mx-3 px-3 rounded-3xl bg-white pl-5"  // Add some left padding for space
                placeholder="Search for events & channels"
                value={query}
                onChangeText={setQuery}
                onFocus={() => {setIsFocused(true); setTextInputAlign('left')}} // Set focus to true when user focuses
                onBlur={() => {setIsFocused(false); setTextInputAlign('center')}} // Set focus to false when user blur
                style={{ textAlign: textInputAlign }}
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

        

        <View className="h-[5%] flex-row justify-between mx-3 mt-3 mb-2 items-start">
            <Text className="text-lg text-black font-pbold py-1">Recommended Events</Text>
            <TouchableOpacity className="bg-primary rounded-full p-4 w-[15%] h-[65%] items-center justify-center" onPress={()=>{ setShowModal(true); }}>
              <Image source={icons.filter} className="w-4 h-4" />
            </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          {preprocessedEvents.length > 0 && (
            <Swiper
              key={deckResetKey} // Forces re-render when deck is reset
              cards={preprocessedEvents}
              renderCard={(card, index) => {
                const relativeIndex = index - currentCardIndex; // Dynamic index for shifting effect
                return (
                  <View
                    style={{
                      transform: relativeIndex > 0 ? [{ translateX: relativeIndex * 10 }] : [],
                    }}
                  >
                    {renderCard(card)}
                  </View>
                );
              }}
              keyExtractor={(event) => event.eventId}
              onSwiped={handleSwiped}
              cardIndex={currentCardIndex} //Ensure Swiper starts from the last swiped card
              backgroundColor={'#fff'}
              cardVerticalMargin={20}
              stackSize={3} // Number of cards in the stack
              containerStyle={{
                position: 'absolute',
                top: height * 0.3, // Dynamically center based on screen height
                left: width * 0.4, // Dynamically center based on screen width
                transform: [{ translateX: -width * 0.4 }, { translateY: -height * 0.25 }], // Adjust dynamically
                width: width * 0.8, // Make Swiper width responsive
                height: height * 0.5, // Make Swiper height responsive
                justifyContent: 'center',
                alignItems: 'center',
              }}
            />
          )}
        </View>
        

        { recommendedEvents.length <= 0 && (
          <Image source={images.brokenRobot} className="w-[100%] h-[70%] mx-auto mb-[50%]" />
        )}

        

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
