import { View, Text, Image } from 'react-native'
import { Tabs, Redirect } from 'expo-router'
import { icons } from '../../constants'

const TabIcon = ({ icon, color, name, focused }) => {
  return (
    <View className="items-center justify-center">
      <Image
        source={icon}
        resizeMode="contain"
        tintColor={color}
        className={`h-9 ${name ? 'w-7' : 'w-9'} ${!name ? 'mb-1' : ''}`}
      />
      {name && (
        <Text className={`${focused ? 'font-psemibold' : 'font-pregular'} text-xs`} style={{ color: color }}>
          {name}
        </Text>
      )}
    </View>
  )
}

const TabsLayout = () => {
  return (
    <>
        <Tabs
          screenOptions={{
            tabBarShowLabel: false,
            tabBarActiveTintColor: '#5e40b7',
            tabBarInactiveTintColor: '#7257ca',
            tabBarStyle: {
              backgroundColor: '#fecc1d',
              borderTopWidth: 0,
              borderTopColor: '#232533',
              height: 60 
            }
          }}
        >
            <Tabs.Screen 
              name="home" 
              options={{
                title: 'Home',
                headerShown: false,
                tabBarIcon : ({ color, focused }) => (
                  <TabIcon icon={icons.home} color={color} name="Home" focused={focused} />
                )
              }}
            />
            <Tabs.Screen 
              name="discover" 
              options={{
                title: 'Discover',
                headerShown: false,
                tabBarIcon : ({ color, focused }) => (
                  <TabIcon icon={icons.discover} color={color} name="Discover" focused={focused} />
                )
              }}
            />
            <Tabs.Screen 
              name="create" 
              options={{
                title: 'Create',
                headerShown: false,
                tabBarIcon : ({ color, focused }) => (
                  <TabIcon icon={icons.plus} color={color} focused={focused} />
                )
              }}
            />
            <Tabs.Screen 
              name="message" 
              options={{
                title: 'Message',
                headerShown: false,
                tabBarIcon : ({ color, focused }) => (
                  <TabIcon icon={icons.message} color={color} name="Message" focused={focused} />
                )
              }}
            />
            <Tabs.Screen 
              name="profile" 
              options={{
                title: 'Profile',
                headerShown: false,
                tabBarIcon : ({ color, focused }) => (
                  <TabIcon icon={icons.profile} color={color} name="Profile" focused={focused} />
                )
              }}
            />
        </Tabs>
    </>
  )
}

export default TabsLayout