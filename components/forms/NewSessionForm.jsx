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

const durations = [
    '1 hour(s)', '1.5 hour(s)', '2 hour(s)', '2.5 hour(s)', '3 hour(s)', '3.5 hour(s)', 
    '4 hour(s)', '4.5 hour(s)', '5 hour(s)', '5.5 hour(s)', '6 hour(s)', '6.5 hour(s)', 
    '7 hour(s)', '7.5 hour(s)', '8 hour(s)', '1 day(s)', '2 day(s)', '3 day(s)'
];

const genderRestrictions = ['No restrictions', 'Male', 'Female'];

const ageRestrictions = ['No restrictions', 'Adult (18-50)', 'Senior (50+)'];

const NewSessionForm = ({ onSubmit }) => {
  const [form, setForm] = useState({
    event: null,
    sessionName: '',
    sessionDescription: '',
    sessionDate: null,
    duration: '',
    participants: '1',
    location: null,
    genderRestriction: '',
    ageRestriction: '',
    autoApprove: false,
  });

  const [user, setUser] = useState(null);
  const [myEvents, setMyEvents] = useState([]);

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
    const fetchMyEvents = async () => {
        try{
            const response = await api.event.getMyEvents(user.accountId);
            // console.log('My events:', response.data);
            setMyEvents(response.data);
        } catch (error) {
            // console.error('Failed to fetch events:', error);
        }
    };
    fetchMyEvents();
  }, [user]); // Fetch events when user state changes

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states for event selection
  const [showEventModal, setShowEventModal] = useState(false);

  const handleEventSelect = (selectedEvent) => {
    setForm({ ...form, event: selectedEvent });
    setShowEventModal(false);
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
    console.log('full address:', selectedAddress);
    console.log('city:', locality);
    setSelectedAddress({
        fullAddress: selectedAddress,
        city: locality,
        region: sublocality_level_1,
        lat: lat,
        lng: lng,
      });
  }

  const handleAddAddress = () => {
    if(!selectedAddress) return;
    setForm({ ...form, location: selectedAddress });
    setShowLocationModal(false);
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if(!form || !form.event || !form.sessionName || !form.sessionDescription 
        || !form.sessionDate || !form.duration 
        || !form.participants || !form.location || !form.genderRestriction 
        || !form.ageRestriction) {
            Alert.alert('Please fill in all fields');
            setIsSubmitting(false);
            return;
    }

    try{
      const sessionDate = new Date(form.sessionDate).getTime() / 1000;
      const duration = convertDurationToSeconds(form.duration);
      const ageRestriction = parseAgeRestriction(form.ageRestriction);
      const eventId = form.event.eventId;
      await api.event.updateSession({
        eventId: eventId,
        sessionName: form.sessionName,
        sessionDesc: form.sessionDescription,
        organizerId: user.accountId,
        status: 'active',
        startTime: sessionDate,
        duration: duration,
        location: form.location,
        maxParticipants: parseInt(form.participants, 10),
        genderRestriction: form.genderRestriction,
        ageRestriction: ageRestriction,
        autoApprove: form.autoApprove,
      });
      Alert.alert('Success', 'Session created successfully');
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
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate); // Update the date in state
    // setForm({ ...form, sessionDate: currentDate.toLocaleString() }); // Add the selected date to the form state
    setForm({ ...form, sessionDate: currentDate });
  };

  const showMode = (currentMode) => {
    setShowDatePicker(true);
    setMode(currentMode);
  };

  const handleDurationSelect = (selectedDuration) => {
    setForm({ ...form, duration: selectedDuration });
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
    <View className="px-2 py-2">
      <Text className="font-pbold text-xl mb-8 text-center">CREATE A NEW SESSION</Text>

      <Text className="font-pmedium text-sm text-gray-500">EVENT</Text>

      <TouchableOpacity onPress={() => setShowEventModal(true)}>
          <View className="flex-row space-x-4 mt-4">
            <Image source={icons.event} className="w-6 h-6" tintColor={'#5e40b7'} />
            <Text className="font-pregular text-base">
              {form.event ? `${form.event.eventName}` : 'Select From My Events'}
            </Text>
          </View>
        </TouchableOpacity>


      <View style={styles.separator} className="mt-8 mb-0" />

      <Text className="font-pmedium text-sm text-gray-500 mt-8">SESSION DETAILS</Text>

      <View className="flex-col items-start justify-center mt-4 space-y-4">
        <TouchableOpacity onPress={() => showMode('date')}>
          <View className="flex-row space-x-4">
            <Image source={icons.calendar} className="w-6 h-6" tintColor={'#5e40b7'} />
            <Text className="font-pregular text-base">
              {form.sessionDate ? `${form.sessionDate}` : 'Select Date and Time'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowDurationModal(true)}>
          <View className="flex-row space-x-4">
            <Image source={icons.stopwatch} className="w-6 h-6" tintColor={'#5e40b7'} />
            <Text className="font-pregular text-base">
              {form.duration ? `${form.duration}` : 'Select Duration'}
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
                {selectedAddress ? `${selectedAddress.fullAddress}` : 'Select Location'}
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

      <Text className="font-pmedium text-sm text-gray-500 mt-8">SESSION NAME</Text>



      <FormField
        title=""
        value={form.sessionName}
        handleChangeText={(text) => setForm({ ...form, sessionName: text })}
        placeholder="Add Session Name"
        titleStyle="text-black"
        boxStyle="border-gray-200 bg-gray-200 rounded-sm h-14 px-4"
        otherStyles="mt-5 space-y-1"
        multiLine={true}
      />

      <FormField
         title=""
         value={form.sessionDescription}
         handleChangeText={(text) => setForm({ ...form, sessionDescription: text })}
         multiLine={true}
         placeholder="Add Notes or Description"
         titleStyle="text-black"
         boxStyle="border-gray-200 bg-gray-200 rounded-sm h-48 px-4 py-2 items-start"
         otherStyles="mt-5 space-y-1"
      />
      
      <View style={styles.separator} className="mt-8 mb-0" />

      <Text className="font-pmedium text-sm text-gray-500 mt-8">ADVANCED</Text>

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

    {/* Modal for selecting event */}
    <Modal visible={showEventModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
            <FlatList
                data={myEvents}
                keyExtractor={(item) => item.eventId.toString()}
                renderItem={({ item }) => {
                // Find the matching category from your categories array
                const eventCategory = categories.find(
                    (category) => category.title === item.category
                );
                const eventIcon = eventCategory ? eventCategory.icon : null;

                return (
                    <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => handleEventSelect(item)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {/* Icon on the left */}
                            {eventIcon && (
                                <View style={{ flex: 0 }}>
                                <Image
                                    source={eventIcon}
                                    style={{ width: 24, height: 24, marginRight: 10 }}
                                />
                                </View>
                            )}
                            
                            {/* Event name in the center */}
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={styles.modalItemText}>{item.eventName}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                );
                }}
            />
            <CustomButton
                title="Close"
                handlePress={() => setShowEventModal(false)}
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
          title="Create Session"
          handlePress={handleSubmit}
          containerStyles="w-4/5 mt-7 rounded-md"
          textStyles="text-base"
          isLoading={isSubmitting}
        />
      </View>
    </View>
  );
};

export default NewSessionForm;

const styles = StyleSheet.create({
  separator: {
    height: 1,
    backgroundColor: '#ccc',
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
    borderColor: '#ccc',
    width: 50,
    textAlign: 'center',
    fontSize: 16,
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
