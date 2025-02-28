import { StyleSheet, Text, View, SafeAreaView, TextInput, Alert, TouchableOpacity } from 'react-native';
import React, { useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import * as api from '../../api';
import Dialog from "react-native-dialog";

const ResetPassword = () => {
    const [form, setForm] = useState({ userEmail: '', code: ['', '', '', ''] });
    const [isSubmitting, setisSubmitting] = useState(false);
    const [isCooldown, setIsCooldown] = useState(false);
    const [timer, setTimer] = useState(59);
    const inputRefs = useRef([]);
    const [visible, setVisible] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    // Function to handle cooldown
    const startCooldown = () => {
        setIsCooldown(true);
        let seconds = 59;
        setTimer(seconds);

        const interval = setInterval(() => {
            seconds -= 1;
            setTimer(seconds);
            if (seconds <= 0) {
                clearInterval(interval);
                setIsCooldown(false);
            }
        }, 1000);
    };

    const handleCancel = () => {
        setVisible(false);
        setNewPassword('');
        setConfirmNewPassword('');
    };

    const submit = async () => {
        if (newPassword !== confirmNewPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        setisSubmitting(true);
        setVisible(false);

        try {
            const response = await api.auth.resetPassword(form.userEmail, newPassword);
            if (response && response.data === 'success') {
                Alert.alert('Success', 'Password has been reset successfully');
            } else {
                Alert.alert('Error', response?.data?.message || 'Failed to reset password');
            }
        }
        catch (error) {
            Alert.alert('Error', 'Failed to reset password');
        }
        finally {
            setisSubmitting(false);
            setNewPassword('');
            setConfirmNewPassword('');
            setForm({ userEmail: '', code: ['', '', '', ''] });
        }
    };

    // Request recovery code
    const requestCode = async () => {
        if (isCooldown) return;

        try {
            const response = await api.auth.requestPasswordRecoveryCode(form.userEmail);
            if (response?.data === 'invalid email') {
                Alert.alert('Error', 'Invalid email address');
            } else {
                Alert.alert('Success', 'Password recovery code has been sent to your email');
                startCooldown();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to request password recovery code');
        }
    };

    // Submit the code for verification
    const submitCode = async () => {
        const code = form.code.join(''); // Combine array into a string

        if (!form.userEmail || code.length !== 4) {
            Alert.alert('Error', 'Please enter your email and a valid 4-digit code.');
            return;
        }

        try {
            const response = await api.auth.verifyPasswordRecoveryCode(form.userEmail, code);
            if (response && response.data === 'success') {
                // Alert.alert('Success', 'Code verified! Proceed to reset your password.');
                setVisible(true);
            } else {
                Alert.alert('Error', response?.data?.message || 'Invalid or expired code');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to verify code');
        }
    };

    // Handle input change and move focus
    const handleCodeInput = (index, value) => {
        if (/^\d?$/.test(value)) { // Ensure only numbers (or empty) are entered
            const newCode = [...form.code];
            newCode[index] = value;
            setForm({ ...form, code: newCode });

            if (value !== '' && index < 3) {
                inputRefs.current[index + 1].focus(); // Move to next input
            } else if (value === '' && index > 0) {
                inputRefs.current[index - 1].focus(); // Move to previous input on backspace
            }
        }
    };

    return (
        <SafeAreaView className="bg-primary h-full">
            <View className="justify-center w-full min-h-[85vh] px-4 my-6">
                <Text className="text-2xl text-secondary text-semibold mt-10 font-psemibold">Password Recovery</Text>
                
                {/* Email Input Field */}
                <FormField
                    title="Email"
                    value={form.userEmail}
                    handleChangeText={(e) => setForm({ ...form, userEmail: e })}
                    otherStyles="mt-7"
                    keyboardType="email-address"
                />

                {/* Request Code Button with Cooldown */}
                <TouchableOpacity 
                    onPress={requestCode} 
                    disabled={isCooldown}
                    className={`text-sm text-secondary my-4 font-pmedium ${isCooldown ? 'opacity-60' : ''}`}
                >
                    <Text className="text-secondary">
                        {isCooldown ? `Wait ${timer}s to request again` : 'Request for password recovery code'}
                    </Text>
                </TouchableOpacity>

                {/* Code Input Fields in a Row */}
                <View className="flex-row justify-between  mt-5 mb-10">
                    {form.code.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => (inputRefs.current[index] = ref)}
                            value={digit}
                            onChangeText={(value) => handleCodeInput(index, value)}
                            keyboardType="numeric"
                            maxLength={1}
                            className="bg-white border-2 border-secondary text-center text-xl font-bold rounded-lg w-14 h-14"
                        />
                    ))}
                </View>

                {/* Submit Button */}
                <CustomButton 
                    title="Submit"
                    handlePress={submitCode}
                    otherStyles="mt-7"
                />
            </View>

            <Dialog.Container visible={visible}>
                <Dialog.Title>Reset Password</Dialog.Title>

                {/* Label for First Input */}
                <Text className="mx-3 mb-2">New Password:</Text>
                <Dialog.Input
                    placeholder="Enter new password"
                    secureTextEntry
                    onChangeText={(e) => setNewPassword(e)}
                    value={newPassword}
                />

                {/* Label for Second Input */}
                <Text className="mx-3 mb-2">Confirm New Password:</Text>
                <Dialog.Input
                    placeholder="Confirm new password"
                    secureTextEntry
                    onChangeText={(e) => setConfirmNewPassword(e)}
                    value={confirmNewPassword}
                />

                {/* Buttons */}
                <Dialog.Button label="Cancel" onPress={handleCancel} />
                <Dialog.Button label="Submit" onPress={submit} />
            </Dialog.Container>

        </SafeAreaView>
    );
};

export default ResetPassword;
