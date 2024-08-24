import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../constants';
import CustomButton from '../components/CustomButton';

import { useGlobalContext } from '../context/GlobalProvider';


export default function App() {
  const {isLoading, isLoggedIn} = useGlobalContext();

  if(!isLoading && isLoggedIn) {
    return (
      <Redirect href="/home" />
    )
  }

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView contentContainerStyle={{ height: '100%' }}>
        <View className="w-full justify-evenly items-center min-h-[85vh] px-4">
          <Image
            source={images.logo}
            className="w-[130px] h-[124px]"
            resizeMode='contain'
          />
          {/* <Image
            source={images.card}
            className="max-w-[660px] h-[300px]"
          /> */}
          <View className="relative mt-5">
          <Text className="text-3xl text-secondary font-bold text-center">
          Explore, connect, and engage with the world around you.
          </Text>
          
        </View>

        

        <CustomButton 
          title="Get Started"
          handlePress={() => { router.push('/sign-in') }}
          containerStyles="w-full mt-7"
          textStyles={'text-base'}
        />
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}


