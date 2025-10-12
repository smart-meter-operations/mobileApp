import React, { useState, useRef, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Import components and services
import { AppHeader, Button, Footer, OTPInput } from '../components';
import { ApiService } from '../services';
import {
  useKeyboard,
  useEntranceAnimation,
  useStaggeredAnimation,
} from '../hooks';
import { layoutStyles, textStyles, otpStyles } from '../styles';
import { validateOTP } from '../utils';
import { ANIMATION, SCREENS } from '../constants';

export default function OTPAPIScreen({ route, navigation }) {
  const { phoneNumber, sid } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef([]);

  // Custom hooks
  const isKeyboardVisible = useKeyboard();
  const { animatedStyle } = useEntranceAnimation();
  const otpBoxAnims = useStaggeredAnimation(6, ANIMATION.stagger.otpBox);

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Animate the input box when typing
    Animated.sequence([
      Animated.timing(otpBoxAnims[index], {
        toValue: 1.1,
        duration: ANIMATION.fast,
        useNativeDriver: true,
      }),
      Animated.timing(otpBoxAnims[index], {
        toValue: 1,
        duration: ANIMATION.fast,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (key, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const otpCode = otp.join('');

    if (!validateOTP(otpCode)) {
      Alert.alert('Error', 'Please enter complete OTP');
      return;
    }

    setIsVerifying(true);
    try {
      console.log('🔐 Verifying OTP with API:', {
        phone: phoneNumber,
        otp: otpCode
      });

      const response = await ApiService.verifyOTPReal(phoneNumber, otpCode);
      
      console.log('📥 OTP Verification Response:', response);

      if (response.success && response.data?.status === 'success') {
        console.log('✅ OTP verified successfully');
        Alert.alert('Success', 'OTP verified successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('PhoneUnlock')
          }
        ]);
      } else {
        const errorMessage = response.data?.message || response.message || 'Invalid OTP. Please try again.';
        console.log('❌ OTP verification failed:', errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('🚨 OTP verification error:', error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      console.log('🔄 Resending OTP via API for:', phoneNumber);
      
      const response = await ApiService.sendOTPReal(phoneNumber);
      
      console.log('📤 Resend OTP Response:', response);

      if (response.success && response.data?.status === 'success') {
        Alert.alert('Success', `OTP has been resent to ${phoneNumber}`);
      } else {
        const errorMessage = response.data?.message || response.message || 'Failed to resend OTP';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('🚨 Resend OTP error:', error);
      Alert.alert('Error', 'Failed to resend OTP');
    } finally {
      setIsResending(false);
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
            <Text style={[textStyles.title, { color: '#212121' }]}>Enter OTP verification code</Text>
            <Text style={[textStyles.subtitle, { color: '#424242', fontSize: 16, lineHeight: 24, textAlign: 'center' }]}>
              Verification code has been sent to{'\n'}
              {phoneNumber}
            </Text>
            
            {/* API Notice */}
            <View style={{ 
              backgroundColor: '#E3F2FD', 
              padding: 12, 
              borderRadius: 8, 
              marginBottom: 20,
              borderLeftWidth: 4,
              borderLeftColor: '#2196F3',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}>
              <Text style={{ 
                color: '#1565C0', 
                fontSize: 15, 
                fontWeight: '600',
                textAlign: 'center',
                lineHeight: 22,
              }}>
                Live Mode: Enter OTP received via SMS
              </Text>
            </View>

            {/* OTP Input Boxes */}
            <View style={otpStyles.otpContainer}>
              {otp.map((digit, index) => (
                <OTPInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={({ nativeEvent }) =>
                    handleBackspace(nativeEvent.key, index)
                  }
                  animatedStyle={{
                    transform: [{ scale: otpBoxAnims[index] }],
                  }}
                />
              ))}
            </View>

            {/* Resend Link */}
            <View style={otpStyles.resendContainer}>
              <Text style={[otpStyles.resendText, { color: '#616161' }]}>
                Didn't receive the code?{' '}
              </Text>
              <TouchableOpacity onPress={handleResend} disabled={isResending}>
                <Text style={[otpStyles.resendLink, { color: '#1976D2', fontWeight: '600' }]}>
                  {isResending ? 'Sending...' : 'Resend'}
                </Text>
              </TouchableOpacity>
            </View>

            <Button 
              title="Verify OTP" 
              onPress={handleSubmit} 
              disabled={isVerifying}
              loading={isVerifying}
            />
          </View>

          <Footer visible={!isKeyboardVisible} />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
