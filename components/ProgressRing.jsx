import { View, Text } from 'react-native'
import React from 'react'
import Animated, { useAnimatedProps, withTiming } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';


const ProgressRing = ({ progress, radius, strokeWidth, color }) => {
    const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progress);

    return (
        <Svg height={radius * 2} width={radius * 2}>
            <Circle
                stroke={color}
                fill="none"
                cx={radius}
                cy={radius}
                r={radius}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
            />
        </Svg>
    );
}

export default ProgressRing