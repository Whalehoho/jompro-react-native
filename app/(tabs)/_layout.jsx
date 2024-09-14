import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useState, useRef, useMemo } from 'react';
import { Tabs } from 'expo-router';
import { icons } from '../../constants';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';  // Import BottomSheetBackdrop
import { GestureHandlerRootView } from 'react-native-gesture-handler';


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

const BottomSheetContent = () => {
  return (
    <View className="px-4 py-6">
      <TouchableOpacity className="mb-2">
        <View className="flex-row items-start justify-start">
          <View>
            <Image source={icons.schedule} className="w-6 h-6" />
          </View>
          <View className="ml-6 flex-shrink">
            <Text className="font-psemibold text-lg">Regular Event</Text>
            <Text className="text-gray-500 text-xs font-pmedium">Create a recurring event for regular meetups or activities.</Text>
          </View>
          <View className="ml-1">
            <Image source={icons.next} className="w-4 h-4 ml-1 mr-1" />
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.separator}/>
      <TouchableOpacity className="mt-2 mb-2">
      <View className="flex-row items-start justify-start">
        <View>
          <Image source={icons.flash} className="w-6 h-6" />
        </View>
        <View className="ml-6 flex-shrink">
          <Text className="font-psemibold text-lg">One-Time Event</Text>
          <Text className="text-gray-500 text-xs font-pmedium">Create a one-time event for casual meetups or activities.</Text>
        </View>
        <View className="ml-1">
            <Image source={icons.next} className="w-4 h-4 ml-1 mr-1" />
        </View>
      </View>
      </TouchableOpacity>
      <View style={styles.separator} />
      <TouchableOpacity className="mt-2">
      <View className="flex-row items-start justify-start">
        <View>
          <Image source={icons.play} className="w-6 h-6" />
        </View>
        <View className="ml-6 flex-shrink">
          <Text className="font-psemibold text-lg">New Session</Text>
          <Text className="text-gray-500 text-xs font-pmedium">Create new session from an existing event. (Only applicable for host or co-host)</Text>
        </View>
        <View className="ml-1">
            <Image source={icons.next} className="w-4 h-4 ml-1 mr-1" />
        </View>
      </View>
      </TouchableOpacity>
    </View>
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

  const handleOpenBottomSheet = () => {
    bottomSheetRef.current?.expand();
    setIsBottomSheetOpen(true);
  };

  const handleCloseBottomSheet = () => {
    bottomSheetRef.current?.close();
    setIsBottomSheetOpen(false);
  };

  const snapPoints = useMemo(() => ['50%'], []);

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
        }}
      >
        <BottomSheetContent />
      </BottomSheet>

    </GestureHandlerRootView>
  );
};

export default TabsLayout;

const styles = StyleSheet.create({
  separator: {
    height: 1,              
    backgroundColor: '#ccc', 
    marginVertical: 8,       
  },
});