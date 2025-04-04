import React, { useEffect, useState, useRef, useMemo, useCallback, PureComponent } from 'react';
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
import { router } from 'expo-router';
const { googleMapsApiKey } = Constants.expoConfig.extra;

const screenWidth = Dimensions.get('window').width;

const MIN_LATITUDE_DELTA = 0.022;
const MIN_LONGITUDE_DELTA = 0.072;

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
  const mapRef = useRef(null);
  const [region, setRegion] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [userAddresses, setUserAddresses] = useState(null);  // In future, can use to fetch user nearby events, etc.
  const searchRef = useRef(null);
  const flatListRef = useRef(null);
  const isFocused = useIsFocused(); // Use this to detect if screen is focused
  const [events, setEvents] = useState([]);
  const [selectedEventCard, setSelectedEventCard] = useState(null);

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
      const fetchActiveEvents = async () => {
        try {
          if(!user || !user.userId) return;
          const response = await api.event.getActiveEvents(user.userId);
          // console.log('Active events:', response.data);
          setEvents(response.data);
        } catch (error) {
          console.error('Failed to fetch active events:', error);
        }
      };

      fetchActiveEvents();
    }
  }, [isFocused, user]);

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
      setSelectedEventCard(null); // Clear selected event card
      setSelectedLocation(null); // Clear selected location

      const fetchUserAddresses = async () => {
        try {
          const storedAddresses = await AsyncStorage.getItem('userAddresses');
          if (storedAddresses && storedAddresses !== '{}') {
            const parsedAddresses = JSON.parse(storedAddresses);
            setUserAddresses(parsedAddresses);
            if(parsedAddresses.data.userDefaultAddress){
              const userDefaultAddress = parsedAddresses.data.userDefaultAddress;
              const newRegion = {
                latitude: userDefaultAddress.lat,
                longitude: userDefaultAddress.lng,
                latitudeDelta: MIN_LATITUDE_DELTA,
                longitudeDelta: MIN_LONGITUDE_DELTA
              };
              setRegion(newRegion);
              setSelectedLocation({ latitude: userDefaultAddress.lat, longitude: userDefaultAddress.lng });
            }
          }
        } catch (error) {
          console.error('Failed to load user addresses from storage:', error);
        }
      };

      fetchUserAddresses();
    }
  }, [isFocused]); // Run when the screen becomes focused

  // Function to scroll to a specific event in the FlatList
  const scrollToEvent = useCallback((eventId) => {
    const index = events.findIndex(event => event.eventId === eventId);
    if (flatListRef.current && index !== -1) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  }, [events]);

  const RenderEventCard = React.memo(({ item }) => {
    const category = categories.find(cat => cat.title === item.category);
    const formattedDate = new Date(item.startTime * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Kuala_Lumpur' });
    const formattedTime = new Date(item.startTime * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kuala_Lumpur' });
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          setSelectedEventCard(item.eventId);
          if (mapRef.current) {
            mapRef.current.animateToRegion(
              {
                latitude: item.eventLocation.lat,
                longitude: item.eventLocation.lng,
                latitudeDelta: MIN_LATITUDE_DELTA,
                longitudeDelta: MIN_LONGITUDE_DELTA,
              },
              500 // Duration in milliseconds
            );
          }
          setSelectedLocation({ latitude: item.eventLocation.lat, longitude: item.eventLocation.lng });
          setSelectedAddress(item.eventLocation.fullAddress);
        }}
      >
        <View style={[
            styles.eventCard, 
            selectedEventCard === item.eventId && { borderWidth: 4, padding: 8, borderColor: '#5e40b7' },
        ]}>
          <View className="flex-row items-start justify-between p-1 space-x-2">
            <View className="flex-1 flex-col justify-between h-full">
              <View>
                <Text className="text-base font-pbold text-secondary" numberOfLines={1}>{formattedDate} • {formattedTime}</Text>
                <Text className="text-base font-psemibold" numberOfLines={2}>{item.eventName}</Text>
                <Text className="text-base font-pregular text-gray-500" numberOfLines={1}>{item.eventAbout}</Text>
              </View>
              <View>
                <Text className="text-sm font-regular">{item.eventLocation.region? item.eventLocation.region : item.eventLocation.city}</Text>
                <Text className="text-sm font-regular">{item.eventDuration? item.eventDuration/3600 : 0} hour(s) event </Text>
              </View>
            </View>
            <View className="flex-col items-end justify-between h-full">
              <View className="flex-col items-center">
              <Image source={category.icon} style={{ width: 50, height: 50 }} tintColor={'#5e40b7'}/>
                <Text className="mt-2 font-pblack text-secondary">{item.category}</Text>
              </View>
              <View className="flex-col items-center px-0">
                <TouchableOpacity
                  onPress={() => {
                    router.push(`/event-info?eventId=${item.eventId}`);
                  }}
                >
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
      longitudeDelta: MIN_LONGITUDE_DELTA,
    };
    setRegion(newRegion);
    setSelectedLocation({ latitude: lat, longitude: lng });

    setSelectedAddress(data.description);
    const addressComponents = details.address_components;
    const sublocality_level_1 = addressComponents.find(component =>
      component.types.includes('sublocality_level_1')
    )?.long_name;

    console.log(addressComponents);
    console.log(sublocality_level_1);
  };

  const clearSearch = () => {
    if (searchRef.current) {
      searchRef.current.clear();
      searchRef.current.blur();
    }
    setSelectedLocation(null);
  };

  // Memoized EventMarker component to avoid unnecessary re-renders
  const EventMarker = React.memo(({ event, index, selectedEventCard, scrollToEvent }) => {

    // Skip rendering this event marker if it matches the selected location to avoid overlap
    if (selectedEventCard === event.eventId) {
      return null; 
    }

    // Get the event's coordinates
    const eventLat = event.eventLocation.lat;
    const eventLng = event.eventLocation.lng;
  
    // Create a small offset for each marker to avoid overlap
    const offsetLat = eventLat + index * 0.00005;
    const offsetLng = eventLng + index * 0.00005;
  
    // Memoize the coordinate object to avoid unnecessary re-renders
    const coordinate = useMemo(() => ({
      latitude: offsetLat,
      longitude: offsetLng,
    }), [offsetLat, offsetLng]);
  
    // When the marker is pressed, the horizontal event list scrolls to the corresponding event card
    const handlePress = useCallback(() => {
      scrollToEvent(event.eventId);

      // Delay to allow callout to display
      setTimeout(() => {
      }, 300);
    }, [event.eventId, scrollToEvent]);
  
    return (
      // Use custom marker instead of default pin
      <Marker
        key={event.eventId}
        coordinate={coordinate}
        title={event.eventName}
        description={event.eventAbout}
        onPress={handlePress}
      >
        <Image source={icons.flag} style={{ width: 30, height: 30 }} />
      </Marker>
    );
  }, (prevProps, nextProps) => {
    return (
      // The event marker should only re-render if the event, index, or selectedEventCard changes
      prevProps.event === nextProps.event &&
      prevProps.index === nextProps.index &&
      prevProps.selectedEventCard === nextProps.selectedEventCard
    );
  });

  const memoizedEvents = useMemo(() => events, [events]);

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
        debounce={300}
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
          ref={mapRef}
          style={styles.mapStyle}
          customMapStyle={customMapStyle}
          zoomEnabled={true}
          scrollEnabled={true}
          initialRegion={region}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={true}
          maxZoomLevel={20}
        >
          {selectedLocation && (
            <Marker coordinate={selectedLocation} title={selectedAddress ? selectedAddress : 'default address'} >
              <Image source={icons.flagRed} style={{ width: 40, height: 40 }} />
            </Marker>
          )}
          {memoizedEvents.map((event, index) => (
            <EventMarker
              key={event.eventId}
              event={event}
              index={index}
              selectedEventCard={selectedEventCard}
              scrollToEvent={scrollToEvent}
            />
          ))}

        </MapView>
      )}

      <View style={styles.horizontalScrollContainer}>
        <FlatList
          ref={flatListRef}
          horizontal
          data={events}
          renderItem={({ item }) => <RenderEventCard item={item} />}
          keyExtractor={(item) => item.eventId.toString()}
          showsHorizontalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={21}
          snapToAlignment='start'
          snapToInterval={screenWidth - 60 + 10} /* +10 because of marginRight=10 */
          decelerationRate='normal'
          getItemLayout={(data, index) => (
            { length: screenWidth - 60 + 10, offset: (screenWidth-60+10) * index, index } /* +10 because of marginRight=10 */ 
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
      top: 15,
      left: 12,
      right: 10,
      width: '75%',
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
    top: 15,
    right: 90, 
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
    height: '98%',
    width: '97%',
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

const customMapStyle = 
[
  {
      "featureType": "all",
      "elementType": "labels.text.fill",
      "stylers": [
          {
              "color": "#7c93a3"
          },
          {
              "lightness": "-10"
          }
      ]
  },
  {
      "featureType": "administrative.country",
      "elementType": "geometry",
      "stylers": [
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "administrative.country",
      "elementType": "geometry.stroke",
      "stylers": [
          {
              "color": "#a0a4a5"
          }
      ]
  },
  {
      "featureType": "administrative.province",
      "elementType": "geometry.stroke",
      "stylers": [
          {
              "color": "#62838e"
          }
      ]
  },
  {
      "featureType": "landscape",
      "elementType": "geometry.fill",
      "stylers": [
          {
              "color": "#dde3e3"
          }
      ]
  },
  {
      "featureType": "landscape.man_made",
      "elementType": "geometry.stroke",
      "stylers": [
          {
              "color": "#3f4a51"
          },
          {
              "weight": "0.30"
          }
      ]
  },
  {
      "featureType": "poi",
      "elementType": "all",
      "stylers": [
          {
              "visibility": "simplified"
          }
      ]
  },
  {
      "featureType": "poi.attraction",
      "elementType": "all",
      "stylers": [
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "poi.business",
      "elementType": "all",
      "stylers": [
          {
              "visibility": "off"
          }
      ]
  },
  {
      "featureType": "poi.government",
      "elementType": "all",
      "stylers": [
          {
              "visibility": "off"
          }
      ]
  },
  {
      "featureType": "poi.park",
      "elementType": "all",
      "stylers": [
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "poi.place_of_worship",
      "elementType": "all",
      "stylers": [
          {
              "visibility": "off"
          }
      ]
  },
  {
      "featureType": "poi.school",
      "elementType": "all",
      "stylers": [
          {
              "visibility": "off"
          }
      ]
  },
  {
      "featureType": "poi.sports_complex",
      "elementType": "all",
      "stylers": [
          {
              "visibility": "off"
          }
      ]
  },
  {
      "featureType": "road",
      "elementType": "all",
      "stylers": [
          {
              "saturation": "-100"
          },
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "road",
      "elementType": "geometry.stroke",
      "stylers": [
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "road.highway",
      "elementType": "geometry.fill",
      "stylers": [
          {
              "color": "#bbcacf"
          }
      ]
  },
  {
      "featureType": "road.highway",
      "elementType": "geometry.stroke",
      "stylers": [
          {
              "lightness": "0"
          },
          {
              "color": "#bbcacf"
          },
          {
              "weight": "0.50"
          }
      ]
  },
  {
      "featureType": "road.highway",
      "elementType": "labels",
      "stylers": [
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "road.highway",
      "elementType": "labels.text",
      "stylers": [
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "road.highway.controlled_access",
      "elementType": "geometry.fill",
      "stylers": [
          {
              "color": "#ffffff"
          }
      ]
  },
  {
      "featureType": "road.highway.controlled_access",
      "elementType": "geometry.stroke",
      "stylers": [
          {
              "color": "#a9b4b8"
          }
      ]
  },
  {
      "featureType": "road.arterial",
      "elementType": "labels.icon",
      "stylers": [
          {
              "invert_lightness": true
          },
          {
              "saturation": "-7"
          },
          {
              "lightness": "3"
          },
          {
              "gamma": "1.80"
          },
          {
              "weight": "0.01"
          }
      ]
  },
  {
      "featureType": "transit",
      "elementType": "all",
      "stylers": [
          {
              "visibility": "off"
          }
      ]
  },
  {
      "featureType": "water",
      "elementType": "geometry.fill",
      "stylers": [
          {
              "color": "#a3c7df"
          }
      ]
  }
]


export default Discover;
