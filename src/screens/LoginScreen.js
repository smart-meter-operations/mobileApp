import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Import components and services
import { AppHeader, Button, Input, Footer } from '../components';
import { SmsService, ApiService } from '../services';
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
        // Always use hardcoded OTP 123456
        const result = await SmsService.sendOTP(phoneNumber);

        if (result.success) {
          // Navigate directly to OTP screen with hardcoded OTP
          navigation.navigate(SCREENS.OTP, {
            phoneNumber: formatPhoneNumber(phoneNumber),
            generatedOTP: '123456', // Always use 123456
          });
        } else {
          Alert.alert('Error', 'Failed to process request. Please try again.');
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to process request. Please try again.');
    }
  };

  const handleProceedWithOTP = async () => {
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
        console.log('🚀 Sending OTP via API for:', phoneNumber);
        
        const response = await ApiService.sendOTPReal(phoneNumber);
        
        console.log('📤 Send OTP Response:', response);

        if (response.success && response.data?.status === 'success') {
          console.log('✅ OTP sent successfully, SID:', response.data.sid);
          
          // Navigate to API OTP screen
          navigation.navigate(SCREENS.OTP_API, {
            phoneNumber: formatPhoneNumber(phoneNumber),
            sid: response.data.sid,
          });
        } else {
          const errorMessage = response.data?.message || response.message || 'Failed to send OTP. Please try again.';
          console.log('❌ Send OTP failed:', errorMessage);
          Alert.alert('Error', errorMessage);
        }
      });
    } catch (error) {
      console.error('🚨 Send OTP error:', error);
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
            <Text style={[textStyles.title, { color: '#212121' }]}>Enter your phone number</Text>
            <Text style={[textStyles.subtitle, { color: '#424242', fontSize: 16, lineHeight: 24 }]}>
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

            <View style={{ marginTop: 12 }}>
              <Button
                title="Proceed with OTP"
                onPress={handleProceedWithOTP}
                disabled={loading}
                loading={loading}
                style={{
                  backgroundColor: '#1976D2',
                  borderColor: '#1976D2',
                }}
              />
            </View>
          </View>

          <Footer visible={!isKeyboardVisible} />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}