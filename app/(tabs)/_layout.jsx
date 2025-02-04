import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import React, { useState, useRef, useMemo } from 'react';
import { Tabs } from 'expo-router';
import { icons } from '../../constants';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';  // Import BottomSheetBackdrop
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import NewChannelForm from '../../components/forms/NewChannelForm';
import NewEventForm from '../../components/forms/NewEventForm';


const TabIcon = ({ icon, color, name, focused }) => {
  return (
    <View className="items-center justify-center">
      <Image
        source={icon}
        resizeMode="contain"
        tintColor={color}
        className={`h-9 ${name ? 'w-7' : 'w-9'} ${!name ? 'mb-1' : ''}`}
      />
      {name && (
        <Text className={`${focused ? 'font-psemibold' : 'font-pregular'} text-xs`} style={{ color: color }}>
          {name}
        </Text>
      )}
    </View>
  );
};

const BottomSheetContent = ({ handleShowForm, handleCloseForm, showForm }) => {
  

  return (
    <ScrollView 
      className="px-4 py-6"
      keyboardShouldPersistTaps={'handled'}  // Ensures that taps on touchable elements (like the address list) are registered even when the keyboard is open.
    >
      { !showForm &&
        <>
        <TouchableOpacity className="mt-2 mb-2"onPress={ () => {
              handleShowForm('new-channel');
          }}>
            <View className="flex-row items-start justify-start">
              <View>
                <Image source={icons.broadcast} className="w-6 h-6" />
              </View>
              <View className="ml-6 flex-shrink">
                <Text className="font-psemibold text-lg">Create Your Own Channel</Text>
                <Text className="text-gray-800 text-xs font-pmedium">Start your own community! Whether you want a public space for hosting events or a private channel for exclusive members, you're in control. Subscribers can host events, RSVP, and join chat rooms to stay engaged. Build your audience, share ideas, and connect—your channel, your community! </Text>
              </View>
              <View className="ml-2">
                <Image source={icons.next} className="w-4 h-4 mr-1" />
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.separator}/>
          <TouchableOpacity className="mt-4 mb-2"onPress={ () => {
              handleShowForm('new-event');
          }}>
            <View className="flex-row items-start justify-start">
              <View>
                <Image source={icons.flag} className="w-6 h-6" />
              </View>
              <View className="ml-6 flex-shrink">
                <Text className="font-psemibold text-lg">Host Your Own Event</Text>
                <Text className="text-gray-800 text-xs font-pmedium">Organize events from the channels you're a part of. Set the date, choose the location, and share all the details to get everyone excited. Invite others to join, manage RSVPs, and create an experience that fosters connection. You'll bring your community together for meaningful interactions and unforgettable moments! </Text>
              </View>
              <View className="ml-2">
                <Image source={icons.next} className="w-4 h-4 mr-1" />
              </View>
            </View>
          </TouchableOpacity>
          
        </>
      }

      {showForm === 'new-channel' && <NewChannelForm onSubmit={handleCloseForm}/>}
      {showForm === 'new-event' && <NewEventForm onSubmit={handleCloseForm}/> }
      
    </ScrollView>
  );
};

// Customize the backdrop to fade in/out
const renderBackdrop = (props) => (
  <BottomSheetBackdrop {...props} 
    disappearsOnIndex={-1}  // Backdrop disappears when sheet is fully closed
    appearsOnIndex={0}  // Backdrop appears when sheet is opened
    opacity={0.5}  // Control the opacity of the backdrop
  />
);

const TabsLayout = () => {
  const bottomSheetRef = useRef(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const [showForm, setShowForm] = useState(null);  // State to manage which form is shown
  const handleShowForm = (formType) => {
    setShowForm(formType); // Set the form type to show
  };
  const handleCloseForm = () => {
    setShowForm(null); // Close the form
  };

  const handleOpenBottomSheet = () => {
    bottomSheetRef.current?.expand();
    setIsBottomSheetOpen(true);
  };

  const handleCloseBottomSheet = () => {
    bottomSheetRef.current?.close();
    setIsBottomSheetOpen(false);
    setShowForm(null);
  };

  const snapPoints = useMemo(() => ['80%'], []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#5e40b7',
          tabBarInactiveTintColor: '#7257ca',
          tabBarStyle: {
            backgroundColor: '#fecc1d',
            borderTopWidth: 0,
            borderTopColor: '#232533',
            height: 60,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.home} color={color} name="Home" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.discover} color={color} name="Discover" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: 'Create',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.plus} color={color} focused={focused} />
            ),
            tabBarButton: (props) => (
              <TouchableOpacity {...props} onPress={handleOpenBottomSheet} />
            ),
          }}
        />
        <Tabs.Screen
          name="message"
          options={{
            title: 'Message',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.message} color={color} name="Message" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.profile} color={color} name="Profile" focused={focused} />
            ),
          }}
        />
      </Tabs>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1} // Initial state, -1 means closed, 0 means open
        snapPoints={snapPoints} // Different positions or heights that the bottom sheet can snap to
        enablePanDownToClose={true} // Enable the bottom sheet to be closed by panning down
        onClose={handleCloseBottomSheet} // Handle the closing of the bottom sheet
        backdropComponent={renderBackdrop} // Use the backdropComponent for the background
        backgroundStyle={{
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          backgroundColor: '#fecc1d',
        }}
      >
        <BottomSheetContent handleShowForm={handleShowForm} handleCloseForm={handleCloseForm} showForm={showForm}/>
      </BottomSheet>

      

    </GestureHandlerRootView>
  );
};

export default TabsLayout;

const styles = StyleSheet.create({
  separator: {
    height: 1,              
    backgroundColor: '#000', 
    marginVertical: 8,       
  },
});