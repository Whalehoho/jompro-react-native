import React, { useState, useEffect, useCallback, use } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Image, TouchableOpacity, Modal, Alert } from 'react-native';
import io from 'socket.io-client';
import { SOCKET_URL } from '../../config';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage'
// import FastImage from 'react-native-fast-image';
import * as api from '../../api';
import { icons } from '../../constants'
import { router, useLocalSearchParams } from 'expo-router';
import CustomButton from '../../components/CustomButton';

const socket = io(SOCKET_URL);

const Chatroom = () => {
  const { channelId } = useLocalSearchParams();
  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [senderProfileImageCache, setSenderProfileImageCache] = useState({}); // user_profile_img_url cache
  const [showModal, setShowModal] = useState(false);
  const [myEvents, setMyEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventsInMessages, setEventsInMessages] = useState([]);


  useEffect(() => {
    const fetchEventsInMessages = async () => {
      try {
        const eventMsgs = messages.filter((chatMessage) => chatMessage.type === 'event');
        if (eventMsgs.length === 0) return;
        const events = await Promise.all(eventMsgs.map((event) => api.event.getEvent(event.chatMessage)));
        setEventsInMessages(events);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
    };
    fetchEventsInMessages();
  }, [messages]);


  useEffect(() => {
    const fetchMyEventsInThisChannel = async () => {
      try {
        const response = await api.event.getActiveEventsByOrganizerId(userId);
        // console.log('My events:', response.data);
        const myEventsInThisChannel = response.data.filter((event) => event.channelId === channelId);
        setMyEvents(myEventsInThisChannel);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
    };
    fetchMyEventsInThisChannel();
  }, [userId]);


  useFocusEffect(useCallback(() => {

    setMessages([]); // Clear messages when changing channels
    setNewMessage(''); // Clear input when changing channels
    setSelectedEvent(null); // Clear selected event when changing channels

    const fetchUserId = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (!storedUser) {
          console.error('User not found in storage');
          return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUserId(parsedUser.userId);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUserId();
  }, [channelId]));

  // useEffect(() => {
  //   console.log(senderProfileImageCache);  // Logs the updated cache after state changes
  // }, [senderProfileImageCache]);


  useFocusEffect(useCallback(() => {
    // Connect to chatroom
    socket.emit('joinRoom', channelId);

    // Listen for previous chat history
    socket.on('chatHistory', async (history) => {
      // console.log('Chat history:', history);

      const fetchedSenderIds = new Set();  // Track senderIds we've already processed

      for (let message of history) {
        const { senderId } = message;

        // Skip fetching if senderId has already been processed
        if (!fetchedSenderIds.has(senderId)) {
          const url = await api.user.getProfileUrlbyId(senderId);
          
          // Update the cache with the new URL and mark senderId as processed
          setSenderProfileImageCache((prev) => ({
            ...prev,
            [senderId]: url.data,
          }));
          fetchedSenderIds.add(senderId);  // Mark senderId as processed
        }
      }


      setMessages(history);
    });

    // Listen for new messages
    socket.on('chatMessage', async (message) => {
      const { senderId } = message;

      // Fetch sender profile image if not cached
      if (!senderProfileImageCache[senderId]) {
        const url = await api.user.getProfileUrlbyId(senderId);
        setSenderProfileImageCache((prev) => ({ ...prev, [senderId]: url.data }));
      }

      setMessages((prev) => [...prev, message]);
    });

    // Cleanup listeners when unmounting
    return () => {
      socket.off('chatHistory');
      socket.off('chatMessage');
    };
  }, [channelId]));

  // Send message function
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    socket.emit('sendMessage', {
      channelId,
      chatMessage: newMessage,
      type: 'text',
      senderId: userId,
    });

    setNewMessage(''); // Clear input after sending
  };

  const handleEventSelection = (event) => {
    Alert.alert('Forward Event', `Are you sure you want to forward ${event.eventName} to this chat?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Forward',
          onPress: () => {
            setSelectedEvent(event);
            setShowModal(false);
            socket.emit('sendMessage', {
              channelId,
              chatMessage: event.eventId,
              type: 'event',
              senderId: userId,
            });
          },
        },
      ]
    );
  }

  return (
    <>
      <View style={styles.container}>
        <FlatList
          data={messages}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => {
            if (item.type === 'text') {
              return (
                <View style={Number(item.senderId) === Number(userId) ? styles.myMessageWrapper : styles.otherMessageWrapper}>

                  <View className="flex flex-row items-start">

                    {Number(item.senderId) !== Number(userId) && (
                      <Image
                        source={{ uri: senderProfileImageCache[item.senderId].user_profile_img_url }}
                        style={styles.profileImage}
                      />
                    )}

                    <View className="flex flex-[80%]">
                      <View className={`
                  flex flex-row items-center
                  ${(Number(item.senderId) === Number(userId)) ? 'justify-end' : 'justify-start'}
                  `}>

                        <Text className={`
                      text-base font-plight rounded-md p-3 border-0 border-gray-600
                      ${(Number(item.senderId) === Number(userId)) ? 'bg-secondary-300' : 'bg-primary'}
                    `}
                          style={{
                            minWidth: 50, // Set the minimum width for the message container
                          }}
                        >
                          {item.chatMessage}
                        </Text>

                      </View>

                      <View
                        style={[
                          styles.timestampContainer,
                          { alignSelf: Number(item.senderId) === Number(userId) ? 'flex-end' : 'flex-start' }
                        ]}>
                        <Text style={styles.sentAt}>
                          {new Date(item.sentAt * 1000).toLocaleString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true,
                          })}
                        </Text>
                      </View>


                    </View>


                    {Number(item.senderId) === Number(userId) && (
                      <Image
                        source={{ uri: senderProfileImageCache[item.senderId].user_profile_img_url }}
                        style={styles.profileImage}
                      />
                    )}


                  </View>
                </View>
              )
            } else {

              return (
                <View style={Number(item.senderId) === Number(userId) ? styles.myMessageWrapper : styles.otherMessageWrapper}>

                  <View className="flex flex-row items-start">

                    {Number(item.senderId) !== Number(userId) && (
                      <Image
                        source={{ uri: senderProfileImageCache[item.senderId].user_profile_img_url }}
                        style={styles.profileImage}
                      />
                    )}

                    <View className="flex flex-[80%]">
                      <View className={`
                        flex flex-row items-center
                        ${(Number(item.senderId) === Number(userId)) ? 'justify-end' : 'justify-start'}
                        `}>

                        <TouchableOpacity>
                          <Text
                            className={`text-base font-plight rounded-md p-3 border-2 border-gray-800 
                                  ${(Number(item.senderId) === Number(userId)) ? 'bg-secondary-300' : 'bg-primary'}`}
                            style={{ minWidth: 80, minHeight: 80 }}
                            onPress={() => { router.push(`/event-info?eventId=${item.chatMessage}`) }}
                          >

                            <Text className="flex flex-row items-center text-center">
                                Checkout my event!
                            </Text>

                            {'\n\n'}

                            {/* Event Name in Bold */}
                            <Text className="font-bold text-lg">
                              {eventsInMessages.find((event) => Number(event.data.eventId) === Number(item.chatMessage))?.data.eventName}
                            </Text>

                            {'\n\n'}📍

                            {/* Location in Italics */}
                            <Text className="italic">
                              {eventsInMessages.find((event) => Number(event.data.eventId) === Number(item.chatMessage))?.data.location.fullAddress}
                            </Text>

                            {'\n\n'}

                            {/* Date in a Different Color */}
                            <Text className={`${Number(item.senderId) === Number(userId) ? 'text-red-800' : 'text-blue-500'}`}>
                              📅 {new Date(eventsInMessages.find((event) => Number(event.data.eventId) === Number(item.chatMessage))?.data.startTime * 1000).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: true,
                                  })}
                            </Text>
                          </Text>

                        </TouchableOpacity>

                      </View>

                      <View
                        style={[
                          styles.timestampContainer,
                          { alignSelf: Number(item.senderId) === Number(userId) ? 'flex-end' : 'flex-start' }
                        ]}>
                        <Text style={styles.sentAt}>
                          {new Date(item.sentAt * 1000).toLocaleString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true,
                          })}
                        </Text>
                      </View>


                    </View>


                    {Number(item.senderId) === Number(userId) && (
                      <Image
                        source={{ uri: senderProfileImageCache[item.senderId].user_profile_img_url }}
                        style={styles.profileImage}
                      />
                    )}



                  </View>
                </View>
              )
            }

          }}
        />


        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={() => setShowModal(true)}>
            <Image source={icons.create} style={{ width: 26, height: 26, tintColor: '#7257ca' }} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
          />
          <TouchableOpacity onPress={sendMessage}>
            <Image source={icons.send} style={{ width: 30, height: 30, tintColor: '#7257ca' }} />
          </TouchableOpacity>
        </View>


      </View>

      <Modal visible={showModal} transparent={true} animationType="slide">
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="bg-white rounded-[10px] p-5 w-[300px] max-h-[400px]">
            <Text className="text-lg font-psemibold text-black text-center">Forward Event Within Channel</Text>
            <View style={styles.modalTitleseparator} />
            { myEvents.length > 0 && 
            <FlatList
              data={myEvents}
              keyExtractor={(item) => item.eventId.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="flex-row items-center justify-between border-b border-gray-300 py-2"
                  onPress={() => {
                    handleEventSelection(item);
                  }}
                >
                  <Text className="text-base font-pmedium text-black">{item.eventName}</Text>

                </TouchableOpacity>
              )}
            />}
            { myEvents.length <= 0 && 
              <Text className="text-base font-pmedium text-black text-center">You don't have any event hosted in this channel.</Text>}
            <CustomButton
              title="Close"
              handlePress={() => setShowModal(false)}
              containerStyles="w-full mt-7 rounded-md min-h-[48px]"
              textStyles="text-base"
            />
          </View>
        </View>
      </Modal>

    </>
  );
};

export default Chatroom;

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f5f5f5' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#1f2937', borderRadius: 15, padding: 10, backgroundColor: '#fecc1d' },
  input: { flex: 1, borderWidth: 2, borderColor: '#fecc1d', borderRadius: 5, paddingHorizontal: 10 },
  myMessageWrapper: {
    alignSelf: 'flex-end',
    marginVertical: 16, // space between messages
    maxWidth: '90%',
  },
  otherMessageWrapper: {
    alignSelf: 'flex-start',
    marginVertical: 16,
    maxWidth: '90%',
  },
  profileImage: {
    width: 40, // Set width of the profile image
    height: 40, // Set height of the profile image
    borderRadius: 50, // Make it circular
    margin: 5, // Add some space between the image and the message
  },
  messageContainer: {
    backgroundColor: '#DCF8C6', // background color for the message
    padding: 10,
    borderRadius: 5,
    width: '100%',
  },
  message: {
    backgroundColor: '#DCF8C6', // background color for the message
    padding: 10,
    borderRadius: 5,
  },
  timestampContainer: {
    marginTop: 3, // space between the message and timestamp
  },
  sentAt: {
    fontSize: 12,
    color: '#888', // Timestamp color
  },
  modalTitleseparator: {
    height: 1,
    backgroundColor: '#000',
    marginVertical: 2
  },
});
