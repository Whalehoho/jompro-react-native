import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef, use, useMemo  } from 'react';
import * as api from '../../api';
import CustomButton from '../../components/CustomButton';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useGlobalContext } from '../../context/GlobalProvider';
import UserProfileBottomSheet from '../../components/UserProfileBottomSheet';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';  // Import BottomSheetBackdrop
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { icons, images } from '../../constants';
import NewEventForm from '../../components/forms/NewEventForm';

const AttendeesProfileImages = ({ profiles }) => {
    return (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {profiles.slice(0, 3).map((profile, index) => (
            <Image
              key={index}
              source={{ uri: profile.userProfileImgUrl? profile.userProfileImgUrl : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFAMn65QIVqFZGQBV1otby9cY8r27W-ZGm_Q&s' }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 50,
                marginLeft: index === 0 ? 0 : -14, // Overlapping effect
                borderWidth: 1,
                borderColor: "white",
              }}
            />
          ))}
          {profiles.length > 3 && (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 50,
                marginLeft: -10,
                backgroundColor: "#555",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "white",
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>
                +{profiles.length - 3}
              </Text>
            </View>
          )}
        </View>
      );
};

const EventInfo = () => {
    const [userId, setUserId] = useState(null);
    const { eventId } = useLocalSearchParams(); // Get eventId from URL
    const { isEditingEvent, setIsEditingEvent } = useGlobalContext();
    const [ event, setEvent ] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    const textRef = useRef();
    const [organizerProfile, setOrganizerProfile] = useState(null);
    const [attendeesProfile, setAttendeesProfile] = useState(null);
    const [pendingProfiles, setPendingProfiles] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [channel, setChannel] = useState(null);
    const [myRSVP, setMyRSVP] = useState(null);
    const [mySubscription, setMySubscription] = useState(null);
    const [isMyEvent, setIsMyEvent] = useState(false);
    const [pendingRSVP, setPendingRSVP] = useState(false);
    const [showPendingRSVP, setShowPendingRSVP] = useState(false);
    const bottomSheetRef = useRef(null);
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);


    const [shouldRerender, setShouldRerender] = useState(false);

    const editBottomSheetRef = useRef(null);
    const [isEditBottomSheetOpen, setIsEditBottomSheetOpen] = useState(false);
    const snapPoints = useMemo(() => ['80%'], []);
    const [showEditForm, setShowEditForm] = useState(null);  // State to manage which form is shown
    const handleShowEditForm = (formType) => {
    setShowEditForm(formType); // Set the form type to show
    };
    const handleCloseEditForm = () => {
    setShowEditForm(null); // Close the form
    };

    const handleOpenEditBottomSheet = () => {
    editBottomSheetRef.current?.expand();
    setIsEditBottomSheetOpen(true);
    };

    const handleCloseEditBottomSheet = () => {
    editBottomSheetRef.current?.close();
    setIsEditBottomSheetOpen(false);
    setShowEditForm(null);
    setIsEditingEvent(false);
    };

    useEffect(() => {
        setShouldRerender(prev => !prev); // Toggle state to trigger re-render
    }, [isBottomSheetOpen, pendingRSVP, attendeesProfile]); // Runs every time bottom sheet opens/closes

    const handleBottomSheetClose = () => {
        setIsBottomSheetOpen(false);
    };

    const handleOpenBottomSheet = () => {
        setIsBottomSheetOpen(true);
        bottomSheetRef.current?.open();
    };

    useEffect(() => {
        if (!isEditingEvent) return;
        if(isEditingEvent && !isMyEvent){
            Alert.alert('Unauthorized', 'You are not authorized to edit this event');
            setIsEditingEvent(false);
            return;
        } else if (isEditingEvent && isMyEvent){
            handleOpenEditBottomSheet();
        }
    }, [isEditingEvent]);

    useEffect(() => {
        const fetchPendingRSVP = async () => {
            try {
                const response = await api.rsvp.getPendingByEventId(eventId);
                setPendingRSVP(response.data);
            } catch (error) {
                console.error('Failed to fetch event:', error);
            }
        };
        fetchPendingRSVP();
    }, [eventId, isBottomSheetOpen]);

    useEffect(() => {
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
    }, [eventId]);

    useEffect(() => {
            if(!userId) return;
            if(!event) return;
            if(!event.organizerId) return;
            if(Number(userId) === Number(event.organizerId)){ 
                setIsMyEvent(true);
            }
    }, [event, userId]);

    

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
                    const response = await api.rsvp.getByEventIdAndAccountId(eventId, parsedUser.userId);
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
                setOrganizerProfile(response.data.user_profile_img_url);
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
                const response = await api.rsvp.getApprovedByEventId(eventId);
                const attendees = response.data;
                const attendeesProfile = [];
                for (const attendee of attendees) {
                    const response = await api.user.getProfilebyId(attendee.userId);
                    attendeesProfile.push(response.data);
                }
                setAttendeesProfile(attendeesProfile);
            } catch (error) {
                console.error('Failed to fetch event:', error);
            }
        };
        fetchEventAttendeesProfile();
    },[event, isBottomSheetOpen]);

    useEffect(() => {
        if(!event) return;
        if(!pendingRSVP) return;
        const fetchEventPendingProfiles = async () => {
            try {
                const pendingProfiles = [];
                for (const pending of pendingRSVP) {
                    const response = await api.user.getProfilebyId(pending.userId);
                    pendingProfiles.push(response.data);
                }
                setPendingProfiles(pendingProfiles);
            } catch (error) {
                console.error('Failed to fetch event:', error);
            }
        };
        fetchEventPendingProfiles();
    },[pendingRSVP, isBottomSheetOpen]);


    useEffect(() => {
        if(!event) return;
        const fetchMySubscription = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    const response = await api.subscription.getSubscribedByChannelIdAndAccountId(parsedUser.userId, event.channelId);
                    setMySubscription(response.data);
                }
            } catch (error) {
                console.error('Failed to load user from storage:', error);
            }
        };
        fetchMySubscription();
    }, [event]);

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
            if(!myRSVP && !mySubscription && channel && channel.channelPrivacy === 'private'){
                Alert.alert("RSVP Request", "This is a private channel's event. You need to subscribe to the channel first before RSVP to this event.");
            }else if(!myRSVP && event.maxParticipants && attendeesProfile.length >= event.maxParticipants){
                Alert.alert(
                    'RSVP Request',
                    'Sorry, this event is full. You can\'t RSVP to this event anymore.',
                    [
                        {
                            text: 'OK',
                            onPress: () => setIsSubmitting(false),
                            style: 'cancel'
                        }
                    ]
                )
            }else if(!myRSVP && event.autoApprove === false){
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
                                    userId: parsedUser.userId,
                                    eventId: eventId,
                                    rsvpStatus: 'pending',
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
                                    userId: parsedUser.userId,
                                    eventId: eventId,
                                    rsvpStatus: 'approved',
                                };
                                const response = await api.rsvp.createRsvp(rsvpData);
                                setMyRSVP(response.data);
                            }
                        }
                    ]
                )
            }else if(myRSVP && myRSVP.rsvpStatus === 'approved'){
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
        <GestureHandlerRootView style={{ flex: 1 }}>
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
                                    {event && <Text className="text-gray-600 text-xs font-pmedium">{new Date(event.startTime * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kuala_Lumpur' })} - {new Date(event.startTime * 1000 + event.eventDuration * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kuala_Lumpur' })} ({event.eventDuration/3600} hours)</Text>}
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
                                    {event  && <Text className="font-psemibold text-lg text-gray-700">{event.eventLocation.region ? event.eventLocation.region : event.eventLocation.city ? event.eventLocation.city : 'NULL'}</Text>}
                                    {event && <Text className="text-gray-600 text-xs font-pmedium">{event.eventLocation.fullAddress ? event.eventLocation.fullAddress : 'NULL'}</Text>}
                                </View>
                                <View className="ml-2">
                                    <Image source={icons.next} tintColor='#374151' className="w-4 h-4 mr-1" />
                                </View>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity className="mb-2"onPress={ () => {
                            if (!channel) return;
                             router.push(`/channel-info?channelId=${channel.channelId}`);
                        }}>
                            <View className="mb-2 space-y-1">
                                {channel && <Text className="font-pbold text-sm text-gray-700">{channel.channelName}</Text>}
                                {channel && <Text className="text-gray-600 text-xs font-pmedium">{channel.channelPrivacy === 'private' ? 'Private Channel' : 'Public Channel'} </Text>}
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
                                <TouchableOpacity onPress={() => {
                                    bottomSheetRef.current?.setUserProfile({ userId: event.organizerId });
                                    bottomSheetRef.current?.setType('organizer');
                                    bottomSheetRef.current?.setToDo('view');
                                    bottomSheetRef.current?.setData(eventId);
                                    handleOpenBottomSheet();
                                }}>
                                    { organizerProfile && 
                                        <Image source={{ uri: organizerProfile? organizerProfile: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFAMn65QIVqFZGQBV1otby9cY8r27W-ZGm_Q&s' }} className="w-14 h-14 rounded-full ml-0 border-white border-1"
                                    /> }
                                </TouchableOpacity>
                            </View>
                        </View>
                        { !isMyEvent && (
                            <View className="space-y-2" style={{ flex: 0.5, alignItems: 'flex-start' }}>
                                <Text className="font-pbold text-xl text-gray-700">Attendees({attendeesProfile?.length}/{event?.maxParticipants})</Text>
                                <View className="flex-row">
                                    { attendeesProfile && 
                                        <AttendeesProfileImages profiles={attendeesProfile} /> }
                                </View>
                            </View>
                        )}

                    </View>

                    { isMyEvent && (
                        <>
                            <View style={styles.separator} className="mt-3 mb-2" />
                            <Text className="mx-4 my-2 font-pbold text-xl text-gray-700">Attendees({attendeesProfile?.length}/{event?.maxParticipants})</Text>
                            <View className="mx-4 mb-2 flex-row space-x-0">
                                <View shouldRerender={shouldRerender} style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
                                        {attendeesProfile?.map((profile, index) => (
                                            <TouchableOpacity key={index} onPress={() => {
                                                bottomSheetRef.current?.setUserProfile(profile);
                                                bottomSheetRef.current?.setType('attendees');
                                                bottomSheetRef.current?.setToDo('view');
                                                bottomSheetRef.current?.setData(eventId);
                                                handleOpenBottomSheet();
                                             }}>
                                                <Image
                                                key={index}
                                                source={{ uri: profile.userProfileImgUrl? profile.userProfileImgUrl : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFAMn65QIVqFZGQBV1otby9cY8r27W-ZGm_Q&s' }}
                                                style={{
                                                    width: 60,
                                                    height: 60,
                                                    borderRadius: 50,
                                                    margin: 4, // Space between images
                                                    borderWidth: 2,
                                                    borderColor: "white",
                                                }}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                        </View>
                            </View>
                            {showPendingRSVP && (
                                <>
                                <View style={styles.separator} className="mt-3 mb-2" />
                                    <Text className="mx-4 my-2 font-pbold text-xl text-gray-700">Requests({pendingProfiles?.length})</Text>
                                    <View className="mx-4 mb-2 flex-row space-x-0">
                                        <View shouldRerender={shouldRerender} style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
                                            {pendingProfiles?.map((profile, index) => (
                                                <TouchableOpacity key={index} onPress={() => { 
                                                    bottomSheetRef.current?.setUserProfile(profile);
                                                    bottomSheetRef.current?.setType('rsvp');
                                                    bottomSheetRef.current?.setToDo('edit');
                                                    bottomSheetRef.current?.setData(eventId);
                                                    handleOpenBottomSheet();
                                                }}>
                                                    <Image
                                                    key={index}
                                                    source={{ uri: profile.userProfileImgUrl? profile.userProfileImgUrl : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFAMn65QIVqFZGQBV1otby9cY8r27W-ZGm_Q&s' }}
                                                    style={{
                                                        width: 60,
                                                        height: 60,
                                                        borderRadius: 50,
                                                        margin: 4, // Space between images
                                                        borderWidth: 2,
                                                        borderColor: "white",
                                                    }}
                                                    />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                </View>
                                </>
                            )}
                            <TouchableOpacity onPress={async () => { 
                                    setShowPendingRSVP(!showPendingRSVP);
                                    const fetchPendingRSVP = async () => {
                                        try {
                                            const response = await api.rsvp.getPendingByEventId(eventId);
                                            setPendingRSVP(response.data);
                                        } catch (error) {
                                            console.error('Failed to fetch event:', error);
                                        }
                                    };
                                    await fetchPendingRSVP();
                                }} 
                                className="mt-2">
                                <Text className="text-blue-500 text-center font-pmedium">
                                    {showPendingRSVP ? "Hide Pending RSVP(s)" : "Show Pending RSVP(s)"}
                                </Text>
                            </TouchableOpacity>
                        </>
                        

                    )}

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

                    <View style={styles.separator} className="mt-0 mb-2" />
                    

                    { !isMyEvent && (
                        <View className="mx-4 flex-row space-x-0 mb-2">
                            <View style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'center' }}>
                            <Text className="font-pbold text-base text-gray-700"> Hurry up~</Text>
                                <Text className="font-pbold text-base text-gray-700"> {event?.maxParticipants - attendeesProfile?.length} spot(s) left!</Text>
                            </View>
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                <View className="flex-row items-center justify-center pb-4 pt-4">
                                    { myRSVP && myRSVP.rsvpStatus === 'approved' && 
                                        <CustomButton
                                            title="Cancel RSVP"
                                            handlePress={handleSubmit}
                                            containerStyles="w-4/5 mt-0 rounded-lg bg-primary"
                                            textStyles="text-base text-black"
                                            isLoading={isSubmitting}
                                        />
                                    }
                                    {
                                        myRSVP && myRSVP.rsvpStatus === 'pending' &&
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
                                            title="RSVP"
                                            handlePress={handleSubmit}
                                            containerStyles="w-3/5 mt-0 rounded-lg"
                                            textStyles="text-base"
                                            isLoading={isSubmitting}
                                    />
                                    }
                                    
                                </View>
                            </View>
                        </View>
                    )}
                    
                </ScrollView>
            </SafeAreaView>

            <UserProfileBottomSheet ref={bottomSheetRef} onClose={handleBottomSheetClose}/>

            

        <StatusBar backgroundColor='#ffffff' style='auto' hidden={false} translucent={false} />

        <BottomSheet
            ref={editBottomSheetRef}
            index={-1} // Initial state, -1 means closed, 0 means open
            snapPoints={snapPoints} // Different positions or heights that the bottom sheet can snap to
            enablePanDownToClose={true} // Enable the bottom sheet to be closed by panning down
            onClose={handleCloseEditBottomSheet} // Handle the closing of the bottom sheet
            backdropComponent={renderBackdrop} // Use the backdropComponent for the background
            backgroundStyle={{
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            backgroundColor: '#fecc1d',
            }}
        >
                <BottomSheetScrollView>
                <EditBottomSheetContent handleCloseEditForm={handleCloseEditForm} eventId={eventId}/>
                </BottomSheetScrollView>
        </BottomSheet>
        
        </GestureHandlerRootView>
    );
};

export default EventInfo

// Customize the backdrop to fade in/out
const renderBackdrop = (props) => (
  <BottomSheetBackdrop {...props} 
    disappearsOnIndex={-1}  // Backdrop disappears when sheet is fully closed
    appearsOnIndex={0}  // Backdrop appears when sheet is opened
    opacity={0.5}  // Control the opacity of the backdrop
  />
);

const EditBottomSheetContent = ({ handleCloseEditForm, eventId}) => {
    return (
      <ScrollView
        className="px-4 py-6"
        keyboardShouldPersistTaps={'handled'}  // Ensures that taps on touchable elements (like the address list) are registered even when the keyboard is open.
      >
        
        <NewEventForm onSubmit={handleCloseEditForm} eventId={eventId}/> 
        
      </ScrollView>
    );
};


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
      separator2: {
        height: 1,              
        backgroundColor: '#000', 
        marginVertical: 8,       
      },
})