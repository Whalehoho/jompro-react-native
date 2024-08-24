import { View, Text, ScrollView, Image, Alert } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { images } from '../../constants'
import FormField from '../../components/FormField'
import CustomButton from '../../components/CustomButton'

import * as api from '../../api'

import { useGlobalContext } from '../../context/GlobalProvider'

const SignIn = () => {
  const [form, setForm] = useState({
    email: '',
    password: ''
  })

  const [isSubmitting, setisSubmitting] = useState(false)

  const { loginUser } = useGlobalContext();

  const submit = async () => {
    if(!form.email || !form.password) {
      return Alert.alert('Please fill in all fields')
    }
    setisSubmitting(true);
    try{
      const user = {
        email: form.email,
        password: form.password
      }
      const message = await api.auth.login(user)
      if(message.data !== 'success') {
        Alert.alert("Login Status", message.data);
      }
      else{
        // Set user token in AsyncStorage
        const token = message.token
        await AsyncStorage.setItem('userToken', token)
        // Set user in global state using Context
        loginUser(message.user)
        console.log(message.user)
        // Redirect to Home
        router.replace('/home')
      }
    } catch (error) {
      if (!error.response || error.response.status !== 401) {
        Alert.alert('Error', error.message || 'Something went wrong');
      }
    } finally {
      setisSubmitting(false)
    }
  }

  return (
    <SafeAreaView className="bg-primary h-full">  
      <ScrollView>
        <View className="justify-center w-full min-h-[85vh] px-4 my-6">
          <Image source={images.logo} className="w-[130px] h-[124px]" resizeMode='contain' />
          <Text className="text-2xl text-secondary text-semibold mt-10 font-psemibold">Log in to Jom Pro</Text>
          <FormField 
            title="Email"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles="mt-7"
            keyboardType="email-address"
          />
          <FormField 
            title="Password"
            value={form.password}
            handleChangeText={(p) => setForm({ ...form, password: p })}
            otherStyles="mt-7"
          />
          <CustomButton 
            title="Log in"
            handlePress={submit}
            containerStyles="mt-7"
            textStyles={'text-base'} 
            isLoading={isSubmitting}
          />

          <View className="justify-center pt-5 flex-row gap-2">
            <Text className="text-sm text-secondary font-pregular">Don't have an account?</Text>
            <Link href="/sign-up" className="text-sm text-secondary font-psemibold">Sign up</Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SignIn