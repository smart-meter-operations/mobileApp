// Hardcoded OTP service - always returns 1234
import { Platform } from 'react-native';

export class SmsService {
  static async sendOTP(phoneNumber) {
    // Always return hardcoded OTP 1234 for demo purposes
    console.log('Using hardcoded OTP: 1234 for phone number:', phoneNumber);
    return { success: true, otp: '1234' };
  }

  static async resendOTP(phoneNumber) {
    // Always return hardcoded OTP 1234 for demo purposes
    console.log('Resending hardcoded OTP: 1234 for phone number:', phoneNumber);
    return { success: true, otp: '1234' };
  }
}