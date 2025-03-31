import { View, Text, ScrollView, Image, Alert } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'

import { images } from '../../constants'
import FormField from '../../components/FormField'
import CustomButton from '../../components/CustomButton'

import * as api from '../../api'

const SignUp = () => {
  const [form, setForm] = useState({
    username: '',
    userEmail: '',
    password: ''
  })

  const [isSubmitting, setisSubmitting] = useState(false)

  const submit = async () => {
    if(!form.username || !form.userEmail || !form.password) {
      return Alert.alert('Please fill in all fields')
    }
    setisSubmitting(true);
    try{
      const user = {
        userName: form.username,
        userEmail: form.userEmail,
        password: form.password
      }
      const message = await api.auth.register(user)
      Alert.alert("Registration Status", message.data);
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setisSubmitting(false)
    }
    
  }

  return (
    <SafeAreaView className="bg-primary h-full">  
      <ScrollView>
        <View className="justify-center w-full min-h-[85vh] px-4 my-6">
          <Image source={images.logo} className="w-[130px] h-[124px]" resizeMode='contain' />
          <Text className="text-2xl text-secondary text-semibold mt-10 font-psemibold">Sign up to Jom Pro</Text>
          <FormField 
            title="Username"
            subtitle="* Whitespaces not allowed"
            subtitleStyle={'mb-0 text-secondary'}
            value={form.username}
            handleChangeText={(e) => setForm({ ...form, username: e })}
            otherStyles="mt-10"
          />
          <FormField 
            title="Email"
            value={form.userEmail}
            handleChangeText={(e) => setForm({ ...form, userEmail: e })}
            otherStyles="mt-7"
            keyboardType="email-address"
          />
          <FormField 
            title="Password"
            subtitle="* Whitespaces not allowed"
            subtitleStyle={'mb-0 text-secondary'}
            value={form.password}
            handleChangeText={(p) => setForm({ ...form, password: p })}
            otherStyles="mt-7"
          />
          <CustomButton 
            title="Sign Up"
            handlePress={submit}
            containerStyles="mt-7"
            textStyles={'text-base'} 
            isLoading={isSubmitting}
          />

          <View className="justify-center pt-5 flex-row gap-2">
            <Text className="text-sm text-secondary font-pregular">Have an account already?</Text>
            <Link href="/sign-in" className="text-sm text-secondary font-psemibold">Sign in</Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SignUp