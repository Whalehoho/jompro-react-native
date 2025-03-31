import React, { useEffect, useState } from "react";
import { View, Text, Button, ActivityIndicator, Alert } from "react-native";
import * as Updates from "expo-updates";
import CustomButton from '../../components/CustomButton';

const Update = () => {
  const [checking, setChecking] = useState(false);

  const checkForUpdates = async () => {
    setChecking(true);
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert("Update Available", "Updating now...");
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } else {
        Alert.alert("No Updates", "You're using the latest version!");
      }
    } catch (error) {
      Alert.alert("Update Error", error.message);
    }
    setChecking(false);
  };

  return (
    <View className="flex-1 bg-primary items-center justify-center">
      {checking ? <ActivityIndicator size="large" color="#836eca" /> : null}
      <CustomButton 
          title="Check for Updates"
          handlePress={() => checkForUpdates()}
          containerStyles="w-2/3 mt-7"
          textStyles={'text-base'}
        />
    </View>
  );
};

export default Update;
