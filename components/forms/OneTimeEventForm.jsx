import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, Modal, FlatList, Switch } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomButton from '../CustomButton';
import FormField from '../../components/FormField'
import { icons } from '../../constants';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
const { googleMapsApiKey } = Constants.expoConfig.extra;

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

// Predefined duration options
const durations = [
    '1 hour(s)', '1.5 hour(s)', '2 hour(s)', '2.5 hour(s)', '3 hour(s)', '3.5 hour(s)', 
    '4 hour(s)', '4.5 hour(s)', '5 hour(s)', '5.5 hour(s)', '6 hour(s)', '6.5 hour(s)', 
    '7 hour(s)', '7.5 hour(s)', '8 hour(s)', '1 day(s)', '2 day(s)', '3 day(s)'
];

const genderRestrictions = ['No restrictions', 'Male', 'Female'];

const ageRestrictions = ['No restrictions', 'Adult (18-50)', 'Senior (50+)'];

const OneTimeEventForm = () => {
  const [form, setForm] = useState({
    eventName: '',
    eventDescription: '',
    eventDate: '',
    category: '',
    duration: '',
    participants: '1',
    location: null,
    genderRestriction: '',
    ageRestriction: '',
    autoApprove: false,
  });

  // DateTimePicker states
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mode, setMode] = useState('date');
  
  // Modal states for duration selection
  const [showDurationModal, setShowDurationModal] = useState(false);

  // Modal states for gender restriction
  const [showGenderModal, setShowGenderModal] = useState(false);

  // Modal states for age restriction
  const [showAgeModal, setShowAgeModal] = useState(false);

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

  const handleSubmit = () => {
    console.log('Form data:', form);
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate); // Update the date in state
    setForm({ ...form, eventDate: currentDate.toLocaleString() }); // Add the selected date to the form state
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
      <Text className="font-pbold text-xl mb-8 text-center">CREATE A ONE-TIME MEET</Text>

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

      <Text className="font-pmedium text-sm text-gray-500 mt-8">SESSION DETAILS</Text>

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

      <Text className="font-pmedium text-sm text-gray-500 mt-8">EVENT NAME</Text>



      <FormField
        title=""
        value={form.eventName}
        handleChangeText={(text) => setForm({ ...form, eventName: text })}
        placeholder="Add Event Name"
        titleStyle="text-black"
        boxStyle="border-gray-200 bg-gray-200 rounded-sm h-14 px-4"
        otherStyles="mt-5 space-y-1"
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


      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode={mode}
          is24Hour={true}
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
          title="Create Event"
          handlePress={handleSubmit}
          containerStyles="w-4/5 mt-7 rounded-md"
          textStyles="text-base"
        />
      </View>
    </View>
  );
};

export default OneTimeEventForm;

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
