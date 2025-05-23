import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingEvent, setIsEditingEvent] = useState(false);
    const [isEditingChannel, setIsEditingChannel] = useState(false);
    const [rsvpView, setRsvpView] = useState(0); // 0 = list, 1 = calendar

    useEffect(() => {
        // Retrieve isLoggedIn state from AsyncStorage when the app loads
        const loadState = async () => {
          try {
            const savedIsLoggedIn = await AsyncStorage.getItem('isLoggedIn');
            const savedUser = await AsyncStorage.getItem('user');
            if (savedIsLoggedIn === 'true' && savedUser) {
              setIsLoggedIn(true);
              setUser(JSON.parse(savedUser));
            }
          } catch (error) {
            console.error('Failed to load isLoggedIn state:', error);
          } finally {
            setIsLoading(false);
          }
        };
    
        loadState();
      }, []);

    const loginUser = (userData) => {
        setIsLoggedIn(true);
        console.log('User logged in');
        AsyncStorage.setItem('isLoggedIn', 'true');
        AsyncStorage.setItem('user', JSON.stringify(userData));
    };

    const logoutUser = () => {
        setIsLoggedIn(false);
        setUser(null);
        setIsEditingEvent(false);
        setIsEditingChannel(false);
        console.log('User logged out');
        AsyncStorage.removeItem('isLoggedIn');
        AsyncStorage.removeItem('user');
        AsyncStorage.removeItem('profileImage');
        AsyncStorage.removeItem('userAddresses');
        AsyncStorage.removeItem('userToken');
    };

    
  

    return (
        <GlobalContext.Provider
            value={{
                // Add your global state and functions here
                isLoggedIn,
                user,
                loginUser,
                logoutUser,
                isEditingEvent,
                setIsEditingEvent,
                isEditingChannel,
                setIsEditingChannel,
                rsvpView,
                setRsvpView,
            }}
        >
            {children}
        </GlobalContext.Provider>
    )
}

export default GlobalProvider;
