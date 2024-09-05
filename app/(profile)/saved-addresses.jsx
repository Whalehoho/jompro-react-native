import { useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, Button, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
const { googleMapsApiKey } = Constants.expoConfig.extra;

import CustomButton from '../../components/CustomButton';
import { icons } from '../../constants';

const SavedAddresses = () => {
  const [addresses, setAddresses] = useState([
    {
      id: '1',
      label: 'Jalan 3/149e, Taman Sri Endah, 57000 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur',
      details: 'default',
    },
    {
      id: '2',
      label: '40, Jalan Indah 22/6Taman Bukit Indah 2, 81200 Johor Bahru, Johor',
      details: '',
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newDetails, setNewDetails] = useState('');

  const searchRef = useRef(null);

  const clearSearch = () => {
    if (searchRef.current) {
      searchRef.current.clear();
      searchRef.current.blur();
    }
    setNewAddress('');
  };

  const handleLocationSelect = (data, details) => {
    const selectedAddress = data.description;
    setNewAddress(selectedAddress);
  };

  const handleAddAddress = () => {
    if (newAddress) {
      const newEntry = {
        id: (addresses.length + 1).toString(),
        label: newAddress,
        details: newDetails,
      };
      setAddresses([...addresses, newEntry]);
      setShowForm(false);
      setNewAddress('');
      setNewDetails('');
    }
  };

  const renderAddress = ({ item }) => (
    <View className="flex-row justify-between items-center border-b border-gray-200 py-2">
      <View className="flex-1"> 
        <View className="flex-row justify-between items-center gap-5">
          {/* <Image source={icons.location} className="w-6 h-6" /> */}
          <View className="flex-1"> 
            <Text className="text-base font-semibold">{item.label}</Text>
          </View>
        </View>
        {
          item.details && item.details === 'default' ? (
            <Text className="text-base text-secondary ml-0 mt-2 font-semibold italic">{item.details}</Text>
          ) : (
            <TouchableOpacity onPress={() => console.log("Set as default pressed")}>
              <Text className="text-base text-secondary ml-0 mt-2 underline">set as default</Text>
            </TouchableOpacity>
          )
        }
      </View>
      
        <TouchableOpacity onPress={() => console.log("Trash icon pressed")}>
          <View className="bg-red-500 px-4 py-8 items-center justify-center">
            <Image source={icons.trash} className="w-6 h-6" />
          </View>
        </TouchableOpacity>
      
    </View>
  );
  
  

  return (
    <>
      <SafeAreaView className="flex-1 bg-white h-full">
        <View className="w-full min-h-[85vh] px-4">
          {/* FlatList to render dynamic addresses */}
          <FlatList
            data={addresses}
            keyExtractor={(item) => item.id}
            renderItem={renderAddress}
          />
         

        </View>

        <View className="absolute bottom-0 left-0 right-0 p-4">
            <CustomButton
              title="Add new address"
              handlePress={() => {
                if (addresses.length < 5) {
                  setShowForm(true);
                } else {
                  Alert.alert("Limit Reached", "You can only save up to 5 addresses.");
                }
              }}
              containerStyles="rounded-md"
              textStyles="text-base"
            />
          </View>

        {/* Floating form for adding a new address */}
        {showForm && (
          <View style={styles.overlay}>
            <View style={styles.floatingContainer}>
              <GooglePlacesAutocomplete 
                ref={searchRef}
                placeholder='Search address or city ...'
                onPress={(data, details = null) => handleLocationSelect(data, details)}
                query={{
                  key: googleMapsApiKey,
                  language: 'en',
                  components: "country:my", 
                }}
                fetchDetails={true}
                styles={styles.SearchBar}
              />
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearSearch}
              >
                <Text style={styles.clearButtonText}>✖</Text>
              </TouchableOpacity>
              
              {/* Save and Cancel buttons below the search bar */}
              <View className="mt-14 w-full px-4 flex-row justify-around">
                <CustomButton
                  title="Save"
                  handlePress={handleAddAddress}
                  containerStyles="w-[40%] h-auto"
                  textStyles={'text-sm'}
                />
                <CustomButton
                  title="Cancel"
                  handlePress={() => setShowForm(false)}
                  containerStyles="w-[40%] h-auto"
                  textStyles={'text-sm'}
                />
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
      <StatusBar backgroundColor='#ffffff' style='auto' hidden={false} translucent={false} />
    </>
  );
};

const styles = StyleSheet.create({
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
    right: 15, 
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

export default SavedAddresses;
