import { useState, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, Button, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
const { googleMapsApiKey } = Constants.expoConfig.extra;

import CustomButton from '../../components/CustomButton';
import { icons } from '../../constants';
import { add } from '@shopify/react-native-skia';

import * as api from '../../api'

const SavedAddresses = () => {
  const [addresses, setAddresses] = useState([
    {
      id: '1',
      label: 'Jalan 3/149e, Taman Sri Endah, 57000 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur',
      details: 'default',
    },
    {
      id: '2',
      label: '40, Jalan Indah 22/6, Taman Bukit Indah 2, 81200 Johor Bahru, Johor',
      details: '',
    },
  ]);

  const [user, setUser] = useState(null);
  const [userAddresses, setUserAddresses] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newAddress, setNewAddress] = useState(null);
  const [newDetails, setNewDetails] = useState('');

  const searchRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      }
    };

    const fetchUserAddresses = async () => {
      try {
        const storedAddresses = await AsyncStorage.getItem('userAddresses');
        if (storedAddresses) {
          setUserAddresses(JSON.parse(storedAddresses));
        }
      } catch (error) {
        console.error('Failed to load user addresses from storage:', error);
      }
    };

    fetchUserData();
    fetchUserAddresses();
  }, []);

  const clearSearch = () => {
    if (searchRef.current) {
      searchRef.current.clear();
      searchRef.current.blur();
    }
    setNewAddress(null);
  };

  const handleLocationSelect = (data, details) => {
    console.log('userAddresses:', userAddresses?.data?.addresses.length);
    const selectedAddress = data.description;
    const { lat, lng } = details.geometry.location;
    const addressComponents = details.address_components;
    const sublocality_level_1 = addressComponents.find(component =>
      component.types.includes('sublocality_level_1')
    )?.long_name;
    const locality = addressComponents.find(component =>
      component.types.includes('locality')
    )?.long_name;
    // console.log('full address:', selectedAddress);
    // console.log('city:', locality);
    // console.log('region:', sublocality_level_1);
    // console.log('lat:', lat);
    // console.log('lng:', lng);
    setNewAddress({
      fullAddress: selectedAddress,
      city: locality,
      region: sublocality_level_1,
      lat: lat,
      lng: lng,
    });
  };

  const handleAddAddress = async () => {
    console.log('Before: userAddresses:', userAddresses?.data?.addresses.length);
    
    if (userAddresses?.data?.addresses.some(address => address.fullAddress === newAddress?.fullAddress)) {
      Alert.alert("Duplicate Address", "This address already exists in your saved addresses.");
      setNewAddress(null);
      return;
    }

    if (newAddress) {
      const newEntry = {
        fullAddress: newAddress.fullAddress,
        city: newAddress.city,
        region: newAddress.region,
        lat: newAddress.lat,
        lng: newAddress.lng,
      };

      const updatedAddresses = {
        ...userAddresses,
        data: { 
          ...userAddresses.data,
          addresses: [...(userAddresses?.data?.addresses || []), newEntry] 
        },
      };

      setUserAddresses(updatedAddresses);
      
      console.log('After: updatedAddresses:', updatedAddresses);
      
      const response = await api.user.addAddress(user.accountId, newAddress);
      if(response.data === 'success') {
        await AsyncStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
      } else if(response.data === 'duplicate') {
        Alert.alert("Duplicate Address", "This address already exists in your saved addresses.");
      }else {
        Alert.alert("Add Address Status", response.data);
      }

      setShowForm(false);
      setNewAddress(null);
      setNewDetails('');
    }
};


  const renderAddress = ({ item }) => (
    <View className="flex-row justify-between items-center border-b border-gray-200 py-2">
      <View className="flex-1"> 
        <View className="flex-row justify-between items-center gap-5">
          {/* <Image source={icons.location} className="w-6 h-6" /> */}
          <View className="flex-1"> 
            <Text className="text-base font-semibold">{item.fullAddress}</Text>
          </View>
        </View>
        {
          // console.log("defaultAddress", userAddresses.data.defaultAddress.fullAddress) &&
          userAddresses.data.defaultAddress && item.fullAddress === userAddresses.data.defaultAddress.fullAddress ? (
            <Text className="text-base text-secondary ml-0 mt-2 font-semibold italic">default</Text>
          ) : (
            <TouchableOpacity
              onPress={async () => {
                console.log("Set as default pressed");
                const updatedAddress = {
                  fullAddress: item.fullAddress,
                  city: item.city,
                  region: item.region,
                  lat: item.lat,
                  lng: item.lng,
                };
            
                await api.user.updateDefaultAddress({
                  accountId: user.accountId,
                  defaultAddress: updatedAddress,
                });
            
                // Create a new updated userAddresses object with the updated default address
                /* modify the original userAddresses object without creating a new one, 
                it can lead to unpredictable behavior. The React component may not update 
                correctly because React relies on immutability to track changes. */
                const updatedUserAddresses = {
                  ...userAddresses,
                  data: {
                    ...userAddresses.data,
                    defaultAddress: updatedAddress,
                  },
                };
            
                setUserAddresses(updatedUserAddresses);
                await AsyncStorage.setItem('userAddresses', JSON.stringify(updatedUserAddresses));
                console.log("defaultAddress", updatedUserAddresses.data.defaultAddress.fullAddress);
              }}
          >
            <Text className="text-base text-secondary ml-0 mt-2 underline">set as default</Text>
          </TouchableOpacity>
          
          )
        }
      </View>
      
        <TouchableOpacity 
          onPress={async () => {
            console.log("Trash icon pressed")
            if(userAddresses.data.defaultAddress.fullAddress === item.fullAddress) {
              Alert.alert("Default Address", "You cannot remove your default address.");
              return;
            }
            Alert.alert(
              'Confirm Remove',
              'Are you sure you want to remove this address?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Remove',
                  onPress: async () => {
                    console.log('Remove address');
                    const updatedAddresses = {
                      ...userAddresses,
                      data: {
                        ...userAddresses.data,
                        addresses: userAddresses.data.addresses.filter(
                          (address) => address.fullAddress !== item.fullAddress
                        ),
                      },
                    };
                    setUserAddresses(updatedAddresses);
                    await AsyncStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));

                    await api.user.removeAddress(user.accountId, {
                      fullAddress: item.fullAddress,
                      city: item.city,
                      region: item.region,
                      lat: item.lat,
                      lng: item.lng,
                    });
                  },
                },
              ]
            );
            
          }}
        >
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
            data={userAddresses?.data?.addresses}
            keyExtractor={(item) => item.fullAddress}
            renderItem={renderAddress}
          />
         

        </View>

        <View className="absolute bottom-0 left-0 right-0 p-4">
            <CustomButton
              title="Add new address"
              handlePress={() => {
                if (userAddresses?.data?.addresses.length >= 5) {
                  Alert.alert("Limit Reached", "You can only save up to 5 addresses.");
                } else {
                  setShowForm(true);

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
