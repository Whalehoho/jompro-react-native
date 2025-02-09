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
  const [senderProfileImageCache, setSenderProfileImageCache] = useState({}); // profile_img_url cache
  const [showModal, setShowModal] = useState(false);
  const [myEvents, setMyEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventsInMessages, setEventsInMessages] = useState([]);

  useEffect(() => {
    const fetchEventsInMessages = async () => {
      try {
        const eventMsgs = messages.filter((message) => message.type === 'event');
        if (eventMsgs.length === 0) return;
        const events = await Promise.all(eventMsgs.map((event) => api.event.getEvent(event.message)));
        setEventsInMessages(events);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
    };
    fetchEventsInMessages();
  }, [messages]);


  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const response = await api.event.getActiveEventsByOrganizerId(userId);
        setMyEvents(response.data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
    };
    fetchMyEvents();
  }, [userId]);


  useFocusEffect(useCallback(() => {

    setMessages([]); // Clear messages when changing channels
    setNewMessage(''); // Clear input when changing channels
    setMyEvents([]); // Clear events when changing channels
    setSelectedEvent(null); // Clear selected event when changing channels

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
  }, [channelId]));


  useFocusEffect(useCallback(() => {
    // Connect to chatroom
    socket.emit('joinRoom', channelId);

    // Listen for previous chat history
    socket.on('chatHistory', async (history) => {
      // console.log('Chat history:', history);

      // Loop through the history and fetch the profile image for each sender if not already cached
      for (let message of history) {
        const { senderId } = message;

        // Fetch the profile image URL for sender if not cached
        if (!senderProfileImageCache[senderId]) {
          const url = await api.user.getProfileUrlbyId(senderId);
          setSenderProfileImageCache((prev) => ({ ...prev, [senderId]: url.data }));
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
      message: newMessage,
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
              message: event.eventId,
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
                        source={{ uri: senderProfileImageCache[item.senderId].profile_img_url }}
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
                          {item.message}
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
                        source={{ uri: senderProfileImageCache[item.senderId].profile_img_url }}
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
                        source={{ uri: senderProfileImageCache[item.senderId].profile_img_url }}
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
                            onPress={() => { router.push(`/event-info?eventId=${item.message}`) }}
                          >

                            <Text className="flex flex-row items-center text-center">
                                Checkout my event!
                            </Text>

                            {'\n\n'}

                            {/* Event Name in Bold */}
                            <Text className="font-bold text-lg">
                              {eventsInMessages.find((event) => Number(event.data.eventId) === Number(item.message))?.data.eventName}
                            </Text>

                            {'\n\n'}📍

                            {/* Location in Italics */}
                            <Text className="italic">
                              {eventsInMessages.find((event) => Number(event.data.eventId) === Number(item.message))?.data.location.fullAddress}
                            </Text>

                            {'\n\n'}

                            {/* Date in a Different Color */}
                            <Text className={`${Number(item.senderId) === Number(userId) ? 'text-red-800' : 'text-blue-500'}`}>
                              📅 {new Date(eventsInMessages.find((event) => Number(event.data.eventId) === Number(item.message))?.data.startTime * 1000).toLocaleString('en-US', {
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
                        source={{ uri: senderProfileImageCache[item.senderId].profile_img_url }}
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
            <Text className="text-lg font-pmedium text-black text-center">Forward Your Events</Text>
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
            />
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

});
