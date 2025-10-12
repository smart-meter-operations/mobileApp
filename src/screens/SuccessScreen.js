import React, { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Import components and hooks
import { AppHeader } from '../components';
import { useBounceAnimation, useEntranceAnimation } from '../hooks';
import { layoutStyles, textStyles } from '../styles';
import { COLORS, SCREENS } from '../constants';

export default function SuccessScreen({ navigation }) {
  // Custom hooks
  const { animatedStyle } = useEntranceAnimation();
  const { animatedStyle: bounceStyle } = useBounceAnimation(true);

  useEffect(() => {
    // Auto-redirect to dashboard after 3 seconds
    const timer = setTimeout(() => {
      navigation.navigate(SCREENS.DASHBOARD);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={layoutStyles.container}>
      <StatusBar style="light" />

      <AppHeader />

      <Animated.View style={[layoutStyles.content, animatedStyle]}>
        <View style={[layoutStyles.centerContainer, { paddingHorizontal: 24 }]}>
          {/* Success Checkmark with bounce animation */}
          <Animated.View style={[bounceStyle, { marginBottom: 32 }]}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: COLORS.success,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
                shadowColor: COLORS.success,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 12,
              }}
            >
              <Text style={{ fontSize: 48, color: 'white', fontWeight: 'bold' }}>✓</Text>
            </View>
          </Animated.View>

          <Text
            style={[
              textStyles.title,
              { textAlign: 'center', marginBottom: 16, color: '#212121' },
            ]}
          >
            Success!
          </Text>

          <Text
            style={[
              textStyles.subtitle,
              { textAlign: 'center', marginBottom: 0, color: '#424242', fontSize: 16, lineHeight: 24 },
            ]}
          >
            Your account has been verified successfully.{'\n'}
            Redirecting to dashboard...
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}