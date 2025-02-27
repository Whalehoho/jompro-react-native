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
        if (faces.length === 0) {
            setFaceDetected(null);
            setActionIndex(0);
            progressCircle.value = circumference;
            return;
        }
        const firstFace = faces[0];
        const faceCenterX = firstFace.bounds.x + firstFace.bounds.width / 2;
        const faceCenterY = firstFace.bounds.y + firstFace.bounds.height / 2;
    
        const circleCenterX = width / 2;
        const circleCenterY = height / 4;
        const circleRadius = width * ratio;
    
        const distanceFromCenter = Math.sqrt(
            Math.pow(faceCenterX - circleCenterX, 2) +
            Math.pow(faceCenterY - circleCenterY, 2)
        );
    
        if (distanceFromCenter <= circleRadius + 25) {
            setFaceDetected(firstFace);
    
            switch(actionToPerform[actionIndex]) {
                case 'Blink':
                    if(firstFace.leftEyeOpenProbability < 0.2 && firstFace.rightEyeOpenProbability < 0.2) {
                        setActionIndex(actionIndex + 1);
                    }
                    break;
                case 'Smile':
                    if(firstFace.smilingProbability > 0.8) {
                        setActionIndex(actionIndex + 1);
                    }
                    break;
                case 'Look Left':
                    if(firstFace.yawAngle > 20) {
                        setActionIndex(actionIndex + 1);
                    }
                    break;
                case 'Look Right':
                    if(firstFace.yawAngle < -20) {
                        setActionIndex(actionIndex + 1);
                    }
                    break;
                case 'Look Up':
                    if(firstFace.pitchAngle > 10) {
                        setActionIndex(actionIndex + 1);
                    }
                    break;
                case 'Look Down':
                    if(firstFace.pitchAngle < -10 && !isCaptured) { // Check if capture has not been done
                        setIsCaptured(true); // Set the state to true to prevent future calls
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
    
        const photo = await camera.current.takePhoto({
            quality: 1,
        });
        
        const uri = `file://${photo.path}`;
        console.log('Captured Image URI:', uri);
        const filename = uri.split('/').pop();
        const type = 'image/jpeg';
    
        const response = await api.imgbb.uploadImage({
            uri: uri,
            name: filename,
            type: type,
        });
    
        console.log('Url:', response.data.url);
    
        const data = await api.user.verifyFace({
            userId: userId,
            imgUrl: response.data.url,
        });

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
        const faces = detectFaces(frame)
        // ... chain frame processors
        // ... do something with frame
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

                {/* <View className="absolute w-full items-center" style={{ top: height / 4 + width * ratio + 320 }}>
                    <Text className="text-2xl text-black font-pmedium"> 
                        {
                            faceDetected ? 
                                faceDetected.leftEyeOpenProbability < 0.2 && faceDetected.rightEyeOpenProbability < 0.2 ? 'blink' : '' 
                            : ''
                        }
                    </Text>
                </View> */}

                {/* <View className="absolute w-full items-center" style={{ top: height / 4 + width * ratio + 320 }}>
                    <Text className="text-2xl text-black font-pmedium"> 
                        {
                            faceDetected ? 
                                faceDetected.smilingProbability> 0.8 ? 'smile' : '' 
                            : ''
                        }
                    </Text>
                </View> */}

                {/* <View className="absolute w-full items-center" style={{ top: height / 4 + width * ratio + 320 }}>
                    <Text className="text-2xl text-black font-pmedium"> 
                        {
                            faceDetected ? 
                                faceDetected.yawAngle < -20 ? 'to right' 
                                : faceDetected.yawAngle > 20 ? 'to left' 
                                    : 'straight'
                            : ''
                        }

                    </Text>
                </View> */}

                {/* <View className="absolute w-full items-center" style={{ top: height / 4 + width * ratio + 320 }}>
                    <Text className="text-2xl text-black font-pmedium"> 
                        {
                            faceDetected ? 
                                faceDetected.pitchAngle < -10 ? 'look down' 
                                : faceDetected.pitchAngle > 5 ? 'look up' 
                                    : 'still'
                            : ''
                        }

                    </Text>
                </View> */}

                

                

            </SafeAreaView>

            {/* <StatusBar backgroundColor='#836eca' style='auto' hidden={false} translucent={false} /> */}

        </>

    );
};

export default LivenessVerification;
