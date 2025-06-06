import { View, Text, Image, TouchableOpacity, Alert } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler';
import React, { forwardRef, useImperativeHandle, useState, useRef, useMemo} from 'react'
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import CustomButton from './CustomButton';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import * as api from '../api';

const UserProfileBottomSheet = forwardRef(({ onClose },ref) => {
    const bottomSheetRef = useRef(null);
    const snapPoints = useMemo(() => ["80%"], []);
    const [userProfile, setUserProfile] = useState(null);
    const [type, setType] = useState(null);
    const [toDo, setToDo] = useState(null);
    const [data, setData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        open: () => bottomSheetRef.current?.expand(),
        close: () => {
            console.log('hi')
            bottomSheetRef.current?.close();
            if (onClose) onClose(); // Call the onClose callback when closed, but this wont work because of using pandowntoclose.
        },
        setUserProfile: (profile) => setUserProfile(profile),
        setType: (type) => setType(type),
        setToDo: (toDo) => setToDo(toDo),
        setData: (data) => setData(data),
    }));

    const renderBackdrop = (props) => (
        <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.5}
            pressBehavior="none"
        />
    );

    return (
        <BottomSheet
            ref={bottomSheetRef} // Attach ref to BottomSheet
            index={-1} // Initially closed
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            backdropComponent={renderBackdrop}
            backgroundStyle={{
                borderTopLeftRadius: 25,
                borderTopRightRadius: 25,
                backgroundColor: "#fecc1d",
            }}
            onChange={(index) => {
                if (index === -1) {
                    if (onClose) onClose();
                }
            }}
        >
            <BottomSheetScrollView>
                <ScrollView>
            <View className="m-5 flex ">
                <View className="flex-row justify-start space-x-8">
                    <Image
                        source={ userProfile?.userProfileImgUrl? {uri: userProfile.userProfileImgUrl}: require('../assets/icons/account.png') }
                        style={{ width: 120, height: 120, borderRadius: 80, borderWidth: 1, borderColor: '#7257ca', tintColor: !userProfile?.userProfileImgUrl? '#5e40b7': undefined }}
                    />
                    <View className="flex justify-center items-start">
                        <Text className="text-2xl font-pbold">{userProfile?.userName? userProfile.userName: 'Unknown'}</Text>
                        <Text className="text-lg font-pregular">Age: {userProfile?.userAge? userProfile.userAge: 'Unknown'}</Text>
                        <Text className="text-lg font-pregular">Gender: {userProfile?.userGender? userProfile.userGender: 'Unknown'}</Text>
                    </View>
                </View>
                <View className="flex justify-start items-center mt-5">
                    <Text className="text-2xl font-pbold">Verification Status:  {userProfile?.verified? '✅':'❌'}</Text>
                </View>
            </View>

            {/* Bottom Sheet Content */}
            {   type === "members" && toDo === "edit" &&
                <BottomSheetView style={{ padding: 20 }}>
                    <View className="flex-row justify-around">
                    <CustomButton
                        title="Remove"
                        handlePress={ () => 
                            Alert.alert('Remove Member', 'Are you sure to remove the member?', [
                                {
                                    text: 'Cancel',
                                    style: 'cancel',
                                    onPress: () => setIsSubmitting(false)
                                },
                                {
                                    text:'Yes',
                                    onPress: async () => {
                                        try{
                                            setIsSubmitting(true);
                                            const response = await api.subscription.getSubscribedByChannelIdAndAccountId(userProfile.userId, data);
                                            const subscriptionId = response.data.subscriptionId;
                                            await api.subscription.unsubscribe(subscriptionId);
                                            setIsSubmitting(false);
                                            bottomSheetRef.current?.close();
                                        } catch (error){
                                            console.log('Error remove subscriber', error);
                                        } finally{
                                            setIsSubmitting(false);
                                        }
                                    }
                                }
                            ])
                            
                        }
                        containerStyles="w-1/3 min-h-[48px] mt-0 rounded-lg bg-red-500"
                        textStyles="text-base text-black"
                        isLoading={isSubmitting}
                    />
                    </View>
                </BottomSheetView>

            }

            {
                type === "subscriptions" &&
                <BottomSheetView style={{ padding: 20 }}>
                    <View className="flex-row justify-around">
                    <CustomButton
                        title="Accept"
                        handlePress={ () => 
                            Alert.alert('Accept Request', 'Are you sure to accept the request?', [
                                {
                                    text: 'Cancel',
                                    style: 'cancel',
                                    onPress: () => setIsSubmitting(false)
                                },
                                {
                                    text:'Yes',
                                    onPress: async () => {
                                        try{
                                            setIsSubmitting(true);
                                            const response = await api.subscription.getSubscribedByChannelIdAndAccountId(userProfile.userId, data);
                                            const subscriptionId = response.data.subscriptionId;
                                            await api.subscription.approve(subscriptionId);
                                            setIsSubmitting(false);
                                            bottomSheetRef.current?.close();
                                        } catch (error){
                                            console.log('Error accept request', error);
                                        } finally{
                                            setIsSubmitting(false);
                                        }
                                    }
                                }
                            ])
                            
                        }
                        containerStyles="w-1/3 min-h-[48px] mt-0 rounded-lg bg-green-500"
                        textStyles="text-base text-black"
                        isLoading={isSubmitting}
                    />

                    <CustomButton
                        title="Decline"
                        handlePress={ () => 
                            Alert.alert('Decline Request', 'Are you sure to decline the request?', [
                                {
                                    text: 'Cancel',
                                    style: 'cancel',
                                    onPress: () => setIsSubmitting(false)
                                },
                                {
                                    text:'Yes',
                                    onPress: async () => {
                                        try{
                                            setIsSubmitting(true);
                                            const response = await api.subscription.getSubscribedByChannelIdAndAccountId(userProfile.userId, data);
                                            const subscriptionId = response.data.subscriptionId;
                                            await api.subscription.decline(subscriptionId);
                                            setIsSubmitting(false);
                                            bottomSheetRef.current?.close();
                                        } catch (error){
                                            console.log('Error decline request', error);
                                        } finally{
                                            setIsSubmitting(false);
                                        }
                                    }
                                }
                            ])
                            
                        }
                        containerStyles="w-1/3 min-h-[48px] mt-0 rounded-lg bg-red-500"
                        textStyles="text-base text-black"
                        isLoading={isSubmitting}
                    />
                    </View>
                </BottomSheetView>
            }

            {
                type === "rsvp" && toDo === "edit" &&
                <BottomSheetView style={{ padding: 20 }}>
                    <View className="flex-row justify-around">
                    <CustomButton
                        title="Accept"
                        handlePress={ () => 
                            Alert.alert('Accept RSVP', 'Are you sure to accept the rsvp?', [
                                {
                                    text: 'Cancel',
                                    style: 'cancel',
                                    onPress: () => setIsSubmitting(false)
                                },
                                {
                                    text:'Yes',
                                    onPress: async () => {
                                        try{
                                            setIsSubmitting(true);
                                            const response = await api.rsvp.getByEventIdAndAccountId(data, userProfile.userId);
                                            const rsvpId = response.data.rsvpId;
                                            await api.rsvp.approveRsvp(rsvpId);
                                            setIsSubmitting(false);
                                            bottomSheetRef.current?.close();
                                        } catch (error){
                                            console.log('Error accept rsvp', error);
                                        } finally{
                                            setIsSubmitting(false);
                                        }
                                    }
                                }
                            ])
                            
                        }
                        containerStyles="w-1/3 min-h-[48px] mt-0 rounded-lg bg-green-500"
                        textStyles="text-base text-black"
                        isLoading={isSubmitting}
                    />

                    <CustomButton
                        title="Decline"
                        handlePress={ () => 
                            Alert.alert('Decline RSVP', 'Are you sure to decline the rsvp?', [
                                {
                                    text: 'Cancel',
                                    style: 'cancel',
                                    onPress: () => setIsSubmitting(false)
                                },
                                {
                                    text:'Yes',
                                    onPress: async () => {
                                        try{
                                            setIsSubmitting(true);
                                            const response = await api.rsvp.getByEventIdAndAccountId(data, userProfile.userId);
                                            const rsvpId = response.data.rsvpId;
                                            await api.rsvp.deleteRsvp(rsvpId);
                                            setIsSubmitting(false);
                                            bottomSheetRef.current?.close();
                                        } catch (error){
                                            console.log('Error decline rsvp', error);
                                        } finally{
                                            setIsSubmitting(false);
                                        }
                                    }
                                }
                            ])
                            
                        }
                        containerStyles="w-1/3 min-h-[48px] mt-0 rounded-lg bg-red-500"
                        textStyles="text-base text-black"
                        isLoading={isSubmitting}
                    />
                    </View>
                </BottomSheetView>
            }
            </ScrollView>
            </BottomSheetScrollView>

        </BottomSheet>
    );
});

export default UserProfileBottomSheet