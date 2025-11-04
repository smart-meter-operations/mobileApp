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
import { SmsService } from '../services';
import networkService from '../services/networkService';
import {
  useKeyboard,
  useEntranceAnimation,
  useStaggeredAnimation,
} from '../hooks';
import { layoutStyles, textStyles, otpStyles } from '../styles';
import { validateOTP } from '../utils';
import { ANIMATION, SCREENS } from '../constants';

export default function OTPScreen({ route, navigation }) {
  const { phoneNumber, generatedOTP } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
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

    try {
      // Accept only the hardcoded OTP 123456
      if (otpCode === '123456') {
        // After phone unlock validation step, show informational alert if non-Airtel
        try {
          const carrierRaw = await networkService.getPrimarySimCarrier();
          const carrier = (carrierRaw || '').toString().trim().toLowerCase();
          const isAirtel = carrier.includes('airtel');
          if (carrier && !isAirtel) {
            Alert.alert(
              'Validation',
              'Primary Slot Network provider mismatch. Please rectify and try again.',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('PhoneUnlock')
                }
              ],
              { cancelable: false }
            );
            return;
          }
        } catch (e) {
          // If carrier can't be determined, silently proceed
        }
        navigation.navigate('PhoneUnlock');
      } else {
        Alert.alert('Error', 'Invalid OTP. Please use 123456 for demo purposes.');
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      // Always use hardcoded OTP 123456
      await SmsService.resendOTP(phoneNumber);
      Alert.alert('Success', 'OTP has been resent! Use 123456 to proceed.');
    } catch (error) {
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
              Verification number has been sent to{'\n'}
              {phoneNumber}
            </Text>
            
            {/* Demo Notice */}
            <View style={{ 
              backgroundColor: '#FFF3CD', 
              padding: 12, 
              borderRadius: 8, 
              marginBottom: 20,
              borderLeftWidth: 4,
              borderLeftColor: '#FFECB3',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}>
              <Text style={{ 
                color: '#856404', 
                fontSize: 15, 
                fontWeight: '600',
                textAlign: 'center',
                lineHeight: 22,
              }}>
                Demo Mode: Use OTP 123456 to proceed
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

            <Button title="Proceed" onPress={handleSubmit} />
          </View>

          <Footer visible={!isKeyboardVisible} />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}