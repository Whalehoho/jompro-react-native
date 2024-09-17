import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, ScrollView, FlatList, Dimensions, Platform, PermissionsAndroid } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import * as api from '../../api';
import { icons } from '../../constants';
import { images } from '../../constants';

import Constants from 'expo-constants';
const { googleMapsApiKey } = Constants.expoConfig.extra;

const screenWidth = Dimensions.get('window').width;

const MIN_LATITUDE_DELTA = 0.016;
const MIN_LONGITUDE_DELTA = 0.016;

const initialRegion = {
  latitude: 3.06384,
  longitude: 101.69694,
  latitudeDelta: MIN_LATITUDE_DELTA,
  longitudeDelta: MIN_LONGITUDE_DELTA,
};

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

const Discover = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [region, setRegion] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [userAddresses, setUserAddresses] = useState(null);
  const searchRef = useRef(null);
  const isFocused = useIsFocused(); // Use this to detect if screen is focused
  const [sessions, setSessions] = useState([]);
  // const [sessionsWithCategory, setSessionsWithCategory] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedSessionCard, setSelectedSessionCard] = useState(null);

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
    if (isFocused) {
      const fetchActiveSessions = async () => {
        try {
          const response = await api.event.getAllActiveSessions();
          setSessions(response.data);
        } catch (error) {
          console.error('Failed to fetch active sessions:', error);
        }
      };

      fetchActiveSessions();
  }
  }, [isFocused]);

  // useEffect(() => {
  //   const fetchEvents = async () => {
  //     if (!sessions || sessions.length === 0) {
  //       return;
  //     }
  //     try {
  //       const updatedSessions = await Promise.all(
  //         sessions.map(async (session) => {
  //           if(session.category){
  //             return session;
  //           }
  //           // console.log('Fetching event:', session.eventId);
  //           const response = await api.event.getEventByEventId(session.eventId);
  //           const event = response.data;

  //           // console.log('Session:', session);

  //           // Return the session with the event category added
  //           return {
  //             ...session,
  //             category: event.category, // Assuming event has a `category` field
  //           };
  //         })
  //       );

  //       // Update sessions with the new category field
  //       // setSessions(updatedSessions);
  //       setSessionsWithCategory(updatedSessions); // Avoid using original sessions array in flatlist to prevent re-rendering
  //     } catch (error) {
  //       console.error('Failed to fetch events:', error);
  //     }
  //   };

  //   fetchEvents();
  // }, [sessions]);

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setLocationPermission(true);
        }
      } else {
        const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        if (result === RESULTS.GRANTED) {
          setLocationPermission(true);
        }
      }
    };

    requestLocationPermission();
  }, []);

  useEffect(() => {
    // This effect runs every time the screen comes into focus
    if (isFocused) {
      clearSearch(); // Clear search input
      setRegion(null); // Reset region to the initial one
      setSelectedAddress(null); // Clear selected address
      setSelectedSessionCard(null); // Clear selected session card
      setSelectedLocation(null); // Clear selected location

      const fetchUserAddresses = async () => {
        try {
          const storedAddresses = await AsyncStorage.getItem('userAddresses');
          if (storedAddresses && storedAddresses !== '{}') {
            const parsedAddresses = JSON.parse(storedAddresses);
            setUserAddresses(parsedAddresses);
            if(parsedAddresses.data.defaultAddress){
              const defaultAddress = parsedAddresses.data.defaultAddress;
              const newRegion = {
                latitude: defaultAddress.lat,
                longitude: defaultAddress.lng,
                latitudeDelta: MIN_LATITUDE_DELTA,
                longitudeDelta: MIN_LONGITUDE_DELTA
              };
              setRegion(newRegion);
              setSelectedLocation({ latitude: defaultAddress.lat, longitude: defaultAddress.lng });
            }
          }
        } catch (error) {
          console.error('Failed to load user addresses from storage:', error);
        }
      };

      fetchUserAddresses();
    }
  }, [isFocused]); // Run when the screen becomes focused


  const RenderSessionCard = React.memo(({ item }) => {
    const category = categories.find(cat => cat.title === item.category);
    const formattedDate = new Date(item.startTime * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Kuala_Lumpur' });
    const formattedTime = new Date(item.startTime * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kuala_Lumpur' });
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          setSelectedSessionCard(item.sessionId);
          setRegion({
            latitude: item.location.lat,
            longitude: item.location.lng,
            latitudeDelta: MIN_LATITUDE_DELTA,
            longitudeDelta: MIN_LONGITUDE_DELTA
          });
          setSelectedLocation({ latitude: item.location.lat, longitude: item.location.lng });
          setSelectedAddress(item.location.fullAddress);
        }}
      >
        <View style={[
            styles.eventCard, 
            selectedSessionCard === item.sessionId && { borderWidth: 4, padding: 8, borderColor: '#5e40b7' },
        ]}>
          <View className="flex-row items-start justify-between p-1 space-x-2">
            <View className="flex-1 flex-col justify-between h-full">
              <View>
                <Text className="text-base font-pbold text-secondary" numberOfLines={1}>{formattedDate} • {formattedTime}</Text>
                <Text className="text-base font-psemibold" numberOfLines={2}>{item.sessionName}</Text>
                <Text className="text-base font-pregular text-gray-500" numberOfLines={1}>{item.sessionDesc}</Text>
              </View>
              <View>
                <Text className="text-sm font-regular">{item.location.region? item.location.region : item.location.city}</Text>
                <Text className="text-sm font-regular">{item.participants ? item.participants.length : 0} attendee(s)</Text>
              </View>
            </View>
            <View className="flex-col items-end justify-between h-full">
              <View className="flex-col items-center">
                <Image source={category.icon} style={{ width: 50, height: 50 }} tintColor={'#5e40b7'}/>
                <Text className="mt-2 font-pblack text-secondary">{item.category}</Text>
              </View>
              <View className="flex-col items-center px-0">
                <TouchableOpacity>
                  <Image source={icons.maximize} style={{ width: 25, height: 25 }} tintColor={'#5e40b7'}/>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, (prevProps, nextProps) => {
    return prevProps.item === nextProps.item;
  });


  const handleLocationSelect = (data, details) => {
    const { lat, lng } = details.geometry.location;
    const newRegion = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: MIN_LATITUDE_DELTA,
      longitudeDelta: MIN_LONGITUDE_DELTA
    };
    setRegion(newRegion);
    setSelectedLocation({ latitude: lat, longitude: lng });

    setSelectedAddress(data.description);
    const addressComponents = details.address_components;
    const sublocality_level_1 = addressComponents.find(component =>
      component.types.includes('sublocality_level_1')
    )?.long_name;

    // console.log(addressComponents);
    // console.log(sublocality_level_1);
  };

  const clearSearch = () => {
    if (searchRef.current) {
      searchRef.current.clear();
      searchRef.current.blur();
    }
    setSelectedLocation(null);
  };

  const onRegionChange = (newRegion) => {
    const restrictedRegion = {
      ...newRegion,
      latitudeDelta: Math.max(newRegion.latitudeDelta, MIN_LATITUDE_DELTA),
      longitudeDelta: Math.max(newRegion.longitudeDelta, MIN_LONGITUDE_DELTA),
    };
    setRegion(restrictedRegion);
  };

  const SessionMarker = React.memo(({ session, index, selectedSessionCard }) => {
    if (selectedSessionCard === session.sessionId) {
      return null; // Skip rendering this session marker if it matches the selected location
    }

    // console.log('Rendering session marker:', session.sessionId);
  
    const sessionLat = session.location.lat;
    const sessionLng = session.location.lng;
  
    const offsetLat = sessionLat + index * 0.00005;
    const offsetLng = sessionLng + index * 0.00005;
  
    const coordinate = useMemo(() => ({
      latitude: offsetLat,
      longitude: offsetLng,
    }), [offsetLat, offsetLng]);
  
    const handlePress = useCallback(() => {
      console.log('Session marker pressed:', session.sessionId);
    }, [session.sessionId]);
  
    return (
      <Marker
        key={session.sessionId}
        coordinate={coordinate}
        title={session.sessionName}
        description={session.sessionDesc}
        onPress={handlePress}
      >
        <Image source={icons.flag} style={{ width: 30, height: 30 }} />
      </Marker>
    );
  }, (prevProps, nextProps) => {
    return (
      prevProps.session === nextProps.session &&
      prevProps.index === nextProps.index &&
      prevProps.selectedSessionCard === nextProps.selectedSessionCard
    );
  });
  

  return (
    <View style={styles.container}>
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
      {locationPermission && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.mapStyle}
          zoomEnabled={true}
          scrollEnabled={true}
          initialRegion={region}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={true}
          maxZoomLevel={20}
        >
          {selectedLocation && (
            <Marker coordinate={selectedLocation} title={selectedAddress ? selectedAddress : 'default address'} />
          )}
         {sessions.map((session, index) => (
            <SessionMarker
              key={session.sessionId}
              session={session}
              index={index}
              selectedSessionCard={selectedSessionCard}
            />
          ))}

        </MapView>
      )}

      <View style={styles.horizontalScrollContainer}>
        <FlatList
          horizontal
          data={sessions} // // Avoid using original sessions array in flatlist to prevent re-rendering
          renderItem={({ item }) => <RenderSessionCard item={item} />}
          keyExtractor={(item) => item.sessionId.toString()}
          showsHorizontalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          getItemLayout={(data, index) => (
            { length: 180, offset: 180 * index, index }
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  SearchBar: {
    container: {
      position: 'absolute',
      top: 9,
      left: 10,
      right: 10,
      width: '80%',
      zIndex: 2,
      backgroundColor: 'transparent',
      borderRadius: 25,
    },
    listView: {
      position: 'absolute',
      // bottom: 60,   
      top: 60,           
      zIndex: 2,
      borderRadius: 25,
    },
    textInputContainer: {
      backgroundColor: 'transparent',
      borderRadius: 25,
      borderWidth: 1,
      borderColor: '#5e40b7',

    },
    textInput: {
      height: '100%',
      backgroundColor: 'rgba(254, 204, 29, 0.7)',
      color: '#5d5d5d',
      fontSize: 16,
      borderRadius: 25,
    },
  },
  clearButton: {
    position: 'absolute',
    top: 9,
    right: 70, 
    backgroundColor: 'transparent',
    padding: 10,
    borderRadius: 5,
    zIndex: 3,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#5e40b7',
  },
  mapStyle: {
    height: '100%',
    width: '100%',
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
  },
  horizontalScrollContainer: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0)',
  },
  eventCard: {
    backgroundColor: '#fecc1d',
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#836eca',
    marginRight: 10,
    width: screenWidth - 60,
    height: 180,
  }
});

export default Discover;
