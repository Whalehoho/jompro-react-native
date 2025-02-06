import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef, use } from 'react';
import * as api from '../../api';
import CustomButton from '../../components/CustomButton';

import { icons, images } from '../../constants';

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

  const MembersProfileImages = ({ profileUrls }) => {
    return (
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
          {profileUrls.map((url, index) => (
            <Image
              key={index}
              source={{ uri: url }}
              style={{
                width: 60,
                height: 60,
                borderRadius: 50,
                margin: 4, // Space between images
                borderWidth: 2,
                borderColor: "white",
              }}
            />
          ))}
        </View>
    );
};

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
                setOwnerProfile(response.data.profile_img_url);
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
                    const response = await api.user.getProfileUrlbyId(member.subscriberId);
                    membersProfile.push(response.data.profile_img_url);
                }
                setMembersProfile(membersProfile);
            } catch (error) {
                console.error('Error fetching members profile:', error);
            }
        };
        fetchMembersProfile();
    }, [channel]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
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
                    <View className="mx-4 mb-6 space-y-2">
                        {channel && <Text className="text-2xl font-pbold mt-2" style={{ lineHeight: 40 }}>{channel.channelName}</Text>}
                        <View className="flex-row space-x-2">
                            {channel && 
                                <Text className="text-secondary-100 text-sm font-pmedium">{channel.category}</Text>
                            }
                            {icon && 
                                <Image source={icon} className="w-4 h-4" tintColor={'#7257ca'}/>
                            }    
                        </View>
                    </View>

                    <View style={styles.separator} className="mt-0 mb-4" />

                    <View className="mx-4 space-y-2 mb-4" style={{ flex: 0.5, alignItems: 'flex-start' }}>
                        <Text className="font-pbold text-xl text-gray-700">Owner</Text>
                        <View className="flex-row">
                            { ownerProfile && 
                                <Image source={{ uri: ownerProfile }} className="w-16 h-16 rounded-full ml-0" />
                             }
                        </View>
                    </View>

                    <View style={styles.separator} className="mt-2 mb-4" />

                    <View className="mx-4 space-y-2 mb-4" style={{ flex: 0.5, alignItems: 'flex-start' }}>
                        <Text className="font-pbold text-xl text-gray-700">Members({membersProfile?membersProfile.length:''})</Text>
                        <View className="flex-row">
                            { membersProfile && 
                                <MembersProfileImages profileUrls={membersProfile} /> }
                        </View>
                    </View>

                    <View style={styles.separator} className="mt-2 mb-4" />


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

                    <View style={styles.separator} className="mt-4 mb-3" />

                    <View className="flex-row items-center justify-center pb-3">
                                <CustomButton
                                    title="Subscribe Now!"
                                    handlePress={handleSubmit}
                                    containerStyles="w-1/2 mt-0 rounded-lg"
                                    textStyles="text-base"
                                    isLoading={isSubmitting}
                                />
                            </View>

                </ScrollView>
            </SafeAreaView>

            <StatusBar backgroundColor='#ffffff' style='auto' hidden={false} translucent={false} />
        </>
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