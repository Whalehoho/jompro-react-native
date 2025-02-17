import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef, use, forwardRef } from 'react';
import * as api from '../../api';
import CustomButton from '../../components/CustomButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';  // Import BottomSheetBackdrop
import { icons, images } from '../../constants';
import UserProfileBottomSheet from '../../components/UserProfileBottomSheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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




const MAX_VISIBLE_EVENTS = 3;

const ChannelInfo = () => {
    const { channelId } = useLocalSearchParams();
    const [channel, setChannel] = useState(null);
    const [icon, setIcon] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    const textRef = useRef();
    const [ownerProfile, setOwnerProfile] = useState(null);
    const [membersProfile, setMembersProfile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mySubscription, setMySubscription] = useState(null);
    const [events, setEvents] = useState([]);
    const [showAllEvents, setShowAllEvents] = useState(false);
    const [userId, setUserId] = useState(null);
    const [isMyChannel, setIsMyChannel] = useState(false);
    const [showPendingSubscriptions, setShowPendingSubscriptions] = useState(false);
    const [pendingSubscriptions, setPendingSubscriptions] = useState(null);
    const [subscribersProfile, setSubscribersProfile] = useState(null);
    const bottomSheetRef = useRef(null);
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

    

    const displayedEvents = showAllEvents ? events : events.slice(0, MAX_VISIBLE_EVENTS);

    const [shouldRerender, setShouldRerender] = useState(false);

    useEffect(() => {
        setShouldRerender(prev => !prev); // Toggle state to trigger re-render
    }, [isBottomSheetOpen, pendingSubscriptions, membersProfile]); // Runs every time bottom sheet opens/closes


    useEffect(() => {
        if(!channel) return;
        if(!userId) return;
        if(!channel.ownerId) return;
        if(Number(userId) === Number(channel.ownerId)) {
            setIsMyChannel(true);
        }
    }, [channel, userId]);
    
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
    }, [channelId]);

    useEffect(() => {
        const fetchChannel = async () => {
            try {
                const response = await api.channel.getChannelByChannelId(channelId);
                setChannel(response.data);
                const category = categories.find(cat => cat.title === response.data.category);
                setIcon(category.icon);
            } catch (error) {
                console.error('Error fetching channel:', error);
            }
        };
        fetchChannel();
    }, [channelId]);


    const formatChannelDesc = (desc) => {
        if(!desc) return '';
        // Replace HTML <br> tags with new lines or any other form of line breaks
        const formattedText = desc.replace(/<br\s*\/?>/g, '\n');
        return formattedText;
    };

    useEffect(() => {
            const lineCount = countNewLines(channel?.channelDesc);
            setIsTruncated(lineCount > 10); // Show "Read More" if there are more than 10 lines
    }, [channel]);

    const countNewLines = (text) => {
        if (!text) return 0;
        return (text.match(/\n/g) || []).length;  // Count the number of '\n' occurrences
    };

    const toggleReadMore = () => {
        setIsExpanded(!isExpanded);
    };

    useEffect(() => {
        if(!channel) return;
        const fetchOwnerProfile = async () => {
            try {
                const response = await api.user.getProfileUrlbyId(channel.ownerId);
                setOwnerProfile(response.data.user_profile_img_url);
            } catch (error) {
                console.error('Error fetching owner profile:', error);
            }
        };
        fetchOwnerProfile();
    }, [channel]);

    useEffect(() => {
        if(!channel) return;
        const fetchMembersProfile = async () => {
            try {
                const response = await api.subscription.getSubscribedByChannelId(channel.channelId);
                const members = response.data;
                const membersProfile = [];
                for (const member of members) {
                    const response = await api.user.getProfilebyId(member.subscriberId);
                    membersProfile.push(response.data);
                }
                setMembersProfile(membersProfile);
            } catch (error) {
                console.error('Error fetching members profile:', error);
            }
        };
        fetchMembersProfile();
    }, [channel, isBottomSheetOpen]);

    useEffect(() => {
        if(!channel) return;
        const fetchMySubscription = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                if (!storedUser) {
                    console.error('User not found in storage');
                    return;
                }
                const parsedUser = JSON.parse(storedUser);
                const response = await api.subscription.getSubscribedByChannelIdAndAccountId(parsedUser.userId, channel.channelId);
                setMySubscription(response.data);
            } catch (error) {
                console.error('Error fetching my subscription:', error);
            }
        };
        fetchMySubscription();
    }, [channel]);

    useEffect(() => {
        if(!channel) return;
        const fetchPendingSubscriptions = async () => {
            try {
                const response = await api.subscription.getPendingbyChannelId(channel.channelId);
                setPendingSubscriptions(response.data);
            } catch (error) {
                console.error('Error fetching pending subscriptions:', error);
            }
        };
        fetchPendingSubscriptions();
    }, [channel, isBottomSheetOpen]);

    useEffect(() => {
        if(!channel) return;
        const fetchEvents = async () => {
            try {
                const response = await api.event.getActiveEventsByChannelId(channel.channelId);
                setEvents(response.data);
            } catch (error) {
                console.error('Error fetching events:', error);
            }
        };
        fetchEvents();
    }, [channel]);

    const handleBottomSheetClose = () => {
        setIsBottomSheetOpen(false);
    };

    const handleOpenBottomSheet = () => {
        setIsBottomSheetOpen(true);
        bottomSheetRef.current?.open();
    };

    const ProfileImages = forwardRef(({ profiles, type, toDo, data }, bottomSheetRef) => {
        return (
            <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
              {profiles.map((profile, index) => (
                <TouchableOpacity key={index} onPress={() => {
                    bottomSheetRef.current?.setUserProfile(profile);
                    bottomSheetRef.current?.setType(type);
                    bottomSheetRef.current?.setToDo(toDo);
                    bottomSheetRef.current?.setData(data);
                    handleOpenBottomSheet();
                 }}>
                    <Image
                    key={index}
                    source={{ uri: profile.userProfileImgUrl? profile.userProfileImgUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFAMn65QIVqFZGQBV1otby9cY8r27W-ZGm_Q&s'}}
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
        );
    });

    useEffect(() => {
        if(!pendingSubscriptions) return;
        const fetchSubscribersProfile = async () => {
            try {
                const subscribers = pendingSubscriptions;
                const subscribersProfile = [];
                for (const subscriber of subscribers) {
                    const response = await api.user.getProfilebyId(subscriber.subscriberId);
                    subscribersProfile.push(response.data);
                }
                setSubscribersProfile(subscribersProfile);
            } catch (error) {
                console.error('Error fetching subscribers profile:', error);
            }
        };
        fetchSubscribersProfile();
    }, [pendingSubscriptions, isBottomSheetOpen]);

    

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
            if(!mySubscription && channel && channel.privacy === 'private') {
                Alert.alert('Private Channel', 'This is a private channel. Do you want to subscribe?', [
                    {
                        text: 'Never mind',
                        style: 'cancel',
                        onPress: () => setIsSubmitting(false)
                    },
                    {
                        text: 'Ok',
                        onPress: async () => {
                            const subscription = {
                                subscriberId: parsedUser.userId,
                                channelId: channel.channelId,
                                status: 'pending'
                            };
                            const response = await api.subscription.subscribe(subscription);
                            setMySubscription(response.data);
                            setIsSubmitting(false);
                        }
                    }
                ]);
            } else if(!mySubscription && channel && channel.privacy === 'public') {
                Alert.alert('Subscribe to Channel', 'Do you want to subscribe?', [
                    {
                        text: 'Never mind',
                        style: 'cancel',
                        onPress: () => setIsSubmitting(false)
                    },
                    {
                        text: 'Ok',
                        onPress: async () => {
                            const subscription = {
                                subscriberId: parsedUser.userId,
                                channelId: channel.channelId,
                                status: 'subscribed'
                            };
                            const response = await api.subscription.subscribe(subscription);
                            setMySubscription(response.data);
                            setIsSubmitting(false);
                        }
                    }
                ]);
            }else if(mySubscription && mySubscription.status === 'subscribed') {
                Alert.alert('Unsubscribe', 'Do you want to unsubscribe?', [
                    {
                        text: 'Never mind',
                        style: 'cancel',
                        onPress: () => setIsSubmitting(false)
                    },
                    {
                        text: 'Ok',
                        onPress: async () => {
                            await api.subscription.unsubscribe(mySubscription.subscriptionId);
                            setMySubscription(null);
                            setIsSubmitting(false);
                        }
                    }
                ]);
            }
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
                    <View className="mx-4 mb-6 space-y-2">
                        {channel && <Text className="text-2xl font-pbold mt-2" style={{ lineHeight: 40 }}>{channel.channelName}</Text>}
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row space-x-2">
                                {channel && 
                                    <Text className="text-secondary-100 text-sm font-pmedium">{channel.category}</Text>
                                }
                                {icon && 
                                    <Image source={icon} className="w-4 h-4" tintColor={'#7257ca'}/>
                                }    
                            </View>
                            <Text className="text-secondary-100 text-sm font-pmedium">{channel?.privacy === 'private' ? 'Private channel' : 'Public channel'}</Text>
                        </View>
                    </View>

                    <View style={styles.separator} className="mt-0 mb-4" />

                    <View className="mx-4 space-y-2 mb-4" style={{ flex: 0.5, alignItems: 'flex-start' }}>
                        <Text className="font-pbold text-xl text-gray-700">Owner</Text>
                        <TouchableOpacity onPress={() => {
                            bottomSheetRef.current?.setUserProfile({userId: channel.ownerId});
                            bottomSheetRef.current?.setType("owner");
                            bottomSheetRef.current?.setToDo("view");
                            bottomSheetRef.current?.setData(channel.channelId);
                            handleOpenBottomSheet();
                        }}>
                            <View className="flex-row">
                                { ownerProfile && 
                                    <Image source={{ uri: ownerProfile? ownerProfile : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFAMn65QIVqFZGQBV1otby9cY8r27W-ZGm_Q&s' }} className="w-14 h-14 rounded-full ml-0" />
                                }
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.separator} className="mt-2 mb-4" />

                    <View className="mx-4 space-y-2 mb-4" style={{ flex: 0.5, alignItems: 'flex-start' }}>
                        <Text className="font-pbold text-xl text-gray-700">Members({membersProfile?membersProfile.length:''})</Text>
                        <View className="flex-row">
                            { membersProfile && 
                                <ProfileImages profiles={membersProfile} ref={bottomSheetRef} type={"members"} toDo={isMyChannel ? "edit" : "view"} data={channel.channelId} shouldRerender={shouldRerender}/> }
                        </View>
                    </View>

                    {isMyChannel && showPendingSubscriptions && (
                        <>
                            <View style={styles.separator} className="mt-4 mb-4" />
                                <View className="mx-4 space-y-2 mb-4" style={{ flex: 0.5, alignItems: 'flex-start' }}>
                                <Text className="font-pbold text-xl text-gray-700">Requests({subscribersProfile?subscribersProfile.length:''})</Text>
                                <View className="flex-row">
                                    { subscribersProfile && 
                                        <ProfileImages profiles={subscribersProfile} ref={bottomSheetRef} type={"subscriptions"} toDo={"edit"} data={channel.channelId} shouldRerender={shouldRerender}/> }
                                </View>
                            </View>
                        </>
                    )}

                    {isMyChannel && (
                            <TouchableOpacity onPress={async () => { 
                                    setShowPendingSubscriptions(!showPendingSubscriptions);
                                    const fetchPendingSubscriptions = async () => {
                                        try {
                                            const response = await api.subscription.getPendingbyChannelId(channelId);
                                            setPendingSubscriptions(response.data);
                                        } catch (error) {
                                            console.error('Error fetching pending subscriptions:', error);
                                        }
                                    };
                                    await fetchPendingSubscriptions();
                                }} 
                                className="mt-2">
                                <Text className="text-blue-500 text-center font-pmedium">
                                    {showPendingSubscriptions ? "Hide Pending Subscription(s)" : "Show Pending Subscription(s)"}
                                </Text>
                            </TouchableOpacity>
                    )}

                    

                    <View style={styles.separator} className="mt-4 mb-4" />


                    <View className="mx-4 mb-2 space-y-2">
                        <Text className="font-pbold text-xl text-gray-700">About</Text>
                        <Text className="text-gray-600 text-sm font-pmedium" style={{
                                lineHeight: 24,         // Adjust line spacing for better readability
                                marginTop: 20,          // Adds space above the text
                            }}
                            ref={textRef}
                        >
                            {isExpanded? formatChannelDesc(channel?.channelDesc) : `${formatChannelDesc(channel?.channelDesc).split('\n').slice(0, 10).join('\n')}`}
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

                    <View style={styles.separator} className="mt-2 mb-4" />


                    <View className="mx-4 mb-2 space-y-2">
                        <Text className="font-pbold text-xl text-gray-700 mb-2">Recent Events({events?.length})</Text>

                        {displayedEvents.map((event, index) => (
                            <TouchableOpacity key={index} className="mt-2 mb-2 bg-primary rounded-lg" onPress={() => { router.push(`/event-info?eventId=${event.eventId}`) }}>
                                <View className="flex-row border border-black rounded-lg">
                                    {/* Date & Time Section (30%) */}
                                    <View className="my-4 space-y-2 flex-[0.3] border-r border-black items-center justify-center">
                                        <Text className="font-psemibold text-sm text-secondary-100">
                                            {new Date(event.startTime * 1000).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Kuala_Lumpur' })}
                                        </Text>
                                        <Text className="font-psemibold text-sm text-secondary-100">
                                            {new Date(event.startTime * 1000).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })}
                                        </Text>
                                        <Text className="text-gray-600 text-xs font-pregular">
                                            {new Date(event.startTime * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kuala_Lumpur' })}
                                        </Text>
                                    </View>

                                    {/* Event Name & Location (70%) */}
                                    <View className="ml-4 my-4 space-y-1 flex-[0.7]">
                                        <Text className="font-psemibold text-lg " numberOfLines={1} ellipsizeMode="tail">
                                                {event.eventName}
                                        </Text>

                                        <Text className="text-gray-600 text-xs">📍 {event.location.fullAddress}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}

                        {/* View More Button */}
                        {events.length > MAX_VISIBLE_EVENTS && (
                            <TouchableOpacity onPress={() => setShowAllEvents(!showAllEvents)} className="mt-2">
                                <Text className="text-blue-500 text-center font-pmedium">
                                    {showAllEvents ? "View Less" : "View More"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.separator} className="mt-4 mb-3" />

                    {!isMyChannel && (
                        <View className="flex-row items-center justify-center pb-3">
                            { !mySubscription && 
                                <CustomButton
                                    title="Subscribe Now!"
                                    handlePress={handleSubmit}
                                    containerStyles="w-1/2 mt-0 rounded-lg"
                                    textStyles="text-base"
                                    isLoading={isSubmitting}
                                />
                            }
                            { mySubscription && mySubscription.status === 'pending' &&
                                <CustomButton
                                    title="Pending"
                                    handlePress={handleSubmit}
                                    containerStyles="w-1/2 mt-0 rounded-lg"
                                    textStyles="text-base"
                                    isLoading={isSubmitting}
                                    disabled={true}
                                />
                            }
                            { mySubscription && mySubscription.status === 'subscribed' &&
                                <CustomButton
                                    title="Unsubscribe"
                                    handlePress={handleSubmit}
                                    containerStyles="w-1/2 mt-0 rounded-lg bg-primary"
                                    textStyles="text-base text-black"
                                    isLoading={isSubmitting}
                                />
                            }
                            </View>)
                    }

                </ScrollView>
            </SafeAreaView>

            <UserProfileBottomSheet ref={bottomSheetRef} onClose={handleBottomSheetClose}/>

            <StatusBar backgroundColor='#ffffff' style='auto' hidden={false} translucent={false} />
        </GestureHandlerRootView>
    )
}

export default ChannelInfo

const styles = StyleSheet.create({
    separator: {
        height: 10,
        backgroundColor: '#d1d5db',
        marginVertical: 8
      },
})