import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, Modal, FlatList, Switch, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage'
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomButton from '../CustomButton';
import FormField from '../../components/FormField'
import { icons } from '../../constants';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
const { googleMapsApiKey } = Constants.expoConfig.extra;
import * as api from '../../api';
import { AlphaType } from '@shopify/react-native-skia';
import { stat } from 'react-native-fs';

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

const RegularEventForm = ({ onSubmit }) => {
  const [form, setForm] = useState({
    eventName: '',
    eventDescription: '',
    category: '',
  });

  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try{
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      }
    };

    fetchUserData();
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // console.log('Form data:', form);
    setIsSubmitting(true);
    if(!form || !form.eventName || !form.eventDescription || !form.category) {
        Alert.alert('Please fill in all fields');
        setIsSubmitting(false);
        return;
    }

    try{
      const response = await api.event.updateEvent({
        hostId: user.accountId,
        category: form.category,
        eventName: form.eventName,
        eventDesc: form.eventDescription,
        pattern: 'regular',
        status: 'active',
      });
      Alert.alert('Success', 'Event created successfully');
    } catch (error) {
      if (!error.response || error.response.status !== 401) {
        Alert.alert('Error', error.message || 'Something went wrong');
      }
    } finally {
      setIsSubmitting(false)
      onSubmit();
    }
  };

  return (
    <View className="px-2 py-2">
      <Text className="font-pbold text-xl mb-8 text-center">CREATE A REGULAR EVENT</Text>

      <Text className="font-pmedium text-sm text-gray-500">CATEGORY</Text>

      {/* Horizontal ScrollView with two rows */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        style={{ marginTop: 16 }}
      >
        {/* Map through categories */}
        <View style={{ flexDirection: 'column' }}>
          <View style={{ flexDirection: 'row' }}>
            {categories.slice(0, 8).map((item, index) => (
              <TouchableOpacity
                key={index}
                className={`py-4 px-6 items-center border-2 rounded-lg mx-2 ${
                  form.category === item.title ? 'bg-primary border-primary' : 'border-gray-300'
                }`}
                style={{ width: 120, height: 100 }}
                onPress={() => setForm({ ...form, category: item.title })}
              >
                <View className="flex-1 items-center justify-evenly space-y-2">
                  <Image source={item.icon} resizeMode="contain" className="w-6 h-6" />
                  <Text className="text-md font-psemibold text-black text-center">{item.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            {categories.slice(8, 16).map((item, index) => (
              <TouchableOpacity
                key={index}
                className={`py-4 px-6 items-center border-2 rounded-lg mx-2 ${
                  form.category === item.title ? 'bg-primary border-primary' : 'border-gray-300'
                }`}
                style={{ width: 120, height: 100 }}
                onPress={() => setForm({ ...form, category: item.title })}
              >
                <View className="flex-1 items-center justify-evenly space-y-2">
                  <Image source={item.icon} resizeMode="contain" className="w-6 h-6" />
                  <Text className="text-md font-psemibold text-black text-center">{item.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.separator} className="mt-8 mb-0" />

      <Text className="font-pmedium text-sm text-gray-500 mt-8">EVENT NAME</Text>



      <FormField
        title=""
        value={form.eventName}
        handleChangeText={(text) => setForm({ ...form, eventName: text })}
        placeholder="Add Event Name"
        titleStyle="text-black"
        boxStyle="border-gray-200 bg-gray-200 rounded-sm h-14 px-4"
        otherStyles="mt-5 space-y-1"
        multiLine={true}
      />

      <FormField
         title=""
         value={form.eventDescription}
         handleChangeText={(text) => setForm({ ...form, eventDescription: text })}
         multiLine={true}
         placeholder="Add Notes or Description"
         titleStyle="text-black"
         boxStyle="border-gray-200 bg-gray-200 rounded-sm h-48 px-4 py-2 items-start"
         otherStyles="mt-5 space-y-1"
      />
      
      <View className="flex-row items-center justify-center mb-8">
        <CustomButton
          title="Create Event"
          handlePress={handleSubmit}
          containerStyles="w-4/5 mt-7 rounded-md"
          textStyles="text-base"
          isLoading={isSubmitting}
        />
      </View>
    </View>
  );
};

export default RegularEventForm;

const styles = StyleSheet.create({
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 8
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: 300,
    maxHeight: 400,
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 18,
    textAlign: 'center',
  },
});
