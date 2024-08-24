import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'


const CustomButton = ({title, handlePress, containerStyles, textStyles, isLoading}) => {
  return (
    <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7} 
        className={`bg-secondary-100 rounded-full min-h-[62px] justify-center items-center ${containerStyles} ${isLoading ? 'opacity-50' : ''}`}
        disabled={isLoading}
    >
        {isLoading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text className={`text-white text-center font-psemibold ${textStyles}`}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

export default CustomButton