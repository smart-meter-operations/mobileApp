import React, { useState } from 'react';
import { SafeAreaView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Import components and services
import { AppHeader, Button, Input, Footer } from '../components';
import { SmsService } from '../services';
import { useKeyboard, useEntranceAnimation, useAsyncOperation } from '../hooks';
import { layoutStyles, textStyles } from '../styles';
import { validatePhone, formatPhoneNumber } from '../utils';
import { SCREENS } from '../constants';
import { Text, View, Animated } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Custom hooks
  const isKeyboardVisible = useKeyboard();
  const { animatedStyle } = useEntranceAnimation();
  const { loading, execute } = useAsyncOperation();

  const handleProceed = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!validatePhone(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid Indian phone number');
      return;
    }

    try {
      await execute(async () => {
        const result = await SmsService.sendOTP(phoneNumber);
        
        if (result.success) {
          Alert.alert(
            'OTP Sent',
            `Verification code sent to ${formatPhoneNumber(phoneNumber)}. For demo, use OTP: ${result.otp}`,
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.navigate(SCREENS.OTP, { 
                    phoneNumber: formatPhoneNumber(phoneNumber),
                    generatedOTP: result.otp 
                  });
                }
              }
            ]
          );
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    }
  };

  return (
    <SafeAreaView style={layoutStyles.container}>
      <StatusBar style="light" />
      
      <AppHeader />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.View style={[layoutStyles.content, animatedStyle]}>
          <View style={layoutStyles.formContainer}>
            <Text style={textStyles.title}>Enter your phone number</Text>
            <Text style={textStyles.subtitle}>
              Please enter your phone number to login your account.
            </Text>
            
            <Input
              placeholder="+91 8981675554"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={15}
            />
            
            <Button 
              title="Proceed"
              onPress={handleProceed}
              disabled={loading}
              loading={loading}
            />
          </View>
          
          <Footer visible={!isKeyboardVisible} />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}