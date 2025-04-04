# jompro-react-native

# Expo & Android Development Commands

## 1. Start Metro Bundler
```bash
npx expo start
```
- Starts the Metro bundler and enables live reloading.
- Use for debugging JavaScript-only features.
- Use `expo start --tunnel` if mobile device and PC are not on the same network.

## 2. Run App on Android
```bash
npx expo run:android
```
- Builds and deploys your app to an Android device or emulator.
- Use when testing with custom native code or native modules.

## 3. Regenerate Native Files
```bash
npx expo prebuild
```
- Regenerates native Android and iOS files when adding dependencies related to native code.

## 4. Production / Distribution Build
```bash
eas build
```
- Creates production or distribution builds for app stores.
- Use after changes to native code for testing or publishing.

## 5. Check Connected Devices
```bash
adb devices
```
- Lists connected Android devices or emulators.
- Verify if your device is recognized by ADB (Android Debug Bridge).

> **Note:** After adding native dependencies, run:
```bash
npx expo prebuild
```
Then continue with:
```bash
npx expo run:android
```
or
```bash
npx expo start
```

---

# Steps for Release

## Generate Release Keystore
```bash
keytool -genkeypair -v -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -keystore jompro-release-key.jks -alias jompro-release-key
```

## Build Release APK
```bash
cd android
./gradlew assembleRelease
```

## Install Release APK on Device
```bash
adb install app/build/outputs/apk/release/app-release.apk
```

**OR**
```bash
npm run android-release
```

---

# Create Development Build
```bash
npm install expo-dev-client
eas build --profile development --platform android
adb install path/to/your-development-build.apk
```

# Create Production Build
```bash
eas build --profile production --platform android
```

---

# Use OTA (Over-the-Air) Updates
After making changes to JS/TS files:
```bash
eas update --branch=production --message "Fixed UI issues"
```
This pushes the update without requiring a reinstall.

---

# Convert .aab to .apks
```bash
java -jar bundletool-all-1.18.0.jar build-apks --bundle="xxx.aab" --output="jompro.apks" --mode=universal
```
Then:
1. Rename `jompro.apks` to `jompro.zip`
2. Extract it and get `universal.apk`

---

# Get Debug Keystore SHA1
```bash
./gradlew signingReport
```

---

# Manage Android Credentials
```bash
eas credentials -p android
```

---

# Ngrok for Local Server
```bash
ngrok http http://localhost:8180
```

---

# View Native Logs
```bash
adb logcat | findstr com.kc.jompro
```


# 📚 Preparation for Using Google Maps in a React Native App

## ✅ 1. Enable Google Maps API
- Go to the [Google Cloud Console](https://console.cloud.google.com/).
- Create or select a project.
- Enable **Maps SDK for Android** and/or **Maps SDK for iOS**.

---

## ✅ 2. Generate and Add the SHA-1 Certificate Fingerprint

### 🔹 What is SHA-1?
SHA-1 is a unique digital fingerprint of your app's signing certificate. It's required by Google to verify your app and allow access to Google Maps APIs.

### 🔹 Why is SHA-1 Needed?
The Maps API checks the SHA-1 to ensure your app is authorized. If it's not registered, the map won't render.

### 🔹 Where to Get SHA-1?

#### ▶️ For Debug Keystore:
```bash
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android \
  -keypass android
```

#### ▶️ For Release Keystore:
```bash
keytool -list -v \
  -keystore jompro-release-key.jks \
  -alias jompro-release-key
```

> ✅ Add the output SHA-1 in the Google Cloud Console under "API Credentials" > Restrict key > Add fingerprint

---

## ✅ 3. Add API Key to Your App

### In `app.json`:
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_API_KEY"
        }
      }
    }
  }
}
```

### In your component:
```jsx
<MapView provider={PROVIDER_GOOGLE} />
```

---

# 🔐 Keystores in Android

## 🔹 Debug Keystore
- Automatically generated for local development.
- Common locations:
  - **Windows:** `C:\Users\<user>\.android\debug.keystore`
  - **macOS/Linux:** `~/.android/debug.keystore`

Usually already exists, no action required.

---

## 🔹 Release Keystore
- Required for production or Play Store uploads.

**Generate manually:**
```bash
keytool -genkeypair -v \
  -storetype JKS \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -keystore jompro-release-key.jks \
  -alias jompro-release-key
```

> ⚠️ Keep this keystore secure and backed up.

---

# 🏖️ Debug vs Release Keystore

| Feature              | Debug Keystore                      | Release Keystore                         |
|---------------------|-------------------------------------|-------------------------------------------|
| Purpose             | Development / Testing               | Production Builds / Play Store Uploads    |
| Signature Validity  | Shared across dev machines          | Unique per app / organization             |
| Security            | Public (default passwords)          | Private, must be protected                |
| API Key Requirement | Needs debug SHA-1 in Google Console | Needs release SHA-1 in Google Console     |

---

# ✅ Final Tips
- Register **both debug and release SHA-1** in Google Console.
- Rebuild the app (e.g., `eas build`) after making changes.
- Test using an emulator or physical device after setup.


