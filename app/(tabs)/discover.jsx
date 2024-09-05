import React, { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Platform, PermissionsAndroid } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

import Constants from 'expo-constants';
const { googleMapsApiKey } = Constants.expoConfig.extra;

const MIN_LATITUDE_DELTA = 0.04;
const MIN_LONGITUDE_DELTA = 0.04;

const initialRegion = {
  latitude: 3.06384,
  longitude: 101.69694,
  latitudeDelta: MIN_LATITUDE_DELTA,
  longitudeDelta: MIN_LONGITUDE_DELTA
};



const Discover = () => {
  const [locationPermission, setLocationPermission] = useState(false);
  const [region, setRegion] = useState(initialRegion);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const searchRef = useRef(null);

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

  const handleLocationSelect = (data, details) => {
    const { lat, lng } = details.geometry.location;
    // console.log(lat, lng);
    const newRegion = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: MIN_LATITUDE_DELTA,
      longitudeDelta: MIN_LONGITUDE_DELTA
    };
    setRegion(newRegion);
    setSelectedLocation({ latitude: lat, longitude: lng });

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
  }

  const onRegionChange = (newRegion) => {
    const restrictedRegion = {
      ...newRegion,
      latitudeDelta: Math.max(newRegion.latitudeDelta, MIN_LATITUDE_DELTA),
      longitudeDelta: Math.max(newRegion.longitudeDelta, MIN_LONGITUDE_DELTA),
    };
    setRegion(restrictedRegion);
  }

  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete 
        ref={searchRef}
        placeholder='Search address or city ...'
        onPress={(data, details = null) => handleLocationSelect(data, details)}
        query={{
          key: googleMapsApiKey,
          language: 'en',
          // types: '(cities)',
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
          maxZoomLevel={14}
        >
          {selectedLocation && (
            <Marker coordinate={selectedLocation} title='Selected Location' />
          )}
        </MapView>
      )}
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
      top: '90%',
      left: 10,
      right: 10,
      width: 'auto',
      zIndex: 2,
      backgroundColor: 'transparent',
      borderRadius: 25,
    },
    listView: {
      position: 'absolute',
      bottom: 60,              
      zIndex: 2,
      borderRadius: 25,
    },
    // row: {
    //   backgroundColor: 'rgba(254, 204, 29, 0.7)', 
    //   padding: 10,
    //   borderBottomColor: 'transparent',
    //   borderBottomWidth: 1,
    // },
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
    top: '90%',
    right: 15, 
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
});

export default Discover;
