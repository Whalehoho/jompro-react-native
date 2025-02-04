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

const NewChannelForm = ({ onSubmit }) => {
  const [form, setForm] = useState({
    channelName: '',
    channelDescription: '',
    category: '',
    private: false,
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
    if(!form || !form.channelName || !form.channelDescription || !form.category) {
        Alert.alert('Please fill in all fields');
        setIsSubmitting(false);
        return;
    }

    try{
      const response = await api.channel.createChannel({
        channelName: form.channelName,
        channelDesc: form.channelDescription,
        category: form.category,
        privacy: form.private === true ? 'private' : 'public',
        ownerId: user.accountId,
      });
      Alert.alert('Success', 'Channel created successfully');
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
      <Text className="font-pbold text-xl mb-8 text-center">Ready to create your own channel?</Text>

      <Text className="font-pmedium text-sm text-gray-800">What kind of community are you building? Choose a category that best represents your events and audience!</Text>

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
                  form.category === item.title ? 'bg-secondary-100 border-secondary-100' : 'border-gray-800'
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
                  form.category === item.title ? 'bg-secondary-100 border-secondary-100' : 'border-gray-800'
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

      <Text className="font-pmedium text-sm text-gray-800 mt-8">Give your channel a memorable name & description to capture the spirit of your community!</Text>



      <FormField
        title=""
        value={form.channelName}
        handleChangeText={(text) => setForm({ ...form, channelName: text })}
        placeholder="Add Channel Name"
        titleStyle="text-black"
        boxStyle="border-gray-200 bg-gray-200 rounded-sm h-14 px-4"
        otherStyles="mt-5 space-y-1"
        multiLine={true}
      />

      <FormField
         title=""
         value={form.channelDescription}
         handleChangeText={(text) => setForm({ ...form, channelDescription: text })}
         multiLine={true}
         placeholder="Add Description"
         titleStyle="text-black"
         boxStyle="border-gray-200 bg-gray-200 rounded-sm h-48 px-4 py-2 items-start"
         otherStyles="mt-5 space-y-1"
      />

    <View style={styles.separator} className="mt-8 mb-0" />

      <View className="flex-row space-x-4 mt-8">
                  <Text className="font-pmedium text-base text-gray-800">
                    Make it private?
                  </Text>
                  <Switch
                     style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                      trackColor={{ false: "#767577", true: "#7257ca" }}
                      thumbColor={form.private ? "#836eca" : "#f4f3f4"}
                      ios_backgroundColor="#3e3e3e"
                      onValueChange={() => setForm({ ...form, private: !form.private })}
                      value={form.private}
                  />
                </View>
      
      <View className="flex-row items-center justify-center mb-8">
        <CustomButton
          title="Create Channel"
          handlePress={handleSubmit}
          containerStyles="w-4/5 mt-7 rounded-md"
          textStyles="text-base"
          isLoading={isSubmitting}
        />
      </View>
    </View>
  );
};

export default NewChannelForm;

const styles = StyleSheet.create({
  separator: {
    height: 1,
    backgroundColor: '#000',
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
