import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, Alert, KeyboardAvoidingView, Platform, View, Text, TouchableOpacity, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Import components and services
import { AppHeader, Button, Footer, OTPInput } from '../components';
import { SmsService } from '../services';
import { useKeyboard, useEntranceAnimation, useStaggeredAnimation } from '../hooks';
import { layoutStyles, textStyles, otpStyles } from '../styles';
import { validateOTP } from '../utils';
import { ANIMATION, SCREENS } from '../constants';

export default function OTPScreen({ route, navigation }) {
  const { phoneNumber, generatedOTP } = route.params;
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);
  
  // Custom hooks
  const isKeyboardVisible = useKeyboard();
  const { animatedStyle } = useEntranceAnimation();
  const otpBoxAnims = useStaggeredAnimation(4, ANIMATION.stagger.otpBox);

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
      })
    ]).start();

    // Auto-focus next input
    if (text && index < 3) {
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
      // For demo purposes, accept the generated OTP or 1234
      if (otpCode === generatedOTP || otpCode === '1234') {
        navigation.navigate('PhoneUnlock');
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await SmsService.resendOTP(phoneNumber);
      Alert.alert('Success', 'OTP sent successfully!');
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
            <Text style={textStyles.title}>Enter OTP verification code</Text>
            <Text style={textStyles.subtitle}>
              Verification number has been sent to{'\n'}{phoneNumber}
            </Text>
            
            {/* OTP Input Boxes */}
            <View style={otpStyles.otpContainer}>
              {otp.map((digit, index) => (
                <OTPInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleBackspace(nativeEvent.key, index)}
                  animatedStyle={{
                    transform: [{ scale: otpBoxAnims[index] }]
                  }}
                />
              ))}
            </View>
            
            {/* Resend Link */}
            <View style={otpStyles.resendContainer}>
              <Text style={otpStyles.resendText}>Don't receive the code ? </Text>
              <TouchableOpacity onPress={handleResend} disabled={isResending}>
                <Text style={otpStyles.resendLink}>
                  {isResending ? 'Sending...' : 'Resend'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <Button 
              title="Proceed"
              onPress={handleSubmit}
            />
          </View>
          
          <Footer visible={!isKeyboardVisible} />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}