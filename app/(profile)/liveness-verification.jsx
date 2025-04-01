import React, { use, useEffect, useRef, useState } from 'react';
import { SafeAreaView, Dimensions, View, Text, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Camera, useCameraDevice, useCameraFormat, useFrameProcessor, useSkiaFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector, FaceDetectionOptions } from 'react-native-vision-camera-face-detector';
import Svg, { Circle as SvgCircle, Rect, Mask, Defs } from 'react-native-svg';
import { Skia, Canvas, Paint, Circle as SkiaCircle } from '@shopify/react-native-skia';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import ImageEditor from '@react-native-community/image-editor';
import RNFS from 'react-native-fs';
import { icons } from '../../constants';
import { Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ActivityIndicator } from 'react-native'; // Add ActivityIndicator for loading spinner


import * as api from '../../api'
import { QualifiedSlot } from 'expo-router/build/views/Navigator';


const { height, width } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);


const LivenessVerification = () => {
    const [userId, setUserId] = useState(null);
    const device = useCameraDevice('front');
    const camera = useRef(null);
    const isFocused = useIsFocused();
    const isProcessingRef = useRef(false);
    const [isCaptured, setIsCaptured] = useState(false); // New state to track if capture has been done
    const [isLoading, setIsLoading] = useState(false); // State to track the loading status

    const faceDetectionOptions = useRef( {
        // see FaceDetectionOptions
        landmarkMode: 'all',
        contourMode: 'all',
        classificationMode: 'all',

      } ).current

    const { detectFaces } = useFaceDetector( faceDetectionOptions )

    const [faceDetected, setFaceDetected] = useState(null);

    const [actionIndex, setActionIndex] = useState(0);

    const actionToPerform = ['Blink', 'Smile', 'Look Left', 'Look Right', 'Look Up', 'Look Down'];

    const demo = [icons.blink, icons.smile, icons.lookLeft, icons.lookRight, icons.lookUp, icons.lookDown, icons.ok];

    const ratio = 0.43;

    const circumference = 2 * Math.PI * (width * ratio + 25); 

    // const [strokeDashoffset, setStrokeDashoffset] = useState(circumference);

    const progressCircle = useSharedValue(circumference);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: progressCircle.value,
    }));

    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                if (!storedUser) {
                    console.error('User not found in storage');
                    return;
                }
                const parsedUser = JSON.parse(storedUser);
                setUserId(parsedUser.userId);
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };
        fetchUserId();
    }, []);

    useEffect(() => {
        setIsCaptured(false); // Reset the state when the screen is focused
    }, [isFocused]);


    useEffect(() => {
        const getPermissions = async () => {
            const status = await new Promise((resolve) => {
            const status = Camera.getCameraPermissionStatus();
            resolve(status);
        });
        if (status !== 'authorized') {
            await Camera.requestCameraPermission();
        }
        };
        getPermissions();
        
    }, []);


    const handleDetectedFaces = Worklets.createRunOnJS(async (faces, frame) => { 

        // No face detected, reset the action index and progress circle
        if (faces.length === 0) {
            setFaceDetected(null);
            setActionIndex(0);
            progressCircle.value = circumference;
            return;
        }

        // Only process the first detected face
        const firstFace = faces[0];

        // Get the center of the face and the center of the circle
        const faceCenterX = firstFace.bounds.x + firstFace.bounds.width / 2;
        const faceCenterY = firstFace.bounds.y + firstFace.bounds.height / 2;
    
        // Get the center of the circle and its radius
        const circleCenterX = width / 2;
        const circleCenterY = height / 4;
        const circleRadius = width * ratio;
    
        // Calculate the distance from the face center to the circle center
        const distanceFromCenter = Math.sqrt(
            Math.pow(faceCenterX - circleCenterX, 2) +
            Math.pow(faceCenterY - circleCenterY, 2)
        );
    
        // Check if the face is within the circle radius + 25
        if (distanceFromCenter <= circleRadius + 25) {

            setFaceDetected(firstFace);
    
            // Liveness verification logic
            switch(actionToPerform[actionIndex]) {
                case 'Blink':
                    // Check if both eyes are closed
                    if(firstFace.leftEyeOpenProbability < 0.2 && firstFace.rightEyeOpenProbability < 0.2) {
                        // Proceed to the next action
                        setActionIndex(actionIndex + 1);
                    }
                    break;
                case 'Smile':
                    // Check if the face is smiling
                    if(firstFace.smilingProbability > 0.8) {
                        // Proceed to the next action
                        setActionIndex(actionIndex + 1);
                    }
                    break;
                case 'Look Left':
                    // Check if the face is looking left
                    if(firstFace.yawAngle > 20) {
                        // Proceed to the next action
                        setActionIndex(actionIndex + 1);
                    }
                    break;
                case 'Look Right':
                    // Check if the face is looking right
                    if(firstFace.yawAngle < -20) {
                        // Proceed to the next action
                        setActionIndex(actionIndex + 1);
                    }
                    break;
                case 'Look Up':
                    // Check if the face is looking up
                    if(firstFace.pitchAngle > 10) {
                        // Proceed to the next action
                        setActionIndex(actionIndex + 1);
                    }
                    break;
                case 'Look Down':
                    // Check if the face is looking down
                    if(firstFace.pitchAngle < -10 && !isCaptured) {
                        setIsCaptured(true);
                        // Capture the face image and crop it to compare with the user profile image
                        captureAndCropFace(firstFace.bounds);
                        setActionIndex(actionIndex + 1);
                        Alert.alert('Face biometric captured', 'Please wait while we verify your face, you can exit the screen now.');
                    }
                    break;
                default:
                    break;
            }
    
            progressCircle.value = withTiming(
                circumference - (circumference * (actionIndex) / actionToPerform.length), 
                { duration: 500 }
            );
        
        } else {
            setFaceDetected(null);
            setActionIndex(0);
            progressCircle.value = circumference;
        }
    });
    
    async function captureAndCropFace(bounds) {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
    
        setTimeout(() => {
            isProcessingRef.current = false;
        }, 3000); // Prevents multiple calls within 3 seconds

        setIsLoading(true); // Set loading to true when verification starts
    
        const photo = await camera.current.takePhoto({
            quality: 1,
        });
        
        const uri = `file://${photo.path}`;
        console.log('Captured Image URI:', uri);
        const filename = uri.split('/').pop();
        const type = 'image/jpeg';

        const s3Url = await api.s3.uploadImageToS3(uri, filename);
    
        // const response = await api.imgbb.uploadImage({
        //     uri: uri,
        //     name: filename,
        //     type: type,
        // });
        // console.log('Url:', response.data.url);
    
        const data = await api.user.verifyFace({
            userId: userId,
            imgUrl: s3Url,
        });

        console.log('Verification Data:', data);

        setIsLoading(false); // Set loading to true when verification starts

        // if (data.data.message === 'Success') {
        //     Alert.alert('Verification Success', 'Your face has been successfully verified!');
        // } else {
        //     Alert.alert('Verification Failed', 'Sorry, we could not verify your face.');
        // }

        setIsCaptured(false); // Reset the state after the verification is done
    
        return data;
    }
      
    
    //   const frameProcessor = useSkiaFrameProcessor((frame) => {
    //     'worklet'
    //     frame.render()
    //     const faces = detectFaces(frame)
    //     // ... chain frame processors
    //     // ... do something with frame
    //     handleDetectedFaces(faces)
    //   }, [handleDetectedFaces])

      const frameProcessor = useFrameProcessor((frame) => {
        'worklet'

        // Detect faces in the frame， powered by react-native-vision-camera-face-detector
        const faces = detectFaces(frame)
        
        // If face is detected, proceed with liveness verification
        handleDetectedFaces(faces)
      }, [handleDetectedFaces])


      

    if (device == null) return null;

    return (
        <>
            <SafeAreaView className="flex-1 bg-secondary-200">
                <Camera
                    ref={camera}
                    className="flex-1"
                    photo={true}
                    style={{ transform: [{ translateY: -(height / 4) }] }} /* Shift the camera feed upward by height/4 */
                    device={device}
                    isActive={isFocused}
                    frameProcessor={frameProcessor}
                    frameProcessorFps={1}
                    photoQualityBalance={"speed"}
                />
                <Svg
                    height={height}
                    width={width}
                    className="absolute top-0 left-0"
                >
                    <Defs>
                        <Mask id="mask" x="0" y="0" width={width} height={height}>
                            <Rect width={width} height={height} fill="white" />
                            <SvgCircle
                                cx={width / 2}
                                cy={height / 4}
                                r={width * ratio}
                                fill="black"
                            />
                        </Mask>
                    </Defs>
                    <SvgCircle
                        cx={width / 2}
                        cy={height / 4}
                        r={width * ratio + 25}
                        stroke="#7257ca"
                        strokeWidth={65}
                        fill="none"
                        strokeOpacity={0.85}
                    />
                    <AnimatedCircle
                        cx={width / 2}
                        cy={height / 4}
                        r={width * ratio + 25}
                        stroke="#fecc1d"
                        strokeWidth={65}
                        fill="none"
                        strokeDasharray={`${circumference} ${circumference}`}
                        // strokeDashoffset={strokeDashoffset}
                        animatedProps={animatedProps}
                    />
                    <Rect
                        width={width}
                        height={height}
                        fill="#836eca"
                        mask="url(#mask)"
                        fillOpacity="1"
                    />
                </Svg>


                <View className="absolute w-full items-center" style={{ top: height / 4 + width * ratio + 200 }}>
                    <Image source={demo[actionIndex]}  className="w-28 h-28" />
                </View>

                <View className="absolute w-full items-center" style={{ top: height / 4 + width * ratio + 320 }}>
                    { 
                        actionIndex < actionToPerform.length ?
                        <Text className="text-xl text-black font-pregular">{actionToPerform[actionIndex]}</Text>
                        :<></>
                    }
                </View>

                <View className="absolute w-[50%] p-2 items-center bg-primary rounded-lg border-2 border-black" style={{ top: height / 4 + width * ratio + 80, left: width / 4 }}>
                    <Text className="text-lg text-black font-pmedium text-center"> 
                        {faceDetected ? 'Face is Captured' : 'No Face Detected'}
                    </Text>
                </View>

                

                
                {/* {isLoading && (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', position: 'absolute', top: height / 2, left: width / 10 *2 }}>
                        <ActivityIndicator size="large" color="#fecc1d" />
                    </View>
                )} */}
                

            </SafeAreaView>

            {/* <StatusBar backgroundColor='#836eca' style='auto' hidden={false} translucent={false} /> */}

        </>

    );
};

export default LivenessVerification;
