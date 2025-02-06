import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'


const CustomButton = ({title, handlePress, containerStyles, textStyles, isLoading, disabled}) => {
  return (
    <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7} 
        className={`bg-secondary-100 rounded-full min-h-[62px] justify-center items-center ${containerStyles} ${(isLoading || disabled) ? 'opacity-50' : ''}`}
        disabled={isLoading || disabled}
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