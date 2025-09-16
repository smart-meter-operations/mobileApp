import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';

// Firebase configuration - TO BE REPLACED WITH ACTUAL CREDENTIALS
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

class FirebaseService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.recaptchaVerifier = null;
    this.verificationId = null;
  }

  // Initialize Firebase
  initialize() {
    try {
      if (!this.app) {
        this.app = initializeApp(firebaseConfig);
        this.auth = getAuth(this.app);
        console.log('Firebase initialized successfully');
      }
      return true;
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      return false;
    }
  }

  // Setup reCAPTCHA verifier (for web)
  setupRecaptcha(containerId = 'recaptcha-container') {
    try {
      if (!this.recaptchaVerifier) {
        this.recaptchaVerifier = new RecaptchaVerifier(
          containerId,
          {
            size: 'invisible',
            callback: (response) => {
              console.log('reCAPTCHA solved');
            },
            'expired-callback': () => {
              console.log('reCAPTCHA expired');
            }
          },
          this.auth
        );
      }
      return this.recaptchaVerifier;
    } catch (error) {
      console.error('reCAPTCHA setup failed:', error);
      throw error;
    }
  }

  // Send OTP to phone number
  async sendOTP(phoneNumber) {
    try {
      if (!this.auth) {
        throw new Error('Firebase not initialized');
      }

      // Format phone number for Indian numbers
      const formattedPhone = phoneNumber.startsWith('+91') 
        ? phoneNumber 
        : `+91${phoneNumber}`;

      console.log('Sending OTP to:', formattedPhone);

      // For React Native, we don't need reCAPTCHA
      const confirmationResult = await signInWithPhoneNumber(
        this.auth,
        formattedPhone,
        this.recaptchaVerifier // This will be null for React Native
      );

      this.verificationId = confirmationResult.verificationId;
      
      return {
        success: true,
        verificationId: this.verificationId,
        message: 'OTP sent successfully'
      };
    } catch (error) {
      console.error('Send OTP failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to send OTP'
      };
    }
  }

  // Verify OTP
  async verifyOTP(otp, verificationId = null) {
    try {
      if (!this.auth) {
        throw new Error('Firebase not initialized');
      }

      const vId = verificationId || this.verificationId;
      if (!vId) {
        throw new Error('No verification ID found');
      }

      console.log('Verifying OTP:', otp);

      const credential = PhoneAuthProvider.credential(vId, otp);
      const result = await signInWithCredential(this.auth, credential);

      console.log('OTP verified successfully:', result.user.uid);

      return {
        success: true,
        user: result.user,
        message: 'OTP verified successfully'
      };
    } catch (error) {
      console.error('OTP verification failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Invalid OTP or verification failed'
      };
    }
  }

  // Sign out user
  async signOut() {
    try {
      if (this.auth && this.auth.currentUser) {
        await this.auth.signOut();
        this.verificationId = null;
        console.log('User signed out successfully');
      }
      return { success: true };
    } catch (error) {
      console.error('Sign out failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current user
  getCurrentUser() {
    return this.auth?.currentUser || null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.auth?.currentUser !== null;
  }
}

// Export singleton instance
export default new FirebaseService();