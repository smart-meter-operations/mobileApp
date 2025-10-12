import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen, OTPScreen, PhoneUnlockScreen, SuccessScreen, DashboardScreen, CaptureScreen, UserProfileScreen, MapScreen, ConsumerIndexingFormScreen, ConsumerSelectionScreen, MasterDataScreen, MeterCaptureScreen, MeterInfoScreen } from './src/screens';
import OTPAPIScreen from './src/screens/OTPAPIScreen';
import TasksListScreen from './src/screens/TasksListScreen';
import { SCREENS } from './src/constants';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={SCREENS.LOGIN}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name={SCREENS.LOGIN} component={LoginScreen} />
        <Stack.Screen name={SCREENS.OTP} component={OTPScreen} />
        <Stack.Screen name={SCREENS.OTP_API} component={OTPAPIScreen} />
        <Stack.Screen name="PhoneUnlock" component={PhoneUnlockScreen} />
        <Stack.Screen name={SCREENS.SUCCESS} component={SuccessScreen} />
        <Stack.Screen name={SCREENS.DASHBOARD} component={DashboardScreen} />
        <Stack.Screen name="Capture" component={CaptureScreen} />
        <Stack.Screen name="UserProfileScreen" component={UserProfileScreen} />
        <Stack.Screen name={SCREENS.MAP} component={MapScreen} />
        <Stack.Screen name="ConsumerIndexingForm" component={ConsumerIndexingFormScreen} />
        <Stack.Screen name="ConsumerSelectionScreen" component={ConsumerSelectionScreen} />
        <Stack.Screen name="TasksList" component={TasksListScreen} />
        <Stack.Screen name="MasterData" component={MasterDataScreen} />
        <Stack.Screen name="MeterCapture" component={MeterCaptureScreen} />
        <Stack.Screen name="MeterInfo" component={MeterInfoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}