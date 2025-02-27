import React, { useState, useRef, useEffect, use } from 'react';
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

const durations = [
    '1 hour(s)', '1.5 hour(s)', '2 hour(s)', '2.5 hour(s)', '3 hour(s)', '3.5 hour(s)', 
    '4 hour(s)', '4.5 hour(s)', '5 hour(s)', '5.5 hour(s)', '6 hour(s)', '6.5 hour(s)', 
    '7 hour(s)', '7.5 hour(s)', '8 hour(s)', '1 day(s)', '2 day(s)', '3 day(s)'
];

const genderRestrictions = ['No restrictions', 'Male', 'Female'];

const ageRestrictions = ['No restrictions', 'Adult (18-50)', 'Senior (50+)'];

const NewEventForm = ({ onSubmit, eventId }) => {
  const [form, setForm] = useState({
    channel: null,
    eventName: '',
    eventDescription: '',
    eventDate: null,
    eventDuration: '',
    participants: '1',
    eventLocation: null,
    genderRestriction: '',
    ageRestriction: '',
    autoApprove: false,
  });

  const [user, setUser] = useState(null);
  const [event, setEvent] = useState(null);
  const [mySubscribedChannels, setMySubscribedChannels] = useState([]);

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

  useEffect(() => {
    if(!eventId ) return;
    const fetchEvent = async () => {
      try{
        const response = await api.event.getEvent(eventId);
        if(!response) return;
        setEvent(response.data);
        setForm({
          channel: mySubscribedChannels.find(channel => String(channel.channelId) === String(response.data.channelId)),
          eventName: response.data.eventName,
          eventDescription: response.data.eventAbout,
          eventDate: new Date(response.data.startTime * 1000),
          eventDuration: `${response.data.eventDuration / 3600} hour(s)`,
          participants: response.data.maxParticipants.toString(),
          eventLocation: response.data.eventLocation,
          genderRestriction: response.data.genderRestriction,
          ageRestriction: response.data.ageRestriction.min === -1 ? 'No restrictions' : response.data.ageRestriction.min === 18 ? 'Adult (18-50)' : 'Senior (50+)',
          autoApprove: response.data.autoApprove,
        });
      } catch (error) {
        console.error('Failed to fetch event:', error);
      }
    };
    fetchEvent();
  }, [eventId, mySubscribedChannels]);


  useEffect(() => {
    const fetchMySubscribedChannels = async () => {
        try{
            const subscribed = await api.subscription.getMySubscribed(user.userId);
            const channelIds = subscribed.data.map(sub => sub.channelId);
            // Create an array to hold the channel responses
            const channels = [];

            // Call API one by one for each channelId
            for (const channelId of channelIds) {
                const channel = await api.channel.getChannelByChannelId(channelId);
                channels.push(channel.data); // Push each channel response to the array
            }
            const myCreatedChannels = await api.channel.getChannelsByOwnerId(user.userId);
            channels.push(...myCreatedChannels.data);
            setMySubscribedChannels(channels);
        } catch (error) {
            // console.error('Failed to fetch events:', error);
        }
    };
    fetchMySubscribedChannels();
  }, [user]); // Fetch events when user state changes

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states for event selection
  const [showChannelModal, setShowChannelModal] = useState(false);

  const handleChannelSelect = (selectedChannel) => {
    setForm({ ...form, channel: selectedChannel });
    setShowChannelModal(false);
  };

  // DateTimePicker states
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mode, setMode] = useState('date');
  
  // Modal states for duration selection
  const [showDurationModal, setShowDurationModal] = useState(false);

  const convertDurationToSeconds = (duration) => {
    if(duration.includes('hour(s)')){
      const hours = parseFloat(duration.split(' ')[0]);
      return hours * 3600;
    } else if(duration.includes('day(s)')){
      const days = parseFloat(duration.split(' ')[0]);
      return days * 86400;
    }
    return 0;
  };

  // Modal states for gender restriction
  const [showGenderModal, setShowGenderModal] = useState(false);

  // Modal states for age restriction
  const [showAgeModal, setShowAgeModal] = useState(false);

  const parseAgeRestriction = (restriction) => {
    if (restriction === 'No restrictions') {
      return { min: -1, max: -1 }; // No restriction case
    } else if (restriction.includes('Adult')) {
      return { min: 18, max: 50 }; // Adult restriction case
    } else if (restriction.includes('Senior')) {
      return { min: 50, max: 100 }; // Senior restriction case
    } else {
      return { min: 0, max: 0 }; // Default case for unexpected input
    }
  };

  // Form states for location selection
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const searchRef = useRef(null);

  const clearSearch = () => {
    if (searchRef.current) {
        searchRef.current.clear();
        searchRef.current.blur();
      }
  }

  const handleLocationSelect = (data, details) => {
    const selectedAddress = data.description;
    const { lat, lng } = details.geometry.location;
    const addressComponents = details.address_components;
    const sublocality_level_1 = addressComponents.find(component =>
      component.types.includes('sublocality_level_1')
    )?.long_name;
    const locality = addressComponents.find(component =>
      component.types.includes('locality')
    )?.long_name;
    const state = addressComponents.find(component =>
      component.types.includes('administrative_area_level_1')
    )?.long_name;
    // console.log('full address:', selectedAddress);
    // console.log('city:', locality);
    setSelectedAddress({
        fullAddress: selectedAddress,
        state: state === 'Johor Darul Ta\'zim' ? 'Johor' : state,
        city: locality,
        region: sublocality_level_1,
        lat: lat,
        lng: lng,
      });
  }

  const handleAddAddress = () => {
    if(!selectedAddress) return;
    // console.log('selected address:', selectedAddress);
    setForm({ ...form, eventLocation: selectedAddress });
    setShowLocationModal(false);
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if(!form || !form.channel || !form.eventName || !form.eventDescription 
        || !form.eventDate || !form.eventDuration 
        || !form.participants || !form.eventLocation || !form.genderRestriction 
        || !form.ageRestriction) {
            Alert.alert('Please fill in all fields');
            setIsSubmitting(false);
            return;
    }

    try{
      const eventDate = new Date(form.eventDate).getTime() / 1000;
      const eventDuration = convertDurationToSeconds(form.eventDuration);
      const ageRestriction = parseAgeRestriction(form.ageRestriction);
      const channelId = form.channel.channelId;
      if(!eventId){
        await api.event.createEvent({
          channelId: channelId,
          eventName: form.eventName,
          eventAbout: form.eventDescription,
          category: form.channel.category,
          organizerId: user.userId,
          eventStatus: 'active',
          startTime: eventDate,
          eventDuration: eventDuration,
          eventLocation: form.eventLocation,
          maxParticipants: parseInt(form.participants, 10),
          genderRestriction: form.genderRestriction,
          ageRestriction: ageRestriction,
          autoApprove: form.autoApprove,
        });
      } else {
        await api.event.updateEvent({
          eventId: eventId,
          channelId: channelId,
          eventName: form.eventName,
          eventAbout: form.eventDescription,
          category: form.channel.category,
          organizerId: user.userId,
          eventStatus: 'active',
          startTime: eventDate,
          eventDuration: eventDuration,
          eventLocation: form.eventLocation,
          maxParticipants: parseInt(form.participants, 10),
          genderRestriction: form.genderRestriction,
          ageRestriction: ageRestriction,
          autoApprove: form.autoApprove,
      });
      }
      
      Alert.alert('Success', 'Event updated successfully');
    } catch (error) {
      if (!error.response || error.response.status !== 401) {
        Alert.alert('Error', error.message || 'Something went wrong');
      }
    } finally {
      setIsSubmitting(false)
      onSubmit();
    }
  };

  const handleDateChange = (event, selectedDate) => {
    // console.log("selected date:", selectedDate);
    
    if (!selectedDate) return; // Avoid updating if no date is selected

    setShowDatePicker(mode === 'date'); // Keep picker open only for time selection

    setDate((prevDate) => {
        let currentDate = prevDate || new Date(); // Use existing date if available
        if (mode === "time") {
            // Preserve the previously selected date but update the time
            currentDate = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate(),
                selectedDate.getHours(),
                selectedDate.getMinutes()
            );
        } else {
            // If selecting a date, just update to the new selection
            currentDate = selectedDate;
            showMode("time"); // Switch to time picker after selecting date
        }

        setForm({ ...form, eventDate: currentDate }); // Update form with new date
        return currentDate; // Update state with the new date
    });
};


  const showMode = (currentMode) => {
    setShowDatePicker(true);
    setMode(currentMode);
  };

  const handleDurationSelect = (selectedDuration) => {
    setForm({ ...form, eventDuration: selectedDuration });
    setShowDurationModal(false); // Close the modal after selection
  };

  const handleGenderSelect = (selectedGender) => {
    setForm({ ...form, genderRestriction: selectedGender });
    setShowGenderModal(false); // Close the modal after selection
  };

  const handleAgeSelect = (selectedAge) => {
    setForm({ ...form, ageRestriction: selectedAge });
    setShowAgeModal(false); // Close the modal after selection
  }

  // Increase/Decrease participant count
  const handleParticipantChange = (change) => {
    setForm(prevForm => {
      const currentCount = parseInt(prevForm.participants, 10) || 1;
      const newCount = Math.max(1, currentCount + change); // Prevent going below 1
      return { ...prevForm, participants: newCount.toString() };
    });
  };

  return (
    <ScrollView className="px-2 py-2">
      {/* <Text className="font-pbold text-xl mb-8 text-center">Ready to host your own event?</Text> */}

      <Text className="font-pmedium text-sm text-gray-800">CHANNEL</Text>

      <TouchableOpacity onPress={() => setShowChannelModal(true)}>
          <View className="flex-row space-x-4 mt-4">
            <Image source={icons.event} className="w-6 h-6" tintColor={'#5e40b7'} />
            <Text className="font-pregular text-base">
              {form.channel ? `${form.channel.channelName}` : 'Choose the right channel'}
            </Text>
          </View>
        </TouchableOpacity>


      <View style={styles.separator} className="mt-8 mb-0" />

      <Text className="font-pmedium text-sm text-gray-800 mt-8">EVENT DETAILS</Text>

      <View className="flex-col items-start justify-center mt-4 space-y-4">
        <TouchableOpacity onPress={() => showMode('date')}>
          <View className="flex-row space-x-4">
            <Image source={icons.calendar} className="w-6 h-6" tintColor={'#5e40b7'} />
            <Text className="font-pregular text-base">
              {form.eventDate ? `${form.eventDate}` : 'Select Date and Time'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowDurationModal(true)}>
          <View className="flex-row space-x-4">
            <Image source={icons.stopwatch} className="w-6 h-6" tintColor={'#5e40b7'} />
            <Text className="font-pregular text-base">
              {form.eventDuration ? `${form.eventDuration}` : 'Select Duration'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
                setSelectedAddress(null);
                setShowLocationModal(true)
            }}
        >
          <View className="flex-row space-x-4">
          <Image source={icons.pin} className="w-6 h-6" tintColor={'#5e40b7'} />
            <Text className="font-pregular text-base">
                {selectedAddress ? `${selectedAddress.fullAddress}` : form.eventLocation ? form.eventLocation.fullAddress : 'Select Location'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Number of Participants Input */}
        <View className="flex-row items-center space-x-4">
        <Image source={icons.people} className="w-6 h-6" tintColor={'#5e40b7'} />
            <Text className="font-pregular text-base mr-6">Participants</Text>

            <View className="flex-row items-center space-x-4">
                <TouchableOpacity onPress={() => handleParticipantChange(-1)} style={styles.adjustButton}>
                    <Text style={styles.adjustButtonText}>-</Text>
                </TouchableOpacity>
                <TextInput
                    style={styles.participantInput}
                    keyboardType="numeric"
                    value={form.participants}
                    onChangeText={(text) => setForm({ ...form, participants: text })}
                    editable={false}
                />
                <TouchableOpacity onPress={() => handleParticipantChange(1)} style={styles.adjustButton}>
                    <Text style={styles.adjustButtonText}>+</Text>
                </TouchableOpacity>
            </View>
        </View>

      </View>

      <View style={styles.separator} className="mt-8 mb-0" />

      <Text className="font-pmedium text-sm text-gray-800 mt-8">EVENT NAME</Text>



      <FormField
        title=""
        value={form.eventName}
        handleChangeText={(text) => setForm({ ...form, eventName: text })}
        placeholder="Add Event Name"
        titleStyle="text-black"
        boxStyle="border-gray-800 bg-gray-200 rounded-sm h-14 px-4"
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
         boxStyle="border-gray-800 bg-gray-200 rounded-sm h-48 px-4 py-2 items-start"
         otherStyles="mt-5 space-y-1"
      />
      
      <View style={styles.separator} className="mt-8 mb-0" />

      <Text className="font-pmedium text-sm text-gray-800 mt-8">ADVANCED</Text>

      <View className="flex-col items-start justify-center mt-4 space-y-4">
      <TouchableOpacity onPress={() => setShowGenderModal(true)}>
          <View className="flex-row space-x-4">
          <Image source={icons.gender} className="w-6 h-6" tintColor={'#5e40b7'} />
            <Text className="font-pregular text-base">
              {form.genderRestriction ? `${form.genderRestriction}` : 'Gender Restriction'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowAgeModal(true)}>
          <View className="flex-row space-x-4">
          <Image source={icons.age} className="w-6 h-6" tintColor={'#5e40b7'} />
            <Text className="font-pregular text-base">
              {form.ageRestriction ? `${form.ageRestriction}` : 'Age Group'}
            </Text>
          </View>
        </TouchableOpacity>

        <View className="flex-row space-x-4">
        <Image source={icons.approved} className="w-6 h-6" tintColor={'#5e40b7'} />
            <Text className="font-pregular text-base mr-28">
              Auto-approve
            </Text>
            <Switch
                trackColor={{ false: "#767577", true: "#7257ca" }}
                thumbColor={form.autoApprove ? "#836eca" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => setForm({ ...form, autoApprove: !form.autoApprove })}
                value={form.autoApprove}
            />
          </View>

      </View>

    {/* Modal for selecting channel */}
    <Modal visible={showChannelModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <FlatList
                data={mySubscribedChannels}
                keyExtractor={(item) => item.channelId.toString()}
                renderItem={({ item }) => {
                // Find the matching category from your categories array
                const channelCategory = categories.find(
                    (category) => category.title === item.category
                );
                const channelIcon = channelCategory ? channelCategory.icon : null;

                return (
                    <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => handleChannelSelect(item)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {/* Icon on the left */}
                            {channelIcon && (
                                <View style={{ flex: 0 }}>
                                <Image
                                    source={channelIcon}
                                    style={{ width: 24, height: 24, marginRight: 10 }}
                                />
                                </View>
                            )}
                            
                            {/* Event name in the center */}
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={styles.modalItemText}>{item.channelName}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                );
                }}
            />
            <CustomButton
                title="Close"
                handlePress={() => setShowChannelModal(false)}
                containerStyles="w-full mt-7 rounded-md min-h-[48px]"
                textStyles="text-base"
            />
            </View>
        </View>
    </Modal>



      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode={mode}
          is24Hour={true}
          minimumDate={new Date()}
          display="default"
          onChange={handleDateChange}
        />
      )}

    {/* Floating form for adding a new address */}
    { showLocationModal && (
        <Modal
            visible={showLocationModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowLocationModal(false)} // Handles back button press on Android
        >
            <View style={styles.overlay}>
                <View style={styles.floatingContainer}>
                <GooglePlacesAutocomplete
                    ref={searchRef}
                    placeholder="Search address or city ..."
                    onPress={(data, details = null) => handleLocationSelect(data, details)}
                    query={{
                    key: googleMapsApiKey,
                    language: 'en',
                    components: 'country:my',
                    }}
                    fetchDetails={true}
                    styles={styles.SearchBar}
                />
                <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
                    <Text style={styles.clearButtonText}>✖</Text>
                </TouchableOpacity>

                {/* Save and Cancel buttons below the search bar */}
                <View className="mt-14 w-full px-4 flex-row justify-around">
                    <CustomButton
                    title="Select"
                    handlePress={handleAddAddress}
                    containerStyles="w-[40%] h-auto"
                    textStyles={'text-sm'}
                    />
                    <CustomButton
                    title="Cancel"
                    handlePress={() => setShowLocationModal(false)}
                    containerStyles="w-[40%] h-auto"
                    textStyles={'text-sm'}
                    />
                </View>
                </View>
            </View>
        </Modal>
    )}


      {/* Modal for selecting duration */}
      <Modal visible={showDurationModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={durations}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleDurationSelect(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <CustomButton
                title="Close"
                handlePress={() => setShowDurationModal(false)}
                containerStyles="w-full mt-7 rounded-md min-h-[48px]"
                textStyles="text-base"
            />
          </View>
        </View>
      </Modal>

      {/* Modal for gender restriction */}
      <Modal visible={showGenderModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={genderRestrictions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleGenderSelect(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <CustomButton
                title="Close"
                handlePress={() => setShowGenderModal(false)}
                containerStyles="w-full mt-7 rounded-md min-h-[48px]"
                textStyles="text-base"
            />
          </View>
        </View>
      </Modal>

      {/* Modal for age restriction */}
      <Modal visible={showAgeModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={ageRestrictions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleAgeSelect(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <CustomButton
                title="Close"
                handlePress={() => setShowAgeModal(false)}
                containerStyles="w-full mt-7 rounded-md min-h-[48px]"
                textStyles="text-base"
            />
          </View>
        </View>
      </Modal>

      <View className="flex-row items-center justify-center mb-8">
        <CustomButton
          title="Submit"
          handlePress={handleSubmit}
          containerStyles="w-4/5 mt-7 rounded-md"
          textStyles="text-base"
          isLoading={isSubmitting}
        />
      </View>
    </ScrollView>
  );
};

export default NewEventForm;

const styles = StyleSheet.create({
  separator: {
    height: 1,
    backgroundColor: '#000',
    marginVertical: 8
  },
  adjustButton: {
    backgroundColor: '#7257ca',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 25,
  },
  adjustButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  participantInput: {
    borderBottomWidth: 1,
    borderColor: '#000',
    width: 50,
    textAlign: 'center',
    fontSize: 16,
    color: '#000',
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  floatingContainer: {
    top: -20,
    width: '90%',
    backgroundColor: 'transparent',
    borderRadius: 10,
    alignItems: 'center',
  },
  SearchBar: {
    container: {
      width: '100%',
      marginBottom: 20,
      backgroundColor: 'transparent',
      borderRadius: 25,
      zIndex: 11,
    },
    listView: {
      position: 'absolute',
      top: 60,
      zIndex: 11,
      borderRadius: 25,
    },
    textInputContainer: {
      backgroundColor: 'transparent',
      borderRadius: 25,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    textInput: {
      backgroundColor: 'white',
      color: '#5d5d5d',
      fontSize: 16,
      borderRadius: 25,
    },
  },
  clearButton: {
    position: 'absolute',
    top: 0,
    right: 6, 
    backgroundColor: 'transparent',
    padding: 10,
    borderRadius: 5,
    zIndex: 11,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#000',
  },
});
