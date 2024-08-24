import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'

import { icons } from '../constants'

const FormField = ({ title, subtitle, value, placeholder, handleChangeText, titleStyle, subtitleStyle, boxStyle, otherStyles, ...props}) => {
    const [showPassword, setShowPassword] = useState(false)
  
    return (
    <View className={`space-y-2 ${otherStyles}`}>
      <View>
        <Text className={`text-base text-secondary font-pmedium ${titleStyle}`}>{title}</Text>
        {subtitle && <Text className={`text-xs text-gray-400 ${subtitleStyle}`}>{subtitle}</Text>}
      </View>
     
      <View className={`flex-row border-2 border-secondary-200 w-full h-16 px-4 bg-white rounded-2xl focus:border-secondary items-center ${boxStyle}`}>
        <TextInput
            className="flex-1 text-black font-psemibold text-base"
            value={value}
            placeholder={placeholder}
            placeholderTextColor='#7b7b8b'
            onChangeText={text => handleChangeText(text.trim())}
            secureTextEntry={title.includes('Password') && !showPassword}
        />

        {title.includes('Password') && (
          <TouchableOpacity onPress={() =>
          setShowPassword(!showPassword)}>
            <Image source={!showPassword ? icons.eye : icons.eyeHide} className="w-6 h-6" resizeMode='contain'/>
          </TouchableOpacity>
        )}
        
      </View>
    </View>
  )
}

export default FormField