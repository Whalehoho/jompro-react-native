import 'dotenv/config';

export default {
  expo: {
    name: "JomPro",
    slug: "jompro",
    scheme: "jompro",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon(1).png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    updates: {
      enabled: true,
      channel: "production",
      fallbackToCacheTimeout: 0,
      checkAutomatically: "ON_LOAD",
      url: "https://u.expo.dev/67f67a60-8ab9-4dfc-914e-c30b02711025"
    },
    runtimeVersion: "1.0.0",
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "JomPro needs access to your Camera."
      },
      runtimeVersion: {
        policy: "appVersion"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icon(1).png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "android.permission.CAMERA",
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ],
      package: "com.kc.jompro.production",
      runtimeVersion: "1.0.0"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "react-native-vision-camera",
        {
          cameraPermissionText: "JomPro needs access to your Camera."
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: true
          }
        }
      ]
    ],
    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: "67f67a60-8ab9-4dfc-914e-c30b02711025"
      },
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      imgbbApiKey: process.env.IMGBB_API_KEY,
      REACT_NATIVE_HOST: process.env.REACT_NATIVE_HOST,
      BACKEND_PORT: process.env.BACKEND_PORT,
      SOCKET_PORT: process.env.SOCKET_PORT,
      IMGBB_API_KEY: process.env.IMGBB_API_KEY,
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
      AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
    },
    owner: "laukc"
  }
};
