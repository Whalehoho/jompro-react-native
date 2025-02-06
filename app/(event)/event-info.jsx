import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef, use } from 'react';
import * as api from '../../api';
import CustomButton from '../../components/CustomButton';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useGlobalContext } from '../../context/GlobalProvider';

import { icons, images } from '../../constants';

const AttendeesProfileImages = ({ profileUrls }) => {
    return (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {profileUrls.slice(0, 4).map((url, index) => (
            <Image
              key={index}
              source={{ uri: url }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 25,
                marginLeft: index === 0 ? 0 : -10, // Overlapping effect
                borderWidth: 2,
                borderColor: "white",
              }}
            />
          ))}
          {profileUrls.length > 4 && (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 25,
                marginLeft: -10,
                backgroundColor: "#555",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: "white",
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>
                +{profileUrls.length - 4}
              </Text>
            </View>
          )}
        </View>
      );
};

const EventInfo = () => {
    const { eventId } = useLocalSearchParams(); // Get eventId from URL
    const { starredEvents, setIsEventStarred } = useGlobalContext();
    const [ event, setEvent ] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    const textRef = useRef();
    const [organizerProfile, setOrganizerProfile] = useState(null);
    const [attendeesProfile, setAttendeesProfile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [channel, setChannel] = useState(null);
    const [myRSVP, setMyRSVP] = useState(null);
    

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
        const fetchMyRSVP = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    const response = await api.rsvp.getByEventIdAndAccountId(eventId, parsedUser.accountId);
                    if(!response){ 
                        setMyRSVP(null);
                    } else {
                        setMyRSVP(response.data);
                    }
                }
            } catch (error) {
                console.error('Failed to load user from storage:', error);
            }
        };
        fetchEvent();
        fetchMyRSVP();
    }, [eventId]);

    useEffect(() => {
        if (!event) return;
        const fetchChannel = async () => {
            try {
                const response = await api.channel.getChannelByChannelId(event.channelId);
                setChannel(response.data);
            } catch (error) {
                console.error('Failed to fetch channel:', error);
            }
        };
        fetchChannel();
    }, [event]);

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

    useEffect(() => {
        if(!event) return;
        const fetchEventOrganizerProfile = async () => {
            try {
                const response = await api.user.getProfileUrlbyId(event?.organizerId);
                setOrganizerProfile(response.data.profile_img_url);
            } catch (error) {
                console.error('Failed to fetch event:', error);
            }
        };
        fetchEventOrganizerProfile();
    }, [event]);

    useEffect(() => {
        if(!event) return;
        const fetchEventAttendeesProfile = async () => {
            try {
                const response = await api.rsvp.getByEventId(eventId);
                const attendees = response.data;
                const attendeesProfile = [];
                for (const attendee of attendees) {
                    const response = await api.user.getProfileUrlbyId(attendee.accountId);
                    attendeesProfile.push(response.data.profile_img_url);
                }
                setAttendeesProfile(attendeesProfile);
            } catch (error) {
                console.error('Failed to fetch event:', error);
            }
        };
        fetchEventAttendeesProfile();
    },[event]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const storedUser = await AsyncStorage.getItem('user');
            if (!storedUser) {
                console.error('User not found in storage');
                setIsSubmitting(false);
                return;
            }
            const parsedUser = JSON.parse(storedUser);
            if(!myRSVP && event.autoApprove === false){
                Alert.alert(
                    'RSVP Request',
                    'Are you sure you want to RSVP to this event?',
                    [
                        {
                            text: 'Never mind',
                            onPress: () => setIsSubmitting(false),
                            style: 'cancel'
                        },
                        {
                            text: 'OK',
                            onPress: async () => {
                                const rsvpData = {
                                    accountId: parsedUser.accountId,
                                    eventId: eventId,
                                    status: 'pending',
                                };
                                const response = await api.rsvp.createRsvp(rsvpData);
                                setMyRSVP(response.data);
                            }
                        }
                    ]
                )
            } else if (!myRSVP && event.autoApprove === true){
                Alert.alert(
                    'RSVP Request',
                    'Are you sure you want to RSVP to this event?',
                    [
                        {
                            text: 'Never mind',
                            onPress: () => setIsSubmitting(false),
                            style: 'cancel'
                        },
                        {
                            text: 'OK',
                            onPress: async () => {
                                const rsvpData = {
                                    accountId: parsedUser.accountId,
                                    eventId: eventId,
                                    status: 'approved',
                                };
                                const response = await api.rsvp.createRsvp(rsvpData);
                                setMyRSVP(response.data);
                            }
                        }
                    ]
                )
            }else if(myRSVP && myRSVP.status === 'approved'){
                Alert.alert(
                    'Cancel RSVP',
                    'Are you sure you want to cancel your RSVP to this event?',
                    [
                        {
                            text: 'Never mind',
                            onPress: () => setIsSubmitting(false),
                            style: 'cancel'
                        },
                        {
                            text: 'OK',
                            onPress: async () => {
                                const response = await api.rsvp.deleteRsvp(myRSVP.rsvpId);
                                setMyRSVP(null);
                            }
                        }
                    ]
                )

            }

            // TO BE IMPLEMENTED:
            // Send RSVP request to the server
            // const response = await api.rsvp.createRsvp(eventId);
            // console.log(response);
            setIsSubmitting(false);
        } catch (error) {
            console.error('Failed to submit RSVP:', error);
            setIsSubmitting(false);
        }
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
                        {event && <Text className="text-2xl font-pbold mt-2" style={{ lineHeight: 40 }}>{event.eventName}</Text>}
                    </View>
                    <View className="mx-4 my-2 flex-col space-y-4">
                        <TouchableOpacity className="mt-2 mb-2"onPress={ () => {}}>
                            <View className="flex-row items-start justify-start">
                                <View>
                                    <Image source={icons.calendar} tintColor='#374151' className="w-6 h-6" />
                                </View>
                                <View className="ml-4 space-y-1 flex-1">
                                    {event && <Text className="font-psemibold text-lg text-gray-700">{new Date(event.startTime * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Kuala_Lumpur' })}</Text>}
                                    {event && <Text className="text-gray-600 text-xs font-pmedium">{new Date(event.startTime * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kuala_Lumpur' })} - {new Date(event.startTime * 1000 + event.duration * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kuala_Lumpur' })} </Text>}
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
                                    {event  && <Text className="font-psemibold text-lg text-gray-700">{event.location.region ? event.location.region : event.location.city ? event.location.city : 'NULL'}</Text>}
                                    {event && <Text className="text-gray-600 text-xs font-pmedium">{event.location.fullAddress ? event.location.fullAddress : 'NULL'}</Text>}
                                </View>
                                <View className="ml-2">
                                    <Image source={icons.next} tintColor='#374151' className="w-4 h-4 mr-1" />
                                </View>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity className="mb-4"onPress={ () => {
                            if (!channel) return;
                             router.push(`/channel-info?channelId=${channel.channelId}`);
                        }}>
                            <View className="mb-4 space-y-1">
                                {channel && <Text className="font-pbold text-sm text-gray-700">{channel.channelName}</Text>}
                                {channel && <Text className="text-gray-600 text-xs font-pmedium">{channel.privacy === 'private' ? 'Private Channel' : 'Public Channel'} </Text>}
                            </View>
                        </TouchableOpacity>
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

                    <View className="mx-4 my-2 flex-row space-x-0">
                        <View className="space-y-2" style={{ flex: 0.5, alignItems: 'flex-start' }}>
                            <Text className="font-pbold text-xl text-gray-700">Hosted By</Text>
                            <View className="flex-row">
                                { organizerProfile && 
                                    <Image source={{ uri: organizerProfile }} className="w-11 h-11 rounded-full ml-0"
                                /> }
                            </View>
                        </View>
                        <View className="space-y-2" style={{ flex: 0.5, alignItems: 'flex-start' }}>
                            <Text className="font-pbold text-xl text-gray-700">Attendees({attendeesProfile?.length}/{event?.maxParticipants})</Text>
                            <View className="flex-row">
                                { attendeesProfile && 
                                    <AttendeesProfileImages profileUrls={attendeesProfile} /> }
                            </View>
                        </View>
                    </View>

                    <View style={styles.separator} className="mt-3 mb-2" />

                    <View className="mx-4 my-2 flex-col space-y-4">
                        <View className="flex-row items-start justify-start">
                            <View>
                                <Image source={icons.gender} tintColor='#374151' className="w-6 h-6" />
                            </View>
                            <View className="ml-4 space-y-1 flex-1">
                                {event?.genderRestriction === 'Male' && <Text className="font-psemibold text-lg text-gray-700">Male only</Text>}
                                {event?.genderRestriction === 'Female' && <Text className="font-psemibold text-lg text-gray-700">Female only</Text>}
                                {event?.genderRestriction === 'No restrictions' && <Text className="font-psemibold text-lg text-gray-700">Open to all gender</Text>}
                            </View>
                        </View>
                        <View className="flex-row items-start justify-start">
                            <View>
                                <Image source={icons.age} tintColor='#374151' className="w-6 h-6" />
                            </View>
                            <View className="ml-4 space-y-1 flex-1">
                                {event?.ageRestriction?.min === -1 && event?.ageRestriction?.max === -1 && <Text className="font-psemibold text-lg text-gray-700">Open to all age</Text>}
                                {event?.ageRestriction?.min === 18 &&event?.ageRestriction?.max === 50 && <Text className="font-psemibold text-lg text-gray-700">Adult only (18-50)</Text>}
                                {event?.ageRestriction?.min === 50 && <Text className="font-psemibold text-lg text-gray-700">Senior only (50+)</Text>}
                            </View>
                        </View>
                        <View className="flex-row items-start justify-start">
                            <View>
                                <Image source={icons.approved} tintColor='#374151' className="w-6 h-6" />
                            </View>
                            <View className="ml-4 space-y-1 flex-1">
                                {event?.autoApprove && <Text className="font-psemibold text-lg text-gray-700">Auto-approve</Text>}
                                {!event?.autoApprove && <Text className="font-psemibold text-lg text-gray-700">RSVP will be reviewed</Text>}
                            </View>
                        </View>
                    </View>

                    <View style={styles.separator} className="mt-0 mb-0" />
                    

                    <View className="mx-4 flex-row space-x-0">
                        <View style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'center' }}>
                        <Text className="font-pbold text-base text-gray-700"> Hurry up~</Text>
                            <Text className="font-pbold text-base text-gray-700"> {event?.maxParticipants - attendeesProfile?.length} spot(s) left!</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <View className="flex-row items-center justify-center pb-4 pt-4">
                                { myRSVP && myRSVP.status === 'approved' && 
                                    <CustomButton
                                        title="Cancel RSVP"
                                        handlePress={handleSubmit}
                                        containerStyles="w-4/5 mt-0 rounded-lg bg-primary"
                                        textStyles="text-base text-black"
                                        isLoading={isSubmitting}
                                    />
                                }
                                {
                                    myRSVP && myRSVP.status === 'pending' &&
                                    <CustomButton
                                        title="Pending"
                                        handlePress={handleSubmit}
                                        containerStyles="w-4/5 mt-0 rounded-lg"
                                        textStyles="text-base"
                                        isLoading={isSubmitting}
                                        disabled={true}
                                    />
                                }
                                {
                                    !myRSVP &&
                                    <CustomButton
                                        title="Join & RSVP"
                                        handlePress={handleSubmit}
                                        containerStyles="w-4/5 mt-0 rounded-lg"
                                        textStyles="text-base"
                                        isLoading={isSubmitting}
                                />
                                }
                                
                            </View>
                        </View>
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